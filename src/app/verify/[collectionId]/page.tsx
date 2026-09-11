import { notFound } from "next/navigation";
import { Leaf, ShieldCheck, ShieldX, Check, X } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import styles from "./page.module.scss";

type IntegrityRecord = {
  collection_code: string;
  status: string;
  created_at: string;
  collector_evidence_verified: boolean;
  collector_weight_kg: number | null;
  aggregator_verified: boolean;
  aggregator_weight_kg: number | null;
  recycler_confirmed: boolean;
  recycler_weight_kg: number | null;
  processing_completed: boolean;
  hash: string | null;
  hash_computed_at: string | null;
};

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ collectionId: string }>;
}) {
  const { collectionId } = await params;
  const supabase = await createClient();

  const { data } = await supabase.rpc("get_integrity_record", {
    p_collection_code: decodeURIComponent(collectionId),
  });

  const record = data as IntegrityRecord | null;
  if (!record) notFound();

  const checks = [
    { label: "Collector evidence", ok: record.collector_evidence_verified, detail: record.collector_weight_kg ? `${record.collector_weight_kg} kg` : null },
    { label: "Aggregator verification", ok: record.aggregator_verified, detail: record.aggregator_weight_kg ? `${record.aggregator_weight_kg} kg` : null },
    { label: "Recycler confirmation", ok: record.recycler_confirmed, detail: record.recycler_weight_kg ? `${record.recycler_weight_kg} kg` : null },
    { label: "Processing complete", ok: record.processing_completed, detail: null },
  ];

  const allMatch = !!record.hash && checks.every((c) => c.ok);

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <Leaf size={20} />
          EcoTrace
        </div>

        <div className={styles.matchBanner}>
          {allMatch ? <ShieldCheck size={36} /> : <ShieldX size={36} />}
          <span className="text-title2">EcoTrace record integrity</span>
          <span className="text-title1">{record.collection_code}</span>
          <span className="text-callout">{allMatch ? "MATCH — record is intact" : "Verification in progress"}</span>
        </div>

        <div className={`card ${styles.checklist}`}>
          {checks.map((c) => (
            <div key={c.label} className={styles.row}>
              <span className="row gap-2">
                {c.ok ? <Check size={15} className="text-accent" /> : <X size={15} className="text-tertiary" />}
                <span className="text-callout">{c.label}</span>
              </span>
              {c.detail && <span className="text-footnote">{c.detail}</span>}
            </div>
          ))}

          {record.hash && (
            <div className={styles.hashBox}>SHA256:{record.hash}</div>
          )}
        </div>

        <p className={`text-footnote ${styles.disclaimer}`}>
          Verified e-waste traceability and chain-of-custody record. Distinct from statutory regulatory filings.
        </p>
      </div>
    </div>
  );
}
