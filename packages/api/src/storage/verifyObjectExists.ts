import { HeadObjectCommand } from '@aws-sdk/client-s3';
import { TRPCError } from '@trpc/server';
import { Resource } from 'sst';
import { s3Client } from './s3Client';

export interface VerifyObjectOptions {
  /**
   * S3 key path to verify
   */
  key: string;
  /**
   * Optional maximum file size in bytes
   */
  maxSizeBytes?: number;
  /**
   * Custom error message if object not found
   */
  notFoundMessage?: string;
}

/**
 * Verify that an S3 object exists and optionally check its size
 *
 * @param options - Verification options
 * @throws TRPCError with NOT_FOUND if object doesn't exist
 * @throws TRPCError with BAD_REQUEST if file exceeds maxSizeBytes
 */
export async function verifyObjectExists(options: VerifyObjectOptions): Promise<void> {
  const {
    key,
    maxSizeBytes,
    notFoundMessage = 'Arquivo não encontrado no S3. Por favor, envie o arquivo antes de confirmar.'
  } = options;

  try {
    const response = await s3Client.send(
      new HeadObjectCommand({
        Bucket: Resource.Bucket.name,
        Key: key
      })
    );

    // Verify file size if maxSizeBytes provided
    if (maxSizeBytes !== undefined) {
      const contentLength = response.ContentLength || 0;
      if (contentLength > maxSizeBytes) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Tamanho do arquivo excede o limite máximo de ${(maxSizeBytes / 1024 / 1024).toFixed(0)}MB. O arquivo enviado tem ${(contentLength / 1024 / 1024).toFixed(2)}MB`
        });
      }
    }
  } catch (error: any) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: notFoundMessage
      });
    }
    throw error;
  }
}
