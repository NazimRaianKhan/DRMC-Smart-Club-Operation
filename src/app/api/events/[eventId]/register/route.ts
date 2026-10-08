import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { requireUser, assertSameOrigin, UnauthenticatedError, ForbiddenError } from '@/server/auth';
import { registerForEvent } from '@/server/registrations';
import { registrationLimiter } from '@/server/ratelimit';

export async function POST(request: Request, context: { params: Promise<{ eventId: string }> }) {
  const requestId = randomUUID();
  const respond = (body: unknown, status: number, headers = {}) => NextResponse.json(body, {
    status, headers: { 'Cache-Control': 'no-store', 'X-Request-Id': requestId, ...headers },
  });
  try {
    await assertSameOrigin();
    const session = await requireUser();
    if (session.role !== 'participant') return respond({ ok: false, code: 'FORBIDDEN', reason: 'PARTICIPANT_ONLY', message: 'Only participant accounts can register for events' }, 403);
    const limit = await registrationLimiter.limit(`register:${session.sub}`);
    if (!limit.success) return respond({ ok: false, code: 'RATE_LIMITED', message: 'Too many registration attempts' }, 429, {
      'Retry-After': String(Math.max(1, Math.ceil((limit.reset - Date.now()) / 1000))),
    });
    let input: unknown;
    try { input = await request.json(); }
    catch { return respond({ ok: false, code: 'VALIDATION_ERROR', message: 'Invalid JSON body' }, 400); }
    const { eventId } = await context.params;
    const result = await registerForEvent({ userId: session.sub, eventId, input, requestId });
    if (result.ok) return respond(result, 200);
    return respond(result, result.code === 'FORBIDDEN' ? 403 : result.code === 'VALIDATION_ERROR' ? 400 : result.code === 'EVENT_NOT_FOUND' ? 404 : 409);
  } catch (error) {
    if (error instanceof UnauthenticatedError) return respond({ ok: false, code: 'UNAUTHENTICATED', message: 'Unauthenticated' }, 401);
    if (error instanceof ForbiddenError) return respond({ ok: false, code: 'FORBIDDEN', message: 'Forbidden' }, 403);
    console.error('Registration failed', { requestId, error });
    return respond({ ok: false, code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }, 500);
  }
}
