import * as adminSchema from '@/admin/dbSchema';
import * as authSchema from '@/auth/dbSchema';
import * as complianceSchema from '@/compliance/dbSchema';
import * as documentsSchema from '@/documents/dbSchema';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

const client = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 4,
  min: 0
});

export const db = drizzle({
  client,
  schema: {
    ...adminSchema,
    ...authSchema,
    ...documentsSchema,
    ...complianceSchema
  }
});
