"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ProfileForm({ fullName, phone }: { fullName: string; phone: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [name,    setName]    = useState(fullName);
  const [ph,      setPh]      = useState(phone);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setSuccess(false); setError(null);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("profiles")
      .update({ full_name: name, phone: ph || null }).eq("id", user!.id);
    if (error) setError(error.message);
    else { setSuccess(true); router.refresh(); }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error   && <div className="alert-error">{error}</div>}
      {success && <div className="alert-success">Profile updated successfully.</div>}
      <div>
        <label className="label">Full name</label>
        <input className="input" value={name} onChange={e => setName(e.target.value)} required />
      </div>
      <div>
        <label className="label">Phone</label>
        <input type="tel" className="input" placeholder="+92 300 0000000" value={ph}
          onChange={e => setPh(e.target.value)} />
      </div>
      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? "Saving…" : "Save Changes"}
      </button>
    </form>
  );
}
