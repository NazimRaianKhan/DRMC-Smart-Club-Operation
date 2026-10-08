import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/server/auth';

export const instant = false;

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/${lang}/login?next=/${lang}/admin`);
  if (user.role !== 'admin') redirect(`/${lang}/forbidden`);

  return <>{children}</>;
}

