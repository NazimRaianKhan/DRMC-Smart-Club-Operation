import { requireRole } from '@/server/auth';
import { FestForm } from '@/components/admin/FestForm';
import { db } from '@/db/client';
import { fests } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { utcToDhaka } from '@/lib/timezone';

export const instant = false;

export default async function EditFestPage({ params }: { params: Promise<{ lang: string, id: string }> }) {
  const { lang, id } = await params;
  await requireRole(['organizer', 'admin']);

  const fest = await db.query.fests.findFirst({
    where: eq(fests.id, id)
  });

  if (!fest) {
    notFound();
  }

  const initialData = {
    ...fest,
    startsAt: utcToDhaka(new Date(fest.startsAt)),
    endsAt: utcToDhaka(new Date(fest.endsAt))
  };

  const organizations = await db.query.organizations.findMany({
    columns: { id: true, name: true }
  });

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold font-heading">Edit Fest</h1>
      <FestForm initialData={initialData as any} festId={id} organizations={organizations} />
    </div>
  );
}

