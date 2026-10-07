import { seedDatabase } from '@/server/seed';
import { pool } from '@/db/client';

async function main() {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_SEED !== 'true') {
    console.error('Seed refused to run in production. Set ALLOW_SEED=true to override.');
    process.exit(1);
  }
  
  console.log('Seeding database...');
  const start = Date.now();
  await seedDatabase({});
  const ms = Date.now() - start;
  console.log(`Seed completed in ${ms}ms`);
  await pool.end();
  process.exit(0);
}

main().catch(err => {
  console.error('Seed script failed:', err);
  process.exit(1);
});

