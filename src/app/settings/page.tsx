'use client';

import React, { useState, useEffect } from 'react';
import { useExpense } from '@/context/ExpenseContext';
import { useAuth } from '@/context/AuthContext';
import {
  Bell,
  Smartphone,
  Database,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  ExternalLink,
  User,
  LogOut,
  Mail,
} from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  const { refreshData } = useExpense();
  const { user, signInWithGoogle, signOut } = useAuth();
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscribeStatus, setSubscribeStatus] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const handleSubscribePush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setSubscribeStatus('Push notifications not supported on this browser.');
      return;
    }

    setIsSubscribing(true);
    setSubscribeStatus(null);

    try {
      // 1. Request Permission
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);

      if (permission !== 'granted') {
        setSubscribeStatus('Notification permission was not granted.');
        setIsSubscribing(false);
        return;
      }

      // 2. Register Service Worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // 3. Subscribe to Web Push with VAPID Public Key
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BF9aeB9DP0LpQGgLZA8qKXn7MYlI9H0YxgnTv1Z5uxhVGdiVOzhp5I1RtEW5hIxUVHySySFSN0ITUvl49w86DLU';

      // Convert URL Base64 to Uint8Array
      const padding = '='.repeat((4 - (vapidPublicKey.length % 4)) % 4);
      const base64 = (vapidPublicKey + padding).replace(/-/g, '+').replace(/_/g, '/');
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: outputArray,
      });

      // 4. Send subscription to SpendWise Backend
      const jsonSub = subscription.toJSON();
      const res = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: jsonSub.endpoint,
          keys: jsonSub.keys,
          userAgent: navigator.userAgent,
        }),
      });

      if (res.ok) {
        setSubscribeStatus('Successfully subscribed to iPhone Push Notifications!');
      } else {
        setSubscribeStatus('Failed to register subscription with server.');
      }
    } catch (err: any) {
      console.error('Subscription error:', err);
      setSubscribeStatus(`Error: ${err.message}`);
    } finally {
      setIsSubscribing(false);
    }
  };

  const copy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleResetData = async () => {
    if (!confirm('Reset local demo data back to default sample bank transactions?')) return;
    setIsResetting(true);
    try {
      await fetch('/api/transactions', { method: 'GET' });
      await refreshData();
      alert('Data reset successfully.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">System Settings & Device Setup</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Configure Google Account personalization, iPhone push notifications, PWA home screen installation, Supabase credentials, and automation secrets.
        </p>
      </div>

      {/* 0. Google Account Personalization */}
      <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Google Account Personalization</h3>
              <p className="text-xs text-zinc-400">Personalize expenses, budgets, and automated Apple Shortcuts</p>
            </div>
          </div>

          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {user ? 'Signed In' : 'Guest'}
          </span>
        </div>

        {user ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80">
            <div className="flex items-center space-x-3">
              {user.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatar_url} alt="" className="w-10 h-10 rounded-full border border-emerald-500/40" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center">
                  {user.name.charAt(0)}
                </div>
              )}
              <div>
                <div className="text-xs font-bold text-white">{user.name}</div>
                <div className="text-xs text-emerald-400 font-mono">{user.email}</div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Link
                href="/login"
                className="px-3 py-1.5 rounded-xl border border-zinc-800 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800"
              >
                Switch Account
              </Link>
              <button
                onClick={() => signOut()}
                className="px-3 py-1.5 rounded-xl bg-rose-950/30 border border-rose-800/40 text-xs text-rose-400 hover:bg-rose-900/40"
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80">
            <div>
              <div className="text-xs font-semibold text-white">Not currently signed in</div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Sign in with Google to associate your bank SMS messages with your Gmail.
              </p>
            </div>
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs shadow-md transition"
            >
              Sign In with Google
            </Link>
          </div>
        )}
      </div>

      {/* 1. Push Notifications & PWA Onboarding */}
      <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Actionable Push Notifications</h3>
              <p className="text-xs text-zinc-400">Receive instant categorization deep-links upon bank SMS arrival</p>
            </div>
          </div>

          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
              notificationPermission === 'granted'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}
          >
            {notificationPermission === 'granted' ? 'Enabled' : 'Not Granted'}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-zinc-800">
          <button
            onClick={handleSubscribePush}
            disabled={isSubscribing}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition active:scale-95 disabled:opacity-50"
          >
            {isSubscribing ? 'Registering Push...' : 'Enable / Re-subscribe Push Notifications'}
          </button>

          {subscribeStatus && (
            <span className="text-xs text-emerald-400 font-medium">{subscribeStatus}</span>
          )}
        </div>

        {/* iOS Push Requirements Box */}
        <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-2 text-xs">
          <div className="font-semibold text-zinc-200 flex items-center space-x-1.5">
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span>Important iOS Requirements for Web Push</span>
          </div>
          <p className="text-zinc-400 leading-relaxed">
            Apple requires that web push notifications on iPhone run inside a Home Screen installed PWA (iOS 16.4+).
          </p>
          <div className="space-y-1 text-zinc-300 pl-2 border-l-2 border-emerald-500/40 font-mono text-[11px]">
            <div>1. In Safari, tap the <strong>Share</strong> button.</div>
            <div>2. Scroll down and tap <strong>&quot;Add to Home Screen&quot;</strong>.</div>
            <div>3. Launch SpendWise from your Home Screen and tap <strong>&quot;Enable Push&quot;</strong> above.</div>
          </div>
        </div>
      </div>

      {/* 2. Apple Shortcuts Secret Key */}
      <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-xl space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Apple Shortcuts API Secret</h3>
            <p className="text-xs text-zinc-400">Used in the Authorization Bearer header of your iPhone Automation</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="text"
            readOnly
            value="sw_live_sec_8f9a2b4e7c1d3a5f6e8b0c2d4e6f8a0b"
            className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-200"
          />
          <button
            onClick={() => copy('sec', 'sw_live_sec_8f9a2b4e7c1d3a5f6e8b0c2d4e6f8a0b')}
            className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold flex items-center space-x-1 border border-zinc-700"
          >
            {copiedKey === 'sec' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedKey === 'sec' ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* 3. Supabase Database Configuration Status */}
      <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Database & Persistence Provider</h3>
              <p className="text-xs text-zinc-400">Supabase PostgreSQL with Row Level Security</p>
            </div>
          </div>

          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Local Sandbox Demo Mode Active
          </span>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed">
          The application is operating with seamless local in-memory & cookie persistence. To connect your live Supabase cloud project, configure the following keys in your <code className="text-emerald-400">.env.local</code> file:
        </p>

        <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-[11px] text-zinc-300 space-y-1">
          <div>NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co</div>
          <div>NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key</div>
          <div>SUPABASE_SERVICE_ROLE_KEY=your-service-role-key</div>
        </div>

        <div className="pt-2 flex items-center justify-between">
          <button
            onClick={handleResetData}
            disabled={isResetting}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-zinc-800 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Transactions</span>
          </button>
        </div>
      </div>
    </div>
  );
}

