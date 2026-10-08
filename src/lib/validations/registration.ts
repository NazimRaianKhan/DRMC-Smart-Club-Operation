// Compatibility for existing callers; keep rules in one shared schema.
export {
  memberSchema, registrationSchema as registrationInputSchema, validateRegistrationPayload,
  type RegistrationInput, type MemberInput as RegistrationMemberInput,
} from '@/lib/validation/registration';
