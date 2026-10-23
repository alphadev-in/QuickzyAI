import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';
import { LONDON_ZONES } from '@/lib/londonZones';

// Served at /sitemap.xml. Admin pages are deliberately excluded.
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const staticRoutes: { path: string; priority: number; changeFrequency: 'daily' | 'weekly' | 'monthly' }[] = [
    { path: '', priority: 1.0, changeFrequency: 'daily' },
    { path: '/locations', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/faq', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/signup', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/onboarding', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/privacy', priority: 0.3, changeFrequency: 'monthly' },
    { path: '/terms', priority: 0.3, changeFrequency: 'monthly' },
  ];

  const zoneRoutes = Object.keys(LONDON_ZONES).map((slug) => ({
    path: `/locations/${slug}`,
    priority: 0.8,
    changeFrequency: 'weekly' as const,
  }));

  return [...staticRoutes, ...zoneRoutes].map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
