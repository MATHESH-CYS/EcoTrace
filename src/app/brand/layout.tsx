"use client";

import { LayoutGrid, Target, Package, Megaphone, FileBarChart } from "lucide-react";
import { DesktopShell, type NavItem } from "@/components/shell/DesktopShell";

const navItems: NavItem[] = [
  { href: "/brand", label: "Overview", icon: LayoutGrid },
  { href: "/brand/targets", label: "Targets", icon: Target },
  { href: "/brand/collections", label: "Collections", icon: Package },
  { href: "/brand/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/brand/reports", label: "Reports", icon: FileBarChart },
];

export default function BrandLayout({ children }: { children: React.ReactNode }) {
  return (
    <DesktopShell navItems={navItems} title="Brand" subtitle="Nova Electronics" pageTitle="Brand dashboard">
      {children}
    </DesktopShell>
  );
}
