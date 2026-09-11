import { requireRole } from "@/lib/data/profile";
import { MaterialMixChart } from "@/components/brand/MaterialMixChart";

const VERIFIED_STATUSES = ["AGGREGATOR_VERIFIED", "IN_TRANSIT_TO_RECYCLER", "RECYCLER_RECEIVED", "PROCESSING", "COMPLETED"] as const;

export default async function BrandOverviewPage() {
  const { supabase } = await requireRole("BRAND");

  const [{ data: pickups }, { data: receipts }, { data: materials }] = await Promise.all([
    supabase.from("pickup_requests").select("status, estimated_weight_kg").in("status", VERIFIED_STATUSES),
    supabase.from("recycler_receipts").select("received_weight_kg"),
    supabase.from("material_recovery").select("material_type, recovered_weight_kg"),
  ]);

  const verifiedCount = pickups?.length ?? 0;
  const recyclerWeight = (receipts ?? []).reduce((sum, r) => sum + Number(r.received_weight_kg), 0);
  const target = 500;
  const fulfillmentPct = Math.min(100, Math.round((recyclerWeight / target) * 100));

  const materialTotals = new Map<string, number>();
  for (const m of materials ?? []) {
    materialTotals.set(m.material_type, (materialTotals.get(m.material_type) ?? 0) + Number(m.recovered_weight_kg));
  }
  const chartData = Array.from(materialTotals.entries()).map(([name, value]) => ({ name, value }));

  return (
    <div>
      <div className="row gap-3 wrap" style={{ marginBottom: 24 }}>
        <div className="card" style={{ flex: "1 1 22%" }}>
          <span className="text-caption">Verified collections</span>
          <div className="text-title1" style={{ marginTop: 6 }}>
            {verifiedCount}
          </div>
        </div>
        <div className="card" style={{ flex: "1 1 22%" }}>
          <span className="text-caption">Recycler confirmed weight</span>
          <div className="text-title1" style={{ marginTop: 6 }}>
            {recyclerWeight.toFixed(1)} kg
          </div>
        </div>
        <div className="card" style={{ flex: "1 1 22%" }}>
          <span className="text-caption">Collection target</span>
          <div className="text-title1" style={{ marginTop: 6 }}>
            {target} kg
          </div>
        </div>
        <div className="card" style={{ flex: "1 1 22%" }}>
          <span className="text-caption">Fulfillment</span>
          <div className="text-title1" style={{ marginTop: 6 }}>
            {fulfillmentPct}%
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-title3" style={{ marginBottom: 16 }}>
          Material mix
        </h2>
        {chartData.length === 0 ? (
          <p className="text-secondary text-body">No recovered material yet.</p>
        ) : (
          <MaterialMixChart data={chartData} />
        )}
      </div>
    </div>
  );
}
