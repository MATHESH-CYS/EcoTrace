import type { Enums } from "@/types/database.types";

export type PickupStatus = Enums<"pickup_status">;

export const STATUS_FLOW: PickupStatus[] = [
  "REQUESTED",
  "ASSIGNED",
  "COLLECTOR_ACCEPTED",
  "EN_ROUTE",
  "ARRIVED",
  "COLLECTED",
  "AGGREGATOR_VERIFIED",
  "IN_TRANSIT_TO_RECYCLER",
  "RECYCLER_RECEIVED",
  "PROCESSING",
  "COMPLETED",
];

export const STATUS_LABEL: Record<PickupStatus, string> = {
  REQUESTED: "Pickup requested",
  ASSIGNED: "Aggregator accepted",
  COLLECTOR_ACCEPTED: "Collector accepted",
  EN_ROUTE: "Collector on the way",
  ARRIVED: "Collector arrived",
  COLLECTED: "Picked up",
  AGGREGATOR_VERIFIED: "Aggregator verified",
  IN_TRANSIT_TO_RECYCLER: "In transit to recycler",
  RECYCLER_RECEIVED: "Recycler received",
  PROCESSING: "Processing",
  COMPLETED: "Processing complete",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

export const STATUS_TONE: Record<PickupStatus, "neutral" | "accent" | "success" | "danger" | "warning"> = {
  REQUESTED: "neutral",
  ASSIGNED: "accent",
  COLLECTOR_ACCEPTED: "accent",
  EN_ROUTE: "accent",
  ARRIVED: "accent",
  COLLECTED: "warning",
  AGGREGATOR_VERIFIED: "accent",
  IN_TRANSIT_TO_RECYCLER: "accent",
  RECYCLER_RECEIVED: "accent",
  PROCESSING: "accent",
  COMPLETED: "success",
  REJECTED: "danger",
  CANCELLED: "danger",
};

export function statusIndex(status: PickupStatus): number {
  const idx = STATUS_FLOW.indexOf(status);
  return idx === -1 ? STATUS_FLOW.length : idx;
}

export function isTerminal(status: PickupStatus) {
  return status === "COMPLETED" || status === "REJECTED" || status === "CANCELLED";
}

export const FRAUD_BUCKET = (score: number): { label: string; tone: "success" | "warning" | "danger" } => {
  if (score <= 30) return { label: "LOW", tone: "success" };
  if (score <= 60) return { label: "MEDIUM", tone: "warning" };
  return { label: "HIGH", tone: "danger" };
};
