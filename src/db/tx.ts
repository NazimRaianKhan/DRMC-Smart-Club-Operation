import { pool } from './client';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

type Tx = NodePgDatabase<typeof schema>;

export async function withTransaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
  let attempt = 0;
  while (true) {
    attempt++;
    const client = await pool.connect();
    const tx = drizzle(client, { schema });
    try {
      await client.query('BEGIN');
      const result = await fn(tx);
      await client.query('COMMIT');
      return result;
    } catch (error: unknown) {
      await client.query('ROLLBACK');
      if (attempt === 1 && error && typeof error === 'object' && 'code' in error && (error as any).code === '40001' || (error as any)?.code === '40P01') {
        // Retry once on serialization failure or deadlock
        client.release();
        continue;
      }
      throw error;
    } finally {
      client.release();
    }
  }
}
