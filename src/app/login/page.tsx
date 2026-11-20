'use client';

import React, { useState, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Lock,
  Mail,
  User as UserIcon,
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
} from 'lucide-react';

function LoginForm() {
  const { user, signInWithEmail, signUp, resetPassword, signInWithGoogle, signOut } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get('redirectTo') || '/';

  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Please fill in both email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await signInWithEmail(email, password);
      if (result.success) {
        router.push(redirectTo);
        router.refresh();
      } else {
        setErrorMessage(result.error || 'Failed to sign in. Please verify your credentials.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!fullName.trim() || !email.trim() || !password) {
      setErrorMessage('All fields are required.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await signUp(email, password, fullName);
      if (result.success) {
        if (result.sessionCreated) {
          router.push(redirectTo);
          router.refresh();
        } else {
          setSuccessMessage(
            'Account created successfully! If email verification is enabled on your project, please check your inbox to confirm your address before logging in.'
          );
          setMode('signin');
        }
      } else {
        setErrorMessage(result.error || 'Sign up failed. Please try a different email.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setErrorMessage('Please enter your registered email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await resetPassword(email);
      if (result.success) {
        setSuccessMessage('Password reset link sent! Please check your email inbox.');
      } else {
        setErrorMessage(result.error || 'Unable to send reset email.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Request failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-10 px-4 space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-zinc-950 font-black text-2xl mx-auto shadow-lg shadow-emerald-500/20">
          ₹
        </div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">
          SpendWise Multi-User
        </h1>
        <p className="text-xs text-zinc-400">
          Smart Personal Finance & Automated Bank SMS Expense Engine
        </p>
      </div>

      {user ? (
        /* Currently Signed In View */
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
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-zinc-900" />
          </div>

          <div>
            <h3 className="text-base font-bold text-white">{user.name}</h3>
            <p className="text-xs text-emerald-400 font-mono mt-0.5">{user.email}</p>
            <p className="text-[11px] text-zinc-500 mt-1 font-mono">User ID: {user.id.slice(0, 8)}...</p>
          </div>

          <div className="space-y-2 pt-2">
            <Link
              href="/"
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center justify-center space-x-1.5 shadow-lg shadow-emerald-500/20 transition active:scale-95"
            >
              <span>Go to Your Personal Dashboard</span>
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
        /* Auth Card */
        <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-xl space-y-5">
          {/* Tabs: Sign In / Create Account */}
          <div className="flex rounded-xl bg-zinc-950 p-1 border border-zinc-800 text-xs">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-1.5 rounded-lg font-semibold transition ${
                mode === 'signin'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-1.5 rounded-lg font-semibold transition ${
                mode === 'signup'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Feedback Messages */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* MODE: SIGN IN */}
          {mode === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-3.5">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-zinc-400">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('reset');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="text-[11px] text-emerald-400 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 font-bold text-xs flex items-center justify-center space-x-1.5 shadow-lg shadow-emerald-500/20 transition active:scale-98"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Sign In to Account</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* MODE: CREATE ACCOUNT */}
          {mode === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-3.5">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Full Name</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Viswa Ravindren"
                    className="w-full pl-9 pr-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-9 pr-10 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Confirm Password</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full pl-9 pr-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 font-bold text-xs flex items-center justify-center space-x-1.5 shadow-lg shadow-emerald-500/20 transition active:scale-98"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Create Your Independent Account</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* MODE: FORGOT PASSWORD */}
          {mode === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-3.5">
              <p className="text-xs text-zinc-400">
                Enter your registered email address and we will send you a secure password reset link.
              </p>
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 font-bold text-xs flex items-center justify-center space-x-1.5 transition active:scale-98"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Send Reset Link</span>}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="px-3 py-2.5 rounded-xl border border-zinc-800 text-xs text-zinc-400 hover:text-white transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Social Auth Divider */}
          <div className="flex items-center space-x-2 text-zinc-600 text-[11px] pt-1">
            <div className="flex-1 h-px bg-zinc-800" />
            <span>OR CONTINUE WITH</span>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>

          {/* Google OAuth Button */}
          <button
            type="button"
            onClick={() => signInWithGoogle()}
            className="w-full py-2.5 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-800/80 border border-zinc-800 text-white font-medium text-xs flex items-center justify-center space-x-2.5 transition active:scale-98"
          >
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
            <span>Sign In with Google</span>
          </button>

          {/* Privacy & Isolation Notice */}
          <div className="pt-2 border-t border-zinc-800/80 flex items-center space-x-2 text-[11px] text-zinc-500">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Multi-tenant Row Level Security guarantees complete user data isolation.</span>
          </div>
        </div>
      )}

      {/* Feature Badges */}
      <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 space-y-2 text-xs">
        <div className="font-semibold text-zinc-300 flex items-center space-x-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Security & Data Isolation Highlights</span>
        </div>
        <ul className="space-y-1 text-zinc-400 pl-4 list-disc text-[11px]">
          <li>Unique cryptographic API secret key generated for your iPhone Shortcuts</li>
          <li>Supabase Row Level Security ensures User A never sees User B&apos;s expenses</li>
          <li>Encrypted cookie sessions with instant multi-device sync</li>
        </ul>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto py-20 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mx-auto" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
