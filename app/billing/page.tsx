import { redirect } from "next/navigation";
import BillingCheckoutButton from "@/components/BillingCheckoutButton";
import SignOutButton from "@/components/SignOutButton";
import { getAdvocatePlanPricing } from "@/lib/advocate-billing";
import {
  formatSubscriptionStatus,
  isAdvocateSubscriptionActive,
  shouldRequireAdvocateBilling,
} from "@/lib/advocate-subscription";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Billing" };

export default async function BillingPage({
  searchParams,
}: {
  searchParams?: { canceled?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const [{ data: profile }, { data: subscription }] = await Promise.all([
    supabase.from("profiles").select("role,full_name,email").eq("id", user.id).maybeSingle(),
    supabase
      .from("advocate_subscriptions")
      .select("status,amount_pkr,current_period_end,stripe_customer_id,stripe_subscription_id,stripe_checkout_session_id")
      .eq("advocate_id", user.id)
      .maybeSingle(),
  ]);

  if (profile?.role !== "advocate") redirect("/auth");
  if (!shouldRequireAdvocateBilling(subscription)) redirect("/advocate/dashboard");

  const gatedSubscription = subscription!;
  if (isAdvocateSubscriptionActive(gatedSubscription.status)) redirect("/advocate/dashboard");

  const pricing = getAdvocatePlanPricing();
  const monthlyLabel = gatedSubscription.amount_pkr
    ? `Rs ${new Intl.NumberFormat("en-PK").format(gatedSubscription.amount_pkr)}`
    : pricing.monthlyPkrLabel;

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="card p-8">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Advocate Billing</p>
            <h1 className="mt-2 text-3xl font-semibold text-gray-900">Complete your monthly lawyer plan</h1>
            <p className="mt-2 text-sm text-gray-500">
              Your account exists, but advocate access stays locked until Stripe confirms the subscription.
            </p>
          </div>

          {searchParams?.canceled === "1" && (
            <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Checkout was canceled. Your account is still saved, and you can resume payment below.
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Current Plan</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">{monthlyLabel}/month</p>
              <p className="mt-2 text-sm text-gray-500">Configured from {pricing.monthlyUsdLabel} monthly pricing.</p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Status</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">
                {formatSubscriptionStatus(gatedSubscription.status)}
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Advocate: {profile?.full_name || user.email} ({profile?.email || user.email})
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-navy-100 bg-navy-50/60 p-5">
            <p className="text-sm text-navy-700">
              Once payment succeeds, your advocate dashboard will unlock automatically.
            </p>
            <div className="mt-4">
              <BillingCheckoutButton label={`Continue with Stripe for ${monthlyLabel}/month`} />
            </div>
          </div>

          <div className="mt-6 text-sm text-gray-500">
            Need to sign in with a different account?{" "}
            <SignOutButton label="Sign out and go to sign in" />
          </div>
        </div>
      </div>
    </main>
  );
}
