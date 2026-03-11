import Link from "next/link";
import dynamic from "next/dynamic";
import { prisma } from "@/lib/prisma";

// Card update form — Stripe.js is client-only
const CardUpdateModal = dynamic(
  () => import("@/components/card-update-modal"),
  { ssr: false }
);

// Hard decline codes that cannot be retried by updating a card
const HARD_DECLINE_CODES = new Set([
  "do_not_honor",
  "do_not_try_again",
  "fraudulent",
  "lost_card",
  "stolen_card",
  "pickup_card",
  "restricted_card",
  "security_violation",
  "transaction_not_allowed",
  "revocation_of_all_authorizations",
  "revocation_of_authorization",
  // Numeric codes (stored as strings in our DB)
  "03", "04", "07", "12", "57", "62",
]);

// Link expires after 7 days from payment creation
const LINK_TTL_DAYS = 7;

// ── Shared page shell ──────────────────────────────────────────────────
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F0F4FF] flex items-center justify-center px-4">
      <div className="w-full max-w-[420px]">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl bg-[#2ECC88] flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-[15px] font-extrabold text-gray-900 tracking-tight">hamrin<span className="text-[#2ECC88]">.ai</span></span>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── State components ───────────────────────────────────────────────────
function AlreadyRecovered({ email }: { email: string }) {
  return (
    <Shell>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] p-8 text-center">
        <div className="w-16 h-16 rounded-[20px] bg-[#ECFDF5] flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-xl font-extrabold text-gray-900 tracking-tight mb-2">Payment already recovered</h1>
        <p className="text-sm text-gray-500 leading-relaxed">
          Great news — your payment for <strong className="text-gray-700">{email}</strong> was already processed successfully. No action needed.
        </p>
        <div className="mt-6 pt-5 border-t border-gray-50">
          <p className="text-xs text-gray-400">Questions? <a href="mailto:support@hamrin.ai" className="text-[#4361EE] hover:underline font-medium">Contact support</a></p>
        </div>
      </div>
    </Shell>
  );
}

function HardDecline({ email, failureCode }: { email: string; failureCode: string | null }) {
  return (
    <Shell>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] p-8 text-center">
        <div className="w-16 h-16 rounded-[20px] bg-red-50 flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <h1 className="text-xl font-extrabold text-gray-900 tracking-tight mb-2">Card permanently declined</h1>
        <p className="text-sm text-gray-500 leading-relaxed mb-4">
          Your card issuer has permanently blocked this transaction for <strong className="text-gray-700">{email}</strong>. Updating the same card will not resolve this — you need a different card or payment method.
        </p>
        {failureCode && (
          <p className="text-[11px] font-mono text-gray-300 mb-4">Code: {failureCode}</p>
        )}
        <a
          href="mailto:support@hamrin.ai"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition-colors"
        >
          Contact support to resolve
        </a>
        <div className="mt-5 pt-5 border-t border-gray-50">
          <p className="text-xs text-gray-400">Reference: <span className="font-mono">{failureCode ?? "hard_decline"}</span></p>
        </div>
      </div>
    </Shell>
  );
}

function ExpiredLink() {
  return (
    <Shell>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] p-8 text-center">
        <div className="w-16 h-16 rounded-[20px] bg-amber-50 flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-xl font-extrabold text-gray-900 tracking-tight mb-2">Recovery link expired</h1>
        <p className="text-sm text-gray-500 leading-relaxed">
          This link was valid for {LINK_TTL_DAYS} days and has now expired. Please check your email for a newer recovery link, or contact support.
        </p>
        <div className="mt-6 pt-5 border-t border-gray-50">
          <p className="text-xs text-gray-400">Questions? <a href="mailto:support@hamrin.ai" className="text-[#4361EE] hover:underline font-medium">Contact support</a></p>
        </div>
      </div>
    </Shell>
  );
}

