import { requireProfile } from "@/lib/data/profile";
import { CreateStaffUserForm } from "@/components/admin/CreateStaffUserForm";

export default async function AdminUsersPage() {
  const { supabase } = await requireProfile();
  const [{ data: users }, { data: organizations }] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    supabase.from("organizations").select("*").order("name"),
  ]);

  return (
    <div>
      <h1 className="text-title1" style={{ marginBottom: 20 }}>
        Users
      </h1>

      <CreateStaffUserForm organizations={organizations ?? []} />

      <h2 className="text-title3" style={{ margin: "24px 0 12px" }}>
        All users
      </h2>
      <div className="card stack">
        {(users ?? []).map((u) => (
          <div key={u.id} className="row spread" style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
            <span className="stack gap-1">
              <span className="text-callout">{u.full_name}</span>
              <span className="text-footnote">{u.email}</span>
            </span>
            <span className={u.is_active ? "badge badge-success" : "badge badge-danger"}>{u.role}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
