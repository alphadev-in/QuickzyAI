'use client';

import React, { useState } from 'react';
import { AddressItem, isValidLondonPostcode } from '@/types/delivery';
import { saveAddress } from '@/lib/orderService';
import { MapPin, Plus, CheckCircle, AlertCircle, Building, Home, Briefcase } from 'lucide-react';

interface AddressBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  savedAddresses: AddressItem[];
  onSelectAddress?: (address: AddressItem, type: 'pickup' | 'dropoff') => void;
  selectionMode?: 'pickup' | 'dropoff' | null;
  onRefreshAddresses: () => void;
}

export const AddressBookModal: React.FC<AddressBookModalProps> = ({
  isOpen,
  onClose,
  userId,
  savedAddresses,
  onSelectAddress,
  selectionMode,
  onRefreshAddresses,
}) => {
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [postcode, setPostcode] = useState('');
  const [label, setLabel] = useState('Home');
  const [validationError, setValidationError] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  if (!isOpen) return null;

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    const formattedPostcode = postcode.trim().toUpperCase();
    if (!isValidLondonPostcode(formattedPostcode)) {
      setValidationError(
        `'${formattedPostcode}' is outside Greater London. Quickzy currently validates London postcodes only (E, EC, N, NW, SE, SW, W, WC, etc.).`
      );
      return;
    }

    try {
      await saveAddress(userId, {
        line1,
        line2: line2 || undefined,
        city: 'London',
        postcode: formattedPostcode,
        label,
      });

      setLine1('');
      setLine2('');
      setPostcode('');
      setIsAdding(false);
      onRefreshAddresses();
    } catch (err: any) {
      setValidationError(err.message || 'Failed to save address');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white font-mono"
        >
          ✕
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              {selectionMode ? `Select ${selectionMode.toUpperCase()} Address` : 'London Address Book'}
            </h3>
            <p className="text-xs text-neutral-400">Validated with Google Geocoding & London Postcodes</p>
          </div>
        </div>

        {/* Existing Addresses List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 mb-4">
          {savedAddresses.map((addr) => (
            <div
              key={addr.id}
              onClick={() => {
                if (selectionMode && onSelectAddress) {
                  onSelectAddress(addr, selectionMode);
                  onClose();
                }
              }}
              className={`p-3 rounded-xl border transition flex items-start justify-between cursor-pointer ${
                selectionMode
                  ? 'border-neutral-800 hover:border-emerald-500 bg-neutral-950/60'
                  : 'border-neutral-800 bg-neutral-950/40'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div className="p-1.5 rounded-lg bg-neutral-800 text-neutral-300 mt-0.5">
                  {addr.label === 'Home' ? (
                    <Home className="w-3.5 h-3.5" />
                  ) : addr.label === 'Office' || addr.label === 'HQ' ? (
                    <Briefcase className="w-3.5 h-3.5" />
                  ) : (
                    <Building className="w-3.5 h-3.5" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{addr.label || 'Saved Location'}</span>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-mono px-1.5 py-0.5 rounded">
                      {addr.postcode}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-300 mt-0.5">{addr.line1}</p>
                  {addr.line2 && <p className="text-[11px] text-neutral-400">{addr.line2}</p>}
                </div>
              </div>
              {selectionMode && (
                <button className="text-xs font-semibold text-emerald-400 hover:underline px-2 py-1">
                  Use
                </button>
              )}
            </div>
          ))}

          {savedAddresses.length === 0 && (
            <p className="text-xs text-neutral-500 text-center py-6">No saved addresses yet.</p>
          )}
        </div>

        {/* Add Address Form Toggle */}
        {!isAdding ? (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full py-2.5 rounded-xl border border-dashed border-neutral-700 hover:border-emerald-500 text-xs font-bold text-neutral-300 hover:text-emerald-400 flex items-center justify-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add New London Address</span>
          </button>
        ) : (
          <form onSubmit={handleAddAddress} className="border-t border-neutral-800 pt-4 space-y-3">
            <h4 className="text-xs font-bold text-neutral-200">New Address Details</h4>

            {validationError && (
              <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                required
                value={line1}
                onChange={(e) => setLine1(e.target.value)}
                placeholder="Street Line 1 *"
                className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
              <input
                type="text"
                required
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                placeholder="London Postcode (e.g. EC1A 1BB) *"
                className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono uppercase"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={line2}
                onChange={(e) => setLine2(e.target.value)}
                placeholder="Line 2 / Flat / Unit (Optional)"
                className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
              <select
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Home">Home</option>
                <option value="Office">Office / HQ</option>
                <option value="Store">Retail Branch</option>
                <option value="Warehouse">Warehouse Hub</option>
              </select>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="flex-1 py-2 rounded-xl bg-neutral-800 text-xs font-semibold text-neutral-300 hover:bg-neutral-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-xl bg-emerald-500 text-neutral-950 text-xs font-bold hover:bg-emerald-400 flex items-center justify-center gap-1.5"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Save Address
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
