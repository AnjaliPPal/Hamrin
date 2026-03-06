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

export async function PricingSection() {
  const { sold, total } = await getLtdCount();
  const spotsLeft = Math.max(0, total - sold);
  const ltdHref = env.STRIPE_LTD_PAYMENT_LINK || "https://cal.com/anjalipal/hamrin-demo";
  const isPaymentLink = !!env.STRIPE_LTD_PAYMENT_LINK;

  return (
    <section id="pricing" className="py-20 sm:py-24 bg-gray-50">
      <div className="max-w-[1000px] mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="font-[family-name:var(--font-lora)] text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            How much do you value your revenue?
          </h2>
          <p className="mt-3 text-gray-500">We only make money when you make money.</p>
        </div>

        <div className="grid sm:grid-cols-3 gap-5">
          {/* Outcome */}
          <div className="bg-white border border-gray-200 rounded-2xl p-7 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-sm font-semibold text-gray-900 mb-1">Outcome</p>
            <p className="text-xs text-gray-500 mb-5">You have zero risk. Pay only on recovered revenue.</p>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-4xl font-bold text-gray-900">$0</span>
              <span className="text-gray-400 text-sm">upfront</span>
            </div>
            <p className="text-green-600 text-sm font-semibold mb-6">+ 10% of recovered revenue</p>
            <a
              href={`${env.NEXT_PUBLIC_APP_URL}/api/auth/stripe`}
              className="block w-full bg-[#1e40af] hover:bg-[#1e3b96] text-white font-semibold py-3 rounded-lg text-sm text-center transition-colors mb-4"
            >
              Get started for free →
            </a>
            <p className="text-xs text-gray-400 mb-5 flex items-center gap-1.5">
              <span className="text-green-500">✓</span> 800 credits, then pay as-you-go
            </p>
            <ul className="space-y-2.5 text-sm text-gray-600">
              {["Smart retry engine", "Recovery emails", "Pre-dunning alerts", "Churn dashboard", "Visa/MC compliant", "GDPR auto-purge", "Unlimited team members"].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="text-gray-400">✓</span> {item}
                </li>
              ))}
            </ul>
          </div>

          {/* LTD (highlighted) */}
          <div className="bg-white border-2 border-green-500 rounded-2xl p-7 shadow-sm hover:shadow-md transition-shadow relative">
            <p className="text-sm font-semibold text-gray-900 mb-1">Lifetime Deal</p>
            <p className="text-xs text-gray-500 mb-5">No % fee ever. Best for serious founders.</p>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-4xl font-bold text-gray-900">$749</span>
              <span className="text-gray-400 text-sm line-through ml-1">$999</span>
            </div>
            <p className="text-gray-500 text-sm mb-6">
              one-time · {spotsLeft} spots left
              {sold > 0 && <span className="text-gray-400"> ({sold}/{total} sold)</span>}
            </p>
            <a
              href={ltdHref}
              target={isPaymentLink ? "_blank" : undefined}
              rel={isPaymentLink ? "noopener noreferrer" : undefined}
              className="block w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg text-sm text-center transition-colors mb-4"
            >
              {isPaymentLink ? "Buy LTD $749 →" : "Book a call to claim →"}
            </a>
            <p className="text-xs text-gray-400 mb-5 flex items-center gap-1.5">
              <span className="text-green-500">✓</span> 1,600 credits, then pay as-you-go
            </p>
            <p className="text-xs font-semibold text-gray-700 mb-3">Everything in Outcome, plus:</p>
            <ul className="space-y-2.5 text-sm text-gray-600">
              {["No % fee ever", "Unlimited recoveries", "Priority support", "AI autopilot mode", "Analytics", "API access", "Premium support"].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Enterprise */}
          <div className="bg-white border border-gray-200 rounded-2xl p-7 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-sm font-semibold text-gray-900 mb-1">Enterprise</p>
            <p className="text-xs text-gray-500 mb-5">Enterprise-level security and advanced options.</p>
            <div className="mb-1">
              <span className="text-sm text-gray-500">Contact us</span>
              <br />
              <span className="text-sm text-gray-400">for pricing</span>
            </div>
            <div className="mb-6" />
            <a
              href="https://cal.com/anjalipal/hamrin-demo"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-white border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold py-3 rounded-lg text-sm text-center transition-colors mb-4"
            >
              Contact us →
            </a>
            <p className="text-xs text-gray-400 mb-5 flex items-center gap-1.5">
              <span className="text-green-500">✓</span> 5k credits, then pay as-you-go
            </p>
            <p className="text-xs font-semibold text-gray-700 mb-3">Everything in Pro, plus:</p>
            <ul className="space-y-2.5 text-sm text-gray-600">
              {["Unlimited spaces", "1:1 onboarding", "Higher storage limits", "Enterprise security", "Team usage analytics"].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm">
          <p className="text-gray-600 text-sm">
            <span className="text-gray-900 font-semibold">Quick math:</span> $5,000 failed/mo → we recover 60% → you get $3,000 back → you pay us $300.{" "}
            <span className="text-green-600 font-semibold">Net gain: $2,700.</span>
          </p>
        </div>
      </div>
    </section>
  );
}
