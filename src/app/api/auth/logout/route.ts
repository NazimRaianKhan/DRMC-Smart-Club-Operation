import { NextResponse } from 'next/server';
import { assertSameOrigin } from '@/server/auth';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    await assertSameOrigin();
    
    const cookieStore = await cookies();
    cookieStore.delete('drmc_session');
    cookieStore.delete('drmc_hint');

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err.name === 'ForbiddenError') {
      return NextResponse.json({ ok: false, code: 'FORBIDDEN' }, { status: 403 });
    }
    console.error(err);
    return NextResponse.json({ ok: false, code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

