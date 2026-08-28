import { useState } from "react";
import { Search, Receipt, ArrowLeftRight, TrendingUp, Clock } from "lucide-react";
import { T, MONO } from "../../lib/theme.jsx";
import { money, shortDate } from "../../lib/format.js";
import { TextInput, StatusPill } from "../../components/primitives.jsx";
import { useStore } from "../../store/context.jsx";
import { select } from "../../store/selectors.js";

export default function AdminTransactionsScreen() {
  const { state } = useStore();
  const [q, setQ] = useState("");
  const items = state.admin.transactions.filter(
    (t) => t.user.toLowerCase().includes(q.toLowerCase()) || t.id.toLowerCase().includes(q.toLowerCase())
  );
  const summary = select.adminTxSummary(state);
  const cards = [
    ["Total volume", money(summary.volume), ArrowLeftRight],
    ["Total revenue", money(summary.revenue), TrendingUp],
    ["Average transaction", money(summary.avgAmount), Receipt],
    ["Pending", summary.byStatus.pending || 0, Clock],
  ];

  return (
    <div className="flex flex-col gap-5 halcyon-rise">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xl font-semibold">Transactions</div>
          <div className="text-sm" style={{ color: T.muted }}>{state.admin.transactions.length} total</div>
        </div>
        <div className="relative">
          <Search size={14} style={{ position: "absolute", left: 10, top: 10, color: T.faint }} />
          <TextInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search transactions…" style={{ paddingLeft: 32, width: 220 }} />
        </div>
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
      <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${T.line}`, background: T.surface }}>
        <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: T.paper }}>
              {["ID", "User", "Corridor", "Amount", "Revenue", "Status", "Date"].map((h) => (
                <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold" style={{ color: T.muted }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((t) => (
              <tr key={t.id} style={{ borderTop: `1px solid ${T.line}` }}>
                <td className="px-4 py-3" style={{ fontFamily: MONO, fontSize: 12 }}>{t.id}</td>
                <td className="px-4 py-3">{t.user}</td>
                <td className="px-4 py-3">{t.corridor}</td>
                <td className="px-4 py-3">{money(t.amount)}</td>
                <td className="px-4 py-3">{money(t.fee + t.spreadRevenue)}</td>
                <td className="px-4 py-3"><StatusPill status={t.status} /></td>
                <td className="px-4 py-3 text-xs" style={{ color: T.faint }}>{shortDate(t.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
