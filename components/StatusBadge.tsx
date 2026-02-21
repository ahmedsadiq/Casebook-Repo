import type { CaseStatus, PaymentStatus } from "@/lib/supabase/types";

export function CaseStatusBadge({ status }: { status: CaseStatus }) {
  const cls = status === "open" ? "badge-open" : status === "pending" ? "badge-pending" : "badge-closed";
  return <span className={cls}>{status}</span>;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const cls = status === "paid" ? "badge-paid" : status === "overdue" ? "badge-overdue" : "badge-due";
  return <span className={cls}>{status}</span>;
}
