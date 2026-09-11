import { User, Mail, Phone, MapPin } from "lucide-react";
import { requireProfile } from "@/lib/data/profile";
import { signOutAction } from "@/lib/actions/auth";

export default async function CitizenProfilePage() {
  const { supabase, user, profile } = await requireProfile();
  const { data: addresses } = await supabase.from("addresses").select("*").eq("citizen_id", user.id);

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
            <span className="text-footnote">Citizen</span>
          </span>
        </div>
        <div className="row gap-3">
          <Mail size={16} className="text-secondary" />
          <span className="text-body">{profile.email}</span>
        </div>
        {profile.phone && (
          <div className="row gap-3">
            <Phone size={16} className="text-secondary" />
            <span className="text-body">{profile.phone}</span>
          </div>
        )}
      </div>

      <div style={{ marginTop: 24 }}>
        <h2 className="text-title3" style={{ marginBottom: 12 }}>
          Addresses
        </h2>
        <div className="card stack gap-3">
          {(addresses ?? []).length === 0 && <p className="text-secondary text-body">No saved addresses.</p>}
          {(addresses ?? []).map((a) => (
            <div key={a.id} className="row gap-3">
              <MapPin size={16} className="text-accent" />
              <span className="stack gap-1">
                <span className="text-callout">{a.label}</span>
                <span className="text-footnote">
                  {a.line1}, {a.city}, {a.state} {a.pincode}
                </span>
              </span>
            </div>
          ))}
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
