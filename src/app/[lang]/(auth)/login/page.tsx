import { getDictionary } from "@/i18n";
import { LoginForm } from "@/components/auth/LoginForm";
import { Metadata } from "next";

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

  return <LoginForm dict={dict} lang={lang} />;
}
