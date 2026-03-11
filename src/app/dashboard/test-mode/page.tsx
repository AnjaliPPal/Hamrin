"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface EventRow {
  id: string;
  stripeEventId: string;
  eventType: string;
  createdAt: string;
  rawJson: Record<string, unknown>;
}

const STEPS = [
  {
    number: 1,
    title: "Connect your Stripe test account",
    description:
      'Go to stripe.com/settings/apps, switch to "Test mode", then click the Connect button on your hamrin onboard page. This links a sandbox Stripe account.',
    code: null,
    badge: "Setup",
    badgeColor: "bg-violet-100 text-violet-700",
  },
  {
    number: 2,
    title: "Point your webhook to hamrin",
    description:
      "In your Stripe test dashboard → Developers → Webhooks, add an endpoint pointing to your app.",
    code: "https://your-domain.com/api/webhooks/stripe",
    badge: "Webhook",
    badgeColor: "bg-blue-100 text-blue-700",
  },
  {
    number: 3,
    title: "Simulate a failed payment",
    description:
      'Click "Simulate failed payment" below. This creates a synthetic invoice.payment_failed event and a FailedPayment record in your database — exactly what a real Stripe failure would produce.',
    code: null,
    badge: "Test",
    badgeColor: "bg-amber-100 text-amber-700",
  },
  {
    number: 4,
    title: "Watch the retry engine run",
    description:
      "Go back to your dashboard. You should see the failed payment appear in the table with status: failed. The retry engine will attempt recovery at the scheduled time.",
    code: null,
    badge: "Verify",
    badgeColor: "bg-emerald-100 text-emerald-700",
  },
  {
    number: 5,
    title: "Test the cancel flow widget",
    description:
      "Add the snippet to any test page. When a user clicks your cancel button, hamrin intercepts it and shows the save offer. Works entirely in test mode.",
    code: '<script src="https://your-domain.com/api/cancel-flow/snippet.js?installation=YOUR_ID"></script>',
    badge: "Widget",
    badgeColor: "bg-pink-100 text-pink-700",
  },
  {
    number: 6,
    title: "Test the payment wall",
    description:
      "Embed the wall snippet on any page. It checks for open failed payments or paused subscriptions and shows the recovery CTA automatically.",
    code: '<script src="https://your-domain.com/api/wall/snippet.js?installation=YOUR_ID"></script>',
    badge: "Wall",
    badgeColor: "bg-[#ECFDF5] text-emerald-700",
  },
];

