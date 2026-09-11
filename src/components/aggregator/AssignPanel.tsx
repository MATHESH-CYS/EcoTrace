"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { StatusBadge } from "@/components/StatusBadge";
import type { Tables } from "@/types/database.types";

type Pickup = Tables<"pickup_requests"> & {
  address: Tables<"addresses"> | null;
  items: (Tables<"pickup_items"> & { category: Tables<"waste_categories"> | null })[];
};
type Collector = Tables<"collector_profiles"> & { profile: Tables<"profiles"> | null };

export function AssignPanel({ pickup, collectors }: { pickup: Pickup; collectors: Collector[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState(collectors[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function assign(collectorId: string) {
    if (!collectorId) {
      setError("No online collectors available to assign.");
      return;
    }
    setBusy(true);
    setError(null);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (pickup.status === "REQUESTED") {
      const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user!.id).single();
      await supabase
        .from("pickup_requests")
        .update({ aggregator_org_id: profile?.organization_id })
        .eq("id", pickup.id)
        .is("aggregator_org_id", null);
    }

    const { error: err } = await supabase.from("collector_assignments").insert({
      pickup_request_id: pickup.id,
      collector_id: collectorId,
      assigned_by: user!.id,
    });

    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.refresh();
  }

  function autoAssign() {
    if (collectors[0]) assign(collectors[0].id);
  }

  return (
    <div className="card">
      <div className="row spread">
        <span className="text-callout">{pickup.collection_code}</span>
        <StatusBadge status={pickup.status} />
      </div>
      <div className="row gap-2" style={{ marginTop: 8 }}>
        <MapPin size={14} className="text-secondary" />
        <span className="text-footnote">
          {pickup.address?.city}, {pickup.address?.state} · {pickup.scheduled_date} · {pickup.scheduled_slot}
        </span>
      </div>
      <div className="text-footnote" style={{ marginTop: 4 }}>
        {pickup.items.map((it) => it.category?.name).join(", ")} · est. {pickup.estimated_weight_kg}kg
      </div>

      {error && (
        <p className="text-danger text-footnote" style={{ marginTop: 8 }}>
          {error}
        </p>
      )}

      {pickup.status === "REQUESTED" && (
        <div className="row gap-2" style={{ marginTop: 14 }}>
          <select className="select" value={selected} onChange={(e) => setSelected(e.target.value)} disabled={busy}>
            {collectors.length === 0 && <option value="">No collectors online</option>}
            {collectors.map((c) => (
              <option key={c.id} value={c.id}>
                {c.profile?.full_name} · ★{c.rating}
              </option>
            ))}
          </select>
          <button className="btn btn-secondary btn-sm" disabled={busy || !selected} onClick={() => assign(selected)}>
            Assign
          </button>
          <button className="btn btn-primary btn-sm" disabled={busy || collectors.length === 0} onClick={autoAssign}>
            <Zap size={14} /> Auto
          </button>
        </div>
      )}
      {pickup.status === "ASSIGNED" && <p className="text-footnote" style={{ marginTop: 10 }}>Waiting for collector to accept…</p>}
    </div>
  );
}
