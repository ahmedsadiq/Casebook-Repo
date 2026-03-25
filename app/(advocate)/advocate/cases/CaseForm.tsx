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

  const normalizeStatus = (value: string): CaseStatus | null => {
    const v = value?.trim();
    if (!v) return null;
    if (v === "open" || v === "pending") return "Pending";
    if (v === "closed") return "Disposed of";
    if (v === "Pending" || v === "Decided" || v === "Disposed of" || v === "Date in Office" || v === "Rejected" || v === "Accepted") {
      return v as CaseStatus;
    }
    return null;
  };

  const initialStatus = normalizeStatus((existingCase?.status ?? "Pending") as unknown as string) ?? "Pending";

  const [title,       setTitle]       = useState(existingCase?.title ?? "");
  const [description, setDesc]        = useState(existingCase?.description ?? "");
  const [status,      setStatus]      = useState<CaseStatus>(initialStatus);
  const [caseNo,      setCaseNo]      = useState(existingCase?.case_number ?? "");
  const [court,       setCourt]       = useState(existingCase?.court ?? "");
  const [hearing,     setHearing]     = useState(existingCase?.next_hearing_date?.split("T")[0] ?? "");
  const lastHearing = existingCase?.last_hearing_date?.split("T")[0] ?? "";
  const lastHearingDisplay = lastHearing || "Not available";
  const [clientId,    setClientId]    = useState(existingCase?.client_id ?? "");
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  function getErrorMessage(err: unknown): string {
    if (!err) return "Something went wrong.";
    if (typeof err === "string") return err;
    const e = err as { message?: string; details?: string; hint?: string; code?: string };
    if (e.code === "AUTH") return "You must be signed in to save a case.";
    if (e.code === "42501") return "You do not have permission to update this case.";
    if (e.code === "42P17" || e.message?.toLowerCase().includes("infinite recursion")) {
      return "Database policy recursion detected. Run the RLS fix migration (supabase/migrations/007_fix_rls_recursion.sql) and try again.";
    }
    if (e.code === "23514") return "Invalid status. Please choose a valid case status.";
    if (e.code === "23502") return "Missing required fields. Please fill all required inputs.";
    if (e.message?.includes("cases_status_check")) return "Invalid status. Please choose a valid case status.";
    if (e.message?.toLowerCase().includes("jwt")) return "Your session expired. Please sign in again.";
    if (e.message?.toLowerCase().includes("network")) return "Network error. Please try again.";
    return e.details || e.message || "Something went wrong.";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const normalizedStatus = normalizeStatus(status);
      if (!normalizedStatus) {
        setError(`Invalid status value: "${status}"`);
        return;
      }

      const payload: {
        title: string;
        description: string | null;
        status: CaseStatus;
        case_number: string | null;
        court: string | null;
        next_hearing_date: string | null;
        last_hearing_date?: string | null;
        client_id: string | null;
      } = {
        title, description: description || null, status: normalizedStatus,
        case_number: caseNo || null, court: court || null,
        next_hearing_date: hearing || null,
        client_id: clientId || null,
      };
      if (mode === "edit" && existingCase) {
        const previousNext = existingCase.next_hearing_date?.split("T")[0] ?? "";
        if (hearing !== previousNext) payload.last_hearing_date = existingCase.next_hearing_date ?? null;
      }

      if (mode === "create") {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw { code: "AUTH" };
        const { data, error } = await supabase.from("cases")
          .insert({ ...payload, advocate_id: user!.id }).select("id").single();
        if (error) throw error;
        if (!data?.id) throw new Error("Case was created but could not be loaded. Please refresh and try again.");
        router.push(`/advocate/cases/${data.id}`);
      } else {
        const { error } = await supabase.from("cases")
          .update(payload).eq("id", existingCase!.id);
        if (error) throw error;
        router.push(`/advocate/cases/${existingCase!.id}`);
      }
      router.refresh();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <div className="alert-error">{error}</div>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
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
            <option value="Pending">Pending</option>
            <option value="Decided">Decided</option>
            <option value="Disposed of">Disposed of</option>
            <option value="Date in Office">Date in Office</option>
            <option value="Rejected">Rejected</option>
            <option value="Accepted">Accepted</option>
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
        <div>
          <label className="label">Last hearing date</label>
          <input type="text" className="input bg-gray-50 text-gray-500" value={lastHearingDisplay} disabled readOnly />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Assign client</label>
          <select className="input" value={clientId} onChange={e => setClientId(e.target.value)}>
            <option value="">— No client assigned —</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.full_name ?? c.id}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label">Description / Notes</label>
          <textarea className="input resize-none" rows={4} placeholder="Case background, key facts…"
            value={description} onChange={e => setDesc(e.target.value)} />
        </div>
      </div>

      <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Saving…" : mode === "create" ? "Create Case" : "Save Changes"}
        </button>
        <button type="button" className="btn-secondary" onClick={() => router.back()} disabled={loading}>Cancel</button>
      </div>
    </form>
  );
}
