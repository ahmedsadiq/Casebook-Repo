import { createClient } from "@/lib/supabase/server";
import ProfileForm from "./ProfileForm";

export default async function ProfilePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  return (
    <div className="p-8 max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your account details</p>
      </div>
      <div className="card p-6">
        <div className="mb-5 pb-5 border-b border-gray-100">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Email</p>
          <p className="text-sm text-gray-900">{user!.email}</p>
        </div>
        <ProfileForm fullName={profile?.full_name ?? ""} />
      </div>
    </div>
  );
}
