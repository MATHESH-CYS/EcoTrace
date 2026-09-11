"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MapPin, Radio, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/types/database.types";

type Pickup = Tables<"pickup_requests"> & {
  address: Tables<"addresses"> | null;
  items?: (Tables<"pickup_items"> & { category: Tables<"waste_categories"> | null })[];
};

export function CommunityOrderCard({
  pickup,
  collectorId,
}: {
  pickup: Pickup;
  collectorId: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [conflictError, setConflictError] = useState<string | null>(null);

  const earning = Math.round((pickup.estimated_weight_kg ?? 0) * 15);
  const addressText = pickup.address
    ? `${pickup.address.line1 ? pickup.address.line1 + ", " : ""}${pickup.address.city}, ${pickup.address.state}`
    : "Local area";

  async function handleAccept() {
    setBusy(true);
    setConflictError(null);
    const supabase = createClient();

    try {
      // 1. Collision Check: Verify pickup is still unassigned / available in real time
      const { data: currentPickup, error: fetchErr } = await supabase
        .from("pickup_requests")
        .select("status")
        .eq("id", pickup.id)
        .single();

      if (fetchErr || !currentPickup) {
        throw new Error("Unable to verify order status.");
      }

      if (
        currentPickup.status !== "REQUESTED" &&
        currentPickup.status !== "ASSIGNED"
      ) {
        setConflictError("Collision prevented: This order was already accepted by another nearby collector.");
        setBusy(false);
        router.refresh();
        return;
      }

      // 2. Atomic status transition to lock out other collectors
      const { error: updateErr } = await supabase
        .from("pickup_requests")
        .update({ status: "COLLECTOR_ACCEPTED" })
        .eq("id", pickup.id);

      if (updateErr) {
        throw new Error(updateErr.message);
      }

      // 3. Upsert / record assignment for this collector
      const { data: existingAssignment } = await supabase
        .from("collector_assignments")
        .select("id")
        .eq("pickup_request_id", pickup.id)
        .maybeSingle();

      if (existingAssignment) {
        await supabase
          .from("collector_assignments")
          .update({
            collector_id: collectorId,
            status: "ACCEPTED",
            responded_at: new Date().toISOString(),
          })
          .eq("id", existingAssignment.id);
      } else {
        await supabase.from("collector_assignments").insert({
          pickup_request_id: pickup.id,
          collector_id: collectorId,
          status: "ACCEPTED",
          assigned_at: new Date().toISOString(),
          responded_at: new Date().toISOString(),
        });
      }

      // 4. Navigate directly to active pickup execution workflow
      router.push(`/collector/orders/${pickup.id}`);
    } catch (err: unknown) {
      setConflictError(err instanceof Error ? err.message : "Failed to accept pickup.");
      setBusy(false);
    }
  }

  return (
    <div
      className="card"
      style={{
        borderLeft: "4px solid var(--accent, #10b981)",
        marginBottom: 12,
        transition: "transform 0.15s ease",
      }}
    >
      <div className="row spread" style={{ alignItems: "center" }}>
        <div className="row gap-2" style={{ alignItems: "center" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: "0.75rem",
              fontWeight: 600,
              padding: "2px 8px",
              borderRadius: 12,
              background: "rgba(16, 185, 129, 0.15)",
              color: "var(--accent, #10b981)",
            }}
          >
            <Radio size={12} className="spin" /> Community broadcast
          </span>
          <span className="text-callout" style={{ fontWeight: 600 }}>
            {pickup.collection_code}
          </span>
        </div>
        <span className="text-callout text-accent" style={{ fontWeight: 700 }}>
          ₹{earning} est.
        </span>
      </div>

      <div className="row gap-2" style={{ marginTop: 10, alignItems: "center" }}>
        <MapPin size={15} className="text-secondary" />
        <span className="text-footnote text-secondary">{addressText}</span>
      </div>

      <div className="row spread text-footnote" style={{ marginTop: 6 }}>
        <span>Approx. {pickup.estimated_weight_kg} kg</span>
        <span className="row gap-1" style={{ alignItems: "center" }}>
          <Clock size={13} className="text-tertiary" />
          <span>{pickup.scheduled_slot}</span>
        </span>
      </div>

      {conflictError && (
        <div
          className="row gap-2"
          style={{
            marginTop: 10,
            padding: "6px 10px",
            borderRadius: 6,
            background: "rgba(239, 68, 68, 0.12)",
            color: "var(--danger, #ef4444)",
            fontSize: "0.8rem",
            alignItems: "center",
          }}
        >
          <AlertTriangle size={15} />
          <span>{conflictError}</span>
        </div>
      )}

      <div style={{ marginTop: 14 }}>
        <button
          className="btn btn-primary btn-block"
          disabled={busy}
          onClick={handleAccept}
          type="button"
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
        >
          <CheckCircle2 size={16} />
          {busy ? "Claiming order…" : "Accept & Claim Pickup"}
        </button>
      </div>
    </div>
  );
}
