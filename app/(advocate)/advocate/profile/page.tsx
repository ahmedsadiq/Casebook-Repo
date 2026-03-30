import { createClient } from "@/lib/supabase/server";
import ProfileEditorPanel from "@/components/ProfileEditorPanel";

export const metadata = { title: "Profile" };

export default async function AdvocateProfilePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name,email,phone,avatar_url,office_address")
    .eq("id", user!.id)
    .single();

  return (
    <div className="pg-wrap max-w-3xl">
      <div className="mb-6">
        <h1 className="pg-title">Profile</h1>
        <p className="pg-sub">Manage your account details</p>
      </div>
      <ProfileEditorPanel
        roleLabel="Advocate"
        fullName={profile?.full_name ?? ""}
        email={user!.email ?? profile?.email ?? ""}
        phone={profile?.phone ?? ""}
        avatarUrl={profile?.avatar_url ?? ""}
        officeAddress={profile?.office_address ?? ""}
      />
    </div>
  );
}
