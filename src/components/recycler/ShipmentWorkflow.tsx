"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/types/database.types";

const STAGES = ["RECEIVED", "INSPECTED", "DISMANTLED", "MATERIAL_SEPARATED", "PROCESSED", "COMPLETED"] as const;
const STAGE_LABEL: Record<string, string> = {
  RECEIVED: "Received",
  INSPECTED: "Inspected",
  DISMANTLED: "Dismantled",
  MATERIAL_SEPARATED: "Material separated",
  PROCESSED: "Processed",
  COMPLETED: "Completed",
};
const MATERIALS = ["Copper", "Aluminium", "Steel", "Plastic", "Glass", "PCB", "Battery", "Other"];

type ShipmentItem = Tables<"shipment_items"> & {
  pickup: Tables<"pickup_requests"> & { verification: { verified_weight_kg: number } | { verified_weight_kg: number }[] | null };
};

function verifiedWeight(p: ShipmentItem["pickup"]): number {
  const v = p.verification;
  if (!v) return p.estimated_weight_kg;
  return Array.isArray(v) ? (v[0]?.verified_weight_kg ?? p.estimated_weight_kg) : v.verified_weight_kg;
}

export function ShipmentWorkflow({
  shipment,
  items,
  receipt,
  processing,
  materials,
  userId,
}: {
  shipment: Tables<"recycler_shipments">;
  items: ShipmentItem[];
  receipt: Tables<"recycler_receipts"> | null;
  processing: Tables<"processing_records">[];
  materials: Tables<"material_recovery">[];
  userId: string;
}) {
  const router = useRouter();
  const totalExpected = items.reduce((sum, it) => sum + verifiedWeight(it.pickup), 0);
  const [receivedWeight, setReceivedWeight] = useState(String(totalExpected || shipment.expected_weight_kg));
  const [discrepancy, setDiscrepancy] = useState("");
  const [materialType, setMaterialType] = useState(MATERIALS[0]);
  const [materialWeight, setMaterialWeight] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentStageIndex = processing.length
    ? Math.max(...processing.map((p) => STAGES.indexOf(p.stage as (typeof STAGES)[number])))
    : -1;
  const nextStage = currentStageIndex < STAGES.length - 1 ? STAGES[currentStageIndex + 1] : null;
  const latestProcessingId = processing[0]?.id;

  async function confirmReceipt() {
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.from("recycler_receipts").insert({
      shipment_id: shipment.id,
      received_weight_kg: Number(receivedWeight),
      received_by: userId,
      discrepancy_notes: discrepancy || null,
    });
    if (!err) {
      await supabase.from("recycler_shipments").update({ status: "RECEIVED" }).eq("id", shipment.id);
      for (const it of items) {
        await supabase.from("pickup_requests").update({ status: "RECYCLER_RECEIVED" }).eq("id", it.pickup_request_id);
      }
    }
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.refresh();
  }

  async function advanceStage() {
    if (!nextStage) return;
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.from("processing_records").insert(
      items.map((it) => ({
        pickup_request_id: it.pickup_request_id,
        shipment_id: shipment.id,
        stage: nextStage,
        updated_by: userId,
      }))
    );
    if (!err && nextStage === "COMPLETED") {
      await supabase.from("recycler_shipments").update({ status: "COMPLETED" }).eq("id", shipment.id);
      for (const it of items) {
        await supabase.from("pickup_requests").update({ status: "COMPLETED" }).eq("id", it.pickup_request_id);
      }
    } else if (!err) {
      for (const it of items) {
        await supabase.from("pickup_requests").update({ status: "PROCESSING" }).eq("id", it.pickup_request_id);
      }
    }
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.refresh();
  }

  async function addMaterial() {
    if (!latestProcessingId || !materialWeight) return;
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.from("material_recovery").insert({
      processing_record_id: latestProcessingId,
      material_type: materialType,
      recovered_weight_kg: Number(materialWeight),
    });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    setMaterialWeight("");
    router.refresh();
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <h1 className="text-title1" style={{ marginBottom: 20 }}>
        {shipment.shipment_code}
      </h1>

      {error && (
        <div className="card" style={{ borderColor: "var(--danger)", marginBottom: 16 }}>
          <span className="text-danger text-callout">{error}</span>
        </div>
      )}

      <div className="card" style={{ marginBottom: 16 }}>
        <h2 className="text-title3" style={{ marginBottom: 10 }}>
          Contents
        </h2>
        {items.map((it) => (
          <div key={it.id} className="row spread" style={{ padding: "6px 0" }}>
            <span className="text-callout">{it.pickup.collection_code}</span>
            <span className="text-footnote">{verifiedWeight(it.pickup)} kg verified</span>
          </div>
        ))}
      </div>

      {!receipt ? (
        <div className="card">
          <h2 className="text-title3" style={{ marginBottom: 10 }}>
            Confirm receipt
          </h2>
          <div className="field">
            <label>Received weight (kg)</label>
            <input type="number" step={0.01} className="input" value={receivedWeight} onChange={(e) => setReceivedWeight(e.target.value)} />
          </div>
          <div className="field" style={{ marginTop: 12 }}>
            <label>Discrepancy notes (optional)</label>
            <textarea className="textarea" value={discrepancy} onChange={(e) => setDiscrepancy(e.target.value)} />
          </div>
          <button className="btn btn-primary btn-block" style={{ marginTop: 14 }} disabled={busy} onClick={confirmReceipt}>
            Confirm receipt
          </button>
        </div>
      ) : (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="row spread">
              <span className="text-title3">Received</span>
              <span className="badge badge-success">{receipt.received_weight_kg} kg</span>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <h2 className="text-title3" style={{ marginBottom: 10 }}>
              Processing
            </h2>
            <div className="row gap-2 wrap" style={{ marginBottom: 14 }}>
              {STAGES.map((s, idx) => (
                <span key={s} className={idx <= currentStageIndex ? "badge badge-success" : "badge"}>
                  {STAGE_LABEL[s]}
                </span>
              ))}
            </div>
            {nextStage ? (
              <button className="btn btn-primary" disabled={busy} onClick={advanceStage}>
                {currentStageIndex === -1 ? "Start processing" : `Advance to ${STAGE_LABEL[nextStage]}`}
              </button>
            ) : (
              <p className="text-accent text-callout">Processing complete — integrity hash generated.</p>
            )}
          </div>

          {currentStageIndex >= STAGES.indexOf("MATERIAL_SEPARATED") && (
            <div className="card">
              <h2 className="text-title3" style={{ marginBottom: 10 }}>
                Material recovery
              </h2>
              {materials.map((m) => (
                <div key={m.id} className="row spread text-footnote" style={{ padding: "4px 0" }}>
                  <span>{m.material_type}</span>
                  <span>{m.recovered_weight_kg} kg</span>
                </div>
              ))}
              <div className="row gap-2" style={{ marginTop: 12 }}>
                <select className="select" value={materialType} onChange={(e) => setMaterialType(e.target.value)}>
                  {MATERIALS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  step={0.01}
                  className="input"
                  placeholder="kg"
                  value={materialWeight}
                  onChange={(e) => setMaterialWeight(e.target.value)}
                />
                <button className="btn btn-secondary" disabled={busy || !materialWeight} onClick={addMaterial}>
                  Add
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
