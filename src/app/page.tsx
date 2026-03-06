import Link from "next/link";
import { PricingSection } from "@/components/pricing-section";

const CHECK_ICON = (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="shrink-0">
    <circle cx="10" cy="10" r="10" fill="#22c55e" />
    <path d="M6 10.5l2.5 2.5 5.5-5.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-[family-name:var(--font-inter)]">
      {/* ─── ANNOUNCEMENT BAR ─── */}
      <div className="bg-[#1e40af] text-white text-center text-sm py-2.5 px-4 font-semibold tracking-wide">
        New: Stripe Connect one-click setup is live →
      </div>

      {/* ─── NAVIGATION ─── */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-[1200px] mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5">
            <span className="text-xl font-bold tracking-tight text-gray-900">
              hamrin<span className="text-[#eab308]">.ai</span>
            </span>
          </Link>
          <div className="flex items-center gap-8">
            <a href="#features" className="text-[15px] text-gray-600 hover:text-gray-900 transition-colors hidden md:inline">
              Features
            </a>
            <a href="#pricing" className="text-[15px] text-gray-600 hover:text-gray-900 transition-colors hidden md:inline">
              Pricing
            </a>
            <Link href="/onboard" className="text-[15px] text-gray-600 hover:text-gray-900 transition-colors hidden md:inline">
              Sign In
            </Link>
            <Link
              href="/onboard"
              className="bg-[#1e40af] hover:bg-[#1e3b96] text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors"
            >
              Get a Demo
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#fdf8ef] via-[#fefcf7] to-white pointer-events-none" />
        <div className="relative max-w-[800px] mx-auto px-6 pt-20 sm:pt-28 pb-14 text-center">
          <h1 className="font-[family-name:var(--font-lora)] text-[2.75rem] sm:text-[3.5rem] md:text-[4rem] font-bold text-gray-900 leading-[1.1] tracking-tight">
            Stop failed payments.
            <br />
            Retain more subscribers.
          </h1>
          <p className="mt-6 text-lg text-gray-500 max-w-[600px] mx-auto leading-relaxed">
            Hamrin is retention automation for self-serve subscription companies. Fix failed payments. Reduce cancellations. Increase ARR.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/auth/stripe`}
              className="inline-flex items-center gap-2 bg-[#1e40af] hover:bg-[#1e3b96] text-white font-semibold px-7 py-3.5 rounded-lg text-[15px] transition-colors shadow-sm"
            >
              Improve Retention Now
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10m0 0L9 4m4 4L9 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </a>
            <a
              href="https://cal.com/anjalipal/hamrin-demo"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold px-7 py-3.5 rounded-lg text-[15px] transition-colors"
            >
              Talk With Us
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10m0 0L9 4m4 4L9 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </a>
          </div>
        </div>
      </section>

      {/* ─── BASELINE STATS STRIP ─── */}
      <section className="py-10 border-t border-gray-100">
        <div className="max-w-[700px] mx-auto px-6">
          <p className="text-center text-xs font-semibold text-gray-400 tracking-[0.2em] uppercase mb-8">
            A baseline Hamrin experience
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
            {[
              "32% Involuntary Churn Drop",
              "14% Avg. LTV Increase",
              "72% Recovered Payments",
            ].map((stat) => (
              <div key={stat} className="flex items-center gap-2.5 text-[15px] text-gray-700 font-medium">
                {CHECK_ICON}
                {stat}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURE CARDS (Churnkey-style pill badges) ─── */}
      <section id="features" className="py-16 sm:py-20 bg-white">
        <div className="max-w-[1100px] mx-auto px-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: "Smart Retries", desc: "Recover up to 72% of failed payments", color: "bg-red-50 text-red-600", dot: "bg-red-500" },
              { label: "Pre-Dunning", desc: "Warn customers before cards expire", color: "bg-orange-50 text-orange-600", dot: "bg-orange-500" },
              { label: "Recovery Emails", desc: "Reach customers via email & SMS", color: "bg-green-50 text-green-600", dot: "bg-green-500" },
              { label: "Churn Scores", desc: "AI-powered risk prediction 0–100", color: "bg-blue-50 text-blue-600", dot: "bg-blue-500" },
              { label: "Card Updater", desc: "Auto-detect new card details", color: "bg-purple-50 text-purple-600", dot: "bg-purple-500" },
              { label: "Compliance", desc: "Visa/MC & GDPR compliant", color: "bg-pink-50 text-pink-600", dot: "bg-pink-500" },
            ].map((f) => (
              <div key={f.label} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${f.color} mb-3`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${f.dot}`} />
                  {f.label}
                </div>
                <p className="text-sm text-gray-500 leading-snug">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TRUSTED BY ─── */}
      <section className="py-12 border-t border-gray-100">
        <div className="max-w-[1000px] mx-auto px-6">
          <p className="text-center text-xs font-semibold text-gray-400 tracking-[0.2em] uppercase mb-10">
            Trusted by these customer-obsessed teams......
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6 opacity-60 grayscale">
            {["Stripe", "Vercel", "Prisma", "Neon", "Resend", "Upstash", "Brevo", "Twilio"].map((name) => (
              <span key={name} className="text-lg sm:text-xl font-bold text-gray-800 tracking-tight">
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PAYMENT RECOVERY DEEP DIVE (Churnkey product page style) ─── */}
      <section className="py-20 sm:py-24 bg-white">
        <div className="max-w-[1100px] mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-start">
            {/* Left: Text */}
            <div>
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-amber-600 mb-4">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2l2.09 4.26L17 7.27l-3.5 3.41.83 4.82L10 13.27 5.67 15.5l.83-4.82L3 7.27l4.91-1.01L10 2z" fill="#eab308" /></svg>
                Payment Recovery
              </div>
              <h2 className="font-[family-name:var(--font-lora)] text-[1.75rem] sm:text-[2.125rem] font-bold text-gray-900 leading-tight">
                Solve your failed payment headaches with Payment Recovery.
              </h2>
              <p className="mt-4 text-gray-500 leading-relaxed">
                Retain more customers, capture product feedback, and increase customer loyalty.
              </p>

              <div className="mt-10 space-y-8">
                {[
                  {
                    icon: "🎯",
                    title: "Precision Retries",
                    desc: "Recover failed payments without customer intervention. Our custom, proven retry system adapts to the bespoke needs of your business.",
                  },
                  {
                    icon: "📱",
                    title: "Omnichannel campaigns",
                    desc: "When hard declines happen, reach your customers where they are: SMS, email, or in your app.",
                  },
                  {
                    icon: "🔒",
                    title: "Payment Wall",
                    desc: "Block key features in your app or product until your customer updates their payment method.",
                  },
                ].map((item) => (
                  <div key={item.title} className="flex gap-4">
                    <div className="shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg">
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{item.title}</h3>
                      <p className="mt-1 text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Mock Dashboard Cards */}
            <div className="space-y-4">
              {/* Stats Card */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                </div>
                <div className="mt-4 space-y-6">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Payments Recovered</p>
                    <p className="text-3xl font-bold text-gray-900 mt-0.5">$201,038</p>
                    <p className="text-sm text-green-600 font-medium mt-0.5">+$3,768 last 7 days</p>
                  </div>
                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-sm text-gray-500 font-medium">Subscriptions Recovered</p>
                    <p className="text-3xl font-bold text-gray-900 mt-0.5">38,297</p>
                    <p className="text-sm text-green-600 font-medium mt-0.5">89% recovery rate</p>
                  </div>
                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-sm text-gray-500 font-medium mb-3">Recovered Revenue</p>
                    <div className="flex items-end gap-1 h-20">
                      {[40, 55, 35, 60, 45, 70, 50, 65, 80, 55, 75, 90].map((h, i) => (
                        <div key={i} className="flex-1 bg-blue-500 rounded-t" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Update Widget */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-lg">
                <p className="text-sm font-semibold text-gray-900 mb-1">Hey, subscriber. Your account access is limited right now.</p>
                <p className="text-xs text-gray-500 mb-4">
                  We&apos;ve tried a number of times to charge your card on file, but it hasn&apos;t worked out.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                  <p className="text-xs font-semibold text-blue-700 flex items-center gap-1.5">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1L1 13h12L7 1z" fill="#3b82f6"/></svg>
                    Update your card to restore access.
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-700">Card Information</p>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-400">
                    1234 1234 1234 1234
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-400">Month</div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-400">Year</div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-400">CVC</div>
                  </div>
                  <button className="w-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold text-sm py-3 rounded-lg transition-colors mt-2">
                    Update Card
                  </button>
                  <p className="text-center text-xs text-gray-400 mt-1">⚙ Contact Support</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIAL (Churnkey-style: serif quote, yellow underlines) ─── */}
      <section className="py-20 sm:py-24 bg-gray-50">
        <div className="max-w-[750px] mx-auto px-6 text-center">
          <blockquote className="font-[family-name:var(--font-lora)] text-xl sm:text-2xl font-medium text-gray-900 leading-relaxed">
            &ldquo;I have been <span className="underline decoration-[#eab308] decoration-2 underline-offset-4">astounded by the customer service</span> Hamrin has provided us... the team has built and <span className="underline decoration-[#eab308] decoration-2 underline-offset-4">delivered on every promise</span> made and this will be <span className="underline decoration-[#eab308] decoration-2 underline-offset-4">a complete game changer</span> for our business. 10/10 recommend.&rdquo;
          </blockquote>
          <div className="mt-8 flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-sm font-bold text-white">
              CB
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-900">Charley Burtwistle</p>
              <p className="text-sm text-gray-500">Senior Director of Core Subscription, Buildertrend</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── MRR GROWTH SECTION (Churnkey-style bar chart visual) ─── */}
      <section className="py-20 sm:py-24 bg-[#e8f4fd]">
        <div className="max-w-[800px] mx-auto px-6 text-center">
          <h2 className="font-[family-name:var(--font-lora)] text-2xl sm:text-[2.125rem] font-bold text-gray-900 leading-tight">
            When teams want to drive more
            <br />
            revenue while understanding their
            <br />
            customers better, they use Hamrin.
          </h2>

          <div className="mt-16 relative">
            <p className="text-[#eab308] font-bold text-lg mb-4">Your MRR on Hamrin</p>
            <div className="flex items-end justify-center gap-2 h-48">
              {[20, 25, 30, 28, 35, 40, 38, 50, 55, 65, 70, 80, 85, 90, 95].map((h, i) => (
                <div
                  key={i}
                  className="w-8 sm:w-10 bg-[#3b82f6] rounded-t transition-all"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
            <div className="mt-6 flex items-center justify-center gap-3">
              <span className="text-xl font-bold text-gray-900">Add</span>
              <span className="inline-flex items-center gap-1 text-xl font-bold text-gray-900">
                <span className="w-7 h-7 bg-[#eab308] rounded-full inline-flex items-center justify-center text-white text-xs">✦</span>
                Hamrin
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CHURN METRICS SECTION ─── */}
      <section className="py-20 sm:py-24 bg-white">
        <div className="max-w-[1100px] mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-start">
            <div>
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 mb-4">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="6" width="4" height="12" rx="1" fill="#3b82f6"/><rect x="8" y="3" width="4" height="15" rx="1" fill="#3b82f6" opacity="0.7"/><rect x="14" y="8" width="4" height="10" rx="1" fill="#3b82f6" opacity="0.4"/></svg>
                Churn Metrics
              </div>
              <h2 className="font-[family-name:var(--font-lora)] text-[1.75rem] sm:text-[2.125rem] font-bold text-gray-900 leading-tight">
                Find out what churn is really costing you with Churn Metrics.
              </h2>
              <p className="mt-4 text-gray-500 leading-relaxed">
                Track churn volume, identify trends across customer cohorts, and strategize to lower churn.
              </p>

              <div className="mt-10 space-y-8">
                {[
                  { icon: "👁", title: "No strings attached", desc: "Connecting your payment provider will give us read-only snapshot of your churn data to analyze." },
                  { icon: "📊", title: "The metrics that matter", desc: "No-BS metrics that help you understand your churn problem and where to focus your efforts." },
                  { icon: "🔄", title: "Always fresh", desc: "Updated daily, so you can be sure you're always looking at the latest data." },
                ].map((item) => (
                  <div key={item.title} className="flex gap-4">
                    <div className="shrink-0 w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-lg">
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{item.title}</h3>
                      <p className="mt-1 text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <a
                href="/onboard"
                className="mt-8 inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg text-sm transition-colors"
              >
                Explore Churn Metrics
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10m0 0L9 4m4 4L9 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </a>
            </div>

            {/* Right: Metrics Dashboard Mock */}
            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-lg">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                </div>

                <div className="space-y-5">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Revenue Churn Rate</p>
                    <p className="text-3xl font-bold text-blue-600 mt-0.5">7%</p>
                    <div className="flex items-end gap-1 h-10 mt-2">
                      {[60, 70, 55, 80, 65, 75, 50].map((h, i) => (
                        <div key={i} className="flex-1 bg-blue-500 rounded-t" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-sm text-gray-500 font-medium">Revenue Churned</p>
                    <p className="text-3xl font-bold text-gray-900 mt-0.5">$2.86k</p>
                    <div className="flex items-end gap-1 h-10 mt-2">
                      {[50, 65, 45, 70, 60, 55, 75].map((h, i) => (
                        <div key={i} className="flex-1 bg-blue-500 rounded-t" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-sm text-gray-500 font-medium">Subscriptions Churned</p>
                    <p className="text-3xl font-bold text-gray-900 mt-0.5">138</p>
                    <div className="flex items-end gap-1 h-10 mt-2">
                      {[40, 55, 65, 50, 70, 60, 45].map((h, i) => (
                        <div key={i} className="flex-1 bg-blue-500 rounded-t" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Retention Heatmap */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-lg">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center text-[10px] text-white font-bold">!</span>
                  <p className="text-xs font-medium text-gray-700">Spot trends with retained subscriptions.</p>
                </div>
                <div className="space-y-1.5">
                  {[
                    { month: "JAN", vals: [99, 95] },
                    { month: "FEB", vals: [98, 96] },
                    { month: "MAR", vals: [99, 95] },
                    { month: "APR", vals: [100, 99] },
                    { month: "MAY", vals: [98, 93] },
                  ].map((row) => (
                    <div key={row.month} className="flex items-center gap-2">
                      <span className="text-[11px] font-medium text-gray-500 w-8">{row.month}</span>
                      <div className="flex gap-1.5">
                        {row.vals.map((v, i) => (
                          <span
                            key={i}
                            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                              v >= 99 ? "bg-green-100 text-green-700" :
                              v >= 95 ? "bg-green-50 text-green-600" :
                              "bg-yellow-50 text-yellow-700"
                            }`}
                          >
                            {v}%
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── PRICING (ListenUp-style 3-column) ─── */}
      <PricingSection />

      {/* ─── CTA: Book a Call ─── */}
      <section className="py-20 sm:py-24 bg-white">
        <div className="max-w-[600px] mx-auto px-6 text-center">
          <h2 className="font-[family-name:var(--font-lora)] text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            Want to see if this fits your business?
          </h2>
          <p className="text-gray-500 mb-8 leading-relaxed">
            I&apos;m Anjali — founder and CTO. Book a 20-min call and I&apos;ll show you what&apos;s leaking from your Stripe dashboard.
          </p>
          <a
            href="https://cal.com/anjalipal/hamrin-demo"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#1e40af] hover:bg-[#1e3b96] text-white font-semibold px-8 py-4 rounded-lg text-base transition-colors shadow-sm"
          >
            Schedule a free call →
          </a>
          <p className="mt-4 text-xs text-gray-400">No commitment · I&apos;ll audit your Stripe for free</p>
        </div>
      </section>

      {/* ─── COMPLIANCE STRIP ─── */}
      <section className="py-6 border-t border-gray-100">
        <div className="max-w-[900px] mx-auto px-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-gray-500">
          {[
            "Visa safe (card-fingerprint limits)",
            "Mastercard compliant",
            "GDPR ready (18-month EU retention)",
            "PSD3 / PSR 2026",
          ].map((item) => (
            <span key={item} className="flex items-center gap-2">
              {CHECK_ICON}
              {item}
            </span>
          ))}
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-gray-200 bg-white px-6 py-10">
        <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <span className="text-xl font-bold text-gray-900">
              hamrin<span className="text-[#eab308]">.ai</span>
            </span>
            <p className="text-xs text-gray-400 mt-1">Payment recovery for solo founders.</p>
          </div>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-6 text-sm text-gray-500">
            <Link href="/onboard" className="hover:text-gray-900 transition-colors">Get started</Link>
            <Link href="/api/status" className="hover:text-gray-900 transition-colors">System status</Link>
            <a href="https://cal.com/anjalipal/hamrin-demo" target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 transition-colors">Book a call</a>
            <span>Built by Anjali Pal · 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
