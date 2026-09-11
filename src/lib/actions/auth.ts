"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const ROLE_HOME: Record<string, string> = {
  CITIZEN: "/citizen",
  COLLECTOR: "/collector",
  AGGREGATOR: "/aggregator",
  RECYCLER: "/recycler",
  BRAND: "/brand",
  ADMIN: "/admin",
};

export type SignInState = { error: string | null };

export async function signInAction(
  _prev: SignInState,
  formData: FormData
): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return { error: "Invalid email or password." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", data.user.id)
    .single();

  if (profile && profile.is_active === false) {
    await supabase.auth.signOut();
    return { error: "Your account is suspended or disabled. Contact support." };
  }

  const role = profile?.role ?? "CITIZEN";
  redirect(ROLE_HOME[role] ?? "/citizen");
}

export type SignUpState = { error: string | null };

export async function signUpAction(
  _prev: SignUpState,
  formData: FormData
): Promise<SignUpState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!fullName || !email || !password) {
    return { error: "Fill in your name, email and password." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords don't match." };
  }

  const supabase = await createClient();

  // Strictly register as CITIZEN via the confirmed database function
  const { error: rpcError } = await supabase.rpc("register_citizen", {
    p_email: email,
    p_password: password,
    p_full_name: fullName,
    p_phone: phone || null,
  });

  if (rpcError) {
    return { error: rpcError.message };
  }

  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError || !signInData.user) {
    return { error: "Account created — please sign in to continue." };
  }

  // Ensure citizen wallet exists
  const userId = signInData.user.id;
  const { data: existingWallet } = await supabase
    .from("wallets")
    .select("id")
    .eq("owner_id", userId)
    .maybeSingle();

  if (!existingWallet) {
    await supabase.from("wallets").insert({
      owner_id: userId,
      balance: 0,
      eco_points: 0,
    });
  }

  redirect("/citizen");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/sign-in");
}

