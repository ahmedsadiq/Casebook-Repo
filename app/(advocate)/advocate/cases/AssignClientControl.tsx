"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type ClientOption = {
  id: string;
  full_name: string | null;
  email?: string | null;
};

type Props = {
  caseId: string;
  currentClientId: string | null;
  clients: ClientOption[];
  compact?: boolean;
};

export default function AssignClientControl({ caseId, currentClientId, clients, compact = false }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(currentClientId ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isRefreshing, startRefresh] = useTransition();

  const sortedClients = useMemo(
    () => [...clients].sort((a, b) => (a.full_name ?? "").localeCompare(b.full_name ?? "")),
    [clients],
  );

  async function handleSave() {
    setError(null);
    setSaving(true);

    const { error: updateError } = await supabase
      .from("cases")
      .update({ client_id: selectedClientId || null })
      .eq("id", caseId);

    if (updateError) {
      setError(updateError.message || "Could not update the client assignment.");
      setSaving(false);
      return;
    }

    setSaving(false);
    setIsOpen(false);
    startRefresh(() => {
      router.refresh();
    });
  }

  const isBusy = saving || isRefreshing;
  const triggerLabel = currentClientId ? "Change client" : "Assign client";

  if (!sortedClients.length) {
    return <p className="text-xs text-gray-400">Add a client first to link this case.</p>;
  }

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      {!isOpen ? (
        <button type="button" className={compact ? "text-xs font-semibold text-navy-700 hover:underline" : "btn-secondary btn-sm"} onClick={() => setIsOpen(true)}>
          {triggerLabel}
        </button>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 px-3 py-3">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">Client</label>
          <select
            className="input"
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            disabled={isBusy}
          >
            <option value="">No client assigned</option>
            {sortedClients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.full_name ?? client.email ?? client.id}
              </option>
            ))}
          </select>

          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button type="button" className="btn-primary btn-sm" onClick={handleSave} disabled={isBusy}>
              {saving ? "Saving..." : isRefreshing ? "Updating..." : "Save"}
            </button>
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={() => {
                setSelectedClientId(currentClientId ?? "");
                setError(null);
                setIsOpen(false);
              }}
              disabled={isBusy}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
