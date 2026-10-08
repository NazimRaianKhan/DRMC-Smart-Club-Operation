import { NextResponse } from 'next/server';
import { eventsQuerySchema } from '@/lib/validations/events';
import { getEventsQuery } from '@/server/queries/events';
export const instant = false;
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rawParams = Object.fromEntries(searchParams.entries());

    const parsed = eventsQuerySchema.safeParse(rawParams);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, code: 'VALIDATION_ERROR', errors: parsed.error.format() },
        { status: 400 }
      );
    }

    const result = await getEventsQuery(parsed.data);

    const response = NextResponse.json({
      ok: true,
      data: result,
    });
    
    // Headers: Cache-Control public, s-maxage=15, stale-while-revalidate=60
    response.headers.set('Cache-Control', 'public, s-maxage=15, stale-while-revalidate=60');
    
    return response;
  } catch (error) {
    console.error('Events API Error:', error);
    return NextResponse.json({ ok: false, code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

