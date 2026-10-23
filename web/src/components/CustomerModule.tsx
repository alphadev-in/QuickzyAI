'use client';

import React, { useState } from 'react';
import { AddressItem, CustomerRecord, isValidLondonPostcode } from '@/types/delivery';
import { saveCustomer, deleteCustomer } from '@/lib/customerService';
import { CustomerCsvImport } from '@/components/CustomerCsvImport';
import { Users, Plus, Pencil, Trash2, MapPin, ShieldAlert, CheckCircle2, X } from 'lucide-react';

interface CustomerModuleProps {
  ownerEmail: string;
  customers: CustomerRecord[];
  onChanged: () => void;
}

interface DraftAddress {
  id: string;
  label: string;
  line1: string;
  line2: string;
  postcode: string;
}

interface Draft {
  id?: string;
  createdAt?: string;
  name: string;
  addresses: DraftAddress[];
}

const LABELS = ['Home', 'Office', 'Store', 'Warehouse'];

const emptyAddress = (): DraftAddress => ({
  id: `draft_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
  label: 'Home',
  line1: '',
  line2: '',
  postcode: '',
});

export const CustomerModule: React.FC<CustomerModuleProps> = ({ ownerEmail, customers, onChanged }) => {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const startNew = () => {
    setError('');
    setSuccess('');
    setDraft({ name: '', addresses: [emptyAddress()] });
  };

  const startEdit = (c: CustomerRecord) => {
    setError('');
    setSuccess('');
    setDraft({
      id: c.id,
      createdAt: c.createdAt,
      name: c.name,
      addresses: c.addresses.map((a) => ({
        id: a.id,
        label: a.label || 'Home',
        line1: a.line1,
        line2: a.line2 || '',
        postcode: a.postcode,
      })),
    });
  };

  const updateAddress = (id: string, patch: Partial<DraftAddress>) => {
    setDraft((d) => d && { ...d, addresses: d.addresses.map((a) => (a.id === id ? { ...a, ...patch } : a)) });
  };

  const removeAddress = (id: string) => {
    setDraft((d) => d && { ...d, addresses: d.addresses.filter((a) => a.id !== id) });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    setError('');

    if (!draft.name.trim()) {
      setError('Customer name is required.');
      return;
    }
    if (draft.addresses.length === 0) {
      setError('Add at least one address for this customer.');
      return;
    }
    const badAddress = draft.addresses.find((a) => !isValidLondonPostcode(a.postcode.trim().toUpperCase()));
    if (badAddress) {
      setError(`'${badAddress.postcode || 'blank'}' is not a valid London postcode.`);
      return;
    }

    const addresses: AddressItem[] = draft.addresses.map((a) => ({
      id: a.id,
      line1: a.line1.trim(),
      line2: a.line2.trim() || undefined,
      city: 'London',
      postcode: a.postcode.trim().toUpperCase(),
      label: a.label,
      userId: ownerEmail,
    }));

    setIsSaving(true);
    try {
      await saveCustomer(ownerEmail, {
        id: draft.id,
        createdAt: draft.createdAt,
        name: draft.name,
        addresses,
      });
      setSuccess(`Saved ${draft.name.trim()}.`);
      setDraft(null);
      onChanged();
    } catch (err: any) {
      setError(err.message || 'Could not save customer.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (c: CustomerRecord) => {
    if (!window.confirm(`Delete customer ${c.name} and all their addresses?`)) return;
    setError('');
    try {
      await deleteCustomer(c.id);
      onChanged();
    } catch (err: any) {
      setError(err.message || 'Could not delete customer.');
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 lg:p-8 shadow-2xl max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <h2 className="text-xl lg:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" /> Customers
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Save customers with their London addresses. Pick one when booking a drop-off.
          </p>
        </div>
        {!draft && (
          <button
            onClick={startNew}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> New Customer
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && !draft && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {!draft && <CustomerCsvImport ownerEmail={ownerEmail} customers={customers} onImported={onChanged} />}

      {draft && (
        <form onSubmit={handleSave} className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">{draft.id ? 'Edit Customer' : 'New Customer'}</h3>
            <button type="button" onClick={() => setDraft(null)} className="text-neutral-400 hover:text-white" aria-label="Close">
              <X className="w-4 h-4" />
            </button>
          </div>

          <input
            type="text"
            required
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="Customer name *"
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
          />

          <div className="space-y-3">
            {draft.addresses.map((a, idx) => (
              <div key={a.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-3 rounded-lg bg-neutral-900/60 border border-neutral-800">
                <select
                  value={a.label}
                  onChange={(e) => updateAddress(a.id, { label: e.target.value })}
                  className="sm:col-span-2 bg-neutral-900 border border-neutral-800 rounded-lg px-2 py-2 text-xs text-white focus:outline-none"
                >
                  {LABELS.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
                <input
                  type="text"
                  required
                  value={a.line1}
                  onChange={(e) => updateAddress(a.id, { line1: e.target.value })}
                  placeholder={`Address line 1 (#${idx + 1}) *`}
                  className="sm:col-span-4 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
                <input
                  type="text"
                  value={a.line2}
                  onChange={(e) => updateAddress(a.id, { line2: e.target.value })}
                  placeholder="Flat / unit"
                  className="sm:col-span-2 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
                <input
                  type="text"
                  required
                  value={a.postcode}
                  onChange={(e) => updateAddress(a.id, { postcode: e.target.value.toUpperCase() })}
                  placeholder="Postcode *"
                  className="sm:col-span-3 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white font-mono uppercase focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => removeAddress(a.id)}
                  disabled={draft.addresses.length === 1}
                  className="sm:col-span-1 flex items-center justify-center text-neutral-500 hover:text-red-400 disabled:opacity-30"
                  aria-label="Remove address"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setDraft({ ...draft, addresses: [...draft.addresses, emptyAddress()] })}
            className="w-full py-2 rounded-xl border border-dashed border-neutral-700 hover:border-emerald-500 text-xs font-bold text-neutral-300 hover:text-emerald-400 flex items-center justify-center gap-2"
          >
            <Plus className="w-3.5 h-3.5" /> Add another address
          </button>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => setDraft(null)} className="flex-1 py-2.5 rounded-xl bg-neutral-800 text-xs font-semibold text-neutral-300 hover:bg-neutral-700">
              Cancel
            </button>
            <button type="submit" disabled={isSaving} className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-neutral-950 text-xs font-bold hover:bg-emerald-400 disabled:opacity-50">
              {isSaving ? 'Saving...' : 'Save Customer'}
            </button>
          </div>
        </form>
      )}

      {customers.length === 0 && !draft ? (
        <p className="text-xs text-neutral-500 text-center py-8">No customers yet. Add your first customer above.</p>
      ) : (
        <div className="space-y-3">
          {customers.map((c) => (
            <div key={c.id} className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-white">{c.name}</p>
                  <p className="text-[11px] text-neutral-500">{c.addresses.length} address{c.addresses.length === 1 ? '' : 'es'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => startEdit(c)} className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-200 flex items-center gap-1.5">
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button onClick={() => handleDelete(c)} className="px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-xs text-red-400 flex items-center gap-1.5">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
              <div className="mt-3 space-y-2">
                {c.addresses.map((a) => (
                  <div key={a.id} className="flex items-start gap-2 text-xs text-neutral-300">
                    <MapPin className="w-3.5 h-3.5 mt-0.5 text-emerald-400 shrink-0" />
                    <span>
                      <span className="font-bold text-white">{a.label || 'Address'}:</span> {a.line1}
                      {a.line2 ? `, ${a.line2}` : ''} <span className="font-mono text-emerald-400">{a.postcode}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
