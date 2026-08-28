import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { T } from "../../lib/theme.jsx";
import { money } from "../../lib/format.js";
import { useStore } from "../../store/context.jsx";

export default function AdminRevenueScreen() {
  const { state } = useStore();
  const revenue = state.admin.revenue;
  return (
    <div className="flex flex-col gap-6 halcyon-rise">
      <div>
        <div className="text-xl font-semibold">Revenue</div>
        <div className="text-sm" style={{ color: T.muted }}>Fees, spread, and volume over time.</div>
      </div>
      <div className="rounded-2xl p-5" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
        <div className="text-sm font-semibold mb-4">Fees vs. FX spread</div>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={revenue}>
            <CartesianGrid vertical={false} stroke={T.line} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: T.faint }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: T.faint }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v) => money(v)} contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${T.line}` }} />
            <Line type="monotone" dataKey="fees" stroke={T.pine} strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="spread" stroke={T.marigold} strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="rounded-2xl p-5" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
        <div className="text-sm font-semibold mb-4">Transfer volume</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={revenue}>
            <CartesianGrid vertical={false} stroke={T.line} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: T.faint }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: T.faint }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v) => money(v)} contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${T.line}` }} />
            <Bar dataKey="volume" fill={T.ink80} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
