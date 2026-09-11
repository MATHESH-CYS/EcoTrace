"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Leaf } from "lucide-react";
import { signUpAction, type SignUpState } from "@/lib/actions/auth";
import { ThemeToggle } from "@/components/ThemeToggle";
import styles from "../sign-in/page.module.scss";

const initialState: SignUpState = { error: null };

export default function SignUpPage() {
  const [state, formAction, pending] = useActionState(signUpAction, initialState);

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
            Turn your old electronics into verified, traceable impact.
          </h1>
          <p className={styles.heroTag}>
            Create a citizen account to schedule pickups, track every stage of your
            device&apos;s journey, and see it through to certified recycling.
          </p>
        </div>
        <div className={styles.heroSteps}>
          <div className={styles.heroStep}><span className={styles.dot} />Free to join, no fees</div>
          <div className={styles.heroStep}><span className={styles.dot} />Track pickups in real time</div>
          <div className={styles.heroStep}><span className={styles.dot} />Earn EcoWallet rewards</div>
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

          <div className="stack gap-1">
            <h2 className="text-title1">Create your Citizen account</h2>
            <p className="text-secondary text-body">Register to schedule, manage, and verify e-waste pickups.</p>
          </div>

          <form action={formAction} className={styles.form}>
            {state.error && <div className={styles.errorBanner}>{state.error}</div>}

            <div className="field">
              <label htmlFor="fullName">Full name</label>
              <input id="fullName" name="fullName" type="text" autoComplete="name" className="input" placeholder="Ananya Rao" required />
            </div>

            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" autoComplete="email" className="input" placeholder="you@example.com" required />
            </div>

            <div className="field">
              <label htmlFor="phone">Phone (optional)</label>
              <input id="phone" name="phone" type="tel" autoComplete="tel" className="input" placeholder="+91 98765 43210" />
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                className="input"
                minLength={8}
                placeholder="At least 8 characters"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="confirmPassword">Confirm password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                className="input"
                minLength={8}
                placeholder="Confirm password"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={pending}>
              {pending ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="text-footnote" style={{ textAlign: "center" }}>
            Already have an account? <Link href="/sign-in" className="text-accent">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
