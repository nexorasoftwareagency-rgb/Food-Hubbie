import { useState, useEffect, useCallback } from "react";
import { Clock } from "lucide-react";
import GlassCard from "../components/GlassCard";
import StatusBadge from "../components/StatusBadge";
import EmptyState from "../components/EmptyState";
import { ChefHat } from "lucide-react";
import { ORANGE, ORDER_STATUSES } from "../utils/constants";
import { fmt } from "../utils/formatters";

const MOCK_ORDERS = [
  { id:"ORD-1001", customer:"Rahul Sharma", items:3, total:485, status:"pending", type:"delivery", time:"2 min ago" },
  { id:"ORD-1002", customer:"Priya Singh", items:2, total:320, status:"preparing", type:"dinein", time:"8 min ago" },
  { id:"ORD-1003", customer:"Amit Kumar", items:5, total:890, status:"out_for_delivery", type:"delivery", time:"15 min ago" },
  { id:"ORD-1005", customer:"Deepak Jha", items:4, total:640, status:"confirmed", type:"delivery", time:"5 min ago" },
  { id:"ORD-1007", customer:"Vikram Pandey", items:6, total:1120, status:"ready", type:"delivery", time:"12 min ago" },
  { id:"ORD-1008", customer:"Neha Gupta", items:2, total:390, status:"pending", type:"dinein", time:"1 min ago" },
];

const Kitchen = ({ showToast }) => {
  const [orders, setOrders] = useState(MOCK_ORDERS);
  const [timers, setTimers] = useState({});

  useEffect(() => {
    const t = setInterval(() => setTimers(p => {
      const next = { ...p };
      orders.forEach(o => { next[o.id] = (next[o.id] || 0) + 1; });
      return next;
    }), 60000);
    return () => clearInterval(t);
  }, [orders]);

  const flow = { pending:"confirmed", confirmed:"preparing", preparing:"ready", ready:"out_for_delivery", out_for_delivery:"delivered" };
  const kColors = { pending:"#f59e0b", confirmed:"#3b82f6", preparing:"#8b5cf6", ready:"#06b6d4", out_for_delivery:ORANGE };
  const kLabels = { pending:"Confirm", confirmed:"Start Prep", preparing:"Mark Ready", ready:"Dispatch", out_for_delivery:"Delivered" };

  const advance = useCallback((id) => {
    setOrders(prev => {
      const o = prev.find(x => x.id === id);
      if (!o || !flow[o.status]) return prev;
      const next = flow[o.status];
      showToast(`${id} → ${ORDER_STATUSES[next]?.label}`);
      if (next === "delivered") return prev.filter(x => x.id !== id);
      return prev.map(x => x.id === id ? { ...x, status: next } : x);
    });
  }, [showToast]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {["pending","confirmed","preparing","ready","out_for_delivery"].map(s => (
          <div key={s} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ backgroundColor: `${kColors[s]}18`, color: kColors[s] }}>
            {ORDER_STATUSES[s].label}
            <span className="w-5 h-5 rounded-full text-white text-xs flex items-center justify-center"
              style={{ backgroundColor: kColors[s] }}>
              {orders.filter(o => o.status === s).length}
            </span>
          </div>
        ))}
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
        {orders.map(o => (
          <GlassCard key={o.id} className="p-4" style={{ borderLeft: `3px solid ${kColors[o.status] || ORANGE}` }}>
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-xs font-bold" style={{ color: ORANGE }}>{o.id}</span>
              <span className="text-xs text-slate-400 flex items-center gap-1"><Clock size={10} />{timers[o.id] || 0}m</span>
            </div>
            <div className="font-bold text-slate-800 mb-1">{o.customer}</div>
            <div className="text-xs text-slate-500 mb-3">{o.items} items · {o.type} · {fmt(o.total)}</div>
            <StatusBadge status={o.status} />
            {flow[o.status] && (
              <button onClick={() => advance(o.id)}
                className="w-full mt-3 py-2 rounded-xl text-xs font-bold text-white"
                style={{ backgroundColor: kColors[o.status] }}>
                {kLabels[o.status]}
              </button>
            )}
          </GlassCard>
        ))}
        {orders.length === 0 && <EmptyState icon={ChefHat} msg="Kitchen is clear! No active orders." />}
      </div>
    </div>
  );
};

export default Kitchen;
