"use client";

import { useState } from "react";
import Link from "next/link";

type Plan = "outcome" | "flat" | "ltd";

const CHECK = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
    <circle cx="7" cy="7" r="7" fill="#2ECC88" />
    <path d="M4 7l2 2 4-4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function OnboardPage() {
  const [selected, setSelected] = useState<Plan>("outcome");
  const [amount, setAmount] = useState(2000);

  const fee = Math.round(amount * 0.6 * 0.1);
  const netGain = Math.round(amount * 0.6 - fee);

  return (
    <div className="min-h-screen bg-[#F0F4FF] font-[family-name:var(--font-inter)]">

      {/* Nav */}
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-[1200px] mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#2ECC88] flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-[15px] font-extrabold text-gray-900 tracking-tight">hamrin<span className="text-[#2ECC88]">.ai</span></span>
          </Link>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">← Back</Link>
        </div>
      </nav>

      <div className="max-w-[980px] mx-auto px-6 py-16">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-white rounded-full px-3.5 py-1.5 mb-5 border border-gray-100">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2ECC88]" />
            <span className="text-xs font-semibold text-gray-600 tracking-wide">Stripe Retention OS</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Choose your plan
          </h1>
          <p className="mt-3 text-gray-500 text-[15px]">
            Zero risk on Outcome · Predictable on Flat · Lifetime on LTD
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">

          {/* Outcome */}
          <button
            onClick={() => setSelected("outcome")}
            className={`text-left rounded-2xl p-6 border-2 transition-all ${
              selected === "outcome"
                ? "border-gray-900 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.08)]"
                : "border-gray-100 bg-white hover:border-gray-300 shadow-sm"
            }`}
          >
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.1em] mb-1">Outcome</p>
            <p className="text-xs text-gray-500 mb-4">Zero risk. Pay only on recovered revenue.</p>
            <div className="flex items-baseline gap-1 mb-0.5">
              <span className="text-3xl font-extrabold text-gray-900 leading-none">$0</span>
              <span className="text-gray-400 text-sm">upfront</span>
            </div>
            <p className="text-[#2ECC88] text-xs font-bold mb-4">+ 10% of recovered revenue</p>
            <ul className="space-y-1.5 text-xs text-gray-500">
              {["All retention tools", "Recovery emails", "Visa/MC compliant"].map((i) => (
                <li key={i} className="flex items-center gap-1.5">{CHECK}{i}</li>
              ))}
            </ul>
            {selected === "outcome" && (
              <div className="mt-3 flex items-center gap-1.5 text-[#2ECC88] text-xs font-bold">
                <span className="w-4 h-4 rounded-full bg-[#2ECC88] flex items-center justify-center text-white text-[9px]">✓</span>
                Selected
              </div>
            )}
          </button>

          {/* Flat */}
          <button
            onClick={() => setSelected("flat")}
            className={`text-left rounded-2xl p-6 border-2 transition-all relative ${
              selected === "flat"
                ? "border-[#2ECC88] bg-white shadow-[0_4px_20px_rgba(46,204,136,0.15)]"
                : "border-gray-100 bg-white hover:border-[#2ECC88]/50 shadow-sm"
            }`}
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="inline-flex items-center gap-1 bg-[#2ECC88] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                Most popular
              </span>
            </div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.1em] mb-1">Flat</p>
            <p className="text-xs text-gray-500 mb-4">Predictable cost. Best for $30K+ MRR.</p>
            <div className="flex items-baseline gap-1 mb-0.5">
              <span className="text-3xl font-extrabold text-gray-900 leading-none">$99</span>
              <span className="text-gray-400 text-sm">/mo</span>
            </div>
            <p className="text-gray-400 text-xs mb-4">Flat rate · unlimited recoveries</p>
            <ul className="space-y-1.5 text-xs text-gray-500">
              {["No % fee ever", "Priority support", "API access"].map((i) => (
                <li key={i} className="flex items-center gap-1.5">{CHECK}{i}</li>
              ))}
            </ul>
            {selected === "flat" && (
              <div className="mt-3 flex items-center gap-1.5 text-[#2ECC88] text-xs font-bold">
                <span className="w-4 h-4 rounded-full bg-[#2ECC88] flex items-center justify-center text-white text-[9px]">✓</span>
                Selected
              </div>
            )}
          </button>

          {/* LTD */}
          <button
            onClick={() => setSelected("ltd")}
            className={`text-left rounded-2xl p-6 border-2 transition-all ${
              selected === "ltd"
                ? "border-gray-900 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.08)]"
                : "border-gray-100 bg-white hover:border-gray-300 shadow-sm"
            }`}
          >
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.1em] mb-1">Lifetime Deal</p>
            <p className="text-xs text-gray-500 mb-4">No % fee, no monthly bill, ever.</p>
            <div className="flex items-baseline gap-1 mb-0.5">
              <span className="text-3xl font-extrabold text-gray-900 leading-none">$749</span>
              <span className="text-gray-400 text-sm line-through ml-1">$999</span>
            </div>
            <p className="text-gray-400 text-xs mb-4">one-time · limited spots</p>
            <ul className="space-y-1.5 text-xs text-gray-500">
              {["Lifetime access", "All future features", "1:1 onboarding call"].map((i) => (
                <li key={i} className="flex items-center gap-1.5">{CHECK}{i}</li>
              ))}
            </ul>
            {selected === "ltd" && (
              <div className="mt-3 flex items-center gap-1.5 text-[#2ECC88] text-xs font-bold">
                <span className="w-4 h-4 rounded-full bg-[#2ECC88] flex items-center justify-center text-white text-[9px]">✓</span>
                Selected
              </div>
            )}
          </button>
        </div>

        {/* Outcome calculator */}
        {selected === "outcome" && (
          <div className="bg-white border border-gray-100 rounded-2xl p-7 mb-6 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
            <p className="text-sm font-semibold text-gray-900 mb-4">Your recovery estimate</p>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
              <div className="flex-1 w-full">
                <label className="text-xs text-gray-500 block mb-2">Monthly failed payments ($)</label>
                <input
                  type="range"
                  min={500} max={20000} step={500}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full accent-gray-900"
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
                <p className="text-xl font-extrabold text-gray-900">${amount.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">Failed/mo</p>
              </div>
              <div className="bg-[#ECFDF5] rounded-xl p-4 border border-emerald-100">
                <p className="text-xl font-extrabold text-emerald-700">${(amount * 0.6).toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">Recovered (60%)</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-xl font-extrabold text-gray-900">${netGain.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">Net gain after ${fee} fee</p>
              </div>
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="space-y-3">
          {selected === "outcome" && (
            <a
              href={`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/auth/stripe?pricing_model=outcome`}
              className="block w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-4 rounded-xl text-center text-base transition-colors"
            >
              Connect Stripe — start recovering free →
            </a>
          )}
          {selected === "flat" && (
            <a
              href="https://cal.com/anjalipal/hamrin-demo"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-[#2ECC88] hover:bg-[#25b578] text-gray-900 font-bold py-4 rounded-xl text-center text-base transition-colors"
            >
              Book a call to start Flat plan →
            </a>
          )}
          {selected === "ltd" && (
            <a
              href="https://cal.com/anjalipal/hamrin-demo"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-4 rounded-xl text-center text-base transition-colors"
            >
              Book a call to claim your LTD spot →
            </a>
          )}

          <p className="text-center text-xs text-gray-400">
            {selected === "outcome"
              ? "No credit card needed. Connect Stripe in 60 seconds."
              : "No commitment on the call — just a 20-min chat with the founder."}
          </p>
        </div>

        {/* Trust strip */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-gray-500">
          {["Visa/MC compliant", "GDPR ready", "No upfront cost on Outcome", "Cancel anytime"].map((item) => (
            <span key={item} className="flex items-center gap-2">{CHECK}{item}</span>
          ))}
        </div>

      </div>
    </div>
  );
}
