"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";

export function OnlineToggle({ collectorId, initialOnline }: { collectorId: string; initialOnline: boolean }) {
  const [online, setOnline] = useState(initialOnline);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !online;
    setOnline(next);
    startTransition(async () => {
      const supabase = createClient();
      await supabase.from("collector_profiles").update({ is_online: next }).eq("id", collectorId);
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      className={online ? "badge badge-success" : "badge"}
      style={{ cursor: "pointer", padding: "8px 16px" }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: online ? "var(--success)" : "var(--text-tertiary)",
          display: "inline-block",
        }}
      />
      {online ? "Online" : "Offline"}
    </button>
  );
}
