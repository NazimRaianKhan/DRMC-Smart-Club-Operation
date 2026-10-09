import { NextResponse, NextRequest } from 'next/server';
import { generateJson } from '@/server/ai';
import { requireRole } from '@/server/auth';
import { getDashboardStats } from '@/server/queries/stats';

export async function POST(req: NextRequest) {
  try {
    const origin = req.headers.get('origin');
    if (origin && origin !== process.env.NEXT_PUBLIC_SITE_URL) {
      return NextResponse.json({ ok: false, code: 'FORBIDDEN' }, { status: 403 });
    }

    await requireRole(['organizer', 'admin']);

    const stats = await getDashboardStats();

    // Sanitize stats to only aggregate numbers to avoid passing sensitive info
    const safeStats = {
      totals: stats.totals,
      fillRates: stats.upcomingEvents.map(e => ({ title: e.title, capacity: e.capacity, confirmed: e.confirmed_count, fill_pct: e.fill_pct })),
      categoryBreakdown: stats.byCategory,
      needsAttention: stats.needsAttention.map(e => ({ title: e.title, capacity: e.capacity, confirmed: e.confirmed_count, waitlisted: e.waitlist_count })),
    };

    const system = `You are a data-driven Tech Carnival Organizer Copilot.
Given the current aggregate registration and event stats, provide actionable insights.
Do NOT hallucinate data. Only use the provided numbers.
Return a JSON object with:
- insights: an array of 2-4 short string bullet points analyzing the data (e.g., highlighting popular categories, low fill rates, or urgent waitlist situations).
- recommendation: a single brief string sentence recommending a concrete action to take right now.`;

    const userPrompt = JSON.stringify(safeStats);

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
