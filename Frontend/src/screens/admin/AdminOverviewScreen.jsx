import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Shield, Users, AlertCircle, TrendingUp } from "lucide-react";
import { T } from "../../lib/theme.jsx";
import { money } from "../../lib/format.js";
import { useStore } from "../../store/context.jsx";
import { select } from "../../store/selectors.js";

export default function AdminOverviewScreen() {
  const { state } = useStore();
  const stats = select.adminStats(state);
  const revenue = state.admin.revenue;
  const cards = [
    ["Custodied balance", money(stats.custody), Shield],
    ["Total users", stats.totalUsers.toLocaleString(), Users],
    ["Pending KYC", stats.pendingKyc, AlertCircle],
    ["Take rate", `${stats.takeRate.toFixed(2)}%`, TrendingUp],
  ];
  return (
    <div className="flex flex-col gap-6 halcyon-rise">
      <div>
        <div className="text-xl font-semibold">Overview</div>
        <div className="text-sm" style={{ color: T.muted }}>Platform health at a glance.</div>
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
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-semibold">Revenue trend</div>
          <div className="text-xs flex items-center gap-1" style={{ color: stats.revenueChange >= 0 ? T.pine : T.brick }}>
            <TrendingUp size={13} /> {stats.revenueChange >= 0 ? "+" : ""}{stats.revenueChange.toFixed(1)}% vs last month
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={revenue}>
            <CartesianGrid vertical={false} stroke={T.line} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: T.faint }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: T.faint }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v) => money(v)} contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${T.line}` }} />
            <Bar dataKey="fees" stackId="rev" fill={T.pine} />
            <Bar dataKey="spread" stackId="rev" fill={T.marigold} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
