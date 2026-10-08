import { pool } from './client';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema';
import { postgresError } from './errors';

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
      if (attempt === 1 && ['40001', '40P01'].includes(postgresError(error).code ?? '')) {
        // Retry once on serialization failure or deadlock
        continue;
      }
      throw error;
    } finally {
      client.release();
    }
  }
}
