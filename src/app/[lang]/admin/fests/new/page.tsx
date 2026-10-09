import { requireRole } from '@/server/auth';
import { FestForm } from '@/components/admin/FestForm';

export const instant = false;

export default async function NewFestPage({ params }: { params: Promise<{ lang: string }> }) {
  await params;
  await requireRole(['organizer', 'admin']);

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold font-heading">Create Fest</h1>
      <FestForm />
    </div>
  );
}

