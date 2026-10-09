import { requireRole } from '@/server/auth';
import { EventForm } from '@/components/admin/EventForm';
import { db } from '@/db/client';
import { events } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { utcToDhaka } from '@/lib/timezone';

export default async function EditEventPage({ params }: { params: Promise<{ lang: string, id: string }> }) {
  const { lang, id } = await params;
  await requireRole(['organizer', 'admin']);

  const event = await db.query.events.findFirst({
    where: eq(events.id, id)
  });

  if (!event) {
    notFound();
  }

  const initialData = {
    ...event,
    faqs: event.faq as any,
    startsAt: utcToDhaka(new Date(event.startsAt)),
    endsAt: utcToDhaka(new Date(event.endsAt)),
    registrationOpensAt: event.registrationOpensAt ? utcToDhaka(new Date(event.registrationOpensAt)) : null,
    registrationDeadline: utcToDhaka(new Date(event.registrationDeadline))
  };

  const fests = await db.query.fests.findMany({
    columns: { id: true, title: true }
  });

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold font-heading">Edit Event</h1>
      <EventForm fests={fests} initialData={initialData as any} eventId={id} />
    </div>
  );
}
