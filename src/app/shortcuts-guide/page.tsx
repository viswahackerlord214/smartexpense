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
  Apple,
  Bot,
  HelpCircle,
  Code2,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function ShortcutsGuidePage() {
  const { user } = useAuth();
  const [platform, setPlatform] = useState<'ios' | 'android'>('ios');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeKeyHint, setActiveKeyHint] = useState<string | null>(null);

  const sampleUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/transactions/import`
      : 'https://smartexpense-iota.vercel.app/api/transactions/import';

  const androidPayloadSample = `{
  "message": "{sms_message}",
  "sender": "{sms_number}",
  "timestamp": "{system_time_ms}"
}`;

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
          <span>Automated Bank SMS Engine (iOS & Android)</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Mobile SMS Automation Setup Guide
        </h1>
        <p className="text-sm text-zinc-400 mt-1.5 leading-relaxed">
          Web browsers cannot directly read your SMS inbox in the background for privacy and security. By using 
          native device automations, incoming bank transaction alerts are securely forwarded to SpendWise in real-time.
        </p>
      </div>

      {/* Platform Switcher Tabs */}
      <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-zinc-900 border border-zinc-800">
        <button
          onClick={() => setPlatform('ios')}
          className={`flex items-center justify-center space-x-2 py-3 rounded-xl font-bold text-xs transition ${
            platform === 'ios'
              ? 'bg-zinc-800 text-white shadow-md border border-zinc-700'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Apple className="w-4 h-4 text-zinc-200" />
          <span>iPhone (Apple Shortcuts)</span>
        </button>

        <button
          onClick={() => setPlatform('android')}
          className={`flex items-center justify-center space-x-2 py-3 rounded-xl font-bold text-xs transition ${
            platform === 'android'
              ? 'bg-emerald-500/20 text-emerald-400 shadow-md border border-emerald-500/40'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Bot className="w-4 h-4 text-emerald-400" />
          <span>Android (MacroDroid)</span>
        </button>
      </div>

      {/* Shared Webhook Parameters Card */}
      <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Your Personal Webhook Parameters</span>
        </h3>

        <div className="space-y-3">
          {/* Endpoint URL */}
          <div>
            <label className="text-xs font-semibold text-zinc-400 block mb-1">
              POST Webhook URL (Same for both iOS & Android)
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
                className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium flex items-center space-x-1 border border-zinc-700 transition"
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
                href="/settings#api-keys"
                className="text-emerald-400 hover:underline flex items-center space-x-1 font-semibold"
              >
                <span>Manage in Settings</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              Every user has a unique cryptographically hashed API secret key. Never share your key. If you haven&apos;t generated your personal key yet, visit{' '}
              <Link href="/settings" className="text-emerald-400 underline">
                Settings → Integrations
              </Link>{' '}
              to generate one.
            </p>
            {activeKeyHint && (
              <div className="text-[11px] text-zinc-400 font-mono">
                Active Key on this account: <span className="text-emerald-400 font-bold">{activeKeyHint}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PLATFORM SPECIFIC INSTRUCTIONS */}
      {platform === 'ios' ? (
        /* iOS Shortcuts Instructions */
        <div className="space-y-4">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Apple className="w-4 h-4 text-zinc-200" />
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
                Open the native <strong>Shortcuts</strong> app on your iPhone. Tap the <strong>Automation</strong> tab at the bottom, then tap the <strong>+</strong> button in the top right corner.
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
                Select <strong>Message</strong>. In the <strong>Sender</strong> field, add your bank sender IDs:
                <br />
                <code className="text-emerald-400 font-mono text-[11px] block mt-1.5 p-2 bg-zinc-950 rounded-lg">
                  HDFCBK, SBIINB, ICICIB, AXISBK, KOTAKB, FEDBNK
                </code>
                Choose <strong>Run Immediately</strong> and turn off <strong>Notify When Run</strong> for hands-free background execution.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-2">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs">
                  3
                </span>
                <h4 className="text-xs font-bold text-white">Configure the Webhook POST Action</h4>
              </div>
              <div className="text-xs text-zinc-400 leading-relaxed pl-8 space-y-1.5">
                <div>Add the action <strong>Get Contents of URL</strong>:</div>
                <div className="p-3 rounded-xl bg-zinc-950 font-mono text-[11px] text-zinc-300 space-y-1">
                  <div><strong>Method:</strong> POST</div>
                  <div><strong>URL:</strong> {sampleUrl}</div>
                  <div><strong>Headers:</strong></div>
                  <div className="pl-3 text-emerald-400">Authorization: Bearer &lt;YOUR_API_KEY&gt;</div>
                  <div className="pl-3 text-emerald-400">Content-Type: application/json</div>
                  <div><strong>Request Body:</strong> JSON</div>
                  <div className="pl-3">• message: <em>Shortcut Input</em></div>
                  <div className="pl-3">• sender: <em>Shortcut Input &gt; Sender</em></div>
                  <div className="pl-3">• timestamp: <em>Current Date</em></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Android MacroDroid Instructions */
        <div className="space-y-4">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Bot className="w-4 h-4 text-emerald-400" />
            <span>Step-by-Step Android (MacroDroid) Walkthrough</span>
          </h3>

          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-zinc-300 leading-relaxed">
            <strong className="text-emerald-400">MacroDroid</strong> is a free, highly rated automation app on the Google Play Store. It takes under 2 minutes to configure and works entirely in the background.
          </div>

          <div className="space-y-3">
            {/* Step 1 */}
            <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-2">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs">
                  1
                </span>
                <h4 className="text-xs font-bold text-white">Install MacroDroid</h4>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed pl-8">
                Download and install <strong>MacroDroid</strong> from the{' '}
                <a
                  href="https://play.google.com/store/apps/details?id=com.arlosoft.macrodroid"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 underline font-semibold inline-flex items-center space-x-1"
                >
                  <span>Google Play Store</span>
                  <ExternalLink className="w-3 h-3 ml-0.5 inline" />
                </a>
                . Grant the requested SMS permissions.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-2">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs">
                  2
                </span>
                <h4 className="text-xs font-bold text-white">Add SMS Received Trigger</h4>
              </div>
              <div className="text-xs text-zinc-400 leading-relaxed pl-8 space-y-1">
                <div>Tap <strong>Add Macro</strong>:</div>
                <div>• In <strong>Triggers (+)</strong>, select <strong>Messaging</strong> $\to$ <strong>SMS Received</strong>.</div>
                <div>• Choose <strong>Select Sender(s)</strong> $\to$ <strong>Any Number</strong> (or restrict with wildcards like <code>*HDFC*, *SBI*, *ICICI*, *AXIS*, *KOTAK*, *FED*</code>).</div>
                <div>• Leave <strong>SMS Content</strong> set to <em>Any Content</em>.</div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-3">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs">
                  3
                </span>
                <h4 className="text-xs font-bold text-white">Add HTTP Request Action</h4>
              </div>
              <div className="text-xs text-zinc-400 leading-relaxed pl-8 space-y-2">
                <div>In <strong>Actions (+)</strong>, select <strong>Web Interactions</strong> $\to$ <strong>HTTP Request</strong>. Configure:</div>
                
                <div className="p-3.5 rounded-xl bg-zinc-950 font-mono text-[11px] text-zinc-300 space-y-1.5">
                  <div><strong>Method:</strong> POST</div>
                  <div><strong>URL:</strong> {sampleUrl}</div>
                  <div><strong>Content type:</strong> application/json</div>
                  <div><strong>Header 1:</strong> Authorization: <code>Bearer &lt;YOUR_API_KEY&gt;</code></div>
                </div>

                <div className="pt-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-zinc-300">Request Body (Content body):</span>
                    <button
                      onClick={() => copy('android-json', androidPayloadSample)}
                      className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] font-bold flex items-center space-x-1"
                    >
                      {copiedKey === 'android-json' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'android-json' ? 'Copied' : 'Copy JSON'}</span>
                    </button>
                  </div>
                  <pre className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 font-mono text-[11px] text-emerald-400 overflow-x-auto">
                    {androidPayloadSample}
                  </pre>
                  <p className="text-[10px] text-zinc-500 mt-1">
                    Tip: In MacroDroid, <code>&#123;sms_message&#125;</code> and <code>&#123;sms_number&#125;</code> are built-in &quot;Magic Text&quot; tags that automatically insert the live message and sender.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-2">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs">
                  4
                </span>
                <h4 className="text-xs font-bold text-white">Save and Enable</h4>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed pl-8">
                Name your macro <em>SpendWise Sync</em> and tap the checkmark. Ensure MacroDroid is enabled with battery optimization disabled for seamless real-time syncing.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
