import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    // Verify the caller is an authenticated advocate
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: caller } = await supabase
      .from("profiles").select("role").eq("id", user.id).single();
    if (caller?.role !== "advocate")
      return NextResponse.json({ error: "Only advocates can create accounts" }, { status: 403 });

    const { fullName, email, phone, password, role } = await req.json();

    if (!fullName || !email || !password || !role)
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    if (!["associate", "client"].includes(role))
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });

    const admin = createAdminClient();

    // Create auth user
    const { data: newUser, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (authError) return NextResponse.json({ error: authError.message }, { status: 400 });

    // Upsert profile with advocate_id linkage
    const { error: profileError } = await admin.from("profiles").upsert({
      id:          newUser.user.id,
      full_name:   fullName,
      email,
      phone:       phone || null,
      role,
      advocate_id: user.id,
    });

    if (profileError) {
      // Rollback: delete the auth user
      await admin.auth.admin.deleteUser(newUser.user.id);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}
