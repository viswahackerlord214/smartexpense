'use client';

import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Copy,
  Check,
  ArrowRight,
  ShieldCheck,
  Zap,
  Send,
  AlertCircle,
  ExternalLink,
  Layers,
  Key,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function ShortcutsGuidePage() {
  const { user } = useAuth();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeKeyHint, setActiveKeyHint] = useState<string | null>(null);

  const sampleUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/transactions/import`
      : 'https://smartexpense-iota.vercel.app/api/transactions/import';

  useEffect(() => {
    if (user) {
      fetch('/api/keys')
        .then((r) => r.json())
        .then((d) => {
          const active = (d.keys || []).find((k: any) => k.is_active);
          if (active) setActiveKeyHint(active.key_hint);
        })
        .catch(() => {});
    }
  }, [user]);

  const copy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      {/* Hero Header */}
      <div>
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold mb-2">
          <Zap className="w-3.5 h-3.5" />
          <span>iOS Apple Shortcuts Native Bridge</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          iPhone Bank SMS Automation Setup Guide
        </h1>
        <p className="text-sm text-zinc-400 mt-1.5 leading-relaxed">
          iOS restricts web applications from silently reading SMS messages. By using Apple&apos;s native{' '}
          <strong className="text-zinc-200">Shortcuts Message Automation</strong>, eligible bank transaction
          messages are securely forwarded to SpendWise in real-time using your personal API secret key.
        </p>
      </div>

      {/* Integration Parameters Card */}
      <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Your Personal Webhook Parameters</span>
        </h3>

        <div className="space-y-3">
          {/* Endpoint URL */}
          <div>
            <label className="text-xs font-semibold text-zinc-400 block mb-1">
              POST Webhook URL
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={sampleUrl}
                className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-200"
              />
              <button
                onClick={() => copy('url', sampleUrl)}
                className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium flex items-center space-x-1 border border-zinc-700"
              >
                {copiedKey === 'url' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'url' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* API Secret Key notice */}
          <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-zinc-300 flex items-center space-x-1.5">
                <Key className="w-3.5 h-3.5 text-purple-400" />
                <span>Your Individual API Secret Key</span>
              </span>
              <Link
                href="/settings#iphone-shortcuts"
                className="text-emerald-400 hover:underline flex items-center space-x-1 font-semibold"
              >
                <span>Manage in Settings</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              Every user has a unique API secret key. Never use a common shared key. If you haven&apos;t generated your personal key yet, visit{' '}
              <Link href="/settings" className="text-emerald-400 underline">
                Settings → iPhone Shortcuts
              </Link>{' '}
              to generate one.
            </p>
            {activeKeyHint && (
              <div className="text-[11px] text-zinc-400 font-mono">
                Active Key on this account: <span className="text-emerald-400">{activeKeyHint}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Step by step instructions */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-white flex items-center space-x-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          <span>Step-by-Step iOS Shortcuts Walkthrough</span>
        </h3>

        <div className="space-y-3">
          <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-2">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs">
                1
              </span>
              <h4 className="text-xs font-bold text-white">Create a Personal Automation</h4>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed pl-8">
              Open the <strong>Shortcuts</strong> app on your iPhone. Tap the <strong>Automation</strong> tab at the bottom, then tap the <strong>+</strong> button in the top right corner.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-2">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs">
                2
              </span>
              <h4 className="text-xs font-bold text-white">Select Message Trigger & Bank Senders</h4>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed pl-8">
              Scroll down and tap <strong>Message</strong>. In the <strong>Sender</strong> field, add your bank sender IDs:
              <br />
              <code className="text-emerald-400 font-mono text-[11px] block mt-1.5 p-2 bg-zinc-950 rounded-lg">
                HDFCBK, SBIINB, ICICIB, AXISBK, KOTAKB, FEDBNK
              </code>
              Select <strong>Run Immediately</strong> and turn off <strong>Ask Before Running</strong> for hands-free background automation.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-2">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs">
                3
              </span>
              <h4 className="text-xs font-bold text-white">Configure the Webhook POST Action</h4>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed pl-8">
              Add the action <strong>Get Contents of URL</strong>:
              <br />• <strong>URL:</strong> <code>{sampleUrl}</code>
              <br />• <strong>Method:</strong> <code>POST</code>
              <br />• <strong>Headers:</strong>
              <br />&nbsp;&nbsp;- <code>Authorization</code>: <code>Bearer &lt;YOUR_PERSONAL_API_KEY&gt;</code>
              <br />&nbsp;&nbsp;- <code>Content-Type</code>: <code>application/json</code>
              <br />• <strong>Request Body:</strong> <code>JSON</code>
              <br />&nbsp;&nbsp;- <code>message</code>: choose <em>Shortcut Input</em>
              <br />&nbsp;&nbsp;- <code>sender</code>: choose <em>Shortcut Input &gt; Sender</em>
              <br />&nbsp;&nbsp;- <code>timestamp</code>: choose <em>Current Date</em>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