export default function TestModePage() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  const [simEmail, setSimEmail] = useState("");
  const [simAmount, setSimAmount] = useState("49");
  const [simLoading, setSimLoading] = useState(false);
  const [simResult, setSimResult] = useState<{ ok?: boolean; message?: string; error?: string } | null>(null);

  const [copiedCode, setCopiedCode] = useState<number | null>(null);

  const loadEvents = useCallback(async () => {
    setEventsLoading(true);
    try {
      const res = await fetch("/api/debug/events");
      if (res.ok) {
        const data = await res.json() as { events: EventRow[] };
        setEvents(data.events ?? []);
      }
    } finally {
      setEventsLoading(false);
    }
  }, []);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  async function handleSimulate() {
    setSimLoading(true);
    setSimResult(null);
    try {
      const res = await fetch("/api/debug/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: simEmail || undefined,
          amount: parseFloat(simAmount) || 49,
        }),
      });
      const data = await res.json() as typeof simResult;
      setSimResult(data);
      if (res.ok) setTimeout(() => loadEvents(), 800);
    } finally {
      setSimLoading(false);
    }
  }

  async function copyCode(code: string, stepIdx: number) {
    await navigator.clipboard.writeText(code);
    setCopiedCode(stepIdx);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  function eventTypeColor(type: string) {
    if (type.includes("failed"))  return "bg-red-50 text-red-600 border-red-100";
    if (type.includes("paid") || type.includes("recovered")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (type.includes("updated")) return "bg-blue-50 text-blue-700 border-blue-100";
    if (type.includes("deleted")) return "bg-amber-50 text-amber-700 border-amber-100";
    return "bg-gray-100 text-gray-600 border-gray-200";
  }

  return (
    <div className="min-h-screen bg-[#F0F4FF]">

      {/* ── Nav ── */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-gray-700 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Dashboard
          </Link>
          <span className="text-gray-200">/</span>
          <span className="text-sm font-semibold text-gray-800">Test Mode</span>
          <span className="ml-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 border border-amber-200 text-amber-700">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            TEST MODE
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-10 space-y-8">

        {/* ── Page heading ── */}
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Test Mode</h1>
          <p className="text-sm text-gray-400 mt-1">
            Step-by-step guide to test every hamrin feature before going live.
          </p>
        </div>

        {/* ── STEP GUIDE ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] p-6 md:p-8">
          <h2 className="text-[15px] font-semibold text-gray-900 mb-6">Step-by-step testing guide</h2>
          <div className="space-y-5">
            {STEPS.map((step, i) => (
              <div key={step.number} className="flex gap-5">
                {/* Number circle + connector */}
                <div className="flex flex-col items-center gap-1">
                  <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {step.number}
                  </div>
                  {i < STEPS.length - 1 && <div className="w-px flex-1 bg-gray-100 min-h-[24px]" />}
                </div>

                {/* Content */}
                <div className="pb-5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[15px] font-semibold text-gray-900">{step.title}</p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${step.badgeColor}`}>
                      {step.badge}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>
                  {step.code && (
                    <div className="mt-3 flex items-start gap-2">
                      <pre className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs font-mono text-gray-700 overflow-x-auto whitespace-pre-wrap break-all">
                        {step.code}
                      </pre>
                      <button
                        onClick={() => copyCode(step.code!, i)}
                        className="flex-shrink-0 mt-0.5 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-600 transition-colors"
                      >
                        {copiedCode === i ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── SIMULATE + EVENTS — side by side on desktop ── */}
        <div className="grid md:grid-cols-2 gap-6">

          {/* Simulate */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] p-6">
            <h2 className="text-[15px] font-semibold text-gray-900 mb-1">Simulate a failed payment</h2>
            <p className="text-xs text-gray-400 mb-5">
              Creates a synthetic <code className="bg-gray-100 px-1 rounded text-[11px]">invoice.payment_failed</code> event and inserts a FailedPayment record.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Customer email <span className="font-normal text-gray-400">(optional)</span></label>
                <input
                  type="email"
                  value={simEmail}
                  onChange={(e) => setSimEmail(e.target.value)}
                  placeholder="test@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Amount (USD)</label>
                <input
                  type="number"
                  value={simAmount}
                  onChange={(e) => setSimAmount(e.target.value)}
                  min="1"
                  step="0.01"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition"
                />
              </div>
            </div>

            <button
              onClick={handleSimulate}
              disabled={simLoading}
              className="mt-4 w-full bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 text-white font-bold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
            >
              {simLoading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Simulating…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Simulate failed payment
                </>
              )}
            </button>

            {simResult && (
              <div className={`mt-4 rounded-xl p-3.5 text-sm ${
                simResult.ok ? "bg-emerald-50 border border-emerald-100 text-emerald-700" : "bg-red-50 border border-red-100 text-red-600"
              }`}>
                {simResult.ok ? (
                  <span>✅ {simResult.message}</span>
                ) : (
                  <span>❌ {simResult.error}</span>
                )}
              </div>
            )}
          </div>

          {/* Event Viewer */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-[15px] font-semibold text-gray-900">Webhook event viewer</h2>
                <p className="text-xs text-gray-400 mt-0.5">Last 30 events received</p>
              </div>
              <button
                onClick={loadEvents}
                disabled={eventsLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-600 transition-colors disabled:opacity-50"
              >
                <svg className={`w-3.5 h-3.5 ${eventsLoading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[400px]">
              {events.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-center px-6">
                  <div className="w-12 h-12 rounded-[16px] bg-[#F5F0E8] flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-gray-700">No events yet</p>
                  <p className="text-xs text-gray-400 mt-1">Simulate a payment above or trigger a real Stripe webhook.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {events.map((ev) => (
                    <div key={ev.id}>
                      <button
                        onClick={() => setExpandedEvent(expandedEvent === ev.id ? null : ev.id)}
                        className="w-full text-left px-5 py-3.5 hover:bg-[#F8FAFF] transition-colors flex items-center gap-3"
                      >
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border flex-shrink-0 ${eventTypeColor(ev.eventType)}`}>
                          {ev.eventType}
                        </span>
                        <span className="text-xs text-gray-400 ml-auto flex-shrink-0">
                          {new Date(ev.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <svg className={`w-4 h-4 text-gray-300 flex-shrink-0 transition-transform ${expandedEvent === ev.id ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {expandedEvent === ev.id && (
                        <div className="px-5 pb-4">
                          <pre className="bg-gray-50 rounded-xl p-3 text-[11px] font-mono text-gray-600 overflow-x-auto max-h-48 whitespace-pre-wrap break-all">
                            {JSON.stringify(ev.rawJson, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
