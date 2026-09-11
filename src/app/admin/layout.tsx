"use client";

import { LayoutGrid, Users, Building2, ClipboardList, FileClock } from "lucide-react";
import { DesktopShell, type NavItem } from "@/components/shell/DesktopShell";

const navItems: NavItem[] = [
  { href: "/admin", label: "Overview", icon: LayoutGrid },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/organizations", label: "Organizations", icon: Building2 },
  { href: "/admin/operations", label: "Operations", icon: ClipboardList },
  { href: "/admin/audit-logs", label: "Audit logs", icon: FileClock },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <DesktopShell navItems={navItems} title="Admin" subtitle="EcoTrace platform" pageTitle="Admin console">
      {children}
    </DesktopShell>
  );
}
