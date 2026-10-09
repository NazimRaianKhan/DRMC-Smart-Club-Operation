'use client';
import dynamic from 'next/dynamic';

const Scanner = dynamic(() => import('./Scanner').then(m => m.Scanner), {
  ssr: false,
  loading: () => <div className="h-64 w-full bg-surface animate-pulse rounded-2xl flex items-center justify-center text-text-muted">Loading scanner...</div>
});

export function ScannerWrapper({ events, lang }: { events: any[], lang: string }) {
  return <Scanner events={events} lang={lang} />;
}

