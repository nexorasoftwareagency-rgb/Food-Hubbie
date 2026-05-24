import { useState, useMemo } from "react";
import { Bell, TrendingUp, Clock, Bike, ShoppingCart } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useRealtimeData } from "../hooks/useRealtimeData";
import GlassCard from "../components/GlassCard";
import KPICard from "../components/KPICard";
import StatusBadge from "../components/StatusBadge";
import Pill from "../components/Pill";
import { COLORS } from "../utils/constants";
import { fmt } from "../utils/formatters";

const Dashboard = ({ showToast }) => {
  const { data: orders = [], loading } = useRealtimeData("orders");
  const [incoming, setIncoming] = useState(false);
  const [chartPeriod, setChartPeriod] = useState("hourly");

  const todayOrders = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return orders.filter(o => o.createdAt && o.createdAt.slice(0, 10) === today);
  }, [orders]);

  const pendingOrders = useMemo(() => orders.filter(o => o.status === "pending" || o.status === "confirmed"), [orders]);
  const activeCount = pendingOrders.length;

  const todayRevenue = useMemo(() => todayOrders.reduce((s, o) => s + (o.total || 0), 0), [todayOrders]);
  const avgOrderValue = todayOrders.length ? Math.round(todayRevenue / todayOrders.length) : 0;

  const hourlyData = useMemo(() => {
    const buckets = {};
    todayOrders.forEach(o => {
      if (!o.createdAt) return;
      const h = new Date(o.createdAt).getHours();
      const key = h < 10 ? `0${h}:00` : `${h}:00`;
      if (!buckets[key]) buckets[key] = { t: key, rev: 0, ord: 0 };
      buckets[key].rev += o.total || 0;
      buckets[key].ord += 1;
    });
    return Object.values(buckets).sort((a, b) => a.t.localeCompare(b.t));
  }, [todayOrders]);

  const weekData = useMemo(() => {
    const buckets = {};
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    orders.forEach(o => {
      if (!o.createdAt) return;
      const d = new Date(o.createdAt);
      const key = days[d.getDay()];
      if (!buckets[key]) buckets[key] = { d: key, rev: 0, ord: 0 };
      buckets[key].rev += o.total || 0;
      buckets[key].ord += 1;
    });
    return days.filter(d => buckets[d]).map(d => buckets[d]);
  }, [orders]);

  const chartData = chartPeriod === "hourly" ? hourlyData : weekData;
  const hasChartData = chartData.length > 0;

  return (
    <div className="space-y-5">
      {incoming && (
        <div className="rounded-2xl p-4 flex items-center gap-4 text-white"
          style={{ background: "linear-gradient(135deg, #f36b21, #c45a18)", animation: "pulse 2s infinite" }}>
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <Bell size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm">New Order - ORD-1009</div>
            <div className="text-xs text-white/80 truncate">Neha Gupta · ₹380 · Delivery</div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => { setIncoming(false); showToast("Order accepted!"); }}
              className="px-3 py-1.5 rounded-xl bg-white text-orange-600 text-xs font-bold">Accept</button>
            <button onClick={() => setIncoming(false)}
              className="px-3 py-1.5 rounded-xl bg-white/20 text-xs font-bold">Dismiss</button>
          </div>
        </div>
      )}
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
        <KPICard title="Today's Revenue" value={fmt(todayRevenue)} sub={`${todayOrders.length} orders completed`} icon={TrendingUp} trend={12.4} />
        <KPICard title="Pending Orders" value={String(activeCount)} sub={activeCount > 0 ? `${Math.min(activeCount, 3)} urgent, ${Math.max(activeCount - 3, 0)} normal` : "All clear"} icon={Clock} trend={-4} color={COLORS.warning} />
        <KPICard title="Live Orders" value={String(orders.filter(o => !["delivered","cancelled"].includes(o.status)).length)} icon={Bike} color={COLORS.info} />
        <KPICard title="Avg Order Value" value={fmt(avgOrderValue)} sub="today" icon={ShoppingCart} trend={7.5} color={COLORS.success} />
      </div>
      <GlassCard className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800" style={{ fontFamily: "'Outfit', sans-serif" }}>Revenue & Orders</h3>
          <div className="flex gap-2">
            <Pill label="Hourly" active={chartPeriod === "hourly"} onClick={() => setChartPeriod("hourly")} />
            <Pill label="Weekly" active={chartPeriod === "weekly"} onClick={() => setChartPeriod("weekly")} />
          </div>
        </div>
        {hasChartData ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f36b21" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#f36b21" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey={chartPeriod === "hourly" ? "t" : "d"} tick={{ fontSize:10, fill:"#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:10, fill:"#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v/1000}k`} width={45} />
              <Tooltip formatter={(v, n) => [n === "rev" ? fmt(v) : v, n === "rev" ? "Revenue" : "Orders"]} />
              <Area type="monotone" dataKey="rev" stroke="#f36b21" strokeWidth={2.5} fill="url(#grad1)" />
              <Area type="monotone" dataKey="ord" stroke="#3b82f6" strokeWidth={1.5} fill="none" strokeDasharray="4 2" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-48 text-slate-400 text-sm">No order data yet. Start taking orders!</div>
        )}
      </GlassCard>
    </div>
  );
};

export default Dashboard;
