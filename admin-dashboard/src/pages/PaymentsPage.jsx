import React, { useState, useEffect, useCallback } from "react";
import { CreditCard, X, Wallet, DollarSign, CheckCircle, AlertTriangle, Download, Smartphone } from "lucide-react";
import { update, onValue, off, logAudit, getCurrentAdminActor, Outlet, getBizId, getOutletId } from "../firebase";
import { fmt, downloadCSV } from "../utils";
import { KPICard, Pill, StatusBadge, GlassCard, BtnPrimary, BtnSecondary, Modal, Pagination } from "../components";
import { COLORS, PAYMENT_PAGE_SIZE } from "../constants";
import "../App.css";

function PaymentsPage({ showToast }) {
  const [orders, setOrders] = useState([]);
  const [methodFilter, setMethodFilter] = useState("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [payPage, setPayPage] = useState(1);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeOrder, setDisputeOrder] = useState(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const r = Outlet("orders");
    if (!r) return;
    const unsub = onValue(r, snap => {
      const v = snap.val();
      setOrders(v ? Object.keys(v).map(k => ({ id: k, ...v[k] })).filter(o => o.status === "Delivered") : []);
    });
    return () => off(r, "value", unsub);
  }, []);

  useEffect(() => { setPayPage(1); }, [methodFilter, fromDate, toDate]);

  const filtered = orders.filter(o => {
    if (methodFilter !== "All" && (o.paymentMethod || "Cash") !== methodFilter) return false;
    if (fromDate && o.createdAt && new Date(o.createdAt).toISOString().slice(0, 10) < fromDate) return false;
    if (toDate && o.createdAt && new Date(o.createdAt).toISOString().slice(0, 10) > toDate) return false;
    return true;
  });

  const totalCollected = filtered.reduce((s, o) => s + (Number(o.total) || 0), 0);
  const cashTotal = filtered.filter(o => (o.paymentMethod || "Cash") === "Cash").reduce((s, o) => s + (Number(o.total) || 0), 0);
  const cardTotal = filtered.filter(o => o.paymentMethod === "Card").reduce((s, o) => s + (Number(o.total) || 0), 0);
  const upiTotal = filtered.filter(o => o.paymentMethod === "UPI").reduce((s, o) => s + (Number(o.total) || 0), 0);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAYMENT_PAGE_SIZE));
  const pageOrders = filtered.slice((payPage - 1) * PAYMENT_PAGE_SIZE, payPage * PAYMENT_PAGE_SIZE);

  const handleReconcile = useCallback(async (o) => {
    try {
      await update(Outlet(`orders/${o.id}`), { reconciled: true, reconciledAt: Date.now() });
      logAudit(getBizId(), getOutletId(), "payment_reconciled", { orderId: o.id, amount: o.total }, getCurrentAdminActor());
      showToast("Payment reconciled", "success");
    } catch(e) { showToast("Failed", "error"); }
  }, [showToast]);

  const handleDispute = useCallback(async () => {
    if (!disputeOrder || !disputeReason.trim()) return showToast("Enter a dispute reason", "warning");
    setSaving(true);
    try {
      await update(Outlet(`orders/${disputeOrder.id}`), { disputed: true, disputeReason: disputeReason.trim(), disputedAt: Date.now() });
      logAudit(getBizId(), getOutletId(), "payment_disputed", { orderId: disputeOrder.id, reason: disputeReason.trim() }, getCurrentAdminActor());
      showToast("Payment flagged as disputed", "success");
      setDisputeOpen(false);
      setDisputeOrder(null);
      setDisputeReason("");
    } catch(e) { showToast("Failed", "error"); }
    finally { setSaving(false); }
  }, [disputeOrder, disputeReason, showToast]);

  const openDispute = useCallback((o) => {
    setDisputeOrder(o);
    setDisputeReason("");
    setDisputeOpen(true);
  }, []);

  return (
    <div className="space-y-4">
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
        <KPICard title="Total Collected" value={fmt(totalCollected)} icon={Wallet} color={COLORS.success} sub={`${filtered.length} deliveries`} />
        <KPICard title="Cash" value={fmt(cashTotal)} icon={DollarSign} color={COLORS.info} />
        <KPICard title="Card" value={fmt(cardTotal)} icon={CreditCard} color="#8b5cf6" />
        <KPICard title="UPI" value={fmt(upiTotal)} icon={Smartphone} color={COLORS.success} />
      </div>

      <GlassCard className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {["All", "Cash", "Card", "UPI"].map(m => (
              <Pill key={m} label={m === "All" ? `All (${orders.length})` : m} active={methodFilter === m} onClick={() => setMethodFilter(m)} />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} style={{ padding:"6px 10px", borderRadius:8, border:"1.5px solid #e2e8f0", fontSize:12, outline:"none" }} />
            <span style={{ fontSize:12, color:"#94a3b8" }}>→</span>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} style={{ padding:"6px 10px", borderRadius:8, border:"1.5px solid #e2e8f0", fontSize:12, outline:"none" }} />
            <BtnSecondary onClick={() => downloadCSV(`payments-${new Date().toISOString().slice(0,10)}.csv`, filtered.map(o => ({
              orderId: o.orderId || o.id, customer: o.customerName || "Guest", total: o.total, paymentMethod: o.paymentMethod || "Cash", paymentStatus: o.paymentStatus || "Paid", status: o.status, date: o.createdAt ? new Date(o.createdAt).toLocaleDateString("en-IN") : "",
            })))}><Download size={13} /> Export</BtnSecondary>
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: 750 }}>
            <thead>
              <tr className="border-b border-slate-100">
                {["Order", "Customer", "Amount", "Method", "Status", "Reconciliation", "Date"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageOrders.map(o => {
                const isReconciled = o.reconciled;
                const isDisputed = o.disputed;
                return (
                <tr key={o.id} className="border-b border-slate-50 hover:bg-orange-50/30" style={{ opacity: isDisputed ? 0.7 : 1 }}>
                  <td className="px-4 py-3 font-semibold text-slate-800 font-mono">#{o.orderId || o.id.slice(-5)}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">{o.customerName || "Guest"}</div>
                    {o.phone && <div className="text-xs text-slate-400">{o.phone}</div>}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800">{fmt(o.total)}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-full text-xs font-bold" style={{
                      color: o.paymentMethod === "Cash" ? "#16a34a" : o.paymentMethod === "Card" ? "#8b5cf6" : o.paymentMethod === "UPI" ? "#2563eb" : "#64748b",
                      background: o.paymentMethod === "Cash" ? "#dcfce7" : o.paymentMethod === "Card" ? "#f3e8ff" : o.paymentMethod === "UPI" ? "#dbeafe" : "#f1f5f9",
                    }}>{o.paymentMethod || "Cash"}</span>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={o.paymentStatus === "Paid" ? "Delivered" : (o.paymentStatus || o.status)} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {isReconciled ? (
                        <span className="status-pill" style={{ fontSize:9, fontWeight:700, background:"#dcfce7", color:"#16a34a" }}><CheckCircle size={10} style={{marginRight:2}} />Reconciled</span>
                      ) : isDisputed ? (
                        <span className="status-pill" style={{ fontSize:9, fontWeight:700, background:"#fee2e2", color:"#dc2626" }}><AlertTriangle size={10} style={{marginRight:2}} />Disputed</span>
                      ) : (
                        <div className="flex gap-1">
                          <button onClick={() => handleReconcile(o)} style={{ padding:"2px 7px", borderRadius:5, border:"1px solid #dcfce7", background:"#f0fdf4", color:"#16a34a", fontSize:9, fontWeight:600, cursor:"pointer" }}>Reconcile</button>
                          <button onClick={() => openDispute(o)} style={{ padding:"2px 7px", borderRadius:5, border:"1px solid #fee2e2", background:"#fef2f2", color:"#dc2626", fontSize:9, fontWeight:600, cursor:"pointer" }}>Dispute</button>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{o.createdAt ? new Date(o.createdAt).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" }) : ""}</td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {pageOrders.length === 0 && <div style={{ textAlign:"center", padding:40, color:"#94a3b8", fontSize:13 }}>No delivered orders found</div>}
        <Pagination page={payPage} totalPages={totalPages} onPageChange={setPayPage} totalItems={filtered.length} pageSize={PAYMENT_PAGE_SIZE} />
      </GlassCard>

      <Modal open={disputeOpen} onClose={() => setDisputeOpen(false)}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0, fontFamily: "'Outfit', sans-serif" }}>Flag Payment Dispute</h3>
          <button type="button" onClick={() => setDisputeOpen(false)} style={{ width:36, height:36, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", border:"1px solid rgba(232, 73, 8,0.12)", background:"white", color:"#64748b", cursor:"pointer" }}><X size={18} /></button>
        </div>
        {disputeOrder && <div style={{ fontSize:13, color:"#64748b", marginBottom:12 }}>Order <strong>#{disputeOrder.orderId || disputeOrder.id.slice(-5)}</strong> — {fmt(disputeOrder.total)} via {disputeOrder.paymentMethod || "Cash"}</div>}
        <label style={_discLabelStyle}>Dispute Reason *</label>
        <textarea value={disputeReason} onChange={e => setDisputeReason(e.target.value)} placeholder="Describe the reason for disputing this payment..." rows={3} style={{ width:"100%", padding:"8px 10px", borderRadius:8, border:"1.5px solid #e2e8f0", fontSize:12, outline:"none", resize:"vertical", fontFamily:"inherit" }} />
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(0,0,0,0.06)" }}>
          <BtnSecondary onClick={() => setDisputeOpen(false)} style={{ padding:"8px 18px", fontSize:13 }}>Cancel</BtnSecondary>
          <BtnPrimary onClick={handleDispute} disabled={saving} style={{ padding:"8px 18px", fontSize:13 }}>{saving ? "Saving..." : "Flag Dispute"}</BtnPrimary>
        </div>
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ACTIVITY LOG PAGE
// ═══════════════════════════════════════════════════════════════════════════

export default PaymentsPage;