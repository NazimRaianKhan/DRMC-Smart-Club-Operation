import { NextResponse } from 'next/server';
import { requireUser, UnauthenticatedError } from '@/server/auth';
import { db } from '@/db/client';
import { sql } from 'drizzle-orm';

function formatDateICS(date: string) {
  return new Date(date).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function escapeICS(str: string) {
  if (!str) return '';
  return str.replace(/[\\;,]/g, (match) => '\\' + match).replace(/\n/g, '\\n');
}

export async function GET(req: Request, context: any) {
  try {
    const { id } = await context.params;
    const session = await requireUser();

    const result = await db.execute(sql`
      SELECT r.id, r.user_id, r.status, e.title, e.starts_at, e.ends_at, e.venue 
      FROM registrations r
      JOIN events e ON r.event_id = e.id
      WHERE r.id = ${id}
    `);

    if (result.rows.length === 0) {
      return NextResponse.json({ ok: false, code: 'NOT_FOUND' }, { status: 404 });
    }

    const reg = result.rows[0];
    
    if (!reg) {
      return NextResponse.json({ ok: false, code: 'NOT_FOUND' }, { status: 404 });
    }

    if (reg.user_id !== session.sub) {
      return NextResponse.json({ ok: false, code: 'FORBIDDEN' }, { status: 403 });
    }

    if (reg.status !== 'confirmed' && reg.status !== 'checked_in') {
      return NextResponse.json({ ok: false, code: 'NOT_CONFIRMED' }, { status: 400 });
    }

    const start = formatDateICS(reg.starts_at as string);
    const end = formatDateICS(reg.ends_at as string);
    const summary = escapeICS(reg.title as string);
    const location = escapeICS(reg.venue as string);
    const now = formatDateICS(new Date().toISOString());

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//DRMC Tech Carnival//EN
BEGIN:VEVENT
UID:${reg.id}@drmctechcarnival.com
DTSTAMP:${now}
DTSTART:${start}
DTEND:${end}
SUMMARY:${summary}
LOCATION:${location}
END:VEVENT
END:VCALENDAR`.replace(/\n/g, '\r\n');

    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="event-${id}.ics"`,
      },
    });

  } catch (error: any) {
    if (error instanceof UnauthenticatedError) return NextResponse.json({ ok: false, code: 'UNAUTHENTICATED' }, { status: 401 });
    return NextResponse.json({ ok: false, code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

