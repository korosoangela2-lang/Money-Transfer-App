import { round2, monthKey } from "../lib/format.js";
import { CORRIDORS } from "../lib/constants.js";
import { PRICING } from "../lib/pricing.js";
import { OUTFLOW_TYPES } from "../components/primitives.jsx";

export const select = {
  user: (s) => s.auth.user,
  isAdmin: (s) => s.auth.user?.role === "admin",
  balance: (s) => s.wallet.balance,
  rate: (s, code) => s.rates.pairs[code] ?? 1,
  beneficiaries: (s) => s.beneficiaries.items,
  beneficiaryById: (s, id) => s.beneficiaries.items.find((b) => b.id === id),
  transactions: (s) => s.transactions.items,
  transactionById: (s, id) => s.transactions.items.find((t) => t.id === id),
  sends: (s) => s.transactions.items.filter((t) => t.type === "send"),

  /** Six-month in/out series for the wallet chart. */
  monthlyFlow: (s) => {
    const buckets = new Map();
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      buckets.set(d.toLocaleDateString("en-CA", { month: "short" }), { month: d.toLocaleDateString("en-CA", { month: "short" }), sent: 0, added: 0 });
    }
    s.transactions.items.forEach((t) => {
      const k = monthKey(t.createdAt);
      if (!buckets.has(k) || t.status === "failed") return;
      const b = buckets.get(k);
      if (OUTFLOW_TYPES.has(t.type)) b.sent = round2(b.sent + t.amount + t.fee);
      else b.added = round2(b.added + t.amount);
    });
    return [...buckets.values()];
  },

  /** Where the money goes, by destination currency. */
  corridorSplit: (s) => {
    const map = new Map();
    select.sends(s).filter((t) => t.status !== "failed").forEach((t) => {
      map.set(t.currency, round2((map.get(t.currency) || 0) + t.amount));
    });
    return [...map.entries()].map(([code, value]) => ({
      code, value,
      label: CORRIDORS.find((c) => c.code === code)?.country || code,
    }));
  },

  /** Headline wallet stats. */
  walletStats: (s) => {
    const sends = select.sends(s).filter((t) => t.status !== "failed");
    const sent = round2(sends.reduce((a, t) => a + t.amount, 0));
    const fees = round2(sends.reduce((a, t) => a + t.fee, 0));
    const saved = round2(sends.reduce((a, t) => a + Math.max(0, t.amount * PRICING.bankBenchmark - t.fee), 0));
    return { sent, fees, saved, count: sends.length, avgFeePct: sent ? (fees / sent) * 100 : 0 };
  },

  /** Wallet-account analytics for the admin wallets view: distribution, concentration, top holders. */
  adminWalletAnalytics: (s) => {
    const users = s.admin.users;
    const balances = users.map((u) => u.balance).sort((a, b) => a - b);
    const total = round2(balances.reduce((a, b) => a + b, 0));
    const count = balances.length;
    const avg = count ? round2(total / count) : 0;
    const mid = Math.floor(count / 2);
    const median = count ? (count % 2 ? balances[mid] : round2((balances[mid - 1] + balances[mid]) / 2)) : 0;

    const bands = [
      { label: "$0", test: (b) => b === 0 },
      { label: "$1–100", test: (b) => b > 0 && b <= 100 },
      { label: "$100–500", test: (b) => b > 100 && b <= 500 },
      { label: "$500–1,000", test: (b) => b > 500 && b <= 1000 },
      { label: "$1,000+", test: (b) => b > 1000 },
    ];
    const distribution = bands.map(({ label, test }) => ({ label, count: balances.filter(test).length }));

    const topHolders = [...users].sort((a, b) => b.balance - a.balance).slice(0, 8);

    return {
      total,
      avg,
      median,
      count,
      zeroBalance: balances.filter((b) => b === 0).length,
      distribution,
      topHolders,
    };
  },

  /** Aggregate stats for the admin transactions view: volume, revenue, and status mix. */
  adminTxSummary: (s) => {
    const txs = s.admin.transactions;
    const completed = txs.filter((t) => t.status !== "failed");
    const volume = round2(completed.reduce((a, t) => a + t.amount, 0));
    const revenue = round2(completed.reduce((a, t) => a + t.fee + t.spreadRevenue, 0));
    const byStatus = txs.reduce((acc, t) => ({ ...acc, [t.status]: (acc[t.status] || 0) + 1 }), {});
    return {
      count: txs.length,
      volume,
      revenue,
      avgAmount: completed.length ? round2(volume / completed.length) : 0,
      byStatus,
    };
  },

  /** Platform-wide numbers for the admin overview. */
  adminStats: (s) => {
    const users = s.admin.users;
    const rev = s.admin.revenue;
    const last = rev[rev.length - 1] || { fees: 0, spread: 0, volume: 0, transfers: 0 };
    const prev = rev[rev.length - 2] || last;
    const lastTotal = last.fees + last.spread;
    const prevTotal = prev.fees + prev.spread || 1;
    return {
      totalUsers: users.length,
      activeUsers: users.filter((u) => u.status === "active").length,
      pendingKyc: users.filter((u) => u.kyc === "pending").length,
      custody: round2(users.reduce((a, u) => a + u.balance, 0)),
      revenue: lastTotal,
      revenueChange: ((lastTotal - prevTotal) / prevTotal) * 100,
      volume: last.volume,
      transfers: last.transfers,
      takeRate: last.volume ? (lastTotal / last.volume) * 100 : 0,
    };
  },
};
