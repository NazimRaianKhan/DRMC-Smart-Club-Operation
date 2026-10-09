import { NextResponse, NextRequest } from 'next/server';
import { generateJson } from '@/server/ai';
import { aiAskLimiter } from '@/server/ratelimit';
import { db } from '@/db/client';
import { sql } from 'drizzle-orm';
import { z } from 'zod';
import { getSession } from '@/server/auth';

const inputSchema = z.object({
  eventId: z.string().uuid(),
  question: z.string().min(1).max(500),
  lang: z.enum(['en', 'bn']).default('en'),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ ok: false, code: 'UNAUTHORIZED' }, { status: 401 });

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const limit = await aiAskLimiter.limit(`ai_ask:${ip}`);
    if (!limit.success) {
      return NextResponse.json({ ok: false, code: 'TOO_MANY_REQUESTS' }, { status: 429 });
    }

    const body = await req.json();
    const parsed = inputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, code: 'BAD_REQUEST', error: parsed.error }, { status: 400 });
    }

    const { eventId, question, lang } = parsed.data;

    // Fetch public event data and FAQ
    const eventQuery = await db.execute(sql`
      SELECT title, title_bn, short_description, short_description_bn, description, description_bn, 
             faq, faq_bn, starts_at, ends_at, venue, category, participation_type, capacity, waitlist_enabled
      FROM events
      WHERE id = ${eventId} AND status = 'published'
    `);

    if (eventQuery.rows.length === 0) {
      return NextResponse.json({ ok: false, code: 'NOT_FOUND' }, { status: 404 });
    }

    const ev = eventQuery.rows[0];
    if (!ev) {
      return NextResponse.json({ ok: false, code: 'NOT_FOUND' }, { status: 404 });
    }
    
    // Determine which language fields to use primarily for context, though both could be useful
    const title = lang === 'bn' && ev.title_bn ? ev.title_bn : ev.title;
    const desc = lang === 'bn' && ev.description_bn ? ev.description_bn : ev.description;
    const faq = lang === 'bn' && ev.faq_bn ? ev.faq_bn : ev.faq;
    
    const context = {
      title,
      description: desc,
      category: ev.category,
      startsAt: ev.starts_at,
      endsAt: ev.ends_at,
      venue: ev.venue,
      participationType: ev.participation_type,
      waitlistEnabled: ev.waitlist_enabled,
      faq
    };

    const system = `You are a helpful AI assistant for a tech festival event.
Your job is to answer questions about this specific event using ONLY the provided JSON context below.
Do not invent or hallucinate information. If the answer is not in the context, you MUST reply with exactly: "I don't know" (or its Bengali equivalent if asked in Bengali).
Reply concisely and directly to the question in the language requested by the user (${lang === 'bn' ? 'Bengali/Bangla' : 'English'}).
Return a JSON object with:
- answer: your answer to the user's question.

Context:
${JSON.stringify(context, null, 2)}`;

    const aiRes = await generateJson({ system, user: question });

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
