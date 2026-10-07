import { getDictionary } from "@/i18n";
import { SignupForm } from "@/components/auth/SignupForm";
import { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  return {
    title: dict.auth.signup,
  };
}

export default async function SignupPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  return <SignupForm dict={dict} lang={lang} />;
}
