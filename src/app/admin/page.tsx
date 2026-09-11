import { requireRole } from "@/lib/data/profile";

export default async function AdminOverviewPage() {
  const { supabase } = await requireRole("ADMIN");

  const [{ count: users }, { count: orgs }, { count: pickups }, { count: fraudAlerts }] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("organizations").select("*", { count: "exact", head: true }),
    supabase.from("pickup_requests").select("*", { count: "exact", head: true }),
    supabase.from("verification_records").select("*", { count: "exact", head: true }).gt("fraud_score", 60),
  ]);

  const stats = [
    { label: "Users", value: users ?? 0 },
    { label: "Organizations", value: orgs ?? 0 },
    { label: "Pickups", value: pickups ?? 0 },
    { label: "Fraud alerts", value: fraudAlerts ?? 0 },
  ];

  return (
    <div className="row gap-3 wrap">
      {stats.map((s) => (
        <div key={s.label} className="card" style={{ flex: "1 1 22%", minWidth: 160 }}>
          <span className="text-caption">{s.label}</span>
          <div className="text-title1" style={{ marginTop: 8 }}>
            {s.value}
          </div>
        </div>
      ))}
    </div>
  );
}
