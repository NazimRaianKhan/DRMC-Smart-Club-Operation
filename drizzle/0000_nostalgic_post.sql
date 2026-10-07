CREATE EXTENSION IF NOT EXISTS pg_trgm;  
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE TYPE "public"."event_category" AS ENUM('programming', 'ai_ml', 'web_dev', 'robotics', 'gaming', 'workshop', 'quiz', 'hackathon', 'other');--> statement-breakpoint
CREATE TYPE "public"."event_status" AS ENUM('draft', 'published', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."fest_accent" AS ENUM('cyan', 'gold', 'violet', 'emerald');--> statement-breakpoint
CREATE TYPE "public"."fest_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TYPE "public"."participation_type" AS ENUM('individual', 'team');--> statement-breakpoint
CREATE TYPE "public"."registration_status" AS ENUM('confirmed', 'waitlisted', 'cancelled', 'rejected', 'checked_in');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('participant', 'organizer', 'admin');--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"actor_id" uuid,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"meta" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fest_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"title_bn" text,
	"short_description" text NOT NULL,
	"short_description_bn" text,
	"description" text NOT NULL,
	"description_bn" text,
	"faq" jsonb DEFAULT '[]' NOT NULL,
	"faq_bn" jsonb,
	"category" "event_category" NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"venue" text NOT NULL,
	"capacity" integer NOT NULL,
	"confirmed_count" integer DEFAULT 0 NOT NULL,
	"participation_type" "participation_type" DEFAULT 'individual' NOT NULL,
	"team_min_size" smallint DEFAULT 1 NOT NULL,
	"team_max_size" smallint DEFAULT 1 NOT NULL,
	"registration_opens_at" timestamp with time zone,
	"registration_deadline" timestamp with time zone NOT NULL,
	"waitlist_enabled" boolean DEFAULT true NOT NULL,
	"status" "event_status" DEFAULT 'draft' NOT NULL,
	"is_lab" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "events_slug_unique" UNIQUE("slug"),
	CONSTRAINT "events_short_desc_len_chk" CHECK (length("events"."short_description") <= 160),
	CONSTRAINT "events_ends_at_chk" CHECK ("events"."ends_at" > "events"."starts_at"),
	CONSTRAINT "events_capacity_chk" CHECK ("events"."capacity" > 0),
	CONSTRAINT "events_confirmed_count_chk" CHECK ("events"."confirmed_count" >= 0 AND "events"."confirmed_count" <= "events"."capacity"),
	CONSTRAINT "events_reg_deadline_chk" CHECK ("events"."registration_deadline" <= "events"."starts_at"),
	CONSTRAINT "events_reg_opens_chk" CHECK ("events"."registration_opens_at" IS NULL OR "events"."registration_opens_at" < "events"."registration_deadline"),
	CONSTRAINT "events_team_size_chk" CHECK (
    ("events"."participation_type" = 'individual' AND "events"."team_min_size" = 1 AND "events"."team_max_size" = 1) OR
    ("events"."participation_type" = 'team' AND "events"."team_min_size" >= 2 AND "events"."team_max_size" <= 10 AND "events"."team_min_size" <= "events"."team_max_size")
  )
);
--> statement-breakpoint
CREATE TABLE "fests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"title_bn" text,
	"tagline" text NOT NULL,
	"tagline_bn" text,
	"description" text NOT NULL,
	"description_bn" text,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"venue" text NOT NULL,
	"accent" "fest_accent" DEFAULT 'cyan' NOT NULL,
	"status" "fest_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fests_slug_unique" UNIQUE("slug"),
	CONSTRAINT "ends_at_after_starts_at_chk" CHECK ("fests"."ends_at" > "fests"."starts_at")
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "registration_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"registration_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"is_leader" boolean NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"institution" text DEFAULT 'DRMC' NOT NULL,
	"class_level" text NOT NULL,
	"student_id" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rm_email_lower_chk" CHECK ("registration_members"."email" = lower("registration_members"."email")),
	CONSTRAINT "rm_class_level_chk" CHECK ("registration_members"."class_level" IN ('3','4','5','6','7','8','9','10','11','12','other'))
);
--> statement-breakpoint
CREATE TABLE "registrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "registration_status" NOT NULL,
	"ticket_code" text NOT NULL,
	"team_name" text,
	"notes" text,
	"queued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"checked_in_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"idempotency_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "registrations_ticket_code_unique" UNIQUE("ticket_code"),
	CONSTRAINT "reg_team_name_len_chk" CHECK ("registrations"."team_name" IS NULL OR (length("registrations"."team_name") BETWEEN 2 AND 40)),
	CONSTRAINT "reg_notes_len_chk" CHECK ("registrations"."notes" IS NULL OR length("registrations"."notes") <= 500)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"full_name" text NOT NULL,
	"role" "user_role" DEFAULT 'participant' NOT NULL,
	"phone" text,
	"institution" text,
	"class_level" text,
	"student_id" text,
	"preferred_lang" text DEFAULT 'en' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "email_lower_chk" CHECK ("users"."email" = lower("users"."email")),
	CONSTRAINT "preferred_lang_chk" CHECK ("users"."preferred_lang" in ('en', 'bn'))
);
--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_fest_id_fests_id_fk" FOREIGN KEY ("fest_id") REFERENCES "public"."fests"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fests" ADD CONSTRAINT "fests_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_members" ADD CONSTRAINT "registration_members_registration_id_registrations_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."registrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_members" ADD CONSTRAINT "registration_members_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_log_created_idx" ON "audit_log" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "audit_log_entity_idx" ON "audit_log" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "events_fest_id_status_starts_idx" ON "events" USING btree ("fest_id","status","starts_at");--> statement-breakpoint
CREATE INDEX "events_status_starts_idx" ON "events" USING btree ("status","starts_at") WHERE "events"."is_lab" = false;--> statement-breakpoint
CREATE INDEX "events_category_idx" ON "events" USING btree ("category");--> statement-breakpoint
CREATE INDEX "events_title_trgm_idx" ON "events" USING gin ("title" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "events_short_desc_trgm_idx" ON "events" USING gin ("short_description" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "fests_status_starts_at_idx" ON "fests" USING btree ("status","starts_at");--> statement-breakpoint
CREATE UNIQUE INDEX "rm_event_email_active_unq" ON "registration_members" USING btree ("event_id","email") WHERE "registration_members"."is_active" = true;--> statement-breakpoint
CREATE UNIQUE INDEX "rm_reg_leader_unq" ON "registration_members" USING btree ("registration_id") WHERE "registration_members"."is_leader" = true;--> statement-breakpoint
CREATE INDEX "rm_reg_id_idx" ON "registration_members" USING btree ("registration_id");--> statement-breakpoint
CREATE INDEX "rm_full_name_trgm_idx" ON "registration_members" USING gin ("full_name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "rm_email_trgm_idx" ON "registration_members" USING gin ("email" gin_trgm_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "reg_event_user_unq" ON "registrations" USING btree ("event_id","user_id");--> statement-breakpoint
CREATE INDEX "reg_event_status_queued_id_idx" ON "registrations" USING btree ("event_id","status","queued_at","id");--> statement-breakpoint
CREATE INDEX "reg_user_created_idx" ON "registrations" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "reg_event_created_idx" ON "registrations" USING btree ("event_id","created_at");