function DisconnectedAccount() {
  return (
    <Shell>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] p-8 text-center">
        <div className="w-16 h-16 rounded-[20px] bg-gray-100 flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
          </svg>
        </div>
        <h1 className="text-xl font-extrabold text-gray-900 tracking-tight mb-2">Account disconnected</h1>
        <p className="text-sm text-gray-500 leading-relaxed">
          The merchant account linked to this recovery link is no longer connected. Your subscription may have been cancelled.
        </p>
        <div className="mt-6 pt-5 border-t border-gray-50">
          <p className="text-xs text-gray-400">Questions? <a href="mailto:support@hamrin.ai" className="text-[#4361EE] hover:underline font-medium">Contact support</a></p>
        </div>
      </div>
    </Shell>
  );
}

function InvalidLink() {
  return (
    <Shell>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] p-8 text-center">
        <div className="w-16 h-16 rounded-[20px] bg-gray-100 flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h1 className="text-xl font-extrabold text-gray-900 tracking-tight mb-2">Invalid recovery link</h1>
        <p className="text-sm text-gray-500 leading-relaxed">
          This recovery link is missing required information or the payment record no longer exists. Please use the link directly from your email.
        </p>
        <Link href="/" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#4361EE] hover:underline">
          ← Go to homepage
        </Link>
      </div>
    </Shell>
  );
}

// ── Main page (server component) ───────────────────────────────────────
export default async function RecoverPage({
  searchParams,
}: {
  searchParams: Promise<{ invoice_id?: string }>;
}) {
  const { invoice_id: invoiceId } = await searchParams;

  // 1. Missing invoice_id in URL
  if (!invoiceId) return <InvalidLink />;

  // 2. Look up the FailedPayment by invoiceId
  const failedPayment = await prisma.failedPayment.findFirst({
    where: { invoiceId },
    include: { installation: { select: { id: true, accessToken: true } } },
  });

  // 3. No record found
  if (!failedPayment) return <InvalidLink />;

  // 4. Check if the installation (merchant account) still exists
  if (!failedPayment.installation) return <DisconnectedAccount />;

  // 5. Already recovered
  if (failedPayment.status === "recovered") {
    return <AlreadyRecovered email={failedPayment.customerEmail} />;
  }

  // 6. Hard decline — updating card won't help
  if (failedPayment.failureCode && HARD_DECLINE_CODES.has(failedPayment.failureCode)) {
    return <HardDecline email={failedPayment.customerEmail} failureCode={failedPayment.failureCode} />;
  }

  // 7. Expired link (> 7 days since payment failed)
  const ageMs = Date.now() - failedPayment.createdAt.getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  if (ageDays > LINK_TTL_DAYS) return <ExpiredLink />;

  // 8. Happy path — show card update form
  return (
    <Shell>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] overflow-hidden">
        {/* Header band */}
        <div className="bg-gray-900 px-6 py-5">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-6 h-6 rounded-lg bg-amber-400 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <p className="text-xs font-semibold text-amber-400 uppercase tracking-[0.1em]">Action required</p>
          </div>
          <h1 className="text-xl font-extrabold text-white tracking-tight leading-snug">
            Your payment didn&apos;t go through
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Update your card and we&apos;ll retry the ${Number(failedPayment.amount).toFixed(2)} charge immediately.
          </p>
        </div>

        {/* Failure detail */}
        <div className="px-6 py-4 bg-red-50 border-b border-red-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-red-700">
              {failedPayment.failureCode === "insufficient_funds"
                ? "Insufficient funds on your card"
                : failedPayment.failureCode === "expired_card"
                ? "Your card has expired"
                : "Payment declined by your bank"}
            </p>
            <p className="text-xs text-red-500 mt-0.5">
              {failedPayment.customerEmail} · {failedPayment.attemptCount} attempt{failedPayment.attemptCount !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Card update form */}
        <CardUpdateModal
          invoiceId={invoiceId}
          onSuccess={() => {/* handled inside modal */}}
          onClose={() => {/* no close on this page — it's the whole page */}}
        />
      </div>

      <p className="text-center text-xs text-gray-400 mt-5">
        Secured by Stripe. hamrin never stores card data. · <a href="mailto:support@hamrin.ai" className="text-[#4361EE] hover:underline">Support</a>
      </p>
    </Shell>
  );
}
