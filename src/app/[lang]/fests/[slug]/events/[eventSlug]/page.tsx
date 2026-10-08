import { notFound } from 'next/navigation';
import { getCachedEventBySlug } from '@/server/queries/events';
import { getDictionary } from '@/i18n';
import { formatDateTime, formatRelativeCloses, formatParticipation, formatCapacityUnit } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { StatusBadge, CATEGORY_ICONS } from '@/components/directory/EventCard';
import { AvailabilityLive } from './AvailabilityLive';
import { RegistrationSlot } from './RegistrationSlot';
import Link from 'next/link';
import { ChevronRight, Calendar, MapPin, Users, Clock, Info } from 'lucide-react';
import type { Metadata } from 'next';
import { unstable_cache } from 'next/cache';
import { Suspense } from 'react';

type Props = {
  params: Promise<{ lang: 'en' | 'bn'; slug: string; eventSlug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug, eventSlug } = await params;
  const data = await getCachedEventBySlug(eventSlug, lang);
  if (!data || data.fest.slug !== slug) return {};

  return {
    title: `${data.title} | ${data.fest.title}`,
    description: data.shortDescription,
    openGraph: {
      title: `${data.title} | ${data.fest.title}`,
      description: data.shortDescription,
    },
  };
}

export const instant = false;

import { connection } from 'next/server';

