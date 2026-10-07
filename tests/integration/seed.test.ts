import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db, pool } from '@/db/client';
import * as schema from '@/db/schema';
import { sql } from 'drizzle-orm';
import { seedDatabase } from '@/server/seed';

describe('Database Seeder', () => {
  let initialCounts: any = {};
  let now = new Date();

  beforeAll(async () => {
    // Run initial seed
    await seedDatabase({ now });
    
    // Store counts
    const tables = ['users', 'organizations', 'fests', 'events', 'registrations', 'registration_members', 'audit_log'];
    for (const table of tables) {
      const res = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
      initialCounts[table] = parseInt(res.rows[0].count, 10);
    }
  });

  afterAll(async () => {
    await pool.end();
  });

  it('Programming Contest has 60 confirmed + 14 waitlisted and confirmed_count=60', async () => {
    const progEvts = await db.select().from(schema.events).where(sql`slug = 'prog-contest'`);
    expect(progEvts.length).toBe(1);
    const evt = progEvts[0];
    
    expect(evt.confirmedCount).toBe(60);

    const confirmed = await db.select({ count: sql<number>`count(*)` }).from(schema.registrations).where(sql`event_id = ${evt.id} AND status = 'confirmed'`);
    expect(Number(confirmed[0].count)).toBe(60);

    const waitlisted = await db.select({ count: sql<number>`count(*)` }).from(schema.registrations).where(sql`event_id = ${evt.id} AND status = 'waitlisted'`);
    expect(Number(waitlisted[0].count)).toBe(14);
  });

  it('AI Web Development Contest deadline is between 30 and 40 hours from now', async () => {
    const aiEvts = await db.select().from(schema.events).where(sql`slug = 'ai-web-dev'`);
    expect(aiEvts.length).toBe(1);
    const evt = aiEvts[0];

    const deadlineMs = evt.registrationDeadline.getTime();
    const nowMs = now.getTime();
    const diffHours = (deadlineMs - nowMs) / (1000 * 60 * 60);

    expect(diffHours).toBeGreaterThanOrEqual(30);
    expect(diffHours).toBeLessThanOrEqual(40);
  });

  it('the lab event has is_lab=true', async () => {
    const labEvts = await db.select().from(schema.events).where(sql`slug = 'concurrency-lab'`);
    expect(labEvts.length).toBe(1);
    expect(labEvts[0].isLab).toBe(true);
  });

  it('every active registration has a leader', async () => {
    const res = await pool.query(`
      SELECT r.id, COUNT(rm.id) as leader_count
      FROM registrations r
      LEFT JOIN registration_members rm ON r.id = rm.registration_id AND rm.is_leader = true
      WHERE r.status NOT IN ('cancelled', 'rejected')
      GROUP BY r.id
      HAVING COUNT(rm.id) != 1
    `);
    expect(res.rows.length).toBe(0);
  });

  it('seeding twice yields identical row counts (idempotent)', async () => {
    // Run again
    await seedDatabase({ now });
    
    for (const table of Object.keys(initialCounts)) {
      const res = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
      const newCount = parseInt(res.rows[0].count, 10);
      expect(newCount).toBe(initialCounts[table]);
    }
  });

  it('seed refuses to run with NODE_ENV=production and ALLOW_SEED unset', async () => {
    const oldEnv = process.env.NODE_ENV;
    const oldAllow = process.env.ALLOW_SEED;
    process.env.NODE_ENV = 'production';
    delete process.env.ALLOW_SEED;

    await expect(seedDatabase({ now })).rejects.toThrow(/Seed refused to run in production/);

    process.env.NODE_ENV = oldEnv;
    if (oldAllow) process.env.ALLOW_SEED = oldAllow;
  });
});

