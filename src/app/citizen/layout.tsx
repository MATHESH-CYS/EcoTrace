"use client";

import { Home, Package, Wallet, User } from "lucide-react";
import { MobileShell, type NavItem } from "@/components/shell/MobileShell";

const navItems: NavItem[] = [
  { href: "/citizen", label: "Home", icon: Home },
  { href: "/citizen/pickups", label: "Pickups", icon: Package },
  { href: "/citizen/wallet", label: "Wallet", icon: Wallet },
  { href: "/citizen/profile", label: "Profile", icon: User },
];

export default function CitizenLayout({ children }: { children: React.ReactNode }) {
  return (
    <MobileShell navItems={navItems} title="EcoTrace">
      {children}
    </MobileShell>
  );
}
