'use server';

import { getSession } from '@/server/auth';
import { db } from '@/db/client';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function getCurrentUserEmail() {
  const session = await getSession();
  if (!session) return null;

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.sub),
    columns: { email: true }
  });

  return user?.email || null;
}

