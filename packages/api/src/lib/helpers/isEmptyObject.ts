/**
 * Checks if an update object contains only undefined values
 * Useful for preventing Drizzle ORM "No values to update" errors
 *
 * @example
 * isEmptyObject({ name: "John", email: undefined }) // false
 * isEmptyObject({ name: undefined, email: undefined }) // true
 * isEmptyObject({}) // true
 *
 * @example Usage in update functions
 * if (isEmptyObject(updates)) {
 *   throw new TRPCError({
 *     code: 'BAD_REQUEST',
 *     message: 'No fields to update'
 *   });
 * }
 * await db.update(users).set(updates).where(eq(users.id, userId));
 */
export function isEmptyObject<T extends Record<string, unknown>>(obj: T): boolean {
  const hasUpdates = Object.values(obj).some(value => value !== undefined);
  return !hasUpdates;
}
