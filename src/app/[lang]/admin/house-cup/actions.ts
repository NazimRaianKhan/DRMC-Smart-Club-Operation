'use server';

import { requireRole } from '@/server/auth';
import { db } from '@/db/client';
import { housePoints } from '@/db/schema';
import { revalidatePath } from 'next/cache';

export async function awardPointsAction(formData: FormData) {
  await requireRole(['admin']);
  
  const houseId = formData.get('houseId') as string;
  const points = parseInt(formData.get('points') as string, 10);
  const reason = formData.get('reason') as string;
  
  if (!houseId || isNaN(points) || !reason) {
    throw new Error('Invalid input');
  }

  await db.insert(housePoints).values({
    houseId,
    points,
    reason
  });

  revalidatePath('/[lang]/admin/house-cup', 'page');
  revalidatePath('/[lang]/house-cup', 'page');
}

