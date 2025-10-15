import { router, trpcProtected } from '@/trpc';
import { confirmDocumentUpload, confirmDocumentUploadSchema } from './confirmDocumentUpload';
import { deleteDocument, deleteDocumentSchema } from './deleteDocument';
import { getDocument, getDocumentSchema } from './getDocument';
import { listDocuments, listDocumentsSchema } from './listDocuments';

export const documentsRouter = router({
  /**
   * Confirm document upload and update status from 'uploading' to 'uploaded'
   * Call this after successfully uploading to S3 presigned URL
   * Verifies the file exists in S3 before confirming
   */
  confirmDocumentUpload: trpcProtected
    .input(confirmDocumentUploadSchema)
    .mutation(async ({ ctx, input }) => {
      return confirmDocumentUpload(ctx.user.id, input);
    }),

  /**
   * Get a single document by ID
   * Generates presigned URL for the document (valid for 1 hour)
   * Validates that the user owns the document
   */
  getDocument: trpcProtected.input(getDocumentSchema).query(async ({ ctx, input }) => {
    return getDocument(ctx.user.id, input);
  }),

  /**
   * List user documents with optional filtering
   * Generates presigned URLs for each document (valid for 1 hour)
   * Results are ordered by creation date (newest first)
   */
  listDocuments: trpcProtected.input(listDocumentsSchema).query(async ({ ctx, input }) => {
    return listDocuments(ctx.user.id, input);
  }),

  /**
   * Delete a user document
   * Removes the document record from the database
   * Note: Does NOT delete the S3 object (for audit purposes)
   * Cannot delete verified documents
   */
  deleteDocument: trpcProtected.input(deleteDocumentSchema).mutation(async ({ ctx, input }) => {
    return deleteDocument(ctx.user.id, input);
  })
});
