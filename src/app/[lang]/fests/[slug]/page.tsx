import { Suspense } from 'react';
import FestContent from './FestContent';
import { getFestBySlug } from '@/server/queries/events';
import { connection } from 'next/server';
import type { Metadata } from 'next';

type Props = {
  params: Promise<{ lang: 'en' | 'bn'; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await connection();
  const { lang, slug } = await params;
  const data = await getFestBySlug(slug, lang);
  if (!data) return {};

  return {
    title: data.fest.title,
    description: data.fest.tagline,
    openGraph: {
      title: data.fest.title,
      description: data.fest.tagline,
    },
  };
}

export const instant = false;

export default async function FestPage({ params }: Props) {
  return (
    <Suspense fallback={<div className="container px-4 py-24 text-center">Loading fest details...</div>}>
      <FestContent params={params} />
    </Suspense>
  );
}
