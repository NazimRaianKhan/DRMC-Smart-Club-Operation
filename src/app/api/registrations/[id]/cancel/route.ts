import { NextResponse } from 'next/server';
import { requireUser, assertSameOrigin, UnauthenticatedError, ForbiddenError } from '@/server/auth';
import { cancelRegistration } from '@/server/registrations';
import { revalidateTag } from 'next/cache';

export async function POST(request: Request, context: any) {
  try {
    const { id } = await context.params;
    
    await assertSameOrigin();
    const session = await requireUser();

    const result = await cancelRegistration({
      userId: session.sub,
      registrationId: id,
    });

    if (result.ok) {
      // @ts-ignore
      revalidateTag('events');
      // @ts-ignore
      revalidateTag('fests');
      return NextResponse.json(result, { status: 200, headers: { 'Cache-Control': 'no-store' } });
    }

    const statusMap: Record<string, number> = {
      'NOT_FOUND': 404,
      'INVALID_TRANSITION': 400,
    };

    const statusCode = statusMap[result.code as string] || 500;
    return NextResponse.json(result, { status: statusCode, headers: { 'Cache-Control': 'no-store' } });

  } catch (error: any) {
    if (error instanceof UnauthenticatedError) return NextResponse.json({ ok: false, code: 'UNAUTHENTICATED' }, { status: 401 });
    if (error instanceof ForbiddenError) return NextResponse.json({ ok: false, code: 'FORBIDDEN' }, { status: 403 });
    return NextResponse.json({ ok: false, code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

