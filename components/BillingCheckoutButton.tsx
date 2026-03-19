"use client";

import { useState } from "react";

type BillingCheckoutButtonProps = {
  label: string;
};

export default function BillingCheckoutButton({ label }: BillingCheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
      });
      const payload = (await res.json()) as { error?: string; checkoutUrl?: string };
      if (!res.ok || !payload.checkoutUrl) {
        throw new Error(payload.error || "Failed to open Stripe checkout.");
      }

      window.location.assign(payload.checkoutUrl);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to open Stripe checkout.");
      setLoading(false);
      return;
    }

    setLoading(false);
  }

  return (
    <div className="space-y-3">
      {error && <div className="alert-error">{error}</div>}
      <button type="button" className="btn-primary" onClick={handleClick} disabled={loading}>
        {loading ? "Redirecting to Stripe..." : label}
      </button>
    </div>
  );
}
