import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { syncAdvocateCheckoutSession } from "@/lib/advocate-billing";

export const metadata = { title: "Billing Success" };

export default async function BillingSuccessPage({
  searchParams,
}: {
  searchParams?: { session_id?: string };
}) {
  if (searchParams?.session_id) {
    try {
      await syncAdvocateCheckoutSession(searchParams.session_id);
    } catch {
      // Webhook still handles the canonical sync path. We keep this page resilient if eager sync fails.
    }
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-xl">
        <div className="card p-5 text-center sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">Payment Received</p>
          <h1 className="mt-3 text-2xl font-semibold text-gray-900 sm:text-3xl">Your lawyer plan is being activated</h1>
          <p className="mt-3 text-sm leading-6 text-gray-500">
            Stripe has returned successfully. If your subscription has finished syncing, you can continue straight to
            the advocate dashboard.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href={user ? "/advocate/dashboard" : "/auth"} className="btn-primary">
              {user ? "Open advocate dashboard" : "Sign in"}
            </Link>
            <Link href="/billing" className="btn-secondary">
              View billing status
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
