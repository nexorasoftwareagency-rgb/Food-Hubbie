import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Zap, ChefHat, Search, Plus, Download, Clock, Truck, XCircle, Edit3, Trash2, Eye } from "lucide-react";
import { Outlet, update, push, remove, serverTimestamp, getBizId, getOutletId, logAudit, getCurrentAdminActor } from "../firebase";
import { ORANGE, COLORS, ORD_ST, SEQ, LIVE_STATUSES, STATUS_SEQUENCES } from "../constants";
import { fmt, downloadCSV, orderItemsCount, esc } from "../utils";
import { KPICard, SectionHeader, GlassCard, BtnPrimary, Modal, Avatar, Input, Select } from "../components";
import OrderTableRow from "../components/OrderTableRow";
import OrderDrawer from "../components/OrderDrawer";
import "../App.css";

function relTime(ts) {
  if (!ts) return "";
  const m = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m ago`;
}

export default function LiveOpsPage({ showToast, orders, ordersMap, liveOrdersMap, riders, loading,
  updateStatus, executeStatusUpdate, assignRider, deleteOrder, getOrderItems, isRiderFresh, getNextValidStatus,
  highlightedOrderId, storeSettings, displaySettings
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editing, setEditing] = useState(null);
  const [selOrder, setSelOrder] = useState(null);
  const [pendingPayment, setPendingPayment] = useState(null);

  const activeOrders = useMemo(() =>
    orders.filter(o => o.status !== "Delivered" && o.status !== "Cancelled"),
  [orders]);

  const filteredOps = useMemo(() => {
    let list = activeOrders;
    if (statusFilter !== "all") list = list.filter(o => o.status === statusFilter);
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(o =>
        [o.id, o.customerName, o.phone, o.address, o.status, o.type]
          .some(v => String(v || "").toLowerCase().includes(s))
      );
    }
    const PRIORITY = { Placed: 0, Confirmed: 1, Preparing: 2, Cooked: 3, Ready: 4, "Out for Delivery": 5, "Reached Drop Location": 6, Pending: 7, New: 8 };
    return list.sort((a, b) => {
      const p = (PRIORITY[a.status] || 9) - (PRIORITY[b.status] || 9);
      if (p) return p;
      return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
    });
  }, [activeOrders, search, statusFilter]);

  const flowLabels = useMemo(() => {
    const f = {};
    SEQ.forEach((s, i) => {
      if (i < SEQ.length - 1) {
        const next = SEQ[i + 1];
        const labels = { Placed: "Accept", Confirmed: "Prep", Preparing: "Cook", Cooked: "Ready", Ready: "Dispatch", "Out for Delivery": "Arrive", "Reached Drop Location": "Deliver" };
        f[s] = labels[s] || next;
      }
    });
    return f;
  }, []);

  const handleAdvance = useCallback(async (order) => {
    const idx = SEQ.indexOf(order.status);
    if (idx === -1 || idx >= SEQ.length - 1) return;
    let next = SEQ[idx + 1];
    if (order.type === "Dine-in" && (next === "Out for Delivery" || next === "Reached Drop Location")) {
      next = "Delivered";
    }
    if (next === "Out for Delivery" && !order.riderId && !order.assignedRider) {
      showToast("Assign a rider first", "error");
      return;
    }
    if (next === "Delivered") {
      setPendingPayment({ id: order.id, status: "Delivered" });
      return;
    }
    const ok = await executeStatusUpdate(order.id, next);
    if (ok) showToast(`${order.id?.slice(-6)} → ${ORD_ST[next]?.label || next}`, "success");
  }, [executeStatusUpdate, showToast]);

  const handleCancel = useCallback(async (id) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;
    if (order.status === "Delivered") { showToast("Cannot cancel a delivered order", "error"); return; }
    if (!window.confirm("Cancel this order?")) return;
    await executeStatusUpdate(id, "Cancelled");
    showToast("Order cancelled", "success");
  }, [orders, executeStatusUpdate, showToast]);

  const handleSaveOperation = useCallback(async () => {
    if (!editing?.customerName?.trim()) return showToast("Customer name is required", "error");
    try {
      if (editing.id) {
        await update(Outlet(`orders/${editing.id}`), {
          customerName: editing.customerName, phone: editing.phone,
          total: Number(editing.total || 0), type: editing.type,
          status: editing.status || "Placed", address: editing.address || "",
        });
      } else {
        await push(Outlet("orders"), {
          customerName: editing.customerName, phone: editing.phone,
          total: Number(editing.total || 0), type: editing.type,
          status: "Placed", address: editing.address || "",
          createdAt: serverTimestamp(),
        });
      }
      setEditing(null);
      showToast("Operation saved", "success");
    } catch (e) {
      showToast("Save failed: " + e.message, "error");
    }
  }, [editing, showToast]);

  const handleDeleteOp = useCallback(async (id) => {
    if (!window.confirm("Delete this order permanently?")) return;
    try {
      await remove(Outlet(`orders/${id}`));
      logAudit(getBizId(), getOutletId(), "delete_order_liveops", { orderId: id }, getCurrentAdminActor());
      showToast("Order deleted", "success");
    } catch (e) {
      showToast("Delete failed: " + e.message, "error");
    }
  }, [showToast]);

  const exportOps = useCallback(() => {
    downloadCSV(`live-operations-${new Date().toISOString().slice(0, 10)}.csv`,
      filteredOps.map((o, i) => ({
        row: i + 1, orderId: o.id, customer: o.customerName,
        phone: o.phone, items: orderItemsCount(o), total: o.total,
        type: o.type, status: o.status, address: o.address,
      }))
    );
    showToast("Live operations exported", "success");
  }, [filteredOps, showToast]);

  const handleAssignRider = useCallback(async (orderId, riderId) => {
    await assignRider(orderId, riderId);
  }, [assignRider]);

  useEffect(() => {
    if (highlightedOrderId) {
      const el = document.getElementById(`row-${highlightedOrderId}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightedOrderId]);

  const handlePrint = useCallback(async (order) => {
    try {
      const { printReceipt } = await import("../utils/printing");
      const store = storeSettings || { name: "Store" };
      const ds = displaySettings || {};
      const opts = {
        showGSTIN: ds.checkShowGSTIN !== false,
        showFSSAI: ds.checkShowFSSAI !== false,
        showQR: ds.checkShowQR !== false,
        showTagline: ds.checkShowTagline !== false,
        showPoweredBy: ds.checkShowPoweredBy !== false,
        showWifiInfo: ds.checkShowWifiInfo === true,
        showFeedbackQR: ds.checkShowFeedbackQR !== false,
      };
      printReceipt(order, store, opts);
    } catch (_) {}
  }, [storeSettings, displaySettings]);

  const handleMarkDelivered = useCallback((order) => {
    setPendingPayment({ id: order.id, status: "Delivered" });
  }, []);

  const confirmDelivered = useCallback(async (method) => {
    if (!pendingPayment) return;
    const ok = await executeStatusUpdate(pendingPayment.id, "Delivered", method);
    if (ok) showToast("Order delivered", "success");
    setPendingPayment(null);
  }, [pendingPayment, executeStatusUpdate, showToast]);

  return (
    <div className="space-y-4">
      {/* KPI Row */}
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
        <KPICard title="Live Orders" value={activeOrders.length} icon={Zap} color={COLORS.error} />
        <KPICard title="Pending Accept" value={activeOrders.filter(o => o.status === "Placed").length} icon={Clock} color={COLORS.warning} />
        <KPICard title="In Kitchen" value={activeOrders.filter(o => ["Confirmed", "Preparing", "Cooked", "Ready"].includes(o.status)).length} icon={ChefHat} color={COLORS.info} />
        <KPICard title="Out for Delivery" value={activeOrders.filter(o => o.status === "Out for Delivery" || o.status === "Reached Drop Location").length} icon={Truck} color={COLORS.primary} />
      </div>

      {/* Main Live Ops Table */}
      <GlassCard className="p-4">
        <div className="sheet-toolbar">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div className="live-dot" />
            <span className="font-bold text-slate-800 text-sm" style={{ fontFamily: "'Outfit', sans-serif" }}>Live Operations Sheet</span>
          </div>
          <div className="sheet-actions">
            <input className="sheet-input" placeholder="Search live ops..." value={search} onChange={e => setSearch(e.target.value)} style={{ minWidth: 180 }} />
            <select className="sheet-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              {Object.keys(ORD_ST).filter(s => s !== "Delivered" && s !== "Cancelled").map(s => (
                <option key={s} value={s}>{ORD_ST[s].label}</option>
              ))}
            </select>
            <button type="button" className="sheet-button" onClick={() => setEditing({ customerName: "", phone: "", total: 0, type: "delivery", address: "" })}>
              <Plus size={14} /> New Row
            </button>
            <button type="button" className="sheet-button" onClick={exportOps}>
              <Download size={14} /> Export CSV
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3" style={{ padding: 20 }}>
            {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 48, width: '100%' }} />)}
          </div>
        ) : (
          <div className="sheet-table-wrap">
            <table className="premium-table-v4">
              <thead>
                <tr className="table-header-row">
                  <th>#</th><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Time</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOps.map((o, index) => {
                  const _idx = SEQ.indexOf(o.status);
                  const canAdvance = _idx >= 0 && _idx < SEQ.length - 1;
                  const needRider = _idx >= 0 && _idx < SEQ.length - 1 && SEQ[_idx + 1] === "Out for Delivery";
                  const stColor = ORD_ST[o.status]?.color || "#64748b";
                  const nextStatus = canAdvance ? SEQ[_idx + 1] : null;
                  const riderMissing = needRider && !o.riderId && !o.assignedRider;
                  const minsSince = o.createdAt ? Math.floor((Date.now() - new Date(o.createdAt).getTime()) / 60000) : 0;

                  return (
                    <tr key={o.id} id={`row-${o.id}`} style={{ borderLeft: `3px solid ${stColor}` }}
                      className={highlightedOrderId === o.id ? 'highlight' : ''}>
                      <td data-label="#" style={{ color: '#94a3b8', fontSize: 11 }}>{index + 1}</td>
                      <td data-label="Order">
                        <span style={{ color: ORANGE, fontFamily: "monospace", fontSize: 12, fontWeight: 700 }}>
                          {o.orderId || o.id?.slice(-6)}
                        </span>
                      </td>
                      <td data-label="Customer">
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{o.customerName}</div>
                        <div style={{ fontSize: 10, color: "#94a3b8" }}>{o.phone} · {o.type || "online"}</div>
                      </td>
                      <td data-label="Items" style={{ fontSize: 12 }}>{orderItemsCount(o)}</td>
                      <td data-label="Total" style={{ fontWeight: 700, textAlign: "right", fontSize: 13 }}>{fmt(o.total)}</td>
                      <td data-label="Status">
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
                            {SEQ.map((s, i) => {
                              const done = i < _idx;
                              const cur = i === _idx;
                              return (
                                <div key={s}
                                  style={{
                                    width: 14, height: cur ? 6 : 4, borderRadius: 3,
                                    backgroundColor: done || cur ? stColor : "#e2e8f0",
                                    transition: "all 0.2s",
                                  }} />
                              );
                            })}
                          </div>
                          <span style={{ fontSize: 10, fontWeight: 600, color: stColor, whiteSpace: "nowrap" }}>
                            {ORD_ST[o.status]?.label || o.status}
                          </span>
                        </div>
                      </td>
                      <td data-label="Time" style={{ fontSize: 10, color: "#94a3b8", whiteSpace: "nowrap" }}>
                        {minsSince < 1 ? "<1m" : `${minsSince}m`}
                      </td>
                      <td data-label="Actions">
                        <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 100 }}>
                          {canAdvance ? (
                            riderMissing ? (
                              <select className="sheet-select" style={{ fontSize: 12, fontWeight: 600, padding: "8px 6px", borderColor: ORANGE, borderRadius: 8 }}
                                defaultValue="" onChange={e => { if (e.target.value) handleAssignRider(o.id, e.target.value); }}>
                                <option value="" disabled>Assign rider..</option>
                                {riders.filter(r =>
                                  r.status === "online" || r.status === "busy" || r.status === "Online" || r.status === "On Delivery"
                                ).map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                              </select>
                            ) : (
                              <button type="button"
                                style={{
                                  background: ORD_ST[nextStatus]?.color || stColor, color: "white",
                                  border: "none", borderRadius: 24, padding: "10px 20px", minWidth: 120,
                                  cursor: "pointer", display: "flex", flexDirection: "column",
                                  alignItems: "center", gap: 2, transition: "all 0.15s", boxShadow: "0 2px 6px rgba(0,0,0,0.15)"
                                }}
                                onClick={() => handleAdvance(o)}>
                                <span style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.2 }}>
                                  {flowLabels[o.status] || nextStatus}
                                </span>
                                <span style={{ fontSize: 11, fontWeight: 600, opacity: 0.9, lineHeight: 1.1 }}>
                                  → {ORD_ST[nextStatus]?.label || nextStatus}
                                </span>
                              </button>
                            )
                          ) : (o.status === "Delivered" || o.status === "Cancelled") ? null : (
                            <div style={{ fontSize: 10, color: "#94a3b8", fontStyle: "italic", padding: "6px 0" }}>Final</div>
                          )}
                          {o.riderName && !riderMissing && (
                            <span style={{ fontSize: 12, color: "#3b82f6", fontWeight: 700, whiteSpace: "nowrap" }}>
                              🛵 {o.riderName}
                            </span>
                          )}
                          <div style={{ display: "flex", gap: 3, alignItems: "center", paddingTop: 4, borderTop: "1px solid #f1f5f9" }}>
                            {o.status !== "Delivered" && o.status !== "Cancelled" && (
                              <button type="button" className="sheet-icon-button sheet-danger" title="Cancel" onClick={() => handleCancel(o.id)}>
                                <XCircle size={12} />
                              </button>
                            )}
                            <button type="button" className="sheet-icon-button" title="View" onClick={() => setSelOrder(o)}>
                              <Eye size={12} />
                            </button>
                            <button type="button" className="sheet-icon-button" title="Edit"
                              onClick={() => setEditing({
                                id: o.id, customerName: o.customerName || "", phone: o.phone || "",
                                total: o.total || 0, type: o.type || "delivery", status: o.status || "", address: o.address || ""
                              })}>
                              <Edit3 size={12} />
                            </button>
                            <button type="button" className="sheet-icon-button sheet-danger" title="Delete" onClick={() => handleDeleteOp(o.id)}>
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredOps.length === 0 && (
              <div style={{ textAlign: "center", padding: 28, color: "#94a3b8", fontSize: 13 }}>
                No active operations found
              </div>
            )}
          </div>
        )}
      </GlassCard>

      {/* Sidebar: Live Feed + Rider Activity */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
        <GlassCard className="p-4">
          <SectionHeader title="Live Order Feed" />
          <div className="space-y-3">
            {activeOrders.slice(0, 10).map(o => (
              <div key={o.id} className="p-3 rounded-xl border border-slate-100 hover:border-orange-200 transition-all" style={{ cursor: 'pointer' }}
                onClick={() => setSelOrder(o)}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold" style={{ color: ORANGE }}>#{o.id?.slice(-6)}</span>
                  <span className={`status ${(o.status || '').replace(/ /g, '')}`}>{o.status}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-slate-800">{o.customerName}</div>
                    <div className="text-xs text-slate-500">
                      {orderItemsCount(o)} items · {fmt(o.total)} · {relTime(o.createdAt)}
                    </div>
                  </div>
                  {o.status === "Placed" && (
                    <button onClick={e => { e.stopPropagation(); handleAdvance(o); }}
                      className="px-3 py-1 rounded-lg text-xs font-bold text-white ml-2 flex-shrink-0"
                      style={{ backgroundColor: ORANGE }}>
                      Accept
                    </button>
                  )}
                </div>
              </div>
            ))}
            {activeOrders.length === 0 && (
              <div style={{ textAlign: "center", padding: 24, color: "#94a3b8", fontSize: 13 }}>No active orders</div>
            )}
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <SectionHeader title="Rider Activity" />
          <div className="space-y-3">
            {riders.slice(0, 6).map(r => {
              const status = String(r.status || "offline").toLowerCase();
              const vehicle = r.vehicle || "bike";
              const earn = r.todayEarnings || r.earn || 0;
              const activeOrder = r.currentOrderId || r.order || null;
              return (
                <div key={r.id} className="p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <Avatar name={r.name || r.email || r.id} size={36} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-800">{r.name || r.email || r.id}</div>
                      <div className="text-xs text-slate-500 capitalize">{vehicle} · {fmt(earn)} today</div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1.5 text-xs font-semibold capitalize"
                        style={{
                          color: status === "online" ? COLORS.success :
                            (status === "on delivery" || status === "busy") ? COLORS.warning : "#94a3b8"
                        }}>
                        <span className="w-2 h-2 rounded-full"
                          style={{
                            backgroundColor: status === "online" ? COLORS.success :
                              (status === "on delivery" || status === "busy") ? COLORS.warning : "#94a3b8"
                          }} />
                        {status}
                      </div>
                      {activeOrder && <div className="text-xs text-slate-500 mt-0.5">{activeOrder}</div>}
                    </div>
                  </div>
                </div>
              );
            })}
            {riders.length === 0 && (
              <div style={{ textAlign: "center", padding: 20, color: "#94a3b8", fontSize: 12 }}>No riders yet</div>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Edit/Create Modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)}>
        {editing && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 16 }}>
              {editing.id ? "Edit Operation" : "New Operation"}
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Input placeholder="Customer Name" value={editing.customerName} onChange={e => setEditing({ ...editing, customerName: e.target.value })} />
              <Input placeholder="Phone" value={editing.phone} onChange={e => setEditing({ ...editing, phone: e.target.value })} />
              <Input type="number" placeholder="Total" value={editing.total} onChange={e => setEditing({ ...editing, total: e.target.value })} />
              <Select value={editing.type} onChange={e => setEditing({ ...editing, type: e.target.value })}>
                <option value="delivery">Delivery</option>
                <option value="dinein">Dine-in</option>
                <option value="takeaway">Takeaway</option>
              </Select>
              <Input placeholder="Address / table / note" value={editing.address} onChange={e => setEditing({ ...editing, address: e.target.value })} />
            </div>
            <BtnPrimary onClick={handleSaveOperation} style={{ width: "100%", marginTop: 14 }}>Save</BtnPrimary>
          </div>
        )}
      </Modal>

      {/* Payment Picker */}
      <Modal open={!!pendingPayment} onClose={() => setPendingPayment(null)}>
        {pendingPayment && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 16 }}>Select payment method to mark Delivered</h3>
            <div style={{ display: "flex", gap: 8 }}>
              {["Cash", "Card", "UPI"].map(m => (
                <button key={m} type="button" onClick={() => confirmDelivered(m)}
                  style={{
                    flex: 1, padding: "10px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0",
                    background: "white", cursor: "pointer", fontWeight: 600, fontSize: 13, color: "#0f172a"
                  }}>
                  {m}
                </button>
              ))}
              <button onClick={() => setPendingPayment(null)}
                style={{ padding: "10px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "white", cursor: "pointer", fontSize: 13, color: "#64748b" }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Order Drawer */}
      <OrderDrawer
        order={selOrder}
        riders={riders}
        onClose={() => setSelOrder(null)}
        onUpdateStatus={async (id, status) => { await executeStatusUpdate(id, status); }}
        onAssignRider={handleAssignRider}
        onPrint={handlePrint}
        onMarkDelivered={handleMarkDelivered}
      />
    </div>
  );
}
