'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import Link from 'next/link';

export default function ShortcutsGuidePage() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const sampleApiKey = 'sw_live_sec_8f9a2b4e7c1d3a5f6e8b0c2d4e6f8a0b';
  const sampleUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/transactions/import` : 'https://your-app.vercel.app/api/transactions/import';

  const copy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Hero Header */}
      <div>
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold mb-2">
          <Zap className="w-3.5 h-3.5" />
          <span>iOS Apple Shortcuts Native Bridge</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          iPhone SMS Automation Setup Guide
        </h1>
        <p className="text-sm text-zinc-400 mt-1.5 leading-relaxed">
          iOS restricts web browsers from silently reading SMS messages. By using Apple&apos;s native{' '}
          <strong className="text-zinc-200">Shortcuts Message Automation</strong>, eligible bank transaction
          messages are securely forwarded to SpendWise in real-time without manual intervention.
        </p>
      </div>

      {/* Integration Parameters Card (Quick Copy) */}
      <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Your Secure Webhook Parameters</span>
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

          {/* API Secret Key */}
          <div>
            <label className="text-xs font-semibold text-zinc-400 block mb-1">
              Authorization Token (Bearer)
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={sampleApiKey}
                className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-200"
              />
              <button
                onClick={() => copy('token', sampleApiKey)}
                className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium flex items-center space-x-1 border border-zinc-700"
              >
                {copiedKey === 'token' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'token' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Step-by-Step iOS Setup Walkthrough */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-white tracking-tight">
          Step-by-Step iPhone Automation Configuration
        </h3>

        {/* Step 1 */}
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
          <div className="flex items-center space-x-3">
            <span className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
              1
            </span>
            <h4 className="text-sm font-semibold text-white">Open the Shortcuts App on your iPhone</h4>
          </div>
          <p className="text-xs text-zinc-400 ml-10">
            Open Apple&apos;s native <strong className="text-zinc-200">Shortcuts</strong> app on iOS 16, 17, or 18.
            Tap on the <strong className="text-zinc-200">Automation</strong> tab in the bottom navigation bar.
          </p>
        </div>

        {/* Step 2 */}
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
          <div className="flex items-center space-x-3">
            <span className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
              2
            </span>
            <h4 className="text-sm font-semibold text-white">Create a New Message Trigger</h4>
          </div>
          <p className="text-xs text-zinc-400 ml-10">
            Tap the <strong className="text-zinc-200">&quot;+&quot;</strong> icon in the top right, then select{' '}
            <strong className="text-zinc-200">&quot;Message&quot;</strong>.
          </p>
          <div className="ml-10 p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs space-y-1 font-mono text-zinc-300">
            <div>• Senders: Leave blank (or select bank shortcodes like HDFCBK, SBI, ICICI)</div>
            <div>• Message Contains: <span className="text-emerald-400">debited</span> (or <span className="text-emerald-400">spent</span>, <span className="text-emerald-400">Rs.</span>)</div>
            <div>• When: <span className="text-emerald-400">Run Immediately</span> (Disable &quot;Ask Before Running&quot;)</div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
          <div className="flex items-center space-x-3">
            <span className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
              3
            </span>
            <h4 className="text-sm font-semibold text-white">Add Action: &quot;Get Contents of URL&quot;</h4>
          </div>
          <p className="text-xs text-zinc-400 ml-10">
            Tap &quot;New Blank Automation&quot; &rarr; Search for the action{' '}
            <strong className="text-zinc-200">&quot;Get Contents of URL&quot;</strong> and configure the fields:
          </p>

          <div className="ml-10 p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs space-y-2">
            <div className="font-mono text-zinc-300">
              <span className="text-zinc-500">URL:</span> {sampleUrl}
            </div>
            <div className="font-mono text-zinc-300">
              <span className="text-zinc-500">Method:</span> POST
            </div>
            <div className="font-mono text-zinc-300">
              <span className="text-zinc-500">Headers:</span>
              <div className="ml-4 text-zinc-400">
                • Content-Type: application/json<br />
                • Authorization: Bearer {sampleApiKey}
              </div>
            </div>
            <div className="font-mono text-zinc-300">
              <span className="text-zinc-500">Request Body (JSON):</span>
              <pre className="mt-1 p-2 bg-black rounded text-[11px] text-emerald-400">
{`{
  "message": Shortcut Input,
  "sender": Shortcut Input.Sender,
  "timestamp": Current Date
}`}
              </pre>
            </div>
          </div>
        </div>

        {/* Step 4 */}
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
          <div className="flex items-center space-x-3">
            <span className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
              4
            </span>
            <h4 className="text-sm font-semibold text-white">Save & Verify in Playground</h4>
          </div>
          <p className="text-xs text-zinc-400 ml-10">
            Tap &quot;Done&quot;. Whenever a bank SMS matching your conditions arrives on your iPhone, iOS
            instantly posts the text to SpendWise, extracts the transaction, and delivers an actionable push
            notification to your lock screen.
          </p>
        </div>
      </div>

      {/* Test Shortcut Navigation Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-zinc-950 border border-emerald-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-base font-bold text-white">Ready to test the automation flow?</h4>
          <p className="text-xs text-zinc-400 mt-0.5">
            Visit the SMS Testing Bench to paste a bank message and trigger an actionable push notification!
          </p>
        </div>

        <Link
          href="/sms-tester"
          className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center space-x-2 shadow-lg shadow-emerald-500/20 transition active:scale-95"
        >
          <span>Open SMS Tester</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}


