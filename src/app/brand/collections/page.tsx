import Link from "next/link";
import { requireRole } from "@/lib/data/profile";

const VERIFIED_STATUSES = ["AGGREGATOR_VERIFIED", "IN_TRANSIT_TO_RECYCLER", "RECYCLER_RECEIVED", "PROCESSING", "COMPLETED"] as const;

export default async function BrandCollectionsPage() {
  const { supabase } = await requireRole("BRAND");

  const { data: pickups } = await supabase
    .from("pickup_requests")
    .select("id, collection_code, status, created_at, verification:verification_records(verified_weight_kg), items:pickup_items(category:waste_categories(name))")
    .in("status", VERIFIED_STATUSES)
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-title1" style={{ marginBottom: 20 }}>
        Verified collections
      </h1>
      <p className="text-secondary text-body" style={{ marginBottom: 20 }}>
        Read-only, EPR-linked traceability records. No citizen or collector personal data is shown here.
      </p>
      <div className="card stack">
        {(!pickups || pickups.length === 0) && <p className="text-secondary text-body">Nothing verified yet.</p>}
        {(pickups ?? []).map((p) => {
          const v = Array.isArray(p.verification) ? p.verification[0] : p.verification;
          const categories = (p.items ?? [])
            .map((it) => (Array.isArray(it.category) ? it.category[0]?.name : it.category?.name))
            .filter(Boolean)
            .join(", ");
          return (
            <Link
              key={p.id}
              href={`/journey/${p.collection_code}`}
              className="row spread"
              style={{ padding: "12px 0", borderBottom: "1px solid var(--border)" }}
            >
              <span className="stack gap-1">
                <span className="text-callout">{p.collection_code}</span>
                <span className="text-footnote">{categories || "—"}</span>
              </span>
              <span className="text-footnote">{v?.verified_weight_kg ?? "—"} kg · {p.status}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
