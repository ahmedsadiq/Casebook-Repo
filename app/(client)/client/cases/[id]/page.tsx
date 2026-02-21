import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatDate, formatCurrency } from "@/lib/utils";
import { CaseStatusBadge, PaymentStatusBadge } from "@/components/StatusBadge";

export default async function ClientCaseDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: c }, { data: updates }, { data: payments }] = await Promise.all([
    supabase.from("cases")
      .select("*")
      .eq("id", params.id).eq("client_id", user!.id).single(),
    supabase.from("case_updates")
      .select("*,profiles!case_updates_author_id_fkey(full_name,role)")
      .eq("case_id", params.id).order("created_at", { ascending: false }),
    supabase.from("payments")
      .select("*").eq("case_id", params.id).order("due_date"),
  ]);

  if (!c) notFound();

  type AuthorRow = { full_name: string | null; role: string };
  const totalDue = payments?.filter(p => p.status !== "paid").reduce((s, p) => s + p.amount, 0) ?? 0;

  return (
    <div className="pg-wrap">
      <div className="mb-6">
        <Link href="/client/dashboard" className="text-sm text-gray-400 hover:text-gray-600 mb-1.5 inline-block">← Dashboard</Link>
        <h1 className="text-xl font-semibold text-gray-900">{c.title}</h1>
        <div className="flex items-center gap-2.5 mt-2 flex-wrap">
          <CaseStatusBadge status={c.status} />
          {c.case_number && <span className="text-sm text-gray-400">#{c.case_number}</span>}
          {c.court && <span className="text-sm text-gray-400">· {c.court}</span>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          {/* Case info */}
          <div className="card">
            <div className="card-header"><h2 className="text-sm font-semibold text-gray-700">Case Details</h2></div>
            <div className="card-body grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-0.5">Next Hearing</p>
                <p className="font-bold text-navy-700 text-base">{formatDate(c.next_hearing_date)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-0.5">Status</p>
                <CaseStatusBadge status={c.status} />
              </div>
              {c.description && (
                <div className="col-span-2 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-1.5">Notes from Advocate</p>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{c.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Progress updates */}
          <div className="card">
            <div className="card-header"><h2 className="text-sm font-semibold text-gray-700">Case Progress</h2></div>
            {!updates?.length ? (
              <div className="py-10 text-center text-sm text-gray-400">No updates yet.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {updates.map(u => {
                  const author = u.profiles as unknown as AuthorRow | null;
                  return (
                    <div key={u.id} className="px-6 py-4">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-sm font-medium text-gray-800">{author?.full_name ?? "Legal team"}</span>
                        <span className={author?.role === "advocate" ? "role-advocate" : "role-associate"}>{author?.role}</span>
                        <span className="text-xs text-gray-400 ml-auto">{formatDate(u.created_at)}</span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{u.content}</p>
                      {u.hearing_date && (
                        <div className="mt-2 inline-flex items-center gap-1.5 bg-navy-50 text-navy-700 text-xs font-medium px-3 py-1.5 rounded-full">
                          📅 Next hearing: {formatDate(u.hearing_date)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Payment sidebar */}
        <div className="space-y-5">
          {payments && payments.length > 0 && (
            <div className="card">
              <div className="card-header"><h2 className="text-sm font-semibold text-gray-700">Payments</h2></div>
              <div className="divide-y divide-gray-100">
                {payments.map(p => (
                  <div key={p.id} className="px-4 py-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{p.description}</p>
                        <p className="text-xs text-gray-400">Due {formatDate(p.due_date)}</p>
                      </div>
                      <div className="text-right ml-3">
                        <p className="text-sm font-bold text-gray-900">{formatCurrency(p.amount)}</p>
                        <PaymentStatusBadge status={p.status} />
                      </div>
                    </div>
                  </div>
                ))}
                {totalDue > 0 && (
                  <div className="px-4 py-3 bg-amber-50/60">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Outstanding</p>
                      <p className="text-sm font-bold text-amber-600">{formatCurrency(totalDue)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
