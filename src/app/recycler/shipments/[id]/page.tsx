import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/data/profile";
import { ShipmentWorkflow } from "@/components/recycler/ShipmentWorkflow";

export default async function RecyclerShipmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user } = await requireProfile();

  const { data: shipment } = await supabase.from("recycler_shipments").select("*").eq("id", id).maybeSingle();
  if (!shipment) notFound();

  const [{ data: shipmentItems }, { data: receipt }] = await Promise.all([
    supabase
      .from("shipment_items")
      .select("*, pickup:pickup_requests(*, verification:verification_records(verified_weight_kg))")
      .eq("shipment_id", shipment.id),
    supabase.from("recycler_receipts").select("*").eq("shipment_id", shipment.id).maybeSingle(),
  ]);

  const pickupIds = (shipmentItems ?? []).map((si) => si.pickup_request_id);

  const { data: processing } = pickupIds.length
    ? await supabase.from("processing_records").select("*").in("pickup_request_id", pickupIds).order("updated_at", { ascending: false })
    : { data: [] };

  const processingIds = (processing ?? []).map((p) => p.id);
  const { data: materials } = processingIds.length
    ? await supabase.from("material_recovery").select("*").in("processing_record_id", processingIds)
    : { data: [] };

  return (
    <ShipmentWorkflow
      shipment={shipment}
      items={shipmentItems ?? []}
      receipt={receipt}
      processing={processing ?? []}
      materials={materials ?? []}
      userId={user.id}
    />
  );
}
