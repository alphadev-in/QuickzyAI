'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { User, Building2, Mail, Lock, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { UserRole } from '@/types/delivery';
import { Footer } from '@/components/Footer';

export default function SignupPage() {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>('customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [registered, setRegistered] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setErrorMsg('');

    try {
      const cleanEmail = email.trim().toLowerCase();
      const determinedRole: UserRole = cleanEmail === 'prajapatikaranc@gmail.com' ? 'admin' : role;
      const userName = name.trim() || cleanEmail.split('@')[0];

      // Create in Firebase Authentication
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      await updateProfile(cred.user, { displayName: userName });

      // Save user profile in Firestore
      await setDoc(doc(db, 'users', cred.user.uid), {
        uid: cred.user.uid,
        email: cleanEmail,
        name: userName,
        role: determinedRole,
        companyName: determinedRole === 'client' ? companyName.trim() : null,
        createdAt: new Date().toISOString(),
      });

      // Save session cache for web client
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'quickzy_user_session',
          JSON.stringify({
            uid: cred.user.uid,
            email: cleanEmail,
            role: determinedRole,
            name: userName,
            companyName: determinedRole === 'client' ? companyName.trim() : undefined,
          })
        );
      }

      setRegistered(true);
      setTimeout(() => {
        router.push('/onboarding');
      }, 1200);
    } catch (err: any) {
      console.error('Signup error:', err);
      let msg = err.message || 'Failed to create Firebase account';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'An account already exists with this email address.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password should be at least 6 characters.';
      }
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-neutral-950">
      <header className="border-b border-neutral-900 bg-neutral-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-bold text-neutral-300 hover:text-emerald-400 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
              Q
            </div>
            <span className="font-bold text-sm text-white">Quickzy</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-neutral-900/90 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl glass-panel relative">
          {registered ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-black text-white">Account Created!</h2>
              <p className="text-xs text-neutral-400">Taking you through rapid onboarding...</p>
            </div>
          ) : (
            <div>
              <div className="mb-6">
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Firebase Cloud Authentication
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-2">
                  Create Quickzy Account
                </h1>
                <p className="text-xs text-neutral-400 mt-1">
                  Access point-to-point same-day London delivery
                </p>
              </div>

              {errorMsg && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Role Selector Tabs */}
              <div className="grid grid-cols-2 gap-1.5 bg-neutral-950 p-1.5 rounded-2xl mb-5 border border-neutral-800/80">
                <button
                  type="button"
                  onClick={() => setRole('customer')}
                  className={`py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition ${
                    role === 'customer'
                      ? 'bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/20'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  Individual Customer
                </button>
                <button
                  type="button"
                  onClick={() => setRole('client')}
                  className={`py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition ${
                    role === 'client'
                      ? 'bg-cyan-500 text-neutral-950 shadow-md shadow-cyan-500/20'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  Business Client
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs text-neutral-400 block mb-1 font-semibold">Your Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Karan Prajapati"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>

                {role === 'client' && (
                  <div>
                    <label className="text-xs text-neutral-400 block mb-1 font-semibold">Registered Company Name</label>
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Mayfair Boutique Pharma Ltd"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 transition"
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
                    placeholder="you@company.co.uk"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs text-neutral-400 block mb-1 font-semibold flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" /> Password (min 6 characters)
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition font-mono"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-neutral-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>Create Firebase Account & Continue</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              <div className="mt-5 text-center text-xs text-neutral-400">
                <span>By signing up, you agree to our </span>
                <Link href="/terms" className="text-emerald-400 hover:underline">
                  Terms
                </Link>
                <span> and </span>
                <Link href="/privacy" className="text-emerald-400 hover:underline">
                  Privacy Policy
                </Link>
                .
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
