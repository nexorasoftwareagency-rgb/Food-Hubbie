import { useState, useMemo } from "react";
import { ShoppingBag, TrendingUp, TrendingDown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useRealtimeData } from "../hooks/useRealtimeData";
import GlassCard from "../components/GlassCard";
import KPICard from "../components/KPICard";
import Pill from "../components/Pill";
import { COLORS } from "../utils/constants";
import { fmt } from "../utils/formatters";

const LostSales = () => {
  const { data: orders = [] } = useRealtimeData("orders");
  const [sortBy, setSortBy] = useState("count");

  const cancelled = useMemo(() => orders.filter(o => o.status === "cancelled"), [orders]);

  const items = useMemo(() => {
    const map = {};
    cancelled.forEach(o => {
      if (o.cart) o.cart.forEach(c => {
        const name = c.name || "Unknown";
        if (!map[name]) map[name] = { skips: 0, revenue: 0 };
        map[name].skips += c.qty || 1;
        map[name].revenue += (c.price || 0) * (c.qty || 1);
      });
    });
    return Object.entries(map).map(([name, data]) => ({ name, ...data }));
  }, [cancelled]);

  const sorted = useMemo(() => {
    const arr = [...items];
    if (sortBy === "revenue") arr.sort((a, b) => b.revenue - a.revenue);
    else arr.sort((a, b) => b.skips - a.skips);
    return arr;
  }, [items, sortBy]);

  const totalLost = useMemo(() => items.reduce((s, i) => s + i.revenue, 0), [items]);
  const totalSkips = useMemo(() => items.reduce((s, i) => s + i.skips, 0), [items]);

  const dailyData = useMemo(() => {
    const buckets = {};
    const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    cancelled.forEach(o => {
      if (!o.createdAt) return;
      const d = days[new Date(o.createdAt).getDay()];
      if (!buckets[d]) buckets[d] = { day: d, lost: 0 };
      buckets[d].lost += o.total || 0;
    });
    return days.filter(d => buckets[d]).map(d => buckets[d]);
  }, [cancelled]);

  return (
    <div className="space-y-5">
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
        <KPICard title="Lost Revenue (Total)" value={fmt(totalLost)} icon={ShoppingBag} trend={-12.4} color={COLORS.error} />
        <KPICard title="Items Skipped" value={totalSkips.toString()} icon={TrendingDown} color={COLORS.warning} />
        <KPICard title="Cancelled Orders" value={cancelled.length.toString()} icon={TrendingUp} trend={8.2} color={COLORS.success} />
      </div>
      <div className="flex gap-2">
        {["count","revenue"].map(s => (
          <Pill key={s} label={s === "count" ? "By Count" : "By Revenue"} active={sortBy === s} onClick={() => setSortBy(s)} />
        ))}
      </div>
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
        <GlassCard className="p-4">
          <h3 className="font-bold text-slate-800 mb-3 text-sm" style={{ fontFamily:"'Outfit', sans-serif" }}>Lost Sales Breakdown</h3>
          <div className="space-y-3">
            {sorted.slice(0, 10).map((item, i) => (
              <div key={item.name} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: i < 3 ? COLORS.error : "#94a3b8" }}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-800">{item.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold" style={{ color: COLORS.error }}>{fmt(item.revenue)}</div>
                  <div className="text-xs text-slate-500">{item.skips} skips</div>
                </div>
              </div>
            ))}
            {sorted.length === 0 && <div className="text-sm text-slate-400 text-center py-4">No cancelled orders yet</div>}
          </div>
        </GlassCard>
        <GlassCard className="p-4">
          <h3 className="font-bold text-slate-800 mb-3 text-sm" style={{ fontFamily:"'Outfit', sans-serif" }}>Daily Lost Revenue</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize:10, fill:"#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:10, fill:"#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v/1000}k`} width={40} />
              <Tooltip formatter={v => [fmt(v), "Lost Revenue"]} />
              <Bar dataKey="lost" fill="#ef4444" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>
    </div>
  );
};

export default LostSales;
