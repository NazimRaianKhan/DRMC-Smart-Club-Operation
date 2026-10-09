import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { events, registrations, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { registerForEvent } from '@/server/registrations';
import { createLimiter } from '@/server/ratelimit';
import { headers } from 'next/headers';
import crypto from 'crypto';

const labLimiter = createLimiter(100, 600);

export async function POST(req: Request) {
  try {
    const ip = (await headers()).get('x-forwarded-for') ?? 'unknown';
    const { success } = await labLimiter.limit(`lab-run-${ip}`);
    if (!success) {
      return NextResponse.json({ error: 'Too many lab runs. Please wait 10 minutes.' }, { status: 429 });
    }

    const { count } = await req.json();
    if (![50, 100, 200].includes(count)) {
      return NextResponse.json({ error: 'Invalid count. Must be 50, 100, or 200.' }, { status: 400 });
    }

    const labEvent = await db.query.events.findFirst({
      where: eq(events.slug, 'concurrency-lab')
    });

    if (!labEvent || !labEvent.isLab) {
      return NextResponse.json({ error: 'Lab event not found' }, { status: 404 });
    }

    // 1. Reset
    await db.delete(registrations).where(eq(registrations.eventId, labEvent.id));
    await db.update(events).set({ confirmedCount: 0 }).where(eq(events.id, labEvent.id));
    
    // Ensure enough dummy users
    const participantUsers = await db.query.users.findMany({
      where: eq(users.role, 'participant'),
      limit: count
    });

    let targetUsers = participantUsers;
    if (targetUsers.length < count) {
      const toCreate = count - targetUsers.length;
      const newUsers = [];
      for(let i=0; i<toCreate; i++) {
         newUsers.push({
           email: `dummy_${crypto.randomUUID()}@example.com`,
           passwordHash: 'dummy',
           fullName: 'Dummy User',
           role: 'participant' as const,
         });
      }
      const inserted = await db.insert(users).values(newUsers).returning();
      targetUsers = [...targetUsers, ...inserted];
    }

    // 2. Fire registrations concurrently
    const promises = [];
    for (let i = 0; i < count; i++) {
      const user = targetUsers[i]!;
      const input = {
        idempotencyKey: crypto.randomUUID(),
        teamName: '',
        notes: '',
        members: [{
          fullName: user.fullName,
          email: user.email,
          phone: '01700000000',
          institution: 'Dummy Inst',
          classLevel: '10',
          studentId: ''
        }]
      };
      promises.push(registerForEvent({ userId: user.id, eventId: labEvent.id, input }));
    }

    const results = await Promise.all(promises);

    // 3. Recount
    const afterEvent = await db.query.events.findFirst({ where: eq(events.id, labEvent.id) });
    const allRegs = await db.query.registrations.findMany({ where: eq(registrations.eventId, labEvent.id) });

    let errors = 0;
    const outcomes: ('c'|'w'|'e')[] = [];

    for (const res of results) {
      if (res.ok) {
         if (res.registration.status === 'confirmed' || res.registration.status === 'checked_in') {
           outcomes.push('c');
         } else if (res.registration.status === 'waitlisted') {
           outcomes.push('w');
         } else {
           errors++;
           outcomes.push('e');
         }
      } else {
         errors++;
         outcomes.push('e');
      }
    }
    
    const dbConfirmed = allRegs.filter(r => r.status === 'confirmed').length;
    const dbWaitlisted = allRegs.filter(r => r.status === 'waitlisted').length;

    const invariantsOk = dbConfirmed === Math.min(50, count) 
                      && dbWaitlisted === Math.max(0, count - 50 - errors)
                      && afterEvent!.confirmedCount === dbConfirmed;

    return NextResponse.json({
      requested: count,
      confirmed: dbConfirmed,
      waitlisted: dbWaitlisted,
      errors,
      oversold: dbConfirmed > 50,
      invariantsOk,
      outcomes
    });
  } catch (error) {
    console.error('Lab run failed', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
