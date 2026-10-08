import { getDictionary } from "@/i18n";
import { getPublishedFests } from "@/server/queries/fests";
import { getEventsQuery } from "@/server/queries/events";
import { FestCard } from "@/components/directory/FestCard";
import { EventBrowser } from "@/components/directory/EventBrowser";
import { Suspense } from "react";

import { connection } from "next/server";

// The catalog intentionally reads the current database on each request.
export const instant = false;

type Props = {
  params: Promise<{ lang: "en" | "bn" }>;
};

import { ParticleField } from "@/components/fx/ParticleField";

export default async function FestsDirectoryPage(props: Props) {
  // Read the current catalog, including after local seeds or test fixture cleanup.
  await connection();
  const params = await props.params;
  const { lang } = params;
  const dict = await getDictionary(lang);
  const [fests, initialData] = await Promise.all([
    getPublishedFests(),
    getEventsQuery({ page: 1, pageSize: 12, when: "upcoming", sort: "soonest", lang }),
  ]);
  const nowMs = Date.now();

  return (
    <main className="flex-1">
      <section className="py-12 md:py-20 bg-surface/50 border-b border-border relative overflow-hidden">
        <ParticleField />
        <div className="container px-4 md:px-6 relative z-10">
          <div className="max-w-3xl space-y-4">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              {dict.directory?.title || "Fests & Events"}
            </h1>
            <p className="text-xl text-text-muted">
              {dict.directory?.subtitle || "Explore and register for upcoming events."}
            </p>
          </div>
        </div>
      </section>

      {fests.length > 0 && (
        <section className="py-12 border-b border-border">
          <div className="container px-4 md:px-6">
            <h2 className="text-2xl font-bold mb-8">
              {dict.directory?.featuredFests || "Featured Fests"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {fests.map((fest) => (
                <FestCard key={fest.id} fest={fest} lang={lang} eventsCount={0} now={nowMs} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-12 pb-24">
        <div className="container px-4 md:px-6">
          <Suspense fallback={<div className="py-12 text-center text-text-muted">{dict.directory?.loading || "Loading..."}</div>}>
            <EventBrowser 
              lang={lang} 
              dict={dict.directory} 
              initialData={initialData}
              fests={fests}
            />
          </Suspense>
        </div>
      </section>
    </main>
  );
}

