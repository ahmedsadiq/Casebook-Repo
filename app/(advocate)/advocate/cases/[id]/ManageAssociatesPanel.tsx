"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Associate {
  id: string;
  full_name: string | null;
  email: string | null;
}

interface Props {
  caseId: string;
  allAssociates: Associate[];
  assigned: Associate[];
}

export default function ManageAssociatesPanel({ caseId, allAssociates, assigned }: Props) {
  const [assignedList, setAssignedList] = useState<Associate[]>(assigned);
  const [selectedId,   setSelectedId]   = useState("");
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const supabase = createClient();
  const router   = useRouter();

  const unassigned = allAssociates.filter(a => !assignedList.find(s => s.id === a.id));

  async function handleAdd() {
    if (!selectedId) return;
    setError(null);
    setLoading(true);
    const { error: err } = await supabase
      .from("case_associates")
      .insert({ case_id: caseId, associate_id: selectedId });
    if (err) {
      setError(err.message);
    } else {
      const associate = allAssociates.find(a => a.id === selectedId)!;
      setAssignedList(prev => [...prev, associate]);
      setSelectedId("");
      router.refresh();
    }
    setLoading(false);
  }

  async function handleRemove(associateId: string) {
    setError(null);
    setLoading(true);
    const { error: err } = await supabase
      .from("case_associates")
      .delete()
      .eq("case_id", caseId)
      .eq("associate_id", associateId);
    if (err) {
      setError(err.message);
    } else {
      setAssignedList(prev => prev.filter(a => a.id !== associateId));
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="text-sm font-semibold text-gray-700">Assigned Associates</h2>
        <span className="text-xs text-gray-400">{assignedList.length} assigned</span>
      </div>
      <div className="card-body space-y-3 text-sm">
        {error && <p className="text-xs text-red-500">{error}</p>}

        {assignedList.length === 0 ? (
          <p className="text-gray-400 text-sm">No associates assigned yet.</p>
        ) : (
          <ul className="space-y-2.5">
            {assignedList.map(a => (
              <li key={a.id} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-gray-800 truncate">{a.full_name ?? "—"}</p>
                  {a.email && <p className="text-xs text-gray-400 truncate">{a.email}</p>}
                </div>
                <button
                  onClick={() => handleRemove(a.id)}
                  disabled={loading}
                  className="shrink-0 text-xs text-red-400 hover:text-red-600 disabled:opacity-40 transition-colors"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        {unassigned.length > 0 && (
          <div className="pt-3 border-t border-gray-100 flex gap-2">
            <select
              className="input text-sm flex-1 min-w-0"
              value={selectedId}
              onChange={e => setSelectedId(e.target.value)}
              disabled={loading}
            >
              <option value="">Add associate…</option>
              {unassigned.map(a => (
                <option key={a.id} value={a.id}>{a.full_name ?? a.id}</option>
              ))}
            </select>
            <button
              onClick={handleAdd}
              disabled={!selectedId || loading}
              className="btn-primary btn-sm shrink-0"
            >
              {loading ? "…" : "Add"}
            </button>
          </div>
        )}

        {allAssociates.length === 0 && (
          <p className="text-xs text-gray-400">
            No associates on your team yet. Add associates from the{" "}
            <a href="/advocate/associates" className="text-navy-600 hover:underline">Associates page</a>.
          </p>
        )}
      </div>
    </div>
  );
}
