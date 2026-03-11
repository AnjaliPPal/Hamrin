import Link from 'next/link';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getDashboardMetrics, type DashboardMetrics } from '@/services/dashboard';
import { SendDiscountButton } from '@/components/send-discount-button';
import { SmsToggle } from '@/components/sms-toggle';
import { getSessionFromToken, isSessionEnabled, SESSION_COOKIE_NAME } from '@/lib/session';

// ── small pure helpers ──────────────────────────────────────────────────
function fmt$(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function statusBadge(status: string) {
  const map: Record<string, string> = {
    recovered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    failed:    'bg-red-50 text-red-600 border-red-100',
    retrying:  'bg-amber-50 text-amber-700 border-amber-200',
    abandoned: 'bg-gray-100 text-gray-500 border-gray-200',
  };
  return map[status] ?? 'bg-gray-100 text-gray-500 border-gray-200';
}
// ───────────────────────────────────────────────────────────────────────

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

  const installation = await prisma.installation.findUnique({ where: { id: installationId } });

  if (!installation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F0F4FF]">
        <div className="bg-white rounded-2xl p-10 text-center shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] border border-gray-100">
          <h1 className="text-xl font-extrabold text-gray-900">Installation Not Found</h1>
          <Link href="/" className="mt-4 inline-flex text-sm font-semibold text-[#4361EE] hover:underline">← Go Home</Link>
        </div>
      </div>
    );
  }

  let data: DashboardMetrics | null = null;
  try { data = await getDashboardMetrics(installationId); }
  catch (err) { console.error('Dashboard metrics error:', err); }

  const m = data ?? {
    totalRecovered: 0, recoveryRate: 0, preventedAmount: 0,
    visaAttempts: 0, visaLimit: 15, cardFingerprintsTracked: 0,
    topAtRiskCards: [], atRiskCustomers: [], failedPaymentsTable: [],
    gdpr: { retentionDays: 90, country: installation.country, isEU: false, nextPurgeDate: '—' },
    thisMonthFee: null, pricingModel: installation.pricingModel,
    recoveryAttribution: { card_update: 0, retry_engine: 0, auto_updater: 0, unknown: 0, total: 0 },
    cancelFlow: { totalSessions: 0, saves: 0, cancellations: 0, saveRate: 0, savedRevenue: 0, topReasons: [], offerAcceptance: { discount: 0, pause: 0 } },
    reactivation: { totalChurned: 0, emailsSent: 0, reactivated: 0, reactivationRate: 0, reactivatedFromEmail: 0 },
    totalRetainedRevenue: 0,
  };

  // Cast to access fields added in Module 6 schema (livemode, cancelFlowEnabled, reactivationEnabled).
  // Remove this cast once `npx prisma generate` has been run after the Module 6 migration.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inst = installation as any;

  const visaPct = Math.min((m.visaAttempts / m.visaLimit) * 100, 100);
  const visaStatus =
    m.visaAttempts >= 13 ? { label: 'CRITICAL', bg: 'bg-red-50',    text: 'text-red-600',    bar: 'bg-red-500'    } :
    m.visaAttempts >= 9  ? { label: 'WARNING',  bg: 'bg-amber-50',  text: 'text-amber-600',  bar: 'bg-amber-400'  } :
                           { label: 'SAFE',     bg: 'bg-emerald-50', text: 'text-emerald-600', bar: 'bg-[#2ECC88]' };

  const attrTotal = Math.max(m.recoveryAttribution.total, 1);

  return (
    <div className="min-h-screen bg-[#F0F4FF]">

      {/* ══════════ TOP NAV ══════════ */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#2ECC88] flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-[15px] font-extrabold text-gray-900 tracking-tight">hamrin<span className="text-[#2ECC88]">.ai</span></span>
          </div>

          <nav className="hidden md:flex items-center gap-1 bg-gray-100 rounded-full p-1">
            <span className="px-4 py-1.5 rounded-full bg-white shadow-sm text-sm font-semibold text-gray-900">Overview</span>
            <Link href="/dashboard/test-mode" className="px-4 py-1.5 rounded-full text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors">
              Test Mode
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {/* LIVE / TEST badge */}
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
              inst.livemode !== false
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-amber-50 border-amber-200 text-amber-700'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${inst.livemode !== false ? 'bg-[#2ECC88]' : 'bg-amber-400'}`} />
              {inst.livemode !== false ? 'LIVE' : 'TEST'}
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
              {installation.pricingModel.toUpperCase()}
            </span>
            {isSessionEnabled() && (
              <Link href="/api/auth/logout" className="text-sm font-medium text-gray-400 hover:text-gray-700 transition-colors">
                Log out
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-10 space-y-8">

        {/* ══════════ PAGE TITLE ══════════ */}
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Retention Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1">
            Workspace · <span className="font-mono">{installation.stripeAccountId.substring(0, 20)}…</span>
          </p>
        </div>

        {/* ══════════ KPI ROW — 4 tiles ══════════ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Retained Revenue */}
          <div className="bg-[#ECFDF5] rounded-2xl p-5 border border-emerald-100 col-span-2 lg:col-span-1">
            <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-[0.08em] mb-2">Total Retained</p>
            <p className="text-[32px] font-extrabold text-gray-900 tracking-tight leading-none">${fmt$(m.totalRetainedRevenue)}</p>
            <p className="text-xs text-emerald-600 font-medium mt-1.5">↑ {m.recoveryRate}% recovery rate</p>
          </div>

          {/* Cancel Flow Save Rate */}
          <div className="bg-[#F3F0FF] rounded-2xl p-5 border border-violet-100">
            <p className="text-[11px] font-semibold text-violet-700 uppercase tracking-[0.08em] mb-2">Save Rate</p>
            <p className="text-[32px] font-extrabold text-gray-900 tracking-tight leading-none">{m.cancelFlow.saveRate}%</p>
            <p className="text-xs text-violet-600 font-medium mt-1.5">{m.cancelFlow.saves} of {m.cancelFlow.totalSessions} saved</p>
          </div>

          {/* Payment Recovery Rate */}
          <div className="bg-[#EFF6FF] rounded-2xl p-5 border border-blue-100">
            <p className="text-[11px] font-semibold text-blue-700 uppercase tracking-[0.08em] mb-2">Payment Recovery</p>
            <p className="text-[32px] font-extrabold text-gray-900 tracking-tight leading-none">{m.recoveryRate}%</p>
            <p className="text-xs text-blue-600 font-medium mt-1.5">${fmt$(m.totalRecovered)} recovered</p>
          </div>

          {/* Reactivation Rate */}
          <div className="bg-[#FEFCE8] rounded-2xl p-5 border border-yellow-100">
            <p className="text-[11px] font-semibold text-yellow-700 uppercase tracking-[0.08em] mb-2">Reactivation</p>
            <p className="text-[32px] font-extrabold text-gray-900 tracking-tight leading-none">{m.reactivation.reactivationRate}%</p>
            <p className="text-xs text-yellow-700 font-medium mt-1.5">{m.reactivation.reactivated} of {m.reactivation.totalChurned} won back</p>
          </div>
        </div>

        {/* ══════════ ROW: Cancel Flow + Reactivation ══════════ */}
        <div className="grid md:grid-cols-2 gap-6">

          {/* Cancel Flow Performance */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-[15px] font-semibold text-gray-900">Cancel Flow</h2>
                <p className="text-xs text-gray-400 mt-0.5">Sessions, saves, and cancellations</p>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                m.cancelFlow.saveRate >= 50 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                m.cancelFlow.saveRate >= 25 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                'bg-gray-100 text-gray-500 border-gray-200'
              }`}>{m.cancelFlow.saveRate}% save rate</span>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { label: 'Sessions', val: m.cancelFlow.totalSessions, color: 'text-gray-900' },
                { label: 'Saved',    val: m.cancelFlow.saves,         color: 'text-emerald-600' },
                { label: 'Churned',  val: m.cancelFlow.cancellations, color: 'text-red-500' },
              ].map((s) => (
                <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className={`text-xl font-extrabold ${s.color}`}>{s.val}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Offer acceptance */}
            <div className="mb-5">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.06em] mb-2">Offer acceptance</p>
              <div className="flex gap-2">
                <div className="flex-1 bg-[#F3F0FF] rounded-xl p-3 text-center">
                  <p className="text-lg font-extrabold text-violet-700">{m.cancelFlow.offerAcceptance.discount}</p>
                  <p className="text-[11px] text-violet-500 mt-0.5">Discount</p>
                </div>
                <div className="flex-1 bg-[#EFF6FF] rounded-xl p-3 text-center">
                  <p className="text-lg font-extrabold text-blue-700">{m.cancelFlow.offerAcceptance.pause}</p>
                  <p className="text-[11px] text-blue-500 mt-0.5">Pause</p>
                </div>
              </div>
            </div>

            {/* Top reasons */}
            {m.cancelFlow.topReasons.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.06em] mb-2">Top cancel reasons</p>
                <div className="space-y-2">
                  {m.cancelFlow.topReasons.map((r) => {
                    const pct = Math.round((r.count / Math.max(m.cancelFlow.totalSessions, 1)) * 100);
                    return (
                      <div key={r.reason} className="flex items-center gap-2">
                        <span className="text-xs text-gray-600 w-36 truncate">{r.reason}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-violet-400 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[11px] text-gray-400 w-8 text-right">{r.count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {m.cancelFlow.totalSessions === 0 && (
              <div className="flex flex-col items-center py-6 text-center">
                <div className="w-12 h-12 rounded-[16px] bg-[#F5F0E8] flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-700">No cancel flow sessions yet</p>
                <p className="text-xs text-gray-400 mt-1">Embed the cancel flow snippet to start saving customers.</p>
              </div>
            )}
          </div>

          {/* Reactivation Performance */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-[15px] font-semibold text-gray-900">Reactivation Campaign</h2>
                <p className="text-xs text-gray-400 mt-0.5">Win-back emails and re-subscriptions</p>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                inst.reactivationEnabled
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-gray-100 text-gray-400 border-gray-200'
              }`}>{inst.reactivationEnabled ? 'Enabled' : 'Disabled'}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                { label: 'Churned',      val: m.reactivation.totalChurned,       color: 'text-red-500'      },
                { label: 'Emails sent',  val: m.reactivation.emailsSent,          color: 'text-gray-900'     },
                { label: 'Reactivated',  val: m.reactivation.reactivated,         color: 'text-emerald-600'  },
                { label: 'From email',   val: m.reactivation.reactivatedFromEmail, color: 'text-[#4361EE]'    },
              ].map((s) => (
                <div key={s.label} className="bg-gray-50 rounded-xl p-3">
                  <p className={`text-xl font-extrabold ${s.color}`}>{s.val}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Win-back rate bar */}
            {m.reactivation.totalChurned > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.06em]">Win-back rate</p>
                  <p className="text-xs font-bold text-gray-700">{m.reactivation.reactivationRate}%</p>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-[#2ECC88] h-2 rounded-full transition-all" style={{ width: `${m.reactivation.reactivationRate}%` }} />
                </div>
              </div>
            )}

            {m.reactivation.totalChurned === 0 && (
              <div className="flex flex-col items-center py-6 text-center">
                <div className="w-12 h-12 rounded-[16px] bg-[#F5F0E8] flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-700">No churned customers yet</p>
                <p className="text-xs text-gray-400 mt-1">Enable reactivation campaigns to win back churned customers.</p>
              </div>
            )}
          </div>
        </div>

        {/* ══════════ Payment Recovery Performance ══════════ */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-[15px] font-semibold text-gray-900">Payment Recovery</h2>
              <p className="text-xs text-gray-400 mt-0.5">Recovery by source — last 30 days</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-extrabold text-gray-900">${fmt$(m.totalRecovered)}</p>
              <p className="text-xs text-gray-400">total recovered</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {([
              { key: 'card_update',   label: 'Card Update',    color: 'bg-[#2ECC88]', light: 'bg-[#ECFDF5] text-emerald-700' },
              { key: 'retry_engine',  label: 'Retry Engine',   color: 'bg-[#4361EE]', light: 'bg-[#EFF6FF] text-blue-700'    },
              { key: 'auto_updater',  label: 'Auto Updater',   color: 'bg-violet-500', light: 'bg-[#F3F0FF] text-violet-700' },
              { key: 'unknown',       label: 'Other',          color: 'bg-gray-400',  light: 'bg-gray-50 text-gray-600'      },
            ] as const).map((s) => {
              const count = m.recoveryAttribution[s.key];
              const pct = Math.round((count / attrTotal) * 100);
              return (
                <div key={s.key} className={`rounded-xl p-4 ${s.light.split(' ')[0]}`}>
                  <p className={`text-xl font-extrabold ${s.light.split(' ')[1]}`}>{count}</p>
                  <p className="text-[11px] font-medium text-gray-500 mt-0.5">{s.label}</p>
                  <div className="mt-2 bg-white/60 rounded-full h-1.5 overflow-hidden">
                    <div className={`${s.color} h-1.5 rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">{pct}% of recovered</p>
                </div>
              );
            })}
          </div>

          {/* Visa compliance */}
          <div className="mt-5 pt-5 border-t border-gray-50 grid md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.06em]">Visa compliance (15-attempt limit)</p>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${visaStatus.bg} ${visaStatus.text}`}>{visaStatus.label}</span>
              </div>
              <div className="flex items-baseline gap-1.5 mb-1.5">
                <span className="text-2xl font-extrabold text-gray-900">{m.visaAttempts}</span>
                <span className="text-sm text-gray-400">/ {m.visaLimit} max</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div className={`${visaStatus.bar} h-2 rounded-full`} style={{ width: `${visaPct}%` }} />
              </div>
              <p className="text-xs text-gray-400 mt-1.5">{m.cardFingerprintsTracked} card{m.cardFingerprintsTracked !== 1 ? 's' : ''} tracked</p>
            </div>

            {m.topAtRiskCards.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.06em] mb-2">Cards nearing limit</p>
                <div className="flex flex-wrap gap-2">
                  {m.topAtRiskCards.map((card) => (
                    <div key={card.fingerprint} className={`rounded-lg px-3 py-1.5 text-xs font-mono flex items-center gap-1.5 ${
                      card.riskLevel === 'red' ? 'bg-red-50 text-red-700' :
                      card.riskLevel === 'yellow' ? 'bg-amber-50 text-amber-700' :
                      'bg-gray-50 text-gray-600'
                    }`}>
                      {card.fingerprint}
                      <span className="font-bold">{card.attempts}/15</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ══════════ AT-RISK CUSTOMERS TABLE ══════════ */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-semibold text-gray-900">At-Risk Customers</h2>
              <p className="text-xs text-gray-400 mt-0.5">Churn probability above 65 — act now</p>
            </div>
            {m.atRiskCustomers.length > 0 && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-100">
                {m.atRiskCustomers.length} at risk
              </span>
            )}
          </div>

          {m.atRiskCustomers.length === 0 ? (
            <div className="px-6 py-12 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-[20px] bg-[#F5F0E8] flex items-center justify-center mb-3">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-700">All clear</p>
              <p className="text-xs text-gray-400 mt-1">No at-risk customers right now.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-50">
                    {['Customer', 'Risk Score', 'Amount', 'Last Failed', 'Action'].map((h, i) => (
                      <th key={h} className={`px-6 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-[0.06em] ${i === 4 ? 'text-right' : 'text-left'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {m.atRiskCustomers.map((user, i) => (
                    <tr key={user.id} className={`border-b border-gray-50 hover:bg-[#F8FAFF] transition-colors ${i === m.atRiskCustomers.length - 1 ? 'border-none' : ''}`}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-800">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          user.riskScore > 85 ? 'bg-red-50 text-red-600 border-red-100' :
                          'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>{user.riskScore}<span className="text-gray-400 font-normal">/100</span></span>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-800">${user.amount.toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm text-gray-400">{user.lastAttempt}</td>
                      <td className="px-6 py-4 text-right">
                        <SendDiscountButton failedPaymentId={user.id} installationId={installationId} alreadySent={!!user.discountOfferSentAt} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ══════════ FAILED PAYMENTS TABLE ══════════ */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-[15px] font-semibold text-gray-900">Failed Payments</h2>
            <p className="text-xs text-gray-400 mt-0.5">Last 50 payment events</p>
          </div>

          {m.failedPaymentsTable.length === 0 ? (
            <div className="px-6 py-12 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-[20px] bg-[#F5F0E8] flex items-center justify-center mb-3">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-700">No payment events yet</p>
              <p className="text-xs text-gray-400 mt-1">Failed payments will appear here when your webhook receives them.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-50">
                    {['Customer', 'Amount', 'Status', 'Recovery', 'Attempts', 'Date', 'Risk'].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-[0.06em]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {m.failedPaymentsTable.map((p, i) => (
                    <tr key={p.id} className={`border-b border-gray-50 hover:bg-[#F8FAFF] transition-colors ${i === m.failedPaymentsTable.length - 1 ? 'border-none' : ''}`}>
                      <td className="px-5 py-3.5 text-sm text-gray-700 font-medium max-w-[180px] truncate">{p.customerEmail}</td>
                      <td className="px-5 py-3.5 text-sm font-semibold text-gray-900">${p.amount.toFixed(2)}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${statusBadge(p.status)}`}>{p.status}</span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-400">{p.recoverySource ?? '—'}</td>
                      <td className="px-5 py-3.5 text-sm text-gray-500">{p.attemptCount}</td>
                      <td className="px-5 py-3.5 text-xs text-gray-400 whitespace-nowrap">
                        {p.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-5 py-3.5">
                        {p.churnRiskScore > 0 && (
                          <span className={`text-xs font-bold ${p.churnRiskScore > 80 ? 'text-red-600' : p.churnRiskScore > 60 ? 'text-amber-600' : 'text-gray-400'}`}>
                            {p.churnRiskScore}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ══════════ BOTTOM ROW: Health + Settings + GDPR ══════════ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Installation Health */}
          <div className="bg-[#F3F0FF] rounded-2xl p-6 border border-violet-100">
            <h3 className="text-[11px] font-semibold text-violet-700 uppercase tracking-[0.08em] mb-4">Installation Health</h3>
            <div className="space-y-3">
              {[
                { label: 'Visa VAU',       active: installation.vauEnabled },
                { label: 'Mastercard ABU', active: installation.abuEnabled },
                { label: 'Cancel Flow',    active: inst.cancelFlowEnabled },
                { label: 'Reactivation',   active: inst.reactivationEnabled },
              ].map(({ label, active }) => (
                <div key={label} className="flex items-center gap-2.5">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${active ? 'bg-[#2ECC88]' : 'bg-gray-300'}`} />
                  <span className="text-sm text-gray-700">{label}:{' '}
                    <span className={`font-semibold ${active ? 'text-emerald-700' : 'text-gray-400'}`}>{active ? 'Active' : 'Off'}</span>
                  </span>
                </div>
              ))}
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full flex-shrink-0 bg-[#4361EE]" />
                <span className="text-sm text-gray-700">Card tracking: <span className="font-semibold text-[#4361EE]">Active</span></span>
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)]">
            <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.08em] mb-4">Settings</h3>
            <div className="space-y-4">
              <SmsToggle installationId={installationId} initialEnabled={installation.smsEnabled} />
              <p className="text-xs text-gray-400 leading-relaxed">SMS fallback fires after email fails to reach the customer.</p>
              <div className="pt-3 border-t border-gray-50">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.06em] mb-2">Pricing plan</p>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
                  {installation.pricingModel.toUpperCase()}
                </span>
                {installation.pricingModel === 'outcome' && m.thisMonthFee !== null && (
                  <p className="text-xs text-gray-500 mt-2">This month fee: <strong className="text-gray-900">${m.thisMonthFee.toFixed(2)}</strong></p>
                )}
              </div>
            </div>
          </div>

          {/* GDPR */}
          <div className="bg-[#FEFCE8] rounded-2xl p-6 border border-yellow-100">
            <h3 className="text-[11px] font-semibold text-yellow-700 uppercase tracking-[0.08em] mb-4">Data Compliance (GDPR / PSD3)</h3>
            <div className="space-y-3">
              {[
                { dot: 'bg-violet-500', text: `Region: ${m.gdpr.country} ${m.gdpr.isEU ? '(EU)' : '(US/Other)'}` },
                { dot: 'bg-[#2ECC88]', text: `Retention: ${m.gdpr.retentionDays}d (${m.gdpr.isEU ? 'GDPR/PSD3' : 'US standard'})` },
                { dot: 'bg-gray-300',  text: `Next purge: ${m.gdpr.nextPurgeDate} at 4 AM` },
              ].map(({ dot, text }) => (
                <div key={text} className="flex items-start gap-2.5">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${dot}`} />
                  <span className="text-sm text-gray-700">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
