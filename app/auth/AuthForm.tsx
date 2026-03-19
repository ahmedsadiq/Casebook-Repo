"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { shouldRequireAdvocateBilling } from "@/lib/advocate-subscription";

export default function AuthForm() {
  const router = useRouter();
  const supabase = createClient();
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

      if (profile?.role === "associate") {
        router.push("/associate/dashboard");
      } else if (profile?.role === "client") {
        router.push("/client/dashboard");
      } else {
        const { data: subscription, error: subscriptionError } = await supabase
          .from("advocate_subscriptions")
          .select("status,stripe_customer_id,stripe_subscription_id,stripe_checkout_session_id")
          .eq("advocate_id", data.user.id)
          .maybeSingle();
        if (subscriptionError) throw subscriptionError;

        if (shouldRequireAdvocateBilling(subscription)) {
          router.push("/billing");
        } else {
          router.push("/advocate/dashboard");
        }
      }

      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign-in failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  }

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

      <button type="submit" className="btn-primary mt-2 w-full py-2.5" disabled={loading}>
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
