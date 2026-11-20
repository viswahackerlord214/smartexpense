'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Lock,
  Mail,
  Zap,
} from 'lucide-react';

export default function LoginPage() {
  const { user, signInWithGoogle, signInWithDemoUser, signOut, isSupabaseLive } = useAuth();
  const [customEmail, setCustomEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleCustomGmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim() || !customEmail.includes('@')) return;
    const name = customEmail.split('@')[0];
    const formattedName = name.charAt(0).toUpperCase() + name.slice(1);
    signInWithDemoUser(customEmail.trim(), formattedName);
    router.push('/');
  };

  return (
    <div className="max-w-md mx-auto py-8 px-4 space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-zinc-950 font-black text-2xl mx-auto shadow-lg shadow-emerald-500/20">
          ₹
        </div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">
          Personalize Your Finances
        </h1>
        <p className="text-xs text-zinc-400">
          Sign in with your Google Account to personalize your expenses, budgets, alerts, and iPhone bank SMS automation.
        </p>
      </div>

      {user ? (
        /* Currently Signed In Card */
        <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-xl space-y-4 text-center">
          <div className="relative inline-block">
            {user.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatar_url}
                alt={user.name}
                className="w-16 h-16 rounded-full mx-auto border-2 border-emerald-500/50 shadow-md"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xl flex items-center justify-center mx-auto">
                {user.name.charAt(0)}
              </div>
            )}
            <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-zinc-900" />
          </div>

          <div>
            <h3 className="text-base font-bold text-white">{user.name}</h3>
            <p className="text-xs text-emerald-400 font-mono mt-0.5">{user.email}</p>
            <p className="text-[11px] text-zinc-500 mt-1">Personalized Account Active</p>
          </div>

          <div className="space-y-2 pt-2">
            <Link
              href="/"
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center justify-center space-x-1.5 shadow-lg shadow-emerald-500/20 transition active:scale-95"
            >
              <span>Go to Your Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              onClick={() => signOut()}
              className="w-full py-2 rounded-xl border border-zinc-800 text-xs font-semibold text-zinc-400 hover:text-rose-400 hover:border-rose-900/50 transition"
            >
              Sign Out / Switch Account
            </button>
          </div>
        </div>
      ) : (
        /* Sign In Options Card */
        <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-xl space-y-5">
          {/* Official Google OAuth Sign In Button */}
          <button
            onClick={() => signInWithGoogle()}
            className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-zinc-100 text-zinc-900 font-semibold text-xs flex items-center justify-center space-x-3 shadow-md hover:shadow-lg transition-all active:scale-98"
          >
            {/* Google Multi-Color G Icon */}
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="flex items-center space-x-2 text-zinc-500 text-[11px]">
            <div className="flex-1 h-px bg-zinc-800" />
            <span>OR ENTER YOUR GMAIL</span>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>

          {/* Quick Gmail input */}
          <form onSubmit={handleCustomGmail} className="space-y-3">
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Your Gmail Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  placeholder="yourname@gmail.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs border border-zinc-700 flex items-center justify-center space-x-1.5 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Personalize with this Gmail</span>
            </button>
          </form>

          {/* Security note */}
          <div className="pt-2 border-t border-zinc-800/80 flex items-center space-x-2 text-[11px] text-zinc-500">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Your financial data is private and encrypted with Row Level Security.</span>
          </div>
        </div>
      )}

      {/* Feature Highlights */}
      <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 space-y-2 text-xs">
        <div className="font-semibold text-zinc-300 flex items-center space-x-1.5">
          <Zap className="w-3.5 h-3.5 text-emerald-400" />
          <span>Why personalize with Google?</span>
        </div>
        <ul className="space-y-1 text-zinc-400 pl-4 list-disc text-[11px]">
          <li>Personalized monthly budget caps & spending reports</li>
          <li>Unique iPhone Apple Shortcuts webhook token assigned to your Gmail</li>
          <li>Multi-device synchronization between your iPhone PWA and Mac desktop</li>
        </ul>
      </div>
    </div>
  );
}

