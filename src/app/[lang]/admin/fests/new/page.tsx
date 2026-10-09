import { requireRole } from '@/server/auth';
import { FestForm } from '@/components/admin/FestForm';
import { db } from '@/db/client';

export const instant = false;

export default async function NewFestPage({ params }: { params: Promise<{ lang: string }> }) {
  await params;
  await requireRole(['organizer', 'admin']);

  const organizations = await db.query.organizations.findMany({
    columns: { id: true, name: true }
  });

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold font-heading">Create Fest</h1>
      <FestForm organizations={organizations} />
    </div>
  );
}

