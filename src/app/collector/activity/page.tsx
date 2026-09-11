import Link from "next/link";
import { requireProfile } from "@/lib/data/profile";

export default async function CollectorActivityPage() {
  const { supabase, user } = await requireProfile();

  const { data: records } = await supabase
    .from("collection_records")
    .select("*, pickup:pickup_requests(collection_code, status)")
    .eq("collector_id", user.id)
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false });

  return (
    <div>
      <h1 className="text-title1" style={{ marginBottom: 20 }}>
        Activity
      </h1>
      <div className="card stack">
        {(!records || records.length === 0) && <p className="text-secondary text-body">No completed pickups yet.</p>}
        {(records ?? []).map((r) => (
          <Link
            key={r.id}
            href={`/journey/${r.pickup?.collection_code}`}
            className="row spread"
            style={{ padding: "12px 0", borderBottom: "1px solid var(--border)" }}
          >
            <span className="stack gap-1">
              <span className="text-callout">{r.pickup?.collection_code}</span>
              <span className="text-footnote">{r.completed_at ? new Date(r.completed_at).toLocaleDateString() : ""}</span>
            </span>
            <span className="text-callout">{r.actual_weight_kg} kg</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
