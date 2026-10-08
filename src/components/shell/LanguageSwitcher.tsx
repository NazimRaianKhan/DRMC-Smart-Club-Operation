"use client";

import { usePathname } from "next/navigation";
import { Button } from "../ui/button";

export function LanguageSwitcher({ currentLang }: { currentLang: string }) {
  const pathname = usePathname();
  const targetLang = currentLang === "en" ? "bn" : "en";
  
  // Replace the current language segment in the URL
  // pathname is e.g. /en/foo/bar
  const newPath = pathname.replace(`/${currentLang}`, `/${targetLang}`);

  const setCookie = () => {
    document.cookie = `lang=${targetLang}; path=/; max-age=31536000; SameSite=Lax`;
  };

  return (
    <Button variant="ghost" size="sm" asChild onClick={setCookie} className="font-semibold">
      <a href={newPath === '' ? `/${targetLang}` : newPath}>
        {currentLang === "en" ? "বাংলা" : "EN"}
      </a>
    </Button>
  );
}
