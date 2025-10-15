import { createAuditLog } from '@/compliance/createAuditLog';
import { db } from '@/db/db';
import { TRPCError } from '@trpc/server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { documents } from './dbSchema';

export const deleteDocumentSchema = z.object({
  documentId: z.uuid()
});

/**
 * Delete a user document
 * Removes the document record from the database
 * Note: Does NOT delete the S3 object (for data retention/audit purposes)
 * S3 lifecycle policies should handle cleanup of orphaned files
 *
 * @param userId - User ID from authentication context
 * @param rawInput - Document ID to delete
 * @returns Success status
 */
export async function deleteDocument(userId: string, rawInput: z.input<typeof deleteDocumentSchema>) {
  const input = deleteDocumentSchema.parse(rawInput);

  // Get the document to verify ownership
  const document = await db.query.documents.findFirst({
    where: and(eq(documents.id, input.documentId), eq(documents.userId, userId))
  });

  if (!document) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Documento não encontrado ou você não tem permissão para excluí-lo.'
    });
  }

  // Delete the document record
  await db.delete(documents).where(eq(documents.id, document.id));

  // Audit log
  await createAuditLog({
    userId,
    eventType: 'document.deleted',
    eventData: {
      documentId: document.id,
      documentType: document.documentType,
      fileId: document.fileId,
      fileName: document.fileName
    }
  });

  return { success: true };
}
