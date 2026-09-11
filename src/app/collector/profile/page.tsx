import { User, Mail, Truck, Star } from "lucide-react";
import { requireProfile } from "@/lib/data/profile";
import { signOutAction } from "@/lib/actions/auth";

export default async function CollectorProfilePage() {
  const { supabase, user, profile } = await requireProfile();
  const { data: cp } = await supabase.from("collector_profiles").select("*").eq("id", user.id).single();

  return (
    <div>
      <h1 className="text-title1" style={{ marginBottom: 20 }}>
        Profile
      </h1>

      <div className="card stack gap-4">
        <div className="row gap-3">
          <span className="icon-btn" style={{ pointerEvents: "none" }}>
            <User size={16} />
          </span>
          <span className="stack gap-1">
            <span className="text-callout">{profile.full_name}</span>
            <span className="text-footnote">Collector partner</span>
          </span>
        </div>
        <div className="row gap-3">
          <Mail size={16} className="text-secondary" />
          <span className="text-body">{profile.email}</span>
        </div>
        <div className="row gap-3">
          <Truck size={16} className="text-secondary" />
          <span className="text-body">{cp?.vehicle_type ?? "—"} · {cp?.service_zone ?? "—"}</span>
        </div>
        <div className="row gap-3">
          <Star size={16} className="text-secondary" />
          <span className="text-body">{cp?.rating ?? "5.0"} rating · {cp?.total_collections ?? 0} collections</span>
        </div>
      </div>

      <form action={signOutAction} style={{ marginTop: 24 }}>
        <button type="submit" className="btn btn-outline btn-block">
          Sign out
        </button>
      </form>
    </div>
  );
}
