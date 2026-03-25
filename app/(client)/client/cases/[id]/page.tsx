import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatDate, formatCurrency, normalizeCaseStatus } from "@/lib/utils";
import { CaseStatusBadge, PaymentStatusBadge } from "@/components/StatusBadge";

export default async function ClientCaseDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: rawCase }, { data: updates }, { data: payments }] = await Promise.all([
    supabase.from("cases")
      .select("*")
      .eq("id", params.id).eq("client_id", user!.id).single(),
    supabase.from("case_updates")
      .select("*,profiles!case_updates_author_id_fkey(full_name,role)")
      .eq("case_id", params.id).order("created_at", { ascending: false }),
    supabase.from("payments")
      .select("*").eq("case_id", params.id).order("due_date"),
  ]);

  if (!rawCase) notFound();

  const c = {
    ...rawCase,
    status: normalizeCaseStatus(rawCase.status),
  };

  type AuthorRow = { full_name: string | null; role: string };
  const totalDue = payments?.filter(p => p.status !== "paid").reduce((s, p) => s + p.amount, 0) ?? 0;

  return (
    <div className="pg-wrap">
      <div className="mb-6">
        <Link href="/client/dashboard" className="mb-1.5 inline-block text-sm text-gray-400 hover:text-gray-600">← Dashboard</Link>
        <h1 className="text-xl font-semibold text-gray-900">{c.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2.5">
          <CaseStatusBadge status={c.status} />
          {c.case_number && <span className="text-sm text-gray-400">#{c.case_number}</span>}
          {c.court && <span className="text-sm text-gray-400">· {c.court}</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <div className="card">
            <div className="card-header"><h2 className="text-sm font-semibold text-gray-700">Case Details</h2></div>
            <div className="card-body grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <div>
                <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-gray-400">Next Hearing</p>
                <p className="text-base font-bold text-navy-700">{formatDate(c.next_hearing_date)}</p>
              </div>
              <div>
                <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-gray-400">Last Hearing</p>
                <p className="text-gray-700">{formatDate(c.last_hearing_date)}</p>
              </div>
              <div>
                <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-gray-400">Status</p>
                <CaseStatusBadge status={c.status} />
              </div>
              {c.description && (
                <div className="border-t border-gray-100 pt-3 sm:col-span-2">
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">Notes from Advocate</p>
                  <p className="whitespace-pre-wrap leading-relaxed text-gray-700">{c.description}</p>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h2 className="text-sm font-semibold text-gray-700">Case Progress</h2></div>
            {!updates?.length ? (
              <div className="py-10 text-center text-sm text-gray-400">No updates yet.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {updates.map(u => {
                  const author = u.profiles as unknown as AuthorRow | null;
                  return (
                    <div key={u.id} className="px-4 py-4 sm:px-6">
                      <div className="mb-1.5 flex flex-col gap-2 sm:flex-row sm:items-center">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-gray-800">{author?.full_name ?? "Legal team"}</span>
                          <span className={author?.role === "advocate" ? "role-advocate" : "role-associate"}>{author?.role}</span>
                        </div>
                        <span className="text-xs text-gray-400 sm:ml-auto">{formatDate(u.created_at)}</span>
                      </div>
                      <p className="text-sm leading-relaxed text-gray-700">{u.content}</p>
                      {u.hearing_date && (
                        <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-navy-50 px-3 py-1.5 text-xs font-medium text-navy-700">
                          Next hearing: {formatDate(u.hearing_date)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          {payments && payments.length > 0 && (
            <div className="card">
              <div className="card-header"><h2 className="text-sm font-semibold text-gray-700">Payments</h2></div>
              <div className="divide-y divide-gray-100">
                {payments.map(p => (
                  <div key={p.id} className="px-4 py-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{p.description}</p>
                        <p className="text-xs text-gray-400">Due {formatDate(p.due_date)}</p>
                      </div>
                      <div className="sm:ml-3 sm:text-right">
                        <p className="text-sm font-bold text-gray-900">{formatCurrency(p.amount)}</p>
                        <PaymentStatusBadge status={p.status} />
                      </div>
                    </div>
                  </div>
                ))}
                {totalDue > 0 && (
                  <div className="bg-amber-50/60 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Outstanding</p>
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
