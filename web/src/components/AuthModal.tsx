'use client';

import React, { useState } from 'react';
import { AddressItem, UserRole } from '@/types/delivery';
import { auth, db } from '@/lib/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import {
  User,
  Building2,
  Lock,
  Mail,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MapPin,
  ExternalLink,
  Bike,
  Package,
  Pill,
  Utensils,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: { email: string; role: UserRole; name: string; companyName?: string; deliveryStream?: string } | null;
  onLogin: (user: { email: string; role: UserRole; name: string; companyName?: string; deliveryStream?: string }) => void;
  onLogout: () => void;
  savedAddresses?: AddressItem[];
  onOpenAddressBook?: () => void;
}

const DELIVERY_STREAMS = [
  { id: 'pharmacy', label: 'Pharmacy & Medical', icon: <Pill className="w-4 h-4" />, color: 'emerald' },
  { id: 'food', label: 'Food & Groceries', icon: <Utensils className="w-4 h-4" />, color: 'orange' },
  { id: 'parcel', label: 'Parcels & B2B Freight', icon: <Package className="w-4 h-4" />, color: 'cyan' },
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogin,
  onLogout,
  savedAddresses = [],
  onOpenAddressBook,
}) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [role, setRole] = useState<UserRole>('customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [deliveryStream, setDeliveryStream] = useState<string>('parcel');
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    // Business signup must choose a stream
    if (isSignUp && role === 'client' && !deliveryStream) {
      setAuthError('Please select your primary delivery stream.');
      return;
    }

    setLoading(true);
    setAuthError('');

    try {
      const cleanEmail = email.trim().toLowerCase();
      const determinedRole: UserRole = cleanEmail === 'prajapatikaranc@gmail.com' ? 'admin' : role;
      const userName = name.trim() || cleanEmail.split('@')[0];

      if (isSignUp) {
        const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        await updateProfile(cred.user, { displayName: userName });

        const userData: Record<string, any> = {
          uid: cred.user.uid,
          email: cleanEmail,
          name: userName,
          role: determinedRole,
          createdAt: new Date().toISOString(),
        };

        if (determinedRole === 'client') {
          userData.companyName = companyName.trim();
          userData.deliveryStream = deliveryStream;
        }

        await setDoc(doc(db, 'users', cred.user.uid), userData);

        onLogin({
          email: cleanEmail,
          role: determinedRole,
          name: userName,
          companyName: determinedRole === 'client' ? companyName.trim() : undefined,
          deliveryStream: determinedRole === 'client' ? deliveryStream : undefined,
        });
      } else {
        const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
        const displayName = cred.user.displayName || userName;

        onLogin({
          email: cleanEmail,
          role: determinedRole,
          name: displayName,
          companyName: determinedRole === 'client' ? companyName.trim() : undefined,
        });
      }

      onClose();
    } catch (err: any) {
      console.error('Firebase Auth error:', err);
      let msg = err.message || 'Authentication failed. Please verify credentials.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        msg = 'Invalid email or password.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'An account with this email already exists. Please sign in instead.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password should be at least 6 characters.';
      }
      setAuthError(msg);
    } finally {
      setLoading(false);
    }
  };

  const modalBg: React.CSSProperties = {
    background: 'var(--surface, #18181b)',
    borderColor: 'var(--card-border)',
    color: 'var(--foreground)',
  };

  const inputStyle: React.CSSProperties = {
    background: 'var(--surface-2, #0f0f0f)',
    borderColor: 'var(--input-border, rgba(255,255,255,0.12))',
    color: 'var(--foreground)',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in">
      <div
        className="border rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl relative"
        style={modalBg}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white text-lg font-mono transition"
        >
          ✕
        </button>

        {/* ── Profile View (logged in) ── */}
        {currentUser ? (
          <div className="py-2 space-y-5">
            {/* User header */}
            <div className="flex items-center gap-3 pb-3 border-b" style={{ borderColor: 'var(--card-border)' }}>
              <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center text-xl font-bold">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-bold">{currentUser.name}</h3>
                <p className="text-xs text-neutral-400 font-mono">{currentUser.email}</p>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    {currentUser.role}
                  </span>
                  {currentUser.companyName && (
                    <span className="text-[10px] text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-full bg-cyan-500/10">
                      {currentUser.companyName}
                    </span>
                  )}
                  {currentUser.deliveryStream && (
                    <span className="text-[10px] text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full bg-amber-500/10 capitalize">
                      {currentUser.deliveryStream} stream
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Saved Addresses */}
            <div className="text-left space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  Saved London Addresses ({savedAddresses.length})
                </span>
                {onOpenAddressBook && (
                  <button
                    onClick={() => { onClose(); onOpenAddressBook(); }}
                    className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition"
                  >
                    <span>Manage</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>

              {savedAddresses.length > 0 ? (
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                  {savedAddresses.map((addr) => (
                    <div
                      key={addr.id}
                      className="p-2.5 rounded-xl border text-xs flex items-center justify-between"
                      style={{ background: 'var(--surface-2, #0f0f0f)', borderColor: 'var(--card-border)' }}
                    >
                      <div>
                        <p className="font-bold text-neutral-200">{addr.label || 'Saved Location'}</p>
                        <p className="text-neutral-400 text-[11px]">{addr.line1}, {addr.postcode}</p>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        {addr.postcode}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className="p-3 rounded-xl border text-center text-xs text-neutral-400"
                  style={{ background: 'var(--surface-2, #0f0f0f)', borderColor: 'var(--card-border)' }}
                >
                  <p>No saved addresses yet.</p>
                  {onOpenAddressBook && (
                    <button
                      onClick={() => { onClose(); onOpenAddressBook(); }}
                      className="mt-1 text-emerald-400 font-bold hover:underline"
                    >
                      + Add your first London address
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-2 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-neutral-800 text-neutral-200 hover:bg-neutral-700 text-xs font-bold cursor-pointer transition"
              >
                Close
              </button>
              <button
                onClick={() => { onLogout(); onClose(); }}
                className="flex-1 py-2.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 text-xs font-bold cursor-pointer transition"
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          /* ── Auth Form (not logged in) ── */
          <div>
            <div className="mb-6">
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Secure Account Access
              </span>
              <h2 className="text-2xl font-black tracking-tight mt-2">
                {isSignUp ? 'Create Quickzy Account' : 'Sign in to Quickzy'}
              </h2>
              <p className="text-xs text-neutral-400 mt-1">
                Fast same-day London delivery &amp; dispatch platform
              </p>
            </div>

            {authError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {/* Role Selector (signup only) */}
            {isSignUp && (
              <div
                className="grid grid-cols-3 gap-1 p-1.5 rounded-2xl mb-5 border"
                style={{ background: 'var(--surface-2, #0f0f0f)', borderColor: 'var(--card-border)' }}
              >
                {[
                  { r: 'customer' as UserRole, label: 'Customer', icon: <User className="w-3 h-3" />, activeColor: 'bg-emerald-500' },
                  { r: 'client' as UserRole, label: 'Business', icon: <Building2 className="w-3 h-3" />, activeColor: 'bg-cyan-500' },
                  { r: 'driver' as UserRole, label: 'Driver', icon: <Bike className="w-3 h-3" />, activeColor: 'bg-amber-500' },
                ].map(({ r, label, icon, activeColor }) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`py-2 text-[11px] font-bold rounded-xl flex items-center justify-center gap-1 transition ${
                      role === r ? `${activeColor} text-neutral-950 shadow-sm` : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {icon}
                    {label}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Full name (signup) */}
              {isSignUp && (
                <div>
                  <label className="text-xs text-neutral-400 block mb-1 font-semibold">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full border rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-emerald-500"
                    style={inputStyle}
                  />
                </div>
              )}

              {/* Company name (business signup) */}
              {isSignUp && role === 'client' && (
                <div>
                  <label className="text-xs text-neutral-400 block mb-1 font-semibold">Registered Company Name</label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Mayfair Medical Group Ltd"
                    className="w-full border rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-cyan-500"
                    style={inputStyle}
                  />
                </div>
              )}

              {/* Delivery stream (business signup) — business must choose, only admin can change later */}
              {isSignUp && role === 'client' && (
                <div>
                  <label className="text-xs text-neutral-400 block mb-2 font-semibold">
                    Primary Delivery Stream
                    <span className="ml-1 text-amber-400 font-normal">(locked to your profile — contact admin to change)</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {DELIVERY_STREAMS.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setDeliveryStream(s.id)}
                        className={`p-2.5 rounded-xl border text-center text-[11px] font-bold flex flex-col items-center gap-1.5 transition ${
                          deliveryStream === s.id
                            ? s.color === 'orange'
                              ? 'bg-orange-500/15 border-orange-500 text-orange-300'
                              : s.color === 'cyan'
                                ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300'
                                : 'bg-emerald-500/15 border-emerald-500 text-emerald-300'
                            : 'bg-neutral-900/50 border-neutral-800 text-neutral-400 hover:text-white'
                        }`}
                        style={deliveryStream !== s.id ? { borderColor: 'var(--card-border)' } : {}}
                      >
                        {s.icon}
                        <span className="text-[10px] leading-tight">{s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Email */}
              <div>
                <label className="text-xs text-neutral-400 block mb-1 font-semibold flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@quickzy.co.uk"
                  className="w-full border rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-emerald-500 font-mono"
                  style={inputStyle}
                />
              </div>

              {/* Password */}
              <div>
                <label className="text-xs text-neutral-400 block mb-1 font-semibold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" /> Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full border rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-emerald-500 font-mono"
                  style={inputStyle}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-neutral-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition cursor-pointer disabled:opacity-50 mt-1"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>{isSignUp ? 'Create Quickzy Account' : 'Sign In to Quickzy'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 text-center">
              <button
                type="button"
                onClick={() => { setIsSignUp(!isSignUp); setAuthError(''); }}
                className="text-xs text-neutral-400 hover:text-emerald-400 transition"
              >
                {isSignUp ? 'Already have an account? Sign in here' : "Don't have an account? Register with email"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
