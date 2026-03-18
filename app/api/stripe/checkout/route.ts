import { NextResponse } from "next/server";
import { createAdvocateCheckoutSession } from "@/lib/advocate-billing";
import { isAdvocateSubscriptionActive } from "@/lib/advocate-subscription";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [{ data: profile }, { data: subscription }] = await Promise.all([
      supabase.from("profiles").select("role,full_name,email").eq("id", user.id).maybeSingle(),
      supabase
        .from("advocate_subscriptions")
        .select("status,stripe_customer_id")
        .eq("advocate_id", user.id)
        .maybeSingle(),
    ]);

    if (profile?.role !== "advocate") {
      return NextResponse.json({ error: "Only advocates can access billing." }, { status: 403 });
    }

    if (isAdvocateSubscriptionActive(subscription?.status)) {
      return NextResponse.json({ error: "Your subscription is already active." }, { status: 400 });
    }

    const checkout = await createAdvocateCheckoutSession({
      advocateId: user.id,
      email: user.email ?? profile?.email ?? "",
      fullName: profile?.full_name ?? null,
      customerId: subscription?.stripe_customer_id ?? null,
    });

    const admin = createAdminClient();
    const { error } = await admin.from("advocate_subscriptions").upsert({
      advocate_id: user.id,
      stripe_customer_id: checkout.customerId,
      stripe_checkout_session_id: checkout.sessionId,
      status: subscription?.status ?? "pending",
      currency: "pkr",
      amount_pkr: checkout.amountPkr,
    });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ checkoutUrl: checkout.url });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create checkout session." },
      { status: 500 },
    );
  }
}
