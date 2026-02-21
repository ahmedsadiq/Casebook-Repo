"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DeleteCaseButton({ caseId, caseTitle }: { caseId: string; caseTitle: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete "${caseTitle}"?\n\nThis will permanently remove the case, all updates, payments, and documents. This cannot be undone.`)) return;
    setLoading(true);
    const { error } = await supabase.from("cases").delete().eq("id", caseId);
    if (error) { alert("Failed to delete. Please try again."); setLoading(false); return; }
    router.push("/advocate/cases");
    router.refresh();
  }

  return (
    <button onClick={handleDelete} disabled={loading} className="btn-danger btn-sm">
      {loading ? "Deleting…" : "Delete"}
    </button>
  );
}
