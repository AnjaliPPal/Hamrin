import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getDashboardMetrics } from '@/services/dashboard';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ installation?: string }>;
}) {
  const { installation: installationId } = await searchParams;

  if (!installationId) {
    redirect('/');
  }

  const installation = await prisma.installation.findUnique({
    where: { id: installationId },
  });

  if (!installation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Installation Not Found</h1>
          <Link href="/" className="mt-4 inline-block text-blue-600 hover:underline">
            ← Go Home
          </Link>
        </div>
      </div>
    );
  }

  // Get real metrics from database
  let metrics;
  let atRiskUsers: Array<{ email: string; risk: number; lastTry: string }> = [];
  
  try {
    const dashboardData = await getDashboardMetrics(installationId);
    metrics = {
      recovered: dashboardData.totalRecovered,
      rate: dashboardData.recoveryRate,
      prevented: dashboardData.preventedAmount,
      visaAttempts: dashboardData.visaAttempts,
      visaLimit: dashboardData.visaLimit,
      cardFingerprintsTracked: dashboardData.cardFingerprintsTracked,
    };
    atRiskUsers = dashboardData.atRiskCustomers.map(c => ({
      email: c.email,
      risk: c.riskScore,
      lastTry: c.lastAttempt,
    }));
  } catch (error) {
    console.error('Failed to load dashboard metrics:', error);
    // Fallback to zeros if metrics fail to load
    metrics = {
      recovered: 0,
      rate: 0,
      prevented: 0,
      visaAttempts: 0,
      visaLimit: 15,
      cardFingerprintsTracked: 0,
    };
  }

  return (
    <div className="min-h-screen bg-zinc-50/50">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Recovery Dashboard</h1>
            <p className="text-zinc-500 text-sm mt-0.5">
              {installation.stripeAccountId.substring(0, 20)}...
            </p>
          </div>
          <div className="flex gap-2">
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* BENTO GRID LAYOUT */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          {/* BIG GREEN TILE - Hero Metric */}
          <div className="bg-gradient-to-br from-emerald-50 to-white rounded-xl border border-emerald-100 p-6 shadow-sm">
            <p className="text-emerald-700 text-sm font-medium mb-1">Total Recovered</p>
            <p className="text-4xl font-bold text-emerald-900 tracking-tight mb-2">
              ${metrics.recovered.toLocaleString()}
            </p>
            <div className="flex items-center text-sm text-emerald-600 font-medium">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              +12% this month
            </div>
          </div>

          {/* COMPLIANCE GAUGE */}
          <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <p className="text-zinc-500 text-sm font-medium">Visa Compliance</p>
              <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-3xl font-bold text-zinc-900">{metrics.visaAttempts}</span>
              <span className="text-zinc-400 text-lg font-normal">/ {metrics.visaLimit}</span>
            </div>
            <div className="w-full bg-zinc-100 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(metrics.visaAttempts / metrics.visaLimit) * 100}%` }}
              ></div>
            </div>
            <p className="text-xs text-zinc-500 mt-2">
              {metrics.visaLimit - metrics.visaAttempts} attempts remaining
            </p>
            {metrics.cardFingerprintsTracked > 0 && (
              <p className="text-xs text-zinc-400 mt-1">
                {metrics.cardFingerprintsTracked} card{metrics.cardFingerprintsTracked !== 1 ? 's' : ''} tracked
              </p>
            )}
          </div>

          {/* PREVENTION STATS */}
          <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
            <p className="text-zinc-500 text-sm font-medium mb-3">Auto-Prevention</p>
            <div className="text-3xl font-bold text-zinc-900 mb-1">
              ${metrics.prevented.toLocaleString()}
            </div>
            <p className="text-xs text-zinc-500">Saved via Account Updater</p>
          </div>
        </div>

        {/* AT-RISK CUSTOMERS TABLE */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-200 flex justify-between items-center">
            <div>
              <h2 className="text-base font-semibold text-zinc-900">At-Risk Customers</h2>
              <p className="text-sm text-zinc-500 mt-0.5">High churn probability detected</p>
            </div>
            <button className="px-3 py-1.5 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors">
              View All
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-50/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Risk Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Last Attempt</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {atRiskUsers.map((user, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-700">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${
                        user.risk > 90 
                          ? 'bg-red-100 text-red-800' 
                          : user.risk > 70 
                          ? 'bg-amber-100 text-amber-800' 
                          : 'bg-zinc-100 text-zinc-700'
                      }`}>
                        {user.risk}/100
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">
                      {user.lastTry}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button className="inline-flex items-center px-3 py-1.5 bg-zinc-900 text-white text-xs font-medium rounded-lg hover:bg-zinc-800 transition-colors">
                        <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Send 50% Off
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CONNECTION STATUS (Bottom) */}
        <div className="mt-6 bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-zinc-900 mb-4">Connection Status</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center">
              <span className={`w-2 h-2 rounded-full mr-2 ${installation.vauEnabled ? 'bg-emerald-500' : 'bg-amber-400'}`}></span>
              <span className="text-sm text-zinc-600">
                Visa VAU: <strong className="text-zinc-900">{installation.vauEnabled ? 'Enabled' : 'Pending'}</strong>
              </span>
            </div>
            <div className="flex items-center">
              <span className={`w-2 h-2 rounded-full mr-2 ${installation.abuEnabled ? 'bg-emerald-500' : 'bg-amber-400'}`}></span>
              <span className="text-sm text-zinc-600">
                MC ABU: <strong className="text-zinc-900">{installation.abuEnabled ? 'Enabled' : 'Pending'}</strong>
              </span>
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 rounded-full mr-2 bg-blue-500"></span>
              <span className="text-sm text-zinc-600">
                Account: <code className="text-xs font-mono text-zinc-900">{installation.stripeAccountId.substring(0, 15)}...</code>
              </span>
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 rounded-full mr-2 bg-purple-500"></span>
              <span className="text-sm text-zinc-600">
                Pricing: <strong className="text-zinc-900">{installation.pricingModel.toUpperCase()}</strong>
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

