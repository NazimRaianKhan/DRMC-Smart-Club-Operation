import { afterAll, beforeAll, describe, expect, it, vi, beforeEach } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('node:crypto', async importOriginal => {
  const original = await importOriginal<typeof import('node:crypto')>();
  return { ...original, randomInt: vi.fn(original.randomInt) };
});
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    set: vi.fn(),
    get: vi.fn(),
  })),
}));

import { randomInt, randomUUID } from 'node:crypto';
import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { events, fests, organizations, registrationMembers, registrations, users } from '@/db/schema';
import { cancelRegistration, editRegistration, getWaitlistPosition, registerForEvent } from '@/server/registrations';
import { PATCH as updateProfile } from '@/app/api/me/route';
import { PATCH as updatePassword } from '@/app/api/me/password/route';
import * as auth from '@/server/auth';
import { hash } from 'bcryptjs';

const prefix = `p10-test-${randomUUID()}`;
let orgId: string;
let festId: string;
const userIds: string[] = [];
const eventIds: string[] = [];

async function account(role: typeof users.$inferSelect.role = 'participant') {
  const [user] = await db.insert(users).values({ 
    email: `${randomUUID()}@example.com`, 
    fullName: 'Test User', 
    passwordHash: await hash('password123', 10), 
    role,
    tokenVersion: 1
  }).returning();
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
  return { idempotencyKey: randomUUID(), members: [{ fullName: user.fullName, email: user.email, phone: '01711223344', institution: 'DRMC', classLevel: '10' as const }] };
}

async function signup(eventId: string, existingUser?: typeof users.$inferSelect) {
  const user = existingUser ?? await account();
  const res = await registerForEvent({ userId: user.id, eventId, input: input(user), requestId: randomUUID() });
  return { user, ...res };
}

beforeAll(async () => {
  const [org] = await db.insert(organizations).values({ name: 'Registration tests P10', slug: prefix }).returning();
  orgId = org!.id;
  const [fest] = await db.insert(fests).values({
    organizationId: orgId, slug: prefix, title: 'Test fest P10', tagline: 'Test', description: 'Test',
    startsAt: new Date(Date.now() + 86400000), endsAt: new Date(Date.now() + 172800000), venue: 'Test', status: 'published',
  }).returning();
  festId = fest!.id;
});

afterAll(async () => {
  if (eventIds.length) {
    await db.delete(registrationMembers).where(inArray(registrationMembers.eventId, eventIds));
    await db.delete(registrations).where(inArray(registrations.eventId, eventIds));
    await db.delete(events).where(inArray(events.id, eventIds));
  }
  if (festId) await db.delete(fests).where(eq(fests.id, festId));
  if (orgId) await db.delete(organizations).where(eq(organizations.id, orgId));
  if (userIds.length) await db.delete(users).where(inArray(users.id, userIds));
});

