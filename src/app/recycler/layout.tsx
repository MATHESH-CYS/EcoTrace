"use client";

import { LayoutGrid, Truck, Recycle, Layers, History } from "lucide-react";
import { DesktopShell, type NavItem } from "@/components/shell/DesktopShell";

const navItems: NavItem[] = [
  { href: "/recycler", label: "Overview", icon: LayoutGrid },
  { href: "/recycler/shipments", label: "Shipments", icon: Truck },
  { href: "/recycler/processing", label: "Processing", icon: Recycle },
  { href: "/recycler/recovery", label: "Recovery", icon: Layers },
  { href: "/recycler/history", label: "History", icon: History },
];

export default function RecyclerLayout({ children }: { children: React.ReactNode }) {
  return (
    <DesktopShell navItems={navItems} title="Recycler" subtitle="EcoCycle Recyclers" pageTitle="Recycler console">
      {children}
    </DesktopShell>
  );
}
