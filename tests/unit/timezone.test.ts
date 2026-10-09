import { describe, it, expect } from 'vitest';
import { dhakaToUtc, utcToDhaka } from '@/lib/timezone';

describe('timezone conversions', () => {
  it('converts dhaka local time to utc correctly', () => {
    const dhaka = '2026-12-01T10:00';
    const utcDate = dhakaToUtc(dhaka);
    expect(utcDate.toISOString()).toBe('2026-12-01T04:00:00.000Z');
  });

  it('converts utc back to dhaka local correctly', () => {
    const utcDate = new Date('2026-12-01T04:00:00.000Z');
    const dhaka = utcToDhaka(utcDate);
    expect(dhaka).toBe('2026-12-01T10:00');
  });
});
