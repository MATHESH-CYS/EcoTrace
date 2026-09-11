import type { PickupStatus } from "@/lib/status";
import { STATUS_LABEL, STATUS_TONE } from "@/lib/status";

const TONE_CLASS: Record<string, string> = {
  neutral: "badge",
  accent: "badge badge-accent",
  success: "badge badge-success",
  danger: "badge badge-danger",
  warning: "badge badge-warning",
};

export function StatusBadge({ status }: { status: PickupStatus }) {
  const tone = STATUS_TONE[status];
  return <span className={TONE_CLASS[tone]}>{STATUS_LABEL[status]}</span>;
}
