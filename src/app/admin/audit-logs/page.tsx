import { requireProfile } from "@/lib/data/profile";

export default async function AdminAuditLogsPage() {
  const { supabase } = await requireProfile();
  const { data: logs } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div>
      <h1 className="text-title1" style={{ marginBottom: 20 }}>
        Audit logs
      </h1>
      <div className="card stack" style={{ overflowX: "auto" }}>
        {(logs ?? []).map((l) => (
          <div key={l.id} className="row spread" style={{ padding: "8px 0", borderBottom: "1px solid var(--border)", gap: 12 }}>
            <span className="text-footnote" style={{ minWidth: 140 }}>
              {new Date(l.created_at).toLocaleString()}
            </span>
            <span className="text-callout" style={{ flex: 1 }}>
              {l.action}
            </span>
            <span className="text-footnote">{l.actor_role ?? "system"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
