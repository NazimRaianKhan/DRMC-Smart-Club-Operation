import { notFound } from 'next/navigation';
import { getFestBySlug } from '@/server/queries/events';
import { getDictionary } from '@/i18n';
import { EventCard } from '@/components/directory/EventCard';
import { formatDate } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { connection } from 'next/server';

type Props = {
  params: Promise<{ lang: 'en' | 'bn'; slug: string }>;
};

export default async function FestContent({ params }: Props) {
  await connection();
  const { lang, slug } = await params;
  const dict = await getDictionary(lang);
  const data = await getFestBySlug(slug, lang);

  if (!data) {
    notFound();
  }

  const { fest, eventsList } = data;
  
  const now = new Date();
  const isPast = new Date(fest.endsAt) < now;
  const isHappening = new Date(fest.startsAt) <= now && !isPast;
  const isUpcoming = new Date(fest.startsAt) > now;

  let statusLabel = '';
  if (isHappening) statusLabel = lang === 'bn' ? 'চলছে' : 'Happening now';
  else if (isUpcoming) statusLabel = lang === 'bn' ? 'আসন্ন' : 'Upcoming';
  else statusLabel = lang === 'bn' ? 'শেষ হয়েছে' : 'Ended';

  const categoryCounts = eventsList.reduce((acc, ev) => {
    acc[ev.category] = (acc[ev.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: fest.title,
    startDate: fest.startsAt,
    endDate: fest.endsAt,
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
    location: {
      '@type': 'Place',
      name: fest.venue,
    },
    description: fest.description,
  };

  return (
    <main className="flex-1 pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {/* Header */}
      <section className="bg-surface/50 border-b border-border py-12" style={{ borderTop: `4px solid var(--${fest.accent}-400)` }}>
        <div className="container px-4 md:px-6">
          <nav className="flex items-center text-sm text-text-muted mb-6">
            <Link href={`/${lang}/fests`} className="hover:text-text transition-colors">
              {dict.common.fests}
            </Link>
            <ChevronRight className="w-4 h-4 mx-1" />
            <span className="text-text font-medium">{fest.title}</span>
          </nav>
          
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-4xl md:text-5xl font-bold font-heading">{fest.title}</h1>
                <Badge variant={(isHappening ? 'success' : isUpcoming ? 'secondary' : 'default') as any} className="mt-2 md:mt-0">
                  {statusLabel}
                </Badge>
              </div>
              <p className="text-xl text-text-muted mb-6">{fest.tagline}</p>
              
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-text mb-6">
                <div>
                  <span className="text-text-muted">{lang === 'bn' ? 'তারিখ:' : 'Dates:'} </span>
                  <span className="font-medium">{formatDate(new Date(fest.startsAt), lang)} - {formatDate(new Date(fest.endsAt), lang)}</span>
                </div>
                <div>
                  <span className="text-text-muted">{lang === 'bn' ? 'ভেন্যু:' : 'Venue:'} </span>
                  <span className="font-medium">{fest.venue}</span>
                </div>
              </div>
              
              <div className="prose dark:prose-invert max-w-none">
                {fest.description.split('\n\n').map((para: string, i: number) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Events List */}
      <section className="py-12">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <h2 className="text-2xl font-bold">
              {lang === 'bn' ? `ইভেন্টসমূহ (${eventsList.length})` : `Events in this fest (${eventsList.length})`}
            </h2>
            
            {/* Category summary */}
            {Object.keys(categoryCounts).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {Object.entries(categoryCounts).map(([cat, count]) => (
                  <Link key={cat} href={`/${lang}/fests?fest=${fest.slug}&category=${cat}`}>
                    <Badge variant="outline" className="hover:bg-accent/10 hover:text-accent transition-colors cursor-pointer">
                      {dict.directory.categories[cat as keyof typeof dict.directory.categories] || cat} ({count as number})
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {eventsList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {eventsList.map((ev: any) => (
                <EventCard key={ev.id} event={ev} lang={lang} dict={dict.directory} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-surface/30 rounded-2xl border border-border">
              <p className="text-text-muted">{lang === 'bn' ? 'এই ফেস্টে কোনো ইভেন্ট পাওয়া যায়নি।' : 'No events found in this fest.'}</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

