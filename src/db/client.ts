import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { getEnv } from '@/lib/env';
import * as schema from './schema';

const env = getEnv();

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 10000,
});

export const db = drizzle(pool, { schema });
