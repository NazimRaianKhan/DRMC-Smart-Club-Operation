import { z } from 'zod';

export const classLevels = ['3', '4', '5', '6', '7', '8', '9', '10', '11', '12', 'other'] as const;
const mobile = /^(?:\+?88)?01[3-9]\d{8}$/;
export const memberSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  email: z.string().trim().email().toLowerCase(),
  phone: z.string().trim().regex(mobile).or(z.literal('')).optional(),
  institution: z.string().trim().min(2).max(80),
  classLevel: z.enum(classLevels),
  studentId: z.string().trim().optional(),
});
export interface RegistrationSettings {
  participationType: string;
  teamMinSize: number;
  teamMaxSize: number;
}
const baseSchema = z.object({
  idempotencyKey: z.string().uuid(),
  teamName: z.string().trim().min(2).max(40).optional(),
  houseId: z.string().uuid().or(z.literal('')).transform(val => val === '' ? undefined : val).optional(),
  notes: z.string().trim().max(500).optional(),
  members: z.array(memberSchema).min(1).max(10),
});
function validateMembers(data: z.infer<typeof baseSchema>, ctx: z.RefinementCtx) {
  if (!data.members[0]?.phone) {
    ctx.addIssue({ code: 'custom', message: 'Leader phone is required', path: ['members', 0, 'phone'] });
  }
  const seen = new Set<string>();
  data.members.forEach((member, index) => {
    if (seen.has(member.email)) {
      ctx.addIssue({ code: 'custom', message: 'Duplicate email found in team members', path: ['members', index, 'email'] });
    }
    seen.add(member.email);
  });
}
export const registrationSchema = baseSchema.superRefine(validateMembers);
export function createRegistrationSchema(settings: RegistrationSettings) {
  const team = settings.participationType === 'team';
  const sizeMessage = `Team size must be between ${settings.teamMinSize} and ${settings.teamMaxSize}`;
  return baseSchema.extend({
    // JSON drops undefined properties after client parsing. A solo request must
    // remain valid when the ignored teamName is absent on the server.
    teamName: team ? z.string({ error: 'Team name is required' }).trim().min(2).max(40) : z.unknown().transform(() => undefined).optional(),
    members: z.array(memberSchema).min(team ? settings.teamMinSize : 1, sizeMessage).max(team ? settings.teamMaxSize : 1, sizeMessage),
  }).superRefine(validateMembers);
}
export type MemberInput = z.infer<typeof memberSchema>;
export type RegistrationInput = z.infer<typeof registrationSchema>;

export function validateRegistrationPayload(input: unknown, settings: RegistrationSettings, accountEmail: string) {
  // Enforce identity before validation and duplicate detection, without mutating caller input.
  let normalized = input;
  if (input && typeof input === 'object' && 'members' in input && Array.isArray(input.members)) {
    normalized = { ...input, members: input.members.map((member: unknown, index: number) =>
      index === 0 && member && typeof member === 'object' ? { ...member, email: accountEmail.toLowerCase() } : member) };
  }
  const parsed = createRegistrationSchema(settings).safeParse(normalized);
  if (parsed.success) return { ok: true as const, data: parsed.data };
  const issue = parsed.error.issues[0]!;
  return {
    ok: false as const, code: 'VALIDATION_ERROR' as const, message: issue.message,
    field: issue.path.join('.'),
    ...(issue.path[0] === 'members' && typeof issue.path[1] === 'number' ? { memberIndex: issue.path[1] } : {}),
  };
}
