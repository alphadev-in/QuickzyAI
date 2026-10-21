import React from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin, CheckCircle, Navigation, Clock, ShieldCheck, ArrowRight } from 'lucide-react';
import { Footer } from '@/components/Footer';

export const metadata = {
  title: 'London Delivery Coverage & Boroughs | Quickzy Same-Day Courier',
  description: 'Explore Quickzy rapid same-day delivery coverage across all 32 London boroughs and the City of London for Pharmacy, Food, and Parcel freight.',
};

const BOROUGHS = [
  { name: 'City of London', codes: 'EC1, EC2, EC3, EC4', zone: 'Central' },
  { name: 'City of Westminster', codes: 'W1, WC1, WC2, SW1', zone: 'Central' },
  { name: 'Kensington and Chelsea', codes: 'SW3, SW7, SW10, W8, W11', zone: 'West' },
  { name: 'Camden', codes: 'NW1, NW3, NW5, WC1', zone: 'North / Central' },
  { name: 'Islington', codes: 'N1, N5, N7, N19', zone: 'North' },
  { name: 'Hackney & Shoreditch', codes: 'E1, E2, E5, E8, E9', zone: 'East' },
  { name: 'Tower Hamlets & Canary Wharf', codes: 'E14, E1W, E3', zone: 'East' },
  { name: 'Southwark', codes: 'SE1, SE15, SE16, SE22', zone: 'South' },
  { name: 'Lambeth', codes: 'SE11, SW2, SW4, SW8, SW9', zone: 'South' },
  { name: 'Hammersmith and Fulham', codes: 'W6, W12, W14, SW6', zone: 'West' },
  { name: 'Wandsworth', codes: 'SW11, SW12, SW15, SW18', zone: 'South' },
  { name: 'Greenwich', codes: 'SE3, SE10, SE18', zone: 'South East' },
  { name: 'Lewisham', codes: 'SE4, SE8, SE13', zone: 'South East' },
  { name: 'Barnet', codes: 'EN4, EN5, HA8, N2, N3, N12', zone: 'Outer North' },
  { name: 'Ealing', codes: 'W5, W13, UB1, UB2', zone: 'West' },
  { name: 'Richmond upon Thames', codes: 'TW9, TW10, SW13, SW14', zone: 'South West' },
  { name: 'Croydon', codes: 'CR0, CR2, CR7, CR9', zone: 'South' },
  { name: 'Brent', codes: 'HA0, HA9, NW2, NW6, NW10', zone: 'North West' },
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
            <span>Back to Quickzy Main</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
              Q
            </div>
            <span className="font-bold text-sm text-white">Quickzy London Coverage</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full space-y-10">
        <div className="max-w-3xl space-y-4">
          <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            London Logistics Directory
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            Same-Day Delivery Coverage in London
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
            Quickzy operates specialized zero-emission and low-emission rapid dispatch fleets connecting all 32 London Boroughs and the Square Mile. Every postcode is geocoded and validated in real time.
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
            <h2 className="text-sm font-bold text-white">Regulated & Cold-Chain</h2>
            <p className="text-xs text-neutral-400">
              Special handling bags for pharmacy therapeutics and cold-chain temperature control.
            </p>
          </div>
        </div>

        {/* Boroughs Directory Grid */}
        <div className="space-y-4 pt-6">
          <h2 className="text-xl font-black text-white">London Boroughs & Postal Sectors</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {BOROUGHS.map((b) => (
              <div
                key={b.name}
                className="p-4 rounded-2xl border border-neutral-800 bg-neutral-900/60 hover:border-emerald-500/60 transition space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">{b.name}</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 font-mono">
                    {b.zone}
                  </span>
                </div>
                <p className="text-xs text-neutral-400">
                  Postal codes: <span className="font-mono text-emerald-400">{b.codes}</span>
                </p>
                <p className="text-[11px] text-neutral-500 pt-1">
                  Active same-day coverage for Pharmacy, Food & Parcels.
                </p>
              </div>
            ))}
          </div>
        </div>

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
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
