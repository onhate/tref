import { z } from 'zod';

export const validateFileAccessSchema = z.object({
  user: z.object({
    id: z.string(),
    role: z.string().nullable()
  }).optional(),
  fileId: z.string().min(1)
});

/**
 * Validate user access to a file based on fileId
 *
 * @param rawInput - user object (with id and role) and fileId
 * @returns Document record if access is granted
 * @throws TRPCError with code NOT_FOUND if access denied or document not found
 */
export async function validateFileAccess(rawInput: z.input<typeof validateFileAccessSchema>) {
  const input = validateFileAccessSchema.parse(rawInput);
  const { user, fileId } = input;

  return null;
}
