import { NextResponse } from 'next/server';
import { pool } from '@/db/client';

export async function GET() {
  let dbStatus: 'up' | 'down' | 'not_configured' = 'not_configured';

  try {
    // Run 'select 1' with a 2-second timeout.
    // Pool query doesn't have a direct timeout option in node-postgres for a single query easily without client, 
    // but we can use Promise.race for the timeout.
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), 2000)
    );

    const query = pool.query('SELECT 1');

    await Promise.race([query, timeout]);
    dbStatus = 'up';
  } catch {
    dbStatus = 'down';
  }

  const responseBody = {
    status: dbStatus === 'up' ? 'ok' : 'degraded',
    time: new Date().toISOString(),
    db: dbStatus,
  };

  return NextResponse.json(responseBody, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}
