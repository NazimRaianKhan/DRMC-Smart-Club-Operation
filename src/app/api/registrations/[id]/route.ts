import { NextResponse } from 'next/server';
import { requireUser, assertSameOrigin, UnauthenticatedError, ForbiddenError } from '@/server/auth';
import { editRegistration } from '@/server/registrations';
import { registrationSchema } from '@/lib/validation/registration';
import { checkRateLimit } from '@/server/ratelimit';

export async function PATCH(request: Request, context: any) {
  try {
    const { id } = await context.params;
    
    await assertSameOrigin();
    const session = await requireUser();

    // rate limit 20 per minute per user
    const rateLimited = await checkRateLimit(`edit_reg_${session.sub}`, 20, 60);
    if (!rateLimited) {
      return NextResponse.json({ ok: false, code: 'RATE_LIMITED', message: 'Too many requests' }, { status: 429 });
    }

    const body = await request.json();
    const parsed = registrationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({
        ok: false,
        code: 'VALIDATION_ERROR',
        message: 'Invalid request body',
        errors: parsed.error.format()
      }, { status: 400 });
    }

    const result = await editRegistration({
      userId: session.sub,
      registrationId: id,
      input: parsed.data
    });

    if (result.ok) {
      return NextResponse.json(result, { status: 200, headers: { 'Cache-Control': 'no-store' } });
    }

    const statusMap: Record<string, number> = {
      'VALIDATION_ERROR': 400,
      'NOT_FOUND': 404,
      'INVALID_TRANSITION': 400,
      'MEMBER_ALREADY_REGISTERED': 409,
      'FORBIDDEN': 403
    };

    const statusCode = statusMap[result.code] || 500;
    return NextResponse.json(result, { status: statusCode, headers: { 'Cache-Control': 'no-store' } });

  } catch (error: any) {
    if (error instanceof UnauthenticatedError) return NextResponse.json({ ok: false, code: 'UNAUTHENTICATED' }, { status: 401 });
    if (error instanceof ForbiddenError) return NextResponse.json({ ok: false, code: 'FORBIDDEN' }, { status: 403 });
    return NextResponse.json({ ok: false, code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

