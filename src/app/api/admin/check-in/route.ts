import { NextResponse } from 'next/server';
import { requireRole, assertSameOrigin } from '@/server/auth';
import { setRegistrationStatusInternal } from '@/server/registrations';
import { db } from '@/db/client';
import { sql } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    await assertSameOrigin();
    const session = await requireRole(['organizer', 'admin']);

    const body = await req.json();
    const { eventId, code } = body;

    if (!eventId || !code || typeof code !== 'string') {
      return NextResponse.json({ ok: false, code: 'BAD_REQUEST' }, { status: 400 });
    }

    const result = await db.execute(sql`
      SELECT id, status, event_id FROM registrations 
      WHERE ticket_code = ${code.toUpperCase()}
    `);

    if (result.rows.length === 0) {
      return NextResponse.json({ ok: false, code: 'NOT_FOUND' }, { status: 404 });
    }

    const reg = result.rows[0];

    if (!reg) {
      return NextResponse.json({ ok: false, code: 'NOT_FOUND' }, { status: 404 });
    }

    if (reg.event_id !== eventId) {
      return NextResponse.json({ ok: false, code: 'WRONG_EVENT' }, { status: 400 });
    }

    if (reg.status === 'checked_in') {
      return NextResponse.json({ ok: false, code: 'ALREADY_CHECKED_IN' }, { status: 400 });
    }

    if (reg.status !== 'confirmed') {
      return NextResponse.json({ ok: false, code: 'NOT_CONFIRMED' }, { status: 400 });
    }

    await db.transaction(async (tx) => {
      await setRegistrationStatusInternal(tx, { id: reg.id as string }, 'checked_in', session.sub);
    });

    return NextResponse.json({ ok: true, code: 'SUCCESS' });
  } catch (error: any) {
    if (error.message === 'Forbidden') return NextResponse.json({ ok: false, code: 'FORBIDDEN' }, { status: 403 });
    if (error.message === 'Unauthenticated') return NextResponse.json({ ok: false, code: 'UNAUTHENTICATED' }, { status: 401 });
    return NextResponse.json({ ok: false, code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

