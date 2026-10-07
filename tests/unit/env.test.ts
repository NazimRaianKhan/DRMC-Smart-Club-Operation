import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Environment validation', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = {} as NodeJS.ProcessEnv;
  });

  it('throws an error with missing variables', async () => {
    process.env.DATABASE_URL = 'postgres://localhost';
    const { getEnv } = await import('@/lib/env');
    expect(() => getEnv()).toThrow(/Invalid environment variables/);
  });

  it('parses valid environment variables', async () => {
    process.env.DATABASE_URL = 'postgres://localhost:5432/db';
    process.env.AUTH_SECRET = '12345678901234567890123456789012'; // 32 chars
    process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000';
    
    const { getEnv } = await import('@/lib/env');
    const env = getEnv();
    expect(env.DATABASE_URL).toBe('postgres://localhost:5432/db');
  });
});
