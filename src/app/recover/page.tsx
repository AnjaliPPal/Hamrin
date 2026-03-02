"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";

const CardUpdateModal = dynamic(
  () => import("@/components/card-update-modal"),
  { ssr: false }
);

function RecoverContent() {
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get("invoice_id");
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (invoiceId) {
      setShowModal(true);
    }
  }, [invoiceId]);

  if (!invoiceId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Invalid Recovery Link
          </h1>
          <p className="text-gray-600 mb-4">
            This link is missing the invoice ID.
          </p>
          <Link href="/" className="text-indigo-600 hover:text-indigo-700 underline">
            Go to homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {showModal && (
        <CardUpdateModal
          invoiceId={invoiceId}
          onSuccess={() => setShowModal(false)}
          onClose={() => setShowModal(false)}
        />
      )}
      {!showModal && (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Payment Recovery
            </h1>
            <p className="text-gray-600">
              If you need to update your payment method, please use the link from your email.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RecoverPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        </div>
      }
    >
      <RecoverContent />
    </Suspense>
  );
}
