"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Leaf, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";
import styles from "../sign-in/page.module.scss";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // The recovery link from the email exchanges its token for a session via
    // the Supabase client automatically (detectSessionInUrl); we just confirm
    // a session landed before showing the form.
    const supabase = createClient();
    let settled = false;

    supabase.auth.getSession().then(({ data }) => {
      if (data.session && !settled) {
        settled = true;
        setReady(true);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "PASSWORD_RECOVERY" || session) && !settled) {
        settled = true;
        setReady(true);
      }
    });

    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        setInvalid(true);
      }
    }, 4000);

    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/sign-in"), 1800);
  }

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
          <h1 className={styles.heroTitle}>Choose a new password</h1>
          <p className={styles.heroTag}>Pick something you haven&apos;t used before on EcoTrace.</p>
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

          {done ? (
            <div className="stack gap-4" style={{ textAlign: "center", padding: "24px 0" }}>
              <CheckCircle2 size={36} className="text-accent" style={{ margin: "0 auto" }} />
              <h2 className="text-title2">Password updated</h2>
              <p className="text-secondary text-body">Redirecting you to sign in…</p>
            </div>
          ) : invalid ? (
            <div className="stack gap-4" style={{ textAlign: "center", padding: "24px 0" }}>
              <h2 className="text-title2">Link expired or invalid</h2>
              <p className="text-secondary text-body">
                Request a fresh reset link and try again.
              </p>
              <Link href="/forgot-password" className="btn btn-primary btn-block">
                Request new link
              </Link>
            </div>
          ) : !ready ? (
            <p className="text-secondary text-body">Verifying your reset link…</p>
          ) : (
            <>
              <div className="stack gap-1">
                <h2 className="text-title1">New password</h2>
                <p className="text-secondary text-body">Choose a new password for your account.</p>
              </div>

              <form onSubmit={submit} className={styles.form}>
                {error && <div className={styles.errorBanner}>{error}</div>}

                <div className="field">
                  <label htmlFor="password">New password</label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    className="input"
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="field">
                  <label htmlFor="confirmPassword">Confirm password</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    className="input"
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
                  {busy ? "Updating…" : "Update password"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
