import { db } from '@/db/db';
import { TRPCError } from '@trpc/server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { documents } from './dbSchema';
import { getFileUrl } from './getFileUrl';

export const getDocumentSchema = z.object({
  documentId: z.uuid()
});

/**
 * Get a single document by ID with S3 presigned URL
 * Access is granted if:
 * - User owns the document, OR
 * Generates S3 presigned URL dynamically (5-minute expiry)
 *
 * @param userId - User ID from authentication context
 * @param rawInput - Document ID to fetch
 * @returns Document with S3 presigned URL
 * @throws TRPCError if document not found or user doesn't have access
 */
export async function getDocument(
  userId: string,
  rawInput: z.input<typeof getDocumentSchema>
) {
  const input = getDocumentSchema.parse(rawInput);

  const document = await db.query.documents.findFirst({
    where: and(eq(documents.id, input.documentId), eq(documents.userId, userId))
  });

  if (!document) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Documento não encontrado ou você não tem acesso a ele'
    });
  }

  // Generate S3 presigned URL dynamically (5-minute expiry)
  const fileUrl = await getFileUrl(document);
  return {
    ...document,
    fileUrl
  };
}
