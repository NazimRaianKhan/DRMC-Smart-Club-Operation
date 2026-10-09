'use server';

import { requireRole } from '@/server/auth';
import { db } from '@/db/client';
import { auditLog } from '@/db/schema';
import { updateTag } from 'next/cache';
import { sql } from 'drizzle-orm';
import { seedDatabase } from '@/server/seed';

let lastResetTime = 0;

export async function resetDemoDatabase(confirmText: string) {
  if (confirmText !== 'RESET') throw new Error('Invalid confirmation text');
  if (process.env.DEMO_MODE !== 'true') throw new Error('Demo mode is not enabled');
  
  const session = await requireRole('admin');
  
  const now = Date.now();
  if (now - lastResetTime < 60000) {
    throw new Error('Reset is rate limited to once per minute');
  }
  lastResetTime = now;

  // Run the seed
  await seedDatabase({});

  // Audit log directly
  await db.insert(auditLog).values({
    actorId: session.sub,
    action: 'demo.reset',
    entityType: 'system',
    entityId: 'demo',
    meta: {}
  });

  // Revalidate ALL tags conceptually (or specific known ones)
  updateTag('fests');
  updateTag('events');
  updateTag('registrations');
  updateTag('stats');
  
  return { success: true };
}
