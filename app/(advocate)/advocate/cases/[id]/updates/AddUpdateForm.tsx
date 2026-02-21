"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { CaseStatus } from "@/lib/supabase/types";

interface Props {
  caseId: string;
  currentStatus: CaseStatus;
  redirectPath: string;
}

export default function AddUpdateForm({ caseId, currentStatus, redirectPath }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [content,     setContent]     = useState("");
  const [hearingDate, setHearingDate] = useState("");
  const [newStatus,   setNewStatus]   = useState<CaseStatus>(currentStatus);
  const [file,        setFile]        = useState<File | null>(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) { setError("Please enter an update note."); return; }
    setError(null);
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // 1. Insert case update
      const { error: updateError } = await supabase.from("case_updates").insert({
        case_id:      caseId,
        author_id:    user.id,
        content:      content.trim(),
        hearing_date: hearingDate || null,
      });
      if (updateError) throw updateError;

      // 2. Update case status if changed
      if (newStatus !== currentStatus) {
        const { error: statusError } = await supabase.from("cases")
          .update({ status: newStatus, next_hearing_date: hearingDate || undefined })
          .eq("id", caseId);
        if (statusError) throw statusError;
      } else if (hearingDate) {
        await supabase.from("cases").update({ next_hearing_date: hearingDate }).eq("id", caseId);
      }

      // 3. Upload document if provided
      if (file) {
        const ext  = file.name.split(".").pop();
        const path = `${caseId}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("case-documents").upload(path, file);
        if (uploadError) throw uploadError;

        const { error: docError } = await supabase.from("case_documents").insert({
          case_id:      caseId,
          uploader_id:  user.id,
          name:         file.name,
          storage_path: path,
          size_bytes:   file.size,
        });
        if (docError) throw docError;
      }

      router.push(redirectPath);
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

      <div>
        <label className="label">Update note <span className="text-red-400">*</span></label>
        <textarea className="input resize-none" rows={5}
          placeholder="Describe what happened, decisions made, next steps…"
          value={content} onChange={e => setContent(e.target.value)} required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Update case status</label>
          <select className="input" value={newStatus} onChange={e => setNewStatus(e.target.value as CaseStatus)}>
            <option value="open">Open</option>
            <option value="pending">Pending</option>
            <option value="closed">Closed</option>
          </select>
          {newStatus !== currentStatus && (
            <p className="text-xs text-amber-600 mt-1">Status will change from <strong>{currentStatus}</strong> to <strong>{newStatus}</strong></p>
          )}
        </div>
        <div>
          <label className="label">Next hearing date</label>
          <input type="date" className="input" value={hearingDate}
            onChange={e => setHearingDate(e.target.value)} />
        </div>
      </div>

      <div>
        <label className="label">Attach document <span className="text-xs text-gray-400 font-normal">(optional)</span></label>
        <input type="file" className="input py-2 cursor-pointer file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-navy-50 file:text-navy-700 hover:file:bg-navy-100"
          onChange={e => setFile(e.target.files?.[0] ?? null)} />
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Saving…" : "Save Update"}
        </button>
        <button type="button" className="btn-secondary" onClick={() => router.back()} disabled={loading}>Cancel</button>
      </div>
    </form>
  );
}
