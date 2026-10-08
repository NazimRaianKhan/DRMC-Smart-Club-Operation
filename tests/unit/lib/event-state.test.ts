import { describe, it, expect } from 'vitest';
import { getEventState, seatsLeft, EventStateInput } from '@/lib/event-state';

describe('event-state logic', () => {
  const now = new Date('2026-10-08T12:00:00Z');
  
  const baseEvent: EventStateInput = {
    status: 'published',
    startsAt: new Date('2026-10-15T12:00:00Z'),
    registrationOpensAt: null,
    registrationDeadline: new Date('2026-10-14T12:00:00Z'),
    capacity: 50,
    confirmedCount: 0,
    waitlistEnabled: true,
  };

  it('cancelled', () => {
    expect(getEventState({ ...baseEvent, status: 'cancelled' }, now)).toBe('cancelled');
  });

  it('ended', () => {
    expect(getEventState({ ...baseEvent, startsAt: new Date('2026-10-07T12:00:00Z') }, now)).toBe('ended');
  });

  it('closed', () => {
    expect(getEventState({ ...baseEvent, registrationDeadline: new Date('2026-10-08T11:00:00Z') }, now)).toBe('closed');
  });

  it('not_open', () => {
    expect(getEventState({ ...baseEvent, registrationOpensAt: new Date('2026-10-09T12:00:00Z') }, now)).toBe('not_open');
  });

  it('full (no waitlist)', () => {
    expect(getEventState({ ...baseEvent, confirmedCount: 50, waitlistEnabled: false }, now)).toBe('full');
    expect(getEventState({ ...baseEvent, confirmedCount: 51, waitlistEnabled: false }, now)).toBe('full');
  });

  it('waitlist (enabled)', () => {
    expect(getEventState({ ...baseEvent, confirmedCount: 50, waitlistEnabled: true }, now)).toBe('waitlist');
  });

  it('closing_soon (<= 48 hours)', () => {
    expect(getEventState({ ...baseEvent, registrationDeadline: new Date('2026-10-10T12:00:00Z') }, now)).toBe('closing_soon');
  });

  it('open (> 48 hours)', () => {
    expect(getEventState({ ...baseEvent, registrationDeadline: new Date('2026-10-11T12:00:00Z') }, now)).toBe('open');
  });

  it('seatsLeft computation', () => {
    expect(seatsLeft({ capacity: 50, confirmedCount: 0 })).toBe(50);
    expect(seatsLeft({ capacity: 50, confirmedCount: 20 })).toBe(30);
    expect(seatsLeft({ capacity: 50, confirmedCount: 50 })).toBe(0);
    expect(seatsLeft({ capacity: 50, confirmedCount: 60 })).toBe(0); // waitlisted count pushes it above capacity
  });
});

