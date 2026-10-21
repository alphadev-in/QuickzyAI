'use client';

import React, { useState } from 'react';
import { UserRole } from '@/types/delivery';
import { auth, db } from '@/lib/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { User, ShieldCheck, Building2, Lock, Mail, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: { email: string; role: UserRole; name: string; companyName?: string } | null;
  onLogin: (user: { email: string; role: UserRole; name: string; companyName?: string }) => void;
  onLogout: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogin,
  onLogout,
}) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [role, setRole] = useState<UserRole>('customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setAuthError('');

    try {
      const cleanEmail = email.trim().toLowerCase();
      // Auto-assign admin role if logging in as prajapatikaranc@gmail.com
      const determinedRole: UserRole = cleanEmail === 'prajapatikaranc@gmail.com' ? 'admin' : role;
      const userName = name.trim() || cleanEmail.split('@')[0];

      if (isSignUp) {
        // Create user in Firebase Authentication
        const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        await updateProfile(cred.user, { displayName: userName });

        // Store user profile in Firestore
        await setDoc(doc(db, 'users', cred.user.uid), {
          uid: cred.user.uid,
          email: cleanEmail,
          name: userName,
          role: determinedRole,
          companyName: determinedRole === 'client' ? companyName.trim() : null,
          createdAt: new Date().toISOString(),
        });

        onLogin({
          email: cleanEmail,
          role: determinedRole,
          name: userName,
          companyName: determinedRole === 'client' ? companyName.trim() : undefined,
        });
      } else {
        // Sign in with Firebase Authentication
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white text-lg font-mono"
        >
          ✕
        </button>

        {currentUser ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{currentUser.name}</h3>
              <p className="text-xs text-neutral-400 font-mono mt-0.5">{currentUser.email}</p>
              <span className="inline-block mt-2.5 text-[11px] font-extrabold uppercase px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Active Role: {currentUser.role}
              </span>
              {currentUser.companyName && (
                <p className="text-xs text-neutral-400 mt-2">Company: {currentUser.companyName}</p>
              )}
            </div>
            <div className="pt-4 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-neutral-800 text-neutral-200 hover:bg-neutral-700 text-xs font-bold"
              >
                Close
              </button>
              <button
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 text-xs font-bold"
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Firebase Cloud Auth
              </span>
              <h2 className="text-2xl font-black text-white tracking-tight mt-2">
                {isSignUp ? 'Create Quickzy Account' : 'Sign in to Quickzy'}
              </h2>
              <p className="text-xs text-neutral-400 mt-1">
                Managed by <strong>Aelius Venture Limited</strong>
              </p>
            </div>

            {authError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {/* Role Selector Tabs (During Sign Up) */}
            {isSignUp && (
              <div className="grid grid-cols-2 gap-1 bg-neutral-950 p-1.5 rounded-2xl mb-5 border border-neutral-800">
                <button
                  type="button"
                  onClick={() => setRole('customer')}
                  className={`py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition ${
                    role === 'customer'
                      ? 'bg-emerald-500 text-neutral-950 shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  Customer
                </button>
                <button
                  type="button"
                  onClick={() => setRole('client')}
                  className={`py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition ${
                    role === 'client'
                      ? 'bg-cyan-500 text-neutral-950 shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  Business Client
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {isSignUp && (
                <div>
                  <label className="text-xs text-neutral-400 block mb-1 font-semibold">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              {isSignUp && role === 'client' && (
                <div>
                  <label className="text-xs text-neutral-400 block mb-1 font-semibold">Registered Company Name</label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Mayfair Medical Group Ltd"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              )}

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
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

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
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
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
                    <span>{isSignUp ? 'Create Firebase Account' : 'Sign In with Firebase'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setAuthError('');
                }}
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
