"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { User } from "lucide-react";
import { Button } from "../ui/button";

export function AuthMenu({ dict, lang }: { dict: Record<string, string>; lang: string }) {
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    // Read the non-sensitive drmc_hint cookie
    const match = document.cookie.match(new RegExp('(^| )drmc_hint=([^;]+)'));
    if (match?.[2]) {
      try {
        // eslint-disable-next-line
        setHint(decodeURIComponent(match[2]));
      } catch {
        // ignore
      }
    }
  }, []);

  if (!hint) {
    return (
      <Button variant="primary" size="sm" asChild>
        <Link href={`/${lang}/login`}>{dict.login}</Link>
      </Button>
    );
  }

  // Parses simple hint structure e.g. "Name|role"
  const [name, role] = hint.split('|');

  return (
    <div className="relative group">
      <Button variant="ghost" size="sm" className="gap-2">
        <User className="w-4 h-4" />
        <span className="hidden sm:inline-block max-w-[100px] truncate">{name}</span>
      </Button>
      
      <div className="absolute right-0 mt-2 w-48 rounded-md border border-border bg-surface shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all flex flex-col z-50">
        <Link href={`/${lang}/me/registrations`} className="px-4 py-2 text-sm hover:bg-surface-2">{dict.myRegistrations}</Link>
        <Link href={`/${lang}/me/profile`} className="px-4 py-2 text-sm hover:bg-surface-2">{dict.myProfile}</Link>
        {(role === 'organizer' || role === 'admin') && (
          <Link href={`/${lang}/admin`} className="px-4 py-2 text-sm hover:bg-surface-2 border-t border-border">{dict.admin}</Link>
        )}
        <button className="px-4 py-2 text-sm text-left text-danger hover:bg-danger/10 border-t border-border">{dict.logout}</button>
      </div>
    </div>
  );
}
