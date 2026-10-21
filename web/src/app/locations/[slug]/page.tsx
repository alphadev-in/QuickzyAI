import React from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin, CheckCircle, Clock, ShieldCheck, ArrowRight, Truck, Box } from 'lucide-react';
import { Footer } from '@/components/Footer';
import { notFound } from 'next/navigation';

interface LocationZone {
  slug: string;
  title: string;
  seoTitle: string;
  metaDescription: string;
  zone: string;
  postcodes: string[];
  neighborhoods: string[];
  summary: string;
  keyServices: string[];
}

const LONDON_ZONES: Record<string, LocationZone> = {
  'central-london': {
    slug: 'central-london',
    title: 'Central London Same-Day Courier Delivery',
    seoTitle: 'Same-Day Courier Central London (EC, WC, W1, SW1) | Quickzy',
    metaDescription: 'Fast 60-minute and same-day delivery courier service across Central London, City of London, Westminster, Holborn, Mayfair, Soho, and Covent Garden.',
    zone: 'Central London',
    postcodes: ['EC1', 'EC2', 'EC3', 'EC4', 'WC1', 'WC2', 'W1', 'SW1'],
    neighborhoods: ['City of London (Square Mile)', 'Westminster', 'Mayfair', 'Soho', 'Covent Garden', 'Holborn', 'Fitzrovia', 'St James’s', 'Bloomsbury'],
    summary: 'Ultra-dense urban routing optimized for Central London congestion zones and low-emission zones. Rapid cycle couriers and electric cargo vehicles deliver pharmacy supplies, corporate parcels, and fine food within 60-90 minutes.',
    keyServices: ['Same-day prescription and medical clinic delivery', 'Priority business documents and corporate packages', 'Artisan food and temperature-sensitive catering', 'Bulk manifest delivery to corporate headquarters'],
  },
  'north-london': {
    slug: 'north-london',
    title: 'North London Same-Day Courier Delivery',
    seoTitle: 'Rapid Same-Day Delivery North London (N, NW) | Quickzy',
    metaDescription: 'Reliable point-to-point courier across North London: Camden, Islington, Highbury, Hampstead, Finchley, and Highgate for pharmacies, parcels, and local merchants.',
    zone: 'North London',
    postcodes: ['N1', 'N2', 'N3', 'N4', 'N5', 'N6', 'N7', 'N8', 'N19', 'NW1', 'NW3', 'NW5', 'NW6', 'NW8'],
    neighborhoods: ['Camden Town', 'Islington & Angel', 'Hampstead', 'Highbury', 'Highgate', 'Finchley', 'St John’s Wood', 'Kentish Town', 'Muswell Hill'],
    summary: 'Comprehensive neighborhood distribution covering North London urban corridors and residential enclaves with dedicated routes for pharmacies, boutiques, and bulk parcel clients.',
    keyServices: ['Pharmacy therapeutics and repeat prescriptions', 'E-commerce returns and scheduled parcel pickups', 'Independent food producers and grocers', 'Afternoon scheduled delivery up to 14:00 GMT cutoff'],
  },
  'east-london': {
    slug: 'east-london',
    title: 'East London & Canary Wharf Same-Day Courier Delivery',
    seoTitle: 'Same-Day Courier East London & Canary Wharf (E1, E14, Hackney) | Quickzy',
    metaDescription: 'Speedy courier dispatch in East London: Shoreditch, Hackney, Canary Wharf, Whitechapel, Stratford, and Bow. Same-day parcel and cold-chain logistics.',
    zone: 'East London & Docklands',
    postcodes: ['E1', 'E2', 'E3', 'E5', 'E8', 'E9', 'E14', 'E1W', 'E15', 'E16'],
    neighborhoods: ['Canary Wharf', 'Shoreditch', 'Hackney Central', 'Whitechapel', 'Wapping', 'Stratford', 'Bow', 'Bethnal Green', 'Isle of Dogs'],
    summary: 'Fast-paced logistics connecting East London tech hubs, creative quarters, and the Canary Wharf financial district with instant courier dispatch and manifest bulk import tools.',
    keyServices: ['Financial district corporate dispatch', 'Creative studio and e-commerce bulk manifests', 'Cold-chain specialty foods and bakery runs', 'Late-morning pickup with same-day drop-off guarantee'],
  },
  'west-london': {
    slug: 'west-london',
    title: 'West London Same-Day Courier Delivery',
    seoTitle: 'Same-Day Courier West London (W, SW, Kensington, Chelsea) | Quickzy',
    metaDescription: 'Premium same-day delivery service across West London: Kensington, Chelsea, Fulham, Notting Hill, Hammersmith, Chiswick, and Ealing.',
    zone: 'West London & Royal Boroughs',
    postcodes: ['W2', 'W6', 'W8', 'W11', 'W14', 'SW3', 'SW5', 'SW7', 'SW10', 'SW6', 'W5', 'W4'],
    neighborhoods: ['Kensington', 'Chelsea', 'Knightsbridge', 'Notting Hill', 'Fulham', 'Hammersmith', 'Chiswick', 'South Kensington', 'Holland Park'],
    summary: 'White-glove point-to-point courier solutions for Royal Boroughs and West London postcodes. Full care for high-value parcels, luxury retail, and pharmaceutical therapeutics.',
    keyServices: ['High-value goods and delicate item transit', 'Same-day luxury retail and boutique consignment', 'Private pharmacy delivery with chain-of-custody tracking', 'Multi-stop residential scheduled delivery'],
  },
};

export async function generateStaticParams() {
  return Object.keys(LONDON_ZONES).map((slug) => ({ slug }));
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
