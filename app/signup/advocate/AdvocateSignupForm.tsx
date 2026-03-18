"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type AdvocateSignupFormProps = {
  monthlyPkrLabel: string;
  monthlyUsdLabel: string;
};

export default function AdvocateSignupForm({
  monthlyPkrLabel,
  monthlyUsdLabel,
}: AdvocateSignupFormProps) {
  const supabase = createClient();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/advocate-signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName,
          email,
          password,
        }),
      });

      const payload = (await res.json()) as { error?: string; checkoutUrl?: string };
      if (!res.ok || !payload.checkoutUrl) {
        throw new Error(payload.error || "Failed to start lawyer signup.");
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw signInError;

      window.location.assign(payload.checkoutUrl);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to start lawyer signup.");
      setLoading(false);
      return;
    }

    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Advocate signup is billed at {monthlyPkrLabel}/month, based on {monthlyUsdLabel} monthly pricing.
      </div>

      {error && <div className="alert-error">{error}</div>}

      <div>
        <label className="label" htmlFor="fullName">
          Full name
        </label>
        <input
          id="fullName"
          className="input"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Advocate name"
          required
        />
      </div>

      <div>
        <label className="label" htmlFor="email">
          Email address
        </label>
        <input
          id="email"
          type="email"
          className="input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />
      </div>

      <div>
        <label className="label" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          className="input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Create a secure password"
          minLength={6}
          required
        />
      </div>

      <div>
        <label className="label" htmlFor="confirmPassword">
          Confirm password
        </label>
        <input
          id="confirmPassword"
          type="password"
          className="input"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Repeat your password"
          minLength={6}
          required
        />
      </div>

      <button type="submit" className="btn-primary w-full py-2.5" disabled={loading}>
        {loading ? "Redirecting to Stripe..." : `Start lawyer plan at ${monthlyPkrLabel}/month`}
      </button>

      <p className="text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link href="/auth" className="font-medium text-navy-700 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
