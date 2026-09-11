import { requireProfile } from "@/lib/data/profile";
import { CampaignForm } from "@/components/brand/CampaignForm";

export default async function BrandCampaignsPage() {
  const { supabase, profile } = await requireProfile();
  const orgId = profile.organization_id ?? "00000000-0000-0000-0000-000000000a03";

  const { data: campaigns } = await supabase
    .from("brand_campaigns")
    .select("*")
    .eq("brand_org_id", orgId)
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-title1" style={{ marginBottom: 20 }}>
        Campaigns
      </h1>

      <CampaignForm orgId={orgId} />

      <div className="stack gap-3" style={{ marginTop: 24 }}>
        {(!campaigns || campaigns.length === 0) && (
          <div className="card">
            <p className="text-secondary text-body">No campaigns yet.</p>
          </div>
        )}
        {(campaigns ?? []).map((c) => (
          <div key={c.id} className="card">
            <div className="row spread">
              <span className="text-callout">{c.name}</span>
              <span className={c.is_active ? "badge badge-success" : "badge"}>{c.is_active ? "Active" : "Inactive"}</span>
            </div>
            <div className="text-footnote" style={{ marginTop: 6 }}>
              Bonus ₹{c.bonus_amount} · {c.region ?? "All regions"} · {c.start_date} → {c.end_date}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
