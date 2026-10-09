export function dhakaToUtc(dhakaLocal: string): Date {
  if (dhakaLocal.length === 16) {
    return new Date(`${dhakaLocal}:00+06:00`);
  }
  return new Date(`${dhakaLocal}+06:00`);
}

export function utcToDhaka(date: Date): string {
  const dhakaMs = date.getTime() + 6 * 60 * 60 * 1000;
  const dhakaDate = new Date(dhakaMs);
  return dhakaDate.toISOString().slice(0, 16);
}
