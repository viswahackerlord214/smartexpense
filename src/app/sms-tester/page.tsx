'use client';

import React, { useState } from 'react';
import { parseBankSMS, SAMPLE_BANK_MESSAGES } from '@/lib/parser/bank-parser';
import { useExpense } from '@/context/ExpenseContext';
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
} from 'lucide-react';

export default function SmsTesterPage() {
  const { setActiveCategorizeId, refreshData } = useExpense();
  const [inputMessage, setInputMessage] = useState(SAMPLE_BANK_MESSAGES[0].message);
  const [inputSender, setInputSender] = useState(SAMPLE_BANK_MESSAGES[0].sender);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  // Live client-side parse result
  const parsed = parseBankSMS(inputMessage, inputSender);

  const handleSelectSample = (sample: (typeof SAMPLE_BANK_MESSAGES)[0]) => {
    setInputMessage(sample.message);
    setInputSender(sample.sender);
    setSimulationResult(null);
  };

  const handleSimulateWebhook = async () => {
    setIsSimulating(true);
    setSimulationResult(null);
    try {
      const res = await fetch('/api/transactions/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer sw_live_sec_8f9a2b4e7c1d3a5f6e8b0c2d4e6f8a0b',
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
    <div className="space-y-6">
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
          non-transaction filtering, and Apple Shortcuts API simulation.
        </p>
      </div>

      {/* Preset Bank Sample Pills */}
      <div>
        <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
          Load Pre-Configured Bank SMS Samples:
        </div>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_BANK_MESSAGES.map((sample) => (
            <button
              key={sample.bank}
              onClick={() => handleSelectSample(sample)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                inputMessage === sample.message
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40 shadow-sm'
                  : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              {sample.bank}
            </button>
          ))}
        </div>
      </div>

      {/* Testing Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Raw SMS Input Area */}
        <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Bank SMS Input</h3>
            <button
              onClick={() => copyToClipboard(inputMessage)}
              className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center space-x-1"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <div>
            <label className="text-xs text-zinc-400 block mb-1">Bank Sender Header / Shortcode</label>
            <input
              type="text"
              value={inputSender}
              onChange={(e) => setInputSender(e.target.value)}
              placeholder="e.g. HDFCBK, ICICIB, SBIINB, FEDX"
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-400 block mb-1">Message Body</label>
            <textarea
              rows={5}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Paste raw bank transaction SMS text here..."
              className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 font-mono focus:outline-none focus:border-emerald-500 leading-relaxed"
            />
          </div>

          {/* Simulate Action Button */}
          <button
            onClick={handleSimulateWebhook}
            disabled={isSimulating || !inputMessage.trim()}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20 transition active:scale-95 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>
              {isSimulating ? 'Simulating iPhone Shortcuts Webhook...' : 'Simulate iPhone Import & Push Notification'}
            </span>
          </button>
        </div>

        {/* Right: Live Extraction & Inspection Panel */}
        <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Live Extraction Breakdown</h3>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                parsed.is_non_transaction
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  : parsed.confidence_score >= 0.8
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}
            >
              {parsed.is_non_transaction
                ? 'NON-EXPENSE FILTERED'
                : `${Math.round(parsed.confidence_score * 100)}% Confidence`}
            </span>
          </div>

          {/* Filter Alert if OTP or Promo */}
          {parsed.is_non_transaction ? (
            <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-800/40 space-y-2">
              <div className="flex items-center space-x-2 text-rose-400 font-bold text-xs">
                <ShieldAlert className="w-4 h-4" />
                <span>Security / Filter Triggered: {parsed.non_transaction_reason?.toUpperCase()}</span>
              </div>
              <p className="text-xs text-rose-300 leading-relaxed">{parsed.explanation}</p>
              <p className="text-[11px] text-zinc-400">
                SpendWise strictly avoids logging OTPs, passwords, or pure balance broadcasts to preserve privacy.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Extracted Amount */}
              <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 flex items-center justify-between">
                <span className="text-xs text-zinc-400">Extracted Amount</span>
                <span className="text-xl font-extrabold text-white">
                  {parsed.amount ? `₹${parsed.amount.toLocaleString('en-IN')}` : 'No amount detected'}
                </span>
              </div>

              {/* Grid of parsed fields */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80">
                  <div className="text-zinc-500 text-[10px] uppercase font-semibold">Normalized Merchant</div>
                  <div className="font-bold text-zinc-200 mt-0.5 truncate">
                    {parsed.merchant || 'Unknown'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80">
                  <div className="text-zinc-500 text-[10px] uppercase font-semibold">Bank Sender</div>
                  <div className="font-bold text-zinc-200 mt-0.5">{parsed.bank_sender}</div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80">
                  <div className="text-zinc-500 text-[10px] uppercase font-semibold">Transaction Type</div>
                  <div className="font-bold text-emerald-400 mt-0.5 capitalize">
                    {parsed.transaction_type}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80">
                  <div className="text-zinc-500 text-[10px] uppercase font-semibold">Reference / UPI</div>
                  <div className="font-mono text-zinc-300 mt-0.5 truncate">
                    {parsed.transaction_reference || parsed.upi_ref || 'None'}
                  </div>
                </div>
              </div>

              {/* Idempotency Hash */}
              <div className="p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 text-[11px] text-zinc-400 font-mono truncate">
                <span className="text-zinc-500">Hash: </span>
                <span>{parsed.raw_hash}</span>
              </div>
            </div>
          )}

          {/* Simulation Output Card */}
          {simulationResult && (
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-700/70 animate-fade-in space-y-1.5 text-xs">
              <div className="font-bold text-white flex items-center space-x-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Simulation Server Response</span>
              </div>
              <pre className="text-[10px] font-mono text-emerald-300 overflow-x-auto p-2 bg-black/60 rounded-lg">
                {JSON.stringify(simulationResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

