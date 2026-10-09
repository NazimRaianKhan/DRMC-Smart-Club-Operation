"use client";

import Link from "next/link";
import { User } from "lucide-react";
import { Button } from "../ui/button";
import { useState, useRef, useEffect } from "react";

export function AuthMenu({ dict, lang, account }: {
  dict: Record<string, string>; lang: string; account: { name: string; role: string } | null;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    <div className="relative" ref={menuRef}>
      <Button variant="ghost" size="sm" className="gap-2" onClick={() => setIsOpen(!isOpen)}>
        <User className="w-4 h-4" />
        <span className="hidden sm:inline-block max-w-[100px] truncate">{name}</span>
      </Button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-md border border-border bg-[var(--surface)] shadow-lg flex flex-col z-50">
          {role === 'participant' && <Link onClick={() => setIsOpen(false)} href={`/${lang}/me/registrations`} className="px-4 py-2 text-sm hover:bg-[var(--surface-2)]">{dict.myRegistrations}</Link>}
          <Link onClick={() => setIsOpen(false)} href={`/${lang}/me/profile`} className="px-4 py-2 text-sm hover:bg-[var(--surface-2)]">{dict.myProfile}</Link>
          {(role === 'admin' || role === 'organizer') && (
            <Link onClick={() => setIsOpen(false)} href={`/${lang}/admin`} className="px-4 py-2 text-sm hover:bg-[var(--surface-2)] border-t border-border">{dict.admin}</Link>
          )}
          <button onClick={handleLogout} className="px-4 py-2 text-sm text-left text-[var(--danger)] hover:bg-[var(--danger)]/10 border-t border-border">{dict.logout}</button>
        </div>
      )}
    </div>
  );
}
