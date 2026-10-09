import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { RegistrationForm } from '@/components/registration/RegistrationForm';
import { getCurrentUser } from '@/server/auth';
import { formatDateTime } from '@/lib/format';
import { classLevels, type MemberInput } from '@/lib/validation/registration';
import { getRegistrationLabels } from '@/i18n/registration';

import { db } from '@/db/client';

export async function RegistrationSlot({ eventId, state, opensAt, lang, pathname, participationType, teamMinSize, teamMaxSize }: {
  eventId: string; state: string; opensAt: Date | null; lang: string; pathname: string;
  participationType: 'individual' | 'team'; teamMinSize: number; teamMaxSize: number;
}) {
  const labels = getRegistrationLabels(lang);
  if (['cancelled', 'ended', 'closed', 'full', 'not_open'].includes(state)) {
    return <div className="rounded-xl border border-border p-4 text-center text-text-muted">
      <p>{state === 'full' ? labels.full : state === 'not_open' ? labels.notOpen : labels.closed}</p>
      {state === 'not_open' && opensAt && <p>{labels.opensAt}: {formatDateTime(opensAt, lang)}</p>}
    </div>;
  }
  const user = await getCurrentUser();
  if (!user) return <div className="rounded-xl border border-border p-4 text-center">
    <h3 className="mb-4 text-lg font-bold">{labels.loginTitle}</h3>
    <div className="flex flex-wrap justify-center gap-3">
      <Button asChild><Link href={`/${lang}/login?next=${encodeURIComponent(pathname)}`}>{labels.login}</Link></Button>
      <Button variant="secondary" asChild><Link href={`/${lang}/signup?next=${encodeURIComponent(pathname)}`}>{labels.signup}</Link></Button>
    </div>
  </div>;
  if (user.role !== 'participant') return <p className="rounded-xl border border-border bg-surface/50 p-4 text-text-muted" role="status">
    {labels.errors.PARTICIPANT_ONLY}
  </p>;
  const leader: MemberInput = {
    fullName: user.fullName, email: user.email, phone: user.phone ?? '', institution: user.institution ?? '',
    classLevel: classLevels.find(level => level === user.classLevel) ?? '10', studentId: user.studentId ?? '',
  };
  
  const houses = await db.query.houses.findMany({
    orderBy: (houses, { asc }) => [asc(houses.name)]
  });

  return <div>
    <h3 className="text-xl font-bold">{labels.title}</h3>
    <RegistrationForm eventId={eventId} lang={lang} participationType={participationType}
      teamMinSize={teamMinSize} teamMaxSize={teamMaxSize} labels={labels} leader={leader} houses={houses} />
  </div>;
}
