import Link from "next/link";
import { ChevronRight, Wallet, Clock, PackageSearch } from "lucide-react";
import { requireRole } from "@/lib/data/profile";
import { CategoryIcon } from "@/components/CategoryIcon";
import { StatusBadge } from "@/components/StatusBadge";
import { isTerminal } from "@/lib/status";
import { RealtimeRefresher } from "@/components/RealtimeRefresher";
import styles from "./page.module.scss";

export default async function CitizenHomePage() {
  const { supabase, user, profile } = await requireRole("CITIZEN");

  const [{ data: categories }, { data: pickups }, { data: wallet }] = await Promise.all([
    supabase.from("waste_categories").select("*").order("sort_order"),
    supabase
      .from("pickup_requests")
      .select("*")
      .eq("citizen_id", user.id)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase.from("wallets").select("*").eq("owner_id", user.id).single(),
  ]);

  const activePickup = (pickups ?? []).find((p) => !isTerminal(p.status));
  const recentPickups = (pickups ?? []).slice(0, 4);
  const firstName = profile.full_name.split(" ")[0];

  return (
    <div>
      <RealtimeRefresher channelName={`citizen-home-${user.id}`} tables={["pickup_requests"]} filters={{ pickup_requests: `citizen_id=eq.${user.id}` }} />
      <div className={styles.hero}>
        <p className="text-secondary text-body">Good to see you,</p>
        <h1 className="text-title1">{firstName}</h1>
      </div>

      {activePickup && (
        <Link href={`/citizen/pickups/${activePickup.id}`} className={styles.activeBanner}>
          <span className="row spread">
            <span className="text-caption" style={{ color: "rgba(255,255,255,0.85)" }}>
              Active pickup · {activePickup.collection_code}
            </span>
            <ChevronRight size={18} />
          </span>
          <span className="text-title3">Track your pickup</span>
          <span className="text-footnote" style={{ color: "rgba(255,255,255,0.85)" }}>
            Tap to see live status
          </span>
        </Link>
      )}

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className="text-title3">What would you like to recycle?</h2>
        </div>
        <div className={styles.categoryGrid}>
          {(categories ?? []).map((c) => (
            <Link key={c.id} href={`/citizen/pickups/new?category=${c.id}`} className={styles.categoryTile}>
              <span className={styles.categoryIcon}>
                <CategoryIcon icon={c.icon} />
              </span>
              <span className={styles.categoryLabel}>{c.name}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.quickLinks}>
          <Link href="/citizen/wallet" className={`card card-interactive ${styles.quickLink}`}>
            <Wallet size={20} className="text-accent" />
            <span className="stack">
              <span className="text-callout">EcoWallet</span>
              <span className="text-footnote">₹{wallet?.balance ?? 0}</span>
            </span>
          </Link>
          <Link href="/citizen/pickups" className={`card card-interactive ${styles.quickLink}`}>
            <Clock size={20} className="text-accent" />
            <span className="stack">
              <span className="text-callout">All pickups</span>
              <span className="text-footnote">{pickups?.length ?? 0} total</span>
            </span>
          </Link>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className="text-title3">Recent pickups</h2>
          <Link href="/citizen/pickups" className="btn-ghost text-callout">
            See all
          </Link>
        </div>
        <div className="card">
          {recentPickups.length === 0 ? (
            <div className={styles.emptyState}>
              <PackageSearch size={28} className="text-tertiary" />
              <p className="text-body" style={{ marginTop: 8 }}>
                No pickups yet. Schedule your first one above.
              </p>
            </div>
          ) : (
            recentPickups.map((p) => (
              <Link key={p.id} href={`/citizen/pickups/${p.id}`} className={styles.pickupRow}>
                <span className="stack gap-1">
                  <span className="text-callout">{p.collection_code}</span>
                  <span className="text-footnote">{new Date(p.created_at).toLocaleDateString()}</span>
                </span>
                <StatusBadge status={p.status} />
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
