import { db } from '@/db/client';
import { events, registrations } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getEventState, seatsLeft } from '@/lib/event-state';
import { NextResponse } from 'next/server';

export async function GET(req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  try {
    const { eventId: id } = await params;
    
    // Get event capacity info
    const event = await db.query.events.findFirst({
      where: eq(events.id, id),
      columns: {
        id: true,
        capacity: true,
        confirmedCount: true,
        waitlistEnabled: true,
        status: true,
        startsAt: true,
        registrationOpensAt: true,
        registrationDeadline: true,
      }
    });

    if (!event) {
      return new NextResponse('Not found', { status: 404 });
    }

    // Get waitlist count
    const waitlistCountQuery = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(registrations)
      .where(
        and(
          eq(registrations.eventId, id),
          eq(registrations.status, 'waitlisted')
        )
      );
      
    const waitlistCount = waitlistCountQuery[0]?.count || 0;
    const now = new Date();
    const state = getEventState(event, now);

    const data = {
      capacity: event.capacity,
      confirmedCount: event.confirmedCount,
      seatsLeft: seatsLeft(event),
      waitlistCount,
      state,
      serverTime: now.getTime(),
    };

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=30',
      }
    });
  } catch (error) {
    console.error('Availability API error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

