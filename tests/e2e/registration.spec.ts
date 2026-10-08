import { test, expect, type BrowserContext } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { eq, inArray } from 'drizzle-orm';
import { db, pool } from '../../src/db/client';
import { organizations, fests, events, users, registrations, registrationMembers } from '../../src/db/schema';

test.describe.configure({ mode: 'serial' });
const prefix = `registration-browser-${randomUUID()}`;
let orgId: string;
let festId: string;
let leader: typeof users.$inferSelect;
let outsider: typeof users.$inferSelect;
let team: typeof events.$inferSelect;
let solo: typeof events.$inferSelect;
let confirmationUrl: string;
const userIds: string[] = [];
const eventIds: string[] = [];
async function session(context: BrowserContext, user: typeof users.$inferSelect, role = 'participant') {
  const { SignJWT } = await import('jose');
  const token = await new SignJWT({ sub: user.id, name: user.fullName, role })
    .setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('1h')
    .sign(new TextEncoder().encode(process.env.AUTH_SECRET!));
  await context.addCookies([{ name: 'drmc_session', value: token, url: process.env.REGISTRATION_TEST_BASE_URL || 'http://localhost:3100', httpOnly: true, sameSite: 'Lax' }]);
}

test.beforeAll(async () => {
  const [org] = await db.insert(organizations).values({ name: 'Browser test', slug: prefix }).returning();
  orgId = org!.id;
  const [fest] = await db.insert(fests).values({
    organizationId: orgId, slug: prefix, title: 'Registration browser tests', tagline: 'Test', description: 'Test',
    startsAt: new Date(Date.now() + 86400000), endsAt: new Date(Date.now() + 172800000), venue: 'DRMC', status: 'published',
  }).returning();
  festId = fest!.id;
  const accounts = await db.insert(users).values(Array.from({ length: 17 }, (_, i) => ({
    fullName: `Browser User ${i}`, email: `${prefix}-${i}@example.com`, passwordHash: 'test-only',
    phone: '01711223344', institution: 'DRMC', classLevel: '10',
  }))).returning();
  userIds.push(...accounts.map(user => user.id));
  leader = accounts[0]!;
  outsider = accounts[1]!;
  const base = {
    festId, shortDescription: 'Test event', description: 'Test event', venue: 'DRMC',
    startsAt: new Date(Date.now() + 86400000), endsAt: new Date(Date.now() + 172800000),
    registrationDeadline: new Date(Date.now() + 3600000), status: 'published' as const,
  };
  [team] = await db.insert(events).values({ ...base, slug: `${prefix}-team`, title: 'AI Web Development Contest', category: 'web_dev', capacity: 5, participationType: 'team', teamMinSize: 3, teamMaxSize: 4 }).returning() as [typeof team];
  [solo] = await db.insert(events).values({ ...base, slug: `${prefix}-solo`, title: 'Programming Contest', category: 'programming', capacity: 1, confirmedCount: 1 }).returning() as [typeof solo];
  eventIds.push(team.id, solo.id);
  for (const [i, user] of accounts.slice(2).entries()) {
    const [registration] = await db.insert(registrations).values({
      eventId: solo.id, userId: user.id, status: i === 0 ? 'confirmed' : 'waitlisted',
      ticketCode: randomUUID().replaceAll('-', '').slice(0, 8).toUpperCase(),
      queuedAt: new Date(Date.now() - 60000 + i * 100),
    }).returning();
    await db.insert(registrationMembers).values({
      registrationId: registration!.id, eventId: solo.id, isLeader: true, fullName: user.fullName,
      email: user.email, phone: user.phone, institution: 'DRMC', classLevel: '10',
    });
  }
});
test.afterAll(async () => {
  if (eventIds.length) {
    await db.delete(registrationMembers).where(inArray(registrationMembers.eventId, eventIds));
    await db.delete(registrations).where(inArray(registrations.eventId, eventIds));
    await db.delete(events).where(inArray(events.id, eventIds));
  }
  if (festId) await db.delete(fests).where(eq(fests.id, festId));
  if (orgId) await db.delete(organizations).where(eq(organizations.id, orgId));
  if (userIds.length) await db.delete(users).where(inArray(users.id, userIds));
  await pool.end();
});

