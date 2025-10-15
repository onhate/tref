import { createAuditLog } from '@/compliance/createAuditLog';
import { db } from '@/db/db';
import { generateUploadUrl } from '@/storage/generateUploadUrl';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { documents } from './dbSchema';

export const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'] as const;
export const MAX_DOCUMENT_SIZE_MB = 10;
export const MAX_DOCUMENT_SIZE_BYTES = MAX_DOCUMENT_SIZE_MB * 1024 * 1024;

export const createDocumentUploadUrlSchema = z.object({
  documentType: z.string().min(1),
  contentType: z.enum(ALLOWED_DOCUMENT_TYPES, {
    message: 'Apenas arquivos PDF e imagens (JPEG, PNG, WebP) são permitidos'
  }),
  fileName: z.string().min(1),
  fileSize: z.number().positive(),
  folder: z.string().min(1), // Folder path for S3 storage (determined by calling module)
  maxSizeBytes: z.number().optional().default(MAX_DOCUMENT_SIZE_BYTES), // Optional max size override
  metadata: z.record(z.string(), z.any()).optional()
});

/**
 * [INTERNAL] Create a document record and get S3 presigned POST for uploading
 *
 * This is an internal shared function called by module-specific upload functions.
 * DO NOT expose this directly on tRPC routers. Use module-specific functions instead:
 * - users/createDoctorDocumentUploadUrl.ts (for doctor_* documents)
 * - users/createPatientDocumentUploadUrl.ts (for patient_* documents)
 *
 * Creates a document record with uploadStatus 'uploading' and verificationStatus 'pending'
 * Returns URL, form fields, and document ID for tracking
 * Valid for 5 minutes with KMS encryption enabled
 * Maximum file size: 10MB
 * Supports: PDF, JPEG, PNG, WebP
 *
 * @param userId - User ID from authentication context
 * @param rawInput - Document type (must follow prefix rules), content type, and metadata
 * @returns Presigned POST data (url, fields), document ID, and file ID
 */
export async function createDocumentUploadUrl(userId: string, rawInput: z.input<typeof createDocumentUploadUrlSchema>) {
  const input = createDocumentUploadUrlSchema.parse(rawInput);
  const { documentType, contentType, fileName, fileSize, folder, maxSizeBytes, metadata } = input;

  try {
    // Generate presigned URL using folder path provided by calling module
    const { uploadUrl, fields, fileId } = await generateUploadUrl({
      contentType,
      folder,
      maxSizeBytes
    });

    // Create document record with uploadStatus 'uploading'
    const [document] = await db
      .insert(documents)
      .values({
        userId,
        fileId,
        documentType,
        fileName,
        fileSize,
        contentType,
        metadata,
        uploadStatus: 'uploading'
      })
      .returning();

    // Audit log
    await createAuditLog({
      userId,
      eventType: 'document.upload_initiated',
      eventData: {
        documentId: document.id,
        documentType,
        fileId
      }
    });

    return { uploadUrl, fields, fileId, documentId: document.id };
  } catch (error) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Falha ao gerar URL de upload do documento',
      cause: error
    });
  }
}
