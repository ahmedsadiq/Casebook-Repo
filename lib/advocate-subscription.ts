export function isAdvocateSubscriptionActive(status: string | null | undefined) {
  return status === "active" || status === "trialing";
}

type AdvocateBillingRow = {
  status: string | null | undefined;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  stripe_checkout_session_id?: string | null;
} | null | undefined;

export function shouldRequireAdvocateBilling(subscription: AdvocateBillingRow) {
  if (!subscription) return false;
  if (isAdvocateSubscriptionActive(subscription.status)) return false;

  return Boolean(
    subscription.stripe_customer_id ||
    subscription.stripe_subscription_id ||
    subscription.stripe_checkout_session_id
  );
}

export function formatSubscriptionStatus(status: string | null | undefined) {
  if (!status) return "Pending";
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
