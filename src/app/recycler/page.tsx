import Link from "next/link";
import { requireRole } from "@/lib/data/profile";

export default async function RecyclerOverviewPage() {
  const { supabase, profile } = await requireRole("RECYCLER");
  const orgId = profile.organization_id ?? "00000000-0000-0000-0000-000000000a02";

  const [{ count: incoming }, { count: received }, { count: completed }] = await Promise.all([
    supabase.from("recycler_shipments").select("*", { count: "exact", head: true }).eq("recycler_org_id", orgId).eq("status", "CREATED"),
    supabase.from("recycler_shipments").select("*", { count: "exact", head: true }).eq("recycler_org_id", orgId).eq("status", "RECEIVED"),
    supabase.from("recycler_shipments").select("*", { count: "exact", head: true }).eq("recycler_org_id", orgId).eq("status", "COMPLETED"),
  ]);

  const stats = [
    { label: "Incoming shipments", value: incoming ?? 0, href: "/recycler/shipments" },
    { label: "Received", value: received ?? 0, href: "/recycler/processing" },
    { label: "Completed", value: completed ?? 0, href: "/recycler/history" },
  ];

  return (
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
  );
}
