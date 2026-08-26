import { useNavigate } from "react-router-dom";
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { ArrowDownLeft, Plus, Send, Shield } from "lucide-react";
import { T, DISPLAY, cardStyle, shadow } from "../lib/theme.jsx";
import { money, initials } from "../lib/format.js";
import { Button, TxRow } from "../components/primitives.jsx";
import { useStore } from "../store/context.jsx";
import { select } from "../store/selectors.js";

export default function HomeScreen() {
  const { state } = useStore();
  const navigate = useNavigate();
  const user = select.user(state);
  const balance = select.balance(state);
  const stats = select.walletStats(state);
  const flow = select.monthlyFlow(state);
  const split = select.corridorSplit(state);
  const recent = select.transactions(state).slice(0, 4);
  const PIE_COLORS = [T.pine, T.marigold, T.brick, T.muted];

  return (
    <div className="flex flex-col gap-5 p-5 pb-6 heha-rise">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs" style={{ color: T.muted }}>Welcome back</div>
          <div className="text-lg" style={{ fontFamily: DISPLAY, fontWeight: 600 }}>{user?.name?.split(" ")[0] || "there"}</div>
        </div>
        <div className="rounded-full flex items-center justify-center font-semibold text-sm" style={{ width: 38, height: 38, background: T.pineSoft, color: T.pine, boxShadow: shadow.sm }}>
          {initials(user?.name)}
        </div>
      </div>

      <div className="rounded-2xl p-5 flex flex-col gap-4 relative overflow-hidden" style={{ background: `linear-gradient(145deg, #1a1116 0%, ${T.ink} 60%, #201118 100%)`, color: "#fff", boxShadow: shadow.lg }}>
        <div className="absolute rounded-full" style={{ width: 220, height: 220, top: -100, right: -80, background: `radial-gradient(circle, ${T.pine}55 0%, transparent 70%)` }} />
        <div className="flex items-center justify-between relative">
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>Wallet balance</span>
          <Shield size={14} style={{ color: "rgba(255,255,255,0.5)" }} />
        </div>
        <div className="text-4xl heha-tick relative" style={{ fontFamily: DISPLAY, fontWeight: 600 }}>{money(balance)}</div>
        <div className="flex gap-2 relative">
          <Button size="sm" icon={Plus} onClick={() => navigate("/add-funds")} style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff" }}>
            Add funds
          </Button>
          <Button size="sm" icon={Send} onClick={() => navigate("/send")} style={{ background: T.marigold, color: T.ink, border: `1px solid ${T.marigold}` }}>
            Send
          </Button>
          <Button size="sm" icon={ArrowDownLeft} onClick={() => navigate("/receive")} style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff" }}>
            Receive
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[["Sent", money(stats.sent)], ["Fees paid", money(stats.fees)], ["Saved", money(stats.saved)]].map(([label, val]) => (
          <div key={label} className="p-3" style={{ ...cardStyle, borderRadius: 12 }}>
            <div className="text-[10px]" style={{ color: T.muted }}>{label}</div>
            <div className="text-sm font-semibold mt-1">{val}</div>
          </div>
        ))}
      </div>

      <div className="p-4" style={cardStyle}>
        <div className="text-xs font-semibold mb-2" style={{ color: T.muted }}>Money in vs. out</div>
        <ResponsiveContainer width="100%" height={140}>
          <AreaChart data={flow}>
            <defs>
              <linearGradient id="sentFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={T.brick} stopOpacity={0.25} />
                <stop offset="100%" stopColor={T.brick} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="addedFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={T.pine} stopOpacity={0.3} />
                <stop offset="100%" stopColor={T.pine} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: T.faint }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v) => money(v)} contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${T.line}` }} />
            <Area type="monotone" dataKey="added" stroke={T.pine} fill="url(#addedFill)" strokeWidth={2} />
            <Area type="monotone" dataKey="sent" stroke={T.brick} fill="url(#sentFill)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {split.length > 0 && (
        <div className="p-4" style={cardStyle}>
          <div className="text-xs font-semibold mb-2" style={{ color: T.muted }}>Where it goes</div>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={100} height={100}>
              <PieChart>
                <Pie data={split} dataKey="value" nameKey="label" innerRadius={28} outerRadius={44} paddingAngle={3}>
                  {split.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-1.5 flex-1">
              {split.map((s, i) => (
                <div key={s.code} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5">
                    <span style={{ width: 8, height: 8, borderRadius: 99, background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    {s.label}
                  </span>
                  <span style={{ color: T.muted }}>{money(s.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-semibold" style={{ color: T.muted }}>Recent activity</div>
          <button className="text-xs font-semibold" style={{ color: T.pine }} onClick={() => navigate("/transactions")}>See all</button>
        </div>
        <div className="flex flex-col gap-2">
          {recent.map((t) => <TxRow key={t.id} tx={t} onClick={() => navigate(`/receipt/${t.id}`)} />)}
        </div>
      </div>
    </div>
  );
}
