import { NextResponse } from 'next/server';
import { requireUser, signToken } from '@/server/auth';
import { db } from '@/db/client';
import { users } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { compare, hash } from 'bcryptjs';
import { cookies } from 'next/headers';

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'Password must be at least 8 characters long'),
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export async function PATCH(request: Request) {
  try {
    const session = await requireUser();
    const body = await request.json();
    const parsed = passwordSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ ok: false, code: 'VALIDATION_ERROR', errors: parsed.error.format() }, { status: 400 });
    }
    
    const [user] = await db.select().from(users).where(eq(users.id, session.sub));
    if (!user) {
      return NextResponse.json({ ok: false, code: 'NOT_FOUND' }, { status: 404 });
    }

    const isMatch = await compare(parsed.data.currentPassword, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ ok: false, code: 'INVALID_PASSWORD', message: 'Incorrect current password' }, { status: 400 });
    }

    const newHash = await hash(parsed.data.newPassword, 10);
    const newVersion = user.tokenVersion + 1;

    await db.update(users).set({
      passwordHash: newHash,
      tokenVersion: newVersion
    }).where(eq(users.id, session.sub));

    const token = await signToken({ sub: user.id, role: user.role, name: user.fullName, tv: newVersion });
    
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
  } catch (error: any) {
    if (error.name === 'UnauthenticatedError') return NextResponse.json({ ok: false }, { status: 401 });
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

