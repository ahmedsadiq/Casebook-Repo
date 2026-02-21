"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { UserRole } from "@/lib/supabase/types";

export default function AddMemberForm({ role }: { role: "associate" | "client" }) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email,    setEmail]    = useState("");
  const [phone,    setPhone]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [success,  setSuccess]  = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await fetch("/api/members/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, phone, password, role }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to create account");

      setSuccess(`${role === "associate" ? "Associate" : "Client"} account created. They can now sign in.`);
      setFullName(""); setEmail(""); setPhone(""); setPassword("");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error   && <div className="alert-error">{error}</div>}
      {success && <div className="alert-success">{success}</div>}

      <div>
        <label className="label">Full name <span className="text-red-400">*</span></label>
        <input className="input" placeholder="Jane Doe" value={fullName}
          onChange={e => setFullName(e.target.value)} required />
      </div>
      <div>
        <label className="label">Email <span className="text-red-400">*</span></label>
        <input type="email" className="input" placeholder="jane@example.com" value={email}
          onChange={e => setEmail(e.target.value)} required />
      </div>
      <div>
        <label className="label">Phone</label>
        <input type="tel" className="input" placeholder="+92 300 0000000" value={phone}
          onChange={e => setPhone(e.target.value)} />
      </div>
      <div>
        <label className="label">Password <span className="text-red-400">*</span></label>
        <input type="password" className="input" placeholder="Min. 6 characters" value={password}
          onChange={e => setPassword(e.target.value)} required minLength={6} />
        <p className="text-xs text-gray-400 mt-1">Share this with the {role} so they can sign in.</p>
      </div>

      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? "Creating…" : `Create ${role === "associate" ? "Associate" : "Client"} Account`}
      </button>
    </form>
  );
}
