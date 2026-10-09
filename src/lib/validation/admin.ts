import { z } from 'zod';

export const faqSchema = z.object({
  q: z.string().min(1, 'Question is required').max(200),
  a: z.string().min(1, 'Answer is required').max(1000),
});

export const eventSchema = z.object({
  festId: z.string().uuid(),
  title: z.string().min(1, 'Title is required').max(100),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  shortDescription: z.string().min(1, 'Short description is required').max(160, 'Max 160 characters'),
  description: z.string().min(1, 'Description is required'),
  category: z.enum(['programming', 'ai_ml', 'web_dev', 'robotics', 'gaming', 'workshop', 'quiz', 'hackathon', 'other']),
  startsAt: z.string().min(1, 'Starts at is required'),
  endsAt: z.string().min(1, 'Ends at is required'),
  venue: z.string().min(1, 'Venue is required').max(100),
  capacity: z.number().int().min(1).max(10000),
  participationType: z.enum(['individual', 'team']),
  teamMinSize: z.number().int().min(1),
  teamMaxSize: z.number().int().min(1),
  registrationOpensAt: z.string().optional().nullable(),
  registrationDeadline: z.string().min(1, 'Registration deadline is required'),
  waitlistEnabled: z.boolean(),
  status: z.enum(['draft', 'published', 'cancelled']),
  titleBn: z.string().optional().nullable(),
  shortDescriptionBn: z.string().max(160).optional().nullable(),
  descriptionBn: z.string().optional().nullable(),
  faqs: z.array(faqSchema).max(8).default([]),
  faqsBn: z.array(faqSchema).max(8).optional().nullable(),
}).refine(data => {
  if (data.participationType === 'team') {
    return data.teamMaxSize >= data.teamMinSize;
  }
  return true;
}, {
  message: "Team max size must be greater than or equal to team min size",
  path: ["teamMaxSize"],
}).refine(data => {
  return new Date(data.endsAt) > new Date(data.startsAt);
}, {
  message: "Event end time must be after start time",
  path: ["endsAt"],
}).refine(data => {
  return new Date(data.registrationDeadline) <= new Date(data.startsAt);
}, {
  message: "Registration deadline must be before or equal to event start time",
  path: ["registrationDeadline"],
}).refine(data => {
  if (data.registrationOpensAt) {
    return new Date(data.registrationOpensAt) < new Date(data.registrationDeadline);
  }
  return true;
}, {
  message: "Registration opens time must be before deadline",
  path: ["registrationOpensAt"],
});

export type EventInput = z.infer<typeof eventSchema>;

export const festSchema = z.object({
  organizationId: z.string().uuid(),
  title: z.string().min(1, 'Title is required').max(100),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  tagline: z.string().min(1, 'Tagline is required').max(100),
  description: z.string().min(1, 'Description is required'),
  startsAt: z.string().min(1, 'Starts at is required'),
  endsAt: z.string().min(1, 'Ends at is required'),
  venue: z.string().min(1, 'Venue is required').max(100),
  accent: z.enum(['cyan', 'gold', 'violet', 'emerald']).default('cyan'),
  status: z.enum(['draft', 'published']),
  titleBn: z.string().optional().nullable(),
  taglineBn: z.string().max(100).optional().nullable(),
  descriptionBn: z.string().optional().nullable(),
}).refine(data => {
  return new Date(data.endsAt) > new Date(data.startsAt);
}, {
  message: "Fest end time must be after start time",
  path: ["endsAt"],
});

export type FestInput = z.infer<typeof festSchema>;
