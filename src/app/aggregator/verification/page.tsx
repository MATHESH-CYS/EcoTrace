import Link from "next/link";
import { requireProfile } from "@/lib/data/profile";
import { RealtimeRefresher } from "@/components/RealtimeRefresher";

export default async function AggregatorVerificationListPage() {
  const { supabase, profile } = await requireProfile();

  const { data: pickups } = await supabase
    .from("pickup_requests")
    .select("*, address:addresses(*)")
    .eq("status", "COLLECTED")
    .eq("aggregator_org_id", (profile.organization_id as string))
    .order("updated_at", { ascending: true });

  return (
    <div>
      <RealtimeRefresher channelName={`aggregator-verification-${profile.organization_id}`} tables={["pickup_requests"]} />
      <h1 className="text-title1" style={{ marginBottom: 20 }}>
        Pending verification
      </h1>
      <div className="stack gap-3">
        {(!pickups || pickups.length === 0) && (
          <div className="card">
            <p className="text-secondary text-body">Nothing awaiting verification right now.</p>
          </div>
        )}
        {(pickups ?? []).map((p) => (
          <Link key={p.id} href={`/aggregator/verification/${p.id}`} className="card card-interactive">
            <div className="row spread">
              <span className="text-callout">{p.collection_code}</span>
              <span className="badge badge-warning">Awaiting review</span>
            </div>
            <div className="text-footnote" style={{ marginTop: 6 }}>
              {p.address?.city}, {p.address?.state} · est. {p.estimated_weight_kg}kg
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
