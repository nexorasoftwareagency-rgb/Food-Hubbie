import { useState, useMemo } from "react";
import { DollarSign, Users, ShoppingCart, Percent } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { useRealtimeData } from "../hooks/useRealtimeData";
import GlassCard from "../components/GlassCard";
import KPICard from "../components/KPICard";
import Pill from "../components/Pill";
import { ORANGE, COLORS, PIE_COLORS } from "../utils/constants";
import { fmt } from "../utils/formatters";

const revenueData = [
  { month:"Jan", rev:32000, ord:45 }, { month:"Feb", rev:28000, ord:38 },
  { month:"Mar", rev:45000, ord:62 }, { month:"Apr", rev:38000, ord:54 },
  { month:"May", rev:52000, ord:71 }, { month:"Jun", rev:48000, ord:65 },
  { month:"Jul", rev:58000, ord:78 }, { month:"Aug", rev:64000, ord:85 },
  { month:"Sep", rev:52000, ord:69 }, { month:"Oct", rev:61000, ord:82 },
  { month:"Nov", rev:74000, ord:98 }, { month:"Dec", rev:92000, ord:120 },
];

const topItems = [
  { name:"Butter Chicken",    orders:342, rev:95760 },
  { name:"Chicken Biryani",   orders:281, rev:89920 },
  { name:"Dal Makhani",       orders:245, rev:44100 },
  { name:"Tandoori Chicken",  orders:189, rev:52920 },
  { name:"Naan",              orders:312, rev:15600 },
];

const peaks = [
  { time:"12-2 PM", label:"Lunch Peak",  avg:"₹8,200/hr", color:"#f59e0b" },
  { time:"7-9 PM",  label:"Dinner Peak", avg:"₹13,400/hr", color:"#f36b21" },
  { time:"9-11 PM", label:"Late Night",  avg:"₹6,800/hr", color:"#8b5cf6" },
];

const Analytics = () => {
  const { data: orders = [] } = useRealtimeData("orders");
  const [period, setPeriod] = useState(0);

  const totals = useMemo(() => {
    const totalRev = orders.reduce((s, o) => s + (o.total || 0), 0);
    const totalOrd = orders.length;
    return { rev: totalRev, ord: totalOrd, aov: totalOrd ? Math.round(totalRev / totalOrd) : 0 };
  }, [orders]);

  const categoryPie = useMemo(() => {
    const counts = {};
    orders.forEach(o => {
      if (o.cart) o.cart.forEach(c => { const cat = c.category || "Other"; counts[cat] = (counts[cat] || 0) + 1; });
    });
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    return entries.map(([name, value], i) => ({ name, value, color: PIE_COLORS[i % PIE_COLORS.length] }));
  }, [orders]);

  const periods = [
    { label:"This Week",  rev:totals.rev, ord:totals.ord, cov:8.4, aov:totals.aov },
    { label:"Last Week",  rev:totals.rev, ord:totals.ord, cov:7.2, aov:totals.aov },
    { label:"This Month", rev:totals.rev, ord:totals.ord, cov:8.8, aov:totals.aov },
    { label:"Last Month", rev:totals.rev, ord:totals.ord, cov:8.1, aov:totals.aov },
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
        <KPICard title="Total Revenue" value={fmt(periods[period].rev)} icon={DollarSign} trend={15.4} />
        <KPICard title="Total Orders" value={periods[period].ord.toString()} icon={ShoppingCart} trend={9.1} color={COLORS.info} />
        <KPICard title="Conversion" value={periods[period].cov + "%"} icon={Percent} trend={1.2} color={COLORS.success} />
        <KPICard title="Avg Order" value={fmt(periods[period].aov)} icon={Users} trend={5.8} color={COLORS.warning} />
      </div>
      <div className="flex gap-2">
        {periods.map((p, i) => (
          <Pill key={p.label} label={p.label} active={period === i} onClick={() => setPeriod(i)} />
        ))}
      </div>
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))" }}>
        <GlassCard className="p-4">
          <h3 className="font-bold text-slate-800 mb-4 text-sm" style={{ fontFamily:"'Outfit', sans-serif" }}>Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize:9, fill:"#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:9, fill:"#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v/1000}k`} width={40} />
              <Tooltip formatter={v => [fmt(v), "Revenue"]} />
              <Bar dataKey="rev" fill="#f36b21" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>
        <GlassCard className="p-4">
          <h3 className="font-bold text-slate-800 mb-4 text-sm" style={{ fontFamily:"'Outfit', sans-serif" }}>Category Distribution</h3>
          {categoryPie.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={categoryPie} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" stroke="none">
                  {categoryPie.map(e => <Cell key={e.name} fill={e.color} />)}
                </Pie>
                <Legend formatter={v => <span className="text-xs text-slate-600">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-slate-400 text-sm">No category data yet</div>
          )}
        </GlassCard>
      </div>
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
        <GlassCard className="p-4">
          <h3 className="font-bold text-slate-800 mb-3 text-sm" style={{ fontFamily:"'Outfit', sans-serif" }}>Top Selling Items</h3>
          <div className="space-y-3">
            {topItems.map((item, i) => (
              <div key={item.name} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: ORANGE }}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-800">{item.name}</div>
                  <div className="text-xs text-slate-500">{item.orders} orders</div>
                </div>
                <span className="font-bold text-sm" style={{ color: ORANGE }}>{fmt(item.rev)}</span>
              </div>
            ))}
          </div>
        </GlassCard>
        <GlassCard className="p-4">
          <h3 className="font-bold text-slate-800 mb-3 text-sm" style={{ fontFamily:"'Outfit', sans-serif" }}>Peak Hours</h3>
          <div className="space-y-3">
            {peaks.map(p => (
              <div key={p.time} className="p-3 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-slate-800">{p.time}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                    style={{ backgroundColor: p.color + "20", color: p.color }}>{p.label}</span>
                </div>
                <div className="text-xs text-slate-500">Average Revenue: <span className="font-bold" style={{ color: p.color }}>{p.avg}</span></div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default Analytics;
