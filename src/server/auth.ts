import { SignJWT, jwtVerify } from 'jose';
import { cookies, headers } from 'next/headers';
import { getEnv } from '@/lib/env';
import { redirect } from 'next/navigation';
import { cache } from 'react';

const env = getEnv();
const secretKey = new TextEncoder().encode(env.AUTH_SECRET);

export interface SessionPayload {
  sub: string;
  role: string;
  name: string;
}

export class UnauthenticatedError extends Error {
  constructor(message = 'Unauthenticated') {
    super(message);
    this.name = 'UnauthenticatedError';
  }
}

export class ForbiddenError extends Error {
  constructor(message = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export async function signToken(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey);
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload as unknown as SessionPayload;
  } catch (error) {
    return null;
  }
}

export const getSession = cache(async (): Promise<SessionPayload | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get('drmc_session')?.value;
  if (!token) return null;
  return verifyToken(token);
});

export async function requireUser() {
  const session = await getSession();
  if (!session) {
    throw new UnauthenticatedError();
  }
  return session;
}

export async function requireRole(...roles: string[]) {
  const session = await requireUser();
  if (!roles.includes(session.role)) {
    throw new ForbiddenError();
  }
  return session;
}

export async function assertSameOrigin() {
  const headersList = await headers();
  const origin = headersList.get('origin') || headersList.get('referer');
  if (!origin) {
    throw new ForbiddenError('Missing origin');
  }

  try {
    const originUrl = new URL(origin);
    const siteUrl = new URL(env.NEXT_PUBLIC_SITE_URL);

    // Host must equal the request host (from headers) or the site URL host
    const host = headersList.get('host');
    
    if (originUrl.host !== siteUrl.host && originUrl.host !== host) {
      throw new ForbiddenError('Origin mismatch');
    }
  } catch (e) {
    throw new ForbiddenError('Invalid origin');
  }
}

export function sanitizeNextUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  // Must start with single slash, not //, not /\, no scheme
  if (url.startsWith('/') && !url.startsWith('//') && !url.startsWith('/\\') && !url.includes('://')) {
    return url;
  }
  return null;
}

