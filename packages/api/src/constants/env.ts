export const appUrl = process.env.APP_URL!;
export const apiUrl = process.env.API_URL!;

/**
 * Generate API URL for file access (documents, photos, etc.)
 * @param fileId - The file ID (S3 key)
 * @returns Full API URL for accessing the file
 * @example getFileUrl('private/users/123/photo.jpg') // returns 'https://api.example.com/api/files/private/users/123/photo.jpg'
 */
export function getFileUrl(fileId: string): string {
  return `${apiUrl}/api/files/${fileId}`;
}
