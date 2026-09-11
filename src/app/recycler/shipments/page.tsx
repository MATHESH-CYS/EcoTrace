import Link from "next/link";
import { requireProfile } from "@/lib/data/profile";
import { RealtimeRefresher } from "@/components/RealtimeRefresher";

export default async function RecyclerShipmentsPage() {
  const { supabase, profile } = await requireProfile();

  const { data: shipments } = await supabase
    .from("recycler_shipments")
    .select("*, aggregator:organizations!recycler_shipments_aggregator_org_id_fkey(name)")
    .eq("recycler_org_id", (profile.organization_id as string))
    .order("created_at", { ascending: false });

  return (
    <div>
      <RealtimeRefresher channelName={`recycler-shipments-${profile.organization_id}`} tables={["recycler_shipments"]} />
      <h1 className="text-title1" style={{ marginBottom: 20 }}>
        Shipments
      </h1>
      <div className="stack gap-3">
        {(!shipments || shipments.length === 0) && (
          <div className="card">
            <p className="text-secondary text-body">No shipments yet.</p>
          </div>
        )}
        {(shipments ?? []).map((s) => (
          <Link key={s.id} href={`/recycler/shipments/${s.id}`} className="card card-interactive">
            <div className="row spread">
              <span className="text-callout">{s.shipment_code}</span>
              <span className="badge badge-accent">{s.status}</span>
            </div>
            <div className="text-footnote" style={{ marginTop: 6 }}>
              From {s.aggregator?.name} · expected {s.expected_weight_kg} kg
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
