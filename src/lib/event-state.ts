export type EventState = 'cancelled' | 'ended' | 'closed' | 'not_open' | 'full' | 'waitlist' | 'closing_soon' | 'open';

export interface EventStateInput {
  status: 'draft' | 'published' | 'cancelled';
  startsAt: Date;
  registrationOpensAt: Date | null;
  registrationDeadline: Date;
  capacity: number;
  confirmedCount: number;
  waitlistEnabled: boolean;
}

export function getEventState(event: EventStateInput, now: Date): EventState {
  if (event.status === 'cancelled') return 'cancelled';
  
  const nowMs = now.getTime();
  
  if (event.startsAt.getTime() < nowMs) return 'ended';
  if (nowMs >= event.registrationDeadline.getTime()) return 'closed';
  if (event.registrationOpensAt && nowMs < event.registrationOpensAt.getTime()) return 'not_open';
  
  if (event.confirmedCount >= event.capacity) {
    if (!event.waitlistEnabled) return 'full';
    return 'waitlist';
  }
  
  // open, not full
  const diffHours = (event.registrationDeadline.getTime() - nowMs) / (1000 * 60 * 60);
  if (diffHours <= 48) return 'closing_soon';
  
  return 'open';
}

export function seatsLeft(event: { capacity: number; confirmedCount: number }): number {
  return Math.max(event.capacity - event.confirmedCount, 0);
}

