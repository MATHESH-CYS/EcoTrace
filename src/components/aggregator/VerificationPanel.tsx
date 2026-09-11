"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, KeyRound, Locate, ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { FRAUD_BUCKET } from "@/lib/status";
import type { Tables } from "@/types/database.types";

type Item = Tables<"pickup_items"> & { category: Tables<"waste_categories"> | null };
type Evidence = Tables<"collection_evidence"> & { signedUrl: string | null };

export function VerificationPanel({
  pickup,
  address,
  items,
  collectionRecord,
  collector,
  evidence,
  fraudScore,
  orgId,
}: {
  pickup: Tables<"pickup_requests">;
  address: Tables<"addresses"> | null;
  items: Item[];
  collectionRecord: Tables<"collection_records"> | null;
  collector: Tables<"profiles"> | null;
  evidence: Evidence[];
  fraudScore: number;
  orgId: string;
}) {
  const router = useRouter();
  const [weight, setWeight] = useState(String(collectionRecord?.actual_weight_kg ?? ""));
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bucket = FRAUD_BUCKET(fraudScore);

  async function submit(status: "VERIFIED" | "REJECTED" | "NEEDS_REVIEW") {
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error: err } = await supabase.from("verification_records").insert({
      pickup_request_id: pickup.id,
      aggregator_org_id: orgId,
      verified_by: user!.id,
      verified_weight_kg: Number(weight),
      fraud_score: fraudScore,
      status,
      notes: notes || null,
    });

    if (err) {
      setBusy(false);
      setError(err.message);
      return;
    }

    if (status === "VERIFIED") {
      await supabase.from("pickup_requests").update({ status: "AGGREGATOR_VERIFIED" }).eq("id", pickup.id);
    } else if (status === "REJECTED") {
      await supabase.from("pickup_requests").update({ status: "REJECTED" }).eq("id", pickup.id);
    }

    setBusy(false);
    router.push("/aggregator/verification");
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <h1 className="text-title1" style={{ marginBottom: 20 }}>
        {pickup.collection_code}
      </h1>

      {error && (
        <div className="card" style={{ borderColor: "var(--danger)", marginBottom: 16 }}>
          <span className="text-danger text-callout">{error}</span>
        </div>
      )}

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="row gap-2">
          <MapPin size={15} className="text-secondary" />
          <span className="text-body">
            {address?.line1}, {address?.city}, {address?.state} {address?.pincode}
          </span>
        </div>
        <div style={{ marginTop: 10 }}>
          {items.map((it) => (
            <div key={it.id} className="text-footnote">
              {it.category?.name} × {it.quantity} · citizen est. {it.estimated_weight_kg}kg
            </div>
          ))}
        </div>
        <div className="text-footnote" style={{ marginTop: 6 }}>
          Collector: {collector?.full_name ?? "—"}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h2 className="text-title3" style={{ marginBottom: 10 }}>
          Collector evidence
        </h2>
        <div className="row gap-4 wrap">
          <span className="row gap-2 text-footnote">
            <KeyRound size={14} className={collectionRecord?.otp_verified_at ? "text-accent" : "text-danger"} />
            OTP {collectionRecord?.otp_verified_at ? "verified" : "not verified"}
          </span>
          <span className="row gap-2 text-footnote">
            <Locate size={14} className={collectionRecord?.gps_lat ? "text-accent" : "text-danger"} />
            GPS {collectionRecord?.gps_lat ? "captured" : "unavailable"}
          </span>
        </div>
        <div className="text-footnote" style={{ marginTop: 8 }}>
          Actual weight: {collectionRecord?.actual_weight_kg ?? "—"} kg
        </div>
        {collectionRecord?.notes && (
          <div className="text-footnote" style={{ marginTop: 6 }}>
            Notes: {collectionRecord.notes}
          </div>
        )}
        {evidence.length > 0 && (
          <div className="row gap-2 wrap" style={{ marginTop: 12 }}>
            {evidence.map((e) =>
              e.signedUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={e.id}
                  src={e.signedUrl}
                  alt="Evidence"
                  style={{ width: 90, height: 90, objectFit: "cover", borderRadius: 10, border: "1px solid var(--border)" }}
                />
              ) : null
            )}
          </div>
        )}
      </div>

      <div className="card" style={{ marginBottom: 16, borderColor: bucket.tone === "danger" ? "var(--danger)" : undefined }}>
        <div className="row spread">
          <span className="row gap-2">
            <ShieldAlert size={16} className={`text-${bucket.tone === "danger" ? "danger" : "accent"}`} />
            <span className="text-title3">Fraud score</span>
          </span>
          <span className={`badge badge-${bucket.tone}`}>{bucket.label} · {fraudScore}</span>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="field">
          <label>Verified weight (kg)</label>
          <input type="number" step={0.01} className="input" value={weight} onChange={(e) => setWeight(e.target.value)} />
        </div>
        <div className="field" style={{ marginTop: 12 }}>
          <label>Notes (optional)</label>
          <textarea className="textarea" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>

      <div className="row gap-2">
        <button className="btn btn-danger" style={{ flex: 1 }} disabled={busy} onClick={() => submit("REJECTED")}>
          Reject
        </button>
        <button className="btn btn-secondary" style={{ flex: 1 }} disabled={busy} onClick={() => submit("NEEDS_REVIEW")}>
          Needs review
        </button>
        <button className="btn btn-primary" style={{ flex: 1 }} disabled={busy || !weight} onClick={() => submit("VERIFIED")}>
          Verify
        </button>
      </div>
    </div>
  );
}
