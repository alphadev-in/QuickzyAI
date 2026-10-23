import React from 'react';
import Link from 'next/link';
import { FileCheck, ArrowLeft, Building2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Footer } from '@/components/Footer';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 selection:bg-emerald-500 selection:text-neutral-950 flex flex-col font-sans">
      <header className="border-b border-neutral-900 bg-neutral-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-bold text-neutral-300 hover:text-emerald-400 transition"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400 mr-1" />
            <div className="h-9 w-32 overflow-hidden flex items-center justify-start">
              <img src="/logo.png" alt="Quickzy" className="h-full w-auto object-contain object-left" />
            </div>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12 flex-1 w-full space-y-8">
        <div className="space-y-3 border-b border-neutral-800 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
            <FileCheck className="w-3.5 h-3.5" />
            <span>Service Agreement & Operating Standards</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Terms of Service
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
            Standard Operating Conditions and Dispatch Agreements for Quickzy Same-Day Courier Network.
          </p>
          <p className="text-xs text-neutral-500">Effective Date: October 2026</p>
        </div>

        <section className="space-y-4 text-xs sm:text-sm text-neutral-300 leading-relaxed">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-400" />
            1. Scope of Service & Platform
          </h2>
          <p>
            These terms constitute a legally binding agreement governing your access to the Quickzy platform, websites, and same-day delivery dispatch services throughout Greater London.
          </p>

          <h2 className="text-lg font-bold text-white pt-4">2. Geographic Coverage & Postcode Validation</h2>
          <p>
            Quickzy currently operates exclusively within Greater London postal areas (including Central, North, South, East, West, and surrounding London postal codes). Orders submitted with addresses outside London postcodes will be automatically rejected by our automated geocoding validation engine.
          </p>

          <h2 className="text-lg font-bold text-white pt-4">3. Same-Day Cutoff Policy</h2>
          <p>
            Our same-day delivery cutoff is <strong>14:00 GMT</strong>. Orders booked after 14:00 GMT automatically default to scheduled next-day delivery slots. ASAP orders booked before 14:00 GMT are dispatched immediately with target delivery on the same calendar day.
          </p>

          <h2 className="text-lg font-bold text-white pt-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            4. Restricted & Prohibited Items
          </h2>
          <p>
            Senders are required by law to accurately declare restricted items, including prescription therapeutics, lithium-ion battery units, and fragile items. Prohibited items—including illegal narcotics, firearms, explosive materials, and hazardous biochemicals—are strictly banned. Any violations will result in immediate order termination and reporting to UK transport authorities.
          </p>

          <h2 className="text-lg font-bold text-white pt-4">5. Bulk Import & Client Transactions</h2>
          <p>
            Clients using bulk CSV manifest uploads are responsible for the row-level accuracy of postal codes and parcel specifications. Manifest batches confirmed through the single-transaction flow represent confirmed binding delivery requests.
          </p>

          <h2 className="text-lg font-bold text-white pt-4">6. Limitation of Liability</h2>
          <p>
            Quickzy shall not be liable for delivery delays arising from extreme London traffic incidents, road closures, severe weather, or force majeure events. Standard transit insurance applies up to statutory limits per parcel consignment.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
