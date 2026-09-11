"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Leaf, type LucideIcon } from "lucide-react";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import styles from "./DesktopShell.module.scss";

export type NavItem = { href: string; label: string; icon: LucideIcon };

export function DesktopShell({
  children,
  navItems,
  title,
  subtitle,
  pageTitle,
}: {
  children: React.ReactNode;
  navItems: NavItem[];
  title: string;
  subtitle?: string;
  pageTitle: string;
}) {
  const pathname = usePathname();

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <span className={styles.brand}>
          <Leaf size={20} />
          EcoTrace
        </span>
        {subtitle && (
          <div className={styles.orgTag}>
            <div className="text-caption">{title}</div>
            <div className="text-footnote">{subtitle}</div>
          </div>
        )}

        <nav className={styles.nav}>
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== navItems[0].href && pathname.startsWith(href + "/"));
            return (
              <Link
                key={href}
                href={href}
                className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}
              >
                <Icon size={17} strokeWidth={active ? 2.3 : 1.8} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className={styles.footer}>
          <SignOutButton className={styles.navItem} />
        </div>
      </aside>

      <div className={styles.content}>
        <div className={styles.mobileTopbar}>
          <span className={styles.brand}>
            <Leaf size={18} />
            EcoTrace
          </span>
          <span className="row gap-2" style={{ alignItems: "center" }}>
            <ThemeToggle />
            <SignOutButton variant="icon" />
          </span>
        </div>
        <header className={styles.topbar}>
          <h1 className="text-title2">{pageTitle}</h1>
          <span className="row gap-2" style={{ alignItems: "center" }}>
            <ThemeToggle />
          </span>
        </header>
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}

