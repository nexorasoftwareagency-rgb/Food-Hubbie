import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Search, Download, Eye, Trash2 } from "lucide-react";
import { Outlet, update, remove, serverTimestamp, getBizId, getOutletId, logAudit, getCurrentAdminActor } from "../firebase";
import { ORANGE, ORD_ST, SEQ, LIVE_STATUSES } from "../constants";
import { fmt, downloadCSV, orderItemsText, orderItemsCount } from "../utils";
import { StatusBadge, GlassCard, Modal, SectionLabel, Pagination } from "../components";
import OrderDrawer from "../components/OrderDrawer";
import "../App.css";

export default function OrdersPage({ showToast, orders, ordersMap, liveOrdersMap, riders, loading,
  updateStatus, executeStatusUpdate, assignRider, deleteOrder, getOrderItems,
  highlightedOrderId, storeSettings, displaySettings, outletInfo
}) {
  const [search, setSearch] = useState("");
  const [orderTab, setOrderTab] = useState("all");
  const [selOrder, setSelOrder] = useState(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [orderPage, setOrderPage] = useState(1);
  const [pendingPayment, setPendingPayment] = useState(null);
  const ORDER_PAGE_SIZE = 25;

  useEffect(() => {
    if (selOrder) window.history.replaceState({ drawer: true }, "");
    else if (window.history.state?.drawer) window.history.back();
  }, [selOrder]);

  useEffect(() => {
    const handler = () => setSelOrder(null);
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  const filtered = useMemo(() => {
    let list = [...orders];
    if (orderTab === "live") list = list.filter(o => LIVE_STATUSES.some(s => s.toLowerCase() === (o.status || '').toLowerCase()));
    else if (orderTab === "history") list = list.filter(o => !LIVE_STATUSES.some(s => s.toLowerCase() === (o.status || '').toLowerCase()));
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(o => (o.customerName || "").toLowerCase().includes(s) || (o.phone || "").includes(s) || (o.orderId || o.id).toLowerCase().includes(s));
    }
    if (fromDate && toDate) {
      list = list.filter(o => o.createdAt &&
        new Date(o.createdAt).toISOString().split("T")[0] >= fromDate &&
        new Date(o.createdAt).toISOString().split("T")[0] <= toDate);
    }
    return list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [orders, search, orderTab, fromDate, toDate]);

  const orderTotalPages = Math.max(1, Math.ceil(filtered.length / ORDER_PAGE_SIZE));
  useEffect(() => { setOrderPage(1); }, [search, orderTab, fromDate, toDate]);
  const paginatedOrders = filtered.slice((orderPage - 1) * ORDER_PAGE_SIZE, orderPage * ORDER_PAGE_SIZE);

  const handleUpdateStatus = useCallback(async (id, status) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;
    const seq = SEQ;
    const curLvl = seq.indexOf(order.status);
    const newLvl = seq.indexOf(status);

    if (status === "Cancelled" && order.status === "Delivered") { showToast("Cannot cancel a delivered order", "error"); return; }
    if (status === "Cancelled" && order.status === "Cancelled") { showToast("Already cancelled", "error"); return; }
    if (status !== "Cancelled" && newLvl !== curLvl + 1 && status !== order.status) {
      const expected = seq[curLvl + 1] || "None";
      showToast(`Next step must be "${expected}"`, "error");
      return;
    }
    if (status === "Out for Delivery" && !order.riderId) { showToast("Assign a rider first", "error"); return; }
    if (status === "Delivered") { setPendingPayment({ id, status }); return; }
    await executeStatusUpdate(id, status);
  }, [orders, executeStatusUpdate, showToast]);

  const handleAssignRider = useCallback(async (orderId, riderId) => {
    await assignRider(orderId, riderId);
  }, [assignRider]);

  const handleDelete = useCallback(async (id) => {
    if (!window.confirm("Delete this order permanently?")) return;
    try {
      await remove(Outlet(`orders/${id}`));
      logAudit(getBizId(), getOutletId(), "delete_order", { orderId: id }, getCurrentAdminActor());
      setSelOrder(null);
      showToast("Order deleted", "success");
    } catch (e) {
      showToast("Delete failed: " + e.message, "error");
    }
  }, [showToast]);

  const exportOrders = useCallback(() => {
    downloadCSV(`orders-${new Date().toISOString().slice(0, 10)}.csv`, filtered.map((o, index) => ({
      row: index + 1, orderId: o.orderId || o.id, customer: o.customerName || "Guest",
      phone: o.phone || "", items: orderItemsText(o), itemCount: orderItemsCount(o),
      total: o.total || 0, paymentMethod: o.paymentMethod || "Cash",
      paymentStatus: o.paymentStatus || "", status: o.status || "",
      rider: o.riderName || "", createdAt: o.createdAt || "",
    })));
    showToast("Orders exported", "success");
  }, [filtered, showToast]);

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
  }, [storeSettings, displaySettings, outletInfo]);

  const handleMarkDelivered = useCallback((order) => {
    setPendingPayment({ id: order.id, status: "Delivered" });
  }, []);

  const confirmDelivered = useCallback(async (method) => {
    if (!pendingPayment) return;
    const ok = await executeStatusUpdate(pendingPayment.id, "Delivered", method);
    if (ok) showToast("Order delivered", "success");
    setPendingPayment(null);
  }, [pendingPayment, executeStatusUpdate, showToast]);

  useEffect(() => {
    if (highlightedOrderId) {
      const el = document.getElementById(`row-${highlightedOrderId}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightedOrderId]);

  const activeRiders = riders.filter(r => r.status === "Online" || r.status === "On Delivery");

  return (
    <div>
      <div className="sheet-toolbar">
        <div style={{ flex: 1, minWidth: 240, position: "relative", maxWidth: 420 }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
          <input className="sheet-input" placeholder="Search orders, customers, phone..." value={search}
            onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 32 }} />
        </div>
        <div className="sheet-actions">
          <input className="sheet-input" type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
          <input className="sheet-input" type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
          {[{ id: "all", label: "All" }, { id: "live", label: "Live" }, { id: "history", label: "History" }].map(t => (
            <button type="button" key={t.id} onClick={() => setOrderTab(t.id)} className="sheet-button"
              style={{
                color: orderTab === t.id ? "white" : "#64748b",
                background: orderTab === t.id ? ORANGE : "#fff",
                borderColor: orderTab === t.id ? ORANGE : "#e2e8f0"
              }}>
              {t.label}
            </button>
          ))}
          <button type="button" className="sheet-button" onClick={exportOrders}>
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      <GlassCard style={{ overflow: "hidden" }}>
        {loading ? (
          <div className="space-y-3" style={{ padding: 20 }}>
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton" style={{ height: 48, width: '100%' }} />)}
          </div>
        ) : (
          <>
            <div className="sheet-table-wrap">
              <table className="premium-table-v4">
                <thead>
                  <tr className="table-header-row">
                    <th className="sheet-row-number">#</th>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Phone</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Rider</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedOrders.map((o, index) => {
                    const globalIdx = (orderPage - 1) * ORDER_PAGE_SIZE + index + 1;
                    const statusClasses = (o.status || "").replace(/ /g, '');
                    return (
                      <tr key={o.id} id={`row-${o.id}`} onDoubleClick={() => setSelOrder(o)}
                        className={highlightedOrderId === o.id ? 'highlight' : ''}>
                        <td className="sheet-row-number" data-label="#">{globalIdx}</td>
                        <td data-label="Order">
                          <span style={{ color: ORANGE, fontFamily: "monospace", fontWeight: 700, fontSize: 12 }}>
                            #{o.orderId || o.id?.slice(-5)}
                          </span>
                        </td>
                        <td data-label="Customer" style={{ fontWeight: 600 }}>{o.customerName || "Guest"}</td>
                        <td data-label="Phone">{o.phone || ""}</td>
                        <td data-label="Items" title={orderItemsText(o)}>
                          {Array.isArray(o.cart) ? o.cart.length + " items" : (o.items ? Object.keys(o.items).length + " items" : "—")}
                        </td>
                        <td data-label="Total" style={{ fontWeight: 700, textAlign: "right" }}>{fmt(o.total)}</td>
                        <td data-label="Payment">
                          <div className="badge-payment-v4" data-method={(o.paymentMethod || 'cash').toLowerCase()}>
                            {o.paymentMethod || "Cash"} {o.paymentStatus ? `/${o.paymentStatus}` : ""}
                          </div>
                        </td>
                        <td data-label="Status">
                          <span className={`status ${statusClasses}`}>{o.status || "Unknown"}</span>
                        </td>
                        <td data-label="Rider">
                          <select className="status-select-mini" value={o.riderId || ""}
                            onClick={e => e.stopPropagation()}
                            onChange={e => e.target.value && handleAssignRider(o.id, e.target.value)}>
                            <option value="">{o.riderName || "Unassigned"}</option>
                            {activeRiders.map(r => (
                              <option key={r.id} value={r.id}>{r.name || r.email || r.id}</option>
                            ))}
                          </select>
                        </td>
                        <td data-label="Created" style={{ fontSize: 11, color: "#94a3b8" }}>
                          {o.createdAt ? new Date(o.createdAt).toLocaleString("en-IN") : ""}
                        </td>
                        <td data-label="Actions">
                          <div style={{ display: "flex", gap: 6 }}>
                            <button type="button" className="sheet-icon-button" title="Open order" onClick={() => setSelOrder(o)}>
                              <Eye size={14} />
                            </button>
                            <button type="button" className="sheet-icon-button sheet-danger" title="Delete order"
                              onClick={() => handleDelete(o.id)}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: 40, color: "#94a3b8", fontSize: 13 }}>No orders found</div>
            )}
            <Pagination page={orderPage} totalPages={orderTotalPages} onPageChange={setOrderPage}
              totalItems={filtered.length} pageSize={ORDER_PAGE_SIZE} />
          </>
        )}
      </GlassCard>

      {/* Order Detail Drawer */}
      <OrderDrawer
        order={selOrder}
        riders={riders}
        onClose={() => setSelOrder(null)}
        onUpdateStatus={handleUpdateStatus}
        onAssignRider={handleAssignRider}
        onPrint={handlePrint}
        onMarkDelivered={handleMarkDelivered}
      />

      {/* Payment Picker */}
      <Modal open={!!pendingPayment} onClose={() => setPendingPayment(null)}>
        {pendingPayment && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 16 }}>
              Select payment method to mark Delivered
            </h3>
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
    </div>
  );
}
