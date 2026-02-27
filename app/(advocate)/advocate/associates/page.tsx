import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import AddMemberForm from "../AddMemberForm";
import DeleteMemberButton from "../DeleteMemberButton";

export const metadata = { title: "Associates" };

export default async function AssociatesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

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

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <div className="card">
            {!associates?.length ? (
              <div className="py-16 text-center">
                <p className="text-gray-400 text-sm">No associates added yet.</p>
                <p className="text-gray-400 text-xs mt-1">Use the form to invite an associate.</p>
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
                  {associates.map(a => (
                    <tr key={a.id} className="trow">
                      <td className="tcell">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-medium text-gray-900 truncate">{a.full_name ?? "—"}</span>
                          <span className="role-associate shrink-0">associate</span>
                        </div>
                      </td>
                      <td className="tcell text-gray-600 truncate max-w-0">{a.email ?? "—"}</td>
                      <td className="tcell text-gray-500">{a.phone ?? "—"}</td>
                      <td className="tcell text-gray-400">{formatDate(a.created_at)}</td>
                      <td className="tcell text-right">
                        <DeleteMemberButton memberId={a.id} name={a.full_name ?? "associate"} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Add Associate</h2>
          <AddMemberForm role="associate" />
        </div>
      </div>
    </div>
  );
}
