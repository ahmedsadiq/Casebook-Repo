import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: caller } = await supabase
      .from("profiles").select("role").eq("id", user.id).single();
    if (caller?.role !== "advocate")
      return NextResponse.json({ error: "Only advocates can remove members" }, { status: 403 });

    const { memberId } = await req.json();
    if (!memberId) return NextResponse.json({ error: "Missing memberId" }, { status: 400 });

    const admin = createAdminClient();

    // Verify this member belongs to the calling advocate
    const { data: member } = await admin
      .from("profiles").select("advocate_id, role").eq("id", memberId).single();

    if (!member || member.advocate_id !== user.id)
      return NextResponse.json({ error: "Not authorized to remove this member" }, { status: 403 });

    if (member.role === "advocate")
      return NextResponse.json({ error: "Cannot delete an advocate account" }, { status: 403 });

    const { error } = await admin.auth.admin.deleteUser(memberId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}
