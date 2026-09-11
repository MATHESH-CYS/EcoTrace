"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Plus, Trash2, MapPin, Check, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { CategoryIcon } from "@/components/CategoryIcon";
import { AddressMapPicker } from "@/components/citizen/AddressMapPicker";
import { estimateItemValue, sumEstimates, type Condition } from "@/lib/pricing";
import type { Tables } from "@/types/database.types";
import styles from "./NewPickupFlow.module.scss";

type Category = Tables<"waste_categories">;
type Address = Tables<"addresses">;

type CartItem = {
  tempId: string;
  category_id: string;
  brand: string;
  model: string;
  condition: Condition;
  quantity: number;
  estimated_weight_kg: number;
  description: string;
};

const SLOTS = ["9:00 AM – 11:00 AM", "11:00 AM – 1:00 PM", "2:00 PM – 4:00 PM", "4:00 PM – 6:00 PM"];
const WEIGHT_PRESETS = [0.5, 1, 2, 5, 10];

function emptyDraft(categoryId: string): CartItem {
  return {
    tempId: crypto.randomUUID(),
    category_id: categoryId,
    brand: "",
    model: "",
    condition: "WORKING",
    quantity: 1,
    estimated_weight_kg: 1,
    description: "",
  };
}

export function NewPickupFlow({
  categories,
  addresses,
  initialCategoryId,
}: {
  categories: Category[];
  addresses: Address[];
  initialCategoryId: string | null;
}) {
  const router = useRouter();
  const defaultCatId = initialCategoryId || categories[0]?.id || "";

  const [items, setItems] = useState<CartItem[]>([]);
  const [draft, setDraft] = useState<CartItem | null>(() => emptyDraft(defaultCatId));
  const [weightText, setWeightText] = useState<string>("1");
  const [draftError, setDraftError] = useState<string | null>(null);

  const [addressId, setAddressId] = useState<string | null>(
    addresses.find((a) => a.is_default)?.id ?? addresses[0]?.id ?? null
  );
  const [showNewAddress, setShowNewAddress] = useState(addresses.length === 0);
  const [newAddress, setNewAddress] = useState({ label: "Home", line1: "", city: "", state: "", pincode: "" });
  const [pickedLatLng, setPickedLatLng] = useState<{ lat: number; lng: number } | null>(null);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledSlot, setScheduledSlot] = useState(SLOTS[0]);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  // Combine items and any active valid draft for total estimate display
  const effectiveItems = useMemo(() => {
    if (items.length > 0) return items;
    if (draft && draft.estimated_weight_kg > 0) return [draft];
    return [];
  }, [items, draft]);

  const estimate = useMemo(() => {
    const perItem = effectiveItems.map((it) => {
      const cat = categoryById.get(it.category_id);
      return estimateItemValue(cat?.base_price_per_kg ?? 0, it.estimated_weight_kg, it.condition, it.quantity);
    });
    return sumEstimates(perItem);
  }, [effectiveItems, categoryById]);

  function handleWeightChange(val: string) {
    // Only allow numbers and a single decimal point
    const cleaned = val.replace(/[^0-9.]/g, "");
    // Prevent multiple decimal points
    const parts = cleaned.split(".");
    const formatted = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join("")}` : cleaned;
    setWeightText(formatted);

    const num = parseFloat(formatted);
    if (!isNaN(num) && num > 0 && draft) {
      setDraft({ ...draft, estimated_weight_kg: num });
      setDraftError(null);
    }
  }

  function handlePresetSelect(w: number) {
    setWeightText(String(w));
    if (draft) {
      setDraft({ ...draft, estimated_weight_kg: w });
      setDraftError(null);
    }
  }

  function addDraftToCart() {
    if (!draft) return;
    const w = parseFloat(weightText);
    if (isNaN(w) || w <= 0) {
      setDraftError("Please enter a valid weight in kg (e.g. 1.5)");
      return;
    }

    const itemToAdd: CartItem = {
      ...draft,
      estimated_weight_kg: w,
      tempId: crypto.randomUUID(),
    };

    setItems((prev) => [...prev, itemToAdd]);
    setDraft(null);
    setDraftError(null);
  }

  function removeItem(tempId: string) {
    setItems((prev) => prev.filter((it) => it.tempId !== tempId));
  }

  function openNewDraft() {
    setDraft(emptyDraft(categories[0]?.id ?? ""));
    setWeightText("1");
    setDraftError(null);
  }

  const hasItems = items.length > 0 || (draft !== null && parseFloat(weightText) > 0);
  const hasAddress = Boolean(
    addressId || (showNewAddress && newAddress.line1.trim() && newAddress.city.trim() && newAddress.pincode.trim())
  );
  const hasDate = Boolean(scheduledDate);

  const canSubmit = hasItems && hasAddress && hasDate;

  async function handleSubmit() {
    if (submitting) return;

    // If citizen hasn't clicked "Add item to list" but filled out draft, auto-bundle it
    const submissionItems = [...items];
    if (draft) {
      const w = parseFloat(weightText);
      if (!isNaN(w) && w > 0) {
        submissionItems.push({
          ...draft,
          estimated_weight_kg: w,
        });
      }
    }

    if (submissionItems.length === 0) {
      setError("Please add at least one item with estimated weight.");
      return;
    }
    if (!hasAddress) {
      setError("Please choose or enter a valid pickup address.");
      return;
    }
    if (!hasDate) {
      setError("Please pick a scheduled pickup date.");
      return;
    }

    setSubmitting(true);
    setError(null);
    const supabase = createClient();

    try {
      let finalAddressId = addressId;

      if (showNewAddress) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Not signed in");

        const { data: addr, error: addrErr } = await supabase
          .from("addresses")
          .insert({
            citizen_id: user.id,
            label: newAddress.label || "Home",
            line1: newAddress.line1,
            city: newAddress.city,
            state: newAddress.state,
            pincode: newAddress.pincode,
            is_default: addresses.length === 0,
            lat: pickedLatLng?.lat ?? null,
            lng: pickedLatLng?.lng ?? null,
          })
          .select()
          .single();

        if (addrErr || !addr) throw new Error(addrErr?.message ?? "Could not save address");
        finalAddressId = addr.id;
      }

      const { data: pickupId, error: rpcErr } = await supabase.rpc("create_pickup_request", {
        p_address_id: finalAddressId!,
        p_scheduled_date: scheduledDate,
        p_scheduled_slot: scheduledSlot,
        p_payment_preference: "WALLET",
        p_notes: notes || null,
        p_items: submissionItems.map((it) => ({
          category_id: it.category_id,
          brand: it.brand,
          model: it.model,
          condition: it.condition,
          quantity: it.quantity,
          estimated_weight_kg: it.estimated_weight_kg,
          description: it.description,
        })),
      });

      if (rpcErr || !pickupId) throw new Error(rpcErr?.message ?? "Could not schedule pickup");

      router.push(`/citizen/pickups/${pickupId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className={styles.header}>
        <button className="icon-btn" onClick={() => router.back()} aria-label="Back">
          <ChevronLeft size={18} />
        </button>
        <h1 className="text-title2">Schedule e-waste pickup</h1>
      </div>

      {error && (
        <div className="card" style={{ borderColor: "var(--danger)", marginBottom: 16, background: "rgba(239, 68, 68, 0.08)" }}>
          <div className="row gap-2" style={{ alignItems: "center" }}>
            <AlertCircle size={18} className="text-danger" />
            <span className="text-danger text-callout">{error}</span>
          </div>
        </div>
      )}

      {/* Step 1: Items */}
      <div className={styles.section}>
        <div className="row spread" style={{ marginBottom: 10, alignItems: "center" }}>
          <h2 className={`text-title3 ${styles.sectionTitle}`} style={{ margin: 0 }}>
            1. Waste items ({items.length})
          </h2>
          {items.length > 0 && !draft && (
            <button className="btn btn-outline btn-sm" onClick={openNewDraft} type="button">
              <Plus size={14} /> Add another
            </button>
          )}
        </div>

        <div className="card">
          {items.map((it) => {
            const cat = categoryById.get(it.category_id);
            const est = estimateItemValue(cat?.base_price_per_kg ?? 0, it.estimated_weight_kg, it.condition, it.quantity);
            return (
              <div key={it.tempId} className={styles.itemCard}>
                <span className={styles.itemIcon}>
                  <CategoryIcon icon={cat?.icon ?? null} size={18} />
                </span>
                <span className={styles.itemMeta}>
                  <div className="text-callout">
                    {cat?.name} {it.quantity > 1 ? `× ${it.quantity}` : ""}
                  </div>
                  <div className="text-footnote">
                    {it.brand ? `${it.brand} ${it.model || ""}` : "Unspecified brand"} · {it.estimated_weight_kg} kg · {it.condition.replace("_", " ").toLowerCase()}
                  </div>
                </span>
                <span className="text-callout text-accent">₹{est.min}–{est.max}</span>
                <button className="icon-btn" onClick={() => removeItem(it.tempId)} aria-label="Remove item" type="button">
                  <Trash2 size={15} />
                </button>
              </div>
            );
          })}

          {draft && (
            <div className={styles.addItemForm}>
              <div className="field">
                <label>E-waste category</label>
                <select
                  className="select"
                  value={draft.category_id}
                  onChange={(e) => setDraft({ ...draft, category_id: e.target.value })}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (₹{c.base_price_per_kg}/kg)
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formRow}>
                <div className="field">
                  <label>Brand (optional)</label>
                  <input
                    className="input"
                    placeholder="e.g. Dell, Apple, Samsung"
                    value={draft.brand}
                    onChange={(e) => setDraft({ ...draft, brand: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Model / Variant (optional)</label>
                  <input
                    className="input"
                    placeholder="e.g. Inspiron 15"
                    value={draft.model}
                    onChange={(e) => setDraft({ ...draft, model: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className="field">
                  <label>Working condition</label>
                  <select
                    className="select"
                    value={draft.condition}
                    onChange={(e) => setDraft({ ...draft, condition: e.target.value as Condition })}
                  >
                    <option value="WORKING">Working (Best value)</option>
                    <option value="NOT_WORKING">Not working / Defective</option>
                    <option value="DAMAGED">Physically broken / Damaged</option>
                  </select>
                </div>
                <div className="field">
                  <label>Quantity (units)</label>
                  <input
                    type="number"
                    min={1}
                    className="input"
                    value={draft.quantity}
                    onChange={(e) => setDraft({ ...draft, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                  />
                </div>
              </div>

              {/* Clean Manual Weight Entry */}
              <div className="field">
                <div className="row spread" style={{ marginBottom: 6 }}>
                  <label htmlFor="manualWeightInput">Approx. weight (kg)</label>
                  <span className="text-footnote text-secondary">Manual entry — no mouse wheel scroll</span>
                </div>

                {/* Preset Quick Chips */}
                <div className="row gap-2 wrap" style={{ marginBottom: 10 }}>
                  {WEIGHT_PRESETS.map((p) => {
                    const active = parseFloat(weightText) === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        className={`btn btn-sm ${active ? "btn-primary" : "btn-outline"}`}
                        style={{ padding: "4px 10px", fontSize: "0.8rem", borderRadius: "16px" }}
                        onClick={() => handlePresetSelect(p)}
                      >
                        {p} kg
                      </button>
                    );
                  })}
                </div>

                <input
                  id="manualWeightInput"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  className="input"
                  placeholder="Type weight in kg (e.g. 2.5)"
                  value={weightText}
                  onChange={(e) => handleWeightChange(e.target.value)}
                />
                {draftError && <span className="text-danger text-footnote" style={{ marginTop: 4 }}>{draftError}</span>}
              </div>

              <div className="row gap-2" style={{ marginTop: 8 }}>
                {items.length > 0 && (
                  <button className="btn btn-secondary btn-sm" onClick={() => setDraft(null)} type="button">
                    Cancel
                  </button>
                )}
                <button
                  className="btn btn-primary btn-sm"
                  onClick={addDraftToCart}
                  type="button"
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  <Check size={14} /> Add item to list
                </button>
              </div>
            </div>
          )}

          {!draft && items.length === 0 && (
            <button className="btn btn-outline btn-block" onClick={openNewDraft} type="button">
              <Plus size={16} /> Add first item
            </button>
          )}
        </div>
      </div>

      {/* Step 2: Address */}
      <div className={styles.section}>
        <h2 className={`text-title3 ${styles.sectionTitle}`}>2. Pickup address</h2>
        <div className="stack gap-3">
          {addresses.map((a) => (
            <div
              key={a.id}
              className={`${styles.addressOption} ${!showNewAddress && addressId === a.id ? styles.addressOptionActive : ""}`}
              onClick={() => {
                setAddressId(a.id);
                setShowNewAddress(false);
              }}
            >
              <MapPin size={18} className="text-accent" />
              <span className="stack gap-1">
                <span className="text-callout">{a.label}</span>
                <span className="text-footnote">
                  {a.line1}, {a.city}, {a.state} {a.pincode}
                </span>
              </span>
            </div>
          ))}

          <div
            className={`${styles.addressOption} ${showNewAddress ? styles.addressOptionActive : ""}`}
            onClick={() => setShowNewAddress(true)}
          >
            <Plus size={18} className="text-accent" />
            <span className="text-callout">Add a new address</span>
          </div>

          {showNewAddress && (
            <div className="card stack gap-3">
              <div className="field">
                <label>Pin your exact location</label>
                <AddressMapPicker
                  initial={pickedLatLng ?? undefined}
                  onLocationChange={(loc, formatted) => {
                    setPickedLatLng(loc);
                    if (formatted && !newAddress.line1) {
                      setNewAddress((prev) => ({ ...prev, line1: formatted }));
                    }
                  }}
                />
              </div>
              <div className="field">
                <label>Address label</label>
                <input
                  className="input"
                  placeholder="e.g. Home, Office, Warehouse"
                  value={newAddress.label}
                  onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Street address / Door no.</label>
                <input
                  className="input"
                  placeholder="Flat 4B, Green Towers, 14th Main Rd"
                  value={newAddress.line1}
                  onChange={(e) => setNewAddress({ ...newAddress, line1: e.target.value })}
                />
              </div>
              <div className={styles.formRow}>
                <div className="field">
                  <label>City</label>
                  <input
                    className="input"
                    placeholder="Chennai"
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>State</label>
                  <input
                    className="input"
                    placeholder="Tamil Nadu"
                    value={newAddress.state}
                    onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                  />
                </div>
              </div>
              <div className="field">
                <label>Pincode</label>
                <input
                  className="input"
                  placeholder="600001"
                  value={newAddress.pincode}
                  onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Step 3: Schedule */}
      <div className={styles.section}>
        <h2 className={`text-title3 ${styles.sectionTitle}`}>3. Pickup date & time</h2>
        <div className="card stack gap-3">
          <div className="field">
            <label>Select date</label>
            <input
              type="date"
              className="input"
              min={new Date().toISOString().slice(0, 10)}
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Preferred time slot</label>
            <select className="select" value={scheduledSlot} onChange={(e) => setScheduledSlot(e.target.value)}>
              {SLOTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Special instructions (optional)</label>
            <textarea
              className="textarea"
              placeholder="e.g. Call before coming, gate passcode is 1234"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className={styles.estimateBar}>
        <div className={styles.estimateRow}>
          <span className="text-secondary text-callout">Estimated e-waste value</span>
          <span className="text-title3 text-accent">₹{estimate.min}–{estimate.max}</span>
        </div>
        <p className="text-footnote">
          Instant estimate based on weight & condition. Credited to your EcoWallet upon collector verification.
        </p>
        <button
          className="btn btn-primary btn-block"
          disabled={submitting || !canSubmit}
          onClick={handleSubmit}
          type="button"
          style={{ padding: "12px", fontSize: "1rem", fontWeight: 600 }}
        >
          {submitting
            ? "Scheduling pickup…"
            : !hasItems
            ? "Add items above to continue"
            : !hasAddress
            ? "Choose pickup address"
            : !hasDate
            ? "Pick a date to schedule"
            : `Schedule pickup · ₹${estimate.min}–${estimate.max}`}
        </button>
      </div>
    </div>
  );
}

