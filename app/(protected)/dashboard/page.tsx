import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: cases } = await supabase
    .from("cases")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: allCases } = await supabase
    .from("cases")
    .select("status")
    .eq("user_id", user!.id);

  const counts = {
    total: allCases?.length ?? 0,
    open: allCases?.filter((c) => c.status === "open").length ?? 0,
    pending: allCases?.filter((c) => c.status === "pending").length ?? 0,
    closed: allCases?.filter((c) => c.status === "closed").length ?? 0,
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Overview of your caseload</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Cases", value: counts.total, color: "text-gray-900" },
          { label: "Open", value: counts.open, color: "text-emerald-600" },
          { label: "Pending", value: counts.pending, color: "text-amber-600" },
          { label: "Closed", value: counts.closed, color: "text-gray-500" },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
            <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Recent Cases */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Recent Cases</h2>
          <Link href="/cases/new" className="btn-primary btn-sm">
            + New Case
          </Link>
        </div>
        {!cases || cases.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-400 text-sm">No cases yet.</p>
            <Link href="/cases/new" className="btn-primary btn-sm mt-4 inline-flex">
              Create your first case
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {cases.map((c) => (
              <Link
                key={c.id}
                href={`/cases/${c.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{c.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(c.created_at)}</p>
                </div>
                <StatusBadge status={c.status} />
              </Link>
            ))}
          </div>
        )}
        {cases && cases.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-100">
            <Link href="/cases" className="text-sm text-primary-600 hover:underline">
              View all cases →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "open"
      ? "badge-open"
      : status === "pending"
      ? "badge-pending"
      : "badge-closed";
  return <span className={cls}>{status}</span>;
}
