import { NextResponse, NextRequest } from 'next/server';
import { generateJson } from '@/server/ai';
import { aiSearchLimiter } from '@/server/ratelimit';
import { requireRole } from '@/server/auth';
import { z } from 'zod';

const inputSchema = z.object({
  title: z.string().min(1),
  category: z.string().min(1),
  keywords: z.string().optional(),
  participationType: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const origin = req.headers.get('origin');
    if (origin && origin !== process.env.NEXT_PUBLIC_SITE_URL) {
      return NextResponse.json({ ok: false, code: 'FORBIDDEN' }, { status: 403 });
    }

    const session = await requireRole(['organizer', 'admin']);

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const limit = await aiSearchLimiter.limit(`ai_draft:${ip}`);
    if (!limit.success) {
      return NextResponse.json({ ok: false, code: 'TOO_MANY_REQUESTS' }, { status: 429 });
    }

    const body = await req.json();
    const parsed = inputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, code: 'BAD_REQUEST', error: parsed.error }, { status: 400 });
    }

    const { title, category, keywords, participationType } = parsed.data;

    const system = `You are an expert event organizer copilot for a tech festival.
Your goal is to draft highly engaging, clear, and professional event descriptions.
You must return a JSON object containing:
- shortDescription: A catchy one-liner (max 160 characters).
- description: A detailed, compelling markdown description of the event, what participants will do, and why they should join (max 1200 chars).
- faq: An array of 3 to 5 frequently asked questions and answers. Each item must have 'q' (question) and 'a' (answer).

Use the provided title, category, keywords, and participation type to shape the draft. 
If participationType is "team", mention team dynamics.`;

    const userPrompt = `Title: ${title}
Category: ${category}
Keywords: ${keywords || 'none'}
Participation Type: ${participationType}`;

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

