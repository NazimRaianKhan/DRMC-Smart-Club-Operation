import { NextResponse, NextRequest } from 'next/server';
import { generateJson } from '@/server/ai';
import { aiSearchLimiter } from '@/server/ratelimit';
import { getEventsQuery } from '@/server/queries/events';
import { eventsQuerySchema } from '@/lib/validations/events';

export const instant = false;

export async function POST(req: NextRequest) {
  try {
    // assertSameOrigin: Check origin matches NEXT_PUBLIC_SITE_URL
    const origin = req.headers.get('origin');
    if (origin && origin !== process.env.NEXT_PUBLIC_SITE_URL) {
      return NextResponse.json({ ok: false, code: 'FORBIDDEN' }, { status: 403 });
    }

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const limit = await aiSearchLimiter.limit(`ai_search:${ip}`);
    if (!limit.success) {
      return NextResponse.json({ ok: false, code: 'TOO_MANY_REQUESTS' }, { status: 429 });
    }

    const body = await req.json();
    const query = body.query || '';
    const lang = body.lang || 'en';

    if (!query) {
      return NextResponse.json({ ok: false, code: 'BAD_REQUEST' }, { status: 400 });
    }

    const system = `You are an AI assistant that converts natural language event search queries into structured JSON filters.
Available categories: programming, robotics, math, science, business, arts, gaming, other.
Available states: open, closing_soon, closed, full, waitlist, ended, not_open.
You must return a JSON object with any of these fields (omit if not requested):
- q: a specific keyword or name mentioned (string)
- category: comma-separated list of matched categories (string)
- state: comma-separated list of matched states (string)
- dateFrom: ISO date string if user mentions a start date
- dateTo: ISO date string if user mentions an end date
- summary: a brief natural language summary of what you understood from the user's query, written in ${lang === 'bn' ? 'Bengali (Bangla)' : 'English'}.
Example input: "Are there any open programming contests next week?"
Example output: {"category": "programming", "state": "open", "summary": "Open programming events"}
`;

    const aiRes = await generateJson({ system, user: query });

    if (!aiRes.ok) {
      // Fallback: normal keyword search
      const fallbackParsed = eventsQuerySchema.safeParse({ q: query, lang });
      const fallbackResult = fallbackParsed.success ? await getEventsQuery(fallbackParsed.data) : { items: [], hasMore: false };
      return NextResponse.json({
        ok: true,
        aiUsed: false,
        summary: lang === 'bn' ? 'AI _. _ 11_ >_  Y .' : 'AI unavailable. Showing regular search results.',
        data: fallbackResult
      });
    }

    // Try to parse AI output into the events query schema format
    const aiData = aiRes.data;
    
    // Convert AI array fields to comma-separated strings if they returned arrays by mistake
    let cat = aiData.category;
    if (Array.isArray(cat)) cat = cat.join(',');
    
    let st = aiData.state;
    if (Array.isArray(st)) st = st.join(',');

    const filterObj = {
      q: typeof aiData.q === 'string' ? aiData.q : undefined,
      category: typeof cat === 'string' ? cat : undefined,
      state: typeof st === 'string' ? st : undefined,
      dateFrom: typeof aiData.dateFrom === 'string' ? aiData.dateFrom : undefined,
      dateTo: typeof aiData.dateTo === 'string' ? aiData.dateTo : undefined,
      lang: lang
    };

    const parsed = eventsQuerySchema.safeParse(filterObj);
    const filtersToUse = parsed.success ? parsed.data : eventsQuerySchema.parse({ lang });
    
    // In case the AI decided to put everything in q, or just fallback
    if (!filtersToUse.q && !filtersToUse.category && !filtersToUse.state && !filtersToUse.dateFrom && !filtersToUse.dateTo) {
        filtersToUse.q = query;
    }

    const result = await getEventsQuery(filtersToUse);

    return NextResponse.json({
      ok: true,
      aiUsed: true,
      summary: typeof aiData.summary === 'string' ? aiData.summary : (lang === 'bn' ? 'AI __ 11_' : 'AI search results'),
      filters: filtersToUse,
      data: result
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
