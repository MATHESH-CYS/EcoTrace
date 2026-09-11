import { requireRole } from "@/lib/data/profile";
import { OnlineToggle } from "@/components/collector/OnlineToggle";
import { OfferCard } from "@/components/collector/OfferCard";
import { CommunityOrderCard } from "@/components/collector/CommunityOrderCard";
import { RealtimeRefresher } from "@/components/RealtimeRefresher";
import { CommunityRadar } from "@/components/collector/CommunityRadar";

export default async function CollectorHomePage() {
  const { supabase, user, profile } = await requireRole("COLLECTOR");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    { data: collectorProfile },
    { data: todaysCollections },
    { data: directOffers },
    { data: communityPickups },
  ] = await Promise.all([
    supabase.from("collector_profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("collection_records")
      .select("actual_weight_kg, completed_at")
      .eq("collector_id", user.id)
      .gte("completed_at", today.toISOString()),
    supabase
      .from("collector_assignments")
      .select("*, pickup:pickup_requests(*, address:addresses(*))")
      .eq("collector_id", user.id)
      .eq("status", "OFFERED")
      .order("assigned_at", { ascending: false }),
    supabase
      .from("pickup_requests")
      .select("*, address:addresses(*)")
      .in("status", ["REQUESTED", "ASSIGNED"])
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const isOnline = collectorProfile?.is_online ?? false;
  const completedToday = (todaysCollections ?? []).filter((c) => c.completed_at);
  const weightToday = completedToday.reduce((sum, c) => sum + (c.actual_weight_kg ?? 0), 0);
  const earningsToday = Math.round(weightToday * 15);

  // Filter out any community pickups that are already in directOffers
  const directPickupIds = new Set((directOffers ?? []).map((o) => o.pickup_request_id));
  const availableBroadcasts = (communityPickups ?? []).filter((p) => !directPickupIds.has(p.id));

  return (
    <div>
      <RealtimeRefresher
        channelName={`collector-home-${user.id}`}
        tables={["collector_assignments", "pickup_requests"]}
      />

      <div className="row spread" style={{ marginBottom: 20 }}>
        <div>
          <p className="text-secondary text-body">Welcome back,</p>
          <h1 className="text-title1">{profile.full_name.split(" ")[0]}</h1>
        </div>
        <OnlineToggle collectorId={user.id} initialOnline={isOnline} />
      </div>

      <div className="row gap-3 wrap" style={{ marginBottom: 24 }}>
        <div className="card" style={{ flex: "1 1 45%" }}>
          <span className="text-caption">Today&apos;s earnings</span>
          <div className="text-title1" style={{ marginTop: 6 }}>
            ₹{earningsToday}
          </div>
        </div>
        <div className="card" style={{ flex: "1 1 45%" }}>
          <span className="text-caption">Collected today</span>
          <div className="text-title1" style={{ marginTop: 6 }}>
            {weightToday.toFixed(1)} kg
          </div>
        </div>
        <div className="card" style={{ flex: "1 1 45%" }}>
          <span className="text-caption">Completed</span>
          <div className="text-title1" style={{ marginTop: 6 }}>
            {completedToday.length}
          </div>
        </div>
        <div className="card" style={{ flex: "1 1 45%" }}>
          <span className="text-caption">Rating</span>
          <div className="text-title1" style={{ marginTop: 6 }}>
            {collectorProfile?.rating ?? "5.0"} ★
          </div>
        </div>
      </div>

      {/* Community Radar: live incoming pickup alerts with audio/modal */}
      <CommunityRadar collectorId={user.id} isOnline={isOnline} />


      {/* Direct Assignment Offers */}
      {(directOffers ?? []).length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h2 className="text-title3" style={{ marginBottom: 12 }}>
            Direct assignments ({directOffers!.length})
          </h2>
          <div className="stack gap-3">
            {directOffers!.map((o) => (
              <OfferCard key={o.id} assignment={o} />
            ))}
          </div>
        </div>
      )}

      {/* Community Order Broadcast Pool */}
      <div>
        <div className="row spread" style={{ marginBottom: 12, alignItems: "center" }}>
          <h2 className="text-title3" style={{ margin: 0 }}>
            Nearby available pickups
          </h2>
          <span className="text-footnote text-secondary">Collision-protected pool</span>
        </div>

        {!isOnline ? (
          <div className="card" style={{ textAlign: "center", padding: "24px 16px" }}>
            <p className="text-secondary text-body">
              You are currently offline. Turn on your status above to accept orders.
            </p>
          </div>
        ) : availableBroadcasts.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "24px 16px" }}>
            <p className="text-secondary text-body">
              No new unassigned pickups in your area right now. When citizens schedule a pickup, it will appear here instantly.
            </p>
          </div>
        ) : (
          <div className="stack gap-2">
            {availableBroadcasts.map((p) => (
              <CommunityOrderCard key={p.id} pickup={p} collectorId={user.id} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

