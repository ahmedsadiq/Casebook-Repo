import Image from "next/image";
import Link from "next/link";
import AuthForm from "./AuthForm";
import { getAdvocatePlanPricing } from "@/lib/advocate-billing";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sign In" };

export default function AuthPage() {
  const pricing = getAdvocatePlanPricing();

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10 sm:py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <Image src="/app-icon.jpg" alt="Casebook" width={56} height={56} className="rounded-2xl shadow-card-md" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Welcome back</h1>
          <p className="mt-1 text-sm text-gray-500">Sign in to your Casebook account</p>
        </div>

        <div className="card p-5 sm:p-8">
          <AuthForm />
        </div>

        <div className="mt-5 space-y-2 text-center text-xs text-gray-400">
          <p>Need a lawyer account?</p>
          <p>
            <Link href="/signup/advocate" className="font-medium text-navy-700 hover:underline">
              Start advocate signup at {pricing.monthlyPkrLabel}/month
            </Link>
          </p>
          <p>Associates and clients are still created by an advocate from inside Casebook.</p>
        </div>
      </div>
    </main>
  );
}
