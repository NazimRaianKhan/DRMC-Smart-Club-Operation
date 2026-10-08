import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/server/auth', () => ({
  assertSameOrigin: vi.fn(), requireUser: vi.fn(),
  UnauthenticatedError: class extends Error {}, ForbiddenError: class extends Error {},
}));
vi.mock('@/server/registrations', () => ({ registerForEvent: vi.fn() }));
vi.mock('@/server/ratelimit', () => ({ registrationLimiter: { limit: vi.fn() } }));
import { POST } from '@/app/api/events/[eventId]/register/route';
import { assertSameOrigin, requireUser, UnauthenticatedError, ForbiddenError } from '@/server/auth';
import { registerForEvent } from '@/server/registrations';
import { registrationLimiter } from '@/server/ratelimit';
const context = { params: Promise.resolve({ eventId: crypto.randomUUID() }) };
const request = (body = '{}') => new Request('http://localhost/api/events/test/register', { method: 'POST', body });

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(requireUser).mockResolvedValue({ sub: 'user', role: 'participant', name: 'Test' });
  vi.mocked(registrationLimiter.limit).mockResolvedValue({ success: true, reset: Date.now() + 60000, limit: 20, remaining: 19, pending: Promise.resolve() });
});
describe('Registration HTTP endpoint', () => {
  it.each([
    ['FORBIDDEN', 403],
    ['VALIDATION_ERROR', 400], ['EVENT_NOT_FOUND', 404], ['ALREADY_REGISTERED', 409],
    ['MEMBER_ALREADY_REGISTERED', 409], ['EVENT_FULL', 409], ['REGISTRATION_NOT_OPEN', 409], ['DEADLINE_PASSED', 409],
  ] as const)('maps %s to %d', async (code, status) => {
    vi.mocked(registerForEvent).mockResolvedValue({ ok: false, code, message: 'Test', memberIndex: 1 });
    const response = await POST(request(), context);
    expect(response.status).toBe(status);
    expect(await response.json()).toMatchObject({ code, memberIndex: 1 });
  });
  it.each(['organizer', 'admin'])('rejects %s accounts before registration or rate limiting', async role => {
    vi.mocked(requireUser).mockResolvedValue({ sub: 'staff', role, name: 'Staff User' });
    const response = await POST(request(), context);
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ code: 'FORBIDDEN', reason: 'PARTICIPANT_ONLY' });
    expect(registerForEvent).not.toHaveBeenCalled();
    expect(registrationLimiter.limit).not.toHaveBeenCalled();
  });
  it('returns malformed JSON as 400', async () => {
    expect((await POST(request('{'), context)).status).toBe(400);
    expect(registerForEvent).not.toHaveBeenCalled();
  });
  it('requires same origin and a session', async () => {
    vi.mocked(assertSameOrigin).mockRejectedValueOnce(new ForbiddenError());
    expect((await POST(request(), context)).status).toBe(403);
    expect(requireUser).not.toHaveBeenCalled();
    vi.mocked(requireUser).mockRejectedValueOnce(new UnauthenticatedError());
    expect((await POST(request(), context)).status).toBe(401);
    expect(registerForEvent).not.toHaveBeenCalled();
  });
  it('enforces rate limits with Retry-After', async () => {
    vi.mocked(registrationLimiter.limit).mockResolvedValue({ success: false, reset: Date.now() + 30000, limit: 20, remaining: 0, pending: Promise.resolve() });
    const response = await POST(request(), context);
    expect(response.status).toBe(429);
    expect(Number(response.headers.get('Retry-After'))).toBeGreaterThan(0);
    expect(registerForEvent).not.toHaveBeenCalled();
  });
  it('returns replay results as 200 without caching', async () => {
    vi.mocked(registerForEvent).mockResolvedValue({ ok: true, registration: { id: 'registration', status: 'confirmed', ticketCode: '23456789', waitlistPosition: null, replayed: true } });
    const response = await POST(request(), context);
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(await response.json()).toMatchObject({ registration: { replayed: true } });
    expect(registerForEvent).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user', requestId: expect.any(String) }));
  });
});
