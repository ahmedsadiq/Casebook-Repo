"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { PaymentStatus } from "@/lib/supabase/types";

export default function PaymentForm({ caseId }: { caseId: string }) {
  const router   = useRouter();
  const supabase = createClient();

  const [desc,    setDesc]    = useState("");
  const [amount,  setAmount]  = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status,  setStatus]  = useState<PaymentStatus>("pending");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("payments").insert({
        case_id:     caseId,
        advocate_id: user!.id,
        description: desc,
        amount:      parseFloat(amount),
        due_date:    dueDate || null,
        status,
      });
      if (error) throw error;
      setDesc(""); setAmount(""); setDueDate(""); setStatus("pending");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add payment.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="alert-error">{error}</div>}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="label">Description <span className="text-red-400">*</span></label>
          <input className="input" placeholder="e.g. Retainer fee, Court filing fee" value={desc}
            onChange={e => setDesc(e.target.value)} required />
        </div>
        <div>
          <label className="label">Amount (₹) <span className="text-red-400">*</span></label>
          <input type="number" className="input" placeholder="0" min="0" step="0.01" value={amount}
            onChange={e => setAmount(e.target.value)} required />
        </div>
        <div>
          <label className="label">Due date</label>
          <input type="date" className="input" value={dueDate} onChange={e => setDueDate(e.target.value)} />
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input" value={status} onChange={e => setStatus(e.target.value as PaymentStatus)}>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>
      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? "Adding…" : "Add Payment"}
      </button>
    </form>
  );
}
