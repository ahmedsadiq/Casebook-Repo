import Link from "next/link";
import Image from "next/image";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white flex flex-col">
      <header className="border-b border-gray-100 px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/app-icon.jpg" alt="Casebook" width={34} height={34} className="rounded-xl" />
            <span className="text-lg font-semibold text-gray-900 tracking-tight">Casebook</span>
          </div>
          <Link href="/auth" className="btn-primary">Sign in →</Link>
        </div>
      </header>

      <section className="flex-1 flex items-center justify-center px-6 py-28">
        <div className="max-w-2xl mx-auto text-center">
          <div className="flex justify-center mb-8">
            <Image src="/app-icon.jpg" alt="Casebook" width={96} height={96} className="rounded-2xl shadow-card-md" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 tracking-tight leading-tight mb-5">
            Every case.<br />
            <span className="text-navy-700">Under control.</span>
          </h1>
          <p className="text-xl text-gray-500 leading-relaxed mb-10 max-w-xl mx-auto">
            Casebook gives advocates, associates, and clients one platform to manage cases, track hearings, and monitor payments — seamlessly.
          </p>
          <Link href="/auth" className="btn-primary text-base px-8 py-3 rounded-xl shadow-card-md">
            Get started free
          </Link>
        </div>
      </section>

      <section className="border-t border-gray-100 bg-gray-50/60 px-6 py-16">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: "⚖️", role: "Advocate", color: "text-navy-700", bg: "bg-navy-50", desc: "Full control — manage cases, clients, associates, payments, and all case updates." },
            { icon: "📋", role: "Associate", color: "text-violet-700", bg: "bg-violet-50", desc: "View assigned cases, add progress notes, log hearings, upload documents, update status." },
            { icon: "👤", role: "Client",    color: "text-teal-700",   bg: "bg-teal-50",   desc: "See case progress, upcoming hearing dates, pending dues, and team contacts." },
          ].map(f => (
            <div key={f.role} className="card p-6">
              <div className={`w-11 h-11 ${f.bg} rounded-xl flex items-center justify-center text-2xl mb-4`}>{f.icon}</div>
              <p className={`font-semibold text-base ${f.color} mb-1.5`}>{f.role}</p>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-gray-100 px-8 py-5 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} Casebook — Built for legal professionals.
      </footer>
    </main>
  );
}
