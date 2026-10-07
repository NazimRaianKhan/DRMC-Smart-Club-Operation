import { getDictionary, t } from "@/i18n";
import { AnimatedSection } from "@/components/fx/AnimatedSection";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Calendar, Users, Activity, Radio } from "lucide-react";

export default async function LandingPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  return (
    <div className="h-[calc(100vh-4rem)] w-full overflow-y-auto snap-y snap-mandatory relative scroll-smooth hide-scrollbar">
      
      {/* Hero Section */}
      <AnimatedSection>
        <div className="max-w-3xl space-y-6">
          <Badge>New in 2026</Badge>
          <h1 className="text-5xl md:text-7xl font-bold font-heading text-accent-2 tracking-tight">
            {t(dict, "landing.heroTitle")}
          </h1>
          <p className="text-xl md:text-2xl text-text-muted">
            {t(dict, "landing.heroSubtitle")}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Button size="lg" asChild>
              <Link href={`/${lang}/fests`}>{t(dict, "landing.browseFests")}</Link>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <a href="#how-it-works">{t(dict, "landing.howItWorks")}</a>
            </Button>
          </div>
        </div>
      </AnimatedSection>

      {/* How it works Section */}
      <AnimatedSection id="how-it-works" className="bg-surface/50">
        <h2 className="text-3xl md:text-5xl font-bold font-heading mb-12">
          {t(dict, "landing.howItWorks")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full">
          {[
            { step: "1", title: t(dict, "landing.step1") },
            { step: "2", title: t(dict, "landing.step2") },
            { step: "3", title: t(dict, "landing.step3") },
          ].map((s, i) => (
            <Card key={i} className="p-8 flex flex-col items-center text-center relative overflow-hidden group">
              <div className="w-16 h-16 rounded-full bg-accent/10 text-accent flex items-center justify-center text-2xl font-bold mb-4 group-hover:scale-110 transition-transform">
                {s.step}
              </div>
              <h3 className="text-xl font-semibold">{s.title}</h3>
            </Card>
          ))}
        </div>
      </AnimatedSection>

      {/* Features Section */}
      <AnimatedSection>
        <h2 className="text-3xl md:text-5xl font-bold font-heading mb-12">
          {t(dict, "landing.featuresTitle")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl w-full">
          <Card className="p-6 flex items-start gap-4 text-left">
            <Calendar className="w-8 h-8 text-accent-2 shrink-0" />
            <div>
              <h3 className="text-lg font-semibold">{t(dict, "landing.feature1")}</h3>
              <p className="text-sm text-text-muted mt-1">Easily find upcoming events and deadlines.</p>
            </div>
          </Card>
          <Card className="p-6 flex items-start gap-4 text-left">
            <Users className="w-8 h-8 text-accent-2 shrink-0" />
            <div>
              <h3 className="text-lg font-semibold">{t(dict, "landing.feature2")}</h3>
              <p className="text-sm text-text-muted mt-1">Form your team and manage registrations.</p>
            </div>
          </Card>
          <Card className="p-6 flex items-start gap-4 text-left">
            <Activity className="w-8 h-8 text-accent-2 shrink-0" />
            <div>
              <h3 className="text-lg font-semibold">{t(dict, "landing.feature3")}</h3>
              <p className="text-sm text-text-muted mt-1">Check waitlist position and approval status.</p>
            </div>
          </Card>
          <Card className="p-6 flex items-start gap-4 text-left">
            <Radio className="w-8 h-8 text-accent-2 shrink-0" />
            <div>
              <h3 className="text-lg font-semibold">{t(dict, "landing.feature4")}</h3>
              <p className="text-sm text-text-muted mt-1">Real-time updates during the carnival.</p>
            </div>
          </Card>
        </div>
      </AnimatedSection>

      {/* About Section */}
      <AnimatedSection className="bg-surface/50">
        <div className="max-w-2xl space-y-6">
          <h2 className="text-3xl md:text-5xl font-bold font-heading">
            {t(dict, "landing.aboutTitle")}
          </h2>
          <Badge variant="outline">{t(dict, "landing.established")}</Badge>
          <p className="text-lg text-text-muted max-w-xl mx-auto">
            {t(dict, "landing.aboutDesc")}
          </p>
          <p className="text-xl font-medium italic mt-8 text-accent">
            &quot;{t(dict, "common.motto")}&quot;
          </p>
        </div>
      </AnimatedSection>
    </div>
  );
}


