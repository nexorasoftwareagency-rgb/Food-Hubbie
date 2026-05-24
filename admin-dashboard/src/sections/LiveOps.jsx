import { useState, useEffect, useMemo, useCallback } from "react";
import { Zap, Clock, ChefHat, Truck } from "lucide-react";
import { ref, onValue, off, update } from "firebase/database";
import { db, Outlet } from "../firebase";
import { useRealtimeData } from "../hooks/useRealtimeData";
import GlassCard from "../components/GlassCard";
import KPICard from "../components/KPICard";
import StatusBadge from "../components/StatusBadge";
import Avatar from "../components/Avatar";
import SectionHeader from "../components/SectionHeader";
import { ORANGE, COLORS } from "../utils/constants";
import { fmt } from "../utils/formatters";

const LiveOps = ({ showToast }) => {
  const { data: orders = [] } = useRealtimeData("orders");
  const [riders, setRiders] = useState([]);

  useEffect(() => {
    const ridersRef = ref(db, "riders");
    const unsub = onValue(ridersRef, snap => {
      const val = snap.val();
      if (val) setRiders(Object.keys(val).map(k => ({ id: k, ...val[k] })));
      else setRiders([]);
    });
    return () => off(ridersRef, "value", unsub);
  }, []);

  const liveOrders = useMemo(() => orders.filter(o => !["delivered","cancelled"].includes(o.status)), [orders]);

  const accept = useCallback(async (id) => {
    try {
      await update(Outlet(`orders/${id}`), {
        status: "confirmed",
        updatedAt: new Date().toISOString()
      });
      showToast("Order confirmed!");
    } catch {
      showToast("Failed to accept order");
    }
  }, [showToast]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
        <KPICard title="Live Orders" value={liveOrders.length} icon={Zap} color={COLORS.error} />
        <KPICard title="Pending Accept" value={liveOrders.filter(o=>o.status==="pending").length} icon={Clock} color={COLORS.warning} />
        <KPICard title="In Kitchen" value={liveOrders.filter(o=>["confirmed","preparing"].includes(o.status)).length} icon={ChefHat} color={COLORS.info} />
        <KPICard title="Out for Delivery" value={liveOrders.filter(o=>o.status==="out_for_delivery").length} icon={Truck} color={COLORS.primary} />
      </div>
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="font-bold text-slate-800 text-sm" style={{ fontFamily:"'Outfit', sans-serif" }}>Live Order Feed</span>
          </div>
          <div className="space-y-3">
            {liveOrders.map(o => (
              <div key={o.id} className="p-3 rounded-xl border border-slate-100 hover:border-orange-200 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold" style={{ color: ORANGE }}>{o.id}</span>
                  <StatusBadge status={o.status} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-slate-800">{o.customerName || o.customer || "Guest"}</div>
                    <div className="text-xs text-slate-500">{(o.cart ? o.cart.length : "0")} items · {fmt(o.total)}</div>
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
            {riders.map(r => (
              <div key={r.id} className="p-3 rounded-xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <Avatar name={r.name} size={36} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-800">{r.name}</div>
                    <div className="text-xs text-slate-500">{r.vehicle || "bike"} · {r.earn ? fmt(r.earn) : "..."} today</div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1.5 text-xs font-semibold capitalize"
                      style={{ color: r.status==="online" ? COLORS.success : r.status==="busy" ? COLORS.warning : "#94a3b8" }}>
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: r.status==="online" ? COLORS.success : r.status==="busy" ? COLORS.warning : "#94a3b8" }} />
                      {r.status}
                    </div>
                    {r.currentOrderId && <div className="text-xs text-slate-500 mt-0.5">{r.currentOrderId}</div>}
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
