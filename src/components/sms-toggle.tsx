"use client";

import { useState } from "react";

export function SmsToggle({
  installationId,
  initialEnabled,
}: {
  installationId: string;
  initialEnabled: boolean;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [saving, setSaving] = useState(false);

  async function handleChange(checked: boolean) {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ installationId, smsEnabled: checked }),
      });
      if (res.ok) {
        setEnabled(checked);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={enabled}
        onChange={(e) => handleChange(e.target.checked)}
        disabled={saving}
        className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500"
      />
      <span className="text-sm text-zinc-600">
        Enable SMS recovery notices {saving && "(saving...)"}
      </span>
    </label>
  );
}
