const TIME_ZONE = 'Asia/Dhaka';

export function formatDateTime(date: Date, locale: string = 'en'): string {
  const actualLocale = locale === 'bn' ? 'bn-BD' : 'en-BD';
  return new Intl.DateTimeFormat(actualLocale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: TIME_ZONE,
  }).format(date);
}

export function formatDate(date: Date, locale: string = 'en'): string {
  const actualLocale = locale === 'bn' ? 'bn-BD' : 'en-BD';
  return new Intl.DateTimeFormat(actualLocale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: TIME_ZONE,
  }).format(date);
}

export function formatTime(date: Date, locale: string = 'en'): string {
  const actualLocale = locale === 'bn' ? 'bn-BD' : 'en-BD';
  return new Intl.DateTimeFormat(actualLocale, {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: TIME_ZONE,
  }).format(date);
}

export function formatNumber(value: number, locale: string = 'en'): string {
  const actualLocale = locale === 'bn' ? 'bn-BD' : 'en-BD';
  return new Intl.NumberFormat(actualLocale).format(value);
}

export function formatRelativeCloses(target: Date, locale: string = 'en'): string {
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  const actualLocale = locale === 'bn' ? 'bn-BD' : 'en-BD';
  const rtf = new Intl.RelativeTimeFormat(actualLocale, { numeric: 'auto' });

  if (diffMs < 0) {
    return locale === 'bn' ? 'সময় শেষ' : 'Closed';
  }

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays > 0) return rtf.format(diffDays, 'day');

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours > 0) return rtf.format(diffHours, 'hour');

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  return rtf.format(diffMinutes, 'minute');
}
