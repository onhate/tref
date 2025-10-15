import { db } from '@/db/db';
import { sql } from 'drizzle-orm';
import { beforeEach, vi } from 'vitest';

vi.mock('sst', () => ({
  Resource: {
    App: {
      name: 'test-app',
      stage: 'test'
    },
    Bucket: {
      name: 'test-bucket'
    },
    Email: {
      sender: 'email.nope'
    },
    Database: {
      host: 'localhost',
      port: 5435,
      username: 'postgres',
      password: 'password',
      database: 'test'
    }
  }
}));

// Truncate all tables after each test
async function clearDatabase() {
  try {
    const tables = await db.execute<{ tablename: string }>(sql`
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
    `);

    for (const { tablename } of tables.rows) {
      if (tablename === '__drizzle_migrations') continue;
      await db.execute(sql.raw(`TRUNCATE TABLE "${tablename}" CASCADE`));
    }
  } catch (error) {
    // Skip database cleanup for tests that don't use the database
    // (e.g., tests that only mock external services)
  }
}

beforeEach(async () => {
  vi.clearAllMocks();
  vi.clearAllTimers();

  await clearDatabase();
});
