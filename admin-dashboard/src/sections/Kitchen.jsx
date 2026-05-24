import { useState, useEffect, useCallback, useMemo } from "react";
import { Clock, ChefHat } from "lucide-react";
import { update } from "firebase/database";
import { useRealtimeData, Outlet } from "../hooks/useRealtimeData";
import GlassCard from "../components/GlassCard";
import StatusBadge from "../components/StatusBadge";
import EmptyState from "../components/EmptyState";
import { ORANGE, ORDER_STATUSES } from "../utils/constants";
import { fmt } from "../utils/formatters";

const flow = { pending:"confirmed", confirmed:"preparing", preparing:"ready", ready:"out_for_delivery", out_for_delivery:"delivered" };
const kColors = { pending:"#f59e0b", confirmed:"#3b82f6", preparing:"#8b5cf6", ready:"#06b6d4", out_for_delivery:ORANGE };
const kLabels = { pending:"Confirm", confirmed:"Start Prep", preparing:"Mark Ready", ready:"Dispatch", out_for_delivery:"Delivered" };

const Kitchen = ({ showToast }) => {
  const { data: orders = [] } = useRealtimeData("orders");
  const [timers, setTimers] = useState({});

  const liveOrders = useMemo(() =>
    orders.filter(o => !["delivered","cancelled"].includes(o.status))
      .sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || "")),
  [orders]);

  useEffect(() => {
    const t = setInterval(() => setTimers(p => {
      const next = { ...p };
      liveOrders.forEach(o => { next[o.id] = (next[o.id] || 0) + 1; });
      return next;
    }), 60000);
    return () => clearInterval(t);
  }, [liveOrders]);

  const advance = useCallback(async (id) => {
    const o = liveOrders.find(x => x.id === id);
    if (!o || !flow[o.status]) return;
    const next = flow[o.status];
    try {
      await update(Outlet(`orders/${id}`), {
        status: next,
        updatedAt: new Date().toISOString()
      });
      showToast(`${id} -> ${ORDER_STATUSES[next]?.label || next}`);
    } catch {
      showToast("Failed to update");
    }
  }, [liveOrders, showToast]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {["pending","confirmed","preparing","ready","out_for_delivery"].map(s => (
          <div key={s} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ backgroundColor: kColors[s] + "18", color: kColors[s] }}>
            {(ORDER_STATUSES[s]?.label || s)}
            <span className="w-5 h-5 rounded-full text-white text-xs flex items-center justify-center"
              style={{ backgroundColor: kColors[s] }}>
              {liveOrders.filter(o => o.status === s).length}
            </span>
          </div>
        ))}
      </div>
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
        {liveOrders.map(o => (
          <GlassCard key={o.id} className="p-4" style={{ borderLeft: "3px solid " + (kColors[o.status] || ORANGE) }}>
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-xs font-bold" style={{ color: ORANGE }}>{o.id}</span>
              <span className="text-xs text-slate-400 flex items-center gap-1"><Clock size={10} />{timers[o.id] || 0}m</span>
            </div>
            <div className="font-bold text-slate-800 mb-1">{o.customerName || o.customer || "Guest"}</div>
            <div className="text-xs text-slate-500 mb-3">{(o.cart ? o.cart.length : "0")} items · {o.type || "delivery"} · {fmt(o.total)}</div>
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
        {liveOrders.length === 0 && <EmptyState icon={ChefHat} msg="Kitchen is clear! No active orders." />}
      </div>
    </div>
  );
};

export default Kitchen;
