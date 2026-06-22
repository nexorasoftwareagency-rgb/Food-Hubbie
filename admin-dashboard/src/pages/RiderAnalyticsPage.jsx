import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Bike, Wallet, DollarSign, Clock, Truck, Download, Star } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { db, get, ref, update, push, serverTimestamp, onValue, off, query, orderByChild, equalTo, logAudit, getCurrentAdminActor, Outlet, getBizId, getOutletId } from "../firebase";
import { fmt, downloadCSV } from "../utils";
import { KPICard, SectionHeader, StatusBadge, GlassCard, BtnPrimary, BtnSecondary, Avatar, Input, Select, Pagination } from "../components";
import { ORANGE, COLORS } from "../constants";
import "../App.css";

function RiderAnalyticsPage({ showToast }) {
  const [riders, setRiders] = useState([]);
  const [selectedRider, setSelectedRider] = useState("");
  const today = new Date().toISOString().split("T")[0];
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
  const [fromDate, setFromDate] = useState(weekAgo);
  const [toDate, setToDate] = useState(today);
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ totalEarnings: 0, deliveredCount: 0, avgTime: 0, avgRating: null, pendingCash: 0 });
  const [generated, setGenerated] = useState(false);
  const DELIVERY_PAGE_SIZE = 20;
  const [deliveryPage, setDeliveryPage] = useState(1);
  const deliveryTotalPages = Math.max(1, Math.ceil(orders.length / DELIVERY_PAGE_SIZE));
  useEffect(() => { setDeliveryPage(1); }, [orders.length]);
  const paginatedDeliveries = orders.slice((deliveryPage - 1) * DELIVERY_PAGE_SIZE, deliveryPage * DELIVERY_PAGE_SIZE);

  useEffect(() => {
    const r = ref(db, "riders");
    const unsub = onValue(r, snap => {
      const v = snap.val() || {};
      setRiders(Object.keys(v).map(k => ({ id: k, ...v[k] })));
    });
    return () => off(r, "value", unsub);
  }, []);

  const generateReport = useCallback(async () => {
    if (!selectedRider) return showToast("Select a rider first", "warning");
    if (!fromDate || !toDate) return showToast("Select both dates", "warning");
    if (new Date(fromDate) > new Date(toDate)) return showToast("Start date must be before end date", "warning");
    setLoading(true);
    setOrders([]);
    try {
      const snap = await get(query(Outlet("orders"), orderByChild("riderId"), equalTo(selectedRider)));
      const all = [];
      snap.forEach(ch => {
        const o = ch.val();
        if (!o) return;
        const dateStr = o.createdAt ? new Date(o.createdAt).toISOString().split("T")[0] : "";
        if (dateStr >= fromDate && dateStr <= toDate) {
          const duration = (o.pickedUpAt && o.deliveredAt) ? Math.round((o.deliveredAt - o.pickedUpAt) / 60000) : null;
          all.push({ id: ch.key, duration, orderId: ch.key ? ch.key.slice(-5) : "N/A", ...o });
        }
      });
      all.sort((a, b) => {
        const at = typeof a.createdAt === "number" ? a.createdAt : new Date(a.createdAt).getTime() || 0;
        const bt = typeof b.createdAt === "number" ? b.createdAt : new Date(b.createdAt).getTime() || 0;
        return bt - at;
      });
      let totalEarnings = 0, deliveredCount = 0, totalDeliveryTime = 0, deliveryTimeCount = 0, pendingCash = 0;
      all.forEach(o => {
        if (o.status === "Delivered") {
          deliveredCount++;
          totalEarnings += Number(o.deliveryFee) || 0;
          if ((o.paymentMethod || "").toUpperCase() === "CASH" && !o.settled) pendingCash += Number(o.total || 0);
          if (o.pickedUpAt && o.deliveredAt) {
            const d = (o.deliveredAt - o.pickedUpAt) / 60000;
            if (d > 0 && d < 300) { totalDeliveryTime += d; deliveryTimeCount++; }
          }
        }
      });
      const riderSnap = await get(ref(db, `riders/${selectedRider}`));
      const riderData = riderSnap.val() || {};
      setStats({
        totalEarnings,
        deliveredCount,
        avgTime: deliveryTimeCount > 0 ? Math.round(totalDeliveryTime / deliveryTimeCount) : 0,
        avgRating: riderData.avgRating || riderData.rating || null,
        pendingCash,
      });
      setOrders(all);
      setGenerated(true);
      showToast(`Found ${all.length} deliveries`, "success");
    } catch (e) { showToast("Error: " + e.message, "error"); }
    finally { setLoading(false); }
  }, [selectedRider, fromDate, toDate, showToast]);

  const selectedRiderInfo = riders.find(r => r.id === selectedRider);

  const earningsData = useMemo(() => {
    const daily = {};
    orders.forEach(o => {
      if (o.status === "Delivered") {
        const d = o.createdAt ? new Date(o.createdAt).toISOString().split("T")[0] : "";
        daily[d] = (daily[d] || 0) + (Number(o.deliveryFee) || 0);
      }
    });
    return Object.keys(daily).sort().map(d => ({ date: d.slice(5), earnings: daily[d] }));
  }, [orders]);

  const exportExcel = useCallback(() => {
    if (!orders.length) return showToast("No data to export", "warning");
    const rows = orders.map(d => ({
      Date: d.createdAt ? new Date(d.createdAt).toLocaleDateString() : "",
      Time: d.createdAt ? new Date(d.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "",
      "Order #": d.orderId || d.id,
      Customer: d.customerName || "Guest",
      Amount: d.total || 0,
      Earning: d.deliveryFee || 0,
      Duration: d.duration ? `${d.duration}m` : "--",
      Status: d.status || "",
    }));
    downloadCSV(`rider-report-${selectedRider}-${fromDate}-to-${toDate}.csv`, rows);
    showToast("Excel exported", "success");
  }, [orders, selectedRider, fromDate, toDate, showToast]);

  const exportPDF = useCallback(() => {
    if (!orders.length) return showToast("No data to export", "warning");
    const riderName = selectedRiderInfo?.name || "Rider";
    try {
      if (!window.jspdf) return showToast("PDF library not loaded", "error");
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.setTextColor(232, 73, 8);
      doc.text("Rider Performance Report", 14, 22);
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Rider: ${riderName}`, 14, 30);
      doc.text(`Period: ${fromDate} to ${toDate}`, 14, 35);
      doc.text(`Total Earnings: ${fmt(stats.totalEarnings)} | Deliveries: ${stats.deliveredCount} | Avg Time: ${stats.avgTime}m`, 14, 42);
      const rows = orders.slice(0, 50).map(d => [
        d.createdAt ? new Date(d.createdAt).toLocaleDateString() : "",
        d.orderId || d.id,
        d.customerName || "Guest",
        d.duration ? `${d.duration}m` : "--",
        `₹${Number(d.deliveryFee || 0)}`,
      ]);
      doc.autoTable({
        head: [["Date", "Order #", "Customer", "Duration", "Earnings"]],
        body: rows,
        startY: 48,
        theme: "grid",
        headStyles: { fillColor: [232, 73, 8] },
      });
      doc.save(`Rider_Report_${riderName.replace(/\s+/g, "_")}_${fromDate}_to_${toDate}.pdf`);
      showToast("PDF exported", "success");
    } catch (e) { showToast("PDF export failed: " + e.message, "error"); }
  }, [orders, selectedRiderInfo, fromDate, toDate, stats, showToast]);

  const settleCash = useCallback(async () => {
    if (!selectedRider) return showToast("Select a rider first", "warning");
    if (stats.pendingCash <= 0) return showToast("No pending cash to settle", "info");
    if (!confirm(`Settle ${fmt(stats.pendingCash)} for ${selectedRiderInfo?.name || "rider"}?`)) return;
    try {
      const snap = await get(ref(db, `riders/${selectedRider}`));
      const prev = snap.val() || {};
      const newEarn = Math.max(0, Number(prev.todayEarnings || 0) - stats.pendingCash);
      await update(ref(db, `riders/${selectedRider}`), { todayEarnings: newEarn });
      const settleRef = push(Outlet("settlements") || ref(db, "system/settlements"), {
        riderId: selectedRider,
        riderName: selectedRiderInfo?.name || "",
        amount: stats.pendingCash,
        type: "wallet_settle",
        settledBy: getCurrentAdminActor()?.email || "admin",
        settledAt: serverTimestamp(),
      });
      logAudit(getBizId(), getOutletId(), "settle_rider_wallet_analytics", { riderId: selectedRider, amount: stats.pendingCash }, getCurrentAdminActor());
      showToast(`Settled ${fmt(stats.pendingCash)} for ${selectedRiderInfo?.name || "rider"}`, "success");
      setStats(s => ({ ...s, pendingCash: 0 }));
    } catch (e) { showToast("Settle failed: " + e.message, "error"); }
  }, [selectedRider, selectedRiderInfo, stats.pendingCash, showToast]);

  return (
    <div className="space-y-4">
      <GlassCard className="p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div style={{ flex: 1, minWidth: 180 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Rider</label>
            <Select value={selectedRider} onChange={e => setSelectedRider(e.target.value)}>
              <option value="">Select a Rider...</option>
              {riders.map(r => <option key={r.id} value={r.id}>{r.name || r.email || r.id} ({r.status || "Offline"})</option>)}
            </Select>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>From</label>
            <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} style={{ width: 160 }} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>To</label>
            <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} style={{ width: 160 }} />
          </div>
          <BtnPrimary onClick={generateReport} disabled={loading || !selectedRider} style={{ padding: "10px 20px" }}>
            {loading ? "Analyzing..." : "Generate Report"}
          </BtnPrimary>
          <BtnSecondary onClick={exportExcel} disabled={!generated}><Download size={13} style={{ marginRight: 4 }} />Export Excel</BtnSecondary>
          <BtnSecondary onClick={exportPDF} disabled={!generated}><Download size={13} style={{ marginRight: 4 }} />Export PDF</BtnSecondary>
        </div>
      </GlassCard>

      {generated && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
            <KPICard title="Total Earnings" value={fmt(stats.totalEarnings)} icon={Wallet} color={COLORS.success} />
            <KPICard title="Deliveries" value={stats.deliveredCount} icon={Truck} color={COLORS.info} />
            <KPICard title="Avg Delivery Time" value={`${stats.avgTime}m`} icon={Clock} color={COLORS.warning} />
            <KPICard title="Rating" value={stats.avgRating != null ? stats.avgRating : "N/A"} icon={Star} color="#f59e0b" />
            <KPICard title="Pending Cash" value={fmt(stats.pendingCash)} icon={DollarSign} color={stats.pendingCash > 0 ? COLORS.error : COLORS.success} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: earningsData.length > 0 ? "1.6fr 1fr" : "1fr", gap: 16 }}>
            <GlassCard className="p-5">
              <SectionHeader title="Daily Earnings" />
              {earningsData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={earningsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}`} />
                    <Tooltip formatter={v => [fmt(v), "Earnings"]} contentStyle={{ borderRadius: 12, border: "none" }} />
                    <Bar dataKey="earnings" fill={ORANGE} radius={[4, 4, 0, 0]} maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ textAlign: "center", padding: 40, color: "#94a3b8", fontSize: 13 }}>No earnings data to chart</div>
              )}
            </GlassCard>

            {selectedRiderInfo && (
              <GlassCard className="p-5">
                <SectionHeader title="Rider Summary" />
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 10 }}>
                  <Avatar name={selectedRiderInfo.name || selectedRiderInfo.email} size={56} />
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>{selectedRiderInfo.name}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>{selectedRiderInfo.email || ""}</div>
                    <div className="flex items-center gap-1 justify-center mt-1">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedRiderInfo.status === "Online" ? COLORS.success : "#94a3b8" }} />
                      <span style={{ fontSize: 11, fontWeight: 600, color: selectedRiderInfo.status === "Online" ? COLORS.success : "#94a3b8" }}>{selectedRiderInfo.status || "Offline"}</span>
                    </div>
                  </div>
                  <div style={{ width: "100%", borderTop: "1px dashed #e2e8f0", paddingTop: 10, marginTop: 4 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 12 }}>
                      <span style={{ color: "#64748b" }}>Delivered Orders</span>
                      <span style={{ fontWeight: 700, color: COLORS.success }}>{stats.deliveredCount}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 12 }}>
                      <span style={{ color: "#64748b" }}>Avg. Delivery Time</span>
                      <span style={{ fontWeight: 700, color: ORANGE }}>{stats.avgTime}m</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 12 }}>
                      <span style={{ color: "#64748b" }}>Total Earnings</span>
                      <span style={{ fontWeight: 700, color: COLORS.success }}>{fmt(stats.totalEarnings)}</span>
                    </div>
                  </div>
                  {stats.pendingCash > 0 && (
                    <BtnPrimary onClick={settleCash} style={{ width: "100%" }}>
                      Settle Cash ({fmt(stats.pendingCash)})
                    </BtnPrimary>
                  )}
                </div>
              </GlassCard>
            )}
          </div>

          <GlassCard style={{ overflow: "hidden" }}>
            <div className="sheet-toolbar">
              <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Deliveries ({orders.length})</span>
            </div>
            <div className="sheet-table-wrap">
              <table className="sheet-table">
                <thead><tr>
                  <th className="sheet-row-number">#</th>
                  <th>Date</th>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Earning</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr></thead>
                <tbody>
                  {paginatedDeliveries.map((o, i) => {
                    const globalIdx = (deliveryPage - 1) * DELIVERY_PAGE_SIZE + i + 1;
                    return <tr key={o.id}>
                      <td className="sheet-row-number">{globalIdx}</td>
                      <td>{o.createdAt ? new Date(o.createdAt).toLocaleDateString("en-IN") : ""}</td>
                      <td className="sheet-cell-strong" style={{ color: ORANGE, fontFamily: "monospace" }}>#{o.orderId || o.id}</td>
                      <td>{o.customerName || "Guest"}</td>
                      <td className="sheet-cell-strong" style={{ textAlign: "right" }}>{fmt(o.total)}</td>
                      <td className="sheet-cell-strong" style={{ textAlign: "right", color: COLORS.success }}>{fmt(o.deliveryFee || 0)}</td>
                      <td>{o.duration ? `${o.duration}m` : "--"}</td>
                      <td><StatusBadge status={o.status} /></td>
                    </tr>;
                  })}
                </tbody>
              </table>
            </div>
            {orders.length === 0 && <div style={{ textAlign: "center", padding: 40, color: "#94a3b8", fontSize: 13 }}>No deliveries found for this period</div>}
            <Pagination page={deliveryPage} totalPages={deliveryTotalPages} onPageChange={setDeliveryPage} totalItems={orders.length} pageSize={DELIVERY_PAGE_SIZE} />
          </GlassCard>
        </>
      )}

      {!generated && !loading && (
        <GlassCard className="p-8">
          <div style={{ textAlign: "center", color: "#94a3b8", padding: 16 }}>
            <Bike size={40} style={{ margin: "0 auto 12px", opacity: 0.25 }} />
            <div style={{ fontSize: 14, fontWeight: 500 }}>Select a rider and date range, then click Generate Report</div>
          </div>
        </GlassCard>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PAYMENTS PAGE
// ═══════════════════════════════════════════════════════════════════════════

export default RiderAnalyticsPage;