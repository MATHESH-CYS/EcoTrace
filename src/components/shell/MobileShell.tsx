"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Leaf, type LucideIcon } from "lucide-react";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import styles from "./MobileShell.module.scss";

export type NavItem = { href: string; label: string; icon: LucideIcon };

export function MobileShell({
  children,
  navItems,
  title,
}: {
  children: React.ReactNode;
  navItems: NavItem[];
  title: string;
}) {
  const pathname = usePathname();

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <span className={styles.brand}>
          <Leaf size={18} />
          {title}
        </span>
        <span className="row gap-2" style={{ alignItems: "center" }}>
          <ThemeToggle />
          <SignOutButton variant="icon" />
        </span>
      </header>

      <main className={styles.main}>{children}</main>

      <nav className={styles.bottomNav}>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/citizen" && href !== "/collector" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}
            >
              <Icon size={20} strokeWidth={active ? 2.4 : 1.8} />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

