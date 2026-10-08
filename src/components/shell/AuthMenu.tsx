"use client";

import Link from "next/link";
import { User } from "lucide-react";
import { Button } from "../ui/button";

export function AuthMenu({ dict, lang, account }: {
  dict: Record<string, string>; lang: string; account: { name: string; role: string } | null;
}) {

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      // force reload to clear cached protected pages
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = `/${lang}`;
    } catch {
      // ignore
    }
  };

  if (!account) {
    return (
      <Button variant="primary" size="sm" asChild>
        <Link href={`/${lang}/login`}>{dict.login}</Link>
      </Button>
    );
  }

  const { name, role } = account;

  return (
    <div className="relative group">
      <Button variant="ghost" size="sm" className="gap-2">
        <User className="w-4 h-4" />
        <span className="hidden sm:inline-block max-w-[100px] truncate">{name}</span>
      </Button>
      
      <div className="absolute right-0 mt-2 w-48 rounded-md border border-border bg-[var(--surface)] shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all flex flex-col z-50">
        {role === 'participant' && <Link href={`/${lang}/me/registrations`} className="px-4 py-2 text-sm hover:bg-[var(--surface-2)]">{dict.myRegistrations}</Link>}
        <Link href={`/${lang}/me/profile`} className="px-4 py-2 text-sm hover:bg-[var(--surface-2)]">{dict.myProfile}</Link>
        {role === 'admin' && (
          <Link href={`/${lang}/admin`} className="px-4 py-2 text-sm hover:bg-[var(--surface-2)] border-t border-border">{dict.admin}</Link>
        )}
        <button onClick={handleLogout} className="px-4 py-2 text-sm text-left text-[var(--danger)] hover:bg-[var(--danger)]/10 border-t border-border">{dict.logout}</button>
      </div>
    </div>
  );
}
