"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/types/database.types";

const ROLES = ["COLLECTOR", "AGGREGATOR", "RECYCLER", "BRAND", "ADMIN"] as const;
type StaffRole = (typeof ROLES)[number];

const ROLE_ORG_TYPE: Record<StaffRole, "AGGREGATOR" | "RECYCLER" | "BRAND" | null> = {
  COLLECTOR: "AGGREGATOR",
  AGGREGATOR: "AGGREGATOR",
  RECYCLER: "RECYCLER",
  BRAND: "BRAND",
  ADMIN: null,
};

function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
  let out = "";
  for (let i = 0; i < 14; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export function CreateStaffUserForm({ organizations }: { organizations: Tables<"organizations">[] }) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<StaffRole>("COLLECTOR");
  const [orgId, setOrgId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const requiredOrgType = ROLE_ORG_TYPE[role];
  const filteredOrgs = useMemo(
    () => (requiredOrgType ? organizations.filter((o) => o.type === requiredOrgType) : []),
    [organizations, requiredOrgType]
  );

  async function submit() {
    if (!fullName || !email) return;
    if (requiredOrgType && !orgId) {
      setError(`Select the ${requiredOrgType.toLowerCase()} organization for this role.`);
      return;
    }
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const password = generatePassword();

    const { error: err } = await supabase.rpc("admin_create_staff_user", {
      p_email: email,
      p_password: password,
      p_full_name: fullName,
      p_role: role,
      p_organization_id: requiredOrgType ? orgId : null,
      p_phone: phone || null,
    });

    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }

    setCreated({ email, password });
    setFullName("");
    setEmail("");
    setPhone("");
    setOrgId("");
    router.refresh();
  }

  async function copyPassword() {
    if (!created) return;
    await navigator.clipboard.writeText(created.password);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="card">
      <h2 className="text-title3" style={{ marginBottom: 4 }}>
        Provision staff account
      </h2>
      <p className="text-footnote" style={{ marginBottom: 14 }}>
        Collector, aggregator, recycler, brand and admin accounts can only be created here — they
        are never self-registered.
      </p>

      {error && <p className="text-danger text-footnote" style={{ marginBottom: 10 }}>{error}</p>}

      {created && (
        <div className="card" style={{ background: "var(--accent-soft)", borderColor: "var(--accent)", marginBottom: 14 }}>
          <p className="text-callout text-accent" style={{ marginBottom: 6 }}>
            Account created — share this password once, it won&apos;t be shown again
          </p>
          <div className="row spread">
            <span className="stack gap-1">
              <span className="text-footnote">{created.email}</span>
              <span className="text-callout" style={{ fontFamily: "ui-monospace, monospace" }}>{created.password}</span>
            </span>
            <button className="icon-btn" onClick={copyPassword} aria-label="Copy password">
              {copied ? <Check size={15} /> : <Copy size={15} />}
            </button>
          </div>
        </div>
      )}

      <div className="stack gap-3">
        <div className="row gap-3">
          <input className="input" placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <select className="select" value={role} onChange={(e) => setRole(e.target.value as StaffRole)} style={{ maxWidth: 180 }}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r.charAt(0) + r.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>
        <div className="row gap-3">
          <input className="input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="input" placeholder="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        {requiredOrgType && (
          <select className="select" value={orgId} onChange={(e) => setOrgId(e.target.value)}>
            <option value="">Select {requiredOrgType.toLowerCase()} organization</option>
            {filteredOrgs.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        )}
        <button className="btn btn-primary" disabled={busy || !fullName || !email} onClick={submit}>
          <UserPlus size={15} /> {busy ? "Creating…" : "Create account"}
        </button>
      </div>
    </div>
  );
}
