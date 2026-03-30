"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Case, CaseStatus } from "@/lib/supabase/types";

interface Client {
  id: string;
  full_name: string | null;
}

interface Props {
  mode: "create" | "edit";
  existingCase?: Case;
  clients: Client[];
}

export default function CaseForm({ mode, existingCase, clients }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [isNavigating, startNavigation] = useTransition();

  const normalizeStatus = (value: string): CaseStatus | null => {
    const normalizedValue = value?.trim();

    if (!normalizedValue) return null;
    if (normalizedValue === "open" || normalizedValue === "pending") return "Pending";
    if (normalizedValue === "closed") return "Disposed of";
    if (
      normalizedValue === "Pending" ||
      normalizedValue === "Decided" ||
      normalizedValue === "Disposed of" ||
      normalizedValue === "Date in Office" ||
      normalizedValue === "Rejected" ||
      normalizedValue === "Accepted"
    ) {
      return normalizedValue as CaseStatus;
    }

    return null;
  };

  const initialStatus = normalizeStatus((existingCase?.status ?? "Pending") as unknown as string) ?? "Pending";

  const [title, setTitle] = useState(existingCase?.title ?? "");
  const [description, setDescription] = useState(existingCase?.description ?? "");
  const [status, setStatus] = useState<CaseStatus>(initialStatus);
  const [caseNumber, setCaseNumber] = useState(existingCase?.case_number ?? "");
  const [court, setCourt] = useState(existingCase?.court ?? "");
  const [hearingDate, setHearingDate] = useState(existingCase?.next_hearing_date?.split("T")[0] ?? "");
  const lastHearing = existingCase?.last_hearing_date?.split("T")[0] ?? "";
  const lastHearingDisplay = lastHearing || "Not available";
  const [clientId, setClientId] = useState(existingCase?.client_id ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function getErrorMessage(err: unknown): string {
    if (!err) return "Something went wrong.";
    if (typeof err === "string") return err;

    const normalizedError = err as { message?: string; details?: string; hint?: string; code?: string };

    if (normalizedError.code === "AUTH") return "You must be signed in to save a case.";
    if (normalizedError.code === "42501") return "You do not have permission to update this case.";
    if (
      normalizedError.code === "42P17" ||
      normalizedError.message?.toLowerCase().includes("infinite recursion")
    ) {
      return "Database policy recursion detected. Run the RLS fix migration (supabase/migrations/007_fix_rls_recursion.sql) and try again.";
    }
    if (normalizedError.code === "23514") return "Invalid status. Please choose a valid case status.";
    if (normalizedError.code === "23502") return "Missing required fields. Please fill all required inputs.";
    if (normalizedError.message?.includes("cases_status_check")) {
      return "Invalid status. Please choose a valid case status.";
    }
    if (normalizedError.message?.toLowerCase().includes("jwt")) return "Your session expired. Please sign in again.";
    if (normalizedError.message?.toLowerCase().includes("network")) return "Network error. Please try again.";

    return normalizedError.details || normalizedError.message || "Something went wrong.";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw { code: "AUTH" };

      const normalizedStatus = normalizeStatus(status);
      if (!normalizedStatus) {
        setError(`Invalid status value: "${status}"`);
        setLoading(false);
        return;
      }

      if (normalizedStatus === "Pending" && !hearingDate) {
        setError("Next hearing date is required when the case status is Pending.");
        setLoading(false);
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
        title,
        description: description || null,
        status: normalizedStatus,
        case_number: caseNumber || null,
        court: court || null,
        next_hearing_date: hearingDate || null,
        client_id: clientId || null,
      };

      if (mode === "edit" && existingCase) {
        const previousNextHearing = existingCase.next_hearing_date?.split("T")[0] ?? "";
        if (hearingDate !== previousNextHearing) {
          payload.last_hearing_date = existingCase.next_hearing_date ?? null;
        }
      }

      let nextPath = "";

      if (mode === "create") {
        const { data, error: insertError } = await supabase
          .from("cases")
          .insert({ ...payload, advocate_id: user.id })
          .select("id")
          .single();

        if (insertError) throw insertError;
        if (!data?.id) throw new Error("Case was created but could not be loaded. Please refresh and try again.");

        nextPath = `/advocate/cases/${data.id}`;
      } else {
        const { error: updateError } = await supabase
          .from("cases")
          .update(payload)
          .eq("id", existingCase!.id);

        if (updateError) throw updateError;

        nextPath = `/advocate/cases/${existingCase!.id}`;
      }

      setLoading(false);
      startNavigation(() => {
        router.push(nextPath);
      });
    } catch (err: unknown) {
      setError(getErrorMessage(err));
      setLoading(false);
    }
  }

  const isBusy = loading || isNavigating;
  const submitLabel = loading
    ? mode === "create"
      ? "Creating case..."
      : "Saving changes..."
    : isNavigating
      ? "Opening case..."
      : mode === "create"
        ? "Create Case"
        : "Save Changes";

  const isPendingStatus = status === "Pending";
  const showLastHearingField = mode === "edit";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <div className="alert-error">{error}</div>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label">Case title <span className="text-red-400">*</span></label>
          <input
            className="input"
            placeholder="e.g. Smith v. Jones"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">Case number</label>
          <input
            className="input"
            placeholder="e.g. CIV/2024/001"
            value={caseNumber}
            onChange={(e) => setCaseNumber(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value as CaseStatus)}>
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
          <input
            className="input"
            placeholder="e.g. District Court, Lahore"
            value={court}
            onChange={(e) => setCourt(e.target.value)}
          />
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
        {showLastHearingField && (
          <div>
            <label className="label">Last hearing date</label>
            <input
              type="text"
              className="input bg-gray-50 text-gray-500"
              value={lastHearingDisplay}
              disabled
              readOnly
            />
          </div>
        )}
        <div className="sm:col-span-2">
          <label className="label">Assign client</label>
          <select className="input" value={clientId} onChange={(e) => setClientId(e.target.value)}>
            <option value="">No client assigned</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.full_name ?? client.id}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label">Description / Notes</label>
          <textarea
            className="input resize-none"
            rows={4}
            placeholder="Case background, key facts..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
        {isBusy && (
          <p className="text-xs text-gray-500" aria-live="polite">
            {loading ? "Please wait while we save the case." : "Please wait while we open the case page."}
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
