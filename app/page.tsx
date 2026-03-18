import Link from "next/link";
import Image from "next/image";
import { getAdvocatePlanPricing } from "@/lib/advocate-billing";

export default function LandingPage() {
  const pricing = getAdvocatePlanPricing();

  return (
    <main className="flex min-h-screen flex-col bg-white">
      <header className="border-b border-gray-100 px-8 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/app-icon.jpg" alt="Casebook" width={34} height={34} className="rounded-xl" />
            <span className="text-lg font-semibold tracking-tight text-gray-900">Casebook</span>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/signup/advocate" className="btn-secondary">
              Lawyer signup
            </Link>
            <Link href="/auth" className="btn-primary">
              Sign in
            </Link>
          </div>
        </div>
      </header>

      <section className="flex flex-1 items-center justify-center px-6 py-28">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-8 flex justify-center">
            <Image src="/app-icon.jpg" alt="Casebook" width={96} height={96} className="rounded-2xl shadow-card-md" />
          </div>
          <h1 className="mb-5 text-5xl font-bold leading-tight tracking-tight text-gray-900">
            Every case.
            <br />
            <span className="text-navy-700">Under control.</span>
          </h1>
          <p className="mx-auto mb-10 max-w-xl text-xl leading-relaxed text-gray-500">
            Casebook gives advocates, associates, and clients one platform to manage cases, track hearings, and
            monitor payments seamlessly.
          </p>

          <div className="flex flex-col items-center gap-3">
            <Link href="/signup/advocate" className="btn-primary rounded-xl px-8 py-3 text-base shadow-card-md">
              Start lawyer signup at {pricing.monthlyPkrLabel}/month
            </Link>
            <p className="text-sm text-gray-400">
              Based on {pricing.monthlyUsdLabel} monthly pricing, displayed in PKR.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-gray-100 bg-gray-50/60 px-6 py-16">
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-3">
          {[
            {
              icon: "Adv",
              role: "Advocate",
              color: "text-navy-700",
              bg: "bg-navy-50",
              desc: "Full control to manage cases, clients, associates, payments, and every update.",
            },
            {
              icon: "Asc",
              role: "Associate",
              color: "text-violet-700",
              bg: "bg-violet-50",
              desc: "View assigned cases, add progress notes, log hearings, upload documents, and update status.",
            },
            {
              icon: "Cli",
              role: "Client",
              color: "text-teal-700",
              bg: "bg-teal-50",
              desc: "See case progress, upcoming hearing dates, pending dues, and your legal team contacts.",
            },
          ].map((feature) => (
            <div key={feature.role} className="card p-6">
              <div
                className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl text-sm font-semibold ${feature.bg}`}
              >
                {feature.icon}
              </div>
              <p className={`mb-1.5 text-base font-semibold ${feature.color}`}>{feature.role}</p>
              <p className="text-sm leading-relaxed text-gray-500">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-gray-100 px-8 py-5 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} Casebook. Built for legal professionals.
      </footer>
    </main>
  );
}
