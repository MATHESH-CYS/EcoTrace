"use client";

import { LayoutGrid, Inbox, ShieldCheck, Boxes, Truck } from "lucide-react";
import { DesktopShell, type NavItem } from "@/components/shell/DesktopShell";

const navItems: NavItem[] = [
  { href: "/aggregator", label: "Overview", icon: LayoutGrid },
  { href: "/aggregator/requests", label: "Requests", icon: Inbox },
  { href: "/aggregator/verification", label: "Verification", icon: ShieldCheck },
  { href: "/aggregator/inventory", label: "Inventory", icon: Boxes },
  { href: "/aggregator/shipments", label: "Shipments", icon: Truck },
];

export default function AggregatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <DesktopShell navItems={navItems} title="Aggregator" subtitle="GreenLoop Aggregators" pageTitle="Aggregator console">
      {children}
    </DesktopShell>
  );
}
