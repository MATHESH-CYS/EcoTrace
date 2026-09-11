import { notFound } from "next/navigation";
import Link from "next/link";
import { Leaf } from "lucide-react";
import { requireProfile } from "@/lib/data/profile";
import { getJourneyByCollectionCode } from "@/lib/data/journey";
import { JourneyView } from "@/components/journey/JourneyView";
import { RealtimeRefresher } from "@/components/RealtimeRefresher";

export default async function JourneyPage({
  params,
}: {
  params: Promise<{ collectionId: string }>;
}) {
  const { collectionId } = await params;
  const { supabase } = await requireProfile();

  const data = await getJourneyByCollectionCode(supabase, decodeURIComponent(collectionId));
  if (!data) notFound();

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "var(--space-6) var(--space-5) var(--space-16)" }}>
      <RealtimeRefresher
        channelName={`journey-${data.pickup.id}`}
        tables={["pickup_requests", "collector_assignments", "collection_records", "verification_records", "recycler_receipts", "processing_records"]}
        filters={{ pickup_requests: `id=eq.${data.pickup.id}` }}
      />
      <Link href={`/verify/${data.pickup.collection_code}`} className="row gap-2" style={{ marginBottom: 24 }}>
        <Leaf size={18} className="text-accent" />
        <span className="text-callout">EcoTrace · Verify integrity</span>
      </Link>
      <JourneyView data={data} />
    </div>
  );
}
