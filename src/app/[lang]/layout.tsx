import { Space_Grotesk, Inter, Noto_Sans_Bengali } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import "@/app/globals.css";
import { notFound } from "next/navigation";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const notoSansBengali = Noto_Sans_Bengali({
  subsets: ["bengali"],
  weight: ["400", "700"],
  variable: "--font-bangla",
  display: "swap",
});

export const metadata = {
  title: {
    template: "%s | DRMC Tech Carnival Platform",
    default: "DRMC Tech Carnival Platform",
  },
  description: "9th DRMC International Tech Carnival 2026",
  openGraph: {
    title: "DRMC Tech Carnival Platform",
    description: "9th DRMC International Tech Carnival 2026 - AI Web Development Contest",
    type: "website",
  },
};

export async function generateStaticParams() {
  return [{ lang: "en" }, { lang: "bn" }];
}

import { Header, Footer } from "@/components/shell/layout";
import { ToastProvider } from "@/components/ui/toast";
import { SpotlightCursor } from "@/components/fx/SpotlightCursor";

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (lang !== "en" && lang !== "bn") {
    notFound();
  }

  return (
    <html lang={lang} dir="ltr" suppressHydrationWarning className={`${spaceGrotesk.variable} ${inter.variable} ${notoSansBengali.variable}`}>
      <body className="antialiased min-h-screen flex flex-col bg-bg text-text overflow-x-hidden">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <SpotlightCursor />
          <Header lang={lang} />
          <main className="flex-1">{children}</main>
          <Footer lang={lang} />
          <ToastProvider />
        </ThemeProvider>
      </body>
    </html>
  );
}
