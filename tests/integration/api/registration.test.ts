import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('node:crypto', async importOriginal => {
  const original = await importOriginal<typeof import('node:crypto')>();
  return { ...original, randomInt: vi.fn(original.randomInt) };
});
import { randomInt, randomUUID } from 'node:crypto';
import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { withTransaction } from '@/db/tx';
import { events, fests, organizations, registrationMembers, registrations, users } from '@/db/schema';
import { getWaitlistPosition, registerForEvent } from '@/server/registrations';

const prefix = `reg-test-${randomUUID()}`;
let orgId: string;
let festId: string;
const userIds: string[] = [];
const eventIds: string[] = [];
async function account(role: typeof users.$inferSelect.role = 'participant') {
  const [user] = await db.insert(users).values({ email: `${randomUUID()}@example.com`, fullName: 'Test User', passwordHash: 'test-only', role }).returning();
  userIds.push(user!.id);
  return user!;
}
async function event(overrides: Partial<typeof events.$inferInsert> = {}) {
  const [row] = await db.insert(events).values({
    festId, slug: `${prefix}-${randomUUID()}`, title: 'Registration test', shortDescription: 'Test', description: 'Test',
    category: 'programming', startsAt: new Date(Date.now() + 86400000), endsAt: new Date(Date.now() + 172800000),
    venue: 'Test venue', capacity: 50, registrationDeadline: new Date(Date.now() + 3600000), status: 'published', ...overrides,
  }).returning();
  eventIds.push(row!.id);
  return row!;
}
function input(user: typeof users.$inferSelect) {
  return { idempotencyKey: randomUUID(), members: [{ fullName: user.fullName, email: user.email, phone: '01711223344', institution: 'DRMC', classLevel: '10' }] };
}
async function signup(eventId: string, existingUser?: typeof users.$inferSelect) {
  const user = existingUser ?? await account();
  return registerForEvent({ userId: user.id, eventId, input: input(user), requestId: randomUUID() });
}

beforeAll(async () => {
  const [org] = await db.insert(organizations).values({ name: 'Registration tests', slug: prefix }).returning();
  orgId = org!.id;
  const [fest] = await db.insert(fests).values({
    organizationId: orgId, slug: prefix, title: 'Test fest', tagline: 'Test', description: 'Test',
    startsAt: new Date(Date.now() + 86400000), endsAt: new Date(Date.now() + 172800000), venue: 'Test', status: 'published',
  }).returning();
  festId = fest!.id;
});
afterAll(async () => {
  // Delete only this suite's fixtures, never truncate the user's database.
  if (eventIds.length) {
    await db.delete(registrationMembers).where(inArray(registrationMembers.eventId, eventIds));
    await db.delete(registrations).where(inArray(registrations.eventId, eventIds));
    await db.delete(events).where(inArray(events.id, eventIds));
  }
  if (festId) await db.delete(fests).where(eq(fests.id, festId));
  if (orgId) await db.delete(organizations).where(eq(organizations.id, orgId));
  if (userIds.length) await db.delete(users).where(inArray(users.id, userIds));
});

