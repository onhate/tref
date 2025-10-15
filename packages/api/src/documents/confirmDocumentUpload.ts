import { createAuditLog } from '@/compliance/createAuditLog';
import { db } from '@/db/db';
import { verifyObjectExists } from '@/storage/verifyObjectExists';
import { TRPCError } from '@trpc/server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { MAX_DOCUMENT_SIZE_BYTES } from './createDocumentUploadUrl';
import { documents } from './dbSchema';

export const confirmDocumentUploadSchema = z.object({
  documentId: z.uuid()
});

/**
 * Confirm document upload by updating status from 'uploading' to 'uploaded'
 * Call this after successfully uploading to S3 presigned URL
 * Verifies the file exists in S3 before confirming
 * Sets verificationStatus to 'verified' for documents that don't require manual verification
 * Note: File URLs are generated dynamically when documents are fetched
 *
 * @param userId - User ID from authentication context
 * @param rawInput - Document ID from createDocumentUploadUrl
 * @returns Success status and updated document record
 */
export async function confirmDocumentUpload(userId: string, rawInput: z.input<typeof confirmDocumentUploadSchema>) {
  const input = confirmDocumentUploadSchema.parse(rawInput);

  // Get the document record
  const document = await db.query.documents.findFirst({
    where: and(eq(documents.id, input.documentId), eq(documents.userId, userId))
  });

  if (!document) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Documento não encontrado ou você não tem permissão para acessá-lo.'
    });
  }

  // Check if document is in 'uploading' status
  if (document.uploadStatus !== 'uploading') {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `O status de upload do documento é '${document.uploadStatus}'. Só é possível confirmar documentos com status de upload 'uploading'.`
    });
  }

  // Verify the object exists in S3 and check size
  await verifyObjectExists({
    key: document.fileId,
    maxSizeBytes: MAX_DOCUMENT_SIZE_BYTES,
    notFoundMessage: 'Documento não encontrado no armazenamento. O upload pode ter falhado.'
  });

  // Update uploadStatus to 'uploaded' and set verificationStatus
  const [updatedDocument] = await db
    .update(documents)
    .set({
      uploadStatus: 'uploaded'
    })
    .where(eq(documents.id, document.id))
    .returning();

  // Audit logging for LGPD compliance
  await createAuditLog({
    userId,
    eventType: 'document.upload_completed',
    eventData: {
      documentId: document.id,
      documentType: document.documentType,
      fileId: document.fileId
    }
  });

  return { success: true, document: updatedDocument };
}
