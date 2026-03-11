import Link from "next/link";
import { PricingSection } from "@/components/pricing-section";
import { HamrinFeatureStepsDemo } from "@/components/blocks/feature-section";

const CHECK = (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="shrink-0">
    <circle cx="9" cy="9" r="9" fill="#2ECC88" />
    <path d="M5 9.5l2.5 2.5 5.5-5.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const FEATURES = [
  {
    tag: "Cancel Flows",
    tagColor: "bg-violet-100 text-violet-700",
    title: "Stop cancellations before they happen",
    desc: "When a customer clicks cancel, Hamrin intercepts with a personalised offer — pause, discount, or feedback. Turn churns into saves in real time.",
    visual: (
      <div className="flex flex-col gap-2 px-2">
        <div className="bg-violet-100 rounded-lg p-3 text-[11px] font-semibold text-violet-700">Subscriber wants to cancel…</div>
        <div className="bg-white border border-gray-100 rounded-lg p-3 text-[11px] text-gray-600">Hamrin shows: <strong className="text-gray-900">Pause for 1 month?</strong></div>
        <div className="bg-[#2ECC88] rounded-lg p-3 text-[11px] font-bold text-white text-center">✓ Saved — subscription retained</div>
      </div>
    ),
    bg: "bg-[#F3F0FF]",
  },
  {
    tag: "Payment Recovery",
    tagColor: "bg-emerald-100 text-emerald-700",
    title: "Recover failed payments automatically",
    desc: "Smart retry engine re-attempts declined cards at optimal times. Card updater catches expirations before they fail. Up to 72% recovery rate.",
    visual: (
      <div className="flex items-end gap-1.5 h-16 px-2">
        {[35, 50, 40, 65, 55, 80, 70, 90].map((h, i) => (
          <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, background: i >= 5 ? '#2ECC88' : '#A7F3D0' }} />
        ))}
      </div>
    ),
    bg: "bg-[#ECFDF5]",
  },
  {
    tag: "Reactivation",
    tagColor: "bg-yellow-100 text-yellow-700",
    title: "Win back churned customers automatically",
    desc: "3-email win-back sequence fires 3, 7, and 14 days after churn. Each email has a personal offer. One click reactivates the subscription.",
    visual: (
      <div className="flex flex-col gap-2 px-2">
        {[
          { d: "Day 3", msg: "We miss you — come back?" },
          { d: "Day 7", msg: "Here's 20% off to return" },
          { d: "Day 14", msg: "Last chance — 30% off" },
        ].map((e) => (
          <div key={e.d} className="flex items-center gap-2 bg-white/80 rounded-lg px-3 py-2">
            <span className="text-[10px] font-bold text-yellow-600 w-10">{e.d}</span>
            <span className="text-[11px] text-gray-600">{e.msg}</span>
          </div>
        ))}
      </div>
    ),
    bg: "bg-[#FEFCE8]",
  },
  {
    tag: "Payment Wall",
    tagColor: "bg-blue-100 text-blue-700",
    title: "Block access until payment is updated",
    desc: "Embed one script tag. If a customer has an open failed payment, Hamrin shows a recovery banner. Supports banner, modal, and full blocking modes.",
    visual: (
      <div className="bg-white/80 rounded-lg p-3 border border-gray-100">
        <p className="text-[11px] font-semibold text-gray-800 mb-2">⚠ Your account access is limited</p>
        <p className="text-[10px] text-gray-500 mb-2.5">Update your card to restore full access.</p>
        <div className="bg-[#4361EE] rounded-lg px-3 py-1.5 text-[11px] font-bold text-white text-center">Update card →</div>
      </div>
    ),
    bg: "bg-[#EFF6FF]",
  },
  {
    tag: "Analytics",
    tagColor: "bg-gray-100 text-gray-600",
    title: "Every retention metric in one place",
    desc: "Recovery by source, cancel flow save rate, reactivation win-back rate, Visa compliance, GDPR retention — all live, all in one dashboard.",
    visual: (
      <div className="grid grid-cols-2 gap-2 px-1">
        {[
          { label: "Save Rate", val: "48%", color: "text-violet-700" },
          { label: "Recovery",  val: "72%", color: "text-emerald-700" },
          { label: "Win-back",  val: "31%", color: "text-yellow-600" },
          { label: "Visa",      val: "SAFE", color: "text-blue-600"   },
        ].map((s) => (
          <div key={s.label} className="bg-white/80 rounded-lg p-2.5 text-center">
            <p className={`text-base font-extrabold ${s.color}`}>{s.val}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
    ),
    bg: "bg-gray-50",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-[family-name:var(--font-inter)]">

      {/* ─── ANNOUNCEMENT BAR ─── */}
      <div className="bg-gray-900 text-white text-center text-sm py-2.5 px-4 font-medium">
        <span className="text-[#2ECC88] font-bold">New:</span> Cancel Flow + Reactivation Campaigns now live →{" "}
        <Link href="/onboard" className="underline underline-offset-2 hover:no-underline">Connect Stripe free</Link>
      </div>

      {/* ─── NAVIGATION ─── */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-[1200px] mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#2ECC88] flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-[15px] font-extrabold text-gray-900 tracking-tight">hamrin<span className="text-[#2ECC88]">.ai</span></span>
          </Link>

          <div className="flex items-center gap-7">
            <a href="#features" className="text-[14px] text-gray-500 hover:text-gray-900 transition-colors hidden md:inline">Features</a>
            <a href="#compare" className="text-[14px] text-gray-500 hover:text-gray-900 transition-colors hidden md:inline">Compare</a>
            <a href="#pricing" className="text-[14px] text-gray-500 hover:text-gray-900 transition-colors hidden md:inline">Pricing</a>
            <Link href="/onboard" className="text-[14px] text-gray-500 hover:text-gray-900 transition-colors hidden md:inline">Sign In</Link>
            <a
              href={`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/auth/stripe`}
              className="bg-gray-900 hover:bg-gray-800 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-colors"
            >
              Connect Stripe free →
            </a>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="bg-white pt-16 pb-12 sm:pt-20">
        <div className="max-w-[1200px] mx-auto px-6 grid md:grid-cols-[1fr_1.05fr] gap-12 lg:gap-20 items-center">

          {/* LEFT */}
          <div>
            {/* Identity badge */}
            <div className="inline-flex items-center gap-2 bg-gray-100 rounded-full px-3.5 py-1.5 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2ECC88]" />
              <span className="text-xs font-semibold text-gray-600 tracking-wide">Stripe Retention OS</span>
            </div>

            <h1 className="text-[3rem] sm:text-[3.75rem] lg:text-[4.25rem] font-black text-gray-900 leading-[1.04] tracking-tight">
              The complete
              <br />
              retention stack
              <br />
              <span className="text-[#2ECC88]">for Stripe.</span>
            </h1>
            <p className="mt-5 text-[16px] text-gray-500 max-w-[420px] leading-relaxed">
              Cancel flows, payment recovery, reactivation campaigns, and a payment wall — all in one. Connect once, retain forever.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-start gap-3">
              <a
                href={`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/auth/stripe`}
                className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-bold px-7 py-3.5 rounded-xl text-[15px] transition-colors"
              >
                Connect Stripe free
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10m0 0L9 4m4 4L9 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </a>
              <a
                href="https://cal.com/anjalipal/hamrin-demo"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-800 font-semibold px-3 py-3.5 text-[15px] transition-colors"
              >
                Book a 20-min demo →
              </a>
            </div>

            {/* Social proof */}
            <p className="mt-6 text-xs text-gray-400 flex items-center gap-2">
              <span className="flex -space-x-1.5">
                {["#2ECC88","#4361EE","#FBBF24","#F87171"].map((c) => (
                  <span key={c} className="w-6 h-6 rounded-full border-2 border-white" style={{ background: c }} />
                ))}
              </span>
              Trusted by 40+ subscription founders
            </p>
          </div>

          {/* RIGHT — 5-feature grid */}
          <div className="grid grid-cols-2 gap-3">
            {FEATURES.slice(0, 4).map((f) => (
              <div key={f.tag} className={`${f.bg} rounded-[20px] p-5 flex flex-col gap-3`}>
                <span className={`inline-flex self-start text-[11px] font-semibold px-2.5 py-1 rounded-full ${f.tagColor}`}>{f.tag}</span>
                <p className="text-[13px] font-bold text-gray-900 leading-snug">{f.title.split(" ").slice(0, 4).join(" ")}…</p>
                <div className="mt-auto">{f.visual}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── BASELINE STATS STRIP ─── */}
      <section className="py-10 border-t border-gray-100 bg-white">
        <div className="max-w-[800px] mx-auto px-6">
          <p className="text-center text-[11px] font-semibold text-gray-400 tracking-[0.2em] uppercase mb-8">
            A baseline hamrin experience
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
            {["32% Involuntary Churn Drop", "14% Avg. LTV Increase", "72% Recovered Payments", "3× faster than Churnkey"].map((stat) => (
              <div key={stat} className="flex items-center gap-2.5 text-[14px] text-gray-700 font-medium">
                {CHECK}{stat}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURE STEPS (animated) ─── */}
      <div id="features">
        <HamrinFeatureStepsDemo />
      </div>

      {/* ─── 5 FEATURE DEEP DIVES ─── */}
      <section className="py-20 sm:py-24 bg-white">
        <div className="max-w-[1100px] mx-auto px-6 space-y-24">
          {FEATURES.map((f, i) => (
            <div
              key={f.tag}
              className={`grid md:grid-cols-2 gap-12 md:gap-16 items-center ${i % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""}`}
            >
              {/* Text */}
              <div>
                <span className={`inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full mb-5 ${f.tagColor}`}>{f.tag}</span>
                <h2 className="text-[1.75rem] sm:text-[2.125rem] font-extrabold text-gray-900 leading-tight tracking-tight mb-4">
                  {f.title}
                </h2>
                <p className="text-gray-500 leading-relaxed text-[15px]">{f.desc}</p>
                <a
                  href={`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/auth/stripe`}
                  className="mt-7 inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors"
                >
                  Connect Stripe free →
                </a>
              </div>

              {/* Visual card */}
              <div className={`${f.bg} rounded-[24px] p-8 flex items-center justify-center min-h-[220px]`}>
                <div className="w-full max-w-[280px]">{f.visual}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── TESTIMONIAL ─── */}
      <section className="py-20 sm:py-24 bg-[#F0F4FF]">
        <div className="max-w-[750px] mx-auto px-6 text-center">
          <blockquote className="text-xl sm:text-2xl font-bold text-gray-900 leading-relaxed">
            &ldquo;I have been <span className="underline decoration-[#2ECC88] decoration-2 underline-offset-4">astounded by the customer service</span> Hamrin has provided us… the team has{" "}
            <span className="underline decoration-[#2ECC88] decoration-2 underline-offset-4">delivered on every promise</span> and this will be{" "}
            <span className="underline decoration-[#2ECC88] decoration-2 underline-offset-4">a complete game changer</span> for our business. 10/10.&rdquo;
          </blockquote>
          <div className="mt-8 flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#2ECC88] flex items-center justify-center text-sm font-bold text-white">CB</div>
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-900">Charley Burtwistle</p>
              <p className="text-sm text-gray-500">Senior Director, Buildertrend</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── COMPETITIVE COMPARISON ─── */}
      <section id="compare" className="py-20 sm:py-24 bg-white">
        <div className="max-w-[900px] mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-[11px] font-semibold text-gray-400 tracking-[0.2em] uppercase mb-3">Why not Churnkey?</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Same outcomes. A fraction of the cost.
            </h2>
            <p className="mt-3 text-gray-500 text-[15px]">Churnkey charges $300–$990/mo before you recover a single dollar. Lamrin starts at $0.</p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)]">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-[0.06em]">Feature</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-[0.06em]">Churnkey</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-[#2ECC88] uppercase tracking-[0.06em]">hamrin</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "Starting price",     churnkey: "$300/mo",      hamrin: "$0 (Outcome)",       hamrinGood: true },
                  { feature: "Cancel flows",        churnkey: "✓",            hamrin: "✓",                  hamrinGood: true },
                  { feature: "Payment recovery",    churnkey: "✓",            hamrin: "✓",                  hamrinGood: true },
                  { feature: "Reactivation emails", churnkey: "✓",            hamrin: "✓",                  hamrinGood: true },
                  { feature: "Payment wall",        churnkey: "✓",            hamrin: "✓",                  hamrinGood: true },
                  { feature: "GDPR / PSD3 ready",  churnkey: "Partial",      hamrin: "✓ Built-in",         hamrinGood: true },
                  { feature: "Visa compliance",     churnkey: "Manual",       hamrin: "✓ Auto-tracked",     hamrinGood: true },
                  { feature: "Lifetime deal",       churnkey: "✗",            hamrin: "$749 one-time",      hamrinGood: true },
                  { feature: "Flat rate option",    churnkey: "From $300/mo", hamrin: "$99/mo",             hamrinGood: true },
                ].map((row, i) => (
                  <tr key={row.feature} className={`border-b border-gray-50 ${i % 2 === 0 ? "" : "bg-gray-50/40"}`}>
                    <td className="px-6 py-3.5 text-sm font-medium text-gray-700">{row.feature}</td>
                    <td className="px-6 py-3.5 text-sm text-center text-gray-400">{row.churnkey}</td>
                    <td className={`px-6 py-3.5 text-sm text-center font-semibold ${row.hamrinGood ? "text-emerald-700" : "text-gray-500"}`}>{row.hamrin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-center text-xs text-gray-400 mt-5">
            Churnkey pricing sourced from their public pricing page, March 2026. Subject to change.
          </p>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <PricingSection />

      {/* ─── CTA ─── */}
      <section className="py-20 sm:py-24 bg-gray-900">
        <div className="max-w-[600px] mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2ECC88]" />
            <span className="text-xs font-semibold text-gray-300 tracking-wide">Stripe Retention OS</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4 tracking-tight">
            Start recovering revenue today.
          </h2>
          <p className="text-gray-400 mb-8 leading-relaxed text-[15px]">
            I&apos;m Anjali — founder. Book a 20-min call and I&apos;ll audit your Stripe for free and show you exactly what&apos;s leaking.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href={`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/auth/stripe`}
              className="inline-flex items-center gap-2 bg-[#2ECC88] hover:bg-[#25b578] text-gray-900 font-bold px-7 py-3.5 rounded-xl text-[15px] transition-colors"
            >
              Connect Stripe free →
            </a>
            <a
              href="https://cal.com/anjalipal/hamrin-demo"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white font-semibold px-3 py-3.5 text-[15px] transition-colors"
            >
              Book a free audit →
            </a>
          </div>
          <p className="mt-4 text-xs text-gray-500">No credit card needed. Connects in 60 seconds.</p>
        </div>
      </section>

      {/* ─── COMPLIANCE STRIP ─── */}
      <section className="py-5 border-t border-gray-100 bg-white">
        <div className="max-w-[900px] mx-auto px-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-gray-500">
          {["Visa safe (card-fingerprint limits)", "Mastercard compliant", "GDPR ready (18-month EU retention)", "PSD3 / PSR 2026"].map((item) => (
            <span key={item} className="flex items-center gap-2">{CHECK}{item}</span>
          ))}
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-gray-100 bg-white px-6 py-10">
        <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#2ECC88] flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <span className="text-[15px] font-extrabold text-gray-900 tracking-tight">hamrin<span className="text-[#2ECC88]">.ai</span></span>
              <p className="text-xs text-gray-400 mt-0.5">Stripe Retention OS · Built by Anjali Pal · 2026</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-6 text-sm text-gray-500">
            <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
            <a href="#compare" className="hover:text-gray-900 transition-colors">Compare</a>
            <a href="#pricing" className="hover:text-gray-900 transition-colors">Pricing</a>
            <Link href="/onboard" className="hover:text-gray-900 transition-colors">Get started</Link>
            <Link href="/api/status" className="hover:text-gray-900 transition-colors">Status</Link>
            <a href="https://cal.com/anjalipal/hamrin-demo" target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 transition-colors">Book a call</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
