import { S3Client } from '@aws-sdk/client-s3';

export const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const maxFileSizeMb = 5;
export const maxFileSizeBytes = maxFileSizeMb * 1024 * 1024;
export const defaultPresignedUrlExpiresIn = 300; // 5 minutes
export const s3Region = 'sa-east-1';

export type AllowedImageType = (typeof allowedImageTypes)[number];

export const s3Client = new S3Client({ region: s3Region });
