import {
  Smartphone,
  Laptop,
  Tv,
  Monitor,
  Printer,
  Refrigerator,
  WashingMachine,
  Cable,
  Recycle,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  smartphone: Smartphone,
  laptop: Laptop,
  tv: Tv,
  monitor: Monitor,
  printer: Printer,
  refrigerator: Refrigerator,
  "washing-machine": WashingMachine,
  cable: Cable,
};

export function CategoryIcon({ icon, size = 22 }: { icon: string | null; size?: number }) {
  const Icon = (icon && ICONS[icon]) || Recycle;
  return <Icon size={size} />;
}
