import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { db } from '@/db/client';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { POST as loginPOST } from '@/app/api/auth/login/route';
import { POST as signupPOST } from '@/app/api/auth/signup/route';
import { POST as logoutPOST } from '@/app/api/auth/logout/route';

// Mock next/headers
vi.mock('next/headers', () => ({
  headers: () => new Map([['x-forwarded-for', '127.0.0.1'], ['origin', 'http://localhost:3000'], ['host', 'localhost:3000']]),
  cookies: () => ({
    set: vi.fn(),
    delete: vi.fn(),
  }),
}));

describe('Auth Integration API', () => {
  const testEmail = 'newuser@test.com';

  beforeAll(async () => {
    await db.delete(users).where(eq(users.email, testEmail));
  });

  afterAll(async () => {
    await db.delete(users).where(eq(users.email, testEmail));
  });

  it('should sign up a user', async () => {
    const req = new Request('http://localhost/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        fullName: 'New User',
        email: testEmail,
        password: 'Password123',
        confirmPassword: 'Password123',
      })
    });

    const res = await signupPOST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);

    const user = await db.query.users.findFirst({
      where: eq(users.email, testEmail)
    });
    expect(user).toBeDefined();
    expect(user?.role).toBe('participant');
  });

  it('should reject duplicate signup', async () => {
    const req = new Request('http://localhost/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        fullName: 'New User',
        email: testEmail,
        password: 'Password123',
        confirmPassword: 'Password123',
      })
    });

    const res = await signupPOST(req);
    expect(res.status).toBe(409);
  });

  it('should login a user', async () => {
    const req = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: testEmail,
        password: 'Password123',
      })
    });

    const res = await loginPOST(req);
    expect(res.status).toBe(200);
  });
  
  it('should reject login with wrong password', async () => {
    const req = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: testEmail,
        password: 'WrongPassword123',
      })
    });

    const res = await loginPOST(req);
    expect(res.status).toBe(401);
  });
});

