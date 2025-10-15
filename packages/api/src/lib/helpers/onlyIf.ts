/**
 * Conditionally transform a value or return null
 * Useful for conditional transformations in database operations
 *
 * @example
 * onlyIf(input.preferences, (prefs) => JSON.stringify(prefs))
 * // Returns JSON.stringify(input.preferences) if truthy, null otherwise
 */
export function onlyIf<T, R>(
  value: T | null | undefined,
  transform: (value: NonNullable<T>) => R
): R | undefined {
  return value ? transform(value as NonNullable<T>) : undefined;
}
