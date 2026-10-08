import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/server/auth';

export const instant = false;

export default async function OrganizerLayout({ children, params }: {
  children: React.ReactNode; params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/${lang}/login`);
  if (!['organizer', 'admin'].includes(user.role)) redirect(`/${lang}/forbidden`);
  return <>{children}</>;
}
