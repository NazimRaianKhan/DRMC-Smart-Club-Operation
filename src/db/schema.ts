import {
  pgTable,
  uuid,
  text,
  timestamp,
  pgEnum,
  jsonb,
  integer,
  boolean,
  smallint,
  check,
  index,
  uniqueIndex,
  bigserial,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['participant', 'organizer', 'admin']);
export const eventCategoryEnum = pgEnum('event_category', ['programming', 'ai_ml', 'web_dev', 'robotics', 'gaming', 'workshop', 'quiz', 'hackathon', 'other']);
export const eventStatusEnum = pgEnum('event_status', ['draft', 'published', 'cancelled']);
export const festStatusEnum = pgEnum('fest_status', ['draft', 'published']);
export const registrationStatusEnum = pgEnum('registration_status', ['confirmed', 'waitlisted', 'cancelled', 'rejected', 'checked_in']);
export const participationTypeEnum = pgEnum('participation_type', ['individual', 'team']);
export const festAccentEnum = pgEnum('fest_accent', ['cyan', 'gold', 'violet', 'emerald']);

export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  fullName: text('full_name').notNull(),
  role: userRoleEnum('role').default('participant').notNull(),
  phone: text('phone'),
  institution: text('institution'),
  classLevel: text('class_level'),
  studentId: text('student_id'),
  preferredLang: text('preferred_lang').default('en').notNull(),
  tokenVersion: integer('token_version').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  check('email_lower_chk', sql`${table.email} = lower(${table.email})`),
  check('preferred_lang_chk', sql`${table.preferredLang} in ('en', 'bn')`)
]);

export const fests = pgTable('fests', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  titleBn: text('title_bn'),
  tagline: text('tagline').notNull(),
  taglineBn: text('tagline_bn'),
  description: text('description').notNull(),
  descriptionBn: text('description_bn'),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
  venue: text('venue').notNull(),
  accent: festAccentEnum('accent').default('cyan').notNull(),
  status: festStatusEnum('status').default('draft').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  check('ends_at_after_starts_at_chk', sql`${table.endsAt} > ${table.startsAt}`),
  index('fests_status_starts_at_idx').on(table.status, table.startsAt),
  index('fests_title_trgm_idx').using('gin', sql`${table.title} gin_trgm_ops`),
  index('fests_title_bn_trgm_idx').using('gin', sql`${table.titleBn} gin_trgm_ops`),
]);

export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  festId: uuid('fest_id').references(() => fests.id, { onDelete: 'restrict' }).notNull(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  titleBn: text('title_bn'),
  shortDescription: text('short_description').notNull(),
  shortDescriptionBn: text('short_description_bn'),
  description: text('description').notNull(),
  descriptionBn: text('description_bn'),
  faq: jsonb('faq').default('[]').notNull(),
  faqBn: jsonb('faq_bn'),
  category: eventCategoryEnum('category').notNull(),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
  venue: text('venue').notNull(),
  capacity: integer('capacity').notNull(),
  confirmedCount: integer('confirmed_count').default(0).notNull(),
  participationType: participationTypeEnum('participation_type').default('individual').notNull(),
  teamMinSize: smallint('team_min_size').default(1).notNull(),
  teamMaxSize: smallint('team_max_size').default(1).notNull(),
  registrationOpensAt: timestamp('registration_opens_at', { withTimezone: true }),
  registrationDeadline: timestamp('registration_deadline', { withTimezone: true }).notNull(),
  waitlistEnabled: boolean('waitlist_enabled').default(true).notNull(),
  status: eventStatusEnum('status').default('draft').notNull(),
  isLab: boolean('is_lab').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  check('events_short_desc_len_chk', sql`length(${table.shortDescription}) <= 160`),
  check('events_ends_at_chk', sql`${table.endsAt} > ${table.startsAt}`),
  check('events_capacity_chk', sql`${table.capacity} > 0`),
  check('events_confirmed_count_chk', sql`${table.confirmedCount} >= 0 AND ${table.confirmedCount} <= ${table.capacity}`),
  check('events_reg_deadline_chk', sql`${table.registrationDeadline} <= ${table.startsAt}`),
  check('events_reg_opens_chk', sql`${table.registrationOpensAt} IS NULL OR ${table.registrationOpensAt} < ${table.registrationDeadline}`),
  check('events_team_size_chk', sql`
    (${table.participationType} = 'individual' AND ${table.teamMinSize} = 1 AND ${table.teamMaxSize} = 1) OR
    (${table.participationType} = 'team' AND ${table.teamMinSize} >= 2 AND ${table.teamMaxSize} <= 10 AND ${table.teamMinSize} <= ${table.teamMaxSize})
  `),
  index('events_fest_id_status_starts_idx').on(table.festId, table.status, table.startsAt),
  index('events_status_starts_idx').on(table.status, table.startsAt).where(sql`${table.isLab} = false`),
  index('events_category_idx').on(table.category),
  index('events_title_trgm_idx').using('gin', sql`${table.title} gin_trgm_ops`),
  index('events_short_desc_trgm_idx').using('gin', sql`${table.shortDescription} gin_trgm_ops`),
  index('events_title_bn_trgm_idx').using('gin', sql`${table.titleBn} gin_trgm_ops`),
  index('events_short_desc_bn_trgm_idx').using('gin', sql`${table.shortDescriptionBn} gin_trgm_ops`),
]);

