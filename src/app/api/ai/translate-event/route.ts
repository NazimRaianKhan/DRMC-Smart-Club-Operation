import { NextResponse, NextRequest } from 'next/server';
import { generateJson } from '@/server/ai';
import { aiSearchLimiter } from '@/server/ratelimit';
import { requireRole } from '@/server/auth';
import { z } from 'zod';

const inputSchema = z.object({
  title: z.string().min(1),
  shortDescription: z.string(),
  description: z.string(),
  faq: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
});

export async function POST(req: NextRequest) {
  try {
    const origin = req.headers.get('origin');
    if (origin && origin !== process.env.NEXT_PUBLIC_SITE_URL) {
      return NextResponse.json({ ok: false, code: 'FORBIDDEN' }, { status: 403 });
    }

    const session = await requireRole(['organizer', 'admin']);

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const limit = await aiSearchLimiter.limit(`ai_translate:${ip}`);
    if (!limit.success) {
      return NextResponse.json({ ok: false, code: 'TOO_MANY_REQUESTS' }, { status: 429 });
    }

    const body = await req.json();
    const parsed = inputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, code: 'BAD_REQUEST', error: parsed.error }, { status: 400 });
    }

    const { title, shortDescription, description, faq } = parsed.data;

    const system = `You are an expert English to Bengali (Bangla) translator for a tech festival.
Translate the event details into natural, professional Bengali suitable for high school and university students.
You must return a JSON object containing:
- titleBn: Translated title.
- shortDescriptionBn: Translated short description.
- descriptionBn: Translated detailed markdown description.
- faqBn: Translated array of FAQs. Each item must have 'q' (question) and 'a' (answer).`;

    const userPrompt = JSON.stringify({
      title,
      shortDescription,
      description,
      faq,
    });

    const aiRes = await generateJson({ system, user: userPrompt });

    if (!aiRes.ok) {
      return NextResponse.json({ ok: false, code: 'AI_UNAVAILABLE' }, { status: 503 });
    }

    return NextResponse.json({
      ok: true,
      data: aiRes.data,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

