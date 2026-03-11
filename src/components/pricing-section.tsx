import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";

const PLATFORM_LTD_ID = "platform_ltd";

async function getLtdCount() {
  try {
    const installation = await prisma.installation.findUnique({
      where: { stripeAccountId: PLATFORM_LTD_ID },
      select: { id: true },
    });
    if (!installation) return { sold: 0, total: 50 };
    const inv = await prisma.ltdInventory.findUnique({
      where: { installationId: installation.id },
      select: { ltdSold: true, maxCapacity: true },
    });
    return { sold: inv?.ltdSold ?? 0, total: inv?.maxCapacity ?? 50 };
  } catch {
    return { sold: 0, total: 50 };
  }
}

const CHECK = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 mt-0.5">
    <circle cx="7" cy="7" r="7" fill="#2ECC88" />
    <path d="M4 7l2 2 4-4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export async function PricingSection() {
  const { sold, total } = await getLtdCount();
  const spotsLeft = Math.max(0, total - sold);
  const ltdHref = env.STRIPE_LTD_PAYMENT_LINK || "https://cal.com/anjalipal/hamrin-demo";
  const isPaymentLink = !!env.STRIPE_LTD_PAYMENT_LINK;

  return (
    <section id="pricing" className="py-20 sm:py-24 bg-[#F0F4FF]">
      <div className="max-w-[1000px] mx-auto px-6">

        <div className="text-center mb-14">
          <p className="text-[11px] font-semibold text-gray-400 tracking-[0.2em] uppercase mb-3">Pricing</p>
          <h2 className="text-3xl sm:text-[2.5rem] font-extrabold text-gray-900 tracking-tight">
            Start free. Pay when you win.
          </h2>
          <p className="mt-3 text-gray-500 text-[15px]">
            Churnkey charges $300–$990/mo before you recover a dollar. Hamrin starts at $0.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-5">

          {/* ── Outcome (free) ── */}
          <div className="bg-white border border-gray-100 rounded-2xl p-7 shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)]">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.1em] mb-1">Outcome</p>
            <p className="text-xs text-gray-500 mb-5">Zero risk. Pay only on recovered revenue.</p>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-[2.5rem] font-extrabold text-gray-900 leading-none">$0</span>
              <span className="text-gray-400 text-sm">upfront</span>
            </div>
            <p className="text-[#2ECC88] text-sm font-bold mb-6">+ 10% of recovered revenue</p>
            <a
              href={`${env.NEXT_PUBLIC_APP_URL}/api/auth/stripe?pricing_model=outcome`}
              className="block w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 rounded-xl text-sm text-center transition-colors mb-5"
            >
              Connect Stripe free →
            </a>
            <ul className="space-y-2.5 text-sm text-gray-600">
              {[
                "Smart retry engine",
                "Cancel flow widget",
                "Reactivation campaigns",
                "Payment wall snippet",
                "Recovery emails",
                "Pre-dunning alerts",
                "Visa / MC compliant",
                "GDPR auto-purge",
                "Retention dashboard",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">{CHECK}{item}</li>
              ))}
            </ul>
          </div>

          {/* ── Flat $99/mo (highlighted) ── */}
          <div className="bg-white border-2 border-[#2ECC88] rounded-2xl p-7 shadow-[0_4px_24px_rgba(46,204,136,0.15)] relative">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span className="inline-flex items-center gap-1 bg-[#2ECC88] text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-sm">
                Most popular
              </span>
            </div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.1em] mb-1">Flat</p>
            <p className="text-xs text-gray-500 mb-5">Predictable cost. Best for $30K+ MRR.</p>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-[2.5rem] font-extrabold text-gray-900 leading-none">$99</span>
              <span className="text-gray-400 text-sm">/mo</span>
            </div>
            <p className="text-gray-500 text-sm mb-6">Flat rate · unlimited recoveries</p>
            <a
              href="https://cal.com/anjalipal/hamrin-demo"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-[#2ECC88] hover:bg-[#25b578] text-gray-900 font-bold py-3 rounded-xl text-sm text-center transition-colors mb-5"
            >
              Book a call to start →
            </a>
            <p className="text-xs font-semibold text-gray-700 mb-3">Everything in Outcome, plus:</p>
            <ul className="space-y-2.5 text-sm text-gray-600">
              {[
                "No % fee ever",
                "Unlimited recoveries",
                "Priority support",
                "Advanced analytics",
                "API access",
                "Custom branding",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">{CHECK}{item}</li>
              ))}
            </ul>
          </div>

          {/* ── LTD $749 ── */}
          <div className="bg-white border border-gray-100 rounded-2xl p-7 shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)]">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.1em] mb-1">Lifetime Deal</p>
            <p className="text-xs text-gray-500 mb-5">No % fee ever. Best for serious founders.</p>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-[2.5rem] font-extrabold text-gray-900 leading-none">$749</span>
              <span className="text-gray-400 text-sm line-through ml-1">$999</span>
            </div>
            <p className="text-gray-500 text-sm mb-6">
              one-time · {spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} left
              {sold > 0 && <span className="text-gray-400"> ({sold}/{total} sold)</span>}
            </p>
            <a
              href={ltdHref}
              target={isPaymentLink ? "_blank" : undefined}
              rel={isPaymentLink ? "noopener noreferrer" : undefined}
              className="block w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 rounded-xl text-sm text-center transition-colors mb-5"
            >
              {isPaymentLink ? "Buy LTD $749 →" : "Book a call to claim →"}
            </a>
            <p className="text-xs font-semibold text-gray-700 mb-3">Everything in Flat, plus:</p>
            <ul className="space-y-2.5 text-sm text-gray-600">
              {[
                "Lifetime access",
                "All future features",
                "1:1 onboarding call",
                "Founder-level support",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">{CHECK}{item}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Quick math strip */}
        <div className="mt-8 bg-white border border-gray-100 rounded-2xl p-6 text-center shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
          <p className="text-gray-600 text-sm">
            <span className="text-gray-900 font-semibold">Quick math:</span>{" "}
            $5,000 failed/mo → we recover 60% → you get $3,000 back → you pay us $300.{" "}
            <span className="text-[#2ECC88] font-semibold">Net gain: $2,700.</span>{" "}
            <span className="text-gray-400">Or pay $99/mo flat and keep it all.</span>
          </p>
        </div>

      </div>
    </section>
  );
}
