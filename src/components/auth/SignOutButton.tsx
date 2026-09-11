"use client";

import { LogOut } from "lucide-react";
import { signOutAction } from "@/lib/actions/auth";
import { clearUserOfflineCache } from "@/lib/offline/db";
import { useState } from "react";

export function SignOutButton({
  variant = "button",
  className,
}: {
  variant?: "button" | "icon";
  className?: string;
}) {
  const [loading, setLoading] = useState(false);

  async function handleSignOut(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      // Clear sensitive cached records from IndexedDB to prevent data leakage between sessions
      await clearUserOfflineCache();
    } catch (err) {
      console.error("Failed clearing offline cache on sign out:", err);
    }
    await signOutAction();
  }

  if (variant === "icon") {
    return (
      <button
        onClick={handleSignOut}
        className={className || "icon-btn"}
        disabled={loading}
        aria-label="Sign out"
        type="button"
      >
        <LogOut size={16} />
      </button>
    );
  }

  return (
    <button
      onClick={handleSignOut}
      className={className}
      disabled={loading}
      type="button"
      style={{
        width: "100%",
        border: "none",
        background: "transparent",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <LogOut size={17} />
      {loading ? "Signing out…" : "Sign out"}
    </button>
  );
}
