import { user } from '@/auth/dbSchema';
import { db } from '@/db/db';
import { and, count, desc, eq, getTableColumns, ilike, or } from 'drizzle-orm';
import { z } from 'zod';

/**
 * List users with filtering, searching, and pagination
 * Admin-only endpoint for user management
 */
export const listUsersSchema = z.object({
  search: z.string().optional(),
  role: z.enum(['patient', 'doctor', 'admin']).optional(),
  emailVerified: z.boolean().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0)
});

export type ListUsersInput = z.input<typeof listUsersSchema>;

export async function listUsers(input: ListUsersInput) {
  const params = listUsersSchema.parse(input);

  // Build where conditions
  const conditions = [];

  // Role filter
  if (params.role) {
    conditions.push(eq(user.role, params.role));
  }

  // Email verified filter
  if (params.emailVerified !== undefined) {
    conditions.push(eq(user.emailVerified, params.emailVerified));
  }

  // Search filter (name, email, or CPF)
  if (params.search) {
    const searchPattern = `%${params.search}%`;
    conditions.push(
      or(
        ilike(user.name, searchPattern),
        ilike(user.email, searchPattern)
      )
    );
  }

  // Combine conditions
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Get total count
  const [{ total }] = await db
    .select({ total: count() })
    .from(user)
    .where(whereClause);

  // Get users with profile information
  const users = await db
    .select(getTableColumns(user))
    .from(user)
    .where(whereClause)
    .orderBy(desc(user.createdAt))
    .limit(params.limit)
    .offset(params.offset);

  return {
    users,
    total,
    limit: params.limit,
    offset: params.offset
  };
}
