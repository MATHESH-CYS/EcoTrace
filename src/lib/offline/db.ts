import Dexie, { type Table } from "dexie";
import { createClient } from "@/lib/supabase/client";
import type { Json } from "@/types/database.types";

export interface OfflineQueueItem {
  id?: number;
  client_operation_id: string;
  user_id: string;
  action: string;
  entity_type: string;
  payload: Record<string, unknown>;
  status: "PENDING" | "SYNCING" | "SYNCED" | "FAILED";
  error?: string;
  created_at: string;
  retry_count: number;
}

export interface CachedPickup {
  id: string;
  user_id: string;
  collection_code?: string;
  status: string;
  data: Record<string, unknown>;
  cached_at: string;
}

export interface CachedAssignment {
  id: string;
  collector_id: string;
  pickup_id: string;
  status: string;
  data: Record<string, unknown>;
  cached_at: string;
}

export class EcoTraceOfflineDB extends Dexie {
  offlineQueue!: Table<OfflineQueueItem, number>;
  cachedPickups!: Table<CachedPickup, string>;
  cachedAssignments!: Table<CachedAssignment, string>;

  constructor() {
    super("EcoTraceOfflineDB");
    this.version(1).stores({
      offlineQueue: "++id, client_operation_id, user_id, action, entity_type, status, created_at",
      cachedPickups: "id, user_id, status, cached_at",
      cachedAssignments: "id, collector_id, pickup_id, status, cached_at",
    });
  }
}

export const offlineDb = typeof window !== "undefined" ? new EcoTraceOfflineDB() : null;

/**
 * Enqueue an operation when offline or for guaranteed delivery.
 */
export async function enqueueOfflineAction(
  userId: string,
  action: string,
  entityType: string,
  payload: Record<string, unknown>
): Promise<string> {
  if (!offlineDb) return crypto.randomUUID();

  const clientOperationId = crypto.randomUUID();
  await offlineDb.offlineQueue.add({
    client_operation_id: clientOperationId,
    user_id: userId,
    action,
    entity_type: entityType,
    payload,
    status: "PENDING",
    created_at: new Date().toISOString(),
    retry_count: 0,
  });

  return clientOperationId;
}

/**
 * Clear cached data for security on logout.
 * Prevents user B from seeing user A's cached offline operations.
 */
export async function clearUserOfflineCache(userId?: string): Promise<void> {
  if (!offlineDb) return;

  try {
    if (userId) {
      await offlineDb.transaction(
        "rw",
        offlineDb.offlineQueue,
        offlineDb.cachedPickups,
        offlineDb.cachedAssignments,
        async () => {
          await offlineDb!.offlineQueue.where("user_id").equals(userId).delete();
          await offlineDb!.cachedPickups.where("user_id").equals(userId).delete();
          await offlineDb!.cachedAssignments.where("collector_id").equals(userId).delete();
        }
      );
    } else {
      await offlineDb.offlineQueue.clear();
      await offlineDb.cachedPickups.clear();
      await offlineDb.cachedAssignments.clear();
    }
  } catch (err) {
    console.error("Failed to clear offline cache:", err);
  }
}

/**
 * Process the offline sync queue idempotently.
 */
export async function processOfflineQueue(): Promise<{ processed: number; failed: number }> {
  if (!offlineDb || typeof window === "undefined" || !navigator.onLine) {
    return { processed: 0, failed: 0 };
  }

  const pendingItems = await offlineDb.offlineQueue
    .where("status")
    .equals("PENDING")
    .toArray();

  if (pendingItems.length === 0) return { processed: 0, failed: 0 };

  const supabase = createClient();
  let processed = 0;
  let failed = 0;

  for (const item of pendingItems) {
    try {
      await offlineDb.offlineQueue.update(item.id!, { status: "SYNCING" });

      if (item.action === "CREATE_PICKUP") {
        const p = item.payload;
        const { error } = await supabase.rpc("create_pickup_request", {
          p_address_id: String(p.address_id),
          p_scheduled_date: String(p.scheduled_date),
          p_scheduled_slot: String(p.scheduled_slot),
          p_payment_preference: String(p.payment_preference ?? "UPI"),
          p_notes: p.notes ? String(p.notes) : null,
          p_items: p.items as Json,
        });

        if (error) throw error;
      } else if (item.action === "COLLECTOR_ARRIVED") {
        const { error } = await supabase
          .from("pickup_requests")
          .update({ status: "ARRIVED" })
          .eq("id", String(item.payload.pickup_id));
        if (error) throw error;
      } else if (item.action === "RECORD_COLLECTION") {
        const { error } = await supabase
          .from("collection_records")
          .insert({
            pickup_request_id: String(item.payload.pickup_id),
            collector_id: item.user_id,
            actual_weight_kg: Number(item.payload.actual_weight_kg),
            notes: item.payload.notes ? String(item.payload.notes) : null,
            client_operation_id: item.client_operation_id,
          });
        if (error) throw error;
      }

      await offlineDb.offlineQueue.update(item.id!, { status: "SYNCED" });
      processed++;
    } catch (err: unknown) {
      console.error("Offline sync item failed:", item, err);
      failed++;
      const errorMessage = err instanceof Error ? err.message : "Unknown sync error";
      await offlineDb.offlineQueue.update(item.id!, {
        status: "FAILED",
        error: errorMessage,
        retry_count: item.retry_count + 1,
      });
    }
  }

  return { processed, failed };
}
