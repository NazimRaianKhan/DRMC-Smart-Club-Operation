import { notFound, redirect } from 'next/navigation';
import { connection } from 'next/server';
import { z } from 'zod';
import { db } from '@/db/client';
import { registrations } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { getCurrentUser } from '@/server/auth';
import { getWaitlistPosition } from '@/server/registrations';
import { formatDateTime } from '@/lib/format';
import { CheckCircle2, Clock, Calendar, MapPin, Users, Hash, User } from 'lucide-react';
import type { Metadata } from 'next';
import { Badge } from '@/components/ui/badge';

export const instant = false;

type Props = { params: Promise<{ lang: 'en' | 'bn'; id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  return {
    title: lang === 'bn' ? 'রেজিস্ট্রেশন নিশ্চিতকরণ' : 'Registration Confirmation',
  };
}

export default async function RegistrationPage({ params }: Props) {
  await connection();
  const { lang, id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/${lang}/login?next=${encodeURIComponent(`/${lang}/registrations/${id}`)}`);
  if (!z.string().uuid().safeParse(id).success) notFound();
  const isPrivileged = ['organizer', 'admin'].includes(user.role);

  const registration = await db.query.registrations.findFirst({
    where: and(eq(registrations.id, id), isPrivileged ? undefined : eq(registrations.userId, user.id)),
    with: {
      event: {
        with: {
          fest: true
        }
      },
      members: { orderBy: (member, { desc, asc }) => [desc(member.isLeader), asc(member.createdAt), asc(member.id)] },
    }
  });

  if (!registration) {
    notFound();
  }

  const { event, members } = registration;
  const { fest } = event;

  const isConfirmed = registration.status === 'confirmed' || registration.status === 'checked_in';
  const isWaitlisted = registration.status === 'waitlisted';
  const waitlistPosition = isWaitlisted ? await getWaitlistPosition(id) : null;

  return (
    <main className="flex-1 pb-32">
      <div className="container max-w-3xl px-4 md:px-6 py-12">
        
        {/* Banner */}
        {isConfirmed && (
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 p-6 rounded-2xl flex flex-col md:flex-row items-center md:items-start gap-4 mb-8 text-center md:text-left">
            <CheckCircle2 className="w-12 h-12 shrink-0" />
            <div>
              <h1 className="text-2xl font-bold font-heading mb-1">
                {lang === 'bn' ? 'আপনার সিট কনফার্মড!' : "You're in!"}
              </h1>
              <p className="opacity-90">
                {lang === 'bn' ? 'ইভেন্টে আপনার রেজিস্ট্রেশন সফলভাবে সম্পন্ন হয়েছে।' : 'Your registration for this event is confirmed.'}
              </p>
            </div>
          </div>
        )}

        {isWaitlisted && (
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 p-6 rounded-2xl flex flex-col md:flex-row items-center md:items-start gap-4 mb-8 text-center md:text-left">
            <Clock className="w-12 h-12 shrink-0" />
            <div>
              <h1 className="text-2xl font-bold font-heading mb-1">
                {lang === 'bn' ? 'আপনি ওয়েটলিস্টে আছেন' : "You're on the waitlist"}
              </h1>
              <p className="opacity-90">
                {lang === 'bn' ? 'আসন ফাঁকা হলে আপনাকে জানানো হবে।' : 'We will notify you if a spot opens up.'}
              </p>
            </div>
          </div>
        )}

        {isWaitlisted && <p className="mb-6 text-lg font-bold" data-testid="waitlist-position">
          {lang === 'bn' ? 'অপেক্ষমাণ তালিকায় অবস্থান' : 'Waitlist position'}: {waitlistPosition}
        </p>}
        {!isConfirmed && !isWaitlisted && <h1 className="mb-6 text-2xl font-bold">
          {registration.status === 'cancelled' ? (lang === 'bn' ? 'রেজিস্ট্রেশন বাতিল' : 'Registration cancelled') : (lang === 'bn' ? 'রেজিস্ট্রেশন প্রত্যাখ্যাত' : 'Registration rejected')}
        </h1>}
        <div className="bg-surface/50 border border-border rounded-2xl p-6 md:p-8 space-y-8">
          
          {/* Ticket Code */}
          <div className="text-center space-y-2 border-b border-border pb-8">
            <p className="text-text-muted text-sm uppercase tracking-widest font-bold">
              {lang === 'bn' ? 'টিকিট কোড' : 'TICKET CODE'}
            </p>
            <div className="font-mono text-3xl sm:text-5xl md:text-6xl font-black tracking-widest text-accent">
              {registration.ticketCode}
            </div>
          </div>

          {/* Event Summary */}
          <div className="space-y-6 border-b border-border pb-8">
            <div>
              <p className="text-sm text-text-muted font-medium mb-1">{lang === 'bn' ? fest.titleBn || fest.title : fest.title}</p>
              <h2 className="text-2xl font-bold font-heading">{lang === 'bn' ? event.titleBn || event.title : event.title}</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">{formatDateTime(new Date(event.startsAt), lang)}</p>
                  <p className="text-xs text-text-muted">To {formatDateTime(new Date(event.endsAt), lang)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">{event.venue}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Team / Members */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold font-heading flex items-center gap-2">
              <Users className="w-5 h-5 text-accent" />
              {lang === 'bn' ? 'অংশগ্রহণকারী' : 'Participants'}
            </h3>
            
            {registration.teamName && (
              <div className="bg-surface p-4 rounded-xl border border-border flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                  <Hash className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-text-muted">{lang === 'bn' ? 'দলের নাম' : 'Team Name'}</p>
                  <p className="font-bold">{registration.teamName}</p>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {members.map((member) => (
                <div key={member.id} className="p-4 rounded-xl border border-border bg-surface/30 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-surface-alt flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-text-muted" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="font-medium truncate">{member.fullName}</p>
                      {member.isLeader && (
                        <Badge variant="outline" className="text-xs py-0 h-5">{lang === 'bn' ? 'দলনেতা' : 'Leader'}</Badge>
                      )}
                    </div>
                    <div className="text-sm text-text-muted grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                      <p className="truncate">{member.email}</p>
                      {member.phone && <p>{member.phone}</p>}
                      <p className="truncate">{member.institution}</p>
                      <p>{lang === 'bn' ? 'শ্রেণি' : 'Class'} {member.classLevel}</p>
                      {member.studentId && <p>{lang === 'bn' ? 'শিক্ষার্থী আইডি' : 'Student ID'}: {member.studentId}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}

