import type { Metadata } from 'next/types';

export function createMetadata(override: Metadata): Metadata {
  return {
    ...override,
    openGraph: {
      title: override.title ?? undefined,
      description: override.description ?? undefined,
      url: baseUrl,
      images: `${baseUrl}/og.png`,
      ...override.openGraph
    },
    twitter: {
      card: 'summary_large_image',
      title: override.title ?? undefined,
      description: override.description ?? undefined,
      images: `${baseUrl}/og.png`,
      ...override.twitter
    },
    metadataBase: baseUrl
  };
}

export const baseUrl =
  process.env.NODE_ENV === 'development'
    ? new URL('http://localhost:3000')
    : new URL(`https://${process.env.NEXT_PUBLIC_APP_URL!}`);
