import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import AddMemberForm from "../AddMemberForm";
import DeleteMemberButton from "../DeleteMemberButton";

export const metadata = { title: "Clients" };

export default async function ClientsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: clients } = await supabase
    .from("profiles")
    .select("id,full_name,email,phone,created_at")
    .eq("advocate_id", user!.id)
    .eq("role", "client")
    .order("full_name");

  return (
    <div className="pg-wrap">
      <div className="pg-head">
        <div>
          <h1 className="pg-title">Clients</h1>
          <p className="pg-sub">{clients?.length ?? 0} client{clients?.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <div className="card">
            {!clients?.length ? (
              <div className="py-16 text-center">
                <p className="text-gray-400 text-sm">No clients added yet.</p>
              </div>
            ) : (
              <table className="w-full table-fixed">
                <thead>
                  <tr className="thead">
                    <th className="w-[28%]">Name</th>
                    <th className="w-[27%]">Email</th>
                    <th className="w-[17%]">Phone</th>
                    <th className="w-[15%]">Added</th>
                    <th className="w-[13%]"></th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map(c => (
                    <tr key={c.id} className="trow">
                      <td className="tcell">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-medium text-gray-900 truncate">{c.full_name ?? "—"}</span>
                          <span className="role-client shrink-0">client</span>
                        </div>
                      </td>
                      <td className="tcell text-gray-600 truncate max-w-0">{c.email ?? "—"}</td>
                      <td className="tcell text-gray-500">{c.phone ?? "—"}</td>
                      <td className="tcell text-gray-400">{formatDate(c.created_at)}</td>
                      <td className="tcell text-right">
                        <DeleteMemberButton memberId={c.id} name={c.full_name ?? "client"} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Add Client</h2>
          <AddMemberForm role="client" />
        </div>
      </div>
    </div>
  );
}
