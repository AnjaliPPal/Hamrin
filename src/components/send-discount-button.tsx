"use client";

import { useState } from "react";

export function SendDiscountButton({
  failedPaymentId,
  installationId,
  alreadySent,
}: {
  failedPaymentId: string;
  installationId: string;
  alreadySent: boolean;
}) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    alreadySent ? "sent" : "idle"
  );
  const [errorMsg, setErrorMsg] = useState("");

  async function handleClick() {
    if (status !== "idle") return;
    setStatus("sending");
    setErrorMsg("");
    try {
      const res = await fetch("/api/discount/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ failedPaymentId, installationId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error ?? "Failed");
        setStatus("error");
        return;
      }
      setStatus("sent");
    } catch {
      setErrorMsg("Network error");
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-100 text-emerald-800">
        Offer sent
      </span>
    );
  }

  return (
    <div className="flex flex-col items-end gap-0.5">
      <button
        onClick={handleClick}
        disabled={status === "sending"}
        className="inline-flex items-center px-3 py-1.5 bg-zinc-900 text-white text-xs font-medium rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === "sending" ? "Sending..." : "Send 50% Off"}
      </button>
      {status === "error" && (
        <span className="text-xs text-red-600">{errorMsg}</span>
      )}
    </div>
  );
}
