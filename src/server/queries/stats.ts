import { db } from '@/db/client';
import { sql } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';

export async function fetchStats() {
  // Exclude is_lab = true
  const totalsQuery = await db.execute(sql`
    SELECT 
      (SELECT count(*) FROM fests WHERE status = 'published') as published_fests,
      (SELECT count(*) FROM events WHERE status = 'published' AND is_lab = false) as published_events,
      (SELECT count(*) FROM registrations r JOIN events e ON r.event_id = e.id WHERE r.status IN ('confirmed', 'waitlisted', 'checked_in') AND e.is_lab = false) as total_active,
      (SELECT count(*) FROM registrations r JOIN events e ON r.event_id = e.id WHERE r.status = 'confirmed' AND e.is_lab = false) as confirmed,
      (SELECT count(*) FROM registrations r JOIN events e ON r.event_id = e.id WHERE r.status = 'waitlisted' AND e.is_lab = false) as waitlisted,
      (SELECT count(*) FROM registrations r JOIN events e ON r.event_id = e.id WHERE r.status = 'checked_in' AND e.is_lab = false) as checked_in,
      (SELECT SUM(confirmed_count)::float / NULLIF(SUM(capacity), 0) FROM events WHERE status = 'published' AND is_lab = false) as fill_rate
  `);

  const totals = totalsQuery.rows[0];

  const upcomingEventsQuery = await db.execute(sql`
    SELECT id, title, confirmed_count, capacity, 
           (confirmed_count::float / NULLIF(capacity, 0)) as fill_pct
    FROM events 
    WHERE status = 'published' AND is_lab = false 
    ORDER BY starts_at ASC 
    LIMIT 12
  `);
  
  const daysQuery = await db.execute(sql`
    WITH days AS (
      SELECT generate_series(
        date_trunc('day', now() AT TIME ZONE 'Asia/Dhaka') - interval '13 days',
        date_trunc('day', now() AT TIME ZONE 'Asia/Dhaka'),
        '1 day'::interval
      ) AS day
    )
    SELECT d.day, count(r.id) as count
    FROM days d
    LEFT JOIN registrations r ON date_trunc('day', r.queued_at AT TIME ZONE 'Asia/Dhaka') = d.day
    LEFT JOIN events e ON r.event_id = e.id AND e.is_lab = false
    GROUP BY d.day ORDER BY d.day ASC
  `);

  const categoryQuery = await db.execute(sql`
    SELECT e.category, count(r.id) as count
    FROM registrations r
    JOIN events e ON r.event_id = e.id
    WHERE r.status IN ('confirmed', 'checked_in') AND e.is_lab = false
    GROUP BY e.category
  `);

  const classLevelQuery = await db.execute(sql`
    SELECT rm.class_level, count(rm.id) as count
    FROM registration_members rm
    JOIN registrations r ON rm.registration_id = r.id
    JOIN events e ON r.event_id = e.id
    WHERE rm.is_active = true AND r.status IN ('confirmed', 'checked_in') AND e.is_lab = false
    GROUP BY rm.class_level
    ORDER BY count DESC
  `);

  const needsAttentionQuery = await db.execute(sql`
    SELECT id, title, confirmed_count, capacity, 
      (SELECT count(*) FROM registrations WHERE event_id = e.id AND status = 'waitlisted') as waitlist_count
    FROM events e
    WHERE status = 'published' AND is_lab = false
    AND (
      (starts_at - now() < interval '48 hours' AND confirmed_count::float / NULLIF(capacity, 0) < 0.5)
      OR
      (confirmed_count >= capacity AND (SELECT count(*) FROM registrations WHERE event_id = e.id AND status = 'waitlisted') > 0)
    )
  `);

  return {
    totals: {
      publishedFests: Number(totals?.published_fests || 0),
      publishedEvents: Number(totals?.published_events || 0),
      totalActive: Number(totals?.total_active || 0),
      confirmed: Number(totals?.confirmed || 0),
      waitlisted: Number(totals?.waitlisted || 0),
      checkedIn: Number(totals?.checked_in || 0),
      fillRate: Number(totals?.fill_rate || 0)
    },
    upcomingEvents: upcomingEventsQuery.rows,
    timeline: daysQuery.rows.map((r: any) => ({ date: r.day, count: Number(r.count) })),
    byCategory: categoryQuery.rows.map((r: any) => ({ category: r.category, count: Number(r.count) })),
    byClassLevel: classLevelQuery.rows.map((r: any) => ({ classLevel: r.class_level, count: Number(r.count) })),
    needsAttention: needsAttentionQuery.rows
  };
}

export const getDashboardStats = unstable_cache(
  fetchStats,
  ['admin-dashboard-stats'],
  { revalidate: 30, tags: ['stats', 'events', 'registrations'] }
);
