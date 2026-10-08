import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/server/auth';

export default async function RegistrationsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/${lang}/login?next=/${lang}/me/registrations`);
  if (user.role !== 'participant') redirect(`/${lang}/forbidden`);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-heading font-bold mb-6">My Registrations</h1>
      <p className="text-[var(--text-muted)]">Placeholder for Registrations page.</p>
    </div>
  );
}

