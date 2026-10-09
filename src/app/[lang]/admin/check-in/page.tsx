import { notFound, redirect } from 'next/navigation';
import { requireRole } from '@/server/auth';
import { getDictionary } from '@/i18n';
import { db } from '@/db/client';
import { events } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { ScannerWrapper } from '@/components/admin/ScannerWrapper';

export const instant = false;

type Props = { params: Promise<{ lang: 'en' | 'bn' }> };

export default async function CheckInPage({ params }: Props) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  // Get active events for the dropdown
  const activeEvents = await db.query.events.findMany({
    where: and(
      eq(events.status, 'published')
    ),
    orderBy: (events, { desc }) => [desc(events.startsAt)]
  });

  return (
    <main className="flex-1 pb-32">
      <div className="container max-w-2xl px-4 md:px-6 py-12">
        <h1 className="text-3xl font-bold font-heading mb-8">
          {lang === 'bn' ? 'অংশগ্রহণকারী চেক-ইন' : 'Participant Check-in'}
        </h1>
        
        <ScannerWrapper events={activeEvents} lang={lang} />
      </div>
    </main>
  );
}

