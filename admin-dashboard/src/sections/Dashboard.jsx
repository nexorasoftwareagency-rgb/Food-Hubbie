import { useState, useEffect, useCallback } from "react";
import { TrendingUp, Clock, Bike, ShoppingCart, Bell, Zap } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import GlassCard from "../components/GlassCard";
import KPICard from "../components/KPICard";
import StatusBadge from "../components/StatusBadge";
import Pill from "../components/Pill";
import Avatar from "../components/Avatar";
import SectionHeader from "../components/SectionHeader";
import { ORANGE, COLORS } from "../utils/constants";
import { fmt } from "../utils/formatters";

const REVENUE_DATA = [
  { t:"8am", rev:1200, ord:4 }, { t:"9am", rev:2800, ord:9 },
  { t:"10am", rev:1800, ord:6 }, { t:"11am", rev:3400, ord:11 },
  { t:"12pm", rev:8200, ord:28 }, { t:"1pm", rev:9800, ord:34 },
  { t:"2pm", rev:7200, ord:24 }, { t:"3pm", rev:4100, ord:14 },
  { t:"4pm", rev:3200, ord:10 }, { t:"5pm", rev:5600, ord:18 },
  { t:"6pm", rev:7800, ord:26 }, { t:"7pm", rev:11200, ord:38 },
  { t:"8pm", rev:13400, ord:45 }, { t:"9pm", rev:10200, ord:34 },
  { t:"10pm", rev:6800, ord:22 },
];

const WEEK_DATA = [
  { d:"Mon", rev:38000, ord:62 }, { d:"Tue", rev:42000, ord:68 },
  { d:"Wed", rev:35000, ord:55 }, { d:"Thu", rev:51000, ord:84 },
  { d:"Fri", rev:68000, ord:110 }, { d:"Sat", rev:82000, ord:134 },
  { d:"Sun", rev:74000, ord:121 },
];

const MOCK_ORDERS_DASH = [
  { id:"ORD-1001", customer:"Rahul Sharma", items:3, total:485, status:"pending", type:"delivery", time:"2 min ago" },
  { id:"ORD-1005", customer:"Deepak Jha", items:4, total:640, status:"confirmed", type:"delivery", time:"5 min ago" },
  { id:"ORD-1008", customer:"Neha Gupta", items:2, total:390, status:"pending", type:"dinein", time:"1 min ago" },
];

const MOCK_RIDERS_DASH = [
  { id:"r1", name:"Rajesh Kumar", vehicle:"bike", status:"online", deliv:12, earn:1840 },
  { id:"r2", name:"Suresh Yadav", vehicle:"scooty", status:"busy", deliv:15, earn:2100 },
  { id:"r3", name:"Mohan Singh", vehicle:"bike", status:"offline", deliv:7, earn:980 },
  { id:"r4", name:"Ramesh Thakur", vehicle:"cycle", status:"online", deliv:11, earn:1560 },
];

const MOCK_MENU_BEST = [
  { id:"d1", name:"Butter Chicken", price:280, rating:4.8, emoji:"\u{1F35B}" },
  { id:"d3", name:"Dal Makhani", price:180, rating:4.7, emoji:"\u{1F372}" },
  { id:"d4", name:"Chicken Biryani", price:320, rating:4.9, emoji:"\u{1F35A}" },
];