describe('Registration transactions', () => {
  it.each(['organizer', 'admin'] as const)('rejects %s leaders and team members without allocating seats', async role => {
    const e = await event({ participationType: 'team', teamMinSize: 2, teamMaxSize: 3 });
    const staff = await account(role);
    expect(await signup(e.id, staff)).toMatchObject({ ok: false, code: 'FORBIDDEN', reason: 'PARTICIPANT_ONLY' });
    const leader = await account();
    const payload = input(leader);
    expect(await registerForEvent({ userId: leader.id, eventId: e.id, input: {
      ...payload, teamName: 'Test Team', members: [...payload.members, { ...payload.members[0], email: staff.email.toUpperCase() }],
    } })).toMatchObject({ ok: false, code: 'FORBIDDEN', reason: 'STAFF_MEMBER', memberIndex: 1 });
    expect((await db.query.events.findFirst({ where: eq(events.id, e.id) }))?.confirmedCount).toBe(0);
    expect(await db.select().from(registrations).where(eq(registrations.eventId, e.id))).toHaveLength(0);
    expect(await db.select().from(registrationMembers).where(eq(registrationMembers.eventId, e.id))).toHaveLength(0);
  });
  it('registers a solo participant and a team of three as one seat each', async () => {
    const solo = await event();
    expect(await signup(solo.id)).toMatchObject({ ok: true, registration: { status: 'confirmed', replayed: false } });
    const team = await event({ participationType: 'team', teamMinSize: 3, teamMaxSize: 4 });
    const leader = await account();
    const payload = input(leader);
    const result = await registerForEvent({ userId: leader.id, eventId: team.id, input: {
      ...payload, teamName: 'Test Team', members: [payload.members[0], ...[1, 2].map(i => ({ ...payload.members[0], email: `member-${i}-${randomUUID()}@example.com`, phone: undefined }))],
    } });
    expect(result).toMatchObject({ ok: true, registration: { status: 'confirmed' } });
    const saved = await db.query.events.findFirst({ where: eq(events.id, team.id) });
    expect(saved?.confirmedCount).toBe(1);
    const members = await db.select().from(registrationMembers).where(eq(registrationMembers.eventId, team.id));
    expect(members).toHaveLength(3);
    expect(members.filter(m => m.isLeader)).toHaveLength(1);
    expect(members.find(m => m.isLeader)?.email).toBe(leader.email);
  });
  it('enforces opening time, deadline and publication status', async () => {
    for (const [overrides, code] of [
      [{ registrationOpensAt: new Date(Date.now() + 1800000) }, 'REGISTRATION_NOT_OPEN'],
      [{ registrationDeadline: new Date(Date.now() - 1000) }, 'DEADLINE_PASSED'],
      [{ status: 'draft' }, 'EVENT_NOT_FOUND'],
      [{ status: 'cancelled' }, 'EVENT_NOT_FOUND'],
    ] as const) expect(await signup((await event(overrides)).id)).toMatchObject({ ok: false, code });
  });
  it('replays concurrent identical requests without allocating extra seats', async () => {
    const e = await event();
    const user = await account();
    const args = { userId: user.id, eventId: e.id, input: input(user) };
    const results = await Promise.all([registerForEvent(args), registerForEvent(args)]);
    expect(results.every(r => r.ok)).toBe(true);
    if (!results[0]?.ok || !results[1]?.ok) throw new Error('Expected success');
    expect(results[0].registration.ticketCode).toBe(results[1].registration.ticketCode);
    expect(results.filter(r => r.ok && r.registration.replayed)).toHaveLength(1);
    expect(await signup(e.id, user)).toMatchObject({ ok: false, code: 'ALREADY_REGISTERED' });
    expect((await db.query.events.findFirst({ where: eq(events.id, e.id) }))?.confirmedCount).toBe(1);
  });
  it('rolls back the seat and registration if any member conflicts', async () => {
    const e = await event({ participationType: 'team', teamMinSize: 2, teamMaxSize: 2 });
    const shared = `shared-${randomUUID()}@example.com`;
    async function attempt() {
      const user = await account();
      const payload = input(user);
      return registerForEvent({ userId: user.id, eventId: e.id, input: { ...payload, teamName: 'Team',
        members: [...payload.members, { ...payload.members[0], email: shared, phone: '' }] } });
    }
    expect(await attempt()).toMatchObject({ ok: true });
    expect(await attempt()).toMatchObject({ ok: false, code: 'MEMBER_ALREADY_REGISTERED', memberIndex: 1 });
    expect((await db.query.events.findFirst({ where: eq(events.id, e.id) }))?.confirmedCount).toBe(1);
    expect(await db.select().from(registrations).where(eq(registrations.eventId, e.id))).toHaveLength(1);
    expect(await db.select().from(registrationMembers).where(eq(registrationMembers.eventId, e.id))).toHaveLength(2);
  });
  it('reuses a cancelled registration at the back of the waitlist', async () => {
    const e = await event({ capacity: 1 });
    await signup(e.id);
    const user = await account();
    const first = await signup(e.id, user);
    const second = await signup(e.id);
    if (!first.ok || !second.ok) throw new Error('Expected waitlisted registrations');
    await withTransaction(async tx => {
      await tx.select().from(events).where(eq(events.id, e.id)).for('update');
      await tx.update(registrations).set({ status: 'cancelled', cancelledAt: new Date() }).where(eq(registrations.id, first.registration.id));
      await tx.update(registrationMembers).set({ isActive: false }).where(eq(registrationMembers.registrationId, first.registration.id));
    });
    const again = await signup(e.id, user);
    expect(again).toMatchObject({ ok: true, registration: { id: first.registration.id, status: 'waitlisted', waitlistPosition: 2, replayed: false } });
    expect(await getWaitlistPosition(second.registration.id)).toBe(1);
  });
  it('retries ticket collisions without aborting the transaction', async () => {
    const e = await event();
    for (let i = 0; i < 8; i++) vi.mocked(randomInt).mockReturnValueOnce(0 as never);
    expect(await signup(e.id)).toMatchObject({ ok: true, registration: { ticketCode: '22222222' } });
    for (let i = 0; i < 8; i++) vi.mocked(randomInt).mockReturnValueOnce(0 as never);
    expect(await signup(e.id)).toMatchObject({ ok: true, registration: { status: 'confirmed' } });
    expect((await db.query.events.findFirst({ where: eq(events.id, e.id) }))?.confirmedCount).toBe(2);
  });
  it('does not oversell when waitlisting is disabled', async () => {
    const e = await event({ capacity: 1, waitlistEnabled: false });
    expect(await signup(e.id)).toMatchObject({ ok: true });
    expect(await signup(e.id)).toMatchObject({ ok: false, code: 'EVENT_FULL' });
  });
  it('serializes 200 registrations into 50 seats and 150 unique FIFO positions', async () => {
    const e = await event({ capacity: 50 });
    const accounts = await db.insert(users).values(Array.from({ length: 200 }, (_, i) => ({
      fullName: `Load User ${i}`, email: `${prefix}-${i}@example.com`, passwordHash: 'test-only',
    }))).returning();
    userIds.push(...accounts.map(user => user.id));
    const results = await Promise.all(accounts.map(user => signup(e.id, user)));
    expect(results.filter(result => result.ok)).toHaveLength(200);
    const successful = results.filter(result => result.ok);
    expect(successful.filter(result => result.registration.status === 'confirmed')).toHaveLength(50);
    const waitlisted = successful.filter(result => result.registration.status === 'waitlisted');
    expect(waitlisted).toHaveLength(150);
    expect(waitlisted.map(result => result.registration.waitlistPosition).sort((a, b) => a! - b!)).toEqual(Array.from({ length: 150 }, (_, i) => i + 1));
    expect((await db.query.events.findFirst({ where: eq(events.id, e.id) }))?.confirmedCount).toBe(50);
    const queue = await db.select().from(registrations).where(and(eq(registrations.eventId, e.id), eq(registrations.status, 'waitlisted'))).orderBy(asc(registrations.queuedAt), asc(registrations.id));
    expect(await Promise.all(queue.map(row => getWaitlistPosition(row.id)))).toEqual(Array.from({ length: 150 }, (_, i) => i + 1));
    const counts = await db.execute<{ seats: number }>(sql`SELECT count(*)::int AS seats FROM registrations WHERE event_id = ${e.id} AND status IN ('confirmed', 'checked_in')`);
    expect(counts.rows[0]?.seats).toBe(50);
  }, 120000);
});
