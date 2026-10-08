import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/headers', () => ({ cookies: vi.fn(), headers: vi.fn() }));
vi.mock('jose', () => ({ jwtVerify: vi.fn(), SignJWT: vi.fn() }));
vi.mock('@/db/client', () => ({ db: { query: { users: { findFirst: vi.fn() } } } }));

import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { db } from '@/db/client';
import { getCurrentUser, requireUser, requireRole, ForbiddenError, UnauthenticatedError } from '@/server/auth';

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(cookies).mockResolvedValue({ get: () => ({ value: 'signed-token' }) } as never);
  vi.mocked(jwtVerify).mockResolvedValue({ payload: { sub: 'account-id', role: 'admin', name: 'Old Name' } } as never);
  vi.mocked(db.query.users.findFirst).mockResolvedValue({ id: 'account-id', role: 'participant', fullName: 'Current Name', email: 'test@example.com' } as never);
});

describe('Current account role authorization', () => {
  it('uses the database role and name instead of stale JWT claims', async () => {
    expect(await requireUser()).toEqual({ sub: 'account-id', role: 'participant', name: 'Current Name' });
    await expect(requireRole('admin')).rejects.toBeInstanceOf(ForbiddenError);
  });
  it('allows staff access after a database role change', async () => {
    vi.mocked(jwtVerify).mockResolvedValue({ payload: { sub: 'account-id', role: 'participant' } } as never);
    vi.mocked(db.query.users.findFirst).mockResolvedValue({ id: 'account-id', role: 'organizer', fullName: 'Organizer' } as never);
    expect(await requireRole('organizer', 'admin')).toMatchObject({ role: 'organizer' });
  });
  it('rejects deleted accounts even with a signed session', async () => {
    vi.mocked(db.query.users.findFirst).mockResolvedValue(undefined);
    expect(await getCurrentUser()).toBeNull();
    await expect(requireUser()).rejects.toBeInstanceOf(UnauthenticatedError);
  });
  it('does not query an account for an invalid token', async () => {
    vi.mocked(jwtVerify).mockRejectedValue(new Error('Invalid token'));
    await expect(requireUser()).rejects.toBeInstanceOf(UnauthenticatedError);
    expect(db.query.users.findFirst).not.toHaveBeenCalled();
  });
});
