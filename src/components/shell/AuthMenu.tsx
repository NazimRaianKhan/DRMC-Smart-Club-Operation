"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User } from "lucide-react";
import { Button } from "../ui/button";

export function AuthMenu({ dict, lang }: { dict: Record<string, string>; lang: string }) {
  const [hint, setHint] = useState<{ name: string; role: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Read the non-sensitive drmc_hint cookie
    const match = document.cookie.match(new RegExp('(^| )drmc_hint=([^;]+)'));
    if (match?.[2]) {
      try {
        const decoded = decodeURIComponent(match[2]);
        setHint(JSON.parse(decoded));
      } catch {
        // ignore
      }
    }
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      // clear local state
      setHint(null);
      // force reload to clear cached protected pages
      window.location.href = `/${lang}`;
    } catch (e) {
      // ignore
    }
  };

  if (!hint) {
    return (
      <Button variant="primary" size="sm" asChild>
        <Link href={`/${lang}/login`}>{dict.login}</Link>
      </Button>
    );
  }

  const { name, role } = hint;

  return (
    <div className="relative group">
      <Button variant="ghost" size="sm" className="gap-2">
        <User className="w-4 h-4" />
        <span className="hidden sm:inline-block max-w-[100px] truncate">{name}</span>
      </Button>
      
      <div className="absolute right-0 mt-2 w-48 rounded-md border border-border bg-[var(--surface)] shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all flex flex-col z-50">
        <Link href={`/${lang}/me/registrations`} className="px-4 py-2 text-sm hover:bg-[var(--surface-2)]">{dict.myRegistrations}</Link>
        <Link href={`/${lang}/me/profile`} className="px-4 py-2 text-sm hover:bg-[var(--surface-2)]">{dict.myProfile}</Link>
        {(role === 'organizer' || role === 'admin') && (
          <Link href={`/${lang}/admin`} className="px-4 py-2 text-sm hover:bg-[var(--surface-2)] border-t border-border">{dict.admin}</Link>
        )}
        <button onClick={handleLogout} className="px-4 py-2 text-sm text-left text-[var(--danger)] hover:bg-[var(--danger)]/10 border-t border-border">{dict.logout}</button>
      </div>
    </div>
  );
}
