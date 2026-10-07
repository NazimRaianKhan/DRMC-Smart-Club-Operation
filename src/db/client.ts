import { Pool } from 'pg';
import { getEnv } from '@/lib/env';

const env = getEnv();

// Module-level pool connection.
// Wait, getEnv requires environment variables to be defined.
// If this file is imported, it will throw if vars are missing.
export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 10000,
});
