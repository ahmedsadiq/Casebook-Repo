"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { shouldRequireAdvocateBilling } from "@/lib/advocate-subscription";
import { getDashboardPath } from "@/lib/dashboard-path";

export default function AuthForm() {
  const router = useRouter();
  const supabase = createClient();
  const [isNavigating, startNavigation] = useTransition();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;

      let { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle();
      if (profileError) throw profileError;

      if (!profile) {
        const { error: insertError } = await supabase.from("profiles").insert({
          id: data.user.id,
          email: data.user.email ?? null,
          full_name:
            typeof data.user.user_metadata?.full_name === "string"
              ? data.user.user_metadata.full_name
              : null,
          role: "advocate",
        });
        if (insertError) throw insertError;

        const { data: createdProfile, error: createdProfileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .maybeSingle();
        if (createdProfileError) throw createdProfileError;
        profile = createdProfile;
      }

      let nextPath = "";

      if (profile?.role === "associate" || profile?.role === "client") {
        nextPath = getDashboardPath(profile.role);
      } else {
        const { data: subscription, error: subscriptionError } = await supabase
          .from("advocate_subscriptions")
          .select("status,stripe_customer_id,stripe_subscription_id,stripe_checkout_session_id")
          .eq("advocate_id", data.user.id)
          .maybeSingle();
        if (subscriptionError) throw subscriptionError;

        if (shouldRequireAdvocateBilling(subscription)) {
          nextPath = "/billing";
        } else {
          nextPath = "/advocate/dashboard";
        }
      }

      setLoading(false);
      startNavigation(() => {
        router.push(nextPath);
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign-in failed. Please check your credentials.");
      setLoading(false);
    }
  }

  const isBusy = loading || isNavigating;
  const submitLabel = loading ? "Signing in..." : isNavigating ? "Opening dashboard..." : "Sign in";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="alert-error">{error}</div>}

      <div>
        <label className="label" htmlFor="email">
          Email address
        </label>
        <input
          id="email"
          type="email"
          className="input"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
      </div>

      {isBusy && (
        <p className="text-xs text-gray-500" aria-live="polite">
          {loading ? "Please wait while we verify your account." : "Please wait while we open your dashboard."}
        </p>
      )}

      <button type="submit" className="btn-primary mt-2 w-full py-2.5" disabled={isBusy}>
        {submitLabel}
      </button>
    </form>
  );
}
