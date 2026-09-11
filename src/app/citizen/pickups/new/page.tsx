import { requireProfile } from "@/lib/data/profile";
import { NewPickupFlow } from "@/components/citizen/NewPickupFlow";

export default async function NewPickupPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { supabase, user } = await requireProfile();
  const { category } = await searchParams;

  const [{ data: categories }, { data: addresses }] = await Promise.all([
    supabase.from("waste_categories").select("*").order("sort_order"),
    supabase.from("addresses").select("*").eq("citizen_id", user.id).order("is_default", { ascending: false }),
  ]);

  return (
    <NewPickupFlow
      categories={categories ?? []}
      addresses={addresses ?? []}
      initialCategoryId={category ?? null}
    />
  );
}
