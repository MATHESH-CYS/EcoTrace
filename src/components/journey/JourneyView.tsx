import { Check, Circle, MapPin, Camera, KeyRound, Scale, ShieldCheck, Truck, Recycle } from "lucide-react";
import type { JourneyData } from "@/lib/data/journey";
import { STATUS_LABEL, STATUS_FLOW, statusIndex, isTerminal } from "@/lib/status";
import styles from "./JourneyView.module.scss";

type Step = {
  key: string;
  title: string;
  done: boolean;
  active: boolean;
  icon: React.ReactNode;
  detail?: React.ReactNode;
  timestamp?: string | null;
};

function fmt(ts?: string | null) {
  if (!ts) return null;
  return new Date(ts).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function JourneyView({ data }: { data: JourneyData }) {
  const { pickup, items, assignment, collectionRecord, evidence, verification, shipment, receipt, processing, materials, integrityHash } = data;

  const processingComplete = processing.some((p) => p.stage === "COMPLETED");
  const photoCount = evidence.filter((e) => e.kind === "PHOTO").length;

  // Prefer the authoritative pickup status for "done" state — a viewer's RLS-scoped
  // detail records (e.g. a recycler can't see raw collector evidence) may be null
  // even though that stage has genuinely completed, so status is the source of truth
  // and per-viewer detail rows simply render only when that data is visible to them.
  const curIdx = statusIndex(pickup.status);
  const reached = (stage: (typeof STATUS_FLOW)[number]) => curIdx >= STATUS_FLOW.indexOf(stage);

  const steps: Step[] = [
    {
      key: "requested",
      title: "Citizen request",
      done: true,
      active: false,
      icon: <Check size={15} />,
      timestamp: pickup.created_at,
      detail: (
        <div className={styles.detailRow}>
          {items.length} item{items.length !== 1 ? "s" : ""} · est. ₹{pickup.estimated_value_min}–{pickup.estimated_value_max}
        </div>
      ),
    },
    {
      key: "assigned",
      title: "Collector assigned",
      done: reached("ASSIGNED") || !!assignment,
      active: !assignment && pickup.status === "REQUESTED",
      icon: <Truck size={15} />,
      timestamp: assignment?.assigned_at,
      detail: assignment ? (
        <div className={styles.detailRow}>
          {assignment.collector?.full_name ?? "Collector"} · {assignment.status === "ACCEPTED" ? "Accepted" : assignment.status}
        </div>
      ) : undefined,
    },
    {
      key: "collected",
      title: "Collector pickup",
      done: reached("COLLECTED") || !!collectionRecord?.completed_at,
      active: !!assignment && !reached("COLLECTED"),
      icon: <Scale size={15} />,
      timestamp: collectionRecord?.completed_at,
      detail: collectionRecord ? (
        <div className={styles.stepDetail}>
          {photoCount > 0 && (
            <div className={styles.detailRow}>
              <Camera size={13} /> {photoCount} photo{photoCount !== 1 ? "s" : ""} captured
            </div>
          )}
          {collectionRecord.gps_lat != null && (
            <div className={styles.detailRow}>
              <MapPin size={13} /> GPS verified
            </div>
          )}
          {collectionRecord.otp_verified_at && (
            <div className={styles.detailRow}>
              <KeyRound size={13} /> OTP confirmed
            </div>
          )}
          {collectionRecord.actual_weight_kg != null && (
            <div className={styles.detailRow}>
              <Scale size={13} /> {collectionRecord.actual_weight_kg} kg
            </div>
          )}
        </div>
      ) : undefined,
    },
    {
      key: "verified",
      title: "Aggregator verification",
      done: reached("AGGREGATOR_VERIFIED") || verification?.status === "VERIFIED",
      active: reached("COLLECTED") && !reached("AGGREGATOR_VERIFIED"),
      icon: <ShieldCheck size={15} />,
      timestamp: verification?.created_at,
      detail: verification ? (
        <div className={styles.detailRow}>
          {verification.verified_weight_kg} kg verified
        </div>
      ) : undefined,
    },
    {
      key: "recycler",
      title: "Recycler receipt",
      done: reached("RECYCLER_RECEIVED") || !!receipt,
      active: reached("IN_TRANSIT_TO_RECYCLER") && !reached("RECYCLER_RECEIVED"),
      icon: <Recycle size={15} />,
      timestamp: receipt?.received_at,
      detail: (receipt || shipment) ? (
        <div className={styles.detailRow}>
          {receipt ? `${receipt.received_weight_kg} kg received` : "Shipment in transit"}
          {shipment ? ` · ${shipment.shipment_code}` : ""}
        </div>
      ) : undefined,
    },
    {
      key: "processing",
      title: "Processing",
      done: pickup.status === "COMPLETED" || processingComplete,
      active: reached("RECYCLER_RECEIVED") && !processingComplete,
      icon: <Recycle size={15} />,
      timestamp: processing.find((p) => p.stage === "COMPLETED")?.updated_at,
      detail:
        materials.length > 0 ? (
          <div className={styles.stepDetail}>
            {materials.map((m) => (
              <div key={m.id} className={styles.detailRow}>
                {m.material_type}: {m.recovered_weight_kg} kg
              </div>
            ))}
          </div>
        ) : undefined,
    },
    {
      key: "integrity",
      title: "Integrity verified",
      done: !!integrityHash,
      active: false,
      icon: <ShieldCheck size={15} />,
      timestamp: integrityHash?.computed_at,
      detail: integrityHash ? <div className={styles.detailRow}>Integrity hash generated</div> : undefined,
    },
  ];

  return (
    <div>
      <div className={styles.header}>
        <span className="text-caption">{STATUS_LABEL[pickup.status]}</span>
        <h1 className="text-title1">{pickup.collection_code}</h1>
        <span className={styles.code}>Created {fmt(pickup.created_at)}</span>
      </div>

      {assignment?.otp_code && !collectionRecord?.otp_verified_at && !isTerminal(pickup.status) && (
        <div className="card" style={{ background: "var(--accent-soft)", borderColor: "var(--accent)", marginBottom: 20 }}>
          <div className="row spread">
            <span className="row gap-2">
              <KeyRound size={18} className="text-accent" />
              <span className="text-callout" style={{ fontWeight: 600 }}>Pickup Verification OTP</span>
            </span>
            <span className="badge badge-success">Share with collector</span>
          </div>
          <div style={{ marginTop: 8, display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
            <span className="text-title1" style={{ letterSpacing: "0.25em", fontFamily: "ui-monospace, monospace", color: "var(--accent-strong)" }}>
              {assignment.otp_code}
            </span>
            <span className="text-footnote text-secondary">
              Provide this 6-digit code to your field collector upon pickup
            </span>
          </div>
        </div>
      )}

      <div className={styles.timeline}>
        {steps.map((step, idx) => (
          <div className={styles.step} key={step.key}>
            <div className={styles.stepMarkerCol}>
              <div className={`${styles.marker} ${step.done ? styles.markerDone : step.active ? styles.markerActive : ""}`}>
                {step.done ? <Check size={15} /> : step.active ? <Circle size={10} fill="currentColor" /> : step.icon}
              </div>
              {idx < steps.length - 1 && <div className={`${styles.stepLine} ${step.done ? styles.stepLineDone : ""}`} />}
            </div>
            <div className={styles.stepBody}>
              <div className={styles.stepTitle}>
                <span className="text-title3">{step.title}</span>
                {step.timestamp && <span className="text-footnote">{fmt(step.timestamp)}</span>}
              </div>
              {step.detail}
            </div>
          </div>
        ))}
      </div>

      {integrityHash && (
        <div className={styles.hashCard}>
          <div className="row spread">
            <span className="text-title3">Integrity hash</span>
            <ShieldCheck size={20} />
          </div>
          <p className="text-footnote" style={{ color: "rgba(255,255,255,0.85)", marginTop: 4 }}>
            SHA-256 over the verified collection, aggregator and recycler records
          </p>
          <div className={styles.hashValue}>SHA256:{integrityHash.hash}</div>
        </div>
      )}
    </div>
  );
}
