import type { CaseStatus } from "@/lib/supabase/types";

export function formatDate(d: string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export function normalizeCaseStatus(status: string | null | undefined): CaseStatus {
  const value = status?.trim();

  if (
    value === "Pending" ||
    value === "Decided" ||
    value === "Disposed of" ||
    value === "Date in Office" ||
    value === "Rejected" ||
    value === "Accepted"
  ) {
    return value;
  }

  if (value === "open" || value === "Open" || value === "pending" || value === "Pending") {
    return "Pending";
  }

  if (value === "closed" || value === "Closed") {
    return "Disposed of";
  }

  return "Pending";
}

export function isActiveCaseStatus(status: string | null | undefined): boolean {
  const normalized = normalizeCaseStatus(status);
  return normalized === "Pending" || normalized === "Date in Office";
}

export function isDateUpdateRequired(nextHearingDate: string | null | undefined): boolean {
  if (!nextHearingDate) return false;
  const today = new Date();
  const hearing = new Date(nextHearingDate);
  today.setHours(0, 0, 0, 0);
  hearing.setHours(0, 0, 0, 0);
  return hearing < today;
}

export function formatCurrency(n: number): string {
  const formattedNumber = new Intl.NumberFormat("en-PK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);

  return `Rs ${formattedNumber}`;
}

export function formatFileSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