const Dashboard = ({ showToast }) => {
  const [incoming, setIncoming] = useState(true);
  const [chartPeriod, setChartPeriod] = useState("hourly");

  useEffect(() => {
    const t = setTimeout(() => setIncoming(false), 10000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="space-y-5">
      {incoming && (
        <div className="rounded-2xl p-4 flex items-center gap-4 text-white"
          style={{ background: `linear-gradient(135deg, ${ORANGE}, #c45a18)`, animation: "pulse 2s infinite" }}>
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <Bell size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm">New Order — ORD-1009</div>
            <div className="text-xs text-white/80 truncate">Neha Gupta · 380 · Delivery · 2 items</div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => { setIncoming(false); showToast("Order ORD-1009 accepted!"); }}
              className="px-3 py-1.5 rounded-xl bg-white text-orange-600 text-xs font-bold">Accept</button>
            <button onClick={() => setIncoming(false)}
              className="px-3 py-1.5 rounded-xl bg-white/20 text-xs font-bold">Dismiss</button>
          </div>
        </div>
      )}

      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
        <KPICard title="Today's Revenue" value="42,680" sub="68 orders completed" icon={TrendingUp} trend={12.4} />
        <KPICard title="Pending Orders" value="8" sub="3 urgent, 5 normal" icon={Clock} trend={-4} color={COLORS.warning} />
        <KPICard title="Active Riders" value="3/4" sub="2 on delivery, 1 free" icon={Bike} color={COLORS.info} />
        <KPICard title="Avg Order Value" value="628" sub="vs 584 yesterday" icon={ShoppingCart} trend={7.5} color={COLORS.success} />
      </div>

      <GlassCard className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800" style={{ fontFamily: "'Outfit', sans-serif" }}>Revenue & Orders</h3>
          <div className="flex gap-2">
            <Pill label="Hourly" active={chartPeriod === "hourly"} onClick={() => setChartPeriod("hourly")} />
            <Pill label="Weekly" active={chartPeriod === "weekly"} onClick={() => setChartPeriod("weekly")} />
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartPeriod === "hourly" ? REVENUE_DATA : WEEK_DATA}>
            <defs>
              <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={ORANGE} stopOpacity={0.25} />
                <stop offset="95%" stopColor={ORANGE} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey={chartPeriod === "hourly" ? "t" : "d"} tick={{ fontSize:10, fill:"#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize:10, fill:"#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => `${v/1000}k`} width={45} />
            <Tooltip formatter={(v, n) => [n === "rev" ? fmt(v) : v, n === "rev" ? "Revenue" : "Orders"]} />
            <Area type="monotone" dataKey="rev" stroke={ORANGE} strokeWidth={2.5} fill="url(#grad1)" />
            <Area type="monotone" dataKey="ord" stroke={COLORS.info} strokeWidth={1.5} fill="none" strokeDasharray="4 2" />
          </AreaChart>
        </ResponsiveContainer>
      </GlassCard>

      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
        <GlassCard className="p-4">
          <SectionHeader title="Priority Orders" />
          <div className="space-y-2">
            {MOCK_ORDERS_DASH.filter(o => o.status === "pending" || o.status === "confirmed").map(o => (
              <div key={o.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background:"#fff7ed" }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: ORANGE }}>{o.items}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-800 truncate">{o.customer}</div>
                  <div className="text-xs text-slate-500">{o.id} · {o.time}</div>
                </div>
                <StatusBadge status={o.status} />
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <SectionHeader title="Fleet Status" />
          <div className="space-y-3">
            {MOCK_RIDERS_DASH.map(r => (
              <div key={r.id} className="flex items-center gap-3">
                <Avatar name={r.name} size={36} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-800 truncate">{r.name}</div>
                  <div className="text-xs text-slate-500">{r.vehicle} · {r.deliv} deliveries</div>
                </div>
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: r.status==="online" ? COLORS.success : r.status==="busy" ? COLORS.warning : "#94a3b8" }} />
                <span className="text-xs font-medium capitalize"
                  style={{ color: r.status==="online" ? COLORS.success : r.status==="busy" ? COLORS.warning : "#94a3b8" }}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <SectionHeader title="Top Sellers Today" />
          <div className="space-y-3">
            {MOCK_MENU_BEST.map((m, i) => (
              <div key={m.id} className="flex items-center gap-3">
                <span className="text-2xl">{m.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-800 truncate">{m.name}</div>
                </div>
                <span className="text-sm font-bold" style={{ color: ORANGE }}>{fmt(m.price)}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default Dashboard;
