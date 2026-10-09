import { getDashboardStats } from '@/server/queries/stats';
import { requireRole } from '@/server/auth';
import { Card } from '@/components/ui/card';
import { BarChart } from '@/components/admin/charts/BarChart';
import { Donut } from '@/components/admin/charts/Donut';
import { ProgressList } from '@/components/admin/charts/ProgressList';
import { DemoResetButton } from '@/components/admin/DemoResetButton';
import { AiInsightsCard } from '@/components/admin/AiInsightsCard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Download } from 'lucide-react';

export default async function AdminPage({ params }: { params: Promise<{ lang: string }> }) {
  await requireRole(['organizer', 'admin']);
  
  const stats = await getDashboardStats();

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-heading font-bold">Dashboard</h1>
        <div className="flex items-center gap-2">
          <Button asChild variant="secondary">
            <Link href="/api/admin/export/participants" prefetch={false} target="_blank">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Link>
          </Button>
          {process.env.DEMO_MODE === 'true' && <DemoResetButton />}
        </div>
      </div>

      <div className="grid grid-cols-1 mb-8">
        <AiInsightsCard />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground mb-2">Fests</div>
          <div className="text-2xl font-bold">{stats.totals.publishedFests}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground mb-2">Events</div>
          <div className="text-2xl font-bold">{stats.totals.publishedEvents}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground mb-2">Active Reg.</div>
          <div className="text-2xl font-bold">{stats.totals.totalActive}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground mb-2">Confirmed</div>
          <div className="text-2xl font-bold">{stats.totals.confirmed}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground mb-2">Waitlisted</div>
          <div className="text-2xl font-bold">{stats.totals.waitlisted}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground mb-2">Checked In</div>
          <div className="text-2xl font-bold">{stats.totals.checkedIn}</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-6">
          <div className="text-lg font-semibold mb-4">Registrations (Last 14 Days)</div>
          <div className="h-64">
            <BarChart data={stats.timeline.map((t: any) => ({ 
              date: new Date(t.date), 
              count: t.count 
            }))} />
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="text-lg font-semibold mb-4">By Category</div>
          <div className="h-64 flex justify-center">
            <Donut data={stats.byCategory.map((c: any) => ({ category: c.category || 'Unknown', count: c.count }))} />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-6">
          <div className="text-lg font-semibold mb-4">Fill Rate by Event</div>
          <ProgressList data={stats.upcomingEvents.map((e: any) => ({
            id: e.id,
            label: e.title,
            count: e.confirmed_count,
            total: e.capacity
          }))} />
        </Card>

        <Card className="p-6">
          <div className="text-lg font-semibold mb-4">Needs Attention</div>
          {stats.needsAttention.length === 0 ? (
            <p className="text-muted-foreground text-sm">All good! No events currently need attention.</p>
          ) : (
            <div className="space-y-4">
              {stats.needsAttention.map((event: any) => (
                <div key={event.id} className="flex justify-between items-center p-3 border rounded-md">
                  <div>
                    <p className="font-medium text-sm">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Confirmed: {event.confirmed_count} / {event.capacity}
                      {event.waitlist_count > 0 && ` | Waitlist: ${event.waitlist_count}`}
                    </p>
                  </div>
                  <Button variant="secondary" size="sm" asChild>
                    <Link href={`/admin/events/${event.id}/edit`}>Manage</Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
