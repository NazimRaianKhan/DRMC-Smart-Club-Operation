import { requireUser } from '@/server/auth';
import { db } from '@/db/client';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { SecurityForm } from '@/components/profile/SecurityForm';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ lang: 'en' | 'bn' }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  return { title: lang === 'bn' ? 'প্রোফাইল সেটিংস' : 'Profile Settings' };
}

export default async function ProfilePage({ params }: Props) {
  const { lang } = await params;
  const session = await requireUser();
  
  const user = await db.query.users.findFirst({
    where: eq(users.id, session.sub)
  });

  if (!user) {
    redirect(`/${lang}/login`);
  }

  return (
    <main className="flex-1 container px-4 md:px-6 py-12">
      <h1 className="text-3xl font-bold font-heading mb-8">{lang === 'bn' ? 'প্রোফাইল সেটিংস' : 'Profile Settings'}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-1 space-y-2">
          {/* A simple CSS-based tab system could be used, or just lay them out one after the other. 
              Since prompt says "Profile settings page with two tabs", I will use native details/summary or a client tab component.
              Actually, the easiest way to make tabs without a new client wrapper is to use standard layout.
              Wait, I can just render them in sections.
           */}
          <a href="#profile" className="block p-3 rounded-lg bg-surface font-medium hover:bg-surface-alt transition-colors">
            {lang === 'bn' ? 'প্রোফাইল' : 'Profile'}
          </a>
          <a href="#security" className="block p-3 rounded-lg bg-surface font-medium hover:bg-surface-alt transition-colors">
            {lang === 'bn' ? 'নিরাপত্তা' : 'Security'}
          </a>
        </div>
        
        <div className="md:col-span-3 space-y-12">
          <section id="profile" className="bg-surface/50 p-6 md:p-8 rounded-2xl border border-border scroll-mt-24">
            <h2 className="text-2xl font-bold mb-6 font-heading">{lang === 'bn' ? 'প্রোফাইল' : 'Profile'}</h2>
            <ProfileForm user={user} lang={lang} />
          </section>

          <section id="security" className="bg-surface/50 p-6 md:p-8 rounded-2xl border border-border scroll-mt-24">
            <h2 className="text-2xl font-bold mb-6 font-heading">{lang === 'bn' ? 'নিরাপত্তা' : 'Security'}</h2>
            <SecurityForm lang={lang} />
          </section>
        </div>
      </div>
    </main>
  );
}
