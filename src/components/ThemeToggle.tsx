"use client";

import { useSyncExternalStore } from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/theme";

const emptySubscribe = () => () => {};

export function ThemeToggle({ className }: { className?: string }) {
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const { resolvedTheme, toggleTheme } = useTheme();

  if (!mounted) {
    return (
      <button
        type="button"
        className={className ?? "icon-btn"}
        aria-label="Toggle theme"
        title="Toggle theme"
      >
        <Moon size={16} />
      </button>
    );
  }


  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={className ?? "icon-btn"}
      aria-label={resolvedTheme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      title={resolvedTheme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
    >
      {resolvedTheme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}

