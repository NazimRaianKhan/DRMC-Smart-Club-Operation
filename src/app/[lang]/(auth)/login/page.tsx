import { getDictionary } from "@/i18n";
import { LoginForm } from "@/components/auth/LoginForm";
import { Metadata } from "next";
import { Suspense } from "react";
import { getSession } from "@/server/auth";
import { redirect } from "next/navigation";

import { connection } from "next/server";

export const instant = false;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  return {
    title: dict.auth.login,
  };
}

export default async function LoginPage({ params }: { params: Promise<{ lang: string }> }) {
  await connection();
  const { lang } = await params;
  const dict = await getDictionary(lang);
  const session = await getSession();

  if (session) {
    redirect(session.role === 'participant' ? `/${lang}/me/profile` : `/${lang}/admin`);
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm dict={dict} lang={lang} />
    </Suspense>
  );
}
