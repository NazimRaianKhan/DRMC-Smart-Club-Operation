import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";

import { TiltCard } from "@/components/fx/TiltCard";

export function FestCard({ fest, lang, eventsCount, now }: { fest: any, lang: string, eventsCount: number, now?: number }) {
  const currentTime = now ? new Date(now) : new Date();
  const isPast = new Date(fest.endsAt) < currentTime;
  const isHappening = new Date(fest.startsAt) <= currentTime && !isPast;
  const isUpcoming = new Date(fest.startsAt) > currentTime;

  const statusLabel = isHappening ? (lang === 'bn' ? 'চলছে' : 'Happening now') : (isUpcoming ? (lang === 'bn' ? 'আসন্ন' : 'Upcoming') : (lang === 'bn' ? 'শেষ হয়েছে' : 'Ended'));

  return (
    <Link href={`/${lang}/fests/${fest.slug}`} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-2xl h-full">
      <TiltCard className="h-full">
        <Card className={`h-full border-t-4 hover:shadow-lg transition-all group`} style={{ borderTopColor: `var(--${fest.accent}-400)` }}>
          <div className="p-6 flex flex-col h-full gap-4">
            <div>
              <div className="flex justify-between items-start gap-2 mb-2">
                <h3 className="text-xl font-heading font-bold line-clamp-2 group-hover:text-accent transition-colors">{lang === 'bn' && fest.titleBn ? fest.titleBn : fest.title}</h3>
                <Badge variant={(isHappening ? 'success' : isUpcoming ? 'secondary' : 'default') as any}>
                  {statusLabel}
                </Badge>
              </div>
              <p className="text-sm text-text-muted">{lang === 'bn' && fest.taglineBn ? fest.taglineBn : fest.tagline}</p>
            </div>
            
            <div className="mt-auto pt-4 border-t border-border flex flex-wrap gap-x-4 gap-y-2 text-xs text-text-muted">
              <div>
                <span className="font-medium text-text">{formatDate(new Date(fest.startsAt), lang)}</span>
              </div>
              <div>
                <span className="font-medium text-text">{fest.venue}</span>
              </div>
              {eventsCount > 0 && (
                <div>
                  <span className="font-medium text-text">{eventsCount}</span> {lang === 'bn' ? 'টি ইভেন্ট' : 'events'}
                </div>
              )}
            </div>
          </div>
        </Card>
      </TiltCard>
    </Link>
  );
}

