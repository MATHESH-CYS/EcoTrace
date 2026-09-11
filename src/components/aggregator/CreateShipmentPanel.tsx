"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/types/database.types";

type Pickup = Tables<"pickup_requests"> & {
  verification: { verified_weight_kg: number } | { verified_weight_kg: number }[] | null;
};

function verifiedWeight(p: Pickup): number | undefined {
  const v = p.verification;
  if (!v) return undefined;
  return Array.isArray(v) ? v[0]?.verified_weight_kg : v.verified_weight_kg;
}

function generateShipmentCode(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `SHIP-${year}-${rand}`;
}

export function CreateShipmentPanel({
  pickups,
  recyclers,
  orgId,
}: {
  pickups: Pickup[];
  recyclers: Tables<"organizations">[];
  orgId: string;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [recyclerId, setRecyclerId] = useState(recyclers[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const expectedWeight = pickups
    .filter((p) => selected.has(p.id))
    .reduce((sum, p) => sum + (verifiedWeight(p) ?? 0), 0);

  async function createShipment() {
    if (selected.size === 0 || !recyclerId) return;
    setBusy(true);
    setError(null);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const shipmentCode = generateShipmentCode();

    const { data: shipment, error: shErr } = await supabase
      .from("recycler_shipments")
      .insert({
        shipment_code: shipmentCode,
        aggregator_org_id: orgId,
        recycler_org_id: recyclerId,
        expected_weight_kg: expectedWeight,
        created_by: user!.id,
      })
      .select()
      .single();

    if (shErr || !shipment) {
      setError(shErr?.message ?? "Could not create shipment");
      setBusy(false);
      return;
    }

    const { error: itemsErr } = await supabase.from("shipment_items").insert(
      Array.from(selected).map((pickupId) => ({ shipment_id: shipment.id, pickup_request_id: pickupId }))
    );

    if (itemsErr) {
      setError(itemsErr.message);
      setBusy(false);
      return;
    }

    // Update status of all included pickups to IN_TRANSIT_TO_RECYCLER
    for (const pickupId of selected) {
      await supabase
        .from("pickup_requests")
        .update({ status: "IN_TRANSIT_TO_RECYCLER" })
        .eq("id", pickupId);
    }

    setBusy(false);
    setSelected(new Set());
    router.refresh();
  }

  return (
    <div className="card">
      <h2 className="text-title3" style={{ marginBottom: 12 }}>
        Create shipment
      </h2>

      {error && <p className="text-danger text-footnote" style={{ marginBottom: 10 }}>{error}</p>}

      {pickups.length === 0 ? (
        <p className="text-secondary text-body">No verified collections ready to ship.</p>
      ) : (
        <>
          <div className="stack gap-2">
            {pickups.map((p) => (
              <label key={p.id} className="row gap-3" style={{ padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} />
                <span className="text-callout">{p.collection_code}</span>
                <span className="text-footnote" style={{ marginLeft: "auto" }}>
                  {verifiedWeight(p) ?? p.estimated_weight_kg} kg
                </span>
              </label>
            ))}
          </div>

          <div className="row gap-3" style={{ marginTop: 16 }}>
            <select className="select" value={recyclerId} onChange={(e) => setRecyclerId(e.target.value)}>
              {recyclers.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            <button className="btn btn-primary" disabled={busy || selected.size === 0} onClick={createShipment}>
              Ship {selected.size > 0 ? `${expectedWeight.toFixed(1)}kg` : ""}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
