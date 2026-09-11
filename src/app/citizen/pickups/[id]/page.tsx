import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireProfile } from "@/lib/data/profile";
import { getJourneyById } from "@/lib/data/journey";
import { JourneyView } from "@/components/journey/JourneyView";
import { RealtimeRefresher } from "@/components/RealtimeRefresher";

export default async function CitizenPickupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireProfile();

  const data = await getJourneyById(supabase, id);
  if (!data) notFound();

  return (
    <div>
      <RealtimeRefresher
        channelName={`pickup-${data.pickup.id}`}
        tables={["pickup_requests", "collector_assignments", "collection_records", "verification_records", "recycler_receipts", "processing_records"]}
        filters={{ pickup_requests: `id=eq.${data.pickup.id}` }}
      />
      <div className="row gap-3" style={{ marginBottom: 16 }}>
        <Link href="/citizen/pickups" className="icon-btn" aria-label="Back">
          <ChevronLeft size={18} />
        </Link>
      </div>
      <JourneyView data={data} />
    </div>
  );
}
