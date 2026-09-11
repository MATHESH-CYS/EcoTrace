import Link from "next/link";
import { requireProfile } from "@/lib/data/profile";
import { StatusBadge } from "@/components/StatusBadge";

export default async function CollectorOrdersPage() {
  const { supabase, user } = await requireProfile();

  const { data: assignments } = await supabase
    .from("collector_assignments")
    .select("*, pickup:pickup_requests(*, address:addresses(*))")
    .eq("collector_id", user.id)
    .eq("status", "ACCEPTED")
    .order("assigned_at", { ascending: false });

  const active = (assignments ?? []).filter((a) => a.pickup && a.pickup.status !== "COMPLETED" && a.pickup.status !== "CANCELLED" && a.pickup.status !== "REJECTED");

  return (
    <div>
      <h1 className="text-title1" style={{ marginBottom: 20 }}>
        Orders
      </h1>
      <div className="stack gap-3">
        {active.length === 0 && (
          <div className="card">
            <p className="text-secondary text-body">No active orders. Accept an offer from Home to get started.</p>
          </div>
        )}
        {active.map((a) => (
          <Link key={a.id} href={`/collector/orders/${a.pickup_request_id}`} className="card card-interactive">
            <div className="row spread">
              <span className="text-callout">{a.pickup?.collection_code}</span>
              <StatusBadge status={a.pickup!.status} />
            </div>
            <div className="text-footnote" style={{ marginTop: 6 }}>
              {a.pickup?.address?.city}, {a.pickup?.address?.state}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
