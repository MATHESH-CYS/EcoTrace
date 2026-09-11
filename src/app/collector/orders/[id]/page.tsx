import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/data/profile";
import { PickupWorkflow } from "@/components/collector/PickupWorkflow";

export default async function CollectorOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user } = await requireProfile();

  const { data: pickup } = await supabase.from("pickup_requests").select("*").eq("id", id).maybeSingle();
  if (!pickup) notFound();

  const [{ data: address }, { data: items }, { data: assignment }, { data: collectionRecord }] = await Promise.all([
    supabase.from("addresses").select("*").eq("id", pickup.address_id).maybeSingle(),
    supabase.from("pickup_items").select("*, category:waste_categories(*)").eq("pickup_request_id", pickup.id),
    supabase
      .from("collector_assignments")
      .select("*")
      .eq("pickup_request_id", pickup.id)
      .eq("collector_id", user.id)
      .order("assigned_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("collection_records").select("*").eq("pickup_request_id", pickup.id).maybeSingle(),
  ]);

  if (!assignment) notFound();

  return (
    <PickupWorkflow
      pickup={pickup}
      address={address}
      items={items ?? []}
      assignment={assignment}
      collectionRecord={collectionRecord}
      collectorId={user.id}
    />
  );
}