test('team of three reaches its confirmation page', async ({ page, context }) => {
  await session(context, leader);
  await page.goto(`/en/fests/${prefix}/events/${team.slug}`);
  await expect(page.getByRole('heading', { name: 'Registration form' })).toBeVisible();
  await expect(page.locator('[name="members.0.email"]')).toHaveAttribute('readonly', '');
  await page.getByLabel('Team name').fill('Browser Team');
  await page.getByRole('button', { name: 'Add member' }).click();
  await expect(page.getByRole('button', { name: 'Add member' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Remove member' }).last().click();
  await expect(page.getByRole('button', { name: 'Remove member' })).toHaveCount(0);
  for (const i of [1, 2]) {
    await page.locator(`[name="members.${i}.fullName"]`).fill(`Team Member ${i}`);
    await page.locator(`[name="members.${i}.email"]`).fill(`member-${i}-${prefix}@example.com`);
    await page.locator(`[name="members.${i}.institution"]`).fill('DRMC');
  }
  await page.getByRole('button', { name: 'Confirm registration' }).click();
  await page.waitForURL(/\/en\/registrations\//);
  await expect(page.getByRole('heading', { name: "You're in!" })).toBeVisible();
  await expect(page.getByText('Browser Team', { exact: true })).toBeVisible();
  await expect(page.getByText('Team Member 2', { exact: true })).toBeVisible();
  confirmationUrl = page.url();
});

test('solo registration displays waitlist position 15, including Bangla', async ({ page, context }) => {
  await session(context, leader);
  await page.goto(`/en/fests/${prefix}/events/${solo.slug}`);
  await page.getByRole('button', { name: 'Confirm registration' }).click();
  await page.waitForURL(/\/en\/registrations\//);
  await expect(page.getByRole('heading', { name: "You're on the waitlist" })).toBeVisible();
  await expect(page.getByTestId('waitlist-position')).toHaveText('Waitlist position: 15');
  await page.goto(page.url().replace('/en/', '/bn/'));
  await expect(page.getByTestId('waitlist-position')).toContainText('15');
  await expect(page.getByRole('heading', { name: 'আপনি ওয়েটলিস্টে আছেন' })).toBeVisible();
});

test('confirmation is private, fresh and accessible to organizers/admins', async ({ page, context }) => {
  await session(context, outsider);
  const denied = await page.goto(confirmationUrl);
  await expect(page.getByText('Browser Team', { exact: true })).toHaveCount(0);
  // A streamed App Router not-found can have a 200 transport status; no private content is rendered.
  expect([200, 404]).toContain(denied!.status());
  for (const role of ['organizer', 'admin']) {
    await db.update(users).set({ role: role as 'organizer' | 'admin' }).where(eq(users.id, outsider.id));
    await session(context, outsider, role);
    const response = await page.goto(confirmationUrl);
    expect(response?.headers()['cache-control']).toContain('no-store');
    await expect(page.getByText('Browser Team', { exact: true })).toBeVisible();
  }
  await context.clearCookies();
  await page.goto(confirmationUrl);
  await expect(page).toHaveURL(/\/en\/login\?next=/);
});

test('staff cannot enter events, including with stale participant sessions', async ({ page, context }) => {
  for (const role of ['organizer', 'admin'] as const) {
    await db.update(users).set({ role }).where(eq(users.id, outsider.id));
    await session(context, outsider, 'participant');
    await page.goto(`/en/fests/${prefix}/events/${team.slug}`);
    await expect(page.getByText('Event registration is available to participant accounts only.', { exact: false })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Confirm registration' })).toHaveCount(0);
    const response = await page.request.post(`/api/events/${team.id}/register`, {
      headers: { Origin: new URL(page.url()).origin }, data: {},
    });
    expect(response.status()).toBe(403);
    expect(await response.json()).toMatchObject({ code: 'FORBIDDEN', reason: 'PARTICIPANT_ONLY' });
    await page.goto('/en/me/registrations');
    await expect(page).toHaveURL(/\/en\/forbidden$/);
    await page.goto('/en/admin');
    await expect(page).toHaveURL(role === 'admin' ? /\/en\/admin$/ : /\/en\/forbidden$/);
  }
});

test('downgrading a staff account immediately removes privileged ticket access', async ({ page, context }) => {
  await session(context, outsider, 'admin');
  await db.update(users).set({ role: 'participant' }).where(eq(users.id, outsider.id));
  await page.goto(confirmationUrl);
  await expect(page.getByText('Browser Team', { exact: true })).toHaveCount(0);
  await page.goto('/en/admin');
  await expect(page).toHaveURL(/\/en\/forbidden$/);
  await page.goto(`/en/fests/${prefix}/events/${team.slug}`);
  await expect(page.getByRole('button', { name: 'Confirm registration' })).toBeVisible();
});
