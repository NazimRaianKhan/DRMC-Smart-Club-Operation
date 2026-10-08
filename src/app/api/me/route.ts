import { NextResponse } from 'next/server';
import { requireUser } from '@/server/auth';
import { db } from '@/db/client';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { classLevels } from '@/lib/validation/registration';

const profileSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  phone: z.string().trim().regex(/^(?:\+?88)?01[3-9]\d{8}$/).or(z.literal('')).optional(),
  institution: z.string().trim().min(2).max(80),
  classLevel: z.enum(classLevels),
  studentId: z.string().trim().optional(),
});

export async function PATCH(request: Request) {
  try {
    const session = await requireUser();
    const body = await request.json();
    const parsed = profileSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ ok: false, code: 'VALIDATION_ERROR', errors: parsed.error.format() }, { status: 400 });
    }
    
    await db.update(users).set({
      fullName: parsed.data.fullName,
      phone: parsed.data.phone || null,
      institution: parsed.data.institution,
      classLevel: parsed.data.classLevel,
      studentId: parsed.data.studentId || null,
    }).where(eq(users.id, session.sub));

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (error.name === 'UnauthenticatedError') return NextResponse.json({ ok: false }, { status: 401 });
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

