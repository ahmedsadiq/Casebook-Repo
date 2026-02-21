import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/supabase/types";

export async function updateSession(request: NextRequest) {
  let res = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          res = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  const isProtected =
    pathname.startsWith("/advocate") ||
    pathname.startsWith("/associate") ||
    pathname.startsWith("/client");

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    return NextResponse.redirect(url);
  }

  if (user && pathname === "/auth") {
    const { data: profile } = await supabase
      .from("profiles").select("role").eq("id", user.id).single();
    const url = request.nextUrl.clone();
    url.pathname =
      profile?.role === "associate" ? "/associate/dashboard" :
      profile?.role === "client"    ? "/client/dashboard"    :
      "/advocate/dashboard";
    return NextResponse.redirect(url);
  }

  return res;
}
