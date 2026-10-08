import { db } from '@/db/client';
import { events, fests } from '@/db/schema';
import { and, eq, ilike, or, desc, asc, sql, SQL } from 'drizzle-orm';
import { EventsQueryInput } from '@/lib/validations/events';
import { getEventState, seatsLeft } from '@/lib/event-state';
import { unstable_cache } from 'next/cache';

export async function getEventsQuery(params: EventsQueryInput, now: Date = new Date()) {
  const { q, category, fest, state, when, sort, page, pageSize, lang } = params;

  const conditions: SQL[] = [
    eq(events.status, 'published'),
    eq(events.isLab, false),
    eq(fests.status, 'published')
  ];

  if (q) {
    const escapedQ = q.replace(/[%_\\]/g, '\\$&');
    const pattern = `%${escapedQ}%`;
    conditions.push(
      or(
        ilike(events.title, pattern),
        ilike(events.titleBn, pattern),
        ilike(events.shortDescription, pattern),
        ilike(events.shortDescriptionBn, pattern),
        ilike(fests.title, pattern),
        ilike(fests.titleBn, pattern)
      )!
    );
  }

  if (category) {
    const cats = category.split(',').filter(Boolean);
    if (cats.length > 0) {
      const inArraySql = sql.join(cats.map(c => sql`${c}`), sql`, `);
      conditions.push(sql`${events.category} IN (${inArraySql})`);
    }
  }

  if (fest) {
    conditions.push(eq(fests.slug, fest));
  }

  if (when === 'upcoming') {
    conditions.push(sql`${events.startsAt} >= ${now}`);
  } else if (when === 'past') {
    conditions.push(sql`${events.startsAt} < ${now}`);
  }

  if (state) {
    const states = state.split(',').filter(Boolean);
    if (states.length > 0) {
      const stateConds: SQL[] = [];
      for (const st of states) {
        if (st === 'ended') {
          stateConds.push(sql`${events.startsAt} < ${now}`);
        } else if (st === 'closed') {
          stateConds.push(sql`${events.registrationDeadline} <= ${now} AND ${events.startsAt} >= ${now}`);
        } else if (st === 'not_open') {
          stateConds.push(sql`${events.registrationOpensAt} IS NOT NULL AND ${events.registrationOpensAt} > ${now}`);
        } else if (st === 'full') {
          stateConds.push(sql`${events.confirmedCount} >= ${events.capacity} AND ${events.waitlistEnabled} = false AND ${events.registrationDeadline} > ${now} AND (${events.registrationOpensAt} IS NULL OR ${events.registrationOpensAt} <= ${now})`);
        } else if (st === 'waitlist') {
          stateConds.push(sql`${events.confirmedCount} >= ${events.capacity} AND ${events.waitlistEnabled} = true AND ${events.registrationDeadline} > ${now} AND (${events.registrationOpensAt} IS NULL OR ${events.registrationOpensAt} <= ${now})`);
        } else if (st === 'closing_soon') {
          const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
          stateConds.push(sql`${events.confirmedCount} < ${events.capacity} AND ${events.registrationDeadline} > ${now} AND ${events.registrationDeadline} <= ${in48h} AND (${events.registrationOpensAt} IS NULL OR ${events.registrationOpensAt} <= ${now})`);
        } else if (st === 'open') {
          const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
          stateConds.push(sql`${events.confirmedCount} < ${events.capacity} AND ${events.registrationDeadline} > ${in48h} AND (${events.registrationOpensAt} IS NULL OR ${events.registrationOpensAt} <= ${now})`);
        }
      }
      if (stateConds.length > 0) {
        conditions.push(or(...stateConds)!);
      }
    }
  }

  let orderBy: SQL;
  if (sort === 'deadline') {
    orderBy = asc(events.registrationDeadline);
  } else if (sort === 'seats') {
    // seats left desc
    orderBy = sql`GREATEST(${events.capacity} - ${events.confirmedCount}, 0) DESC, ${events.startsAt} ASC`;
  } else {
    // soonest
    orderBy = asc(events.startsAt);
  }

  const offset = (page - 1) * pageSize;

  const rawResults = await db
    .select({
      id: events.id,
      slug: events.slug,
      title: events.title,
      titleBn: events.titleBn,
      shortDescription: events.shortDescription,
      shortDescriptionBn: events.shortDescriptionBn,
      category: events.category,
      startsAt: events.startsAt,
      endsAt: events.endsAt,
      venue: events.venue,
      registrationDeadline: events.registrationDeadline,
      registrationOpensAt: events.registrationOpensAt,
      capacity: events.capacity,
      confirmedCount: events.confirmedCount,
      waitlistEnabled: events.waitlistEnabled,
      participationType: events.participationType,
      teamMinSize: events.teamMinSize,
      teamMaxSize: events.teamMaxSize,
      status: events.status,
      festSlug: fests.slug,
      festTitle: fests.title,
      festTitleBn: fests.titleBn,
      festAccent: fests.accent,
    })
    .from(events)
    .innerJoin(fests, eq(events.festId, fests.id))
    .where(and(...conditions))
    .orderBy(orderBy)
    // Query limit + 1 to check hasMore
    .limit(pageSize + 1)
    .offset(offset);

  const hasMore = rawResults.length > pageSize;
  const itemsToProcess = hasMore ? rawResults.slice(0, pageSize) : rawResults;

  // Process items, applying state filters and computing derived values
  const items = itemsToProcess.map((row) => {
    const computedState = getEventState({
      status: row.status,
      startsAt: row.startsAt,
      registrationOpensAt: row.registrationOpensAt,
      registrationDeadline: row.registrationDeadline,
      capacity: row.capacity,
      confirmedCount: row.confirmedCount,
      waitlistEnabled: row.waitlistEnabled,
    }, now);

    return {
      id: row.id,
      slug: row.slug,
      title: lang === 'bn' && row.titleBn ? row.titleBn : row.title,
      shortDescription: lang === 'bn' && row.shortDescriptionBn ? row.shortDescriptionBn : row.shortDescription,
      category: row.category,
      startsAt: row.startsAt,
      endsAt: row.endsAt,
      venue: row.venue,
      registrationDeadline: row.registrationDeadline,
      registrationOpensAt: row.registrationOpensAt,
      capacity: row.capacity,
      confirmedCount: row.confirmedCount,
      waitlistEnabled: row.waitlistEnabled,
      participationType: row.participationType,
      teamMinSize: row.teamMinSize,
      teamMaxSize: row.teamMaxSize,
      status: row.status,
      state: computedState,
      seatsLeft: seatsLeft({ capacity: row.capacity, confirmedCount: row.confirmedCount }),
      fest: {
        slug: row.festSlug,
        title: lang === 'bn' && row.festTitleBn ? row.festTitleBn : row.festTitle,
        accent: row.festAccent,
      }
    };
  });

  // Because computed state relies on application logic, we must filter post-DB.
  // Wait, the prompt says "State filters are SQL conditions using now()."
  // Let me rethink that. If it's an SQL condition, I should put it in the DB query!
  // It says "State filters are SQL conditions using now()." So I should translate the states to SQL.
  // But computing it post-DB is also fine unless there's a huge offset.
  // Let's rewrite the state filter as SQL if state is provided.
  // Actually, I can just append SQL conditions for the state.
  return { items, page, pageSize, hasMore, filtersEcho: params };
}

