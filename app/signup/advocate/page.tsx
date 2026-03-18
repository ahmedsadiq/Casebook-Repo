import Image from "next/image";
import Link from "next/link";
import AdvocateSignupForm from "./AdvocateSignupForm";
import { getAdvocatePlanPricing } from "@/lib/advocate-billing";

export const metadata = { title: "Advocate Signup" };

export default function AdvocateSignupPage() {
  const pricing = getAdvocatePlanPricing();

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-[28px] bg-gradient-to-br from-navy-900 via-navy-800 to-slate-900 p-8 text-white shadow-card md:p-10">
          <div className="flex items-center gap-3">
            <Image src="/app-icon.jpg" alt="Casebook" width={40} height={40} className="rounded-xl" />
            <span className="text-lg font-semibold tracking-tight">Casebook</span>
          </div>

          <div className="mt-10 max-w-xl">
            <p className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-navy-100">
              Paid Lawyer Signup
            </p>
            <h1 className="mt-5 text-4xl font-bold leading-tight md:text-5xl">
              Launch your advocate workspace for {pricing.monthlyPkrLabel}/month
            </h1>
            <p className="mt-5 text-base leading-7 text-navy-100">
              This plan is based on {pricing.monthlyUsdLabel} monthly pricing and is displayed in PKR
              using your configured USD to PKR rate.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-navy-100">Monthly Fee</p>
              <p className="mt-2 text-2xl font-semibold">{pricing.monthlyPkrLabel}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-navy-100">Base USD</p>
              <p className="mt-2 text-2xl font-semibold">{pricing.monthlyUsdLabel}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-navy-100">Exchange Rate</p>
              <p className="mt-2 text-2xl font-semibold">Rs {pricing.usdToPkrRate}</p>
            </div>
          </div>

          <div className="mt-8 space-y-3 text-sm text-navy-50">
            <p>Advocates get the full case dashboard, payments, clients, associates, and updates workflow.</p>
            <p>Associates and clients are still created by the advocate after signup.</p>
            <p>Checkout and recurring billing are handled securely with Stripe.</p>
          </div>
        </section>

        <section className="card p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Create advocate account</h2>
            <p className="mt-1 text-sm text-gray-500">
              We&apos;ll create your account first, then send you to Stripe to activate the monthly plan.
            </p>
          </div>

          <AdvocateSignupForm
            monthlyPkrLabel={pricing.monthlyPkrLabel}
            monthlyUsdLabel={pricing.monthlyUsdLabel}
          />

          <p className="mt-6 text-center text-xs text-gray-400">
            By continuing, you agree to monthly billing through Stripe.
          </p>
          <p className="mt-2 text-center text-xs text-gray-400">
            <Link href="/auth" className="hover:text-gray-600">
              Back to sign in
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