describe('Prompt 10 logic', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('cancels a confirmed registration on a full event with 3 waitlisted -> exactly the oldest waitlisted becomes confirmed, counts correct', async () => {
    const e = await event({ capacity: 1 });
    const u1 = await signup(e.id);
    expect(u1.ok && u1.registration.status).toBe('confirmed');
    const u2 = await signup(e.id);
    const u3 = await signup(e.id);
    const u4 = await signup(e.id);
    
    if (!u1.ok || !u2.ok || !u3.ok || !u4.ok) throw new Error('Failed to register');
    
    expect(u2.registration.status).toBe('waitlisted');
    expect(u3.registration.status).toBe('waitlisted');
    expect(u4.registration.status).toBe('waitlisted');

    const res = await cancelRegistration({ userId: u1.user.id, registrationId: u1.registration.id });
    expect(res).toMatchObject({ ok: true });

    const reg1 = await db.query.registrations.findFirst({ where: eq(registrations.id, u1.registration.id) });
    expect(reg1?.status).toBe('cancelled');

    const reg2 = await db.query.registrations.findFirst({ where: eq(registrations.id, u2.registration.id) });
    expect(reg2?.status).toBe('confirmed');

    const reg3 = await db.query.registrations.findFirst({ where: eq(registrations.id, u3.registration.id) });
    expect(reg3?.status).toBe('waitlisted');

    const ev = await db.query.events.findFirst({ where: eq(events.id, e.id) });
    expect(ev?.confirmedCount).toBe(1);
  });

  it('cancels a waitlisted registration -> no promotion', async () => {
    const e = await event({ capacity: 1 });
    const u1 = await signup(e.id);
    const u2 = await signup(e.id);
    
    if (!u1.ok || !u2.ok) throw new Error('Failed to register');

    const res = await cancelRegistration({ userId: u2.user.id, registrationId: u2.registration.id });
    expect(res).toMatchObject({ ok: true });

    const ev = await db.query.events.findFirst({ where: eq(events.id, e.id) });
    expect(ev?.confirmedCount).toBe(1);
  });

  it('edits team member to an email active in another team -> MEMBER_ALREADY_REGISTERED', async () => {
    const e = await event({ participationType: 'team', teamMinSize: 2, teamMaxSize: 3 });
    const t1User = await account();
    const t2User = await account();

    const p1 = input(t1User);
    p1.members.push({ fullName: 'M2', email: 'shared@example.com', phone: '', institution: 'DRMC', classLevel: '10' });
    p1.teamName = 'Team 1';
    
    const p2 = input(t2User);
    p2.members.push({ fullName: 'M3', email: 'unique@example.com', phone: '', institution: 'DRMC', classLevel: '10' });
    p2.teamName = 'Team 2';

    const r1 = await registerForEvent({ userId: t1User.id, eventId: e.id, input: p1 });
    const r2 = await registerForEvent({ userId: t2User.id, eventId: e.id, input: p2 });

    if (!r1.ok) throw new Error(`Failed to register r1: ${JSON.stringify(r1)}`);
    if (!r2.ok) throw new Error(`Failed to register r2: ${JSON.stringify(r2)}`);

    const editInput = { ...p2, members: [
      p2.members[0], 
      { fullName: 'M3 Edited', email: 'shared@example.com', phone: '', institution: 'DRMC', classLevel: '10' }
    ] };
    
    const res = await editRegistration({ userId: t2User.id, registrationId: (r2 as any).registration.id, input: editInput });
    expect(res).toMatchObject({ ok: false, code: 'MEMBER_ALREADY_REGISTERED', memberIndex: 1 });
  });

  it('profile updates persist', async () => {
    const user = await account();
    vi.spyOn(auth, 'requireUser').mockResolvedValue({ sub: user.id } as any);
    
    const req = new Request('http://localhost/api/me', {
      method: 'PATCH',
      body: JSON.stringify({
        fullName: 'New Name',
        phone: '01711223345',
        institution: 'New Inst',
        classLevel: '11',
      })
    });

    const res = await updateProfile(req);
    expect(res.status).toBe(200);

    const updated = await db.query.users.findFirst({ where: eq(users.id, user.id) });
    expect(updated).toMatchObject({
      fullName: 'New Name',
      phone: '01711223345',
      institution: 'New Inst',
      classLevel: '11',
    });
  });

  it('password change with wrong current fails; success increments token_version', async () => {
    const user = await account();
    vi.spyOn(auth, 'requireUser').mockResolvedValue({ sub: user.id } as any);
    vi.spyOn(auth, 'signToken').mockResolvedValue('token');

    const req1 = new Request('http://localhost/api/me/password', {
      method: 'PATCH',
      body: JSON.stringify({
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123'
      })
    });
    const res1 = await updatePassword(req1);
    expect(res1.status).toBe(400);

    const req2 = new Request('http://localhost/api/me/password', {
      method: 'PATCH',
      body: JSON.stringify({
        currentPassword: 'password123',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123'
      })
    });
    const res2 = await updatePassword(req2);
    expect(res2.status).toBe(200);

    const updated = await db.query.users.findFirst({ where: eq(users.id, user.id) });
    expect(updated?.tokenVersion).toBe(2);
  });
});
