"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Clock,
  Package,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Zap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { startAlertLoop, stopAlert } from "@/lib/audio/alertSound";
import type { Tables } from "@/types/database.types";

export type IncomingPickup = Tables<"pickup_requests"> & {
  address?: Tables<"addresses"> | null;
  items?: (Tables<"pickup_items"> & { category?: Tables<"waste_categories"> | null })[];
};

type Props = {
  pickup: IncomingPickup;
  collectorId: string;
  onDismiss: () => void;
};

const COUNTDOWN_SECONDS = 30;

export function IncomingPickupModal({ pickup, collectorId, onDismiss }: Props) {
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState<number>(COUNTDOWN_SECONDS);
  const [accepting, setAccepting] = useState<boolean>(false);
  const [conflictError, setConflictError] = useState<string | null>(null);
  const audioStartedRef = useRef(false);

  // Play the incoming-alert chime in a loop while this modal is open
  useEffect(() => {
    if (!audioStartedRef.current) {
      audioStartedRef.current = true;
      startAlertLoop();
    }
    return () => {
      stopAlert();
    };
  }, []);

  // 30s Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          stopAlert();
          onDismiss();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onDismiss]);

  const estimatedEarnings = Math.round((pickup.estimated_weight_kg ?? 3) * 15 + 60);
  const addressText = pickup.address
    ? `${pickup.address.line1 ? pickup.address.line1 + ", " : ""}${pickup.address.city}, ${pickup.address.pincode}`
    : "Nearby community doorstep";

  const progressPercent = (secondsLeft / COUNTDOWN_SECONDS) * 100;

  async function handleAccept() {
    setAccepting(true);
    setConflictError(null);
    stopAlert();
    const supabase = createClient();

    try {
      // 1. Check Collision: Make sure order is still available
      const { data: current, error: checkErr } = await supabase
        .from("pickup_requests")
        .select("status")
        .eq("id", pickup.id)
        .single();

      if (checkErr || !current) {
        throw new Error("Unable to verify order availability.");
      }

      if (current.status !== "REQUESTED" && current.status !== "ASSIGNED") {
        setConflictError("Collision prevented: This order was just accepted by another nearby collector!");
        setAccepting(false);
        setTimeout(() => {
          onDismiss();
          router.refresh();
        }, 2200);
        return;
      }

      // 2. Lock status to COLLECTOR_ACCEPTED
      const { error: lockErr } = await supabase
        .from("pickup_requests")
        .update({ status: "COLLECTOR_ACCEPTED" })
        .eq("id", pickup.id);

      if (lockErr) throw new Error(lockErr.message);

      // 3. Record assignment
      const { data: existingAssignment } = await supabase
        .from("collector_assignments")
        .select("id")
        .eq("pickup_request_id", pickup.id)
        .maybeSingle();

      if (existingAssignment) {
        await supabase
          .from("collector_assignments")
          .update({
            collector_id: collectorId,
            status: "ACCEPTED",
            responded_at: new Date().toISOString(),
          })
          .eq("id", existingAssignment.id);
      } else {
        await supabase.from("collector_assignments").insert({
          pickup_request_id: pickup.id,
          collector_id: collectorId,
          status: "ACCEPTED",
          assigned_at: new Date().toISOString(),
          responded_at: new Date().toISOString(),
        });
      }

      // 4. Success -> Route immediately to the live pickup job
      router.push(`/collector/orders/${pickup.id}`);
    } catch (err: unknown) {
      setConflictError(err instanceof Error ? err.message : "Failed to accept order.");
      setAccepting(false);
    }
  }

  function handlePass() {
    stopAlert();
    onDismiss();
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "rgba(0, 0, 0, 0.78)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        animation: "radarFadeIn 0.25s ease-out",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          background: "var(--bg-elevated)",
          borderRadius: "24px",
          border: "2.5px solid var(--accent)",
          boxShadow: "0 12px 48px rgba(16, 185, 129, 0.35)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          animation: "radarSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Urgent Progress Timer Bar */}
        <div style={{ height: "6px", width: "100%", background: "rgba(255, 255, 255, 0.12)" }}>
          <div
            style={{
              height: "100%",
              width: `${progressPercent}%`,
              background: progressPercent > 30 ? "var(--accent)" : "var(--danger)",
              transition: "width 1s linear, background 0.5s ease",
            }}
          />
        </div>

        {/* Header Alert Ribbon */}
        <div
          style={{
            background: "linear-gradient(90deg, #10b981, #059669)",
            color: "#ffffff",
            padding: "12px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 800, fontSize: "14px", letterSpacing: "0.05em", textTransform: "uppercase" }}>
            <Zap size={18} /> COMMUNITY RADAR · NEW PICKUP
          </div>
          <div
            style={{
              background: "rgba(0,0,0,0.3)",
              padding: "4px 10px",
              borderRadius: "999px",
              fontSize: "13px",
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <Clock size={14} /> {secondsLeft}s
          </div>
        </div>

        {/* Body Content */}
        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {conflictError && (
            <div
              style={{
                background: "var(--danger-soft)",
                color: "var(--danger)",
                padding: "12px 14px",
                borderRadius: "12px",
                fontSize: "13px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <AlertTriangle size={18} /> {conflictError}
            </div>
          )}

          {/* Earnings Spotlight Card */}
          <div
            style={{
              background: "var(--bg-sunken)",
              border: "1.5px dashed var(--accent)",
              borderRadius: "16px",
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontSize: "12px", textTransform: "uppercase", fontWeight: 700, color: "var(--text-secondary)" }}>
                Est. Collector Payout
              </div>
              <div style={{ fontSize: "28px", fontWeight: 900, color: "var(--accent)" }}>
                ₹{estimatedEarnings}
              </div>
            </div>
            <div
              style={{
                background: "var(--accent-soft)",
                color: "var(--accent)",
                padding: "6px 12px",
                borderRadius: "999px",
                fontSize: "12px",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Sparkles size={14} /> High Demand
            </div>
          </div>

          {/* Location & Distance Details */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: "var(--accent-soft)",
                  color: "var(--accent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginTop: "2px",
                }}
              >
                <MapPin size={18} />
              </div>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
                  {addressText}
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                  📍 ~1.4 km from your current radar location
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: "var(--bg-sunken)",
                  color: "var(--text-secondary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Package size={18} />
              </div>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                  E-Waste Pickup · {pickup.estimated_weight_kg ? `${pickup.estimated_weight_kg} kg est.` : "Standard weight"}
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                  Scheduled: {pickup.scheduled_date ? new Date(pickup.scheduled_date).toLocaleDateString() : "Today"} ({pickup.scheduled_slot ?? "Immediate"})
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "6px" }}>
            <button
              type="button"
              onClick={handleAccept}
              disabled={accepting}
              className="btn btn-primary btn-block"
              style={{
                height: "54px",
                fontSize: "17px",
                fontWeight: 800,
                letterSpacing: "0.02em",
                borderRadius: "14px",
                boxShadow: "0 6px 20px rgba(16, 185, 129, 0.45)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <CheckCircle2 size={20} />
              {accepting ? "Locking & Dispatching…" : "ACCEPT PICKUP ORDER"}
            </button>

            <button
              type="button"
              onClick={handlePass}
              className="btn btn-secondary btn-block"
              style={{
                height: "44px",
                fontSize: "14px",
                fontWeight: 600,
                borderRadius: "12px",
              }}
            >
              Pass to next collector
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
