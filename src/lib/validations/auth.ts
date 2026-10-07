import { z } from 'zod';

export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters')
  .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
  .regex(/[0-9]/, 'Password must contain at least one digit');

export const signupSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: passwordSchema,
  confirmPassword: z.string(),
  phone: z.string().optional(),
  institution: z.string().optional(),
  classLevel: z.string().optional(),
  studentId: z.string().optional(),
  lang: z.enum(['en', 'bn']).default('en'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

