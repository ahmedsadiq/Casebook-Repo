"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function AddMemberForm({ role }: { role: "associate" | "client" }) {
  const router = useRouter();
  const [isRefreshing, startRefresh] = useTransition();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [clearSuccessAfterRefresh, setClearSuccessAfterRefresh] = useState(false);

  useEffect(() => {
    if (!isRefreshing && clearSuccessAfterRefresh) {
      setSuccess(null);
      setClearSuccessAfterRefresh(false);
    }
  }, [clearSuccessAfterRefresh, isRefreshing]);

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

      const memberLabel = role === "associate" ? "Associate" : "Client";
      setSuccess(`${memberLabel} account created. Updating the list now...`);
      setClearSuccessAfterRefresh(true);
      setFullName("");
      setEmail("");
      setPhone("");
      setPassword("");
      startRefresh(() => {
        router.refresh();
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const isBusy = loading || isRefreshing;
  const buttonLabel = loading
    ? "Creating account..."
    : isRefreshing
      ? "Updating list..."
      : `Create ${role === "associate" ? "Associate" : "Client"} Account`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
      {error && <div className="alert-error">{error}</div>}
      {success && <div className="alert-success">{success}</div>}

      <div>
        <label className="label">Full name <span className="text-red-400">*</span></label>
        <input
          name="member-full-name"
          className="input"
          placeholder="Jane Doe"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          autoComplete="off"
          required
        />
      </div>
      <div>
        <label className="label">Email <span className="text-red-400">*</span></label>
        <input
          name="member-email"
          type="email"
          className="input"
          placeholder="jane@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          required
        />
      </div>
      <div>
        <label className="label">Phone</label>
        <input
          name="member-phone"
          type="tel"
          className="input"
          placeholder="+92 300 0000000"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          autoComplete="off"
        />
      </div>

      <div>
        <label className="label">Password <span className="text-red-400">*</span></label>
        <input
          name="member-password"
          type="password"
          className="input"
          placeholder="Min. 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          required
          minLength={6}
        />
        <p className="mt-1 text-xs text-gray-400">Set the password you want this {role} to use for sign in.</p>
      </div>

      {isBusy && (
        <p className="text-xs text-gray-500" aria-live="polite">
          {loading ? "Please wait while we create the account." : "Please wait while we refresh the member list."}
        </p>
      )}

      <button type="submit" className="btn-primary w-full" disabled={isBusy}>
        {buttonLabel}
      </button>
    </form>
  );
}
