"use client";

import { useState } from "react";
import Link from "next/link";
import { Leaf, MailCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";
import styles from "../sign-in/page.module.scss";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    setSent(true);
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
          <h1 className={styles.heroTitle}>Reset your password</h1>
          <p className={styles.heroTag}>
            We&apos;ll email you a secure link to choose a new password for your EcoTrace account.
          </p>
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

          {sent ? (
            <div className="stack gap-4" style={{ textAlign: "center", padding: "24px 0" }}>
              <MailCheck size={36} className="text-accent" style={{ margin: "0 auto" }} />
              <h2 className="text-title2">Check your email</h2>
              <p className="text-secondary text-body">
                If an account exists for {email}, a reset link is on its way. Open it to choose a
                new password.
              </p>
              <Link href="/sign-in" className="btn btn-primary btn-block">
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <div className="stack gap-1">
                <h2 className="text-title1">Forgot password</h2>
                <p className="text-secondary text-body">Enter your account email to receive a reset link.</p>
              </div>

              <form onSubmit={submit} className={styles.form}>
                {error && <div className={styles.errorBanner}>{error}</div>}

                <div className="field">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    className="input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
                  {busy ? "Sending…" : "Send reset link"}
                </button>
              </form>

              <p className="text-footnote" style={{ textAlign: "center" }}>
                <Link href="/sign-in" className="text-accent">Back to sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
