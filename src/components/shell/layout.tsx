import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { AuthMenu } from "./AuthMenu";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { getDictionary, t } from "@/i18n";
import { Suspense } from "react";
import { getCurrentUser } from '@/server/auth';

async function CurrentAuthMenu({ dict, lang }: { dict: Record<string, string>; lang: string }) {
  const user = await getCurrentUser();
  return <AuthMenu dict={dict} lang={lang} account={user ? { name: user.fullName, role: user.role } : null} />;
}

export async function Header({ lang }: { lang: string }) {
  const dict = await getDictionary(lang);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-bg/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href={`/${lang}`} className="font-heading font-bold text-lg text-accent-2 tracking-tight flex items-center gap-2">
            DRMC IT CLUB
          </Link>
          
          <nav className="hidden md:flex items-center gap-4 text-sm font-medium">
            <Link href={`/${lang}/fests`} className="text-text-muted hover:text-text transition-colors">
              {t(dict, "common.fests")}
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Suspense fallback={<div className="w-8 h-8" />}>
            <LanguageSwitcher currentLang={lang} />
          </Suspense>
          <ThemeToggle />
          <Suspense fallback={<div className="w-16 h-8" />}>
            <CurrentAuthMenu dict={dict.common} lang={lang} />
          </Suspense>
        </div>
      </div>
    </header>
  );
}

import { FxToggle } from "@/components/fx/FxToggle";

export async function Footer({ lang }: { lang: string }) {
  const dict = await getDictionary(lang);

  return (
    <footer className="border-t border-border bg-surface-2 py-8 mt-auto relative z-10">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-text-muted">
        <div>
          <p className="font-semibold text-text">{t(dict, "common.clubName")}</p>
          <p>{t(dict, "common.collegeName")}</p>
          <p className="italic mt-1">&quot;{t(dict, "common.motto")}&quot;</p>
        </div>
        <div className="flex flex-col items-center gap-4">
          <FxToggle />
        </div>
        <div className="flex flex-col md:text-right">
          <p>&copy; 2026 Nazim Raian Khan.</p>
          <Link href="https://opensource.org/licenses/MIT" target="_blank" className="hover:text-text underline decoration-border underline-offset-2">
            MIT License
          </Link>
        </div>
      </div>
    </footer>
  );
}