export async function getFestBySlug(slug: string, lang: string) {
  const festResult = await db.query.fests.findFirst({
    where: and(eq(fests.slug, slug), eq(fests.status, 'published')),
    with: {
      events: {
        where: and(eq(events.status, 'published'), eq(events.isLab, false)),
        orderBy: [asc(events.startsAt)]
      }
    }
  });

  if (!festResult) return null;

  // Localize and format fest
  const fest = {
    ...festResult,
    title: lang === 'bn' && festResult.titleBn ? festResult.titleBn : festResult.title,
    tagline: lang === 'bn' && festResult.taglineBn ? festResult.taglineBn : festResult.tagline,
    description: lang === 'bn' && festResult.descriptionBn ? festResult.descriptionBn : festResult.description,
  };

  const now = new Date();
  
  // Format events summary
  const eventsList = (festResult.events as any[]).map((ev: any) => ({
    id: ev.id,
    slug: ev.slug,
    title: lang === 'bn' && ev.titleBn ? ev.titleBn : ev.title,
    shortDescription: lang === 'bn' && ev.shortDescriptionBn ? ev.shortDescriptionBn : ev.shortDescription,
    category: ev.category,
    startsAt: ev.startsAt,
    endsAt: ev.endsAt,
    venue: ev.venue,
    registrationDeadline: ev.registrationDeadline,
    registrationOpensAt: ev.registrationOpensAt,
    capacity: ev.capacity,
    confirmedCount: ev.confirmedCount,
    waitlistEnabled: ev.waitlistEnabled,
    participationType: ev.participationType,
    teamMinSize: ev.teamMinSize,
    teamMaxSize: ev.teamMaxSize,
    status: ev.status,
    state: getEventState(ev, now),
    seatsLeft: seatsLeft(ev),
    fest: {
      slug: fest.slug,
      title: fest.title,
      accent: fest.accent,
    }
  }));

  return { fest, eventsList };
}

export async function getEventBySlug(slug: string, lang: string) {
  const eventResult = await db.query.events.findFirst({
    where: and(
      eq(events.slug, slug),
      or(eq(events.status, 'published'), eq(events.status, 'cancelled')),
      eq(events.isLab, false)
    ),
    with: {
      fest: true
    }
  });

  if (!eventResult || (eventResult.fest as any).status !== 'published') return null;

  const now = new Date();
  
  return {
    ...eventResult,
    title: lang === 'bn' && eventResult.titleBn ? eventResult.titleBn : eventResult.title,
    description: lang === 'bn' && eventResult.descriptionBn ? eventResult.descriptionBn : eventResult.description,
    shortDescription: lang === 'bn' && eventResult.shortDescriptionBn ? eventResult.shortDescriptionBn : eventResult.shortDescription,
    faq: lang === 'bn' && eventResult.faqBn ? eventResult.faqBn : eventResult.faq,
    state: getEventState(eventResult, now),
    seatsLeft: seatsLeft(eventResult),
    fest: {
      ...(eventResult.fest as any),
      title: lang === 'bn' && (eventResult.fest as any).titleBn ? (eventResult.fest as any).titleBn : (eventResult.fest as any).title,
      tagline: lang === 'bn' && (eventResult.fest as any).taglineBn ? (eventResult.fest as any).taglineBn : (eventResult.fest as any).tagline,
      description: lang === 'bn' && (eventResult.fest as any).descriptionBn ? (eventResult.fest as any).descriptionBn : (eventResult.fest as any).description,
    }
  };
}

export const getCachedFestBySlug = (slug: string, lang: string) => unstable_cache(
  async () => getFestBySlug(slug, lang),
  [`fest-${slug}-${lang}`],
  { tags: ['fests', `fest:${slug}`], revalidate: 3600 }
)();

export const getCachedEventBySlug = (slug: string, lang: string) => unstable_cache(
  async () => getEventBySlug(slug, lang),
  [`event-${slug}-${lang}`],
  { tags: ['events', `event:${slug}`], revalidate: 3600 }
)();
