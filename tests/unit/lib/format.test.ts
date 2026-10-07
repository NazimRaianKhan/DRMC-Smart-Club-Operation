import { describe, it, expect } from 'vitest';
import { formatDateTime, formatNumber, formatRelativeCloses } from '@/lib/format';

describe('Format helpers', () => {
  const testDate = new Date('2026-10-15T10:30:00Z'); // Assumes UTC

  it('formats date and time', () => {
    // 10:30 UTC is 16:30 BST (Asia/Dhaka) -> which is 4:30 PM
    const formatted = formatDateTime(testDate, 'en');
    expect(formatted).toMatch(/4:30/);
    expect(formatted).toContain('2026');
  });

  it('formats number properly', () => {
    expect(formatNumber(1234567, 'en')).toMatch(/1,234,567/);
    // Bengali number formatting uses different numerals
    const bnFormatted = formatNumber(1234567, 'bn');
    expect(bnFormatted).toMatch(/[১-৯]/);
  });

  it('formats relative time closures properly', () => {
    const now = new Date();
    // Tomorrow
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000 + 10000);
    expect(formatRelativeCloses(tomorrow, 'en')).toMatch(/in 1 day|in 24 hours|tomorrow/i);

    // Past
    const past = new Date(now.getTime() - 10000);
    expect(formatRelativeCloses(past, 'en')).toBe('Closed');
    expect(formatRelativeCloses(past, 'bn')).toBe('সময় শেষ');
  });
});
