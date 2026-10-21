'use client';

import React, { useState } from 'react';
import { parseAndValidateCsv, SAMPLE_CSV_TEMPLATE } from '@/lib/csvValidator';
import { createBulkOrders } from '@/lib/orderService';
import { QuickzyOrder } from '@/types/delivery';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Download,
  ArrowRight,
  ShieldAlert,
  Loader2,
} from 'lucide-react';

interface BulkParcelBookingProps {
  clientId: string;
  clientEmail: string;
  onBulkCompleted: (orders: QuickzyOrder[]) => void;
}

export const BulkParcelBooking: React.FC<BulkParcelBookingProps> = ({
  clientId,
  clientEmail,
  onBulkCompleted,
}) => {
  const [csvContent, setCsvContent] = useState('');
  const [validationResult, setValidationResult] = useState<ReturnType<typeof parseAndValidateCsv> | null>(
    null
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [creationSuccess, setCreationSuccess] = useState<QuickzyOrder[] | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvContent(text);
      const result = parseAndValidateCsv(text);
      setValidationResult(result);
    };
    reader.readAsText(file);
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([SAMPLE_CSV_TEMPLATE], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quickzy_bulk_parcel_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleConfirmTransaction = async () => {
    if (!validationResult || validationResult.validRows.length === 0) return;
    setIsProcessing(true);
    setErrorMessage('');

    const res = await createBulkOrders(clientId, clientEmail, validationResult.validRows);
    setIsProcessing(false);

    if (res.success) {
      setCreationSuccess(res.orders);
      onBulkCompleted(res.orders);
    } else {
      setErrorMessage(res.error || 'Failed to create bulk orders in one transaction.');
    }
  };

  const handleLoadSample = () => {
    setCsvContent(SAMPLE_CSV_TEMPLATE);
    const result = parseAndValidateCsv(SAMPLE_CSV_TEMPLATE);
    setValidationResult(result);
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 lg:p-8 shadow-2xl max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-neutral-800 gap-4">
        <div>
          <h2 className="text-xl lg:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Client Bulk Parcel Importer</span>
            <span className="text-[10px] font-extrabold bg-cyan-500/20 text-cyan-400 px-2.5 py-0.5 rounded-full border border-cyan-500/30">
              CSV TRANSACTIONS
            </span>
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Upload parcel manifests for same-day delivery. Validates each London row and executes atomically in one transaction.
          </p>
        </div>

        <button
          onClick={handleDownloadTemplate}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 transition border border-neutral-700/60 self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
          <span>Download CSV Template</span>
        </button>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {creationSuccess ? (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 text-center space-y-4">
          <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-white">Bulk Transaction Completed!</h3>
          <p className="text-xs text-neutral-300">
            Successfully created {creationSuccess.length} same-day parcel orders under one transaction.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setCreationSuccess(null);
                setValidationResult(null);
                setCsvContent('');
              }}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold rounded-xl text-xs"
            >
              Upload Another CSV
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* File Drag / Drop Area */}
          <div className="border-2 border-dashed border-neutral-700/80 hover:border-cyan-500/80 rounded-2xl p-8 text-center transition bg-neutral-950/40">
            <UploadCloud className="w-10 h-10 text-cyan-400 mx-auto mb-3" />
            <p className="text-sm font-bold text-white mb-1">Upload Bulk Parcel CSV</p>
            <p className="text-xs text-neutral-400 mb-4">
              Columns: recipientName, pickupLine1, pickupPostcode, dropoffLine1, dropoffPostcode, type, weightKg, lengthCm, widthCm, heightCm, contents, isRestricted
            </p>

            <div className="flex justify-center items-center gap-3">
              <label className="cursor-pointer px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 text-xs font-bold transition flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                <span>Choose CSV File</span>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={handleLoadSample}
                className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-300 font-semibold border border-neutral-700"
              >
                Load Sample Test Manifest
              </button>
            </div>
          </div>

          {/* Validation Report Table */}
          {validationResult && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-neutral-300 uppercase tracking-wider">
                  Validation Results ({validationResult.totalRows} Rows Evaluated)
                </span>
                <div className="flex gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                    ✓ {validationResult.validRows.length} Valid Rows
                  </span>
                  {validationResult.invalidRows.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-bold">
                      ✕ {validationResult.invalidRows.length} Errors Found
                    </span>
                  )}
                </div>
              </div>

              {/* Error Rows Reporting */}
              {validationResult.invalidRows.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-red-400">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Row-Level Errors Found (Please fix before confirming transaction)</span>
                  </div>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {validationResult.invalidRows.map((err, i) => (
                      <div key={i} className="text-[11px] bg-red-950/40 p-2 rounded border border-red-800/40">
                        <span className="font-mono font-bold text-red-300 mr-2">Row #{err.row}:</span>
                        <span className="text-red-200">{err.errors.join(' • ')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Valid Rows Preview */}
              <div className="overflow-x-auto border border-neutral-800 rounded-xl bg-neutral-950/80">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-800 text-neutral-300 border-b border-neutral-700">
                    <tr>
                      <th className="p-2.5">Recipient</th>
                      <th className="p-2.5">Type</th>
                      <th className="p-2.5">Pickup (London)</th>
                      <th className="p-2.5">Drop-off (London)</th>
                      <th className="p-2.5">Weight / Dimensions</th>
                      <th className="p-2.5">Restricted</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800 text-neutral-300">
                    {validationResult.validRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-neutral-900/50">
                        <td className="p-2.5 font-bold text-white">{row.recipientName}</td>
                        <td className="p-2.5 uppercase font-mono text-[10px] text-cyan-400">{row.type}</td>
                        <td className="p-2.5 font-mono text-[11px] text-emerald-400">
                          {row.pickupAddress.postcode}
                        </td>
                        <td className="p-2.5 font-mono text-[11px] text-cyan-400">
                          {row.dropoffAddress.postcode}
                        </td>
                        <td className="p-2.5 text-[11px]">
                          {row.parcel.weightKg}kg • {row.parcel.lengthCm}x{row.parcel.widthCm}x{row.parcel.heightCm}cm
                        </td>
                        <td className="p-2.5">
                          {row.parcel.isRestricted ? (
                            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
                              Yes ⚠️
                            </span>
                          ) : (
                            <span className="text-[10px] text-neutral-500">No</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Action Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  disabled={
                    isProcessing ||
                    validationResult.validRows.length === 0 ||
                    validationResult.invalidRows.length > 0
                  }
                  onClick={handleConfirmTransaction}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-neutral-950 font-black rounded-xl text-xs flex items-center gap-2 disabled:opacity-40 transition shadow-lg shadow-emerald-500/20"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Orders in One Transaction...</span>
                    </>
                  ) : (
                    <>
                      <span>
                        Confirm & Create All {validationResult.validRows.length} Orders in Single Transaction
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
