import { useState, useEffect, useCallback } from "react";
import { Zap, Clock, ChefHat, Truck } from "lucide-react";
import GlassCard from "../components/GlassCard";
import KPICard from "../components/KPICard";
import StatusBadge from "../components/StatusBadge";
import Avatar from "../components/Avatar";
import SectionHeader from "../components/SectionHeader";
import { ORANGE, COLORS, ORDER_STATUSES } from "../utils/constants";
import { fmt } from "../utils/formatters";

const MOCK_ORDERS = [
  { id:"ORD-1001", customer:"Rahul Sharma", items:3, total:485, status:"pending", type:"delivery", time:"2 min ago" },
  { id:"ORD-1002", customer:"Priya Singh", items:2, total:320, status:"preparing", type:"dinein", time:"8 min ago" },
  { id:"ORD-1003", customer:"Amit Kumar", items:5, total:890, status:"out_for_delivery", type:"delivery", time:"15 min ago" },
  { id:"ORD-1005", customer:"Deepak Jha", items:4, total:640, status:"confirmed", type:"delivery", time:"5 min ago" },
  { id:"ORD-1007", customer:"Vikram Pandey", items:6, total:1120, status:"ready", type:"delivery", time:"12 min ago" },
  { id:"ORD-1008", customer:"Neha Gupta", items:2, total:390, status:"pending", type:"dinein", time:"1 min ago" },
];

const MOCK_RIDERS = [
  { id:"r1", name:"Rajesh Kumar", vehicle:"bike", status:"online", earn:1840, deliv:12, order:"ORD-1003" },
  { id:"r2", name:"Suresh Yadav", vehicle:"scooty", status:"busy", earn:2100, deliv:15, order:"ORD-1007" },
  { id:"r3", name:"Mohan Singh", vehicle:"bike", status:"offline", earn:980, deliv:7, order:null },
  { id:"r4", name:"Ramesh Thakur", vehicle:"cycle", status:"online", earn:1560, deliv:11, order:null },
];

const LiveOps = ({ showToast }) => {
  const [orders, setOrders] = useState(MOCK_ORDERS);

  useEffect(() => {
    const t = setInterval(() => {
      setOrders(prev => [...prev]);
    }, 5000);
    return () => clearInterval(t);
  }, []);

  const accept = useCallback((id) => {
    setOrders(prev => prev.map(o => o.id === id && o.status === "pending" ? { ...o, status:"confirmed" } : o));
    showToast("Order confirmed!");
  }, [showToast]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
        <KPICard title="Live Orders" value={orders.length} icon={Zap} color={COLORS.error} />
        <KPICard title="Pending Accept" value={orders.filter(o=>o.status==="pending").length} icon={Clock} color={COLORS.warning} />
        <KPICard title="In Kitchen" value={orders.filter(o=>["confirmed","preparing"].includes(o.status)).length} icon={ChefHat} color={COLORS.info} />
        <KPICard title="Out for Delivery" value={orders.filter(o=>o.status==="out_for_delivery").length} icon={Truck} color={COLORS.primary} />
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="font-bold text-slate-800 text-sm" style={{ fontFamily:"'Outfit', sans-serif" }}>Live Order Feed</span>
          </div>
          <div className="space-y-3">
            {orders.map(o => (
              <div key={o.id} className="p-3 rounded-xl border border-slate-100 hover:border-orange-200 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold" style={{ color: ORANGE }}>{o.id}</span>
                  <StatusBadge status={o.status} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-slate-800">{o.customer}</div>
                    <div className="text-xs text-slate-500">{o.items} items · {fmt(o.total)} · {o.time}</div>
                  </div>
                  {o.status === "pending" && (
                    <button onClick={() => accept(o.id)}
                      className="px-3 py-1 rounded-lg text-xs font-bold text-white ml-2 flex-shrink-0"
                      style={{ backgroundColor: ORANGE }}>Accept</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <SectionHeader title="Rider Activity" />
          <div className="space-y-3">
            {MOCK_RIDERS.map(r => (
              <div key={r.id} className="p-3 rounded-xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <Avatar name={r.name} size={36} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-800">{r.name}</div>
                    <div className="text-xs text-slate-500">{r.vehicle} · {fmt(r.earn)} today</div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1.5 text-xs font-semibold capitalize"
                      style={{ color: r.status==="online" ? COLORS.success : r.status==="busy" ? COLORS.warning : "#94a3b8" }}>
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: r.status==="online" ? COLORS.success : r.status==="busy" ? COLORS.warning : "#94a3b8" }} />
                      {r.status}
                    </div>
                    {r.order && <div className="text-xs text-slate-500 mt-0.5">{r.order}</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default LiveOps;
