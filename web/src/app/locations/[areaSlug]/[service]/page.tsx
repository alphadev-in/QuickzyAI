import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft, MapPin, CheckCircle, Clock, ShieldCheck,
  Truck, ArrowRight, Package, Pill, UtensilsCrossed,
} from 'lucide-react';
import { Footer } from '@/components/Footer';
import { pageMetadata, SITE_URL } from '@/lib/seo';
import {
  getAllServicePages,
  getServicePageData,
  getAreaBySlug,
  SERVICES,
  type ServiceType,
} from '@/lib/londonServicePages';

export async function generateStaticParams() {
  return getAllServicePages().map(({ areaSlug, serviceSlug }) => ({
    areaSlug,
    service: serviceSlug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ areaSlug: string; service: string }>;
}) {
  const { areaSlug, service } = await params;
  const data = getServicePageData(areaSlug, service);
  if (!data) return { title: 'Not found', robots: { index: false, follow: true } };
  return pageMetadata({
    // Strip " | Quickzy London" suffix — layout template appends "| Quickzy"
    title: data.seoTitle.replace(/\s*\|\s*Quickzy.*$/, ''),
    description: data.metaDescription,
    path: `/locations/${areaSlug}/${service}`,
  });
}

const SERVICE_ICONS: Record<ServiceType, React.ReactNode> = {
  delivery: <Truck className="w-5 h-5 text-emerald-400" />,
  parcel:   <Package className="w-5 h-5 text-emerald-400" />,
  pharmacy: <Pill className="w-5 h-5 text-emerald-400" />,
  food:     <UtensilsCrossed className="w-5 h-5 text-emerald-400" />,
};

export default async function ServiceAreaPage({
  params,
}: {
  params: Promise<{ areaSlug: string; service: string }>;
}) {
  const { areaSlug, service } = await params;
  const data = getServicePageData(areaSlug, service);
  if (!data) notFound();

  const area = getAreaBySlug(areaSlug)!;
  const svc = SERVICES[data.serviceSlug];
  const otherServices = (Object.keys(SERVICES) as ServiceType[]).filter((s) => s !== data.serviceSlug);

  const pageUrl = `${SITE_URL}/locations/${areaSlug}/${service}`;

  // JSON-LD: BreadcrumbList + Service schema
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home',       item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Locations',  item: `${SITE_URL}/locations` },
          { '@type': 'ListItem', position: 3, name: area.name,    item: `${SITE_URL}/locations/${areaSlug}` },
          { '@type': 'ListItem', position: 4, name: svc.label,    item: pageUrl },
        ],
      },
      {
        '@type': 'Service',
        name: `${svc.label} in ${area.name}`,
        url: pageUrl,
        description: data.metaDescription,
        provider: {
          '@type': 'LocalBusiness',
          '@id': `${SITE_URL}/#organization`,
          name: 'Quickzy',
          url: SITE_URL,
        },
        areaServed: {
          '@type': 'Place',
          name: `${area.name}, ${area.borough}, London`,
          geo: { '@type': 'GeoCoordinates', latitude: area.lat, longitude: area.lng },
        },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-neutral-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Header */}
      <header className="border-b border-neutral-900 bg-neutral-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href={`/locations/${areaSlug}`}
            className="flex items-center gap-2 text-xs font-bold text-neutral-300 hover:text-emerald-400 transition"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Back to {area.name}</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm" aria-hidden="true">Q</div>
            <span className="font-bold text-sm text-white">Quickzy London</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full space-y-10">
        {/* Breadcrumb — uses real area.name, not a slug-mangled string */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-neutral-400 flex-wrap">
          <Link href="/" className="hover:text-emerald-400">Home</Link>
          <span aria-hidden="true">/</span>
          <Link href="/locations" className="hover:text-emerald-400">Locations</Link>
          <span aria-hidden="true">/</span>
          <Link href={`/locations/${areaSlug}`} className="hover:text-emerald-400">{area.name}</Link>
          <span aria-hidden="true">/</span>
          <span className="text-emerald-400 font-semibold capitalize" aria-current="page">{svc.shortLabel}</span>
        </nav>

        {/* Hero */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
            <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{area.name} · {area.borough}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            {data.h1}
          </h1>
          <p className="text-sm sm:text-base text-neutral-400 leading-relaxed max-w-3xl">{data.intro}</p>
        </div>

        {/* Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl border border-neutral-800 bg-neutral-900/60 space-y-2">
            <Clock className="w-5 h-5 text-emerald-400" aria-hidden="true" />
            <h2 className="text-sm font-bold text-white">14:00 GMT Same-Day Cutoff</h2>
            <p className="text-xs text-neutral-400">
              Order before 14:00 GMT and your {svc.shortLabel.toLowerCase()} will be dispatched the same day.
            </p>
          </div>
          <div className="p-5 rounded-2xl border border-neutral-800 bg-neutral-900/60 space-y-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" aria-hidden="true" />
            <h2 className="text-sm font-bold text-white">Live GPS Tracking</h2>
            <p className="text-xs text-neutral-400">
              Track your {svc.shortLabel.toLowerCase()} driver in real time from pickup to drop-off.
            </p>
          </div>
          <div className="p-5 rounded-2xl border border-neutral-800 bg-neutral-900/60 space-y-2">
            <span aria-hidden="true">{SERVICE_ICONS[data.serviceSlug]}</span>
            <h2 className="text-sm font-bold text-white">{svc.label}</h2>
            <p className="text-xs text-neutral-400">
              Specialist couriers trained for {svc.shortLabel.toLowerCase()} logistics in London.
            </p>
          </div>
        </div>

        {/* Key points */}
        <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/60 space-y-4">
          <h2 className="text-lg font-bold text-white">What&apos;s included</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.keyPoints.map((pt, i) => (
              <li key={i} className="flex items-start gap-3 text-xs text-neutral-200">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{pt}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Cross-link to other services — uses real svc.label for link text */}
        <section aria-labelledby="other-services-heading">
          <h2 id="other-services-heading" className="text-base font-bold text-white mb-3">
            Other services in {area.name}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {otherServices.map((s) => (
              <Link
                key={s}
                href={`/locations/${areaSlug}/${s}`}
                className="p-4 rounded-xl border border-neutral-800 hover:border-emerald-500/40 bg-neutral-900/40 flex items-center gap-3 group transition"
                aria-label={`${SERVICES[s].label} in ${area.name}`}
              >
                <span aria-hidden="true">{SERVICE_ICONS[s]}</span>
                <span className="text-xs font-bold text-neutral-300 group-hover:text-emerald-300">
                  {SERVICES[s].label}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="p-8 rounded-3xl bg-gradient-to-r from-emerald-950/50 via-neutral-900 to-cyan-950/50 border border-neutral-800 text-center space-y-4">
          <h2 className="text-2xl font-black text-white">Book {svc.label} in {area.name}</h2>
          <p className="text-xs text-neutral-400 max-w-lg mx-auto">
            Instant rate calculation, same-day dispatch, and full tracking across {area.postcode}.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-neutral-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <span>Book Instantly</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
            <Link
              href="/signup"
              className="px-5 py-3 rounded-xl border border-neutral-700 hover:border-neutral-500 text-white font-bold text-xs"
            >
              Business Account
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
