import Link from "next/link";
import { requireProfile } from "@/lib/data/profile";

export default async function RecyclerHistoryPage() {
  const { supabase, profile } = await requireProfile();

  const { data: shipments } = await supabase
    .from("recycler_shipments")
    .select("*")
    .eq("recycler_org_id", (profile.organization_id as string))
    .eq("status", "COMPLETED")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-title1" style={{ marginBottom: 20 }}>
        History
      </h1>
      <div className="stack gap-3">
        {(!shipments || shipments.length === 0) && (
          <div className="card">
            <p className="text-secondary text-body">No completed shipments yet.</p>
          </div>
        )}
        {(shipments ?? []).map((s) => (
          <Link key={s.id} href={`/recycler/shipments/${s.id}`} className="card card-interactive">
            <span className="text-callout">{s.shipment_code}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
