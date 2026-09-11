"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Navigation,
  MapPin,
  Camera,
  X,
  Mic,
  CheckCircle2,
  Locate,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { hashFile } from "@/lib/hash";
import type { Enums, Tables } from "@/types/database.types";

type PickupStatus = Enums<"pickup_status">;
import styles from "./PickupWorkflow.module.scss";

type Item = Tables<"pickup_items"> & { category: Tables<"waste_categories"> | null };

export function PickupWorkflow({
  pickup,
  address,
  items,
  assignment,
  collectionRecord,
  collectorId,
}: {
  pickup: Tables<"pickup_requests">;
  address: Tables<"addresses"> | null;
  items: Item[];
  assignment: Tables<"collector_assignments">;
  collectionRecord: Tables<"collection_records"> | null;
  collectorId: string;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [status, setStatus] = useState(pickup.status);
  const [otp, setOtp] = useState("");
  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<{ file: File; url: string }[]>([]);
  const [gps, setGps] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<"idle" | "loading" | "ok" | "denied">("idle");
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  async function transitionTo(next: PickupStatus) {
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.from("pickup_requests").update({ status: next }).eq("id", pickup.id);
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    setStatus(next);
    if (next === "ARRIVED") captureGPS();
  }

  function captureGPS() {
    if (!("geolocation" in navigator)) {
      setGpsStatus("denied");
      return;
    }
    setGpsStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
        setGpsStatus("ok");
      },
      () => setGpsStatus("denied"),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  function onPhotosSelected(fileList: FileList | null) {
    if (!fileList) return;
    const next = Array.from(fileList).map((file) => ({ file, url: URL.createObjectURL(file) }));
    setPhotos((prev) => [...prev, ...next]);
  }

  function removePhoto(idx: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  }

  function startVoiceNote() {
    type SpeechRecognitionCtor = new () => {
      lang: string;
      interimResults: boolean;
      onresult: (e: { results: { transcript: string }[][] }) => void;
      onend: () => void;
      start: () => void;
    };
    const w = window as unknown as { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) {
      setError("Voice input isn't supported on this browser — please type notes instead.");
      return;
    }
    const recognition = new Ctor();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.onresult = (e) => {
      const transcript = e.results[0]?.[0]?.transcript ?? "";
      setNotes((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    recognition.onend = () => setListening(false);
    setListening(true);
    recognition.start();
  }

  const otpVerified = otp.length === 6 && otp === (assignment.otp_code ?? "");
  const canComplete = weight !== "" && Number(weight) > 0 && otpVerified;

  async function completePickup() {
    if (!canComplete) return;
    setBusy(true);
    setError(null);

    try {
      const nowIso = new Date().toISOString();
      const { data: record, error: crErr } = await supabase
        .from("collection_records")
        .insert({
          pickup_request_id: pickup.id,
          collector_id: collectorId,
          actual_weight_kg: Number(weight),
          otp_code: otp,
          otp_verified_at: otpVerified ? nowIso : null,
          gps_lat: gps?.lat ?? null,
          gps_lng: gps?.lng ?? null,
          gps_accuracy: gps?.accuracy ?? null,
          notes: notes || null,
          completed_at: nowIso,
        })
        .select()
        .single();

      if (crErr || !record) throw new Error(crErr?.message ?? "Could not save collection record");

      for (const p of photos) {
        const hash = await hashFile(p.file);
        const path = `${collectorId}/${pickup.id}/${crypto.randomUUID()}-${p.file.name}`;
        const { error: upErr } = await supabase.storage.from("collection-evidence").upload(path, p.file);
        if (upErr) throw new Error(upErr.message);

        const { error: evErr } = await supabase.from("collection_evidence").insert({
          collection_record_id: record.id,
          kind: "PHOTO",
          storage_path: path,
          file_hash: hash,
          file_size: p.file.size,
          mime_type: p.file.type,
          created_by: collectorId,
        });
        if (evErr) throw new Error(evErr.message);
      }

      router.push(`/journey/${pickup.collection_code}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setBusy(false);
    }
  }

  if (collectionRecord?.completed_at) {
    return (
      <div style={{ textAlign: "center", padding: "60px 16px" }}>
        <CheckCircle2 size={48} className="text-accent" />
        <h1 className="text-title2" style={{ marginTop: 16 }}>
          Pickup complete
        </h1>
        <p className="text-secondary text-body" style={{ marginTop: 8 }}>
          {pickup.collection_code} has been collected.
        </p>
        <a href={`/journey/${pickup.collection_code}`} className="btn btn-primary" style={{ marginTop: 20 }}>
          View journey
        </a>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.header}>
        <button className="icon-btn" onClick={() => router.back()} aria-label="Back">
          <ChevronLeft size={18} />
        </button>
        <h1 className="text-title2">{pickup.collection_code}</h1>
      </div>

      {error && (
        <div className="card" style={{ borderColor: "var(--danger)", marginBottom: 16 }}>
          <span className="text-danger text-callout">{error}</span>
        </div>
      )}

      <div className={`card ${styles.section}`}>
        <div className="row gap-2">
          <MapPin size={16} className="text-accent" />
          <span className="text-callout">
            {address ? [address.line1, address.city, address.state, address.pincode].filter(Boolean).join(", ") : "Address pending"}
          </span>
        </div>
        <div style={{ marginTop: 12 }}>
          {items.map((it) => (
            <div key={it.id} className="text-footnote">
              {it.category?.name} × {it.quantity} · {it.estimated_weight_kg}kg
            </div>
          ))}
        </div>
        {address && (
          <a
            href={
              address.lat != null && address.lng != null
                ? `https://www.google.com/maps/dir/?api=1&destination=${address.lat},${address.lng}`
                : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `${address.line1}, ${address.city}, ${address.state} ${address.pincode}`
                  )}`
            }
            target="_blank"
            rel="noreferrer"
            className="btn btn-outline btn-sm"
            style={{ marginTop: 12 }}
          >
            <Navigation size={14} /> Navigate
          </a>
        )}
      </div>

      {status === "COLLECTOR_ACCEPTED" && (
        <button className="btn btn-primary btn-block" disabled={busy} onClick={() => transitionTo("EN_ROUTE")}>
          Start trip
        </button>
      )}

      {status === "EN_ROUTE" && (
        <button className="btn btn-primary btn-block" disabled={busy} onClick={() => transitionTo("ARRIVED")}>
          I&apos;ve arrived
        </button>
      )}

      {status === "ARRIVED" && (
        <>
          <div className={`card ${styles.section}`}>
            <h2 className="text-title3" style={{ marginBottom: 8 }}>
              OTP verification
            </h2>
            <p className="text-footnote" style={{ marginBottom: 12 }}>
              Ask the citizen for their 6-digit pickup code.
            </p>
            <div className={styles.otpRow}>
              <input
                className="input"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="••••••"
              />
            </div>
            {otp.length === 6 && (
              <p className={otpVerified ? "text-accent text-footnote" : "text-danger text-footnote"} style={{ marginTop: 8 }}>
                {otpVerified ? "OTP verified" : "Incorrect code"}
              </p>
            )}
          </div>

          <div className={`card ${styles.section}`}>
            <h2 className="text-title3" style={{ marginBottom: 8 }}>
              Weight
            </h2>
            <input
              type="number"
              step={0.1}
              min={0}
              className="input"
              placeholder="Actual weight (kg)"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </div>

          <div className={`card ${styles.section}`}>
            <h2 className="text-title3">Photo evidence</h2>
            <div className={styles.photoGrid}>
              {photos.map((p, idx) => (
                <div key={idx} className={styles.photoTile}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt="Evidence" />
                  <button className={styles.photoRemove} onClick={() => removePhoto(idx)} aria-label="Remove photo">
                    <X size={12} />
                  </button>
                </div>
              ))}
              <div className={styles.photoAdd} onClick={() => fileInputRef.current?.click()}>
                <Camera size={20} />
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              hidden
              onChange={(e) => onPhotosSelected(e.target.files)}
            />
          </div>

          <div className={`card ${styles.section}`}>
            <h2 className="text-title3" style={{ marginBottom: 8 }}>
              GPS location
            </h2>
            <div className={styles.gpsRow}>
              <Locate size={16} className={gpsStatus === "ok" ? "text-accent" : "text-secondary"} />
              <span className="text-footnote">
                {gpsStatus === "idle" && "Not captured yet"}
                {gpsStatus === "loading" && "Locating…"}
                {gpsStatus === "ok" && `Captured (±${Math.round(gps?.accuracy ?? 0)}m)`}
                {gpsStatus === "denied" && "GPS unavailable — pickup may require additional review"}
              </span>
              <button className="btn btn-ghost btn-sm" style={{ marginLeft: "auto" }} onClick={captureGPS}>
                {gpsStatus === "ok" ? "Retry" : "Capture"}
              </button>
            </div>
          </div>

          <div className={`card ${styles.section}`}>
            <div className="row spread" style={{ marginBottom: 8 }}>
              <h2 className="text-title3">Notes</h2>
              <button className="icon-btn" onClick={startVoiceNote} aria-label="Voice note">
                <Mic size={15} color={listening ? "var(--danger)" : undefined} />
              </button>
            </div>
            <textarea
              className="textarea"
              placeholder="Optional notes about the pickup"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <button className="btn btn-primary btn-block" disabled={!canComplete || busy} onClick={completePickup}>
            {busy ? "Completing…" : "Complete pickup"}
          </button>
        </>
      )}
    </div>
  );
}
