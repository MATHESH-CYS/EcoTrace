import { requireProfile } from "@/lib/data/profile";

export default async function BrandReportsPage() {
  const { supabase } = await requireProfile();

  const { data: shipments } = await supabase
    .from("recycler_shipments")
    .select("*, aggregator:organizations!recycler_shipments_aggregator_org_id_fkey(name), recycler:organizations!recycler_shipments_recycler_org_id_fkey(name)")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div>
      <h1 className="text-title1" style={{ marginBottom: 20 }}>
        Reports
      </h1>
      <h2 className="text-title3" style={{ marginBottom: 12 }}>
        Aggregator &amp; recycler performance
      </h2>
      <div className="card stack">
        {(!shipments || shipments.length === 0) && <p className="text-secondary text-body">No shipment activity yet.</p>}
        {(shipments ?? []).map((s) => (
          <div key={s.id} className="row spread" style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
            <span className="text-callout">{s.shipment_code}</span>
            <span className="text-footnote">
              {s.aggregator?.name} → {s.recycler?.name} · {s.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
