import { db } from '@/db/client';
import { fests } from '@/db/schema';
import Link from 'next/link';
import { formatDateTime } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { desc } from 'drizzle-orm';
import { requireRole } from '@/server/auth';

export default async function AdminFestsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  await requireRole(['organizer', 'admin']);
  
  const allFests = await db.query.fests.findMany({
    with: { events: { columns: { id: true } } },
    orderBy: [desc(fests.createdAt)]
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-heading">Fests</h1>
        <Button asChild>
          <Link href={`/${lang}/admin/fests/new`}>Create Fest</Link>
        </Button>
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-alt text-text-muted">
            <tr>
              <th className="p-4 font-medium">Title</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Dates</th>
              <th className="p-4 font-medium">Events</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {allFests.map(fest => (
              <tr key={fest.id} className="hover:bg-surface-alt/50 transition-colors">
                <td className="p-4 font-medium">{fest.title}</td>
                <td className="p-4 capitalize">{fest.status}</td>
                <td className="p-4 text-text-muted">
                  {formatDateTime(new Date(fest.startsAt), lang)} - {formatDateTime(new Date(fest.endsAt), lang)}
                </td>
                <td className="p-4">{fest.events.length}</td>
                <td className="p-4 text-right">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/${lang}/admin/fests/${fest.id}/edit`}>Edit</Link>
                  </Button>
                </td>
              </tr>
            ))}
            {allFests.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-text-muted">No fests found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