export const registrations = pgTable('registrations', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').references(() => events.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  status: registrationStatusEnum('status').notNull(),
  ticketCode: text('ticket_code').unique().notNull(),
  teamName: text('team_name'),
  notes: text('notes'),
  queuedAt: timestamp('queued_at', { withTimezone: true }).defaultNow().notNull(),
  checkedInAt: timestamp('checked_in_at', { withTimezone: true }),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  idempotencyKey: text('idempotency_key'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  check('reg_team_name_len_chk', sql`${table.teamName} IS NULL OR (length(${table.teamName}) BETWEEN 2 AND 40)`),
  check('reg_notes_len_chk', sql`${table.notes} IS NULL OR length(${table.notes}) <= 500`),
  uniqueIndex('reg_event_user_unq').on(table.eventId, table.userId),
  index('reg_event_status_queued_id_idx').on(table.eventId, table.status, table.queuedAt, table.id),
  index('reg_user_created_idx').on(table.userId, table.createdAt.desc()),
  index('reg_event_created_idx').on(table.eventId, table.createdAt),
]);

export const registrationMembers = pgTable('registration_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  registrationId: uuid('registration_id').references(() => registrations.id, { onDelete: 'cascade' }).notNull(),
  eventId: uuid('event_id').references(() => events.id).notNull(),
  isLeader: boolean('is_leader').notNull(),
  fullName: text('full_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  institution: text('institution').default('DRMC').notNull(),
  classLevel: text('class_level').notNull(),
  studentId: text('student_id'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  check('rm_email_lower_chk', sql`${table.email} = lower(${table.email})`),
  check('rm_class_level_chk', sql`${table.classLevel} IN ('3','4','5','6','7','8','9','10','11','12','other')`),
  uniqueIndex('rm_event_email_active_unq').on(table.eventId, table.email).where(sql`${table.isActive} = true`),
  uniqueIndex('rm_reg_leader_unq').on(table.registrationId).where(sql`${table.isLeader} = true`),
  index('rm_reg_id_idx').on(table.registrationId),
  index('rm_full_name_trgm_idx').using('gin', sql`${table.fullName} gin_trgm_ops`),
  index('rm_email_trgm_idx').using('gin', sql`${table.email} gin_trgm_ops`),
]);

export const auditLog = pgTable('audit_log', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  meta: jsonb('meta').default('{}').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('audit_log_created_idx').on(table.createdAt.desc()),
  index('audit_log_entity_idx').on(table.entityType, table.entityId),
]);

import { relations } from 'drizzle-orm';

export const organizationsRelations = relations(organizations, ({ many }) => ({
  fests: many(fests),
}));

export const usersRelations = relations(users, ({ many }) => ({
  registrations: many(registrations),
  auditLogs: many(auditLog),
}));

export const festsRelations = relations(fests, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [fests.organizationId],
    references: [organizations.id],
  }),
  events: many(events),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  fest: one(fests, {
    fields: [events.festId],
    references: [fests.id],
  }),
  registrations: many(registrations),
  members: many(registrationMembers),
}));

export const registrationsRelations = relations(registrations, ({ one, many }) => ({
  event: one(events, {
    fields: [registrations.eventId],
    references: [events.id],
  }),
  user: one(users, {
    fields: [registrations.userId],
    references: [users.id],
  }),
  members: many(registrationMembers),
}));

export const registrationMembersRelations = relations(registrationMembers, ({ one }) => ({
  registration: one(registrations, {
    fields: [registrationMembers.registrationId],
    references: [registrations.id],
  }),
  event: one(events, {
    fields: [registrationMembers.eventId],
    references: [events.id],
  }),
}));

export const auditLogRelations = relations(auditLog, ({ one }) => ({
  actor: one(users, {
    fields: [auditLog.actorId],
    references: [users.id],
  }),
}));
