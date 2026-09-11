"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function CampaignForm({ orgId }: { orgId: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [bonus, setBonus] = useState("");
  const [region, setRegion] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!name) return;
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.from("brand_campaigns").insert({
      brand_org_id: orgId,
      name,
      bonus_amount: Number(bonus) || 0,
      region: region || null,
      start_date: startDate || null,
      end_date: endDate || null,
    });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    setName("");
    setBonus("");
    setRegion("");
    router.refresh();
  }

  return (
    <div className="card">
      <h2 className="text-title3" style={{ marginBottom: 12 }}>
        New campaign
      </h2>
      {error && <p className="text-danger text-footnote" style={{ marginBottom: 10 }}>{error}</p>}
      <div className="stack gap-3">
        <input className="input" placeholder="Campaign name" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="row gap-3">
          <input className="input" type="number" placeholder="Bonus (₹)" value={bonus} onChange={(e) => setBonus(e.target.value)} />
          <input className="input" placeholder="Region (optional)" value={region} onChange={(e) => setRegion(e.target.value)} />
        </div>
        <div className="row gap-3">
          <input className="input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <input className="input" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <button className="btn btn-primary" disabled={busy || !name} onClick={submit}>
          Create campaign
        </button>
      </div>
    </div>
  );
}
