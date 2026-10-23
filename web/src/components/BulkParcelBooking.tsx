'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { parseAndValidateCsv, SAMPLE_CSV_TEMPLATE, CsvValidationResult } from '@/lib/csvValidator';
import { createBulkOrders, fetchPricingConfig } from '@/lib/orderService';
import { fetchRouteMiles } from '@/lib/routeMiles';
import { CheckoutPanel } from '@/components/CheckoutPanel';
import {
  QuickzyOrder,
  ParcelPricingConfig,
  DEFAULT_PRICING_CONFIG,
  PaymentMethod,
  calculateDeliveryPrice,
} from '@/types/delivery';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Download,
  ShieldAlert,
  Loader2,
  Route,
} from 'lucide-react';

interface BulkParcelBookingProps {
  clientId: string;
  clientEmail: string;
  creditBalancePence: number;
  onBulkCompleted: (orders: QuickzyOrder[]) => void;
  onCreditChanged: () => void;
}

// A valid CSV row after its route has been measured and priced
interface PricedRow {
  rowNumber: number;
  // Shape matches CreateOrderSchema input
  [key: string]: any;
  estimatedMiles: number;
  totalPence: number;
}

const formatGbp = (pence: number) => `£${(pence / 100).toFixed(2)}`;

export const BulkParcelBooking: React.FC<BulkParcelBookingProps> = ({
  clientId,
  clientEmail,
  creditBalancePence,
  onBulkCompleted,
  onCreditChanged,
}) => {
  const [validationResult, setValidationResult] = useState<CsvValidationResult | null>(null);
  const [pricedRows, setPricedRows] = useState<PricedRow[]>([]);
  const [routeErrors, setRouteErrors] = useState<CsvValidationResult['invalidRows']>([]);
  const [pricingConfig, setPricingConfig] = useState<ParcelPricingConfig>(DEFAULT_PRICING_CONFIG);
  const [isPricing, setIsPricing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [creationSuccess, setCreationSuccess] = useState<QuickzyOrder[] | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchPricingConfig().then((cfg) => cfg && setPricingConfig(cfg));
  }, []);

  const totalPence = useMemo(() => pricedRows.reduce((sum, r) => sum + r.totalPence, 0), [pricedRows]);
  const allInvalid = [...(validationResult?.invalidRows || []), ...routeErrors];

  const resetAll = () => {
    setValidationResult(null);
    setPricedRows([]);
    setRouteErrors([]);
    setCreationSuccess(null);
    setErrorMessage('');
  };

  // Measure road miles for every valid row in one request, then price on base + per-mile only
  const priceRows = async (result: CsvValidationResult) => {
    setIsPricing(true);
    setErrorMessage('');
    try {
      const routes = await fetchRouteMiles(
        result.validRows.map((r) => ({
          pickupPostcode: r.pickupAddress.postcode,
          dropoffPostcode: r.dropoffAddress.postcode,
        }))
      );

      const priced: PricedRow[] = [];
      const failed: CsvValidationResult['invalidRows'] = [];

      result.validRows.forEach((row, i) => {
        const route = routes[i];
        if (route?.miles == null) {
          failed.push({ row: i + 2, data: row, errors: [route?.error || 'Route could not be measured'] });
          return;
        }
        const quote = calculateDeliveryPrice({ type: row.type, estimatedMiles: route.miles }, pricingConfig);
        priced.push({ ...row, rowNumber: i + 2, estimatedMiles: quote.estimatedMiles, totalPence: quote.totalPence });
      });

      setPricedRows(priced);
      setRouteErrors(failed);
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not calculate route distances.');
    } finally {
      setIsPricing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const result = parseAndValidateCsv(text);
      setCreationSuccess(null);
      setRouteErrors([]);
      setValidationResult(result);
      setPricedRows([]);
      if (result.validRows.length > 0) priceRows(result);
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

  // Runs after payment succeeds (card or credit)
  const handlePaid = async (payment: { method: PaymentMethod; reference: string }) => {
    setIsProcessing(true);
    setErrorMessage('');
    const res = await createBulkOrders(
      clientId,
      clientEmail,
      pricedRows.map(({ rowNumber, totalPence, ...row }) => row),
      payment
    );
    setIsProcessing(false);

    if (res.success) {
      setCreationSuccess(res.orders);
      setPricedRows([]);
      onBulkCompleted(res.orders);
      onCreditChanged();
    } else {
      setErrorMessage(res.error || 'Payment received, but the orders could not be created. Contact support with your payment reference.');
    }
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
            Upload a manifest. Each row is measured by road miles and priced, then the whole manifest is paid once.
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
          <h3 className="text-lg font-bold text-white">Payment Received</h3>
          <p className="text-xs text-neutral-300">
            {creationSuccess.length} orders are ready. Our driver will take them and deliver soon.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => {
                resetAll();
              }}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold rounded-xl text-xs"
            >
              Upload Another CSV
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Upload */}
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
                <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
              </label>

              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-300 font-semibold border border-neutral-700 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Export CSV Template</span>
              </button>
            </div>
          </div>

          {validationResult && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-neutral-300 uppercase tracking-wider">
                  Validation Results ({validationResult.totalRows} Rows Evaluated)
                </span>
                <div className="flex gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                    ✓ {pricedRows.length} Priced Rows
                  </span>
                  {allInvalid.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-bold">
                      ✕ {allInvalid.length} Errors Found
                    </span>
                  )}
                </div>
              </div>

              {allInvalid.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-red-400">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Row-Level Errors (fix these rows and re-upload before paying)</span>
                  </div>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {allInvalid.map((err, i) => (
                      <div key={i} className="text-[11px] bg-red-950/40 p-2 rounded border border-red-800/40">
                        <span className="font-mono font-bold text-red-300 mr-2">Row #{err.row}:</span>
                        <span className="text-red-200">{err.errors.join(' • ')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isPricing && (
                <div className="flex items-center justify-center gap-2 text-xs text-neutral-300 py-4">
                  <Route className="w-4 h-4 text-cyan-400 animate-pulse" /> Measuring road miles for each row...
                </div>
              )}

              {pricedRows.length > 0 && (
                <div className="overflow-x-auto border border-neutral-800 rounded-xl bg-neutral-950/80">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-neutral-800 text-neutral-300 border-b border-neutral-700">
                      <tr>
                        <th className="p-2.5">Recipient</th>
                        <th className="p-2.5">Type</th>
                        <th className="p-2.5">Pickup → Drop-off</th>
                        <th className="p-2.5">Miles</th>
                        <th className="p-2.5 text-right">Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800 text-neutral-300">
                      {pricedRows.map((row) => (
                        <tr key={row.rowNumber} className="hover:bg-neutral-900/50">
                          <td className="p-2.5 font-bold text-white">{row.recipientName}</td>
                          <td className="p-2.5 uppercase font-mono text-[10px] text-cyan-400">{row.type}</td>
                          <td className="p-2.5 font-mono text-[11px]">
                            <span className="text-emerald-400">{row.pickupAddress.postcode}</span>
                            <span className="text-neutral-500"> → </span>
                            <span className="text-cyan-400">{row.dropoffAddress.postcode}</span>
                          </td>
                          <td className="p-2.5 font-mono">{row.estimatedMiles.toFixed(2)}</td>
                          <td className="p-2.5 text-right font-bold text-emerald-400">{formatGbp(row.totalPence)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t border-neutral-700 bg-neutral-900">
                      <tr>
                        <td colSpan={4} className="p-2.5 text-right text-neutral-400">Manifest total</td>
                        <td className="p-2.5 text-right text-lg font-black text-emerald-400">{formatGbp(totalPence)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              {pricedRows.length > 0 && allInvalid.length === 0 && (
                <div className="pt-2">
                  {isProcessing ? (
                    <div className="flex items-center justify-center gap-2 text-xs text-neutral-300 py-3">
                      <Loader2 className="w-4 h-4 animate-spin" /> Payment received. Creating {pricedRows.length} orders...
                    </div>
                  ) : (
                    <CheckoutPanel
                      amountPence={totalPence}
                      description={`Quickzy bulk manifest x${pricedRows.length}`}
                      customerEmail={clientEmail}
                      purpose="order"
                      creditBalancePence={creditBalancePence}
                      payLabel={`Pay ${formatGbp(totalPence)} for ${pricedRows.length} orders`}
                      onPaid={handlePaid}
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
