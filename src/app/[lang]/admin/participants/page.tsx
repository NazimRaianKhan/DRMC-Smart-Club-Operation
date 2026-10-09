import { getParticipants, getParticipantFilters } from '@/server/participants';
import { ParticipantsFilters } from '@/components/admin/ParticipantsFilters';
import { ParticipantsTable } from '@/components/admin/ParticipantsTable';
import { requireRole } from '@/server/auth';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const instant = false;

export default async function ParticipantsPage({ searchParams, params }: { searchParams: Promise<any>, params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  
  const sp = await searchParams;
  const page = parseInt(sp.page) || 1;
  const limit = 25;
  const q = sp.q || '';
  const eventId = sp.event || '';
  const statuses = sp.status ? (Array.isArray(sp.status) ? sp.status : [sp.status]) : [];
  
  const [data, filtersData] = await Promise.all([
    getParticipants({ page, limit, q, eventId, statuses }),
    getParticipantFilters({ q, eventId, statuses })
  ]);
  
  const { registrations, total } = data;
  const { fests, statusCounts } = filtersData;

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-heading">Participants</h1>
      </div>
      
      <div className="bg-surface p-4 rounded-xl border border-border">
        <ParticipantsFilters fests={fests} statusCounts={statusCounts} />
      </div>

      <ParticipantsTable registrations={registrations} lang={lang} />
      
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-muted">
          Showing {(page - 1) * limit + 1} - {Math.min(page * limit, total)} of {total}
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" disabled={page <= 1} asChild={page > 1}>
            <Link href={`?${new URLSearchParams({ ...sp, page: (page - 1).toString() }).toString()}`}>
              <ChevronLeft className="w-4 h-4 mr-1" /> Prev
            </Link>
          </Button>
          <Button variant="secondary" size="sm" disabled={page >= totalPages} asChild={page < totalPages}>
            <Link href={`?${new URLSearchParams({ ...sp, page: (page + 1).toString() }).toString()}`}>
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

