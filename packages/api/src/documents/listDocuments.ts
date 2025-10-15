import { db } from '@/db/db';
import { and, desc, eq, ne, or } from 'drizzle-orm';
import { z } from 'zod';
import { documents } from './dbSchema';
import { getFileUrl } from './getFileUrl';

export const listDocumentsSchema = z.object({
  documentType: z.string().optional(),
  uploadStatus: z.enum(['uploading', 'uploaded', 'failed']).optional()
});

/**
 * List user documents with optional filtering
 * Access is granted if:
 * - User owns the documents, OR
 * Generates S3 presigned URLs dynamically (5-minute expiry)
 * Results are ordered by creation date (newest first)
 *
 * @param userId - User ID from authentication context
 * @param rawInput - Optional filters for documentType and status
 * @returns Array of documents with S3 presigned URLs
 */
export async function listDocuments(
  userId: string,
  rawInput: z.input<typeof listDocumentsSchema>
) {
  const input = listDocumentsSchema.parse(rawInput);

  // Build query conditions
  // Allow access if user owns
  const accessConditions = or(
    eq(documents.userId, userId)
  );

  const conditions = [accessConditions];

  if (input.documentType) {
    conditions.push(eq(documents.documentType, input.documentType));
  }

  if (input.uploadStatus) {
    conditions.push(eq(documents.uploadStatus, input.uploadStatus));
  } else {
    conditions.push(ne(documents.uploadStatus, 'uploading'));
  }

  const results = await db
    .select({
      document: documents
    })
    .from(documents)
    .where(and(...conditions))
    .orderBy(desc(documents.createdAt));

  // Generate S3 presigned URLs dynamically (5-minute expiry)
  return Promise.all(
    results.map(async r => ({
      ...r.document,
      fileUrl: await getFileUrl(r.document)
    }))
  );
}
