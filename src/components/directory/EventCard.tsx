import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, formatRelativeCloses, formatNumber, formatParticipation, formatCapacityUnit } from "@/lib/format";
import { Code, Brain, Globe, Bot, Gamepad2, Wrench, HelpCircle, Rocket, Sparkles } from "lucide-react";

export const CATEGORY_ICONS: Record<string, React.ElementType> = {
  programming: Code,
  ai_ml: Brain,
  web_dev: Globe,
  robotics: Bot,
  gaming: Gamepad2,
  workshop: Wrench,
  quiz: HelpCircle,
  hackathon: Rocket,
  other: Sparkles
};

export function StatusBadge({ state, dict }: { state: string, dict: any }) {
  let label = '';
  let variant: 'default' | 'primary' | 'secondary' | 'danger' | 'success' | 'warning' = 'default';

  switch (state) {
    case 'open':
      label = dict.statusOpen;
      variant = 'success';
      break;
    case 'closing_soon':
      label = dict.statusClosingSoon;
      variant = 'warning';
      break;
    case 'waitlist':
      label = dict.statusWaitlist;
      variant = 'secondary';
      break;
    case 'full':
      label = dict.statusFull;
      variant = 'danger';
      break;
    case 'closed':
      label = dict.statusClosed;
      variant = 'default';
      break;
    case 'ended':
      label = dict.statusEnded;
      variant = 'default';
      break;
    case 'not_open':
      label = dict.statusNotOpen;
      variant = 'default';
      break;
    case 'cancelled':
      label = dict.statusCancelled;
      variant = 'danger';
      break;
  }

  return <Badge variant={variant as any}>{label}</Badge>;
}

import { TiltCard } from "@/components/fx/TiltCard";

export function EventCard({ event, lang, dict }: { event: any, lang: string, dict: any }) {
  const Icon = CATEGORY_ICONS[event.category] || Sparkles;
  
  const isTeam = event.participationType === 'team';
  const participationText = formatParticipation(isTeam, event.teamMinSize, event.teamMaxSize, lang);

  const seatsLeftText = event.state === 'waitlist' ? dict.waitlistOpen : event.state === 'full' ? dict.full : `${formatNumber(event.seatsLeft, lang)} ${formatCapacityUnit(isTeam, lang)}`;

  return (
    <Link href={`/${lang}/fests/${event.fest.slug}/events/${event.slug}`} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-2xl h-full">
      <TiltCard className="h-full">
        <Card className="h-full p-6 flex flex-col gap-4 hover:shadow-lg transition-all group">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2 text-xs font-medium text-text-muted">
              <Icon className="w-4 h-4" />
              <span>{dict.categories[event.category]}</span>
              <span className="text-border px-1">•</span>
              <span className="truncate max-w-[120px]">{event.fest.title}</span>
            </div>
            <StatusBadge state={event.state} dict={dict} />
          </div>

          <div>
            <h3 className="text-lg font-heading font-bold line-clamp-2 group-hover:text-accent transition-colors">{event.title}</h3>
            <p className="text-sm text-text-muted line-clamp-2 mt-1">{event.shortDescription}</p>
          </div>

          <div className="mt-auto grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-text-muted">{dict.dateTime}</p>
              <p className="font-medium truncate">{formatDateTime(new Date(event.startsAt), lang)}</p>
            </div>
            <div>
              <p className="text-text-muted">{dict.venue}</p>
              <p className="font-medium truncate">{event.venue}</p>
            </div>
            <div>
              <p className="text-text-muted">{dict.participation}</p>
              <p className="font-medium">{participationText}</p>
            </div>
            <div>
              <p className="text-text-muted">{dict.seats}</p>
              <p className="font-medium truncate">{seatsLeftText}</p>
            </div>
          </div>

          <div className="pt-4 border-t border-border flex items-center justify-between mt-2">
            <span className="text-xs text-text-muted">
              {event.state === 'closed' || event.state === 'ended' ? dict.registrationClosed : formatRelativeCloses(new Date(event.registrationDeadline), lang)}
            </span>
            <span className="text-sm font-medium text-accent group-hover:underline">{dict.viewEvent}</span>
          </div>
        </Card>
      </TiltCard>
    </Link>
  );
}

