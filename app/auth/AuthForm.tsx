"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthForm() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      let { data: profile, error: profileError } = await supabase
        .from("profiles").select("role").eq("id", data.user.id).maybeSingle();
      if (profileError) throw profileError;

      if (!profile) {
        const { error: insertError } = await supabase.from("profiles").insert({
          id: data.user.id,
          email: data.user.email ?? null,
          full_name: typeof data.user.user_metadata?.full_name === "string"
            ? data.user.user_metadata.full_name
            : null,
          role: "advocate",
        });
        if (insertError) throw insertError;

        const { data: createdProfile, error: createdProfileError } = await supabase
          .from("profiles").select("role").eq("id", data.user.id).maybeSingle();
        if (createdProfileError) throw createdProfileError;
        profile = createdProfile;
      }

      if (profile?.role === "associate") router.push("/associate/dashboard");
      else if (profile?.role === "client") router.push("/client/dashboard");
      else router.push("/advocate/dashboard");
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
        <label className="label" htmlFor="email">Email address</label>
        <input id="email" type="email" className="input" placeholder="you@example.com"
          value={email} onChange={e => setEmail(e.target.value)} required />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input id="password" type="password" className="input" placeholder="••••••••"
          value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
      </div>
      <button type="submit" className="btn-primary w-full py-2.5 mt-2" disabled={loading}>
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
