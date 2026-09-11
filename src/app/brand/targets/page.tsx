import { requireProfile } from "@/lib/data/profile";

const VERIFIED_STATUSES = ["AGGREGATOR_VERIFIED", "IN_TRANSIT_TO_RECYCLER", "RECYCLER_RECEIVED", "PROCESSING", "COMPLETED"] as const;

export default async function BrandTargetsPage() {
  const { supabase } = await requireProfile();

  const { data: receipts } = await supabase.from("recycler_receipts").select("received_weight_kg");
  const { data: pickups } = await supabase.from("pickup_requests").select("id").in("status", VERIFIED_STATUSES);

  const achieved = (receipts ?? []).reduce((sum, r) => sum + Number(r.received_weight_kg), 0);
  const target = 500;
  const pct = Math.min(100, Math.round((achieved / target) * 100));

  return (
    <div>
      <h1 className="text-title1" style={{ marginBottom: 20 }}>
        Collection target
      </h1>
      <div className="card">
        <div className="row spread">
          <span className="text-title3">FY2026 e-waste collection target</span>
          <span className="text-title2">{pct}%</span>
        </div>
        <div style={{ height: 10, background: "var(--bg-sunken)", borderRadius: 999, marginTop: 16, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: "var(--accent)" }} />
        </div>
        <div className="row spread" style={{ marginTop: 12 }}>
          <span className="text-footnote">{achieved.toFixed(1)} kg recycler-confirmed</span>
          <span className="text-footnote">Target {target} kg</span>
        </div>
      </div>
      <p className="text-secondary text-footnote" style={{ marginTop: 16 }}>
        {pickups?.length ?? 0} collections verified toward this target so far.
      </p>
    </div>
  );
}
