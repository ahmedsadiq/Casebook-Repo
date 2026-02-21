"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Case, CaseStatus } from "@/lib/supabase/types";

interface Client { id: string; full_name: string | null; }

interface Props {
  mode: "create" | "edit";
  existingCase?: Case;
  clients: Client[];
}

export default function CaseForm({ mode, existingCase, clients }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [title,       setTitle]       = useState(existingCase?.title ?? "");
  const [description, setDesc]        = useState(existingCase?.description ?? "");
  const [status,      setStatus]      = useState<CaseStatus>(existingCase?.status ?? "open");
  const [caseNo,      setCaseNo]      = useState(existingCase?.case_number ?? "");
  const [court,       setCourt]       = useState(existingCase?.court ?? "");
  const [hearing,     setHearing]     = useState(existingCase?.next_hearing_date?.split("T")[0] ?? "");
  const [clientId,    setClientId]    = useState(existingCase?.client_id ?? "");
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload = {
        title, description: description || null, status,
        case_number: caseNo || null, court: court || null,
        next_hearing_date: hearing || null,
        client_id: clientId || null,
      };

      if (mode === "create") {
        const { data: { user } } = await supabase.auth.getUser();
        const { data, error } = await supabase.from("cases")
          .insert({ ...payload, advocate_id: user!.id }).select().single();
        if (error) throw error;
        router.push(`/advocate/cases/${data.id}`);
      } else {
        const { error } = await supabase.from("cases")
          .update(payload).eq("id", existingCase!.id);
        if (error) throw error;
        router.push(`/advocate/cases/${existingCase!.id}`);
      }
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <div className="alert-error">{error}</div>}

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="label">Case title <span className="text-red-400">*</span></label>
          <input className="input" placeholder="e.g. Smith v. Jones" value={title}
            onChange={e => setTitle(e.target.value)} required />
        </div>
        <div>
          <label className="label">Case number</label>
          <input className="input" placeholder="e.g. CIV/2024/001" value={caseNo}
            onChange={e => setCaseNo(e.target.value)} />
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input" value={status} onChange={e => setStatus(e.target.value as CaseStatus)}>
            <option value="open">Open</option>
            <option value="pending">Pending</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <div>
          <label className="label">Court</label>
          <input className="input" placeholder="e.g. District Court, Lahore" value={court}
            onChange={e => setCourt(e.target.value)} />
        </div>
        <div>
          <label className="label">Next hearing date</label>
          <input type="date" className="input" value={hearing}
            onChange={e => setHearing(e.target.value)} />
        </div>
        <div className="col-span-2">
          <label className="label">Assign client</label>
          <select className="input" value={clientId} onChange={e => setClientId(e.target.value)}>
            <option value="">— No client assigned —</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.full_name ?? c.id}</option>
            ))}
          </select>
        </div>
        <div className="col-span-2">
          <label className="label">Description / Notes</label>
          <textarea className="input resize-none" rows={4} placeholder="Case background, key facts…"
            value={description} onChange={e => setDesc(e.target.value)} />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Saving…" : mode === "create" ? "Create Case" : "Save Changes"}
        </button>
        <button type="button" className="btn-secondary" onClick={() => router.back()} disabled={loading}>Cancel</button>
      </div>
    </form>
  );
}
