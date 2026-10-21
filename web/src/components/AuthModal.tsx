'use client';

import React, { useState } from 'react';
import { UserRole } from '@/types/delivery';
import { User, ShieldCheck, Building2, Lock, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';

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

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    onLogin({
      email,
      role,
      name: name || (email.split('@')[0] || 'User'),
      companyName: role === 'client' ? companyName || 'London Business Ltd' : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
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
              <p className="text-sm text-neutral-400">{currentUser.email}</p>
              <span className="inline-block mt-2 text-xs font-semibold uppercase px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Role: {currentUser.role}
              </span>
              {currentUser.companyName && (
                <p className="text-xs text-neutral-400 mt-1">Company: {currentUser.companyName}</p>
              )}
            </div>
            <div className="pt-4 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2 rounded-xl bg-neutral-800 text-neutral-200 hover:bg-neutral-700 text-sm font-medium"
              >
                Close
              </button>
              <button
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="flex-1 py-2 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 text-sm font-medium"
              >
                Log Out
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-black text-white tracking-tight">
                {isSignUp ? 'Create Quickzy Account' : 'Welcome Back to Quickzy'}
              </h2>
              <p className="text-xs text-neutral-400 mt-1">
                Same-day London delivery across pharmacy, food & parcels
              </p>
            </div>

            {/* Role Selector Tabs */}
            <div className="grid grid-cols-3 gap-1 bg-neutral-950 p-1 rounded-xl mb-5 border border-neutral-800">
              <button
                type="button"
                onClick={() => setRole('customer')}
                className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition ${
                  role === 'customer'
                    ? 'bg-emerald-500 text-neutral-950'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                Customer
              </button>
              <button
                type="button"
                onClick={() => setRole('client')}
                className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition ${
                  role === 'client'
                    ? 'bg-emerald-500 text-neutral-950'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                Client
              </button>
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition ${
                  role === 'admin'
                    ? 'bg-emerald-500 text-neutral-950'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Admin
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div>
                  <label className="text-xs text-neutral-400 block mb-1 font-medium">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Eleanor Vance"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              {role === 'client' && (
                <div>
                  <label className="text-xs text-neutral-400 block mb-1 font-medium">
                    Registered Company Name
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Mayfair Boutique Pharma Ltd"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              <div>
                <label className="text-xs text-neutral-400 block mb-1 font-medium flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" /> Work or Personal Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@quickzy.co.uk"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-neutral-400 block mb-1 font-medium flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" /> Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-neutral-950 font-bold text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-500/20 mt-2"
              >
                <span>{isSignUp ? 'Create Account' : `Sign In as ${role.toUpperCase()}`}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-5 text-center">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-xs text-neutral-400 hover:text-emerald-400 transition"
              >
                {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Register now"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
