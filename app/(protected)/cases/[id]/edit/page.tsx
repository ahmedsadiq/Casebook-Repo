import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import CaseForm from "@/components/CaseForm";
import type { Case } from "@/lib/supabase/types";

export default async function EditCasePage({ params }: { params: { id: string } }) {
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

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href={`/cases/${c.id}`} className="text-sm text-gray-400 hover:text-gray-600 mb-2 inline-block">
          ← Back to Case
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit Case</h1>
      </div>
      <div className="card p-6">
        <CaseForm mode="edit" existingCase={c as Case} />
      </div>
    </div>
  );
}
