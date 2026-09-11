import type { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database.types";

export type JourneyData = {
  pickup: Tables<"pickup_requests">;
  address: Tables<"addresses"> | null;
  items: (Tables<"pickup_items"> & { category: Tables<"waste_categories"> | null })[];
  assignment: (Tables<"collector_assignments"> & { collector: Tables<"profiles"> | null }) | null;
  collectorProfile: Tables<"collector_profiles"> | null;
  collectionRecord: Tables<"collection_records"> | null;
  evidence: Tables<"collection_evidence">[];
  verification: Tables<"verification_records"> | null;
  shipment: Tables<"recycler_shipments"> | null;
  receipt: Tables<"recycler_receipts"> | null;
  processing: Tables<"processing_records">[];
  materials: Tables<"material_recovery">[];
  integrityHash: Tables<"evidence_hashes"> | null;
};

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export async function getJourneyByCollectionCode(
  supabase: SupabaseServerClient,
  collectionCode: string
): Promise<JourneyData | null> {
  const { data: pickup } = await supabase
    .from("pickup_requests")
    .select("*")
    .eq("collection_code", collectionCode)
    .maybeSingle();

  if (!pickup) return null;
  return getJourneyByPickupId(supabase, pickup);
}

export async function getJourneyById(
  supabase: SupabaseServerClient,
  pickupId: string
): Promise<JourneyData | null> {
  const { data: pickup } = await supabase.from("pickup_requests").select("*").eq("id", pickupId).maybeSingle();
  if (!pickup) return null;
  return getJourneyByPickupId(supabase, pickup);
}

export async function getJourneyByPickupId(
  supabase: SupabaseServerClient,
  pickup: Tables<"pickup_requests">
): Promise<JourneyData> {
  const [
    { data: address },
    { data: itemRows },
    { data: assignments },
    { data: collectionRecord },
    { data: verification },
    { data: shipmentItems },
    { data: processing },
    { data: integrityHash },
  ] = await Promise.all([
    supabase.from("addresses").select("*").eq("id", pickup.address_id).maybeSingle(),
    supabase.from("pickup_items").select("*, category:waste_categories(*)").eq("pickup_request_id", pickup.id),
    supabase
      .from("collector_assignments")
      .select("*, collector:profiles!collector_assignments_collector_id_fkey(*)")
      .eq("pickup_request_id", pickup.id)
      .order("assigned_at", { ascending: false })
      .limit(1),
    supabase.from("collection_records").select("*").eq("pickup_request_id", pickup.id).maybeSingle(),
    supabase.from("verification_records").select("*").eq("pickup_request_id", pickup.id).maybeSingle(),
    supabase.from("shipment_items").select("*, shipment:recycler_shipments(*)").eq("pickup_request_id", pickup.id),
    supabase.from("processing_records").select("*").eq("pickup_request_id", pickup.id).order("updated_at"),
    supabase.from("evidence_hashes").select("*").eq("pickup_request_id", pickup.id).maybeSingle(),
  ]);

  const assignment = (assignments?.[0] as (Tables<"collector_assignments"> & { collector: Tables<"profiles"> | null }) | undefined) ?? null;

  let collectorProfile: Tables<"collector_profiles"> | null = null;
  if (assignment?.collector_id) {
    const { data } = await supabase.from("collector_profiles").select("*").eq("id", assignment.collector_id).maybeSingle();
    collectorProfile = data;
  }

  let evidence: Tables<"collection_evidence">[] = [];
  if (collectionRecord) {
    const { data } = await supabase.from("collection_evidence").select("*").eq("collection_record_id", collectionRecord.id);
    evidence = data ?? [];
  }

  const shipmentRow = (shipmentItems?.[0] as { shipment: Tables<"recycler_shipments"> } | undefined)?.shipment ?? null;

  let receipt: Tables<"recycler_receipts"> | null = null;
  if (shipmentRow) {
    const { data } = await supabase.from("recycler_receipts").select("*").eq("shipment_id", shipmentRow.id).maybeSingle();
    receipt = data;
  }

  let materials: Tables<"material_recovery">[] = [];
  if (processing && processing.length > 0) {
    const { data } = await supabase
      .from("material_recovery")
      .select("*")
      .in("processing_record_id", processing.map((p) => p.id));
    materials = data ?? [];
  }

  return {
    pickup,
    address: address ?? null,
    items: (itemRows ?? []) as JourneyData["items"],
    assignment,
    collectorProfile,
    collectionRecord: collectionRecord ?? null,
    evidence,
    verification: verification ?? null,
    shipment: shipmentRow,
    receipt,
    processing: processing ?? [],
    materials,
    integrityHash: integrityHash ?? null,
  };
}
