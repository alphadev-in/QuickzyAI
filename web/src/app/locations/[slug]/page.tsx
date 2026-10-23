import React from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin, CheckCircle, Clock, ShieldCheck, ArrowRight, Truck, Box } from 'lucide-react';
import { Footer } from '@/components/Footer';
import { notFound } from 'next/navigation';

import { LONDON_ZONES } from '@/lib/londonZones';
import { pageMetadata } from '@/lib/seo';

export async function generateStaticParams() {
  return Object.keys(LONDON_ZONES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const location = LONDON_ZONES[slug];
  if (!location) {
    return { title: 'Location not found', robots: { index: false, follow: true } };
  }
  return pageMetadata({
    title: location.seoTitle.replace(/\s*\|\s*Quickzy$/, ''),
    description: location.metaDescription,
    path: `/locations/${slug}`,
  });
}

export default async function LondonLocationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const location = LONDON_ZONES[slug];

  if (!location) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-neutral-950">
      <header className="border-b border-neutral-900 bg-neutral-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href="/locations"
            className="flex items-center gap-2 text-xs font-bold text-neutral-300 hover:text-emerald-400 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All London Boroughs</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
              Q
            </div>
            <span className="font-bold text-sm text-white">Quickzy London</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full space-y-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-neutral-400">
          <Link href="/" className="hover:text-emerald-400">Home</Link>
          <span>/</span>
          <Link href="/locations" className="hover:text-emerald-400">Locations</Link>
          <span>/</span>
          <span className="text-emerald-400 font-semibold">{location.title}</span>
        </nav>

        {/* Hero Banner */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
            <MapPin className="w-3.5 h-3.5" />
            <span>{location.zone} Logistics Network</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            {location.title}
          </h1>
          <p className="text-sm sm:text-base text-neutral-400 leading-relaxed max-w-3xl">
            {location.summary}
          </p>
        </div>

        {/* Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl glass-panel space-y-2 border border-neutral-800">
            <Clock className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold text-white">14:00 GMT Same-Day Cutoff</h2>
            <p className="text-xs text-neutral-400">
              Orders placed before 14:00 GMT are dispatched and delivered within {location.zone} on the same day.
            </p>
          </div>
          <div className="p-5 rounded-2xl glass-panel space-y-2 border border-neutral-800">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold text-white">Full Geocoding & Route Audit</h2>
            <p className="text-xs text-neutral-400">
              Direct verification of postcodes with instant distance calculations and dynamic pricing.
            </p>
          </div>
          <div className="p-5 rounded-2xl glass-panel space-y-2 border border-neutral-800">
            <Truck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold text-white">Eco & Rapid Fleets</h2>
            <p className="text-xs text-neutral-400">
              Zero-emission e-bikes and low-emission vehicles equipped for food, pharmacy, and packages.
            </p>
          </div>
        </div>

        {/* Postcodes & Neighborhoods */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/60 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>Served Postcode Districts</span>
            </h2>
            <div className="flex flex-wrap gap-2">
              {location.postcodes.map((pc) => (
                <span
                  key={pc}
                  className="px-3 py-1 rounded-lg bg-neutral-800 border border-neutral-700 text-emerald-400 font-mono text-xs font-bold"
                >
                  {pc}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-neutral-400">
              Automated validation guarantees coverage for every postal sector in this district.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/60 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Key Neighborhoods Covered</span>
            </h2>
            <ul className="grid grid-cols-2 gap-2 text-xs text-neutral-300">
              {location.neighborhoods.map((nh) => (
                <li key={nh} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  <span>{nh}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Key Logistics Services */}
        <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/60 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Box className="w-5 h-5 text-emerald-400" />
            <span>Logistics Solutions for {location.zone}</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {location.keyServices.map((srv, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-neutral-800/60 border border-neutral-700/60 flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-neutral-200">{srv}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Direct Action Banner */}
        <div className="p-8 rounded-3xl bg-gradient-to-r from-emerald-950/50 via-neutral-900 to-cyan-950/50 border border-neutral-800 text-center space-y-4">
          <h2 className="text-2xl font-black text-white">Book Your {location.zone} Courier Now</h2>
          <p className="text-xs text-neutral-400 max-w-lg mx-auto">
            Experience rapid point-to-point same-day London delivery with instant rate calculation and full package validation.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-neutral-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <span>Instant London Booking</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/signup"
              className="px-5 py-3 rounded-xl border border-neutral-700 hover:border-neutral-500 text-white font-bold text-xs"
            >
              Business Client Account
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
