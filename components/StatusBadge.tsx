import type { CaseStatus, PaymentStatus } from "@/lib/supabase/types";
import { normalizeCaseStatus } from "@/lib/utils";

const CASE_STATUS_CLASS: Record<CaseStatus, string> = {
  "Pending": "badge-pending",
  "Decided": "badge-decided",
  "Disposed of": "badge-disposed",
  "Date in Office": "badge-date-office",
  "Rejected": "badge-rejected",
  "Accepted": "badge-accepted",
};

export function CaseStatusBadge({ status }: { status: CaseStatus }) {
  const normalizedStatus = normalizeCaseStatus(status);
  const cls = CASE_STATUS_CLASS[normalizedStatus];
  return <span className={cls}>{normalizedStatus}</span>;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const cls = status === "paid" ? "badge-paid" : status === "overdue" ? "badge-overdue" : "badge-due";
  return <span className={cls}>{status}</span>;
}
