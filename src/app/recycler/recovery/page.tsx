import { requireProfile } from "@/lib/data/profile";

export default async function RecyclerRecoveryPage() {
  const { supabase, profile } = await requireProfile();

  const { data: shipments } = await supabase
    .from("recycler_shipments")
    .select("id")
    .eq("recycler_org_id", (profile.organization_id as string));

  const shipmentIds = (shipments ?? []).map((s) => s.id);

  const { data: processing } = shipmentIds.length
    ? await supabase.from("processing_records").select("id").in("shipment_id", shipmentIds)
    : { data: [] };

  const processingIds = (processing ?? []).map((p) => p.id);

  const { data: materials } = processingIds.length
    ? await supabase.from("material_recovery").select("*").in("processing_record_id", processingIds)
    : { data: [] };

  const totals = new Map<string, number>();
  for (const m of materials ?? []) {
    totals.set(m.material_type, (totals.get(m.material_type) ?? 0) + Number(m.recovered_weight_kg));
  }

  return (
    <div>
      <h1 className="text-title1" style={{ marginBottom: 20 }}>
        Material recovery
      </h1>
      <div className="card stack">
        {totals.size === 0 && <p className="text-secondary text-body">No material recovered yet.</p>}
        {Array.from(totals.entries()).map(([material, weight]) => (
          <div key={material} className="row spread" style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
            <span className="text-callout">{material}</span>
            <span className="text-footnote">{weight.toFixed(2)} kg</span>
          </div>
        ))}
      </div>
    </div>
  );
}
