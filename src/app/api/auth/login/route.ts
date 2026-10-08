import { NextResponse } from 'next/server';
import { loginSchema } from '@/lib/validations/auth';
import { db } from '@/db/client';
import * as schema from '@/db/schema';
import { eq } from 'drizzle-orm';
import { compare, hash } from 'bcryptjs';
import { signToken, assertSameOrigin } from '@/server/auth';
import { loginLimiter } from '@/server/ratelimit';
import { cookies, headers } from 'next/headers';

// A dummy hash to ensure timing attacks are mitigated when user is not found
const DUMMY_HASH = '$2a$10$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';

export async function POST(req: Request) {
  try {
    await assertSameOrigin();

    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') || '127.0.0.1';
    const bodyText = await req.text();
    let body;
    try {
      body = JSON.parse(bodyText);
    } catch (e) {
      return NextResponse.json({ ok: false, code: 'INVALID_JSON' }, { status: 400 });
    }

    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, code: 'VALIDATION_ERROR' }, { status: 400 });
    }

    const data = parsed.data;

    // Rate limiting per IP + email, and IP globally
    const ipLimit = await loginLimiter.limit(`login_ip:${ip}`);
    const emailLimit = await loginLimiter.limit(`login_email:${ip}:${data.email}`);

    if (!ipLimit.success || !emailLimit.success) {
      const rateLimit = !ipLimit.success ? ipLimit : emailLimit;
      const retryAfterSeconds = Math.ceil((rateLimit.reset - Date.now()) / 1000);
      return NextResponse.json(
        { ok: false, code: 'RATE_LIMITED', retryAfterSeconds },
        { status: 429 }
      );
    }

    const users = await db.select().from(schema.users).where(eq(schema.users.email, data.email));
    const user = users[0];

    const isMatch = await compare(data.password, user ? user.passwordHash : DUMMY_HASH);

    if (!user || !isMatch) {
      return NextResponse.json(
        { ok: false, code: 'UNAUTHORIZED', message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Log the user in
    const token = await signToken({ sub: user.id, role: user.role, name: user.fullName, tv: user.tokenVersion });
    
    const cookieStore = await cookies();
    cookieStore.set('drmc_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });
    cookieStore.set('drmc_hint', JSON.stringify({ name: user.fullName, role: user.role }), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err.name === 'ForbiddenError') {
      return NextResponse.json({ ok: false, code: 'FORBIDDEN' }, { status: 403 });
    }
    console.error(err);
    return NextResponse.json({ ok: false, code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

