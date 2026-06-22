import React, { useState, useEffect, useCallback } from "react";
import { TrendingDown, Phone, AlertTriangle, Download, XCircle } from "lucide-react";
import { onValue, off, Outlet } from "../firebase";
import { fmt, downloadCSV, relTime } from "../utils";
import { KPICard, GlassCard, Avatar, SkeletonPage } from "../components";
import { COLORS } from "../constants";
import "../App.css";

function LostSalesPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const r = Outlet("orders");
    if (!r) { setLoading(false); return; }
    const unsub = onValue(r, snap => {
      const v = snap.val() || {};
      setOrders(Object.keys(v).map(k => ({ id: k, ...v[k] })).filter(o => String(o.status).toLowerCase() === "cancelled"));
      setLoading(false);
    }, () => setLoading(false));
    return () => off(r, "value", unsub);
  }, []);

  const totalLoss = orders.reduce((s, o) => s + (Number(o.total) || 0), 0);
  const exportCSV = useCallback(() => {
    downloadCSV(`lost-sales-${new Date().toISOString().slice(0,10)}.csv`, orders.map((o, i) => ({
      row: i + 1, orderId: o.orderId || o.id, customer: o.customerName || "Guest", phone: o.phone || "", total: o.total, cancelledAt: o.cancelledAt || o.updatedAt || o.createdAt,
    })));
  }, [orders]);

  if (loading) return <SkeletonPage kpi={3} table={5} />;

  return (
    <div className="space-y-4">
      <div className="sheet-toolbar">
        <div style={{ fontSize:12, color:"#94a3b8" }}>Path: <code>businesses/.../orders</code> where status=Cancelled</div>
        <button type="button" className="sheet-button" onClick={exportCSV}><Download size={14} /> Export CSV</button>
      </div>
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
        <KPICard title="Total Loss" value={fmt(totalLoss)} icon={TrendingDown} color={COLORS.error} />
        <KPICard title="Cancelled Orders" value={orders.length} icon={XCircle} color={COLORS.warning} />
        <KPICard title="Avg Loss/Order" value={orders.length ? fmt(Math.round(totalLoss / orders.length)) : fmt(0)} icon={AlertTriangle} />
      </div>
      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: 480 }}>
            <thead>
              <tr className="border-b border-slate-100">
                {["Order ID","Customer","Phone","Time","Loss"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 && <tr><td colSpan={5} style={{ textAlign:"center", padding:32, color:"#94a3b8" }}>No cancelled orders yet 🎉<br/><span style={{ fontSize:11 }}>Path: <code>businesses/.../orders</code> (filter: status === &quot;Cancelled&quot;)</span></td></tr>}
              {orders.map(l => (
                <tr key={l.id} className="border-b border-slate-50 hover:bg-red-50/20">
                  <td className="px-4 py-3 font-mono text-xs font-bold text-red-400">{l.orderId || l.id.slice(-6)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={l.customerName || "Guest"} size={28} />
                      <span className="font-medium text-slate-800">{l.customerName || "Guest"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{l.phone || "—"}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{relTime(l.cancelledAt || l.updatedAt || l.createdAt)}</td>
                  <td className="px-4 py-3 font-bold text-red-500">-{fmt(l.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SETTLEMENTS PAGE
// ═══════════════════════════════════════════════════════════════════════════

export default LostSalesPage;