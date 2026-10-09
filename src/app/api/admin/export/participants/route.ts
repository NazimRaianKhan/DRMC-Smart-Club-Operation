import { requireRole } from '@/server/auth';
import { db } from '@/db/client';
import { registrations, registrationMembers, events, fests } from '@/db/schema';
import { and, eq, inArray, sql, or, ilike } from 'drizzle-orm';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    await requireRole(['organizer', 'admin']);
    
    const searchParams = req.nextUrl.searchParams;
    const q = searchParams.get('q') || '';
    const eventId = searchParams.get('event') || '';
    const statuses = searchParams.getAll('status');

    // Build conditions matching the page
    const conditions = [];
    if (eventId) {
      conditions.push(eq(registrations.eventId, eventId));
    }
    if (statuses && statuses.length > 0) {
      conditions.push(inArray(registrations.status, statuses as any[]));
    }
    
    if (q && q.length >= 2) {
      conditions.push(
        or(
          eq(registrations.ticketCode, q),
          ilike(registrations.teamName, `%${q}%`),
          sql`EXISTS (
            SELECT 1 FROM registration_members rm 
            WHERE rm.registration_id = ${registrations.id} 
            AND (rm.full_name ILIKE ${'%' + q + '%'} OR rm.email ILIKE ${'%' + q + '%'} OR rm.phone ILIKE ${'%' + q + '%'})
          )`
        )
      );
    }
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    // We want a stream, streaming in batches of 1000, max 50000.
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // BOM for Excel
          controller.enqueue(new Uint8Array([0xEF, 0xBB, 0xBF]));
          
          const header = [
            'ticket_code', 'event', 'fest', 'registration_status', 'team_name', 
            'member_role', 'full_name', 'email', 'phone', 'institution', 
            'class_level', 'student_id', 'registered_at'
          ];
          
          const escapeCsv = (str: string | null | undefined) => {
            if (!str) return '';
            let s = String(str);
            if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; // Injection protection
            if (s.includes('"') || s.includes(',') || s.includes('\n')) {
              return `"${s.replace(/"/g, '""')}"`;
            }
            return s;
          };

          controller.enqueue(new TextEncoder().encode(header.map(escapeCsv).join(',') + '\n'));
          
          let lastId = '00000000-0000-0000-0000-000000000000'; // We use keyset pagination based on RM id. But RM id isn't naturally sorted. Wait, UUID v4 isn't ordered!
          // We can't keyset paginate efficiently with UUIDv4 unless we order by created_at.
          // Let's just use OFFSET / LIMIT for simplicity since it's an admin route, or a cursor based on created_at, id.
          // Since it caps at 50,000 rows, offset/limit is acceptable.

          const MAX_ROWS = 50000;
          const BATCH_SIZE = 1000;
          let fetchedRows = 0;
          let offset = 0;

          while (fetchedRows < MAX_ROWS) {
            // Fetch batches
            const batch = await db.select({
              ticket_code: registrations.ticketCode,
              event: events.title,
              fest: fests.title,
              registration_status: registrations.status,
              team_name: registrations.teamName,
              member_role: sql<string>`CASE WHEN ${registrationMembers.isLeader} THEN 'Leader' ELSE 'Member' END`,
              full_name: registrationMembers.fullName,
              email: registrationMembers.email,
              phone: registrationMembers.phone,
              institution: registrationMembers.institution,
              class_level: registrationMembers.classLevel,
              student_id: registrationMembers.studentId,
              registered_at: registrations.queuedAt,
            })
            .from(registrationMembers)
            .innerJoin(registrations, eq(registrationMembers.registrationId, registrations.id))
            .innerJoin(events, eq(registrations.eventId, events.id))
            .innerJoin(fests, eq(events.festId, fests.id))
            .where(whereClause)
            .orderBy(registrations.queuedAt, registrationMembers.id)
            .limit(BATCH_SIZE)
            .offset(offset);

            if (batch.length === 0) break;

            let chunk = '';
            for (const row of batch) {
              chunk += [
                row.ticket_code, row.event, row.fest, row.registration_status, row.team_name,
                row.member_role, row.full_name, row.email, row.phone, row.institution,
                row.class_level, row.student_id, new Date(row.registered_at).toISOString()
              ].map(escapeCsv).join(',') + '\n';
            }
            controller.enqueue(new TextEncoder().encode(chunk));

            fetchedRows += batch.length;
            offset += BATCH_SIZE;
            
            if (batch.length < BATCH_SIZE) break;
          }
          
          controller.close();
        } catch (e) {
          console.error("Stream error", e);
          controller.error(e);
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="participants_export.csv"'
      }
    });

  } catch (err: any) {
    return new Response(err.message, { status: 403 });
  }
}
