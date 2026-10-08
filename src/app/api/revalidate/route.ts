import { NextResponse } from 'next/server';
import { revalidateCatalog } from '@/server/revalidate';

export async function GET() {
  revalidateCatalog();
  return NextResponse.json({ revalidated: true, now: Date.now() });
}

