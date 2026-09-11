"use client";

import { Home, Package, History, User } from "lucide-react";
import { MobileShell, type NavItem } from "@/components/shell/MobileShell";

const navItems: NavItem[] = [
  { href: "/collector", label: "Home", icon: Home },
  { href: "/collector/orders", label: "Orders", icon: Package },
  { href: "/collector/activity", label: "Activity", icon: History },
  { href: "/collector/profile", label: "Profile", icon: User },
];

export default function CollectorLayout({ children }: { children: React.ReactNode }) {
  return (
    <MobileShell navItems={navItems} title="EcoTrace Partner">
      {children}
    </MobileShell>
  );
}
