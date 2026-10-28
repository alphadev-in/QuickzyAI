import React from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin, CheckCircle, Navigation, Clock, ShieldCheck, ArrowRight } from 'lucide-react';
import { Footer } from '@/components/Footer';

import { pageMetadata } from '@/lib/seo';
import { LONDON_AREAS } from '@/lib/londonServicePages';

export const metadata = pageMetadata({
  title: 'London Courier Coverage — All Areas & Boroughs',
  description: 'Same-day courier delivery across every London borough. Browse pharmacy, food, parcel and delivery services by area or postcode.',
  path: '/locations',
});

// Zone hubs — link to [slug] zone pages
const ZONE_HUBS = [
  { name: 'Central London', slug: 'central-london', codes: 'EC1–4, WC1–2, W1, SW1', zone: 'Central' },
  { name: 'North London',   slug: 'north-london',   codes: 'N1–N22, NW1–NW11',      zone: 'North'   },
  { name: 'East London',    slug: 'east-london',    codes: 'E1–E18, IG, RM',         zone: 'East'    },
  { name: 'West London',    slug: 'west-london',    codes: 'W2–W14, SW3–SW10',       zone: 'West'    },
];

export default function LocationsDirectoryPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-neutral-950">
      <header className="border-b border-neutral-900 bg-neutral-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-bold text-neutral-300 hover:text-emerald-400 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Quickzy</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
              Q
            </div>
            <span className="font-bold text-sm text-white">Quickzy London Coverage</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full space-y-12">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-neutral-400">
          <Link href="/" className="hover:text-emerald-400">Home</Link>
          <span>/</span>
          <span className="text-emerald-400 font-semibold">Locations</span>
        </nav>

        <div className="max-w-3xl space-y-4">
          <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            London Logistics Directory
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            Same-Day Delivery Coverage in London
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
            Quickzy operates rapid dispatch fleets across all 32 London boroughs and the City of London for pharmacy, food, and parcel delivery. Every postcode is geocoded and validated in real time.
          </p>
        </div>

        {/* Coverage Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl glass-panel space-y-2">
            <Clock className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold text-white">14:00 GMT Same-Day Cutoff</h2>
            <p className="text-xs text-neutral-400">
              Orders confirmed before 14:00 GMT are delivered the same afternoon or evening.
            </p>
          </div>

          <div className="p-5 rounded-2xl glass-panel space-y-2">
            <Navigation className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-bold text-white">London Postcode Validation</h2>
            <p className="text-xs text-neutral-400">
              Automated validation on all pickup and drop-off postal codes across E, EC, N, NW, SE, SW, W, WC and outer sectors.
            </p>
          </div>

          <div className="p-5 rounded-2xl glass-panel space-y-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold text-white">Regulated &amp; Cold-Chain</h2>
            <p className="text-xs text-neutral-400">
              Special handling bags for pharmacy therapeutics and cold-chain temperature control.
            </p>
          </div>
        </div>

        {/* Zone hubs */}
        <section aria-labelledby="zone-hubs-heading">
          <h2 id="zone-hubs-heading" className="text-xl font-black text-white mb-4">Browse by London Zone</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ZONE_HUBS.map((z) => (
              <Link
                key={z.slug}
                href={`/locations/${z.slug}`}
                className="p-5 rounded-2xl border border-neutral-800 bg-neutral-900/60 hover:border-emerald-500/50 hover:bg-emerald-950/20 transition group space-y-2"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-bold text-white group-hover:text-emerald-300">{z.name}</span>
                </div>
                <p className="text-xs text-neutral-400 font-mono">{z.codes}</p>
                <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold">
                  <span>View zone</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* All neighbourhood areas A–Z */}
        <section aria-labelledby="areas-heading">
          <h2 id="areas-heading" className="text-xl font-black text-white mb-4">All London Delivery Areas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {LONDON_AREAS.map((area) => (
              <Link
                key={area.slug}
                href={`/locations/${area.slug}`}
                className="p-4 rounded-2xl border border-neutral-800 bg-neutral-900/60 hover:border-emerald-500/50 hover:bg-emerald-950/20 transition group flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-bold text-white group-hover:text-emerald-300">{area.name}</p>
                  <p className="text-xs text-neutral-400 font-mono">{area.postcode} · {area.borough}</p>
                </div>
                <div className="flex flex-col gap-1 text-right">
                  {(['delivery','parcel','pharmacy','food'] as const).map((s) => (
                    <span key={s} className="text-[10px] text-neutral-500 group-hover:text-emerald-500 capitalize">{s}</span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Call to action */}
        <div className="p-8 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-neutral-900 to-cyan-950/40 border border-neutral-800 text-center space-y-4">
          <h2 className="text-2xl font-black text-white">Ready to Dispatch in London?</h2>
          <p className="text-xs text-neutral-400 max-w-lg mx-auto">
            Book an instant courier or upload a bulk manifest with single-transaction confirmation.
          </p>
          <div className="flex justify-center gap-3">
            <Link
              href="/"
              className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs flex items-center gap-2"
            >
              <span>Launch Booking Console</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/signup" className="px-5 py-2.5 rounded-xl border border-neutral-700 hover:border-neutral-500 text-white font-bold text-xs">
              Create Business Account
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
