export function isAdvocateSubscriptionActive(status: string | null | undefined) {
  return status === "active" || status === "trialing";
}

export function formatSubscriptionStatus(status: string | null | undefined) {
  if (!status) return "Pending";
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
