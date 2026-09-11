import { requireProfile } from "@/lib/data/profile";
import { StatusBadge } from "@/components/StatusBadge";

export default async function AdminOperationsPage() {
  const { supabase } = await requireProfile();
  const { data: pickups } = await supabase
    .from("pickup_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div>
      <h1 className="text-title1" style={{ marginBottom: 20 }}>
        Operations
      </h1>
      <div className="card stack">
        {(pickups ?? []).map((p) => (
          <div key={p.id} className="row spread" style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
            <span className="text-callout">{p.collection_code}</span>
            <StatusBadge status={p.status} />
          </div>
        ))}
      </div>
    </div>
  );
}
