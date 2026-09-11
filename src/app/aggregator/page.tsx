import Link from "next/link";
import { requireRole } from "@/lib/data/profile";

export default async function AggregatorOverviewPage() {
  const { supabase, profile } = await requireRole("AGGREGATOR");
  const orgId = profile.organization_id ?? "00000000-0000-0000-0000-000000000a01";

  const [
    { count: newRequests },
    { count: unassigned },
    { count: collectorsOnline },
    { count: pendingVerification },
    { count: readyForRecycler },
    { count: fraudAlerts },
  ] = await Promise.all([
    supabase.from("pickup_requests").select("*", { count: "exact", head: true }).eq("status", "REQUESTED"),
    supabase.from("pickup_requests").select("*", { count: "exact", head: true }).eq("status", "REQUESTED").is("aggregator_org_id", null),
    supabase.from("collector_profiles").select("*", { count: "exact", head: true }).eq("aggregator_org_id", orgId).eq("is_online", true),
    supabase.from("pickup_requests").select("*", { count: "exact", head: true }).eq("status", "COLLECTED").eq("aggregator_org_id", orgId),
    supabase.from("pickup_requests").select("*", { count: "exact", head: true }).eq("status", "AGGREGATOR_VERIFIED").eq("aggregator_org_id", orgId),
    supabase.from("verification_records").select("*", { count: "exact", head: true }).eq("aggregator_org_id", orgId).gt("fraud_score", 60),
  ]);

  const stats = [
    { label: "New requests", value: newRequests ?? 0, href: "/aggregator/requests" },
    { label: "Unassigned", value: unassigned ?? 0, href: "/aggregator/requests" },
    { label: "Collectors online", value: collectorsOnline ?? 0, href: "/aggregator/requests" },
    { label: "Pending verification", value: pendingVerification ?? 0, href: "/aggregator/verification" },
    { label: "Ready for recycler", value: readyForRecycler ?? 0, href: "/aggregator/inventory" },
    { label: "Fraud alerts", value: fraudAlerts ?? 0, href: "/aggregator/verification" },
  ];

  return (
    <div>
      <div className="row gap-3 wrap">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="card card-interactive" style={{ flex: "1 1 30%", minWidth: 180 }}>
            <span className="text-caption">{s.label}</span>
            <div className="text-title1" style={{ marginTop: 8 }}>
              {s.value}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
