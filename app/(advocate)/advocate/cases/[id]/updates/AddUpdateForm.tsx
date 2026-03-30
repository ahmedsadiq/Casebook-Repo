"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { CaseStatus } from "@/lib/supabase/types";
import { normalizeCaseStatus } from "@/lib/utils";

const MAX_DOCUMENT_SIZE = 20 * 1024 * 1024;

interface Props {
  caseId: string;
  currentStatus: CaseStatus;
  redirectPath: string;
}

export default function AddUpdateForm({ caseId, currentStatus, redirectPath }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const normalizedCurrentStatus = normalizeCaseStatus(currentStatus);
  const [isNavigating, startNavigation] = useTransition();

  const [content, setContent] = useState("");
  const [hearingDate, setHearingDate] = useState("");
  const [newStatus, setNewStatus] = useState<CaseStatus>(normalizedCurrentStatus);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function getErrorMessage(err: unknown): string {
    if (!err) return "Something went wrong.";
    if (typeof err === "string") return err;
    const e = err as { message?: string; details?: string; hint?: string; code?: string };
    if (e.code === "AUTH") return "You must be signed in to save an update.";
    if (e.code === "42501") return "You do not have permission to update this case.";
    if (e.code === "42P17" || e.message?.toLowerCase().includes("infinite recursion")) {
      return "Database policy recursion detected. Run the RLS fix migration (supabase/migrations/007_fix_rls_recursion.sql) and try again.";
    }
    if (e.code === "23502") return "Missing required fields. Please fill all required inputs.";
    if (e.message?.toLowerCase().includes("jwt")) return "Your session expired. Please sign in again.";
    if (e.message?.toLowerCase().includes("network")) return "Network error. Please try again.";
    return e.details || e.message || "Something went wrong.";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) {
      setError("Please enter an update note.");
      return;
    }
    if (newStatus === "Pending" && !hearingDate) {
      setError("Next hearing date is required when the case status is Pending.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw { code: "AUTH" };

      const { error: updateError } = await supabase.from("case_updates").insert({
        case_id: caseId,
        author_id: user.id,
        content: content.trim(),
        hearing_date: hearingDate || null,
      });
      if (updateError) throw updateError;

      let previousNext: string | null = null;
      if (hearingDate) {
        const { data: currentCase, error: currentCaseError } = await supabase
          .from("cases")
          .select("next_hearing_date")
          .eq("id", caseId)
          .single();
        if (currentCaseError) throw currentCaseError;
        previousNext = currentCase?.next_hearing_date ?? null;
      }

      const updatePayload: { status?: CaseStatus; next_hearing_date?: string | null; last_hearing_date?: string | null } = {};
      if (newStatus !== normalizedCurrentStatus) updatePayload.status = newStatus;
      if (hearingDate) {
        updatePayload.next_hearing_date = hearingDate;
        if (previousNext !== hearingDate) updatePayload.last_hearing_date = previousNext;
      }

      if (Object.keys(updatePayload).length) {
        const { error: statusError } = await supabase
          .from("cases")
          .update(updatePayload)
          .eq("id", caseId);
        if (statusError) throw statusError;
      }

      if (file) {
        const ext = file.name.split(".").pop();
        const path = `${caseId}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("case-documents")
          .upload(path, file);
        if (uploadError) throw uploadError;

        const { error: docError } = await supabase.from("case_documents").insert({
          case_id: caseId,
          uploader_id: user.id,
          name: file.name,
          storage_path: path,
          size_bytes: file.size,
        });
        if (docError) throw docError;
      }

      setLoading(false);
      startNavigation(() => {
        router.push(redirectPath);
      });
    } catch (err: unknown) {
      setError(getErrorMessage(err));
      setLoading(false);
    }
  }

  const isBusy = loading || isNavigating;
  const isPendingStatus = newStatus === "Pending";
  const submitLabel = loading ? "Saving update..." : isNavigating ? "Opening case..." : "Save Update";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <div className="alert-error">{error}</div>}

      <div>
        <label className="label">Update note <span className="text-red-400">*</span></label>
        <textarea
          className="input resize-none"
          rows={5}
          placeholder="Describe what happened, decisions made, next steps..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Update case status</label>
          <select className="input" value={newStatus} onChange={(e) => setNewStatus(e.target.value as CaseStatus)}>
            <option value="Pending">Pending</option>
            <option value="Decided">Decided</option>
            <option value="Disposed of">Disposed of</option>
            <option value="Date in Office">Date in Office</option>
            <option value="Rejected">Rejected</option>
            <option value="Accepted">Accepted</option>
          </select>
          {newStatus !== normalizedCurrentStatus && (
            <p className="mt-1 text-xs text-amber-600">
              Status will change from <strong>{normalizedCurrentStatus}</strong> to <strong>{newStatus}</strong>
            </p>
          )}
        </div>
        <div>
          <label className="label">
            Next hearing date {isPendingStatus && <span className="text-red-400">*</span>}
          </label>
          <input
            type="date"
            className="input"
            value={hearingDate}
            onChange={(e) => setHearingDate(e.target.value)}
            required={isPendingStatus}
          />
          {isPendingStatus && (
            <p className="mt-1 text-xs text-amber-600">Pending cases must have a next hearing date.</p>
          )}
        </div>
      </div>

      <div>
        <label className="label">Attach document <span className="text-xs font-normal text-gray-400">(optional)</span></label>
        <input
          type="file"
          className="input cursor-pointer py-2 file:mr-3 file:rounded-md file:border-0 file:bg-navy-50 file:px-3 file:py-1 file:text-xs file:font-medium file:text-navy-700 hover:file:bg-navy-100"
          onChange={(e) => {
            const selectedFile = e.target.files?.[0] ?? null;
            if (selectedFile && selectedFile.size > MAX_DOCUMENT_SIZE) {
              setError("Document must be smaller than 20MB.");
              setFile(null);
              e.target.value = "";
              return;
            }
            setError(null);
            setFile(selectedFile);
          }}
        />
        <p className="mt-1 text-xs text-gray-400">Maximum file size: 20MB</p>
      </div>

      <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
        {isBusy && (
          <p className="text-xs text-gray-500" aria-live="polite">
            {loading ? "Please wait while we save the update." : "Please wait while we open the case page."}
          </p>
        )}
        <button type="submit" className="btn-primary" disabled={isBusy}>
          {submitLabel}
        </button>
        <button type="button" className="btn-secondary" onClick={() => router.back()} disabled={isBusy}>
          Cancel
        </button>
      </div>
    </form>
  );
}
