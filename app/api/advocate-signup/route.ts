import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createAdvocateCheckoutSession, getAdvocatePlanPricing } from "@/lib/advocate-billing";
import { getStripe } from "@/lib/stripe";

const schema = z.object({
  fullName: z.string().trim().min(2),
  email: z.string().trim().email(),
  password: z.string().min(6),
});

export async function POST(req: NextRequest) {
  let createdUserId: string | null = null;
  let createdCustomerId: string | null = null;

  try {
    const body = schema.parse(await req.json());
    const admin = createAdminClient();
    const pricing = getAdvocatePlanPricing();

    const { data: createdUser, error: authError } = await admin.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true,
      user_metadata: {
        full_name: body.fullName,
      },
    });

    if (authError || !createdUser.user) {
      return NextResponse.json(
        { error: authError?.message || "Failed to create advocate account." },
        { status: 400 },
      );
    }

    createdUserId = createdUser.user.id;

    const { error: profileError } = await admin.from("profiles").upsert({
      id: createdUser.user.id,
      full_name: body.fullName,
      email: body.email,
      role: "advocate",
    });

    if (profileError) {
      throw new Error(profileError.message);
    }

    const checkout = await createAdvocateCheckoutSession({
      advocateId: createdUser.user.id,
      email: body.email,
      fullName: body.fullName,
    });

    createdCustomerId = checkout.customerId;

    const { error: subscriptionError } = await admin.from("advocate_subscriptions").upsert({
      advocate_id: createdUser.user.id,
      stripe_customer_id: checkout.customerId,
      stripe_checkout_session_id: checkout.sessionId,
      status: "pending",
      currency: "pkr",
      amount_pkr: checkout.amountPkr,
      monthly_usd: pricing.monthlyUsd,
    });

    if (subscriptionError) {
      throw new Error(subscriptionError.message);
    }

    return NextResponse.json({
      checkoutUrl: checkout.url,
    });
  } catch (err: unknown) {
    try {
      const admin = createAdminClient();
      if (createdUserId) {
        await admin.auth.admin.deleteUser(createdUserId);
      }

      if (createdCustomerId) {
        await getStripe().customers.del(createdCustomerId);
      }
    } catch {
      // Best-effort rollback only.
    }

    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to start advocate signup." },
      { status: 500 },
    );
  }
}
