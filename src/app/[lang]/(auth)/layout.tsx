import { ReactNode } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/shell/ThemeToggle";
import { LanguageSwitcher } from "@/components/shell/LanguageSwitcher";
import { getDictionary } from "@/i18n";

export default async function AuthLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)]">
      <header className="absolute top-0 w-full p-4 flex justify-between items-center z-10">
        <Link href={`/${lang}`} className="text-xl font-heading font-bold text-[var(--text)]">
          {dict.common.clubName}
        </Link>
        <div className="flex items-center gap-4">
          <LanguageSwitcher currentLang={lang} />
          <ThemeToggle />
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>
    </div>
  );
}