export default async function EventPage({ params }: Props) {
  await connection();
  const { lang, slug, eventSlug } = await params;
  const dict = await getDictionary(lang);
  const event = await getCachedEventBySlug(eventSlug, lang);

  if (!event || event.fest.slug !== slug) {
    notFound();
  }

  const Icon = CATEGORY_ICONS[event.category] || Info;
  const isTeam = event.participationType === 'team';
  const durationMs = new Date(event.endsAt).getTime() - new Date(event.startsAt).getTime();
  const durationHrs = Math.round(durationMs / (1000 * 60 * 60) * 10) / 10;
  
  const currentPath = `/${lang}/fests/${slug}/events/${eventSlug}`;

  const getCachedNow = unstable_cache(
    async () => Date.now(),
    ["current-time"],
    { tags: ["fests", "events"], revalidate: 3600 }
  );

  const initialAvailability = {
    capacity: event.capacity,
    confirmedCount: event.confirmedCount,
    seatsLeft: event.seatsLeft,
    waitlistCount: 0,
    state: event.state,
    serverTime: await getCachedNow(),
  };

  return (
    <main className="flex-1 pb-32">
      {/* Hero Section */}
      <section className="bg-surface/50 border-b border-border py-12" style={{ borderTop: `4px solid var(--${event.fest.accent}-400)` }}>
        <div className="container px-4 md:px-6">
          <nav className="flex flex-wrap items-center text-sm text-text-muted mb-6 gap-1">
            <Link href={`/${lang}/fests`} className="hover:text-text transition-colors whitespace-nowrap">
              {dict.common.fests}
            </Link>
            <ChevronRight className="w-4 h-4 shrink-0" />
            <Link href={`/${lang}/fests/${slug}`} className="hover:text-text transition-colors whitespace-nowrap truncate max-w-[150px] md:max-w-[200px]">
              {event.fest.title}
            </Link>
            <ChevronRight className="w-4 h-4 shrink-0" />
            <span className="text-text font-medium truncate max-w-[150px] md:max-w-[200px]">{event.title}</span>
          </nav>
          
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1 bg-surface border-border">
                <Icon className="w-3.5 h-3.5 text-accent" />
                {dict.directory.categories[event.category] || event.category}
              </Badge>
              <StatusBadge state={event.state} dict={dict.directory} />
            </div>
            
            <h1 className="text-3xl md:text-5xl font-bold font-heading">{event.title}</h1>
            
            <p className="text-xl text-text-muted max-w-3xl">
              {event.shortDescription}
            </p>
          </div>
        </div>
      </section>

      {/* Cancelled Banner */}
      {event.status === 'cancelled' && (
        <div className="bg-danger/10 border-y border-danger/20 py-4 px-4 md:px-6">
          <div className="container text-danger font-medium flex items-center justify-center gap-2">
            <Info className="w-5 h-5" />
            {lang === 'bn' ? 'এই ইভেন্টটি বাতিল করা হয়েছে।' : 'This event has been cancelled.'}
          </div>
        </div>
      )}

      <div className="container px-4 md:px-6 py-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          {/* Event description */}
          <section>
            <h2 className="text-2xl font-bold mb-6 font-heading">
              {lang === 'bn' ? 'ইভেন্ট সম্পর্কিত তথ্য' : 'Event description'}
            </h2>
            <div className="prose dark:prose-invert max-w-none text-text-muted space-y-4">
              {event.description.split(/\n\s*\n/).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </section>

          <hr className="border-border" />

          {/* Date & time */}
          <section>
            <h2 className="text-2xl font-bold mb-6 font-heading flex items-center gap-2">
              <Calendar className="w-6 h-6 text-accent" />
              {lang === 'bn' ? 'তারিখ ও সময়' : 'Date & time'}
            </h2>
            <div className="bg-surface/50 border border-border p-6 rounded-2xl grid sm:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-text-muted mb-1">{lang === 'bn' ? 'শুরু' : 'Starts at'}</p>
                <p className="font-medium">{formatDateTime(new Date(event.startsAt), lang)}</p>
              </div>
              <div>
                <p className="text-sm text-text-muted mb-1">{lang === 'bn' ? 'শেষ' : 'Ends at'}</p>
                <p className="font-medium">{formatDateTime(new Date(event.endsAt), lang)}</p>
              </div>
              <div className="sm:col-span-2 flex justify-between items-center pt-4 border-t border-border mt-2">
                <span className="text-sm text-text-muted flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> {durationHrs} {lang === 'bn' ? 'ঘণ্টা' : 'hours'}
                </span>
                <span className="text-xs font-medium px-2 py-1 bg-surface border border-border rounded-md">
                  Dhaka time (GMT+6)
                </span>
              </div>
            </div>
          </section>

          {/* Venue */}
          <section>
            <h2 className="text-2xl font-bold mb-6 font-heading flex items-center gap-2">
              <MapPin className="w-6 h-6 text-accent" />
              {lang === 'bn' ? 'ভেন্যু' : 'Venue'}
            </h2>
            <div className="bg-surface/50 border border-border p-6 rounded-2xl">
              <p className="font-medium text-lg">{event.venue}</p>
              <p className="text-text-muted mt-2">{event.fest.title}</p>
            </div>
          </section>

          {/* FAQ */}
          {(event.faq as any[]) && (event.faq as any[]).length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-6 font-heading">
                {lang === 'bn' ? 'সাধারণ জিজ্ঞাসা' : 'FAQ'}
              </h2>
              <div className="space-y-4">
                {(event.faq as any[]).map((item: any, i: number) => (
                  <details key={i} className="group bg-surface/50 border border-border rounded-xl [&_summary::-webkit-details-marker]:hidden">
                    <summary className="flex items-center justify-between cursor-pointer p-6 font-medium">
                      {item.question}
                      <span className="transition group-open:rotate-180">
                        <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                      </span>
                    </summary>
                    <div className="px-6 pb-6 text-text-muted">
                      {item.answer}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Registration information */}
          <section className="bg-surface/30 border border-border rounded-2xl p-6 sticky top-24">
            <h3 className="text-xl font-bold mb-6 font-heading flex items-center gap-2">
              <Users className="w-5 h-5 text-accent" />
              {lang === 'bn' ? 'রেজিস্ট্রেশন তথ্য' : 'Registration information'}
            </h3>
            
            <dl className="space-y-4 text-sm">
              <div className="flex justify-between py-2 border-b border-border/50">
                <dt className="text-text-muted">{lang === 'bn' ? 'অংশগ্রহণের ধরন' : 'Participation'}</dt>
                <dd className="font-medium text-right">
                  {formatParticipation(isTeam, event.teamMinSize, event.teamMaxSize, lang)}
                </dd>
              </div>
              
              <div className="flex justify-between py-2 border-b border-border/50">
                <dt className="text-text-muted">{lang === 'bn' ? 'আসন সংখ্যা' : 'Capacity'}</dt>
                <dd className="font-medium text-right">
                  {event.capacity} {formatCapacityUnit(isTeam, lang)}
                </dd>
              </div>

              {event.registrationOpensAt && (
                <div className="flex justify-between py-2 border-b border-border/50">
                  <dt className="text-text-muted">{lang === 'bn' ? 'রেজিস্ট্রেশন শুরু' : 'Registration opens'}</dt>
                  <dd className="font-medium text-right">{formatDateTime(new Date(event.registrationOpensAt), lang)}</dd>
                </div>
              )}
              
              <div className="flex justify-between py-2 border-b border-border/50">
                <dt className="text-text-muted">{lang === 'bn' ? 'রেজিস্ট্রেশনের শেষ সময়' : 'Registration deadline'}</dt>
                <dd className="font-medium text-right flex flex-col items-end gap-1">
                  <span>{formatDateTime(new Date(event.registrationDeadline), lang)}</span>
                  <span className="text-xs text-accent">
                    {formatRelativeCloses(new Date(event.registrationDeadline), lang)}
                  </span>
                </dd>
              </div>

              <div className="flex justify-between py-2 border-b border-border/50">
                <dt className="text-text-muted">{lang === 'bn' ? 'ওয়েটলিস্ট' : 'Waitlist enabled'}</dt>
                <dd className="font-medium text-right">{event.waitlistEnabled ? (lang === 'bn' ? 'হ্যাঁ' : 'Yes') : (lang === 'bn' ? 'না' : 'No')}</dd>
              </div>
            </dl>

            <div className="mt-8 pt-6 border-t border-border" id="register-section">
              <AvailabilityLive 
                eventId={event.id}
                initialData={initialAvailability}
                lang={lang}
                isTeam={isTeam}
                dict={dict}
              />

              {event.status !== 'cancelled' && (
                <div className="mt-6">
                  <Suspense fallback={<div className="h-24 animate-pulse rounded-xl bg-surface" />}>
                  <RegistrationSlot 
                    eventId={event.id} 
                    state={event.state} 
                    opensAt={event.registrationOpensAt ? new Date(event.registrationOpensAt) : null}
                    lang={lang}
                    pathname={currentPath}
                    participationType={event.participationType}
                    teamMinSize={event.teamMinSize}
                    teamMaxSize={event.teamMaxSize}
                  />
                  </Suspense>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
      
      {/* Sticky Mobile Action Bar */}
      {event.status !== 'cancelled' && ['open', 'waitlist', 'closing_soon'].includes(event.state) && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-bg/90 backdrop-blur-md border-t border-border md:hidden z-50 flex items-center justify-between pb-safe">
          <div className="flex flex-col">
            <span className="text-xs text-text-muted">{lang === 'bn' ? 'অবস্থা' : 'Status'}</span>
            <span className="font-bold text-sm truncate max-w-[150px]"><StatusBadge state={event.state} dict={dict.directory} /></span>
          </div>
          <Link href="#register-section" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-accent text-bg hover:bg-accent/90 h-10 px-6 font-bold shadow-md">
            {lang === 'bn' ? 'রেজিস্ট্রেশন করুন' : 'Register'}
          </Link>
        </div>
      )}
    </main>
  );
}
