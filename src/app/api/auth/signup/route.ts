import { NextResponse } from 'next/server';
import { signupSchema } from '@/lib/validations/auth';
import { db } from '@/db/client';
import * as schema from '@/db/schema';
import { eq } from 'drizzle-orm';
import { hash } from 'bcryptjs';
import { signToken, assertSameOrigin } from '@/server/auth';
import { signupLimiter } from '@/server/ratelimit';
import { cookies, headers } from 'next/headers';

export async function POST(req: Request) {
  try {
    await assertSameOrigin();

    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') || '127.0.0.1';
    
    const rateLimit = await signupLimiter.limit(ip);
    if (!rateLimit.success) {
      const retryAfterSeconds = Math.ceil((rateLimit.reset - Date.now()) / 1000);
      return NextResponse.json(
        { ok: false, code: 'RATE_LIMITED', retryAfterSeconds },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, code: 'VALIDATION_ERROR', errors: parsed.error.format() }, { status: 400 });
    }

    const data = parsed.data;

    // Check duplicate email
    const existing = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, data.email));
    if (existing.length > 0) {
      return NextResponse.json(
        { ok: false, code: 'VALIDATION_ERROR', field: 'email', message: 'Email already in use' },
        { status: 409 }
      );
    }

    const passwordHash = await hash(data.password, 10);

    const inserted = await db.insert(schema.users).values({
      email: data.email,
      passwordHash,
      fullName: data.fullName,
      phone: data.phone || null,
      institution: data.institution || null,
      classLevel: data.classLevel || null,
      studentId: data.studentId || null,
      preferredLang: data.lang,
      role: 'participant', // always force participant
    }).returning({ id: schema.users.id, role: schema.users.role, fullName: schema.users.fullName });

    const user = inserted[0];
    if (!user) throw new Error("Failed to insert user");

    // Log the user in
    const token = await signToken({ sub: user.id, role: user.role, name: user.fullName, tv: 0 });
    
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

