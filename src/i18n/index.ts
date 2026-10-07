import 'server-only';
import { cache } from 'react';

const dictionaries = {
  en: () => import('./en.json').then((module) => module.default),
  bn: () => import('./bn.json').then((module) => module.default),
};

export type Dict = Awaited<ReturnType<typeof dictionaries.en>>;
export type Locale = keyof typeof dictionaries;

export const getDictionary = cache(async (locale: string) => {
  if (locale === 'bn') return dictionaries.bn();
  return dictionaries.en(); // default
});

export function t(dict: Record<string, unknown>, path: string, params?: Record<string, string | number>): string {
  const keys = path.split('.');
  let current: Record<string, unknown> = dict;

  for (const key of keys) {
    if (current === undefined || typeof current !== 'object' || current === null) {
      return path;
    }
    if ((current as Record<string, unknown>)[key] === undefined) {
      return path; // fallback to path if missing
    }
    current = (current as Record<string, unknown>)[key] as Record<string, unknown>;
  }

  let text = String(current);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      text = text.replace(new RegExp(`{${key}}`, 'g'), String(value));
    }
  }

  return text;
}
