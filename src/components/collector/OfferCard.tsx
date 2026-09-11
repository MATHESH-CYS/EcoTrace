"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/types/database.types";

type Assignment = Tables<"collector_assignments"> & {
  pickup: Tables<"pickup_requests"> & { address: Tables<"addresses"> | null };
};

export function OfferCard({ assignment }: { assignment: Assignment }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function respond(status: "ACCEPTED" | "REJECTED") {
    setBusy(true);
    const supabase = createClient();
    await supabase
      .from("collector_assignments")
      .update({ status, responded_at: new Date().toISOString() })
      .eq("id", assignment.id);

    if (status === "ACCEPTED") {
      await supabase
        .from("pickup_requests")
        .update({ status: "COLLECTOR_ACCEPTED" })
        .eq("id", assignment.pickup_request_id);
      router.push(`/collector/orders/${assignment.pickup_request_id}`);
    } else {
      router.refresh();
    }
  }

  const earning = Math.round((assignment.pickup?.estimated_weight_kg ?? 0) * 15);

  return (
    <div className="card">
      <div className="row spread">
        <span className="text-title3">{assignment.pickup?.collection_code}</span>
        <span className="text-callout text-accent">₹{earning} est.</span>
      </div>
      <div className="row gap-2" style={{ marginTop: 8 }}>
        <MapPin size={14} className="text-secondary" />
        <span className="text-footnote">
          {assignment.pickup?.address?.city}, {assignment.pickup?.address?.state}
        </span>
      </div>
      <div className="text-footnote" style={{ marginTop: 4 }}>
        Approx {assignment.pickup?.estimated_weight_kg} kg
      </div>
      <div className="row gap-2" style={{ marginTop: 16 }}>
        <button className="btn btn-secondary" style={{ flex: 1 }} disabled={busy} onClick={() => respond("REJECTED")}>
          Reject
        </button>
        <button className="btn btn-primary" style={{ flex: 1 }} disabled={busy} onClick={() => respond("ACCEPTED")}>
          Accept pickup
        </button>
      </div>
    </div>
  );
}
