import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, MapPin, ArrowRight, Truck, Package, Pill, UtensilsCrossed } from 'lucide-react';
import { Footer } from '@/components/Footer';
import { pageMetadata, SITE_URL } from '@/lib/seo';
import { LONDON_AREAS, SERVICES, type ServiceType } from '@/lib/londonServicePages';
import { LONDON_ZONES } from '@/lib/londonZones';
import { LondonZonePage } from '@/components/LondonZonePage';

// One dynamic segment serves both London zones (central-london, ...) and neighbourhood areas.
// Their slugs never overlap, so a zone slug is checked first.
export async function generateStaticParams() {
  return [
    ...Object.keys(LONDON_ZONES).map((slug) => ({ areaSlug: slug })),
    ...LONDON_AREAS.map((area) => ({ areaSlug: area.slug })),
  ];
}

export async function generateMetadata({ params }: { params: Promise<{ areaSlug: string }> }) {
  const { areaSlug } = await params;
  const zone = LONDON_ZONES[areaSlug];
  if (zone) {
    return pageMetadata({
      title: zone.seoTitle.replace(/\s*\|\s*Quickzy$/, ''),
      description: zone.metaDescription,
      path: `/locations/${areaSlug}`,
    });
  }
  const area = LONDON_AREAS.find((a) => a.slug === areaSlug);
  if (!area) return { title: 'Location not found', robots: { index: false, follow: true } };
  return pageMetadata({
    title: `Courier Services ${area.name} ${area.postcode}`,
    description: `Same-day delivery, parcel, pharmacy and food couriers in ${area.name} (${area.postcode}), ${area.borough}. Fast, trackable, per-mile pricing.`,
    path: `/locations/${areaSlug}`,
  });
}

const SERVICE_ICONS: Record<ServiceType, React.ReactNode> = {
  delivery: <Truck className="w-5 h-5 text-emerald-400" />,
  parcel:   <Package className="w-5 h-5 text-emerald-400" />,
  pharmacy: <Pill className="w-5 h-5 text-emerald-400" />,
  food:     <UtensilsCrossed className="w-5 h-5 text-emerald-400" />,
};

export default async function AreaHubPage({ params }: { params: Promise<{ areaSlug: string }> }) {
  const { areaSlug } = await params;
  const zone = LONDON_ZONES[areaSlug];
  if (zone) return <LondonZonePage slug={areaSlug} location={zone} />;
  const area = LONDON_AREAS.find((a) => a.slug === areaSlug);
  if (!area) notFound();

  const pageUrl = `${SITE_URL}/locations/${area.slug}`;

  // JSON-LD: BreadcrumbList + LocalBusiness service area
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home',      item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Locations', item: `${SITE_URL}/locations` },
          { '@type': 'ListItem', position: 3, name: area.name,   item: pageUrl },
        ],
      },
      {
        '@type': 'LocalBusiness',
        '@id': `${SITE_URL}/#organization`,
        name: 'Quickzy',
        url: SITE_URL,
        areaServed: {
          '@type': 'Place',
          name: `${area.name}, ${area.borough}, London`,
          geo: { '@type': 'GeoCoordinates', latitude: area.lat, longitude: area.lng },
        },
        description: `Same-day courier covering ${area.name} (${area.postcode}) and all of ${area.borough}.`,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-neutral-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <header className="border-b border-neutral-900 bg-neutral-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href="/locations"
            className="flex items-center gap-2 text-xs font-bold text-neutral-300 hover:text-emerald-400 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All Locations</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">Q</div>
            <span className="font-bold text-sm text-white">Quickzy London</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full space-y-10">
        {/* Breadcrumb — aria-label for a11y, uses real area.name (no slug mangling) */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-neutral-400 flex-wrap">
          <Link href="/" className="hover:text-emerald-400">Home</Link>
          <span aria-hidden="true">/</span>
          <Link href="/locations" className="hover:text-emerald-400">Locations</Link>
          <span aria-hidden="true">/</span>
          <span className="text-emerald-400 font-semibold" aria-current="page">{area.name}</span>
        </nav>

        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
            <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{area.borough}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            Same-Day Courier in {area.name}, {area.postcode}
          </h1>
          <p className="text-sm sm:text-base text-neutral-400 leading-relaxed max-w-3xl">
            Quickzy dispatches same-day couriers across {area.name} ({area.postcode}) and all of {area.borough}. Choose your service below for full coverage details.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {(Object.keys(SERVICES) as ServiceType[]).map((serviceKey) => {
            const svc = SERVICES[serviceKey];
            return (
              <Link
                key={serviceKey}
                href={`/locations/${area.slug}/${serviceKey}`}
                className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/60 hover:border-emerald-500/50 hover:bg-emerald-950/20 transition group space-y-3"
                aria-label={`${svc.label} in ${area.name}`}
              >
                <div className="flex items-center gap-3">
                  <span aria-hidden="true">{SERVICE_ICONS[serviceKey]}</span>
                  <span className="text-sm font-bold text-white group-hover:text-emerald-300">{svc.label}</span>
                </div>
                <p className="text-xs text-neutral-400">
                  Fast, trackable {svc.shortLabel.toLowerCase()} courier covering {area.name} and surrounding {area.postcode} postcodes.
                </p>
                <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold" aria-hidden="true">
                  <span>View details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            );
          })}
        </div>

        <div className="p-8 rounded-3xl bg-gradient-to-r from-emerald-950/50 via-neutral-900 to-cyan-950/50 border border-neutral-800 text-center space-y-4">
          <h2 className="text-2xl font-black text-white">Book a Courier in {area.name}</h2>
          <p className="text-xs text-neutral-400 max-w-lg mx-auto">
            Instant rate calculation, live tracking, and same-day dispatch across {area.postcode}.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-neutral-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <span>Instant Booking</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
            <Link href="/signup" className="px-5 py-3 rounded-xl border border-neutral-700 hover:border-neutral-500 text-white font-bold text-xs">
              Business Account
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
