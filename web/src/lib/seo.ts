import type { Metadata } from 'next';

// Public site URL used for canonical links, sitemap and Open Graph.
// Set NEXT_PUBLIC_SITE_URL in Firebase App Hosting (or web/.env.local) to your live domain.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://quickzy.co.uk').replace(/\/$/, '');
export const SITE_NAME = 'Quickzy';
export const DEFAULT_DESCRIPTION =
  'Same-day London courier for pharmacy, food and parcels. Instant booking, bulk CSV imports and per-mile pricing across Greater London.';

interface PageMetaInput {
  /** Page title without the "| Quickzy" suffix (the root layout adds it) */
  title: string;
  description: string;
  /** Path starting with "/" */
  path: string;
  noIndex?: boolean;
}

export function pageMetadata({ title, description, path, noIndex = false }: PageMetaInput): Metadata {
  const url = `${SITE_URL}${path === '/' ? '' : path}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: noIndex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      url,
      siteName: SITE_NAME,
      locale: 'en_GB',
      type: 'website',
      images: ['/logo.png'],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${SITE_NAME}`,
      description,
      images: ['/logo.png'],
    },
  };
}
