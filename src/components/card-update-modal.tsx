"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface CardUpdateModalProps {
  invoiceId: string;
  onSuccess?: () => void;
  onClose?: () => void;
}

function CardUpdateForm({ invoiceId, onSuccess }: CardUpdateModalProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError("Card element not found");
      setLoading(false);
      return;
    }

    try {
      const { error: createError, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
      });

      if (createError || !paymentMethod) {
        setError(createError?.message ?? "Failed to create payment method");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/payment-method/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethodId: paymentMethod.id, invoiceId }),
      });

      const data = await response.json() as { error?: string; message?: string };

      if (!response.ok) {
        setError(data.error ?? "Failed to update payment method");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => onSuccess?.(), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 rounded-[20px] bg-[#ECFDF5] flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-extrabold text-gray-900 tracking-tight mb-2">Payment recovered!</h3>
        <p className="text-sm text-gray-500 leading-relaxed">
          Your card has been updated and your payment was retried successfully. You&apos;re all set.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-6">
      <div className="mb-5">
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-[0.06em] mb-2">
          New card details
        </label>
        <div className="p-4 border border-gray-200 rounded-xl bg-gray-50 focus-within:border-gray-400 focus-within:bg-white transition-colors">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: "15px",
                  fontFamily: "Inter, system-ui, sans-serif",
                  color: "#111827",
                  "::placeholder": { color: "#9CA3AF" },
                },
                invalid: { color: "#EF4444" },
              },
            }}
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3.5 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2.5">
          <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 text-white font-bold py-3.5 rounded-xl text-[15px] transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Processing…
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
            </svg>
            Save card & retry payment
          </>
        )}
      </button>

      <p className="mt-4 text-[11px] text-gray-400 text-center">
        🔒 Secured by Stripe — hamrin never stores card numbers
      </p>
    </form>
  );
}

export default function CardUpdateModal({ invoiceId, onSuccess, onClose }: CardUpdateModalProps) {
  return (
    <Elements stripe={stripePromise}>
      <CardUpdateForm invoiceId={invoiceId} onSuccess={onSuccess} onClose={onClose} />
    </Elements>
  );
}
