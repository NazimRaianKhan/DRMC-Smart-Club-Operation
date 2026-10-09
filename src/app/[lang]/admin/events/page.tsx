import { db } from '@/db/client';
import { events } from '@/db/schema';
import Link from 'next/link';
import { formatDateTime } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { desc, asc, sql, ilike, and, eq } from 'drizzle-orm';
import { requireRole } from '@/server/auth';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { Input } from '@/components/ui/forms';

export const instant = false;

export default async function AdminEventsPage({ searchParams, params }: { searchParams: Promise<any>, params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  await requireRole(['organizer', 'admin']);
  
  const sp = await searchParams;
  const page = parseInt(sp.page) || 1;
  const limit = 25;
  const offset = (page - 1) * limit;
  
  const q = sp.q || '';
  const filterFest = sp.fest || '';
  
  const conditions = [];
  if (q) conditions.push(ilike(events.title, `%${q}%`));
  if (filterFest) conditions.push(eq(events.festId, filterFest));
  
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalRes] = await db.select({ count: sql`count(*)`.mapWith(Number) })
    .from(events)
    .where(whereClause);
  const total = totalRes?.count ?? 0;

  const allEvents = await db.query.events.findMany({
    where: whereClause,
    with: { fest: { columns: { title: true } } },
    orderBy: [desc(events.createdAt)],
    limit,
    offset
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-heading">Events</h1>
        <Button asChild>
          <Link href={`/${lang}/admin/events/new`}>Create Event</Link>
        </Button>
      </div>

      <form className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-text-muted" />
          <Input name="q" defaultValue={q} placeholder="Search events..." className="pl-9" />
        </div>
        <Button type="submit" variant="secondary">Search</Button>
      </form>

      <div className="bg-surface border border-border rounded-xl overflow-hidden overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-surface-alt text-text-muted">
            <tr>
              <th className="p-4 font-medium">Title</th>
              <th className="p-4 font-medium">Fest</th>
              <th className="p-4 font-medium">Category</th>
              <th className="p-4 font-medium">Dates (Starts - Deadline)</th>
              <th className="p-4 font-medium">Seats (Confirmed/Cap)</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {allEvents.map(evt => (
              <tr key={evt.id} className="hover:bg-surface-alt/50 transition-colors">
                <td className="p-4 font-medium max-w-[200px] truncate" title={evt.title}>{evt.title}</td>
                <td className="p-4 text-text-muted">{evt.fest.title}</td>
                <td className="p-4 capitalize text-text-muted">{evt.category}</td>
                <td className="p-4 text-text-muted text-xs">
                  {formatDateTime(new Date(evt.startsAt), lang)}
                  <br />
                  <span className="opacity-50">dl: {formatDateTime(new Date(evt.registrationDeadline), lang)}</span>
                </td>
                <td className="p-4 font-medium">
                  {evt.confirmedCount} / {evt.capacity}
                </td>
                <td className="p-4">
                  <Badge variant="outline" className={`capitalize ${evt.status === 'published' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : ''}`}>
                    {evt.status}
                  </Badge>
                </td>
                <td className="p-4 text-right">
                  <Button variant="secondary" size="sm" asChild>
                    <Link href={`/${lang}/admin/events/${evt.id}/edit`}>Edit</Link>
                  </Button>
                </td>
              </tr>
            ))}
            {allEvents.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-text-muted">No events found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-muted">
          Showing {offset + 1} - {Math.min(offset + limit, total)} of {total}
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" disabled={page <= 1} asChild={page > 1}>
            <Link href={`?page=${page - 1}&q=${q}&fest=${filterFest}`}><ChevronLeft className="w-4 h-4 mr-1" /> Prev</Link>
          </Button>
          <Button variant="secondary" size="sm" disabled={offset + limit >= total} asChild={offset + limit < total}>
            <Link href={`?page=${page + 1}&q=${q}&fest=${filterFest}`}>Next <ChevronRight className="w-4 h-4 ml-1" /></Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

