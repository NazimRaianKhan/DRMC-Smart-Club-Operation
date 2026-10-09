import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('next/cache', () => ({ revalidateTag: vi.fn() }));
import { db } from '@/db/client';
import { events, fests, organizations, registrations, users } from '@/db/schema';
import { createEvent, updateEvent, cancelEvent } from '@/server/admin';
import { eq, sql } from 'drizzle-orm';
import * as auth from '@/server/auth';
import { registerForEvent } from '@/server/registrations';
import { randomUUID } from 'node:crypto';

describe('Admin Business Rules', () => {
  let adminUser: any;
  let testFest: any;
  let testEvent: any;

  beforeAll(async () => {
    adminUser = await db.insert(users).values({ email: `admin-${randomUUID()}@test.com`, passwordHash: 'hash', fullName: 'Admin', role: 'admin' }).returning().then(r => r[0]);
    const org = await db.insert(organizations).values({ name: 'Org', slug: `org-${randomUUID()}` }).returning().then(r => r[0]!);
    testFest = await db.insert(fests).values({
      organizationId: org.id, title: 'Fest', slug: `fest-${randomUUID()}`, tagline: 'Tag', description: 'Desc', startsAt: new Date(), endsAt: new Date(Date.now() + 100000), venue: 'Venue'
    }).returning().then(r => r[0]);

    // Spy on auth to return admin
    vi.spyOn(auth, 'requireRole').mockResolvedValue({ sub: adminUser.id, role: 'admin', name: adminUser.fullName });

    // Create a base event for testing
    const eventRes = await createEvent({
      festId: testFest.id,
      title: 'Admin Test Event',
      slug: `admin-test-event-${randomUUID()}`,
      shortDescription: 'Short',
      description: 'Long description',
      category: 'programming',
      startsAt: '2026-12-01T10:00',
      endsAt: '2026-12-01T12:00',
      venue: 'Main Hall',
      capacity: 2,
      participationType: 'individual',
      teamMinSize: 1,
      teamMaxSize: 1,
      registrationOpensAt: '2026-10-01T10:00',
      registrationDeadline: '2026-11-30T10:00',
      waitlistEnabled: true,
      status: 'published',
      faqs: [],
    });
    
    testEvent = await db.query.events.findFirst({ where: eq(events.id, eventRes.id) });
  });

  afterAll(async () => {
    vi.restoreAllMocks();
  });

  it('capacity increase promotes exactly the right number from waitlist', async () => {
    // Register 3 users (capacity is 2, so 2 confirmed, 1 waitlisted)
    const user2 = await db.insert(users).values({ email: `u2-${randomUUID()}@test.com`, passwordHash: 'hash', fullName: 'U2', role: 'participant' }).returning().then(r => r[0]!);
    const user3 = await db.insert(users).values({ email: `u3-${randomUUID()}@test.com`, passwordHash: 'hash', fullName: 'U3', role: 'participant' }).returning().then(r => r[0]!);
    const user4 = await db.insert(users).values({ email: `u4-${randomUUID()}@test.com`, passwordHash: 'hash', fullName: 'U4', role: 'participant' }).returning().then(r => r[0]!);
    const user5 = await db.insert(users).values({ email: `u5-${randomUUID()}@test.com`, passwordHash: 'hash', fullName: 'U5', role: 'participant' }).returning().then(r => r[0]!);

    const res2 = await registerForEvent({ userId: user2.id, eventId: testEvent.id, requestId: randomUUID(), input: { idempotencyKey: randomUUID(), members: [{ fullName: 'U2', email: user2.email, phone: '01711223344', institution: 'Inst', classLevel: '10' }] } });
    if (!res2.ok) console.log(res2);
    await registerForEvent({ userId: user3.id, eventId: testEvent.id, requestId: randomUUID(), input: { idempotencyKey: randomUUID(), members: [{ fullName: 'U3', email: user3.email, phone: '01711223344', institution: 'Inst', classLevel: '10' }] } });
    await registerForEvent({ userId: user4.id, eventId: testEvent.id, requestId: randomUUID(), input: { idempotencyKey: randomUUID(), members: [{ fullName: 'U4', email: user4.email, phone: '01711223344', institution: 'Inst', classLevel: '10' }] } });
    await registerForEvent({ userId: user5.id, eventId: testEvent.id, requestId: randomUUID(), input: { idempotencyKey: randomUUID(), members: [{ fullName: 'U5', email: user5.email, phone: '01711223344', institution: 'Inst', classLevel: '10' }] } });

    // Confirmed count should be 2
    let updatedEvt = await db.query.events.findFirst({ where: eq(events.id, testEvent.id) });
    expect(updatedEvt?.confirmedCount).toBe(2);

    // 2 are waitlisted
    let waitlistedRegs = await db.query.registrations.findMany({ where: eq(registrations.status, 'waitlisted') });
    expect(waitlistedRegs.length).toBe(2);

    // Increase capacity to 3
    const data = {
      ...testEvent,
      startsAt: '2026-12-01T10:00',
      endsAt: '2026-12-01T12:00',
      registrationDeadline: '2026-11-30T10:00',
      registrationOpensAt: '2026-10-01T10:00',
      capacity: 3
    };
    await updateEvent(testEvent.id, data as any);

    // Now confirmed count should be 3
    updatedEvt = await db.query.events.findFirst({ where: eq(events.id, testEvent.id) });
    expect(updatedEvt?.confirmedCount).toBe(3);

    // 1 is waitlisted
    waitlistedRegs = await db.query.registrations.findMany({ where: eq(registrations.status, 'waitlisted') });
    expect(waitlistedRegs.length).toBe(1);
  });

  it('decrease below confirmed rejected', async () => {
    const data = {
      ...testEvent,
      startsAt: '2026-12-01T10:00',
      endsAt: '2026-12-01T12:00',
      registrationDeadline: '2026-11-30T10:00',
      registrationOpensAt: '2026-10-01T10:00',
      capacity: 1 // less than 3
    };
    
    await expect(updateEvent(testEvent.id, data as any)).rejects.toThrow("Capacity cannot be lower than current confirmed registrations");
  });

  it('participation lock', async () => {
    const data = {
      ...testEvent,
      startsAt: '2026-12-01T10:00',
      endsAt: '2026-12-01T12:00',
      registrationDeadline: '2026-11-30T10:00',
      registrationOpensAt: '2026-10-01T10:00',
      capacity: 3,
      participationType: 'team',
      teamMinSize: 2,
      teamMaxSize: 3,
    };
    await expect(updateEvent(testEvent.id, data as any)).rejects.toThrow("Cannot change participation settings when active registrations exist");
  });

  it('unpublish block', async () => {
    const data = {
      ...testEvent,
      startsAt: '2026-12-01T10:00',
      endsAt: '2026-12-01T12:00',
      registrationDeadline: '2026-11-30T10:00',
      registrationOpensAt: '2026-10-01T10:00',
      capacity: 3,
      status: 'draft'
    };
    await expect(updateEvent(testEvent.id, data as any)).rejects.toThrow("Cannot unpublish event with active registrations");
  });

});
