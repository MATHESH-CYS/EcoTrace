import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/data/profile";
import { VerificationPanel } from "@/components/aggregator/VerificationPanel";
import type { Tables } from "@/types/database.types";

export default async function AggregatorVerificationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, profile } = await requireProfile();

  const { data: pickup } = await supabase.from("pickup_requests").select("*").eq("id", id).maybeSingle();
  if (!pickup) notFound();

  const [{ data: address }, { data: items }, { data: collectionRecord }, { data: assignment }] = await Promise.all([
    supabase.from("addresses").select("*").eq("id", pickup.address_id).maybeSingle(),
    supabase.from("pickup_items").select("*, category:waste_categories(*)").eq("pickup_request_id", pickup.id),
    supabase.from("collection_records").select("*").eq("pickup_request_id", pickup.id).maybeSingle(),
    supabase
      .from("collector_assignments")
      .select("*, collector:profiles!collector_assignments_collector_id_fkey(*)")
      .eq("pickup_request_id", pickup.id)
      .eq("status", "ACCEPTED")
      .maybeSingle(),
  ]);

  let evidence: Tables<"collection_evidence">[] = [];
  if (collectionRecord) {
    const { data } = await supabase.from("collection_evidence").select("*").eq("collection_record_id", collectionRecord.id);
    evidence = data ?? [];
  }

  const { data: fraudScore } = await supabase.rpc("compute_fraud_score", { p_pickup_id: pickup.id });

  const evidenceWithUrls = await Promise.all(
    evidence.map(async (e) => {
      const { data } = await supabase.storage.from("collection-evidence").createSignedUrl(e.storage_path, 3600);
      return { ...e, signedUrl: data?.signedUrl ?? null };
    })
  );

  return (
    <VerificationPanel
      pickup={pickup}
      address={address}
      items={items ?? []}
      collectionRecord={collectionRecord}
      collector={assignment?.collector ?? null}
      evidence={evidenceWithUrls}
      fraudScore={fraudScore ?? 0}
      orgId={profile.organization_id!}
    />
  );
}
