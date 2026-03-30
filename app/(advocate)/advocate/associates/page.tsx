import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import AddMemberForm from "../AddMemberForm";
import DeleteMemberButton from "../DeleteMemberButton";

export const metadata = { title: "Associates" };

export default async function AssociatesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: associates } = await supabase
    .from("profiles")
    .select("id,full_name,email,phone,created_at")
    .eq("advocate_id", user!.id)
    .eq("role", "associate")
    .order("full_name");

  return (
    <div className="pg-wrap">
      <div className="pg-head">
        <div>
          <h1 className="pg-title">Associates</h1>
          <p className="pg-sub">{associates?.length ?? 0} associate{associates?.length !== 1 ? "s" : ""} on your team</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <div className="card">
            {!associates?.length ? (
              <div className="py-16 text-center">
                <p className="text-sm text-gray-400">No associates added yet.</p>
                <p className="mt-1 text-xs text-gray-400">Use the form to add an associate.</p>
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
                    {associates.map((associate) => (
                      <tr key={associate.id} className="trow">
                        <td className="tcell">
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="truncate font-medium text-gray-900">{associate.full_name ?? "-"}</span>
                            <span className="role-associate shrink-0">associate</span>
                          </div>
                        </td>
                        <td className="tcell break-all text-gray-600">{associate.email ?? "-"}</td>
                        <td className="tcell text-gray-500">{associate.phone ?? "-"}</td>
                        <td className="tcell text-gray-400">{formatDate(associate.created_at)}</td>
                        <td className="tcell text-right">
                          <DeleteMemberButton memberId={associate.id} name={associate.full_name ?? "associate"} />
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
          <h2 className="mb-4 text-sm font-semibold text-gray-700">Add Associate</h2>
          <AddMemberForm role="associate" />
        </div>
      </div>
    </div>
  );
}
