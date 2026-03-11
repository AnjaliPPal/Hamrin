import { prisma } from "@/lib/prisma";
import Link from "next/link";

interface Props {
  searchParams: Promise<{ cid?: string; ei?: string; unsubscribe?: string }>;
}

export default async function ReactivatePage({ searchParams }: Props) {
  const { cid, ei, unsubscribe } = await searchParams;

  // ── Unsubscribe path ──
  if (unsubscribe === "1" && cid) {
    // Mark all future emails suppressed by setting reactivatedAt to a sentinel
    // (simplest approach without a separate unsubscribe table)
    await prisma.churnedCustomer.updateMany({
      where: { id: cid, reactivatedAt: null },
      data: { reactivationSource: "unsubscribed" },
    });
    return (
      <div className="min-h-screen bg-[#F0F4FF] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-10 max-w-md w-full text-center shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] border border-gray-100">
          <p className="text-2xl mb-2">👋</p>
          <h1 className="text-xl font-extrabold text-gray-900 mb-2">You&apos;ve been unsubscribed</h1>
          <p className="text-sm text-gray-500">You won&apos;t receive any more win-back emails from us.</p>
        </div>
      </div>
    );
  }

  // ── No params ──
  if (!cid) {
    return (
      <div className="min-h-screen bg-[#F0F4FF] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-10 max-w-md w-full text-center shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] border border-gray-100">
          <h1 className="text-xl font-extrabold text-gray-900 mb-2">Invalid link</h1>
          <p className="text-sm text-gray-500 mb-6">This reactivation link is missing required parameters.</p>
          <Link href="/" className="text-sm font-semibold text-[#4361EE] hover:underline">← Go home</Link>
        </div>
      </div>
    );
  }

  const emailIndex = Number(ei ?? 0);

  const churned = await prisma.churnedCustomer.findUnique({
    where: { id: cid },
    include: {
      installation: {
        select: {
          id: true,
          reactivationCampaign: { select: { emails: true, enabled: true } },
        },
      },
    },
  });

  // ── Already reactivated ──
  if (churned?.reactivatedAt) {
    return (
      <div className="min-h-screen bg-[#F0F4FF] flex items-center justify-center px-4">
        <div className="bg-[#ECFDF5] rounded-2xl p-10 max-w-md w-full text-center border border-emerald-100 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
          <p className="text-3xl mb-3">🎉</p>
          <h1 className="text-xl font-extrabold text-gray-900 mb-2">You&apos;re already back!</h1>
          <p className="text-sm text-gray-500">Your subscription was reactivated on{" "}
            {churned.reactivatedAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}.
          </p>
        </div>
      </div>
    );
  }

  // ── Not found ──
  if (!churned) {
    return (
      <div className="min-h-screen bg-[#F0F4FF] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-10 max-w-md w-full text-center border border-gray-100">
          <h1 className="text-xl font-extrabold text-gray-900 mb-2">Link expired</h1>
          <p className="text-sm text-gray-500 mb-6">This reactivation link is no longer valid.</p>
          <Link href="/" className="text-sm font-semibold text-[#4361EE] hover:underline">← Go home</Link>
        </div>
      </div>
    );
  }

  // Determine offer from campaign step
  type EmailStep = {
    dayOffset: number;
    subject: string;
    body: string;
    offerType: "percent_off" | "none";
    offerValue: number;
  };
  const steps = (churned.installation.reactivationCampaign?.emails ?? []) as unknown as EmailStep[];
  const step: EmailStep | undefined = steps[emailIndex];
  const hasOffer = step?.offerType === "percent_off" && step?.offerValue > 0;

  return (
    <div className="min-h-screen bg-[#F0F4FF] flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <Link href="/" className="mb-10">
        <span className="text-xl font-extrabold text-gray-900 tracking-tight">
          hamrin<span className="text-[#EAB308]">.ai</span>
        </span>
      </Link>

      <div className="bg-white rounded-2xl p-8 sm:p-10 max-w-md w-full border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)]">
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-2">
          Welcome back 👋
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          We&apos;d love to have you back, {churned.customerEmail}.
          {churned.cancelReason && (
            <> We&apos;ve noted your feedback about <em>{churned.cancelReason.toLowerCase()}</em>.</>
          )}
        </p>

        {hasOffer && (
          <div className="bg-[#ECFDF5] rounded-xl p-4 border border-emerald-100 mb-6">
            <p className="text-sm font-semibold text-emerald-800">
              🎁 {step!.offerValue}% off your first month back — applied automatically
            </p>
          </div>
        )}

        {/* Reactivation form — posts to /api/reactivate */}
        <form action="/api/reactivate" method="POST">
          <input type="hidden" name="churnedCustomerId" value={cid} />
          <input type="hidden" name="emailIndex" value={emailIndex} />
          {/* 
            priceId and offerCouponId are merchant-specific. 
            In production these come from the installation's Stripe config.
            For now we show a clear "contact us" CTA alongside the form.
          */}
          <div className="space-y-3">
            <button
              type="submit"
              className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3.5 rounded-xl text-[15px] transition-colors"
            >
              Reactivate my subscription
            </button>
            <a
              href="mailto:support@hamrin.ai"
              className="w-full block text-center text-sm font-medium text-gray-400 hover:text-gray-600 py-2 transition-colors"
            >
              Questions? Contact support →
            </a>
          </div>
        </form>
      </div>

      <p className="mt-6 text-xs text-gray-400">
        <Link href={`/reactivate?cid=${cid}&ei=${ei}&unsubscribe=1`} className="hover:text-gray-600 underline">
          Unsubscribe from win-back emails
        </Link>
      </p>
    </div>
  );
}
