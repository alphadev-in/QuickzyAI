import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';
import { LONDON_ZONES } from '@/lib/londonZones';
import { LONDON_AREAS, getAllServicePages } from '@/lib/londonServicePages';

// Served at /sitemap.xml. Admin pages are deliberately excluded.
// Entries: static routes, zone hubs (/locations/<zone>), area hubs (/locations/<area>)
// and service pages (/locations/<area>/<service>). Counts come from the data files, not hard-coded here.
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  // ── Static routes ─────────────────────────────────────────────────────────
  const staticRoutes: { path: string; priority: number; changeFrequency: 'daily' | 'weekly' | 'monthly' }[] = [
    { path: '',             priority: 1.0, changeFrequency: 'daily'   },
    { path: '/locations',   priority: 0.9, changeFrequency: 'weekly'  },
    { path: '/faq',         priority: 0.7, changeFrequency: 'monthly' },
    { path: '/signup',      priority: 0.6, changeFrequency: 'monthly' },
    { path: '/onboarding',  priority: 0.6, changeFrequency: 'monthly' },
    { path: '/privacy',     priority: 0.3, changeFrequency: 'monthly' },
    { path: '/terms',       priority: 0.3, changeFrequency: 'monthly' },
  ];

  // ── Broad zone pages (Central / North / East / West London) ───────────────
  const zoneRoutes = Object.keys(LONDON_ZONES).map((slug) => ({
    path: `/locations/${slug}`,
    priority: 0.8,
    changeFrequency: 'weekly' as const,
  }));

  // ── Neighbourhood area hub pages (/locations/[areaSlug]) ──────────────────
  const areaHubRoutes = LONDON_AREAS.map((area) => ({
    path: `/locations/${area.slug}`,
    priority: 0.8,
    changeFrequency: 'weekly' as const,
  }));

  // ── Service-specific pages (/locations/[areaSlug]/[service]) ─────────────
  // delivery | parcel | pharmacy | food  ×  100 London areas = 400 pages
  const serviceRoutes = getAllServicePages().map(({ areaSlug, serviceSlug }) => ({
    path: `/locations/${areaSlug}/${serviceSlug}`,
    priority: 0.75,
    changeFrequency: 'weekly' as const,
  }));

  return [...staticRoutes, ...zoneRoutes, ...areaHubRoutes, ...serviceRoutes].map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
