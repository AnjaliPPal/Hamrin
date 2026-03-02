"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { env } from "@/lib/env";

const stripePromise = loadStripe(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

interface CardUpdateModalProps {
  invoiceId: string;
  onSuccess?: () => void;
  onClose?: () => void;
}

function CardUpdateForm({ invoiceId, onSuccess, onClose }: CardUpdateModalProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setError("Card element not found");
      setLoading(false);
      return;
    }

    try {
      // Create payment method
      const { error: createError, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
      });

      if (createError || !paymentMethod) {
        setError(createError?.message || "Failed to create payment method");
        setLoading(false);
        return;
      }

      // Update payment method via API
      const response = await fetch("/api/payment-method/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentMethodId: paymentMethod.id,
          invoiceId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to update payment method");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose?.();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="p-6 text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
          <svg
            className="h-6 w-6 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Card Updated!</h3>
        <p className="text-sm text-gray-500">
          Your payment method has been updated successfully. We&apos;ll retry your payment shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Update your payment method
      </h2>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card Details
        </label>
        <div className="p-3 border border-gray-300 rounded-md bg-white">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: "16px",
                  color: "#424770",
                  "::placeholder": {
                    color: "#aab7c4",
                  },
                },
                invalid: {
                  color: "#9e2146",
                },
              },
            }}
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={!stripe || loading}
          className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {loading ? "Processing..." : "Save Card"}
        </button>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
          >
            Cancel
          </button>
        )}
      </div>

      <p className="mt-4 text-xs text-gray-500 text-center">
        Your card information is secure and encrypted. We&apos;ll retry your payment automatically after you update.
      </p>
    </form>
  );
}

export default function CardUpdateModal({ invoiceId, onSuccess, onClose }: CardUpdateModalProps) {
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full z-10">
          <div className="absolute top-4 right-4">
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <Elements stripe={stripePromise}>
            <CardUpdateForm invoiceId={invoiceId} onSuccess={onSuccess} onClose={handleClose} />
          </Elements>
        </div>
      </div>
    </div>
  );
}
