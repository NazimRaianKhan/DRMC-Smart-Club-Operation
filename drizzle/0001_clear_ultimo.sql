CREATE INDEX "events_title_bn_trgm_idx" ON "events" USING gin ("title_bn" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "events_short_desc_bn_trgm_idx" ON "events" USING gin ("short_description_bn" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "fests_title_trgm_idx" ON "fests" USING gin ("title" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "fests_title_bn_trgm_idx" ON "fests" USING gin ("title_bn" gin_trgm_ops);