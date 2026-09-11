import { requireProfile } from "@/lib/data/profile";

export default async function AdminOrganizationsPage() {
  const { supabase } = await requireProfile();
  const { data: orgs } = await supabase.from("organizations").select("*").order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-title1" style={{ marginBottom: 20 }}>
        Organizations
      </h1>
      <div className="card stack">
        {(orgs ?? []).map((o) => (
          <div key={o.id} className="row spread" style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
            <span className="stack gap-1">
              <span className="text-callout">{o.name}</span>
              <span className="text-footnote">{o.service_zone ?? "—"}</span>
            </span>
            <span className="badge badge-accent">{o.type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
