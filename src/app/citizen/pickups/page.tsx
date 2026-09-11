import Link from "next/link";
import { Plus } from "lucide-react";
import { requireProfile } from "@/lib/data/profile";
import { StatusBadge } from "@/components/StatusBadge";

export default async function CitizenPickupsPage() {
  const { supabase, user } = await requireProfile();

  const { data: pickups } = await supabase
    .from("pickup_requests")
    .select("*")
    .eq("citizen_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="row spread" style={{ marginBottom: 20 }}>
        <h1 className="text-title1">Pickups</h1>
        <Link href="/citizen/pickups/new" className="btn btn-primary btn-sm">
          <Plus size={15} /> New
        </Link>
      </div>

      <div className="card stack">
        {(pickups ?? []).length === 0 && (
          <p className="text-secondary text-body">No pickups yet.</p>
        )}
        {(pickups ?? []).map((p) => (
          <Link
            key={p.id}
            href={`/citizen/pickups/${p.id}`}
            className="row spread"
            style={{ padding: "14px 0", borderBottom: "1px solid var(--border)" }}
          >
            <span className="stack gap-1">
              <span className="text-callout">{p.collection_code}</span>
              <span className="text-footnote">
                {new Date(p.created_at).toLocaleDateString()} · ₹{p.estimated_value_min}–{p.estimated_value_max}
              </span>
            </span>
            <StatusBadge status={p.status} />
          </Link>
        ))}
      </div>
    </div>
  );
}
