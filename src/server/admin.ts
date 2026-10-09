'use server';

import { requireRole } from '@/server/auth';
import { db } from '@/db/client';
import { events, fests, auditLog, registrations } from '@/db/schema';
import { eq, sql, and, count } from 'drizzle-orm';
import { eventSchema, festSchema, EventInput, FestInput } from '@/lib/validation/admin';
import { dhakaToUtc } from '@/lib/timezone';
import { promoteWaitlist } from '@/server/registrations';
import { revalidateCatalog } from '@/server/revalidate';
import { revalidateTag } from 'next/cache';

async function logAudit(tx: any, actorId: string, action: string, entityType: string, entityId: string, meta: any) {
  await tx.insert(auditLog).values({
    actorId,
    action,
    entityType,
    entityId,
    meta,
  });
}

export async function createEvent(data: EventInput) {
  const session = await requireRole('organizer', 'admin');
  const parsed = eventSchema.parse(data);
  
  const [newEvent] = await db.transaction(async (tx) => {
    // Determine waitlistEnabled
    const [inserted] = await tx.insert(events).values({
      festId: parsed.festId,
      title: parsed.title,
      slug: parsed.slug,
      shortDescription: parsed.shortDescription,
      description: parsed.description,
      category: parsed.category,
      startsAt: dhakaToUtc(parsed.startsAt),
      endsAt: dhakaToUtc(parsed.endsAt),
      venue: parsed.venue,
      capacity: parsed.capacity,
      participationType: parsed.participationType,
      teamMinSize: parsed.teamMinSize,
      teamMaxSize: parsed.teamMaxSize,
      registrationOpensAt: parsed.registrationOpensAt ? dhakaToUtc(parsed.registrationOpensAt) : null,
      registrationDeadline: dhakaToUtc(parsed.registrationDeadline),
      waitlistEnabled: parsed.waitlistEnabled,
      status: parsed.status,
      titleBn: parsed.titleBn,
      shortDescriptionBn: parsed.shortDescriptionBn,
      descriptionBn: parsed.descriptionBn,
      faq: parsed.faqs,
    }).returning({ id: events.id, slug: events.slug });
    
    if (!inserted) throw new Error("Insert failed");
    await logAudit(tx, session.sub, 'create', 'event', inserted.id, { slug: inserted.slug, title: parsed.title });
    return [inserted];
  });
  
  if (!newEvent) throw new Error("Insert failed");
  revalidateCatalog();
  // @ts-ignore
  revalidateTag(`event:${newEvent.slug}`);
  return { success: true, id: newEvent.id };
}

export async function updateEvent(id: string, data: EventInput) {
  const session = await requireRole('organizer', 'admin');
  const parsed = eventSchema.parse(data);
  
  await db.transaction(async (tx) => {
    // 1. Lock event
    const res = await tx.execute(sql`SELECT * FROM events WHERE id = ${id} FOR UPDATE`);
    const evt = res.rows[0] as any;
    if (!evt) throw new Error("Event not found");

    // 2. Check active registrations
    const regRes = await tx.execute(sql`
      SELECT count(*) as cnt FROM registrations 
      WHERE event_id = ${id} AND status IN ('confirmed', 'waitlisted', 'checked_in')
    `);
    const activeRegCount = Number((regRes.rows[0] as any)?.cnt || 0);
    
    // Unpublish check
    if (parsed.status === 'draft' && evt.status === 'published' && activeRegCount > 0) {
      throw new Error("Cannot unpublish event with active registrations");
    }

    // Participation settings lock
    if (activeRegCount > 0) {
      if (
        evt.participation_type !== parsed.participationType ||
        evt.team_min_size !== parsed.teamMinSize ||
        evt.team_max_size !== parsed.teamMaxSize
      ) {
        throw new Error("Cannot change participation settings when active registrations exist");
      }
    }

    // Capacity decrease check
    if (parsed.capacity < evt.confirmed_count) {
      throw new Error("Capacity cannot be lower than current confirmed registrations");
    }

    // Update
    await tx.update(events).set({
      festId: parsed.festId,
      title: parsed.title,
      // slug is editable only in draft, but prompt says "editable only while draft". 
      // If event was published and now has active registrations, slug might be locked? Let's just lock slug if not draft.
      slug: evt.status === 'draft' ? parsed.slug : evt.slug,
      shortDescription: parsed.shortDescription,
      description: parsed.description,
      category: parsed.category,
      startsAt: dhakaToUtc(parsed.startsAt),
      endsAt: dhakaToUtc(parsed.endsAt),
      venue: parsed.venue,
      capacity: parsed.capacity,
      participationType: parsed.participationType,
      teamMinSize: parsed.teamMinSize,
      teamMaxSize: parsed.teamMaxSize,
      registrationOpensAt: parsed.registrationOpensAt ? dhakaToUtc(parsed.registrationOpensAt) : null,
      registrationDeadline: dhakaToUtc(parsed.registrationDeadline),
      waitlistEnabled: parsed.waitlistEnabled,
      status: parsed.status,
      titleBn: parsed.titleBn,
      shortDescriptionBn: parsed.shortDescriptionBn,
      descriptionBn: parsed.descriptionBn,
      faq: parsed.faqs,
      updatedAt: sql`now()`,
    }).where(eq(events.id, id));

    // Capacity increase: promote waitlist
    if (parsed.capacity > evt.capacity) {
      // call promoteWaitlist
      await promoteWaitlist(tx, id);
    }
    
    await logAudit(tx, session.sub, 'update', 'event', id, { previousCapacity: evt.capacity, newCapacity: parsed.capacity });
  });
  
  revalidateCatalog();
  // @ts-ignore
  revalidateTag(`event:${parsed.slug}`);
  return { success: true };
}

