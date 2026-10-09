import { z } from 'zod';

export const eventsQuerySchema = z.object({
  q: z.string().trim().max(80).optional(),
  category: z.string().optional(),
  fest: z.string().optional(),
  state: z.string().optional(),
  when: z.enum(['upcoming', 'past', 'all']).default('upcoming'),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sort: z.enum(['soonest', 'deadline', 'seats']).default('soonest'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(24).default(12),
  lang: z.enum(['en', 'bn']).default('en'),
});

export type EventsQueryInput = z.infer<typeof eventsQuerySchema>;

