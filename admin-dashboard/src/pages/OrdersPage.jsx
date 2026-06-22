import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Search, Trash2, Phone, Eye, Download, History } from "lucide-react";
import { db, get, ref, update, push, remove, serverTimestamp, onValue, off, runTransaction, logAudit, getCurrentAdminActor, Outlet, getBizId, getOutletId } from "../firebase";
import { fmt, downloadCSV, orderItemsCount, orderItemsText } from "../utils";
import { StatusBadge, GlassCard, Modal, Select, SectionLabel, Pagination } from "../components";
import { ORANGE, ORD_ST, ORDER_STATUSES, SEQ, LIVE_ST } from "../constants";
import "../App.css";

function OrdersPage({ showToast }) {
  const [search, setSearch] = useState("");
  const [orderTab, setOrderTab] = useState("all");
  const [orders, setOrders] = useState([]);
  const [selOrder, setSelOrder] = useState(null);
  const [riders, setRiders] = useState([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const ORDER_PAGE_SIZE = 25;
  const [orderPage, setOrderPage] = useState(1);
  const [pendingPayment, setPendingPayment] = useState(null);

  useEffect(() => {
    const r = Outlet("orders");
    if (!r) return;
    const unsub = onValue(r, snap => { const v=snap.val(); setOrders(v?Object.keys(v).map(k=>({id:k,...v[k]})):[]); });
    const r2 = ref(db,"riders");
    const unsub2 = onValue(r2, snap => { const rd=[]; snap.forEach(ch=>rd.push({id:ch.key,...ch.val()})); setRiders(rd); });
    return () => { off(r,"value",unsub); off(r2,"value",unsub2); };
  }, []);

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
    if (orderTab === "live") list = list.filter(o => LIVE_ST.includes(o.status));
    else if (orderTab === "history") list = list.filter(o => !LIVE_ST.includes(o.status));
    if (search) { const s=search.toLowerCase(); list = list.filter(o => (o.customerName||"").toLowerCase().includes(s) || (o.phone||"").includes(s) || (o.orderId||o.id).toLowerCase().includes(s)); }
    if (fromDate && toDate) { list = list.filter(o => o.createdAt && new Date(o.createdAt).toISOString().split("T")[0] >= fromDate && new Date(o.createdAt).toISOString().split("T")[0] <= toDate); }
    return list.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  }, [orders, search, orderTab, fromDate, toDate]);
  const orderTotalPages = Math.max(1, Math.ceil(filtered.length / ORDER_PAGE_SIZE));
  useEffect(() => { setOrderPage(1); }, [search, orderTab, fromDate, toDate]);
  const paginatedOrders = filtered.slice((orderPage - 1) * ORDER_PAGE_SIZE, orderPage * ORDER_PAGE_SIZE);

  const executeStatusUpdate = useCallback(async (id, status, paymentMethod) => {
    const order = orders.find(o=>o.id===id);
    if (!order) return;
    try {
      const updates = { status, paymentStatus: status==="Delivered"?"Paid":order.paymentStatus };
      if (paymentMethod) updates.paymentMethod = paymentMethod;
      await update(Outlet(`orders/${id}`), updates);
      if (status === "Delivered") {
        const cart = Array.isArray(order.cart) ? order.cart : (order.items ? Object.values(order.items) : []);
        for (const item of cart) {
          const dishId = item.dishId || item.id;
          if (!dishId) continue;
          const dishRef = Outlet(`dishes/${dishId}`);
          await runTransaction(dishRef, (current) => {
            if (!current) return current;
            const stock = typeof current.stock === "number" ? current.stock : Number(current.stock) || 0;
            return { ...current, stock: Math.max(0, stock - (item.qty || 1)) };
          });
        }
      }
      showToast(`Status → ${status}`,"success");
    } catch(e) { showToast("Update failed","error"); }
  }, [orders, showToast]);

  const updateStatus = useCallback(async (id, status) => {
    const order = orders.find(o=>o.id===id);
    if (!order) return;
    const seq = SEQ;
    const curLvl = seq.indexOf(order.status);
    const newLvl = seq.indexOf(status);
    if (status === "Cancelled" && order.status === "Delivered") { showToast("Cannot cancel a delivered order","error"); return; }
    if (status === "Cancelled" && order.status === "Cancelled") { showToast("Already cancelled","error"); return; }
    if (status !== "Cancelled" && newLvl !== curLvl+1 && status !== order.status) { const expected = seq[curLvl+1]||"None"; showToast(`Next step must be "${expected}"`,"error"); return; }
    if (status === "Out for Delivery" && !order.riderId) { showToast("Assign a rider first","error"); return; }
    if (status === "Delivered") { setPendingPayment({ id, status }); return; }
    await executeStatusUpdate(id, status);
  }, [orders, showToast, executeStatusUpdate]);

  const assignRider = useCallback(async (orderId, riderId) => {
    try {
      const snap = await get(Outlet(`orders/${orderId}`));
      const o = snap.val();
      if (!o) return;
      const rs = await get(ref(db,`riders/${riderId}`));
      const rider = rs.val();
      await update(Outlet(`orders/${orderId}`), { riderId, assignedRider:rider?.email, riderName:rider?.name, riderPhone:rider?.phone, assignedAt:serverTimestamp() });
      if (o.status === "Placed") {
        await update(Outlet(`orders/${orderId}`), { status: "Confirmed" });
        showToast(`Rider ${rider?.name||''} assigned, status → Confirmed`,"success");
      } else {
        showToast(`Rider ${rider?.name||''} assigned`,"success");
      }
    } catch(e) { showToast("Assignment failed","error"); }
  }, [showToast]);

  const deleteOrder = useCallback(async (id) => {
    if (!confirm("Delete this order permanently?")) return;
    try {
      await remove(Outlet(`orders/${id}`));
      logAudit(getBizId(), getOutletId(), "delete_order", { orderId: id }, getCurrentAdminActor());
      setSelOrder(null);
      showToast("Order deleted", "success");
    } catch(e) {
      showToast("Delete failed", "error");
    }
  }, [showToast]);

  const exportOrders = useCallback(() => {
    downloadCSV(`orders-${new Date().toISOString().slice(0,10)}.csv`, filtered.map((o, index) => ({
      row: index + 1,
      orderId: o.orderId || o.id,
      customer: o.customerName || "Guest",
      phone: o.phone || "",
      items: orderItemsText(o),
      itemCount: orderItemsCount(o),
      total: o.total || 0,
      paymentMethod: o.paymentMethod || "Cash",
      paymentStatus: o.paymentStatus || "",
      status: o.status || "",
      rider: o.riderName || "",
      createdAt: o.createdAt || "",
    })));
    showToast("Orders exported", "success");
  }, [filtered, showToast]);

  const activeRiders = riders.filter(r=>r.status==="Online"||r.status==="On Delivery");

  return (
    <div>
      <div className="sheet-toolbar">
        <div style={{ flex:1, minWidth:240, position:"relative", maxWidth:420 }}>
          <Search size={14} style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"#94a3b8" }} />
          <input className="sheet-input" placeholder="Search orders, customers, phone..." value={search} onChange={e=>setSearch(e.target.value)} style={{ paddingLeft:32 }} />
        </div>
        <div className="sheet-actions">
          <input className="sheet-input" type="date" value={fromDate} onChange={e=>setFromDate(e.target.value)} />
          <input className="sheet-input" type="date" value={toDate} onChange={e=>setToDate(e.target.value)} />
          {[{id:"all",label:"All"}, {id:"live",label:"Live"}, {id:"history",label:"History"}].map(t=>(
            <button type="button" key={t.id} onClick={()=>setOrderTab(t.id)} className="sheet-button" style={{ color:orderTab===t.id?"white":"#64748b", background:orderTab===t.id?ORANGE:"#fff", borderColor:orderTab===t.id?ORANGE:"#e2e8f0" }}>{t.label} {t.id==="live"?`(${orders.filter(o=>LIVE_ST.includes(o.status)).length})`:""}</button>
          ))}
          <button type="button" className="sheet-button" onClick={exportOrders}><Download size={14} /> Export CSV</button>
        </div>
      </div>
      <GlassCard style={{ overflow:"hidden" }}>
        <div className="sheet-table-wrap">
        <table className="sheet-table">
          <thead><tr>
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
          </tr></thead>
          <tbody>
            {paginatedOrders.map((o, index) => {
              const globalIdx = (orderPage - 1) * ORDER_PAGE_SIZE + index + 1;
              return <tr key={o.id} onDoubleClick={()=>setSelOrder(o)}>
                <td className="sheet-row-number">{globalIdx}</td>
                <td className="sheet-cell-strong" style={{ color:ORANGE, fontFamily:"monospace" }}>#{o.orderId||o.id.slice(-5)}</td>
                <td className="sheet-cell-strong">
                  {o.customerName||"Guest"}
                </td>
                <td>{o.phone||""}</td>
                <td title={orderItemsText(o)}>
                  {(Array.isArray(o.cart)?o.cart.length+" items":(o.items?Object.keys(o.items).length+" items":"—"))}
                </td>
                <td className="sheet-cell-strong" style={{ textAlign:"right" }}>{fmt(o.total)}</td>
                <td>{o.paymentMethod||"Cash"} {o.paymentStatus ? `/${o.paymentStatus}` : ""}</td>
                <td>
                  <select className="sheet-select" value={o.status || ""} onChange={e=>updateStatus(o.id,e.target.value)} onClick={e=>e.stopPropagation()}>
                    {[...new Set([o.status, ...SEQ, "Cancelled"].filter(Boolean))].map(s=><option key={s} value={s}>{ORD_ST[s]?.label || ORDER_STATUSES[s]?.label || s}</option>)}
                  </select>
                </td>
                <td>
                  <select className="sheet-select" value={o.riderId || ""} onChange={e=>e.target.value && assignRider(o.id,e.target.value)} onClick={e=>e.stopPropagation()}>
                    <option value="">{o.riderName || "Unassigned"}</option>
                    {activeRiders.map(r=><option key={r.id} value={r.id}>{r.name || r.email || r.id}</option>)}
                  </select>
                </td>
                <td>{o.createdAt ? new Date(o.createdAt).toLocaleString("en-IN") : ""}</td>
                <td>
                  <div style={{ display:"flex", gap:6 }}>
                    <button type="button" className="sheet-icon-button" title="Open order" onClick={()=>setSelOrder(o)}><Eye size={14} /></button>
                    <button type="button" className="sheet-icon-button sheet-danger" title="Delete order" onClick={()=>deleteOrder(o.id)}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            })}
          </tbody>
        </table>
        </div>
        {filtered.length===0&&<div style={{ textAlign:"center", padding:40, color:"#94a3b8", fontSize:13 }}>No orders found</div>}
        <Pagination page={orderPage} totalPages={orderTotalPages} onPageChange={setOrderPage} totalItems={filtered.length} pageSize={ORDER_PAGE_SIZE} />
      </GlassCard>

      {/* Order Detail Drawer */}
      <Modal open={!!selOrder} onClose={()=>setSelOrder(null)} wide>
        {selOrder && (()=>{
          const items = Array.isArray(selOrder.cart)?selOrder.cart:(selOrder.items?Object.values(selOrder.items):[]);
          return <div>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
              <div><div style={{ fontSize:18, fontWeight:800, color:"#0f172a" }}>Order #{selOrder.orderId||selOrder.id.slice(-5)}</div>
              <div style={{ fontSize:12, color:"#64748b" }}>{selOrder.createdAt?new Date(selOrder.createdAt).toLocaleString():""}</div></div>
              <StatusBadge status={selOrder.status} />
            </div>
            <div className="flex gap-3 mb-4" style={{ display:"flex", gap:12, marginBottom:16 }}>
              <div style={{ flex:1, padding:12, borderRadius:12, background:"#f8fafc" }}>
                <div style={{ fontSize:11, color:"#64748b", marginBottom:2 }}>Customer</div>
                <div style={{ fontSize:14, fontWeight:600, color:"#0f172a" }}>{selOrder.customerName||"Guest"}</div>
                <div style={{ fontSize:12, color:"#64748b" }}>{selOrder.phone||""}</div>
              </div>
              <div style={{ flex:1, padding:12, borderRadius:12, background:"#f8fafc" }}>
                <div style={{ fontSize:11, color:"#64748b", marginBottom:2 }}>Delivery</div>
                <div style={{ fontSize:13, color:"#0f172a" }}>{selOrder.address||"Counter Sale"}</div>
                {(selOrder.lat&&selOrder.lng)&&<a href={`https://www.google.com/maps?q=${selOrder.lat},${selOrder.lng}`} target="_blank" style={{ fontSize:11, color:ORANGE, fontWeight:600 }}>📍 View Map</a>}
              </div>
            </div>
            <SectionLabel>Items ({items.length})</SectionLabel>
            <div style={{ marginBottom:16 }}>
              {items.map((item,i)=>(
                <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid #f1f5f9" }}>
                  <div><div style={{ fontSize:13, fontWeight:500, color:"#0f172a" }}>{item.name||item.item} {item.size?`(${item.size})`:""}</div>
                  {item.addons&&Array.isArray(item.addons)&&item.addons.map((a,j)=><span key={j} style={{ fontSize:11, color:"#64748b", marginRight:4 }}>+{a.name||a}</span>)}</div>
                  <div style={{ textAlign:"right" }}><div style={{ fontSize:13, fontWeight:700 }}>₹{item.price||item.total||0}</div><div style={{ fontSize:11, color:"#94a3b8" }}>x{item.qty||1}</div></div>
                </div>
              ))}
            </div>
            <div style={{ padding:16, borderRadius:12, background:"#0f172a", color:"white", marginBottom:16 }}>
              <div className="flex justify-between mb-2" style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}><span style={{ opacity:0.7, fontSize:13 }}>Subtotal</span><span>₹{selOrder.subtotal||0}</span></div>
              <div className="flex justify-between mb-2" style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}><span style={{ opacity:0.7, fontSize:13 }}>Discount</span><span style={{ color:"#22c55e" }}>-₹{selOrder.discount||0}</span></div>
              <div className="flex justify-between mb-2" style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}><span style={{ opacity:0.7, fontSize:13 }}>Delivery</span><span>₹{selOrder.deliveryFee||0}</span></div>
              <div style={{ borderTop:"1px solid rgba(255,255,255,0.1)", paddingTop:12, display:"flex", justifyContent:"space-between" }}>
                <span style={{ fontWeight:700 }}>Total</span><span style={{ fontSize:20, fontWeight:800, color:ORANGE }}>{fmt(selOrder.total)}</span>
              </div>
            </div>
            <SectionLabel>Controls</SectionLabel>
            <div className="flex gap-3" style={{ display:"flex", gap:12 }}>
              <select onChange={e=>{const v=e.target.value;if(v)updateStatus(selOrder.id,v);e.target.value="";}} style={{ flex:1, padding:"10px 14px", borderRadius:10, border:"1.5px solid #e2e8f0", fontSize:13 }}>
                <option value="">Update Status</option>
                {SEQ.filter(s=>s!==selOrder.status).map(s=><option key={s} value={s}>{s}</option>)}
                {selOrder.status!=="Delivered"&&selOrder.status!=="Cancelled"&&<option value="Cancelled">Cancel Order</option>}
              </select>
              <select onChange={e=>{const v=e.target.value;if(v)assignRider(selOrder.id,v);e.target.value="";}} style={{ flex:1, padding:"10px 14px", borderRadius:10, border:"1.5px solid #e2e8f0", fontSize:13 }}>
                <option value="">{selOrder.riderId?"Change Rider":"Assign Rider"}</option>
                {activeRiders.map(r=><option key={r.id} value={r.id}>{r.name} ({r.status})</option>)}
              </select>
            </div>
            {pendingPayment?.id === selOrder.id && (
              <div style={{ marginTop:16, padding:16, borderRadius:12, background:"#fef2f2", border:"1.5px solid #fecaca" }}>
                <div style={{ fontSize:13, fontWeight:600, color:"#991b1b", marginBottom:10 }}>Select payment method to mark Delivered</div>
                <div style={{ display:"flex", gap:8 }}>
                  {["Cash","Card","UPI"].map(m => (
                    <button key={m} type="button" onClick={async () => { if (!pendingPayment) return; const pm = pendingPayment; setPendingPayment(null); await executeStatusUpdate(pm.id, pm.status, m); }}
                      style={{ flex:1, padding:"10px 12px", borderRadius:8, border:"1.5px solid #e2e8f0", background:"white", cursor:"pointer", fontWeight:600, fontSize:13, color:"#0f172a" }}>
                      {m}
                    </button>
                  ))}
                  <button onClick={() => setPendingPayment(null)} style={{ padding:"10px 12px", borderRadius:8, border:"1.5px solid #e2e8f0", background:"white", cursor:"pointer", fontSize:13, color:"#64748b" }}>Cancel</button>
                </div>
              </div>
            )}
          </div>;
        })()}
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORIES PAGE (CRUD with addons)
// ═══════════════════════════════════════════════════════════════════════════

export default OrdersPage;