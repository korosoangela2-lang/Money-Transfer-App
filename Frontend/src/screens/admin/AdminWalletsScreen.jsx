import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Wallet, Users, TrendingUp, CircleDollarSign } from "lucide-react";
import { T } from "../../lib/theme.jsx";
import { money } from "../../lib/format.js";
import { StatusPill } from "../../components/primitives.jsx";
import { useStore } from "../../store/context.jsx";
import { select } from "../../store/selectors.js";

export default function AdminWalletsScreen() {
  const { state } = useStore();
  const w = select.adminWalletAnalytics(state);
  const cards = [
    ["Total custodied", money(w.total), Wallet],
    ["Average balance", money(w.avg), CircleDollarSign],
    ["Median balance", money(w.median), TrendingUp],
    ["Zero-balance wallets", `${w.zeroBalance} / ${w.count}`, Users],
  ];

  return (
    <div className="flex flex-col gap-6 halcyon-rise">
      <div>
        <div className="text-xl font-semibold">Wallets</div>
        <div className="text-sm" style={{ color: T.muted }}>Analytics across every user's wallet account.</div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {cards.map(([label, val, Icon]) => (
          <div key={label} className="rounded-2xl p-4" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs" style={{ color: T.muted }}>{label}</span>
              <Icon size={14} style={{ color: T.faint }} />
            </div>
            <div className="text-xl font-semibold">{val}</div>
          </div>
        ))}
      </div>
      <div className="rounded-2xl p-5" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
        <div className="text-sm font-semibold mb-4">Balance distribution</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={w.distribution}>
            <CartesianGrid vertical={false} stroke={T.line} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: T.faint }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: T.faint }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip formatter={(v) => `${v} wallet${v === 1 ? "" : "s"}`} contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${T.line}` }} />
            <Bar dataKey="count" fill={T.pine} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${T.line}`, background: T.surface }}>
        <div className="px-5 pt-4 pb-1 text-sm font-semibold">Top wallets</div>
        <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: T.paper }}>
              {["User", "Balance", "KYC", "Status"].map((h) => (
                <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold" style={{ color: T.muted }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {w.topHolders.map((u) => (
              <tr key={u.id} style={{ borderTop: `1px solid ${T.line}` }}>
                <td className="px-4 py-3">
                  <div className="font-medium">{u.name}</div>
                  <div className="text-xs" style={{ color: T.faint }}>{u.email}</div>
                </td>
                <td className="px-4 py-3">{money(u.balance)}</td>
                <td className="px-4 py-3"><StatusPill status={u.kyc} /></td>
                <td className="px-4 py-3"><StatusPill status={u.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
