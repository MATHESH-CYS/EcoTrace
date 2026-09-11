import { Wallet as WalletIcon, Leaf } from "lucide-react";
import { requireProfile } from "@/lib/data/profile";

export default async function CitizenWalletPage() {
  const { supabase, user } = await requireProfile();

  const { data: wallet } = await supabase.from("wallets").select("*").eq("owner_id", user.id).single();
  const { data: transactions } = wallet
    ? await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("wallet_id", wallet.id)
        .order("created_at", { ascending: false })
        .limit(20)
    : { data: [] };

  return (
    <div>
      <h1 className="text-title1" style={{ marginBottom: 20 }}>
        EcoWallet
      </h1>

      <div className="card" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-strong))", color: "var(--accent-contrast)" }}>
        <div className="row spread">
          <span className="text-callout" style={{ opacity: 0.85 }}>
            Balance
          </span>
          <WalletIcon size={18} />
        </div>
        <div className="text-display" style={{ marginTop: 8 }}>
          ₹{wallet?.balance ?? 0}
        </div>
        <div className="row gap-2" style={{ marginTop: 12, opacity: 0.9 }}>
          <Leaf size={14} />
          <span className="text-footnote" style={{ color: "inherit" }}>
            {wallet?.eco_points ?? 0} EcoPoints
          </span>
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <h2 className="text-title3" style={{ marginBottom: 12 }}>
          Transactions
        </h2>
        <div className="card">
          {(!transactions || transactions.length === 0) && (
            <p className="text-secondary text-body">No transactions yet. Payouts appear here once a pickup is verified.</p>
          )}
          {(transactions ?? []).map((t) => (
            <div key={t.id} className="row spread" style={{ padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
              <span className="stack gap-1">
                <span className="text-callout">{t.kind}</span>
                <span className="text-footnote">{new Date(t.created_at).toLocaleDateString()}</span>
              </span>
              <span className="text-callout">₹{t.amount}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
