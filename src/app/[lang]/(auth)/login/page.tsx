import { getDictionary } from "@/i18n";
import { LoginForm } from "@/components/auth/LoginForm";
import { Metadata } from "next";
import { Suspense } from "react";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  return {
    title: dict.auth.login,
  };
}

export default async function LoginPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm dict={dict} lang={lang} />
    </Suspense>
  );
}
