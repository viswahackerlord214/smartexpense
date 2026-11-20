'use client';

import React, { useState, useEffect } from 'react';
import { parseBankSMS, SAMPLE_BANK_MESSAGES } from '@/lib/parser/bank-parser';
import { useExpense } from '@/context/ExpenseContext';
import { useAuth } from '@/context/AuthContext';
import {
  Smartphone,
  Play,
  CheckCircle,
  AlertTriangle,
  ShieldAlert,
  Send,
  Sparkles,
  ArrowRight,
  Copy,
  Check,
  Key,
} from 'lucide-react';
import Link from 'next/link';

export default function SmsTesterPage() {
  const { setActiveCategorizeId, refreshData } = useExpense();
  const { user } = useAuth();
  const [inputMessage, setInputMessage] = useState(SAMPLE_BANK_MESSAGES[0].message);
  const [inputSender, setInputSender] = useState(SAMPLE_BANK_MESSAGES[0].sender);
  const [userApiKey, setUserApiKey] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  // Load user's active API key if available
  useEffect(() => {
    if (user) {
      fetch('/api/keys')
        .then((res) => res.json())
        .then((data) => {
          const active = (data.keys || []).find((k: any) => k.is_active);
          if (active) {
            // Note: only the hint is available from API for security
          }
        })
        .catch(() => {});
    }
  }, [user]);

  // Live client-side parse result
  const parsed = parseBankSMS(inputMessage, inputSender);

  const handleSelectSample = (sample: (typeof SAMPLE_BANK_MESSAGES)[0]) => {
    setInputMessage(sample.message);
    setInputSender(sample.sender);
    setSimulationResult(null);
  };

  const handleSimulateWebhook = async () => {
    if (!userApiKey.trim()) {
      alert('Please enter your personal API Key (from Settings) to simulate the webhook import.');
      return;
    }

    setIsSimulating(true);
    setSimulationResult(null);
    try {
      const res = await fetch('/api/transactions/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userApiKey.trim()}`,
        },
        body: JSON.stringify({
          message: inputMessage,
          sender: inputSender,
          timestamp: new Date().toISOString(),
        }),
      });

      const data = await res.json();
      setSimulationResult(data);
      await refreshData();

      // If imported successfully and needs categorization, trigger categorization modal!
      if (data.success && data.transaction?.id) {
        setTimeout(() => {
          setActiveCategorizeId(data.transaction.id);
        }, 600);
      }
    } catch (err: any) {
      setSimulationResult({ error: 'Network error simulating webhook', message: err.message });
    } finally {
      setIsSimulating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Page Header */}
      <div>
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold mb-2">
          <Smartphone className="w-3.5 h-3.5" />
          <span>Interactive SMS Parsing Bench</span>
        </div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">
          Bank SMS Testing Playground
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Paste any raw SMS message or load real-world bank formats to verify deterministic regex parsing,
          non-transaction filtering, and Apple Shortcuts API simulation using your personal API key.
        </p>
      </div>

      {/* API Key prompt banner */}
      <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white flex items-center space-x-1.5">
            <Key className="w-4 h-4 text-purple-400" />
            <span>Enter Your Personal API Key for Webhook Simulation:</span>
          </span>
          <Link href="/settings#iphone-shortcuts" className="text-xs text-emerald-400 hover:underline">
            Get Key in Settings →
          </Link>
        </div>
        <input
          type="password"
          value={userApiKey}
          onChange={(e) => setUserApiKey(e.target.value)}
          placeholder="Paste your sw_live_... API key here"
          className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-purple-500"
        />
      </div>

      {/* Preset Bank Sample Pills */}
      <div>
        <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
          Load Pre-Configured Bank SMS Samples:
        </div>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_BANK_MESSAGES.map((sample, idx) => (
            <button
              key={`${sample.sender}-${idx}`}
              onClick={() => handleSelectSample(sample)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                inputMessage === sample.message
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:bg-zinc-850'
              }`}
            >
              {sample.bank} ({sample.sender})
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Input SMS & Sender */}
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Raw Bank SMS Message</h3>
              <button
                onClick={() => copyToClipboard(inputMessage)}
                className="text-xs text-zinc-400 hover:text-white flex items-center space-x-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy SMS'}</span>
              </button>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                Bank Sender ID (SMS Header)
              </label>
              <input
                type="text"
                value={inputSender}
                onChange={(e) => setInputSender(e.target.value)}
                placeholder="e.g. HDFCBK, SBIINB, ICICIB, AXISBK, FEDBNK"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                Raw SMS Body Text
              </label>
              <textarea
                rows={6}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Paste exact bank SMS text here..."
                className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-200 leading-relaxed focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>

            <button
              onClick={handleSimulateWebhook}
              disabled={isSimulating}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20 transition active:scale-95 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSimulating ? 'Simulating Webhook...' : 'Simulate Live Webhook Import'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Live Parse Engine Result */}
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Deterministic Parser Output</span>
              </h3>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  parsed.is_non_transaction
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}
              >
                {parsed.is_non_transaction ? 'Non-Transaction Discarded' : 'Valid Transaction'}
              </span>
            </div>

            {/* Structured Table */}
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-zinc-800/80">
                <span className="text-zinc-500">Bank Sender</span>
                <span className="text-zinc-200 font-bold">{parsed.bank_sender}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800/80">
                <span className="text-zinc-500">Transaction Type</span>
                <span
                  className={`font-bold uppercase ${
                    parsed.transaction_type === 'debit'
                      ? 'text-rose-400'
                      : parsed.transaction_type === 'credit'
                      ? 'text-emerald-400'
                      : 'text-zinc-400'
                  }`}
                >
                  {parsed.transaction_type}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800/80">
                <span className="text-zinc-500">Extracted Amount</span>
                <span className="text-base font-extrabold text-white">
                  {parsed.amount ? `₹${parsed.amount.toLocaleString('en-IN')}` : 'None'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800/80">
                <span className="text-zinc-500">Merchant / Beneficiary</span>
                <span className="text-zinc-200">{parsed.merchant || 'Unknown Merchant'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800/80">
                <span className="text-zinc-500">Reference / UPI ID</span>
                <span className="text-zinc-300">{parsed.transaction_reference || parsed.upi_ref || 'None'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800/80">
                <span className="text-zinc-500">Account / Card</span>
                <span className="text-zinc-300">
                  {parsed.card_last4 ? `Card ending ${parsed.card_last4}` : parsed.account_last4 ? `A/c ending ${parsed.account_last4}` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-zinc-500">Confidence Score</span>
                <span className="text-emerald-400 font-bold">{(parsed.confidence_score * 100).toFixed(0)}%</span>
              </div>
            </div>

            {/* Explanation box */}
            <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-400 space-y-1">
              <div className="font-semibold text-zinc-300">Parser Explanation:</div>
              <div className="leading-relaxed">{parsed.explanation}</div>
            </div>

            {/* Simulation result */}
            {simulationResult && (
              <div
                className={`p-4 rounded-2xl border text-xs space-y-2 ${
                  simulationResult.success
                    ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-950/30 border-rose-500/30 text-rose-300'
                }`}
              >
                <div className="font-bold flex items-center space-x-1.5">
                  {simulationResult.success ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
                  <span>{simulationResult.success ? 'Webhook Ingestion Succeeded' : 'Simulation Failed / Blocked'}</span>
                </div>
                <pre className="text-[10px] font-mono p-2 bg-zinc-950 rounded-lg overflow-x-auto text-zinc-300">
                  {JSON.stringify(simulationResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
