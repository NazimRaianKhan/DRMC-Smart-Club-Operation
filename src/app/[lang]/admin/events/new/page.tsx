import { requireRole } from '@/server/auth';
import { EventForm } from '@/components/admin/EventForm';
import { db } from '@/db/client';

export const instant = false;

export default async function NewEventPage({ searchParams, params }: { searchParams: Promise<any>, params: Promise<{ lang: string }> }) {
  await params;
  await requireRole(['organizer', 'admin']);
  const sp = await searchParams;

  const fests = await db.query.fests.findMany({
    columns: { id: true, title: true }
  });

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold font-heading">Create Event</h1>
      <EventForm fests={fests} initialData={sp.festId ? { festId: sp.festId } : undefined} />
    </div>
  );
}

