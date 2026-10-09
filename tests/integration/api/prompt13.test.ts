import { describe, it, expect, beforeAll } from 'vitest';
import { fetchStats } from '@/server/queries/stats';
import { db } from '@/db/client';
import { fests, events, users, registrations } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { resetDemoDatabase } from '@/server/actions/demo';

describe('Prompt 13 - Organizer Dashboard', () => {
  beforeAll(async () => {
    // Basic setup if needed, but we can rely on existing test db data or clear it.
    await db.delete(registrations);
    await db.delete(events);
    await db.delete(fests);
    await db.delete(users);
  });

  it('fetchStats returns the expected structure with zeros when no data', async () => {
    const stats = await fetchStats();
    expect(stats.totals).toBeDefined();
    expect(stats.totals.publishedFests).toBe(0);
    expect(stats.totals.publishedEvents).toBe(0);
    expect(stats.totals.totalActive).toBe(0);
    expect(stats.upcomingEvents).toEqual([]);
    expect(stats.timeline).toHaveLength(14); // 14 days of data
    expect(stats.byCategory).toEqual([]);
    expect(stats.byClassLevel).toEqual([]);
    expect(stats.needsAttention).toEqual([]);
  });

  it('resetDemoDatabase requires correct confirmText and DEMO_MODE', async () => {
    // Temporarily unset DEMO_MODE
    const originalDemoMode = process.env.DEMO_MODE;
    process.env.DEMO_MODE = 'false';

    await expect(resetDemoDatabase('WRONG')).rejects.toThrow('Invalid confirmation text');
    await expect(resetDemoDatabase('RESET')).rejects.toThrow('Demo mode is not enabled');

    process.env.DEMO_MODE = originalDemoMode;
  });
});
