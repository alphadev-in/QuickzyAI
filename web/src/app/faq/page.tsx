import React from 'react';
import Link from 'next/link';
import { ArrowLeft, HelpCircle, Clock, ShieldCheck, MapPin, Truck, ChevronDown, ArrowRight } from 'lucide-react';
import { Footer } from '@/components/Footer';

export const metadata = {
  title: 'Frequently Asked Questions (FAQ) | Quickzy Same-Day London Delivery',
  description: 'Find answers about Quickzy London same-day courier service, 14:00 GMT cutoff, parcel dimensions, restricted items, and business bulk manifests.',
};

const FAQS = [
  {
    q: 'What areas does Quickzy deliver to?',
    a: 'Quickzy operates exclusively across all 32 London Boroughs plus the City of London (Square Mile). Every postcode within postal districts E, EC, N, NW, SE, SW, W, WC, and outer London corridors (BR, CR, DA, EN, HA, IG, KT, RM, SM, TW, UB) is geocoded and validated automatically.',
  },
  {
    q: 'What is the daily same-day cutoff time?',
    a: 'Our same-day dispatch cutoff is strictly 14:00 GMT (2:00 PM London time). Orders booked before 14:00 GMT are delivered the very same afternoon or evening. Orders booked after 14:00 GMT automatically default to scheduled morning delivery on the next business day.',
  },
  {
    q: 'How does live order tracking work for customers?',
    a: 'Every order booked with Quickzy is tracked in real time. Once you sign in with your email address, all your orders are automatically listed on your dashboard showing exact lifecycle milestones (Booked ➔ Collected ➔ Out for Delivery ➔ Delivered) with interactive OpenStreetMap route visualization and VAT invoices.',
  },
  {
    q: 'How do business clients upload bulk parcel manifests?',
    a: 'Business accounts can upload standard CSV spreadsheets containing hundreds of consignments. Our engine validates every pickup and drop-off London postcode row by row, computes exact dynamic distances, and confirms the entire batch in a single atomic transaction.',
  },
  {
    q: 'What delivery streams are supported?',
    a: 'Quickzy supports three core streams: (1) Pharmacy & Medical Therapeutics (secure chain-of-custody), (2) Food & Groceries (insulated cold-chain under 25-minute transit), and (3) Point-to-Point Parcels & B2B Packages up to 30kg.',
  },
  {
    q: 'Are drivers and couriers vetted?',
    a: 'Yes. Every courier on the Quickzy network undergoes identity verification, right-to-work validation, and area-specific onboarding with thermal cold-chain and tamper-evident seal training.',
  },
  {
    q: 'How are delivery prices calculated?',
    a: 'Prices are computed transparently based on administrative base rates, estimated London route mileage, parcel weight over 2kg, volumetric dimensions, and specialized handling for restricted goods (such as prescription therapeutics or lithium batteries).',
  },
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-neutral-950">
      {/* Top Header */}
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full space-y-10">
        {/* Header */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Help Center & Guidelines</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            Frequently Asked Questions
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed max-w-2xl">
            Everything you need to know about rapid same-day London deliveries, fleet dispatch, postcode eligibility, and business manifests.
          </p>
        </div>

        {/* Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl glass-panel space-y-1.5 border border-neutral-800">
            <Clock className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs font-bold text-white">14:00 GMT Cutoff</h2>
            <p className="text-[11px] text-neutral-400">Order by 2pm for same-day delivery across London.</p>
          </div>
          <div className="p-4 rounded-2xl glass-panel space-y-1.5 border border-neutral-800">
            <MapPin className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-bold text-white">All 32 Boroughs</h2>
            <p className="text-[11px] text-neutral-400">Direct courier coverage across Central & Greater London.</p>
          </div>
          <div className="p-4 rounded-2xl glass-panel space-y-1.5 border border-neutral-800">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs font-bold text-white">Regulated Transit</h2>
            <p className="text-[11px] text-neutral-400">Cold-chain, pharmacy, and fragile parcel certified.</p>
          </div>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-4">
          {FAQS.map((faq, index) => (
            <div
              key={index}
              className="p-5 rounded-2xl border border-neutral-800 bg-neutral-900/60 space-y-2 hover:border-emerald-500/40 transition"
            >
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="text-emerald-400">Q:</span>
                <span>{faq.q}</span>
              </h2>
              <p className="text-xs text-neutral-400 leading-relaxed pl-5">
                {faq.a}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="p-8 rounded-3xl bg-neutral-900 border border-neutral-800 text-center space-y-4 shadow-xl">
          <h2 className="text-2xl font-black text-white">Still have questions?</h2>
          <p className="text-xs text-neutral-400 max-w-md mx-auto">
            Our London dispatcher team is on standby 7 days a week to support high-priority parcel consignments.
          </p>
          <div className="flex justify-center gap-3">
            <Link
              href="/"
              className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <span>Instant London Booking</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
