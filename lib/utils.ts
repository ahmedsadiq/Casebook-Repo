export function formatDate(d: string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
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
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(n);
}

export function formatFileSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