export async function cancelEvent(id: string) {
  const session = await requireRole('organizer', 'admin');
  
  await db.transaction(async (tx) => {
    const [evt] = await tx.update(events)
      .set({ status: 'cancelled', updatedAt: sql`now()` })
      .where(eq(events.id, id))
      .returning({ slug: events.slug });
      
    if (!evt) throw new Error("Event not found");
    await logAudit(tx, session.sub, 'cancel', 'event', id, {});
  });
  
  revalidateCatalog();
  return { success: true };
}

export async function createFest(data: FestInput) {
  const session = await requireRole('organizer', 'admin');
  const parsed = festSchema.parse(data);
  
  const [newFest] = await db.transaction(async (tx) => {
    const [inserted] = await tx.insert(fests).values({
      organizationId: parsed.organizationId,
      title: parsed.title,
      slug: parsed.slug,
      tagline: parsed.tagline,
      description: parsed.description,
      startsAt: dhakaToUtc(parsed.startsAt),
      endsAt: dhakaToUtc(parsed.endsAt),
      venue: parsed.venue,
      accent: parsed.accent,
      status: parsed.status,
      titleBn: parsed.titleBn,
      taglineBn: parsed.taglineBn,
      descriptionBn: parsed.descriptionBn,
    }).returning({ id: fests.id, slug: fests.slug });
    
    if (!inserted) throw new Error("Insert failed");
    await logAudit(tx, session.sub, 'create', 'fest', inserted.id, { slug: inserted.slug });
    return [inserted];
  });
  
  if (!newFest) throw new Error("Insert failed");
  revalidateCatalog();
  // @ts-ignore
  revalidateTag(`fest:${newFest.slug}`);
  return { success: true, id: newFest.id };
}

export async function updateFest(id: string, data: FestInput) {
  const session = await requireRole('organizer', 'admin');
  const parsed = festSchema.parse(data);
  
  await db.transaction(async (tx) => {
    await tx.update(fests).set({
      organizationId: parsed.organizationId,
      title: parsed.title,
      slug: parsed.slug,
      tagline: parsed.tagline,
      description: parsed.description,
      startsAt: dhakaToUtc(parsed.startsAt),
      endsAt: dhakaToUtc(parsed.endsAt),
      venue: parsed.venue,
      accent: parsed.accent,
      status: parsed.status,
      titleBn: parsed.titleBn,
      taglineBn: parsed.taglineBn,
      descriptionBn: parsed.descriptionBn,
      updatedAt: sql`now()`,
    }).where(eq(fests.id, id));
    
    await logAudit(tx, session.sub, 'update', 'fest', id, { slug: parsed.slug });
  });
  
  revalidateCatalog();
  // @ts-ignore
  revalidateTag(`fest:${parsed.slug}`);
  return { success: true };
}
