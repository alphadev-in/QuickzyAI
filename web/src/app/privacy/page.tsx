import React from 'react';
import Link from 'next/link';
import { Shield, FileText, ArrowLeft, Building2 } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 selection:bg-emerald-500 selection:text-neutral-950 flex flex-col font-sans">
      <header className="border-b border-neutral-900 bg-neutral-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
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
            <span className="font-bold text-sm text-white">Quickzy</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12 flex-1 w-full space-y-8">
        <div className="space-y-3 border-b border-neutral-800 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
            <Shield className="w-3.5 h-3.5" />
            <span>GDPR & UK Data Protection Act 2018 Compliant</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
            Quickzy is owned, managed, and operated by <strong className="text-white">Aelius Venture Limited</strong>, registered in the United Kingdom.
          </p>
          <p className="text-xs text-neutral-500">Last updated: October 2026</p>
        </div>

        <section className="space-y-4 text-xs sm:text-sm text-neutral-300 leading-relaxed">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-400" />
            1. Company Information & Data Controller
          </h2>
          <p>
            The data controller responsible for your personal information is <strong className="text-white">Aelius Venture Limited</strong> (&quot;Quickzy&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;). We provide rapid on-demand courier and delivery services across Greater London for pharmacy, food, and parcel orders.
          </p>

          <h2 className="text-lg font-bold text-white pt-4">2. Information We Collect</h2>
          <ul className="list-disc pl-5 space-y-2 text-neutral-400">
            <li><strong className="text-neutral-200">Account Credentials:</strong> Name, email address, contact telephone, password hashes, and company name (for business clients).</li>
            <li><strong className="text-neutral-200">London Address Details:</strong> Pickup and drop-off addresses, unit/flat numbers, postcodes, and geocoded location coordinates.</li>
            <li><strong className="text-neutral-200">Order & Manifest Data:</strong> Package weight, dimensions, item descriptions, and restricted-items declarations (e.g. prescription medicines, lithium batteries).</li>
            <li><strong className="text-neutral-200">Payment & Transaction Data:</strong> Invoices, transaction reference tokens, and receipts processed through PCI-DSS certified payment gateways.</li>
          </ul>

          <h2 className="text-lg font-bold text-white pt-4">3. How We Use Your Data</h2>
          <p>
            We process your personal information strictly for legitimate courier transit execution, order tracking, real-time dispatcher coordination, regulatory compliance (such as restricted item transportation checks), and fraud prevention.
          </p>

          <h2 className="text-lg font-bold text-white pt-4">4. Storage & Security</h2>
          <p>
            All address and order records are stored encrypted in transit and at rest using Google Cloud Firebase infrastructure with EU/UK data residency. We retain dispatch records only for the duration required by UK tax, transport, and delivery verification laws.
          </p>

          <h2 className="text-lg font-bold text-white pt-4">5. Your Legal Rights</h2>
          <p>
            Under UK GDPR, you have the right to access, rectify, or request deletion of your personal data, or to restrict its processing. To exercise these rights, please contact our data protection team at <a href="mailto:privacy@quickzy.co.uk" className="text-emerald-400 underline">privacy@quickzy.co.uk</a>.
          </p>
        </section>

        <div className="pt-8 border-t border-neutral-900 text-center text-xs text-neutral-500">
          <p>© 2026 Quickzy • App Managed and Operated by <strong>Aelius Venture Limited</strong>. All rights reserved.</p>
        </div>
      </main>
    </div>
  );
}
