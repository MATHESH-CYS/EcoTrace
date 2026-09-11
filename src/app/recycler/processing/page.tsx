import Link from "next/link";
import { requireProfile } from "@/lib/data/profile";

export default async function RecyclerProcessingPage() {
  const { supabase, profile } = await requireProfile();

  const { data: shipments } = await supabase
    .from("recycler_shipments")
    .select("*, receipt:recycler_receipts(received_weight_kg)")
    .eq("recycler_org_id", (profile.organization_id as string))
    .order("created_at", { ascending: false });

  const active = (shipments ?? []).filter((s) => s.receipt);

  return (
    <div>
      <h1 className="text-title1" style={{ marginBottom: 20 }}>
        Processing
      </h1>
      <div className="stack gap-3">
        {active.length === 0 && (
          <div className="card">
            <p className="text-secondary text-body">No shipments in processing.</p>
          </div>
        )}
        {active.map((s) => (
          <Link key={s.id} href={`/recycler/shipments/${s.id}`} className="card card-interactive">
            <div className="row spread">
              <span className="text-callout">{s.shipment_code}</span>
              <span className="badge badge-accent">{s.status}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
