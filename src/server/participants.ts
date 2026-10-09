'use server';

import { requireRole } from '@/server/auth';
import { db } from '@/db/client';
import { events, registrations, registrationMembers, auditLog } from '@/db/schema';
import { eq, sql, and, or, ilike, inArray, count, desc } from 'drizzle-orm';
import { setRegistrationStatusInternal, promoteWaitlist } from '@/server/registrations';
import { revalidateTag } from 'next/cache';

export async function getParticipants(params: {
  page: number;
  limit: number;
  q?: string;
  eventId?: string;
  statuses?: string[];
}) {
  await requireRole(['organizer', 'admin']);
  
  const { page, limit, q, eventId, statuses } = params;
  const offset = (page - 1) * limit;
  
  const conditions = [];
  if (eventId) {
    conditions.push(eq(registrations.eventId, eventId));
  }
  if (statuses && statuses.length > 0) {
    conditions.push(inArray(registrations.status, statuses as any[]));
  }
  
  if (q && q.length >= 2) {
    const qLower = q.toLowerCase();
    conditions.push(
      or(
        eq(registrations.ticketCode, q),
        ilike(registrations.teamName, `%${q}%`),
        sql`EXISTS (
          SELECT 1 FROM registration_members rm 
          WHERE rm.registration_id = ${registrations.id} 
          AND (rm.full_name ILIKE ${'%' + q + '%'} OR rm.email ILIKE ${'%' + q + '%'} OR rm.phone ILIKE ${'%' + q + '%'})
        )`
      )
    );
  }
  
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  
  const [countRes] = await db.select({ count: sql`count(*)`.mapWith(Number) })
    .from(registrations)
    .where(whereClause);
  const total = countRes?.count || 0;
  
  const regs = await db.query.registrations.findMany({
    where: whereClause,
    orderBy: [desc(registrations.queuedAt), desc(registrations.id)],
    limit,
    offset,
    with: {
      event: { columns: { title: true, festId: true } }
    }
  });

  // Fetch members and audit logs for visible registrations
  const regIds = regs.map(r => r.id);
  const membersMap = new Map<string, any[]>();
  const auditMap = new Map<string, any[]>();
  
  if (regIds.length > 0) {
    const allMembers = await db.query.registrationMembers.findMany({
      where: inArray(registrationMembers.registrationId, regIds),
      orderBy: (m, { desc }) => [desc(m.isLeader)]
    });
    
    for (const m of allMembers) {
      if (!membersMap.has(m.registrationId)) membersMap.set(m.registrationId, []);
      membersMap.get(m.registrationId)!.push(m);
    }
    
    const allLogs = await db.query.auditLog.findMany({
      where: and(eq(auditLog.entityType, 'registration'), inArray(auditLog.entityId, regIds)),
      with: { actor: { columns: { fullName: true } } },
      orderBy: (l, { desc }) => [desc(l.createdAt)]
    });
    
    for (const l of allLogs) {
      if (!auditMap.has(l.entityId)) auditMap.set(l.entityId, []);
      auditMap.get(l.entityId)!.push(l);
    }
  }

  return {
    registrations: regs.map(r => ({
      ...r,
      members: membersMap.get(r.id) || [],
      auditLogs: auditMap.get(r.id) || []
    })),
    total
  };
}

export async function getParticipantFilters(params: { q?: string; eventId?: string; statuses?: string[] }) {
  await requireRole(['organizer', 'admin']);
  
  const festsWithEvents = await db.query.fests.findMany({
    with: { events: { columns: { id: true, title: true } } }
  });
  
  // Status counters (ignoring status filter itself, but applying q and eventId)
  const conditions = [];
  if (params.eventId) {
    conditions.push(eq(registrations.eventId, params.eventId));
  }
  if (params.q && params.q.length >= 2) {
    const q = params.q;
    conditions.push(
      or(
        eq(registrations.ticketCode, q),
        ilike(registrations.teamName, `%${q}%`),
        sql`EXISTS (
          SELECT 1 FROM registration_members rm 
          WHERE rm.registration_id = ${registrations.id} 
          AND (rm.full_name ILIKE ${'%' + q + '%'} OR rm.email ILIKE ${'%' + q + '%'} OR rm.phone ILIKE ${'%' + q + '%'})
        )`
      )
    );
  }
  
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  
  const statusCountsRes = await db.select({ 
    status: registrations.status, 
    count: sql`count(*)`.mapWith(Number) 
  })
  .from(registrations)
  .where(whereClause)
  .groupBy(registrations.status);
  
  const statusCounts = Object.fromEntries(statusCountsRes.map(r => [r.status, r.count]));
  
  return { fests: festsWithEvents, statusCounts };
}

