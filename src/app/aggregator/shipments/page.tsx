import { requireProfile } from "@/lib/data/profile";
import { CreateShipmentPanel } from "@/components/aggregator/CreateShipmentPanel";

export default async function AggregatorShipmentsPage() {
  const { supabase, profile } = await requireProfile();
  const orgId = profile.organization_id!;

  const [{ data: shipments }, { data: readyPickups }, { data: recyclers }] = await Promise.all([
    supabase
      .from("recycler_shipments")
      .select("*, recycler:organizations!recycler_shipments_recycler_org_id_fkey(name)")
      .eq("aggregator_org_id", orgId)
      .order("created_at", { ascending: false }),
    supabase
      .from("pickup_requests")
      .select("*, verification:verification_records(verified_weight_kg)")
      .eq("aggregator_org_id", orgId)
      .eq("status", "AGGREGATOR_VERIFIED")
      .order("updated_at"),
    supabase.from("organizations").select("*").eq("type", "RECYCLER"),
  ]);

  return (
    <div>
      <h1 className="text-title1" style={{ marginBottom: 20 }}>
        Shipments
      </h1>

      <CreateShipmentPanel pickups={readyPickups ?? []} recyclers={recyclers ?? []} orgId={orgId} />

      <h2 className="text-title3" style={{ margin: "28px 0 12px" }}>
        Shipment history
      </h2>
      <div className="card stack">
        {(!shipments || shipments.length === 0) && <p className="text-secondary text-body">No shipments yet.</p>}
        {(shipments ?? []).map((s) => (
          <div key={s.id} className="row spread" style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
            <span className="stack gap-1">
              <span className="text-callout">{s.shipment_code}</span>
              <span className="text-footnote">To {s.recycler?.name}</span>
            </span>
            <span className="badge badge-accent">{s.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
