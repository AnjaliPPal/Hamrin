"use client";

import { useState } from "react";
import Link from "next/link";

type Plan = "outcome" | "ltd" | "pro";

export default function OnboardPage() {
  const [selected, setSelected] = useState<Plan>("outcome");
  const [amount, setAmount] = useState(2000);

  const fee = Math.round(amount * 0.6 * 0.1);
  const netGain = Math.round(amount * 0.6 - fee);

  return (
    <div className="min-h-screen bg-white font-[family-name:var(--font-inter)]">
      {/* Nav */}
      <nav className="border-b border-gray-100">
        <div className="max-w-[1200px] mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight text-gray-900">
            hamrin<span className="text-[#eab308]">.ai</span>
          </Link>
          <Link href="/" className="text-[15px] text-gray-600 hover:text-gray-900 transition-colors">
            ← Back
          </Link>
        </div>
      </nav>

      <div className="max-w-[1000px] mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-14">
          <h1 className="font-[family-name:var(--font-lora)] text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            Choose your pricing model
          </h1>
          <p className="mt-3 text-gray-500">Zero risk on Outcome. One-time on LTD. Predictable on Pro.</p>
        </div>

        {/* Plan cards — ListenUp style, design bible compliant */}
        <div className="grid sm:grid-cols-3 gap-5 mb-10">
          {/* Outcome */}
          <button
            onClick={() => setSelected("outcome")}
            className={`text-left rounded-2xl p-7 border-2 transition-all ${
              selected === "outcome"
                ? "border-[#1e40af] bg-blue-50/50 shadow-md"
                : "border-gray-200 bg-white hover:border-gray-300 shadow-sm hover:shadow-md"
            }`}
          >
            <p className="text-sm font-semibold text-gray-900 mb-1">Outcome</p>
            <p className="text-xs text-gray-500 mb-5">Zero risk. Pay only on recovered revenue.</p>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-4xl font-bold text-gray-900">$0</span>
              <span className="text-gray-400 text-sm">upfront</span>
            </div>
            <p className="text-green-600 text-sm font-semibold mb-6">+ 10% of recovered revenue</p>
            {selected === "outcome" && (
              <div className="flex items-center gap-2 text-green-600 text-xs font-semibold">
                <span className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center text-white text-[10px]">✓</span>
                Selected
              </div>
            )}
          </button>

          {/* LTD — highlighted with green border per design bible */}
          <button
            onClick={() => setSelected("ltd")}
            className={`text-left rounded-2xl p-7 border-2 transition-all ${
              selected === "ltd"
                ? "border-green-500 bg-green-50/30 shadow-md"
                : "border-gray-200 bg-white hover:border-gray-300 shadow-sm hover:shadow-md"
            }`}
          >
            <p className="text-sm font-semibold text-gray-900 mb-1">Lifetime Deal</p>
            <p className="text-xs text-gray-500 mb-5">No % fee ever. Best for serious founders.</p>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-4xl font-bold text-gray-900">$749</span>
              <span className="text-gray-400 text-sm line-through ml-1">$999</span>
            </div>
            <p className="text-gray-500 text-sm mb-6">one-time · 50 spots left</p>
            {selected === "ltd" && (
              <div className="flex items-center gap-2 text-green-600 text-xs font-semibold">
                <span className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center text-white text-[10px]">✓</span>
                Selected
              </div>
            )}
          </button>

          {/* Pro */}
          <button
            onClick={() => setSelected("pro")}
            className={`text-left rounded-2xl p-7 border-2 transition-all ${
              selected === "pro"
                ? "border-[#1e40af] bg-blue-50/50 shadow-md"
                : "border-gray-200 bg-white hover:border-gray-300 shadow-sm hover:shadow-md"
            }`}
          >
            <p className="text-sm font-semibold text-gray-900 mb-1">Pro</p>
            <p className="text-xs text-gray-500 mb-5">Predictable cost. Best for $30K+ MRR.</p>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-4xl font-bold text-gray-900">$99</span>
              <span className="text-gray-400 text-sm">/mo</span>
            </div>
            <p className="text-gray-500 text-sm mb-6">flat rate · unlimited</p>
            {selected === "pro" && (
              <div className="flex items-center gap-2 text-green-600 text-xs font-semibold">
                <span className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center text-white text-[10px]">✓</span>
                Selected
              </div>
            )}
          </button>
        </div>

        {/* Outcome calculator — only shown for outcome plan */}
        {selected === "outcome" && (
          <div className="bg-white border border-gray-200 rounded-2xl p-7 mb-10 shadow-sm">
            <div className="text-sm font-semibold text-gray-900 mb-4">Your recovery estimate</div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
              <div className="flex-1 w-full">
                <label className="text-xs text-gray-500 block mb-2">
                  Monthly failed payments ($)
                </label>
                <input
                  type="range"
                  min={500}
                  max={20000}
                  step={500}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full accent-[#1e40af]"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>$500</span>
                  <span className="text-gray-900 font-semibold">${amount.toLocaleString()}</span>
                  <span>$20,000</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="text-2xl font-bold text-gray-900">${amount.toLocaleString()}</div>
                <div className="text-xs text-gray-500 mt-1">Failed payments/mo</div>
              </div>
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <div className="text-2xl font-bold text-green-600">${(amount * 0.6).toLocaleString()}</div>
                <div className="text-xs text-gray-500 mt-1">Recovered (avg 60%)</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="text-2xl font-bold text-gray-900">${netGain.toLocaleString()}</div>
                <div className="text-xs text-gray-500 mt-1">Net gain after 10% fee (${fee})</div>
              </div>
            </div>
          </div>
        )}

        {/* CTA — design bible: primary blue #1E40AF, green for LTD */}
        <div className="space-y-4">
          {selected === "outcome" && (
            <a
              href={`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/auth/stripe?pricing_model=outcome`}
              className="block w-full bg-[#1e40af] hover:bg-[#1e3b96] text-white font-semibold py-4 rounded-lg text-center text-base transition-colors shadow-sm"
            >
              Connect Stripe — start recovering free
            </a>
          )}
          {selected === "ltd" && (
            <a
              href="https://cal.com/anjalipal/hamrin-demo"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 rounded-lg text-center text-base transition-colors"
            >
              Book a call to claim your LTD spot →
            </a>
          )}
          {selected === "pro" && (
            <a
              href="https://cal.com/anjalipal/hamrin-demo"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-[#1e40af] hover:bg-[#1e3b96] text-white font-semibold py-4 rounded-lg text-center text-base transition-colors shadow-sm"
            >
              Book a call to set up Pro →
            </a>
          )}

          <p className="text-center text-xs text-gray-400">
            {selected === "outcome"
              ? "No credit card needed. Connect Stripe read/write in 60 seconds."
              : "No commitment on the call — just a 20-min chat with the founder."}
          </p>
        </div>

        {/* Trust strip — design bible: green checkmarks */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-gray-500">
          <span className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
            Visa/MC compliant retries
          </span>
          <span className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
            GDPR ready
          </span>
          <span className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
            No upfront cost on Outcome
          </span>
          <span className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
            Cancel anytime
          </span>
        </div>
      </div>
    </div>
  );
}
