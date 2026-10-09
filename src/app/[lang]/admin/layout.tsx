import { requireRole, UnauthenticatedError, ForbiddenError } from '@/server/auth';
import Link from 'next/link';
import { Calendar, LayoutDashboard, Ticket, Users, QrCode, Trophy } from 'lucide-react';
import { redirect } from 'next/navigation';
import { db } from '@/db/client';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const instant = false;

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  
  let session;
  try {
    session = await requireRole(['organizer', 'admin']);
  } catch (e) {
    if (e instanceof UnauthenticatedError) redirect(`/${lang}/login`);
    if (e instanceof ForbiddenError) redirect(`/${lang}/forbidden`);
    throw e;
  }
  
  const user = await db.query.users.findFirst({
    where: eq(users.id, session.sub)
  });

  if (!user) {
    redirect(`/${lang}/login`);
  }

  const navItems = [
    { href: `/${lang}/admin`, label: 'Dashboard', icon: LayoutDashboard },
    { href: `/${lang}/admin/fests`, label: 'Fests', icon: Calendar },
    { href: `/${lang}/admin/events`, label: 'Events', icon: Ticket },
    { href: `/${lang}/admin/participants`, label: 'Participants', icon: Users },
    { href: `/${lang}/admin/check-in`, label: 'Check-in', icon: QrCode },
    { href: `/${lang}/admin/house-cup`, label: 'House Cup', icon: Trophy }, // Scanner/Check-in
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-surface/50 border-r border-border shrink-0 md:h-screen sticky top-0">
        <div className="p-6 border-b border-border flex items-center justify-between md:justify-start">
          <Link href={`/${lang}/admin`} className="font-heading font-black text-xl text-accent">
            TECH CARNIVAL<span className="text-text opacity-50 block text-xs tracking-widest uppercase">Admin</span>
          </Link>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map(item => (
            <Link key={item.href} href={item.href} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-alt transition-colors font-medium">
              <item.icon className="w-5 h-5 text-text-muted" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <header className="h-16 bg-surface/30 border-b border-border px-6 flex items-center justify-end sticky top-0 backdrop-blur-md z-10">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">{user.fullName}</span>
            <form action="/api/auth/logout" method="POST">
              <button type="submit" className="text-sm font-medium text-destructive hover:underline">
                Log out
              </button>
            </form>
          </div>
        </header>
        
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

