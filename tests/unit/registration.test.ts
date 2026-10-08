import { describe, it, expect } from 'vitest';
import { createRegistrationSchema, validateRegistrationPayload } from '@/lib/validation/registration';
const team = { participationType: 'team', teamMinSize: 2, teamMaxSize: 4 };
const solo = { participationType: 'individual', teamMinSize: 1, teamMaxSize: 1 };
const member = { fullName: 'Test User', email: 'test@example.com', phone: '01711223344', institution: 'DRMC', classLevel: '10' };
const payload = () => ({ idempotencyKey: crypto.randomUUID(), members: [{ ...member }] });

describe('Registration validation', () => {
  it('accepts a solo form after client parsing and JSON serialization', () => {
    const clientData = createRegistrationSchema(solo).parse({ ...payload(), teamName: '' });
    const requestBody = JSON.parse(JSON.stringify(clientData));
    expect(requestBody).not.toHaveProperty('teamName');
    expect(validateRegistrationPayload(requestBody, solo, member.email)).toMatchObject({ ok: true });
  });
  it('returns the actual invalid member field for server-side form feedback', () => {
    const result = validateRegistrationPayload({ ...payload(), members: [{ ...member, phone: '123' }] }, solo, member.email);
    expect(result).toMatchObject({ ok: false, code: 'VALIDATION_ERROR', memberIndex: 0, field: 'members.0.phone' });
  });
  it('validates solo and ignores any team name', () => {
    const result = createRegistrationSchema(solo).safeParse({ ...payload(), teamName: '' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.teamName).toBeUndefined();
  });
  it('requires a team name and enforces team limits', () => {
    expect(createRegistrationSchema(team).safeParse(payload()).success).toBe(false);
    for (const count of [1, 5]) {
      expect(createRegistrationSchema(team).safeParse({ ...payload(), teamName: 'Team', members: Array.from({ length: count }, (_, i) => ({ ...member, email: `m${i}@example.com` })) }).success).toBe(false);
    }
    expect(createRegistrationSchema(team).safeParse({ ...payload(), teamName: 'Team', members: [member, { ...member, email: 'second@example.com', phone: undefined }] }).success).toBe(true);
  });
  it('forces the account email before detecting normalized duplicates and does not mutate input', () => {
    const input = { ...payload(), teamName: 'Team', members: [{ ...member, email: 'spoof@example.com' }, { ...member, email: 'TEST@example.com' }] };
    expect(validateRegistrationPayload(input, team, member.email)).toMatchObject({ ok: false, code: 'VALIDATION_ERROR', memberIndex: 1 });
    expect(input.members[0]?.email).toBe('spoof@example.com');
    const result = validateRegistrationPayload({ ...payload(), members: [{ ...member, email: 'invalid' }] }, solo, member.email);
    expect(result.ok && result.data.members[0]?.email).toBe(member.email);
  });
  it.each(['01711223344', '8801711223344', '+8801711223344'])('accepts BD phone %s', phone => {
    expect(createRegistrationSchema(solo).safeParse({ ...payload(), members: [{ ...member, phone }] }).success).toBe(true);
  });
  it.each(['', '01211223344', '+101711223344', '01711', undefined])('rejects invalid or missing leader phone %s', phone => {
    expect(createRegistrationSchema(solo).safeParse({ ...payload(), members: [{ ...member, phone }] }).success).toBe(false);
  });
  it.each([
    { fullName: 'A' }, { fullName: 'a'.repeat(81) }, { institution: 'D' }, { institution: 'x'.repeat(81) },
    { email: 'invalid' }, { classLevel: '2' }, { classLevel: '13' },
  ])('rejects invalid member fields %j', fields => {
    expect(createRegistrationSchema(solo).safeParse({ ...payload(), members: [{ ...member, ...fields }] }).success).toBe(false);
  });
  it('rejects malformed payloads, extra solo members, long notes and invalid keys', () => {
    for (const input of [null, {}, { ...payload(), members: [] }, { ...payload(), members: [member, member] }, { ...payload(), notes: 'x'.repeat(501) }, { ...payload(), idempotencyKey: 'bad' }]) {
      expect(validateRegistrationPayload(input, solo, member.email).ok).toBe(false);
    }
  });
});
