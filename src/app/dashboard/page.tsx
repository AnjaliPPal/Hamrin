import Link from 'next/link';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getDashboardMetrics, type DashboardMetrics } from '@/services/dashboard';
import { SendDiscountButton } from '@/components/send-discount-button';
import { SmsToggle } from '@/components/sms-toggle';
import { getSessionFromToken, isSessionEnabled, SESSION_COOKIE_NAME } from '@/lib/session';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ installation?: string }>;
}) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = getSessionFromToken(sessionToken);
  const { installation: installationIdFromQuery } = await searchParams;

  let installationId: string | null = null;
  if (isSessionEnabled()) {
    if (session) installationId = session.installationId;
    else redirect('/onboard');
  } else {
    installationId = installationIdFromQuery ?? null;
  }

  if (!installationId) redirect('/');

  const installation = await prisma.installation.findUnique({
    where: { id: installationId },
  });

  if (!installation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Installation Not Found</h1>
          <Link href="/" className="mt-4 inline-block text-blue-600 hover:underline">← Go Home</Link>
        </div>
      </div>
    );
  }

  let data: DashboardMetrics | null = null;
  try {
    data = await getDashboardMetrics(installationId);
  } catch (err) {
    console.error('Failed to load dashboard:', err);
  }

  const m = data ?? {
    totalRecovered: 0, recoveryRate: 0, preventedAmount: 0,
    visaAttempts: 0, visaLimit: 15, cardFingerprintsTracked: 0,
    topAtRiskCards: [], atRiskCustomers: [],
    gdpr: { retentionDays: 90, country: installation.country, isEU: false, nextPurgeDate: "—" },
    thisMonthFee: null, pricingModel: installation.pricingModel,
  };

  const visaPct = Math.min((m.visaAttempts / m.visaLimit) * 100, 100);
  const visaColor = m.visaAttempts >= 13 ? "bg-red-500" : m.visaAttempts >= 9 ? "bg-amber-400" : "bg-emerald-500";

  return (
    <div className="min-h-screen bg-zinc-50/50">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Recovery Dashboard</h1>
            <p className="text-zinc-500 text-sm mt-0.5">{installation.stripeAccountId.substring(0, 20)}...</p>
          </div>
          <div className="flex items-center gap-2">
            {isSessionEnabled() && (
              <Link
                href="/api/auth/logout"
                className="text-sm text-zinc-500 hover:text-zinc-700"
              >
                Log out
              </Link>
            )}
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white border border-zinc-200">
              <span className={`w-2 h-2 rounded-full mr-2 ${installation.vauEnabled ? 'bg-emerald-500' : 'bg-amber-400'}`}></span>
              VAU: {installation.vauEnabled ? 'Active' : 'Pending'}
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white border border-zinc-200">
              {installation.pricingModel.toUpperCase()}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* TOP ROW — 3 stat tiles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Recovered */}
          <div className="bg-gradient-to-br from-emerald-50 to-white rounded-xl border border-emerald-100 p-6 shadow-sm">
            <p className="text-emerald-700 text-sm font-medium mb-1">Total Recovered</p>
            <p className="text-4xl font-bold text-emerald-900 tracking-tight mb-2">
              ${m.totalRecovered.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-emerald-600">Recovery rate: <strong>{m.recoveryRate}%</strong></p>
          </div>

          {/* Visa Compliance */}
          <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <p className="text-zinc-500 text-sm font-medium">Visa Compliance</p>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                m.visaAttempts >= 13 ? "bg-red-100 text-red-700" :
                m.visaAttempts >= 9 ? "bg-amber-100 text-amber-700" :
                "bg-emerald-100 text-emerald-700"
              }`}>
                {m.visaAttempts >= 13 ? "CRITICAL" : m.visaAttempts >= 9 ? "WARNING" : "SAFE"}
              </span>
            </div>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-3xl font-bold text-zinc-900">{m.visaAttempts}</span>
              <span className="text-zinc-400 text-lg">/ {m.visaLimit}</span>
            </div>
            <div className="w-full bg-zinc-100 rounded-full h-2 overflow-hidden mb-2">
              <div className={`${visaColor} h-2 rounded-full transition-all`} style={{ width: `${visaPct}%` }} />
            </div>
            <p className="text-xs text-zinc-500">{m.cardFingerprintsTracked} card{m.cardFingerprintsTracked !== 1 ? "s" : ""} tracked</p>
          </div>

          {/* Outcome fee or Prevented */}
          <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
            {m.pricingModel === "outcome" && m.thisMonthFee !== null ? (
              <>
                <p className="text-zinc-500 text-sm font-medium mb-3">This Month Fee (10%)</p>
                <div className="text-3xl font-bold text-zinc-900 mb-1">${m.thisMonthFee.toFixed(2)}</div>
                <p className="text-xs text-zinc-500">10% of recovered revenue</p>
              </>
            ) : (
              <>
                <p className="text-zinc-500 text-sm font-medium mb-3">Auto-Prevention</p>
                <div className="text-3xl font-bold text-zinc-900 mb-1">${m.preventedAmount.toLocaleString()}</div>
                <p className="text-xs text-zinc-500">Saved via Account Updater</p>
              </>
            )}
          </div>
        </div>

        {/* CARD-LEVEL COMPLIANCE — only show if there are attempts */}
        {m.topAtRiskCards.length > 0 && (
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
            <h2 className="text-base font-semibold text-zinc-900 mb-4">Card-Level Retry Compliance (Visa 15/30d)</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {m.topAtRiskCards.map((card) => (
                <div key={card.fingerprint} className={`rounded-lg p-3 border ${
                  card.riskLevel === "red" ? "bg-red-50 border-red-200" :
                  card.riskLevel === "yellow" ? "bg-amber-50 border-amber-200" :
                  "bg-zinc-50 border-zinc-200"
                }`}>
                  <p className="text-xs font-mono text-zinc-600">{card.fingerprint}</p>
                  <p className="text-lg font-bold text-zinc-900 mt-1">{card.attempts}<span className="text-xs text-zinc-400">/15</span></p>
                  <div className="w-full bg-white rounded-full h-1.5 mt-1 overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full ${card.riskLevel === "red" ? "bg-red-500" : card.riskLevel === "yellow" ? "bg-amber-400" : "bg-emerald-500"}`}
                      style={{ width: `${Math.min((card.attempts / 15) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AT-RISK CUSTOMERS */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-200 flex justify-between items-center">
            <div>
              <h2 className="text-base font-semibold text-zinc-900">At-Risk Customers</h2>
              <p className="text-sm text-zinc-500 mt-0.5">Churn probability &gt; 65 — act now</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            {m.atRiskCustomers.length === 0 ? (
              <div className="px-6 py-8 text-center text-zinc-400 text-sm">No at-risk customers right now.</div>
            ) : (
              <table className="w-full">
                <thead className="bg-zinc-50/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Risk</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Failed</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {m.atRiskCustomers.map((user) => (
                    <tr key={user.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-zinc-700">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${
                          user.riskScore > 85 ? 'bg-red-100 text-red-800' :
                          user.riskScore > 65 ? 'bg-amber-100 text-amber-800' :
                          'bg-zinc-100 text-zinc-700'
                        }`}>{user.riskScore}/100</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-600">${user.amount.toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm text-zinc-500">{user.lastAttempt}</td>
                      <td className="px-6 py-4 text-right">
                        <SendDiscountButton
                          failedPaymentId={user.id}
                          installationId={installationId}
                          alreadySent={!!user.discountOfferSentAt}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* BOTTOM ROW — Compliance + GDPR + Settings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Connection Status */}
          <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-zinc-900 mb-4">Connection Status</h3>
            <div className="space-y-3">
              {[
                { label: "Visa VAU", active: installation.vauEnabled },
                { label: "Mastercard ABU", active: installation.abuEnabled },
              ].map(({ label, active }) => (
                <div key={label} className="flex items-center">
                  <span className={`w-2 h-2 rounded-full mr-2 ${active ? "bg-emerald-500" : "bg-amber-400"}`} />
                  <span className="text-sm text-zinc-600">{label}: <strong className="text-zinc-900">{active ? "Enabled" : "Pending"}</strong></span>
                </div>
              ))}
              <div className="flex items-center">
                <span className="w-2 h-2 rounded-full mr-2 bg-blue-500" />
                <span className="text-sm text-zinc-600">Card fingerprint tracking: <strong className="text-zinc-900">Active</strong></span>
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-zinc-900 mb-4">Settings</h3>
            <div className="space-y-3">
              <SmsToggle installationId={installationId} initialEnabled={installation.smsEnabled} />
              <p className="text-xs text-zinc-500">When enabled, SMS is sent after email fails to reach the customer.</p>
            </div>
          </div>

          {/* GDPR / Data Retention */}
          <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-zinc-900 mb-4">Data Compliance (GDPR / PSD3)</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <span className="w-2 h-2 rounded-full mr-2 bg-purple-500" />
                <span className="text-sm text-zinc-600">
                  Region: <strong className="text-zinc-900">{m.gdpr.country} {m.gdpr.isEU ? "(EU)" : "(US/Other)"}</strong>
                </span>
              </div>
              <div className="flex items-center">
                <span className="w-2 h-2 rounded-full mr-2 bg-emerald-500" />
                <span className="text-sm text-zinc-600">
                  Retention: <strong className="text-zinc-900">{m.gdpr.retentionDays} days ({m.gdpr.isEU ? "GDPR/PSD3" : "US standard"})</strong>
                </span>
              </div>
              <div className="flex items-center">
                <span className="w-2 h-2 rounded-full mr-2 bg-zinc-400" />
                <span className="text-sm text-zinc-600">
                  Next auto-purge: <strong className="text-zinc-900">{m.gdpr.nextPurgeDate} at 4 AM</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
