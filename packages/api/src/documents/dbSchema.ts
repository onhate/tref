import { user } from '@/auth/dbSchema';
import { relations } from 'drizzle-orm';
import { index, jsonb, numeric, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

// Upload status enum - tracks file upload lifecycle
export const uploadStatusEnum = pgEnum('upload_status', [
  'uploading', // Upload in progress (presigned URL generated)
  'uploaded', // Upload completed successfully
  'failed' // Upload failed
]);

// Main documents table
export const documents = pgTable(
  'documents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),

    // Document identification
    documentType: text('document_type').notNull(),
    fileName: text('file_name').notNull(),
    fileSize: numeric('file_size', { mode: 'number' }).notNull(), // bytes
    contentType: text('content_type').notNull(), // MIME type

    // Storage (fileId is the S3 key - URLs generated on-demand via getObjectSignedUrl)
    fileId: text('file_id').notNull().unique(), // S3 key for retrieval

    // Upload tracking
    uploadStatus: uploadStatusEnum('upload_status').notNull().default('uploading'),

    // Flexible metadata (JSON)
    // Examples:
    // - { expirationDate: "2025-12-31" } for insurance
    // - { issuingAuthority: "DETRAN-SP" } for CNH
    // - { documentNumber: "123456789" } for RG
    metadata: jsonb('metadata'),

    // Audit
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull()
  },
  (table) => [
    // Indexes for common queries
    index('user_documents_user_idx').on(table.userId),
    index('user_documents_type_idx').on(table.documentType),
    index('user_documents_upload_status_idx').on(table.uploadStatus),
    index('user_documents_file_id_idx').on(table.fileId)
  ]
);

// Relations
export const documentsRelations = relations(documents, ({ one }) => ({
  user: one(user, {
    fields: [documents.userId],
    references: [user.id]
  })
}));

// TypeScript type for document
export type Document = typeof documents.$inferSelect;