export async function adminUpdateRegistrationStatus(registrationId: string, newStatus: typeof registrations.$inferSelect.status) {
  const session = await requireRole(['organizer', 'admin']);
  
  return await db.transaction(async (tx) => {
    await tx.execute(sql`SET LOCAL lock_timeout = '5s'`);
    
    // 1. Lock event
    const regQuery = await tx.execute(sql`
      SELECT r.event_id FROM registrations r WHERE r.id = ${registrationId}
    `);
    const eventId = regQuery.rows[0]?.event_id as string;
    if (!eventId) return { ok: false, code: 'NOT_FOUND', message: 'Registration not found' };

    const [lockedEvent] = await tx.select().from(events).where(eq(events.id, eventId)).for('update');
    if (!lockedEvent) return { ok: false, code: 'NOT_FOUND', message: 'Event not found' };
    
    // 2. Lock registration
    const [lockedReg] = await tx.select().from(registrations).where(eq(registrations.id, registrationId)).for('update');
    if (!lockedReg) return { ok: false, code: 'NOT_FOUND', message: 'Registration not found' };

    const oldStatus = lockedReg.status;
    if (oldStatus === newStatus) return { ok: true };

    // 3. Lock members
    await tx.select().from(registrationMembers).where(eq(registrationMembers.registrationId, registrationId)).for('update');

    const freesSeat = (oldStatus === 'confirmed' || oldStatus === 'checked_in') && (newStatus !== 'confirmed' && newStatus !== 'checked_in');

    if (newStatus === 'confirmed') {
      if (oldStatus === 'checked_in') {
        await tx.update(registrations).set({ status: 'confirmed', checkedInAt: null, updatedAt: sql`now()` }).where(eq(registrations.id, registrationId));
      } else if (oldStatus === 'waitlisted') {
        if (lockedEvent.confirmedCount >= lockedEvent.capacity) return { ok: false, code: 'INVALID_TRANSITION', message: 'No free seat' };
        await tx.update(registrations).set({ status: 'confirmed', updatedAt: sql`now()` }).where(eq(registrations.id, registrationId));
        await tx.update(events).set({ confirmedCount: sql`${events.confirmedCount} + 1` }).where(eq(events.id, eventId));
      } else {
        return { ok: false, code: 'INVALID_TRANSITION', message: 'Invalid transition to confirmed' };
      }
    } 
    else if (newStatus === 'checked_in') {
      if (oldStatus !== 'confirmed') return { ok: false, code: 'INVALID_TRANSITION', message: 'Only confirmed can be checked in' };
      await tx.update(registrations).set({ status: 'checked_in', checkedInAt: sql`now()`, updatedAt: sql`now()` }).where(eq(registrations.id, registrationId));
    }
    else if (newStatus === 'waitlisted') {
      // Re-queue
      const queuedAt = sql`greatest(now(), (SELECT max(queued_at) + interval '1 microsecond' FROM registrations WHERE event_id = ${eventId} AND status = 'waitlisted'))`;
      await tx.update(registrations).set({ status: 'waitlisted', queuedAt, updatedAt: sql`now()` }).where(eq(registrations.id, registrationId));
      if (oldStatus === 'cancelled') {
        await tx.update(registrationMembers).set({ isActive: true }).where(eq(registrationMembers.registrationId, registrationId));
      }
    }
    else if (newStatus === 'rejected') {
      await tx.update(registrations).set({ status: 'rejected', updatedAt: sql`now()` }).where(eq(registrations.id, registrationId));
    }
    else if (newStatus === 'cancelled') {
      await tx.update(registrations).set({ status: 'cancelled', cancelledAt: sql`now()`, updatedAt: sql`now()` }).where(eq(registrations.id, registrationId));
      await tx.update(registrationMembers).set({ isActive: false }).where(eq(registrationMembers.registrationId, registrationId));
    }

    if (freesSeat) {
      await tx.update(events).set({ confirmedCount: sql`${events.confirmedCount} - 1` }).where(eq(events.id, eventId));
      await promoteWaitlist(tx, eventId);
    }

    // Audit log
    await tx.insert(auditLog).values({
      actorId: session.sub,
      action: 'update_status',
      entityType: 'registration',
      entityId: registrationId,
      meta: { oldStatus, newStatus }
    });

    return { ok: true };
  });
}

export async function adminBulkUpdateRegistrationStatus(registrationIds: string[], newStatus: typeof registrations.$inferSelect.status) {
  if (registrationIds.length > 25) throw new Error("Maximum 25 items allowed for bulk actions");
  
  const succeeded: string[] = [];
  const failed: { id: string, reason: string }[] = [];
  
  for (const id of registrationIds) {
    try {
      const result = await adminUpdateRegistrationStatus(id, newStatus);
      if (result.ok) {
        succeeded.push(id);
      } else {
        failed.push({ id, reason: result.message! });
      }
    } catch (e: any) {
      failed.push({ id, reason: e.message || 'Unknown error' });
    }
  }
  
  // Revalidate tags (we should probably collect event IDs and revalidate those, but broadly revalidating is fine for now)
  // Let's revalidate everything related to events to be safe
  // @ts-ignore
  revalidateTag('events');
  // @ts-ignore
  revalidateTag('registrations');
  
  return { succeeded, failed };
}
