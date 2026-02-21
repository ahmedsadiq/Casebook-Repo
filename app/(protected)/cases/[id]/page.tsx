import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import DeleteCaseButton from "./DeleteCaseButton";

export default async function CasePage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: c } = await supabase
    .from("cases")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user!.id)
    .single();

  if (!c) notFound();

  const statusCls =
    c.status === "open" ? "badge-open" : c.status === "pending" ? "badge-pending" : "badge-closed";

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link href="/cases" className="text-sm text-gray-400 hover:text-gray-600 mb-2 inline-block">
            ← Back to Cases
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{c.title}</h1>
        </div>
        <div className="flex items-center gap-2 mt-6">
          <Link href={`/cases/${c.id}/edit`} className="btn-secondary btn-sm">
            Edit
          </Link>
          <DeleteCaseButton caseId={c.id} caseTitle={c.title} />
        </div>
      </div>

      <div className="card p-6 space-y-5">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 w-28">Status</span>
          <span className={statusCls}>{c.status}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-sm text-gray-500 w-28">Created</span>
          <span className="text-sm text-gray-900">{formatDate(c.created_at)}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-sm text-gray-500 w-28">Last updated</span>
          <span className="text-sm text-gray-900">{formatDate(c.updated_at)}</span>
        </div>
        {c.description && (
          <div className="pt-4 border-t border-gray-100">
            <p className="text-sm font-medium text-gray-700 mb-2">Description</p>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{c.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}
