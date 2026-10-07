import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, pool } from '../src/db/client';
import { getEnv } from '../src/lib/env';

const env = getEnv();

async function main() {
  if (process.env.NODE_ENV === 'production' && env.ALLOW_SEED !== 'true') {
    console.error('Refusing to reset database in production without ALLOW_SEED=true');
    process.exit(1);
  }

  console.log('Dropping schemas...');
  await pool.query('DROP SCHEMA IF EXISTS public CASCADE');
  await pool.query('DROP SCHEMA IF EXISTS drizzle CASCADE');
  await pool.query('CREATE SCHEMA public');
  await pool.query('GRANT ALL ON SCHEMA public TO postgres');
  await pool.query('GRANT ALL ON SCHEMA public TO public');

  console.log('Running migrations...');
  await migrate(db, { migrationsFolder: './drizzle' });
  
  console.log('Database reset complete!');
  await pool.end();
}

main().catch((err) => {
  console.error('Database reset failed:', err);
  process.exit(1);
});
