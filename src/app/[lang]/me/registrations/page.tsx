import { requireUser } from '@/server/auth';
import { db } from '@/db';
import { registrations, events, fests, registrationMembers } from '@/db/schema';
import { eq, inArray, sql, asc, desc } from 'drizzle-orm';
import Link from 'next/link';
import { formatDateTime } from '@/lib/format';
import { MapPin, Calendar, Users, Hash, Ticket, ChevronRight, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/directory/EventCard';
import { getDictionary } from '@/i18n';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ lang: 'en' | 'bn' }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  return { title: lang === 'bn' ? 'আমার রেজিস্ট্রেশনসমূহ' : 'My Registrations' };
}

export default async function MyRegistrationsPage({ params }: Props) {
  const { lang } = await params;
  const session = await requireUser();
  const dict = await getDictionary(lang);

  // One query for all registrations + event + fest + member count
  const myRegs = await db.query.registrations.findMany({
    where: eq(registrations.userId, session.sub),
    with: {
      event: { with: { fest: true } },
      members: { columns: { id: true } } // just to get count
    },
    orderBy: [asc(registrations.queuedAt), desc(registrations.id)]
  });

  if (myRegs.length === 0) {
    return (
      <main className="flex-1 container py-24 text-center max-w-lg mx-auto">
        <Ticket className="w-16 h-16 text-text-muted mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">{lang === 'bn' ? 'কোনো রেজিস্ট্রেশন পাওয়া যায়নি' : 'No Registrations Found'}</h1>
        <p className="text-text-muted mb-6">
          {lang === 'bn' ? 'আপনি এখনো কোনো ইভেন্টে রেজিস্ট্রেশন করেননি।' : "You haven't registered for any events yet."}
        </p>
        <Button asChild>
          <Link href={`/${lang}/fests`}>{lang === 'bn' ? 'ইভেন্ট খুঁজুন' : 'Browse Events'}</Link>
        </Button>
      </main>
    );
  }

  // Calculate waitlist positions for ALL waitlisted regs in one query
  const waitlistedIds = myRegs.filter(r => r.status === 'waitlisted').map(r => r.id);
  const waitlistPositions: Record<string, number> = {};
  
  if (waitlistedIds.length > 0) {
    const posQuery = await db.execute<{ id: string, position: number }>(sql`
      SELECT target.id,
        (SELECT count(*)::int FROM registrations r
         WHERE r.event_id = target.event_id AND r.status = 'waitlisted'
           AND (r.queued_at, r.id) <= (target.queued_at, target.id)) AS position
      FROM registrations target 
      WHERE target.id = ANY(${waitlistedIds})
    `);
    for (const row of posQuery.rows) {
      waitlistPositions[row.id] = row.position;
    }
  }

  const now = new Date();
  const upcoming: typeof myRegs = [];
  const waitlisted: typeof myRegs = [];
  const past: typeof myRegs = [];
  const cancelled: typeof myRegs = [];

  for (const reg of myRegs) {
    if (['cancelled', 'rejected'].includes(reg.status)) {
      cancelled.push(reg);
    } else if (reg.status === 'waitlisted') {
      waitlisted.push(reg);
    } else {
      if (new Date(reg.event.endsAt) < now) {
        past.push(reg);
      } else {
        upcoming.push(reg);
      }
    }
  }

  // Sort upcoming active first (soonest start)
  upcoming.sort((a, b) => new Date(a.event.startsAt).getTime() - new Date(b.event.startsAt).getTime());
  past.sort((a, b) => new Date(b.event.endsAt).getTime() - new Date(a.event.endsAt).getTime());

  const renderCard = (reg: typeof myRegs[0]) => (
    <div key={reg.id} className="bg-surface/50 border border-border rounded-2xl p-6 flex flex-col md:flex-row gap-6 relative">
      <div className="flex-1 space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium px-2 py-1 bg-surface-alt rounded-md">{reg.event.fest.title}</span>
            <Badge variant="outline" className={`capitalize ${reg.status === 'confirmed' ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/10' : ''}`}>{reg.status}</Badge>
            {reg.status === 'waitlisted' && (
               <Badge variant="outline" className="text-orange-500 border-orange-500/20 bg-orange-500/10 flex gap-1">
                 <Clock className="w-3 h-3" /> Position {waitlistPositions[reg.id]}
               </Badge>
            )}
          </div>
          <h3 className="text-xl font-bold font-heading">{reg.event.title}</h3>
        </div>
        
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-text-muted">
          <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-accent" />{formatDateTime(new Date(reg.event.startsAt), lang)}</div>
          <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-accent" />{reg.event.venue}</div>
          <div className="flex items-center gap-2"><Users className="w-4 h-4 text-accent" />{reg.members.length} {lang === 'bn' ? 'সদস্য' : 'Members'}</div>
          {reg.teamName && <div className="flex items-center gap-2"><Hash className="w-4 h-4 text-accent" />{reg.teamName}</div>}
        </div>
      </div>
      
      <div className="flex flex-col md:items-end justify-between gap-4 border-t border-border md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6 shrink-0">
        <div className="text-left md:text-right">
          <p className="text-xs text-text-muted uppercase font-bold tracking-wider mb-1">{lang === 'bn' ? 'টিকিট কোড' : 'TICKET CODE'}</p>
          <p className="font-mono text-2xl font-black tracking-widest text-accent">{reg.ticketCode}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" asChild size="sm">
            <Link href={`/${lang}/registrations/${reg.id}`}>Manage</Link>
          </Button>
          <Button asChild size="sm">
            <Link href={`/${lang}/registrations/${reg.id}`}>View ticket <ChevronRight className="w-4 h-4 ml-1" /></Link>
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <main className="flex-1 container px-4 md:px-6 py-12">
      <h1 className="text-3xl font-bold font-heading mb-8">{lang === 'bn' ? 'আমার রেজিস্ট্রেশনসমূহ' : 'My Registrations'}</h1>
      
      <div className="space-y-12">
        {upcoming.length > 0 && (
          <section>
            <h2 className="text-xl font-bold mb-4">{lang === 'bn' ? 'আসন্ন ইভেন্ট' : 'Upcoming'}</h2>
            <div className="space-y-4">{upcoming.map(renderCard)}</div>
          </section>
        )}
        
        {waitlisted.length > 0 && (
          <section>
            <h2 className="text-xl font-bold mb-4">{lang === 'bn' ? 'ওয়েটলিস্টে থাকা ইভেন্ট' : 'Waitlisted'}</h2>
            <div className="space-y-4">{waitlisted.map(renderCard)}</div>
          </section>
        )}

        {past.length > 0 && (
          <section>
            <h2 className="text-xl font-bold mb-4 text-text-muted">{lang === 'bn' ? 'অতীত ইভেন্ট' : 'Past'}</h2>
            <div className="space-y-4 opacity-75">{past.map(renderCard)}</div>
          </section>
        )}

        {cancelled.length > 0 && (
          <section>
            <h2 className="text-xl font-bold mb-4 text-danger/80">{lang === 'bn' ? 'বাতিলকৃত' : 'Cancelled / Rejected'}</h2>
            <div className="space-y-4 opacity-75">{cancelled.map(renderCard)}</div>
          </section>
        )}
      </div>
    </main>
  );
}
