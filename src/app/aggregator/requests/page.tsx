import { requireProfile } from "@/lib/data/profile";
import { AssignPanel } from "@/components/aggregator/AssignPanel";
import { RealtimeRefresher } from "@/components/RealtimeRefresher";

export default async function AggregatorRequestsPage() {
  const { supabase, profile } = await requireProfile();
  const orgId = profile.organization_id as string;

  const [{ data: requests }, { data: collectors }] = await Promise.all([
    supabase
      .from("pickup_requests")
      .select("*, address:addresses(*), items:pickup_items(*, category:waste_categories(*))")
      .in("status", ["REQUESTED", "ASSIGNED"])
      .order("created_at", { ascending: true }),
    supabase
      .from("collector_profiles")
      .select("*, profile:profiles(*)")
      .eq("aggregator_org_id", orgId)
      .eq("is_online", true)
      .order("rating", { ascending: false }),
  ]);

  return (
    <div>
      <RealtimeRefresher
        channelName={`aggregator-requests-${orgId}`}
        tables={["pickup_requests", "collector_assignments"]}
      />
      <h1 className="text-title1" style={{ marginBottom: 20 }}>
        Pickup requests
      </h1>
      <div className="stack gap-3">
        {(!requests || requests.length === 0) && (
          <div className="card">
            <p className="text-secondary text-body">No pending requests.</p>
          </div>
        )}
        {(requests ?? []).map((r) => (
          <AssignPanel key={r.id} pickup={r} collectors={collectors ?? []} />
        ))}
      </div>
    </div>
  );
}
