import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Tables, Enums } from "@/types/database.types";

export type AppRole = Enums<"app_role">;

const ROLE_HOME: Record<string, string> = {
  CITIZEN: "/citizen",
  COLLECTOR: "/collector",
  AGGREGATOR: "/aggregator",
  RECYCLER: "/recycler",
  BRAND: "/brand",
  ADMIN: "/admin",
};

export async function requireProfile(): Promise<{
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: { id: string; email: string };
  profile: Tables<"profiles">;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    await supabase.auth.signOut();
    redirect("/sign-in");
  }

  if (profile.is_active === false) {
    await supabase.auth.signOut();
    redirect("/sign-in?error=Account+suspended");
  }

  return { supabase, user: { id: user.id, email: user.email ?? "" }, profile };
}

export async function requireRole(
  allowedRoles: AppRole | AppRole[]
): Promise<{
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: { id: string; email: string };
  profile: Tables<"profiles">;
}> {
  const context = await requireProfile();
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (!roles.includes(context.profile.role)) {
    // User is logged in but attempting to load an unauthorized role page
    const home = ROLE_HOME[context.profile.role] ?? "/citizen";
    redirect(home);
  }

  return context;
}

