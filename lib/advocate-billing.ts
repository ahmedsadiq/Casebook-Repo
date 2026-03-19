import type Stripe from "stripe";
import { formatCurrency } from "@/lib/utils";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBaseUrl } from "@/lib/site";
import { getStripe } from "@/lib/stripe";

export type AdvocateSubscriptionStatus =
  | "pending"
  | "incomplete"
  | "incomplete_expired"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "paused";

function parsePositiveNumber(raw: string | undefined, fallback: number, field: string) {
  const value = raw ? Number(raw) : fallback;
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${field} must be a positive number`);
  }
  return value;
}

export function getAdvocatePlanPricing() {
  const monthlyUsd = parsePositiveNumber(process.env.ADVOCATE_MONTHLY_USD, 5, "ADVOCATE_MONTHLY_USD");
  const usdToPkrRate = parsePositiveNumber(process.env.USD_TO_PKR_RATE, 280, "USD_TO_PKR_RATE");
  const monthlyPkr = Math.max(1, Math.round(monthlyUsd * usdToPkrRate));

  return {
    monthlyUsd,
    usdToPkrRate,
    monthlyPkr,
    monthlyPkrMinor: monthlyPkr * 100,
    monthlyPkrLabel: formatCurrency(monthlyPkr),
    monthlyUsdLabel: `$${monthlyUsd.toFixed(monthlyUsd % 1 === 0 ? 0 : 2)}`,
  };
}

type CheckoutSessionArgs = {
  advocateId: string;
  email: string;
  fullName: string | null;
  customerId?: string | null;
};

export async function ensureStripeCustomer({
  advocateId,
  email,
  fullName,
  customerId,
}: CheckoutSessionArgs) {
  const stripe = getStripe();

  if (customerId) return customerId;

  const customer = await stripe.customers.create({
    email,
    name: fullName ?? undefined,
    metadata: {
      advocate_id: advocateId,
    },
  });

  return customer.id;
}

export async function createAdvocateCheckoutSession({
  advocateId,
  email,
  fullName,
  customerId,
}: CheckoutSessionArgs) {
  const stripe = getStripe();
  const pricing = getAdvocatePlanPricing();
  const baseUrl = getBaseUrl();
  const resolvedCustomerId = await ensureStripeCustomer({
    advocateId,
    email,
    fullName,
    customerId,
  });

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: resolvedCustomerId,
    client_reference_id: advocateId,
    success_url: `${baseUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/billing?canceled=1`,
    metadata: {
      advocate_id: advocateId,
    },
    subscription_data: {
      metadata: {
        advocate_id: advocateId,
      },
    },
    billing_address_collection: "auto",
    allow_promotion_codes: true,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "pkr",
          unit_amount: pricing.monthlyPkrMinor,
          recurring: {
            interval: "month",
          },
          product_data: {
            name: "Casebook Advocate Plan",
            description: `Lawyer subscription billed monthly at ${pricing.monthlyPkrLabel}.`,
          },
        },
      },
    ],
  });

  if (!session.url) {
    throw new Error("Stripe did not return a checkout URL");
  }

  return {
    sessionId: session.id,
    url: session.url,
    customerId: resolvedCustomerId,
    amountPkr: pricing.monthlyPkr,
  };
}

async function resolveAdvocateId({
  advocateId,
  customerId,
  subscriptionId,
}: {
  advocateId: string | null;
  customerId: string | null;
  subscriptionId: string;
}) {
  if (advocateId) return advocateId;

  const admin = createAdminClient();
  const { data: subscriptionMatch } = await admin
    .from("advocate_subscriptions")
    .select("advocate_id")
    .eq("stripe_subscription_id", subscriptionId)
    .maybeSingle();

  if (subscriptionMatch?.advocate_id) return subscriptionMatch.advocate_id;
  if (!customerId) return null;

  const { data: customerMatch } = await admin
    .from("advocate_subscriptions")
    .select("advocate_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  return customerMatch?.advocate_id ?? null;
}

export async function syncAdvocateSubscriptionFromStripeSubscription(
  subscription: Stripe.Subscription,
  advocateIdHint?: string | null,
  checkoutSessionId?: string | null,
) {
  const admin = createAdminClient();
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const advocateId = await resolveAdvocateId({
    advocateId:
      advocateIdHint ??
      (typeof subscription.metadata.advocate_id === "string"
        ? subscription.metadata.advocate_id
        : null),
    customerId,
    subscriptionId: subscription.id,
  });

  if (!advocateId) {
    throw new Error(`Could not resolve advocate_id for subscription ${subscription.id}`);
  }

  const firstItem = subscription.items.data[0];
  const amountPkr = firstItem?.price.unit_amount ? Math.round(firstItem.price.unit_amount / 100) : 0;

  const { error } = await admin.from("advocate_subscriptions").upsert({
    advocate_id: advocateId,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    stripe_checkout_session_id: checkoutSessionId ?? null,
    status: subscription.status,
    currency: (firstItem?.price.currency ?? "pkr").toLowerCase(),
    amount_pkr: amountPkr,
    monthly_usd: getAdvocatePlanPricing().monthlyUsd,
    current_period_end: firstItem?.current_period_end
      ? new Date(firstItem.current_period_end * 1000).toISOString()
      : null,
  });

  if (error) {
    throw new Error(`Failed to sync advocate subscription: ${error.message}`);
  }
}

export async function syncAdvocateCheckoutSession(sessionId: string) {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["subscription"],
  });

  if (!session.subscription) return null;

  const subscription =
    typeof session.subscription === "string"
      ? await stripe.subscriptions.retrieve(session.subscription)
      : session.subscription;

  await syncAdvocateSubscriptionFromStripeSubscription(
    subscription,
    typeof session.metadata?.advocate_id === "string" ? session.metadata.advocate_id : null,
    session.id,
  );

  return subscription;
}
