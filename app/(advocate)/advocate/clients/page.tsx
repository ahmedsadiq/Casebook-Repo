import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import AddMemberForm from "../AddMemberForm";
import DeleteMemberButton from "../DeleteMemberButton";

export const metadata = { title: "Clients" };

export default async function ClientsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <div className="card">
            {!clients?.length ? (
              <div className="py-16 text-center">
                <p className="text-sm text-gray-400">No clients added yet.</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="data-table-wide">
                  <thead>
                    <tr className="thead">
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Added</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map((client) => (
                      <tr key={client.id} className="trow">
                        <td className="tcell">
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="truncate font-medium text-gray-900">{client.full_name ?? "-"}</span>
                            <span className="role-client shrink-0">client</span>
                          </div>
                        </td>
                        <td className="tcell break-all text-gray-600">{client.email ?? "-"}</td>
                        <td className="tcell text-gray-500">{client.phone ?? "-"}</td>
                        <td className="tcell text-gray-400">{formatDate(client.created_at)}</td>
                        <td className="tcell text-right">
                          <DeleteMemberButton memberId={client.id} name={client.full_name ?? "client"} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="card p-5 sm:p-6">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">Add Client</h2>
          <AddMemberForm role="client" />
        </div>
      </div>
    </div>
  );
}
