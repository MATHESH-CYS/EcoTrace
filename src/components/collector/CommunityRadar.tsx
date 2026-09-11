"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Radio, WifiOff, BellRing } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { playAlertChime } from "@/lib/audio/alertSound";
import { IncomingPickupModal, type IncomingPickup } from "./IncomingPickupModal";

type Props = {
  collectorId: string;
  isOnline: boolean;
};

export function CommunityRadar({ collectorId, isOnline }: Props) {
  const router = useRouter();
  const [activeAlert, setActiveAlert] = useState<IncomingPickup | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const audioUnlockedRef = useRef<boolean>(false);

  // Unlock browser audio context on first interaction
  const unlockAudio = useCallback(() => {
    if (!audioUnlockedRef.current) {
      audioUnlockedRef.current = true;
      playAlertChime();
    }
  }, []);

  // Request browser desktop notification permission
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission().catch(() => {});
      }
    }
  }, []);

  // Realtime & High-Frequency Polling Listener for Incoming Pickups
  useEffect(() => {
    if (!isOnline) {
      return;
    }

    const supabase = createClient();
    let isCancelled = false;

    async function checkForAvailablePickups() {
      if (isCancelled) return;
      try {
        const { data: available, error } = await supabase
          .from("pickup_requests")
          .select("*, address:addresses(*)")
          .eq("status", "REQUESTED")
          .order("created_at", { ascending: false })
          .limit(3);

        if (error || !available || available.length === 0) {
          return;
        }

        // Find the most recent pickup that hasn't been dismissed
        const candidate = available.find((p) => !dismissedIds.has(p.id));

        if (candidate && !activeAlert) {
          setActiveAlert(candidate as IncomingPickup);

          // Desktop push notification
          if (
            typeof window !== "undefined" &&
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            try {
              new Notification("🚨 Community Radar: New Pickup Request!", {
                body: `Nearby e-waste pickup at ${candidate.address?.city ?? "your area"} (~${candidate.estimated_weight_kg ?? 3} kg). Tap to claim!`,
                icon: "/icons/icon.svg",
              });
            } catch {}
          }
        }
      } catch {}
    }

    // Check immediately
    checkForAvailablePickups();

    // High frequency 3-second polling interval while online
    const interval = setInterval(checkForAvailablePickups, 3000);

    // Supabase Realtime channel subscription
    const channel = supabase
      .channel(`community-radar-${collectorId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pickup_requests",
        },
        () => {
          checkForAvailablePickups();
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      isCancelled = true;
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [isOnline, collectorId, dismissedIds, activeAlert, router]);

  function handleDismiss() {
    if (activeAlert) {
      setDismissedIds((prev) => new Set([...prev, activeAlert.id]));
      setActiveAlert(null);
    }
  }

  function handleTestAlert() {
    unlockAudio();
    const demoPickup: IncomingPickup = {
      id: "demo-" + Date.now(),
      collection_code: "EW-2026-" + Math.floor(100000 + Math.random() * 900000),
      citizen_id: "demo-citizen",
      created_by: "demo-citizen",
      address_id: "demo-address",
      aggregator_org_id: null,
      status: "REQUESTED",
      scheduled_date: new Date().toISOString().split("T")[0],
      scheduled_slot: "Immediate",
      payment_preference: "WALLET",
      notes: "Doorstep e-waste pickup (Laptop & Accessories)",
      estimated_weight_kg: 4.5,
      estimated_value_min: 180,
      estimated_value_max: 240,
      locked_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      address: {
        id: "demo-address",
        citizen_id: "demo-citizen",
        label: "Home",
        line1: "12th Main, 4th Cross, Indiranagar",
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560038",
        lat: null,
        lng: null,
        line2: null,
        is_default: true,
        created_at: new Date().toISOString(),
      },
    };
    setActiveAlert(demoPickup);
  }

  return (
    <>
      {/* Active incoming-order modal */}
      {activeAlert && (
        <IncomingPickupModal
          pickup={activeAlert}
          collectorId={collectorId}
          onDismiss={handleDismiss}
        />
      )}

      {/* Community Radar dashboard card */}
      <div
        className="card"
        style={{
          marginBottom: 20,
          background: isOnline
            ? "linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(5, 150, 105, 0.04))"
            : "rgba(245, 158, 11, 0.08)",
          borderColor: isOnline ? "var(--accent)" : "var(--accent-orange, #f59e0b)",
          borderWidth: "1.5px",
          padding: "16px 20px",
          boxShadow: isOnline ? "0 4px 20px rgba(16, 185, 129, 0.15)" : "none",
        }}
      >
        <div className="row spread wrap" style={{ alignItems: "center", gap: 12 }}>
          <div className="row gap-3" style={{ alignItems: "center" }}>
            {isOnline ? (
              <div style={{ position: "relative", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span
                  style={{
                    position: "absolute",
                    inset: -4,
                    borderRadius: "50%",
                    border: "2px solid var(--accent)",
                    animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                    opacity: 0.6,
                  }}
                />
                <Radio size={22} className="text-accent" />
              </div>
            ) : (
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(245, 158, 11, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <WifiOff size={18} style={{ color: "var(--accent-orange, #f59e0b)" }} />
              </div>
            )}
            <div>
              <div className="row gap-2" style={{ alignItems: "center" }}>
                <span className="text-callout" style={{ fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  {isOnline ? "Community Radar" : "Community Radar: Offline"}
                </span>
                {isOnline && (
                  <span className="badge badge-success" style={{ fontSize: 10, padding: "2px 8px" }}>
                    LIVE ACTIVE
                  </span>
                )}
              </div>
              <div className="text-footnote text-secondary" style={{ marginTop: 2 }}>
                {isOnline
                  ? "Scanning within 5 km for doorstep citizen e-waste pickups. Audio & visual alerts enabled."
                  : "Go Online above to start receiving instant incoming pickup alerts."}
              </div>
            </div>
          </div>

          {/* Quick Actions / Audio Test Button */}
          {isOnline && (
            <div className="row gap-2" style={{ alignItems: "center" }}>
              <button
                type="button"
                onClick={handleTestAlert}
                className="btn btn-outline btn-sm"
                style={{
                  borderColor: "var(--accent)",
                  color: "var(--accent)",
                  fontWeight: 700,
                  fontSize: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  borderRadius: "999px",
                  padding: "6px 14px",
                }}
                title="Test the Community Radar alert chime and incoming order modal"
              >
                <BellRing size={14} /> Test Alert
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
