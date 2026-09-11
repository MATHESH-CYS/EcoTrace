"use client";

import { useState, useRef, useEffect, useActionState } from "react";
import Link from "next/link";
import { Leaf, UserCheck } from "lucide-react";
import { signInAction, type SignInState } from "@/lib/actions/auth";
import { ThemeToggle } from "@/components/ThemeToggle";
import styles from "./page.module.scss";

type RoleOption = {
  id: string;
  name: string;
  portalTitle: string;
};

const ROLES: RoleOption[] = [
  {
    id: "CITIZEN",
    name: "Citizen",
    portalTitle: "CITIZEN LOGIN PORTAL",
  },
  {
    id: "COLLECTOR",
    name: "Collector",
    portalTitle: "COLLECTOR LOGIN PORTAL",
  },
  {
    id: "AGGREGATOR",
    name: "Aggregator",
    portalTitle: "AGGREGATOR LOGIN PORTAL",
  },
  {
    id: "RECYCLER",
    name: "Recycler",
    portalTitle: "RECYCLER LOGIN PORTAL",
  },
  {
    id: "BRAND",
    name: "Brand (EPR)",
    portalTitle: "BRAND EPR PORTAL",
  },
  {
    id: "ADMIN",
    name: "Administrator",
    portalTitle: "ADMIN SYSTEM PORTAL",
  },
];

const initialState: SignInState = { error: null };

export default function SignInPage() {
  const [state, formAction, pending] = useActionState(signInAction, initialState);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("CITIZEN");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const selectRef = useRef<HTMLSelectElement>(null);

  const currentRole = ROLES.find((r) => r.id === selectedRoleId) ?? ROLES[0];

  function handleRoleChange(roleId: string) {
    setSelectedRoleId(roleId);
    setEmail("");
    setPassword("");
  }

  useEffect(() => {
    const el = selectRef.current;
    if (!el) return;
    const listener = () => {
      handleRoleChange(el.value);
    };
    el.addEventListener("change", listener);
    return () => el.removeEventListener("change", listener);
  }, []);


  return (
    <div className={styles.page}>
      <aside className={styles.hero}>
        <div className={styles.heroMark}>
          <span className={styles.heroBadge}>
            <Leaf size={20} />
          </span>
          EcoTrace
        </div>
        <div>
          <h1 className={styles.heroTitle}>
            From doorstep to responsible recycling — every device has a verifiable journey.
          </h1>
          <p className={styles.heroTag}>
            One platform connecting citizens, collectors, aggregators, recyclers and brands
            through a controlled, auditable e-waste chain.
          </p>
        </div>
        <div className={styles.heroSteps}>
          <div className={styles.heroStep}><span className={styles.dot} />Request pickup in minutes</div>
          <div className={styles.heroStep}><span className={styles.dot} />Verified evidence at every stage</div>
          <div className={styles.heroStep}><span className={styles.dot} />Tamper-evident integrity hash</div>
        </div>
      </aside>

      <div className={styles.formSide}>
        <div className={styles.formCard}>
          <div className="row spread">
            <div className={styles.mobileMark}>
              <Leaf size={20} />
              EcoTrace
            </div>
            <ThemeToggle />
          </div>

          {/* Role Category Dropdown */}
          <div className="field">
            <label htmlFor="role-select" style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
              <UserCheck size={16} /> Select Login Category / Role
            </label>
            <select
              id="role-select"
              ref={selectRef}
              className="select"
              value={selectedRoleId}
              onChange={(e) => handleRoleChange(e.target.value)}
              onInput={(e) => handleRoleChange((e.target as HTMLSelectElement).value)}
              style={{
                fontSize: "15px",
                fontWeight: 600,
                padding: "10px 14px",
                cursor: "pointer",
                borderRadius: "var(--radius-md)",
                borderColor: "var(--accent)",
              }}
            >
              {ROLES.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>

          {/* Big Size Role Portal Display */}
          <div className={styles.hugePortalCard}>
            <h1 className={styles.hugePortalTitle}>
              {currentRole.portalTitle}
            </h1>
          </div>

          <form action={formAction} className={styles.form} autoComplete="off">
            {state.error && <div className={styles.errorBanner}>{state.error}</div>}

            <div className="field">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="new-password"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input"
                required
              />
            </div>

            <div className="field">
              <div className="row spread">
                <label htmlFor="password">Password</label>
                <Link href="/forgot-password" className="text-footnote text-accent">
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={pending}>
              {pending ? "Signing in…" : `Enter ${currentRole.portalTitle}`}
            </button>
          </form>

          <p className="text-footnote" style={{ textAlign: "center", marginTop: 8 }}>
            New to EcoTrace? <Link href="/sign-up" className="text-accent">Create a Citizen account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}



