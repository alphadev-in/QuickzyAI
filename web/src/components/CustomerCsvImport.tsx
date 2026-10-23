'use client';

import React, { useState } from 'react';
import { AddressItem, CustomerRecord } from '@/types/delivery';
import { saveCustomer } from '@/lib/customerService';
import { parseCustomerCsv, ParsedCustomer, SAMPLE_CUSTOMER_CSV } from '@/lib/customerCsv';
import { Download, FileSpreadsheet, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface CustomerCsvImportProps {
  ownerEmail: string;
  customers: CustomerRecord[];
  onImported: () => void;
}

const addressKey = (a: { line1: string; postcode: string }) =>
  `${a.line1.trim().toLowerCase()}|${a.postcode.trim().toUpperCase()}`;

export const CustomerCsvImport: React.FC<CustomerCsvImportProps> = ({ ownerEmail, customers, onImported }) => {
  const [parsed, setParsed] = useState<ParsedCustomer[]>([]);
  const [rowErrors, setRowErrors] = useState<{ row: number; message: string }[]>([]);
  const [fileName, setFileName] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState('');
  const [summary, setSummary] = useState('');
  const [error, setError] = useState('');

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CUSTOMER_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quickzy_customers_sample.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setSummary('');
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = parseCustomerCsv(String(event.target?.result || ''));
      setParsed(result.customers);
      setRowErrors(result.errors);
    };
    reader.readAsText(file);
  };

  const clearPreview = () => {
    setParsed([]);
    setRowErrors([]);
    setFileName('');
    setSummary('');
    setError('');
  };

  // Existing customer with the same name gets the new addresses added (duplicates skipped)
  const handleImport = async () => {
    setIsImporting(true);
    setError('');
    let created = 0;
    let updated = 0;
    let addressesAdded = 0;

    try {
      for (let i = 0; i < parsed.length; i++) {
        const incoming = parsed[i];
        setProgress(`Saving ${i + 1} of ${parsed.length}: ${incoming.name}`);

        const existing = customers.find((c) => c.name.trim().toLowerCase() === incoming.name.toLowerCase());
        const existingAddresses: AddressItem[] = existing?.addresses || [];
        const seen = new Set(existingAddresses.map(addressKey));

        const newAddresses: AddressItem[] = [];
        for (const a of incoming.addresses) {
          if (seen.has(addressKey(a))) continue;
          seen.add(addressKey(a));
          newAddresses.push({
            id: `addr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            line1: a.line1,
            line2: a.line2 || undefined,
            city: 'London',
            postcode: a.postcode,
            label: a.label,
            userId: ownerEmail,
          });
        }

        await saveCustomer(ownerEmail, {
          id: existing?.id,
          createdAt: existing?.createdAt,
          name: existing?.name || incoming.name,
          addresses: [...existingAddresses, ...newAddresses],
        });

        if (existing) updated++;
        else created++;
        addressesAdded += newAddresses.length;
      }

      setSummary(`Imported ${created} new and updated ${updated} existing customer${updated === 1 ? '' : 's'} (${addressesAdded} addresses added).`);
      setParsed([]);
      setRowErrors([]);
      setFileName('');
      onImported();
    } catch (err: any) {
      setError(err.message || 'Import stopped part-way. Check the customer list before retrying.');
      onImported();
    } finally {
      setIsImporting(false);
      setProgress('');
    }
  };

  const totalAddresses = parsed.reduce((n, c) => n + c.addresses.length, 0);

  return (
    <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-cyan-400" /> Import customers from CSV
          </h3>
          <p className="text-[11px] text-neutral-400 mt-1">
            One row per address. Rows with the same customerName become one customer with several addresses.
          </p>
        </div>
        <button
          type="button"
          onClick={downloadSample}
          className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 border border-neutral-700 flex items-center gap-2 self-start"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" /> Download sample CSV
        </button>
      </div>

      <p className="text-[11px] font-mono text-neutral-500 break-all">
        customerName, addressLabel, line1, line2, postcode
      </p>

      <label className="cursor-pointer inline-flex px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 text-xs font-bold items-center gap-2">
        <FileSpreadsheet className="w-4 h-4" />
        <span>{fileName ? `Selected: ${fileName}` : 'Choose customer CSV'}</span>
        <input type="file" accept=".csv" onChange={handleFile} className="hidden" />
      </label>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {summary && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{summary}</span>
        </div>
      )}

      {rowErrors.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 space-y-1.5 max-h-40 overflow-y-auto">
          <p className="text-xs font-bold text-red-400">{rowErrors.length} row{rowErrors.length === 1 ? '' : 's'} skipped</p>
          {rowErrors.map((err) => (
            <p key={err.row} className="text-[11px] text-red-200">
              <span className="font-mono font-bold text-red-300">Row {err.row}:</span> {err.message}
            </p>
          ))}
        </div>
      )}

      {parsed.length > 0 && (
        <div className="space-y-3">
          <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
            {parsed.map((c) => (
              <div key={c.name} className="p-3 rounded-lg bg-neutral-900/70 border border-neutral-800 text-xs">
                <p className="font-bold text-white">
                  {c.name}
                  {customers.some((e) => e.name.trim().toLowerCase() === c.name.toLowerCase()) && (
                    <span className="ml-2 text-[10px] text-amber-400 font-normal">exists: will add addresses</span>
                  )}
                </p>
                {c.addresses.map((a, i) => (
                  <p key={i} className="text-neutral-400 mt-0.5">
                    <span className="text-neutral-500">{a.label}:</span> {a.line1}
                    {a.line2 ? `, ${a.line2}` : ''} <span className="font-mono text-emerald-400">{a.postcode}</span>
                  </p>
                ))}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-neutral-300">
              {parsed.length} customer{parsed.length === 1 ? '' : 's'}, {totalAddresses} address{totalAddresses === 1 ? '' : 'es'} ready
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={clearPreview} disabled={isImporting} className="px-4 py-2 rounded-xl bg-neutral-800 text-xs font-semibold text-neutral-300 hover:bg-neutral-700 disabled:opacity-40">
                Clear
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={isImporting}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-black flex items-center gap-2 disabled:opacity-50"
              >
                {isImporting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isImporting ? progress : `Import ${parsed.length} customer${parsed.length === 1 ? '' : 's'}`}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
