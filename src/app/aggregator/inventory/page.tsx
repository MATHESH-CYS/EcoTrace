import { requireProfile } from "@/lib/data/profile";

export default async function AggregatorInventoryPage() {
  const { supabase, profile } = await requireProfile();

  const { data: verified } = await supabase
    .from("verification_records")
    .select("*, pickup:pickup_requests(collection_code, status)")
    .eq("aggregator_org_id", (profile.organization_id as string))
    .order("created_at", { ascending: false });

  const inTransitOrBeyond = (verified ?? []).filter((v) => v.pickup?.status !== "AGGREGATOR_VERIFIED");
  const readyToShip = (verified ?? []).filter((v) => v.pickup?.status === "AGGREGATOR_VERIFIED");
  const totalWeight = (verified ?? []).reduce((sum, v) => sum + Number(v.verified_weight_kg), 0);

  return (
    <div>
      <h1 className="text-title1" style={{ marginBottom: 20 }}>
        Inventory
      </h1>

      <div className="row gap-3 wrap" style={{ marginBottom: 24 }}>
        <div className="card" style={{ flex: "1 1 30%" }}>
          <span className="text-caption">Ready to ship</span>
          <div className="text-title1" style={{ marginTop: 6 }}>
            {readyToShip.length}
          </div>
        </div>
        <div className="card" style={{ flex: "1 1 30%" }}>
          <span className="text-caption">Dispatched</span>
          <div className="text-title1" style={{ marginTop: 6 }}>
            {inTransitOrBeyond.length}
          </div>
        </div>
        <div className="card" style={{ flex: "1 1 30%" }}>
          <span className="text-caption">Total verified weight</span>
          <div className="text-title1" style={{ marginTop: 6 }}>
            {totalWeight.toFixed(1)} kg
          </div>
        </div>
      </div>

      <div className="card stack">
        {(verified ?? []).length === 0 && <p className="text-secondary text-body">No verified collections yet.</p>}
        {(verified ?? []).map((v) => (
          <div key={v.id} className="row spread" style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
            <span className="text-callout">{v.pickup?.collection_code}</span>
            <span className="text-footnote">{v.verified_weight_kg} kg · {v.pickup?.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
