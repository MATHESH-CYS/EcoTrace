import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database.types";

const ROLE_HOME: Record<string, string> = {
  CITIZEN: "/citizen",
  COLLECTOR: "/collector",
  AGGREGATOR: "/aggregator",
  RECYCLER: "/recycler",
  BRAND: "/brand",
  ADMIN: "/admin",
};

const PUBLIC_PATHS = [
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
];

function isPublicPath(pathname: string) {
  if (pathname === "/") return true;
  if (pathname.startsWith("/verify/")) return true;
  if (pathname.startsWith("/journey/")) return true;
  if (pathname.startsWith("/api/")) return true;
  if (
    pathname.startsWith("/manifest") ||
    pathname.startsWith("/sw.js") ||
    pathname.startsWith("/icons")
  )
    return true;
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Unauthenticated user flow
  if (!user) {
    if (!isPublicPath(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = "/sign-in";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // Authenticated: Authoritative database role and account status lookup
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .single();

  // Suspended or deactivated account gating
  if (profile && profile.is_active === false) {
    await supabase.auth.signOut();
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("error", "Your account is suspended or disabled. Contact support.");
    return NextResponse.redirect(url);
  }

  const role = profile?.role ?? "CITIZEN";
  const home = ROLE_HOME[role] ?? "/citizen";

  // Redirect signed-in users away from auth pages to their authoritative dashboard
  if (pathname === "/sign-in" || pathname === "/sign-up" || pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = home;
    return NextResponse.redirect(url);
  }

  // Enforce strict role boundary routing (Direct URL Attack mitigation)
  const pathSegment = "/" + pathname.split("/")[1];
  const knownRoleSections = Object.values(ROLE_HOME);

  if (knownRoleSections.includes(pathSegment) && pathSegment !== home) {
    // Attempted unauthorized access to another role's dashboard area
    const url = request.nextUrl.clone();
    url.pathname = home;
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

