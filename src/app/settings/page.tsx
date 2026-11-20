'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  RefreshCw,
  Trash2,
  Lock,
  Send,
  Loader2,
  CheckCircle,
  HelpCircle,
  ChevronRight,
  Info,
} from 'lucide-react';
import Link from 'next/link';

interface ApiKeyData {
  id: string;
  name: string;
  key_hint: string;
  key_prefix?: string;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
}

export default function SettingsPage() {
  const { refreshData } = useExpense();
  const { user, signOut } = useAuth();

  // Web Push states
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscribeStatus, setSubscribeStatus] = useState<string | null>(null);
  const [isSendingTestPush, setIsSendingTestPush] = useState(false);
  const [testPushStatus, setTestPushStatus] = useState<string | null>(null);

  // Individual API Key states
  const [keys, setKeys] = useState<ApiKeyData[]>([]);
  const [isLoadingKeys, setIsLoadingKeys] = useState(true);
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);
  const [isRevokingKey, setIsRevokingKey] = useState(false);
  const [newlyGeneratedKey, setNewlyGeneratedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);

  // Test webhook state
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const appOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://smartexpense-iota.vercel.app';
  const importEndpoint = `${appOrigin}/api/transactions/import`;

  // Check Notification permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Fetch user's individual API key metadata
  const fetchApiKeys = useCallback(async () => {
    if (!user) {
      setKeys([]);
      setIsLoadingKeys(false);
      return;
    }

    setIsLoadingKeys(true);
    try {
      const res = await fetch('/api/keys');
      if (res.ok) {
        const data = await res.json();
        setKeys(data.keys || []);
      }
    } catch (err) {
      console.error('Failed to load user API keys:', err);
    } finally {
      setIsLoadingKeys(false);
    }
  }, [user]);

  useEffect(() => {
    fetchApiKeys();
  }, [fetchApiKeys]);

  const activeKey = keys.find((k) => k.is_active);

  // Copy helper
  const copy = (label: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Generate / Regenerate Key
  const handleGenerateKey = async () => {
    setIsGeneratingKey(true);
    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'iPhone Shortcuts Automation' }),
      });

      if (res.ok) {
        const data = await res.json();
        setNewlyGeneratedKey(data.key.rawKey);
        setShowRegenerateConfirm(false);
        await fetchApiKeys();
      } else {
        const err = await res.json();
        alert(`Failed to generate key: ${err.error || 'Server error'}`);
      }
    } catch (err: any) {
      alert(`Error generating key: ${err.message}`);
    } finally {
      setIsGeneratingKey(false);
    }
  };

  // Revoke Key
  const handleRevokeKey = async () => {
    if (!activeKey) return;
    setIsRevokingKey(true);
    try {
      const res = await fetch(`/api/keys?id=${activeKey.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setShowRevokeConfirm(false);
        setNewlyGeneratedKey(null);
        await fetchApiKeys();
      } else {
        alert('Failed to revoke API key');
      }
    } catch (err: any) {
      alert(`Error revoking key: ${err.message}`);
    } finally {
      setIsRevokingKey(false);
    }
  };

  // Test Webhook
  const handleTestWebhook = async () => {
    const keyToTest = newlyGeneratedKey;
    if (!keyToTest) {
      alert('Please generate an API key first or use a newly copied key to test.');
      return;
    }

    setIsTestingWebhook(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/transactions/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${keyToTest}`,
        },
        body: JSON.stringify({
          message: `Dear SBI User, your A/C ending 4589 credited by Rs 150.00 on ${new Date().toLocaleDateString('en-GB')} by UPI/Ref 987654321/Tea Stall. Avl Bal: Rs 15200.00`,
          sender: 'SBIINB',
          timestamp: new Date().toISOString(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: `Success! Sample ₹150 transaction recorded for ${user?.email}. Check your Transactions page.`,
        });
        await refreshData();
      } else {
        setTestResult({
          success: false,
          message: data.error || data.message || 'Webhook test failed.',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Network error testing webhook',
      });
    } finally {
      setIsTestingWebhook(false);
    }
  };

  // Web Push Subscription
  const handleSubscribePush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setSubscribeStatus('Push notifications are not supported on this browser.');
      return;
    }

    setIsSubscribing(true);
    setSubscribeStatus(null);

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);

      if (permission !== 'granted') {
        setSubscribeStatus('Notification permission was not granted in your browser settings.');
        setIsSubscribing(false);
        return;
      }

      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const vapidPublicKey =
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
        'BF9aeB9DP0LpQGgLZA8qKXn7MYlI9H0YxgnTv1Z5uxhVGdiVOzhp5I1RtEW5hIxUVHySySFSN0ITUvl49w86DLU';

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
        setSubscribeStatus('Successfully subscribed to iPhone Push Notifications for your account!');
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

  const handleSendTestPush = async () => {
    setIsSendingTestPush(true);
    setTestPushStatus(null);
    try {
      const res = await fetch('/api/notifications/test', {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestPushStatus(`Test push sent! Delivered to ${data.deliveredToCount || 1} device(s). Check your iPhone lock screen.`);
        await refreshData();
      } else {
        setTestPushStatus(data.message || data.error || 'Failed to send test push.');
      }
    } catch (err: any) {
      setTestPushStatus(`Error: ${err.message}`);
    } finally {
      setIsSendingTestPush(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Settings & Integrations</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Manage your personal account, individual iPhone Shortcuts API secret key, and push notifications.
        </p>
      </div>

      {/* 1. Account Profile Card */}
      <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Your Personal Account</h3>
              <p className="text-xs text-zinc-400">Authenticated via Supabase Auth with Row Level Security</p>
            </div>
          </div>

          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Active Session</span>
          </span>
        </div>

        {user ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80">
            <div className="flex items-center space-x-3">
              {user.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatar_url} alt="" className="w-11 h-11 rounded-full border border-emerald-500/40" />
              ) : (
                <div className="w-11 h-11 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-lg">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <div className="text-sm font-bold text-white">{user.name}</div>
                <div className="text-xs text-emerald-400 font-mono">{user.email}</div>
                <div className="text-[10px] text-zinc-500 font-mono mt-0.5">UUID: {user.id}</div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => signOut()}
                className="px-3 py-1.5 rounded-xl bg-rose-950/30 hover:bg-rose-900/40 border border-rose-800/40 text-xs text-rose-400 font-semibold transition"
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
            <span className="text-xs text-zinc-400">Please sign in to manage your account.</span>
            <Link href="/login" className="px-4 py-2 rounded-xl bg-emerald-500 text-zinc-950 text-xs font-bold">
              Sign In
            </Link>
          </div>
        )}
      </div>

      {/* 2. DEDICATED SECTION: Settings → Integrations → iPhone Shortcuts */}
      <div id="iphone-shortcuts" className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-white">iPhone Shortcuts Integration</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-semibold">
                  Personal API Key
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Your unique cryptographic API secret for automated bank SMS import. Never shared with any other user.
              </p>
            </div>
          </div>

          <div>
            {isLoadingKeys ? (
              <span className="text-xs text-zinc-500 flex items-center space-x-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Checking...</span>
              </span>
            ) : activeKey ? (
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Integration Active</span>
              </span>
            ) : (
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                No Active Key
              </span>
            )}
          </div>
        </div>

        {/* ONE-TIME GENERATED KEY MODAL BANNER */}
        {newlyGeneratedKey && (
          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 space-y-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>Your New Personal API Secret Key</span>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                Displaying Once
              </span>
            </div>

            <p className="text-xs text-emerald-200/90 leading-relaxed">
              Copy this API secret now. For your security, SpendWise hashes keys using SHA-256 and will <strong>never</strong> display the plaintext secret again.
            </p>

            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={newlyGeneratedKey}
                className="flex-1 px-3 py-2.5 bg-zinc-950 border border-emerald-500/40 rounded-xl text-xs font-mono text-emerald-300 select-all"
              />
              <button
                onClick={() => copy('new_key', newlyGeneratedKey)}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold flex items-center space-x-1.5 shadow-lg shadow-emerald-500/20 transition active:scale-95"
              >
                {copiedKey === 'new_key' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedKey === 'new_key' ? 'Copied!' : 'Copy Key'}</span>
              </button>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="text-[11px] text-zinc-400 flex items-center space-x-1">
                <Lock className="w-3 h-3 text-emerald-400" />
                <span>Stored securely in Supabase as SHA-256 hash</span>
              </div>
              <button
                onClick={() => setNewlyGeneratedKey(null)}
                className="text-xs text-zinc-400 hover:text-white underline"
              >
                I have copied my key
              </button>
            </div>
          </div>
        )}

        {/* ACTIVE KEY METADATA CARD */}
        {activeKey ? (
          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/90 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="text-xs font-semibold text-zinc-300">Active Secret Identifier</div>
                <div className="text-sm font-mono text-emerald-400 font-bold mt-0.5">{activeKey.key_hint}</div>
              </div>
              <div className="text-xs text-zinc-400 space-y-0.5">
                <div>Created: <span className="text-zinc-200">{new Date(activeKey.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>
                <div>Last used: <span className="text-zinc-200">{activeKey.last_used_at ? new Date(activeKey.last_used_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Never used yet'}</span></div>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowRegenerateConfirm(true)}
                  className="px-3 py-1.5 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-xs text-zinc-200 font-medium flex items-center space-x-1.5 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-purple-400" />
                  <span>Regenerate Key</span>
                </button>
                <button
                  onClick={() => setShowRevokeConfirm(true)}
                  className="px-3 py-1.5 rounded-xl border border-rose-900/40 hover:bg-rose-950/30 text-xs text-rose-400 font-medium flex items-center space-x-1.5 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Revoke Key</span>
                </button>
              </div>

              {newlyGeneratedKey && (
                <button
                  onClick={handleTestWebhook}
                  disabled={isTestingWebhook}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition disabled:opacity-50"
                >
                  {isTestingWebhook ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Test Key with Sample SMS</span>
                </button>
              )}
            </div>

            {testResult && (
              <div className={`p-3 rounded-xl text-xs flex items-start space-x-2 ${testResult.success ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'}`}>
                {testResult.success ? <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-zinc-950 border border-dashed border-zinc-800 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mx-auto">
              <Key className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Generate Your iPhone Shortcuts Secret Key</div>
              <p className="text-xs text-zinc-400 max-w-md mx-auto mt-1">
                To connect your iPhone Apple Shortcuts automation, generate a secure API key. All SMS transactions imported with this key will automatically belong exclusively to your account.
              </p>
            </div>
            <button
              onClick={handleGenerateKey}
              disabled={isGeneratingKey}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center space-x-2 mx-auto shadow-lg shadow-purple-500/20 transition active:scale-95 disabled:opacity-50"
            >
              {isGeneratingKey ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>Generate Personal API Key</span>
            </button>
          </div>
        )}

        {/* CONFIRMATION DIALOG: REGENERATE */}
        {showRegenerateConfirm && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
            <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold">
              <AlertCircle className="w-4 h-4" />
              <span>Regenerate API Key?</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Generating a new key will immediately revoke your current key (<code className="text-amber-400">{activeKey?.key_hint}</code>). Your existing Apple Shortcuts automation will stop importing transactions until you update the Authorization header on your iPhone.
            </p>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleGenerateKey}
                disabled={isGeneratingKey}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center space-x-1"
              >
                {isGeneratingKey && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Yes, Regenerate Key</span>
              </button>
              <button
                onClick={() => setShowRegenerateConfirm(false)}
                className="px-3 py-1.5 rounded-xl border border-zinc-800 text-xs text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* CONFIRMATION DIALOG: REVOKE */}
        {showRevokeConfirm && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-3">
            <div className="flex items-center space-x-2 text-rose-400 text-xs font-bold">
              <AlertCircle className="w-4 h-4" />
              <span>Revoke API Key?</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Are you sure you want to revoke this key? Apple Shortcuts using this key will immediately be rejected with <code>401 Unauthorized</code>.
            </p>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleRevokeKey}
                disabled={isRevokingKey}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center space-x-1"
              >
                {isRevokingKey && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Yes, Revoke Key Immediately</span>
              </button>
              <button
                onClick={() => setShowRevokeConfirm(false)}
                className="px-3 py-1.5 rounded-xl border border-zinc-800 text-xs text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* STEP-BY-STEP APPLE SHORTCUTS SETUP GUIDE */}
        <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Apple Shortcuts Automation Setup
              </h4>
            </div>
            <Link
              href="/shortcuts-guide"
              className="text-xs text-emerald-400 hover:underline flex items-center space-x-1"
            >
              <span>Full Visual Walkthrough</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed">
            Follow these exact actions inside the iOS <strong>Shortcuts</strong> application on your iPhone:
          </p>

          {/* Quick Copy Values */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
              <span className="text-[11px] text-zinc-400 font-semibold">1. Webhook Import URL:</span>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  readOnly
                  value={importEndpoint}
                  className="flex-1 px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-300"
                />
                <button
                  onClick={() => copy('url', importEndpoint)}
                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs border border-zinc-700"
                >
                  {copiedKey === 'url' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
              <span className="text-[11px] text-zinc-400 font-semibold">2. Authorization Header:</span>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  readOnly
                  value={newlyGeneratedKey ? `Bearer ${newlyGeneratedKey}` : `Bearer ${activeKey?.key_hint || 'YOUR_API_KEY'}`}
                  className="flex-1 px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-300"
                />
                <button
                  onClick={() => copy('hdr', newlyGeneratedKey ? `Bearer ${newlyGeneratedKey}` : `Bearer YOUR_API_KEY`)}
                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs border border-zinc-700"
                >
                  {copiedKey === 'hdr' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Step list */}
          <div className="space-y-2.5 text-xs text-zinc-300">
            <div className="flex items-start space-x-2">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
              <span>Open <strong>Shortcuts</strong> on iPhone → Tap <strong>Automation</strong> tab → Tap <strong>+</strong></span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
              <span>Select <strong>Message</strong> → Sender: Add your bank senders (e.g. <code>HDFCBK</code>, <code>SBIINB</code>, <code>ICICIB</code>, <code>AXISBK</code>, <code>KOTAKB</code>, <code>FEDBNK</code>)</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
              <span>Set <strong>Run Immediately</strong> (Turn off &quot;Ask Before Running&quot;)</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[11px]">4</span>
              <span>Add action: <strong>Get Contents of URL</strong> with:
                <ul className="list-disc pl-5 mt-1 space-y-0.5 text-zinc-400">
                  <li><strong>URL:</strong> <code>{importEndpoint}</code></li>
                  <li><strong>Method:</strong> <code>POST</code></li>
                  <li><strong>Headers:</strong> <code>Authorization</code> → <code>Bearer &lt;YOUR_API_KEY&gt;</code></li>
                  <li><strong>Request Body:</strong> <code>JSON</code> with fields:
                    <br />• <code>message</code> → Variable: <em>Shortcut Input</em>
                    <br />• <code>sender</code> → Variable: <em>Shortcut Input &gt; Sender</em>
                    <br />• <code>timestamp</code> → Variable: <em>Current Date</em>
                  </li>
                </ul>
              </span>
            </div>
          </div>
        </div>

        {/* Security Alert */}
        <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-400 flex items-start space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>
            <strong>Security Notice:</strong> Your API key grants automated write access to your personal SpendWise account. Never share your key or commit it to public repositories.
          </span>
        </div>
      </div>

      {/* 3. Push Notifications & PWA Onboarding */}
      <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Actionable Push Notifications</h3>
              <p className="text-xs text-zinc-400">Receive instant 1-tap categorization alerts upon bank SMS arrival</p>
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
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSubscribePush}
              disabled={isSubscribing}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition active:scale-95 disabled:opacity-50"
            >
              {isSubscribing ? 'Registering Push...' : 'Enable / Re-subscribe Push Notifications'}
            </button>

            <button
              onClick={handleSendTestPush}
              disabled={isSendingTestPush}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs border border-zinc-700 transition active:scale-95 disabled:opacity-50 flex items-center space-x-1.5"
            >
              {isSendingTestPush ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bell className="w-3.5 h-3.5 text-emerald-400" />}
              <span>Send Test Push to iPhone</span>
            </button>
          </div>

          {(subscribeStatus || testPushStatus) && (
            <span className="text-xs text-emerald-400 font-medium">
              {testPushStatus || subscribeStatus}
            </span>
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
    </div>
  );
}
