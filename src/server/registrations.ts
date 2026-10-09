import 'server-only';
import { randomInt } from 'node:crypto';
import { and, eq, inArray, ne, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db/client';
import { withTransaction } from '@/db/tx';
import { postgresError } from '@/db/errors';
import { events, registrations, registrationMembers, users } from '@/db/schema';
import { validateRegistrationPayload } from '@/lib/validation/registration';

type ErrorCode = 'FORBIDDEN' | 'VALIDATION_ERROR' | 'EVENT_NOT_FOUND' | 'REGISTRATION_NOT_OPEN' | 'DEADLINE_PASSED' | 'ALREADY_REGISTERED' | 'MEMBER_ALREADY_REGISTERED' | 'EVENT_FULL';
export type Result<T> = ({ ok: true } & T) | { ok: false; code: ErrorCode; message: string; memberIndex?: number; field?: string; reason?: 'PARTICIPANT_ONLY' | 'STAFF_MEMBER' };
export type RegistrationResult = Result<{ registration: {
  id: string; status: typeof registrations.$inferSelect.status; ticketCode: string;
  waitlistPosition: number | null; replayed: boolean;
} }>;
class MemberConflict extends Error {
  constructor(readonly memberIndex: number) { super('Member is already registered for this event'); }
}

// Compare in PostgreSQL to preserve timestamp microseconds; UUID breaks ties.
export async function getWaitlistPosition(registrationId: string): Promise<number | null> {
  const result = await db.execute<{ position: number }>(sql`
    SELECT (SELECT count(*)::int FROM registrations r
      WHERE r.event_id = target.event_id AND r.status = 'waitlisted'
        AND (r.queued_at, r.id) <= (target.queued_at, target.id)) AS position
    FROM registrations target WHERE target.id = ${registrationId} AND target.status = 'waitlisted'
  `);
  return result.rows[0]?.position ?? null;
}

export async function registerForEvent({ userId, eventId, input }: {
  userId: string; eventId: string; input: unknown; requestId?: string;
}): Promise<RegistrationResult> {
  if (!z.string().uuid().safeParse(eventId).success) return { ok: false, code: 'EVENT_NOT_FOUND', message: 'Event not found' };
  const event = await db.query.events.findFirst({ where: eq(events.id, eventId) });
  if (!event || event.status !== 'published') return { ok: false, code: 'EVENT_NOT_FOUND', message: 'Event not found' };
  const user = await db.query.users.findFirst({ where: eq(users.id, userId), columns: { email: true, role: true } });
  if (!user) return { ok: false, code: 'VALIDATION_ERROR', message: 'Account not found' };
  if (user.role !== 'participant') return { ok: false, code: 'FORBIDDEN', reason: 'PARTICIPANT_ONLY', message: 'Only participant accounts can register for events' };
  const parsed = validateRegistrationPayload(input, event, user.email);
  if (!parsed.ok) return parsed;
  // Teammates may not have accounts, but known staff accounts cannot enter via a team.
  const staffMembers = await db.select({ email: users.email }).from(users).where(and(
    inArray(users.email, parsed.data.members.map(member => member.email)), ne(users.role, 'participant'),
  ));
  const staffEmails = new Set(staffMembers.map(member => member.email));
  const staffIndex = parsed.data.members.findIndex(member => staffEmails.has(member.email));
  if (staffIndex !== -1) return { ok: false, code: 'FORBIDDEN', reason: 'STAFF_MEMBER', message: 'Organizer and admin accounts cannot join event teams', memberIndex: staffIndex, field: `members.${staffIndex}.email` };
  try {
    const result = await withTransaction<RegistrationResult>(async (tx) => {
      await tx.execute(sql`SET LOCAL lock_timeout = '5s'`);
      await tx.execute(sql`SET LOCAL statement_timeout = '10s'`);
      const [locked] = await tx.select({ event: events, dbNow: sql<Date>`now()` })
        .from(events).where(eq(events.id, eventId)).for('update');
      if (!locked || locked.event.status !== 'published') return { ok: false, code: 'EVENT_NOT_FOUND', message: 'Event not found' };
      const current = locked.event;
      const dbNow = new Date(locked.dbNow);
      if (current.registrationOpensAt && dbNow < current.registrationOpensAt) {
        return { ok: false, code: 'REGISTRATION_NOT_OPEN', message: 'Registration has not opened yet' };
      }
      if (dbNow >= current.registrationDeadline || dbNow >= current.startsAt) {
        return { ok: false, code: 'DEADLINE_PASSED', message: 'Registration deadline has passed' };
      }
      // Settings may change between preflight validation and acquiring the lock.
      const validated = validateRegistrationPayload(input, current, user.email);
      if (!validated.ok) return validated;
      const data = validated.data;
      const [existing] = await tx.select().from(registrations)
        .where(and(eq(registrations.eventId, eventId), eq(registrations.userId, userId))).for('update');
      if (existing && existing.status !== 'cancelled') {
        if (existing.status !== 'rejected' && existing.idempotencyKey === data.idempotencyKey) {
          return { ok: true, registration: { id: existing.id, status: existing.status, ticketCode: existing.ticketCode, waitlistPosition: null, replayed: true } };
        }
        return { ok: false, code: 'ALREADY_REGISTERED', message: 'A registration already exists for this account' };
      }
      const status = current.confirmedCount < current.capacity ? 'confirmed' : current.waitlistEnabled ? 'waitlisted' : null;
      if (!status) return { ok: false, code: 'EVENT_FULL', message: 'Event is full' };
      if (status === 'confirmed') {
        await tx.update(events).set({ confirmedCount: sql`${events.confirmedCount} + 1` }).where(eq(events.id, eventId));
      }
      // now() is transaction start time; keep FIFO even when lock acquisition order differs.
      const queuedAt = sql`greatest(now(), (SELECT max(queued_at) + interval '1 microsecond' FROM registrations WHERE event_id = ${eventId} AND status = 'waitlisted'))`;
      const values = { status: status as 'confirmed' | 'waitlisted', teamName: data.teamName ?? null, notes: data.notes || null,
        idempotencyKey: data.idempotencyKey, queuedAt, cancelledAt: null, checkedInAt: null, updatedAt: sql`now()` };
      let saved: typeof registrations.$inferSelect | undefined;
      if (existing) {
        [saved] = await tx.update(registrations).set(values).where(eq(registrations.id, existing.id)).returning();
      } else {
        const alphabet = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
        // A targeted conflict clause leaves the transaction usable after a ticket collision.
        for (let attempt = 0; attempt < 5 && !saved; attempt++) {
          const ticketCode = Array.from({ length: 8 }, () => alphabet[randomInt(alphabet.length)]).join('');
          [saved] = await tx.insert(registrations).values({ ...values, eventId, userId, ticketCode })
            .onConflictDoNothing({ target: registrations.ticketCode }).returning();
        }
        if (!saved) throw new Error('Unable to allocate a unique ticket code');
      }
      if (!saved) throw new Error('Registration write failed');
      if (existing) await tx.delete(registrationMembers).where(eq(registrationMembers.registrationId, saved.id));
      for (const [index, member] of data.members.entries()) {
        try {
          await tx.insert(registrationMembers).values({ ...member, registrationId: saved.id, eventId, isLeader: index === 0, isActive: true });
        } catch (error) {
          const pg = postgresError(error);
          if (pg.code === '23505' && pg.constraint === 'rm_event_email_active_unq') throw new MemberConflict(index);
          throw error;
        }
      }
      return { ok: true, registration: { id: saved.id, status: saved.status, ticketCode: saved.ticketCode, waitlistPosition: null, replayed: false } };
    });
    if (result.ok && result.registration.status === 'waitlisted') {
      result.registration.waitlistPosition = await getWaitlistPosition(result.registration.id);
    }
    return result;
  } catch (error) {
    if (error instanceof MemberConflict) return { ok: false, code: 'MEMBER_ALREADY_REGISTERED', message: error.message, memberIndex: error.memberIndex };
    throw error;
  }
}

export async function setRegistrationStatusInternal(
  tx: any,
  registration: { id: string },
  newStatus: 'cancelled' | 'confirmed'
) {
  const values: any = { status: newStatus, updatedAt: sql`now()` };
  if (newStatus === 'cancelled') {
    values.cancelledAt = sql`now()`;
  }
  await tx.update(registrations).set(values).where(eq(registrations.id, registration.id));

  if (newStatus === 'cancelled') {
    await tx.update(registrationMembers).set({ isActive: false }).where(eq(registrationMembers.registrationId, registration.id));
  }
}

export async function promoteWaitlist(tx: any, eventId: string) {
  const [oldestWaitlisted] = await tx.select().from(registrations)
    .where(and(eq(registrations.eventId, eventId), eq(registrations.status, 'waitlisted')))
    .orderBy(registrations.queuedAt, registrations.id)
    .limit(1)
    .for('update');

  if (oldestWaitlisted) {
    await setRegistrationStatusInternal(tx, oldestWaitlisted, 'confirmed');
    await tx.update(events).set({ confirmedCount: sql`${events.confirmedCount} + 1` }).where(eq(events.id, eventId));
  }
}

export async function cancelRegistration({ userId, registrationId }: { userId: string, registrationId: string }) {
  const reg = await db.query.registrations.findFirst({ where: eq(registrations.id, registrationId) });
  if (!reg || reg.userId !== userId) return { ok: false, code: 'NOT_FOUND', message: 'Registration not found' };

  return await withTransaction(async (tx) => {
    await tx.execute(sql`SET LOCAL lock_timeout = '5s'`);
    await tx.execute(sql`SET LOCAL statement_timeout = '10s'`);

    const [lockedEvent] = await tx.select({ startsAt: events.startsAt }).from(events).where(eq(events.id, reg.eventId)).for('update');
    if (!lockedEvent) return { ok: false, code: 'NOT_FOUND', message: 'Event not found' };

    const [lockedReg] = await tx.select().from(registrations).where(eq(registrations.id, registrationId)).for('update');
    if (!lockedReg) return { ok: false, code: 'NOT_FOUND', message: 'Registration not found' };
    
    if (lockedReg.status !== 'confirmed' && lockedReg.status !== 'waitlisted') {
      return { ok: false, code: 'INVALID_TRANSITION', message: 'Only confirmed or waitlisted registrations can be cancelled' };
    }

    const dbNowRows = await tx.execute(sql`SELECT now() as db_now`);
    const dbNow = new Date((dbNowRows.rows[0] as any).db_now);
    if (dbNow >= lockedEvent.startsAt) {
      return { ok: false, code: 'INVALID_TRANSITION', message: 'Cannot cancel after event starts' };
    }

    await setRegistrationStatusInternal(tx, lockedReg, 'cancelled');

    if (lockedReg.status === 'confirmed') {
      await tx.update(events).set({ confirmedCount: sql`${events.confirmedCount} - 1` }).where(eq(events.id, reg.eventId));
      await promoteWaitlist(tx, reg.eventId);
    }

    return { ok: true };
  });
}

export async function editRegistration({ userId, registrationId, input }: { userId: string, registrationId: string, input: unknown }) {
  const reg = await db.query.registrations.findFirst({
    where: eq(registrations.id, registrationId),
    with: { event: true, user: { columns: { email: true } } }
  });
  if (!reg || reg.userId !== userId) return { ok: false, code: 'NOT_FOUND', message: 'Registration not found' };

  const parsed = validateRegistrationPayload(input, reg.event, reg.user.email);
  if (!parsed.ok) return parsed;

  const staffMembers = await db.select({ email: users.email }).from(users).where(and(
    inArray(users.email, parsed.data.members.map(m => m.email)), ne(users.role, 'participant'),
  ));
  const staffEmails = new Set(staffMembers.map(m => m.email));
  const staffIndex = parsed.data.members.findIndex(m => staffEmails.has(m.email));
  if (staffIndex !== -1) return { ok: false, code: 'FORBIDDEN', reason: 'STAFF_MEMBER', message: 'Organizer and admin accounts cannot join event teams', memberIndex: staffIndex, field: `members.${staffIndex}.email` };

  try {
    return await withTransaction(async (tx) => {
      await tx.execute(sql`SET LOCAL lock_timeout = '5s'`);
      await tx.execute(sql`SET LOCAL statement_timeout = '10s'`);

      await tx.select().from(events).where(eq(events.id, reg.eventId)).for('update');
      const [lockedReg] = await tx.select().from(registrations).where(eq(registrations.id, registrationId)).for('update');
      if (!lockedReg) return { ok: false, code: 'NOT_FOUND', message: 'Registration not found' };

      if (['cancelled', 'rejected'].includes(lockedReg.status)) return { ok: false, code: 'INVALID_TRANSITION', message: 'Cannot edit cancelled or rejected registration' };

      await tx.update(registrations).set({ teamName: parsed.data.teamName ?? null, notes: parsed.data.notes || null, updatedAt: sql`now()` }).where(eq(registrations.id, registrationId));

      const leader = parsed.data.members[0];
      if (leader) {
        await tx.update(registrationMembers).set({
          fullName: leader.fullName, phone: leader.phone, institution: leader.institution,
          classLevel: leader.classLevel, studentId: leader.studentId
        }).where(and(eq(registrationMembers.registrationId, registrationId), eq(registrationMembers.isLeader, true)));
      }

      await tx.delete(registrationMembers).where(and(eq(registrationMembers.registrationId, registrationId), eq(registrationMembers.isLeader, false)));

      for (let i = 1; i < parsed.data.members.length; i++) {
        const member = parsed.data.members[i];
        if (!member) continue;
        try {
          await tx.insert(registrationMembers).values({ ...member, email: member.email!, registrationId, eventId: reg.eventId, isLeader: false, isActive: true });
        } catch (error) {
          const pg = postgresError(error);
          if (pg.code === '23505' && pg.constraint === 'rm_event_email_active_unq') throw new MemberConflict(i);
          throw error;
        }
      }

      return { ok: true };
    });
  } catch (error) {
    if (error instanceof MemberConflict) return { ok: false, code: 'MEMBER_ALREADY_REGISTERED', message: error.message, memberIndex: error.memberIndex };
    throw error;
  }
}
