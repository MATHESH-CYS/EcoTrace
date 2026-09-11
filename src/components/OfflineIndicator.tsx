"use client";

import { useOfflineSync } from "@/lib/offline/useOfflineSync";
import { WifiOff, RefreshCw } from "lucide-react";

export function OfflineIndicator() {
  const { isOnline, isSyncing, pendingCount, syncNow } = useOfflineSync();

  if (isOnline && pendingCount === 0 && !isSyncing) {
    return null;
  }

  return (
    <div
      role="status"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        padding: "6px 16px",
        fontSize: "0.8rem",
        fontWeight: 500,
        color: "#ffffff",
        background: !isOnline ? "var(--accent-orange, #f59e0b)" : "var(--accent-green, #10b981)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        transition: "all 0.3s ease",
      }}
    >
      {!isOnline ? (
        <>
          <WifiOff size={15} />
          <span>Offline mode — actions are queued locally in IndexedDB</span>
          {pendingCount > 0 && (
            <span style={{ opacity: 0.9 }}>({pendingCount} pending)</span>
          )}
        </>
      ) : isSyncing ? (
        <>
          <RefreshCw size={15} className="spin" />
          <span>Synchronizing offline changes with EcoTrace server…</span>
        </>
      ) : pendingCount > 0 ? (
        <>
          <span>{pendingCount} offline action(s) ready to sync</span>
          <button
            onClick={syncNow}
            style={{
              background: "rgba(255,255,255,0.25)",
              border: "none",
              borderRadius: 4,
              padding: "2px 8px",
              color: "#fff",
              cursor: "pointer",
              fontSize: "0.75rem",
              fontWeight: 600,
            }}
          >
            Sync now
          </button>
        </>
      ) : null}
    </div>
  );
}
