import { describe, it, expect } from 'vitest';
import { formatParticipation, formatCapacityUnit } from '../../src/lib/format';

describe('format.ts helpers', () => {
  it('formatParticipation logic', () => {
    // English
    expect(formatParticipation(false, null, null, 'en')).toBe('Solo');
    expect(formatParticipation(true, 2, 3, 'en')).toBe('Team of 2–3 members');

    // Bengali
    expect(formatParticipation(false, null, null, 'bn')).toBe('একক');
    expect(formatParticipation(true, 2, 3, 'bn')).toBe('দলগত (২-৩ জন)');
  });

  it('formatCapacityUnit logic', () => {
    // English
    expect(formatCapacityUnit(false, 'en')).toBe('seats');
    expect(formatCapacityUnit(true, 'en')).toBe('teams');

    // Bengali
    expect(formatCapacityUnit(false, 'bn')).toBe('টি আসন');
    expect(formatCapacityUnit(true, 'bn')).toBe('টি দল');
  });
});

