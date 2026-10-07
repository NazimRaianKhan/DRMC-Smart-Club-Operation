import { describe, it, expect } from 'vitest';
import { signupSchema, loginSchema } from '@/lib/validations/auth';

describe('Auth Validations', () => {
  describe('Signup Schema', () => {
    it('should validate valid signup input', () => {
      const input = {
        fullName: 'John Doe',
        email: 'john@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
        phone: '01711111111',
        institution: 'DRMC',
        classLevel: '11',
        studentId: '21001',
        lang: 'en'
      };
      
      const result = signupSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject non-matching passwords', () => {
      const input = {
        fullName: 'John Doe',
        email: 'john@example.com',
        password: 'Password123',
        confirmPassword: 'Password321',
      };
      
      const result = signupSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]!.path).toContain('confirmPassword');
      }
    });

    it('should reject password without numbers', () => {
      const input = {
        fullName: 'John Doe',
        email: 'john@example.com',
        password: 'Password',
        confirmPassword: 'Password',
      };
      const result = signupSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe('Login Schema', () => {
    it('should validate valid login input', () => {
      const result = loginSchema.safeParse({ email: 'john@example.com', password: 'Password123' });
      expect(result.success).toBe(true);
    });
  });
});
