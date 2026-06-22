import React, { useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense } from "react";
import {
  LayoutDashboard, ShoppingBag, Zap, ChefHat, Monitor, UtensilsCrossed,
  Tag, Package, Percent, Users, Bike, Handshake, BarChart3, TrendingDown,
  CreditCard, MessageSquare, MapPin, Settings, LogOut,
  Sun, Moon, Search, X, Menu, ChevronRight, ChevronLeft, ChevronDown,
  ShoppingCart, Wallet, Store, Plus, Edit3, Trash2, Printer,
  Minus, Phone, Save, Image, Upload, DollarSign, CheckCircle,
  AlertTriangle, ArrowUp, ArrowDown, Clock, TrendingUp, Globe,
  Activity, Navigation, Truck, Eye, EyeOff, Download, Send, Star, XCircle, Lock, Octagon, Megaphone,
  WifiOff, RefreshCw, Smartphone, History
} from "lucide-react";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { getAuthInstance, db, onAuthStateChanged, signInWithEmailAndPassword, signOut, setOutletContext, get, ref, update, push, set, remove, serverTimestamp, onValue, off, query, orderByChild, equalTo, uploadImage, deleteImage, runTransaction, logAudit, getCurrentAdminActor, createRiderAuthAccount, deleteRiderAuthAccount, resetRiderPassword, EmailAuthProvider, reauthenticateWithCredential, getMessaging, getToken, onMessage as onFcmMessage, isMessagingSupported, isConnected, onConnectionChange, startBotStatusWatcher } from "./firebase";
import { ORANGE, COLORS, ORD_ST, ORDER_STATUSES, SEQ, LIVE_ST, KITCHEN_ST, PIE_COLORS, HOURS_8_TO_23, DAY_KEYS, TRANSLATIONS, APP_VERSION, NAV_GROUPS, MOBILE_NAV, PAGE_TITLES, DISC_TYPES, DISC_STATUS, DISC_CHANNELS, PAYMENT_PAGE_SIZE, PAGE_GUIDES, STORAGE_KEYS, PARTNERS_REF, statusColors, stockStatus } from "./constants";
import TablesPage from "./TablesPage";
import { fmt, esc, csvValue, downloadCSV, orderItemsCount, orderItemsText, validateGSTIN, validateFSSAI, validateCoords, handleImageError, buildTodayRevenue, buildWeekRevenue, normalizeRider, aggregateByDay, aggregateByHour, aggregateByCategory, aggregateByDish, aggregateByCustomer, relTime, fmtDate, toLocalInput, toMs, discTypeStyle } from "./utils";
import { KPICard, StarRating, Pill, ToggleSwitch, EmptyState, SectionHeader, StatusBadge, GlassCard, BtnPrimary, BtnSecondary, Modal, Toast, Avatar, Skeleton, SkeletonCircle, SkeletonKPI, SkeletonCard, SkeletonText, SkeletonTable, SkeletonGrid, SkeletonPage, Loading, Input, Select, StatCard, SectionLabel, Pagination, ReauthModal, PageGuideModal } from "./components";
import "./App.css";

const t = (key, fallback) => TRANSLATIONS[key] || fallback || key;

let _bizId=null,_outletId=null;
function Outlet(path) { return _bizId&&_outletId ? ref(db,`businesses/${_bizId}/outlets/${_outletId}/${path}`) : null; }


// DASHBOARD PAGE
// ═══════════════════════════════════════════════════════════════════════════
function DashboardPage({ showToast }) {
  const [orders, setOrders] = useState([]);
  const [riderCount, setRiderCount] = useState(0);
  const [tab, setTab] = useState("today");
  const [loaded, setLoaded] = useState(false);
  const [botOnline, setBotOnline] = useState(typeof window._botOnline !== "undefined" ? window._botOnline : true);

  useEffect(() => {
    const h = (e) => setBotOnline(e.detail.online);
    window.addEventListener("botStatusChange", h);
    if (window._botOnline !== undefined) setBotOnline(window._botOnline);
    return () => window.removeEventListener("botStatusChange", h);
  }, []);

  useEffect(() => {
    const r = Outlet("orders");
    if (!r) return;
    const unsub = onValue(r, snap => { const v=snap.val(); setOrders(v?Object.keys(v).map(k=>({id:k,...v[k]})):[]); setLoaded(true); });
    const r2 = ref(db,"riders");
    const unsub2 = onValue(r2, snap => { let c=0; snap.forEach(ch=>{const v=ch.val();if(v.status==="Online"||v.status==="On Delivery")c++;}); setRiderCount(c); });
    return () => { off(r,"value",unsub); off(r2,"value",unsub2); };
  }, []);

  const today = new Date().toISOString().split("T")[0];
  const todayOrd = orders.filter(o=>o.createdAt&&new Date(o.createdAt).toISOString().split("T")[0]===today);
  const todayRev = todayOrd.filter(o=>o.status==="Delivered").reduce((s,o)=>s+(Number(o.total)||0),0);
  const pending = orders.filter(o=>["Placed","Confirmed","Preparing"].includes(o.status)).length;
  const liveOrd = orders.filter(o=>LIVE_ST.includes(o.status));

  const itemCounts = {};
  orders.forEach(o=>{(o.cart||[]).forEach(i=>{const n=i.name||i.item;if(n)itemCounts[n]=(itemCounts[n]||0)+(Number(i.qty)||1);});});
  const topItems = Object.entries(itemCounts).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const custData = {};
  orders.forEach(o=>{const p=o.phone||"Walk-in";if(!custData[p])custData[p]={name:o.customerName||"Walk-in",total:0,count:0};custData[p].total+=Number(o.total)||0;custData[p].count+=1;});
  const topCusts = Object.values(custData).sort((a,b)=>b.total-a.total).slice(0,5);

  const priority = liveOrd.sort((a,b)=>{const w={Placed:6,Confirmed:5,Preparing:4,Cooked:3,Ready:2,"Out for Delivery":1};return(w[b.status]||0)-(w[a.status]||0);}).slice(0,6);

  if (!loaded) return <SkeletonPage kpi={4} table={4} cards={0} />;

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(180px,1fr))", gap:16, marginBottom:24 }}>
        <StatCard label="Today's Revenue" value={fmt(todayRev)} icon={Wallet} color="#16a34a" bg="rgba(22,163,74,0.1)" sub={`${todayOrd.length} orders`} />
        <StatCard label="Pending" value={todayOrd.filter(o=>o.status==="Placed").length} icon={Clock} color="#f59e0b" bg="rgba(245,158,11,0.1)" sub="Awaiting action" />
        <StatCard label="In Progress" value={pending} icon={TrendingUp} color="#8b5cf6" bg="rgba(139,92,246,0.1)" sub="Being prepared" />
        <StatCard label="Active Riders" value={riderCount} icon={Bike} color={ORANGE} bg="rgba(232, 73, 8,0.1)" sub="On the road" />
        <StatCard label="Bot Status" value={botOnline ? "Online" : "Offline"} icon={botOnline ? CheckCircle : XCircle} color={botOnline ? "#22c55e" : "#ef4444"} bg={botOnline ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)"} sub={botOnline ? "Responding" : "Unreachable"} />
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:24 }}>
        <GlassCard style={{ padding:20 }}>
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ fontSize:14, fontWeight:700, color:"#0f172a", margin:0 }}>Revenue Trend</h3>
            <div className="flex gap-2">
              {["today","week"].map(v => (
                <div key={v} onClick={()=>setTab(v)} style={{ padding:"4px 12px", borderRadius:8, cursor:"pointer", fontSize:11, fontWeight:600, color:tab===v?"white":"#64748b", background:tab===v?ORANGE:"#f1f5f9" }}>{v==="today"?"Today":"Week"}</div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={tab==="today" ? buildTodayRevenue(orders) : buildWeekRevenue(orders)}>
              <defs><linearGradient id="rg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={ORANGE} stopOpacity={0.3}/><stop offset="100%" stopColor={ORANGE} stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey={tab==="today"?"t":"d"} tick={{fontSize:10,fill:"#94a3b8"}} axisLine={false} tickLine={false} />
              <YAxis tick={{fontSize:10,fill:"#94a3b8"}} axisLine={false} tickLine={false} tickFormatter={v=>`₹${v/1000}k`} />
              <Tooltip contentStyle={{borderRadius:12,border:"none"}} formatter={v=>[`₹${v}`,"Revenue"]} />
              <Area type="monotone" dataKey="rev" stroke={ORANGE} strokeWidth={2.5} fill="url(#rg)" />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>
        <GlassCard style={{ padding:20 }}>
          <h3 style={{ fontSize:14, fontWeight:700, color:"#0f172a", marginBottom:12 }}>Priority Orders ({priority.length})</h3>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {priority.map(o => (
              <div key={o.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:12, background:ORD_ST[o.status]?.bg||"#f8fafc" }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:"#0f172a" }}>#{o.orderId||o.id.slice(-5)} — {o.customerName||"Guest"}</div>
                  <div style={{ fontSize:11, color:"#64748b" }}>{(Array.isArray(o.cart)?o.cart.map(i=>`${i.qty||1}x ${i.name}`).join(", "):"")||o.phone||""}</div>
                </div>
                <StatusBadge status={o.status} />
              </div>
            ))}
            {priority.length===0&&<div style={{ textAlign:"center", padding:20, color:"#94a3b8", fontSize:13 }}>✅ All caught up!</div>}
          </div>
        </GlassCard>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:24 }}>
        <GlassCard style={{ padding:20 }}>
          <h3 style={{ fontSize:14, fontWeight:700, color:"#0f172a", marginBottom:12 }}>Top Items</h3>
          {topItems.map(([n,q],i)=>(
            <div key={n} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid #f8fafc" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ width:24,height:24,borderRadius:6,background:"#fff7ed",color:ORANGE,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700 }}>#{i+1}</span>
                <span style={{ fontSize:13, fontWeight:500, color:"#1e293b" }}>{n}</span>
              </div>
              <span style={{ fontSize:12, fontWeight:700, color:ORANGE }}>{q} SOLD</span>
            </div>
          ))}
          {topItems.length===0&&<div style={{ textAlign:"center", padding:20, color:"#94a3b8", fontSize:13 }}>No sales data yet.</div>}
        </GlassCard>
        <GlassCard style={{ padding:20 }}>
          <h3 style={{ fontSize:14, fontWeight:700, color:"#0f172a", marginBottom:12 }}>Top Customers</h3>
          {topCusts.map((c,i)=>(
            <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid #f8fafc" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ width:24,height:24,borderRadius:6,background:"#dbeafe",color:"#3b82f6",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700 }}>#{i+1}</span>
                <div><div style={{ fontSize:13, fontWeight:500, color:"#1e293b" }}>{c.name}</div><div style={{ fontSize:11, color:"#94a3b8" }}>{c.count} orders</div></div>
              </div>
              <span style={{ fontSize:13, fontWeight:700, color:"#22c55e" }}>{fmt(c.total)}</span>
            </div>
          ))}
          {topCusts.length===0&&<div style={{ textAlign:"center", padding:20, color:"#94a3b8", fontSize:13 }}>No customer data yet.</div>}
        </GlassCard>
      </div>
      <GlassCard style={{ padding:20 }}>
        <h3 style={{ fontSize:14, fontWeight:700, color:"#0f172a", marginBottom:12 }}>Recent Orders ({orders.length})</h3>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <thead><tr style={{ borderBottom:"1px solid #f1f5f9" }}>
              <th style={{ textAlign:"left", padding:"8px 12px", color:"#94a3b8", fontWeight:600, fontSize:11, textTransform:"uppercase" }}>Order</th>
              <th style={{ textAlign:"left", padding:"8px 12px", color:"#94a3b8", fontWeight:600, fontSize:11, textTransform:"uppercase" }}>Customer</th>
              <th style={{ textAlign:"right", padding:"8px 12px", color:"#94a3b8", fontWeight:600, fontSize:11, textTransform:"uppercase" }}>Total</th>
              <th style={{ textAlign:"center", padding:"8px 12px", color:"#94a3b8", fontWeight:600, fontSize:11, textTransform:"uppercase" }}>Status</th>
            </tr></thead>
            <tbody>
              {orders.slice(0,8).map(o => (
                <tr key={o.id} style={{ borderBottom:"1px solid #f8fafc" }}>
                  <td style={{ padding:"10px 12px", fontWeight:600, color:"#0f172a" }}>#{o.orderId||o.id.slice(-5)}</td>
                  <td style={{ padding:"10px 12px", color:"#475569" }}>{o.customerName||"Guest"}<br/><span style={{ fontSize:11, color:"#94a3b8" }}>{o.phone||""}</span></td>
                  <td style={{ padding:"10px 12px", textAlign:"right", fontWeight:700, color:"#0f172a" }}>{fmt(o.total)}</td>
                  <td style={{ padding:"10px 12px", textAlign:"center" }}><StatusBadge status={o.status} /></td>
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
// ORDERS PAGE (Real-time with status workflow, rider assignment, order drawer)
// ═══════════════════════════════════════════════════════════════════════════
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
      logAudit(_bizId, _outletId, "delete_order", { orderId: id }, getCurrentAdminActor());
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
function CategoriesPage({ showToast, requireAdminReauth }) {
  const [cats, setCats] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [name, setName] = useState(""); const [order, setOrder] = useState(0); const [img, setImg] = useState("");
  const [catAddonList, setCatAddonList] = useState([]);

  useEffect(() => {
    const r = Outlet("categories");
    if (!r) return;
    return onValue(r, snap => { const v=snap.val(); setCats(v?Object.keys(v).map(k=>({id:k,...v[k]})).sort((a,b)=>(a.order||0)-(b.order||0)):[]); });
  }, []);

  const openForm = (cat) => {
    if (cat) {
      setEditId(cat.id); setName(cat.name||""); setOrder(cat.order||0); setImg(cat.image||"");
      setCatAddonList(cat.addons ? Object.entries(cat.addons).map(([n,p])=>({name:n,price:Number(p)})) : [{name:"",price:0}]);
    } else {
      setEditId(null); setName(""); setOrder(0); setImg(""); setCatAddonList([]);
    }
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return showToast("Enter category name","warning");
    const addons = catAddonList.filter(a=>a.name.trim()).reduce((a,{name:n,price:p})=>({...a,[n.trim()]:Number(p)}),{});
    const data = { name:name.trim(), image:img, order:Number(order), addons: Object.keys(addons).length > 0 ? addons : null };
    try {
      if (editId) { await update(Outlet(`categories/${editId}`), data); showToast("Category updated","success"); }
      else { await push(Outlet("categories"), data); showToast("Category added","success"); }
      setShowForm(false);
    } catch(e) { showToast("Failed: "+e.message,"error"); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this category and associated dishes?")) return;
    if (requireAdminReauth && !(await requireAdminReauth())) return;
    try {
      await remove(Outlet(`categories/${id}`));
      logAudit(_bizId, _outletId, "delete_category", { categoryId: id }, getCurrentAdminActor());
      showToast("Deleted","success");
    }
    catch(e) { showToast("Delete failed","error"); }
  };

  const migrateAddons = async () => {
    if (!confirm("Move all dish-level addons to their parent categories?")) return;
    try {
      const [dishesSnap, catsSnap] = await Promise.all([get(Outlet("dishes")), get(Outlet("categories"))]);
      const dishes = dishesSnap.val() || {}; const catsData = catsSnap.val() || {};
      const catAddons = {};
      Object.values(dishes).forEach(d => {
        if (d.category && d.addons) {
          if (!catAddons[d.category]) catAddons[d.category] = {};
          Object.entries(d.addons).forEach(([n, p]) => { catAddons[d.category][n] = p; });
        }
      });
      const updates = {};
      Object.entries(catsData).forEach(([catId, c]) => {
        if (catAddons[c.name]) updates[`categories/${catId}/addons`] = catAddons[c.name];
      });
      if (Object.keys(updates).length > 0) {
        await update(ref(db, `businesses/${_bizId}/outlets/${_outletId}`), updates);
        showToast("Addons migrated to categories!","success");
      } else showToast("No addons to migrate","info");
    } catch(e) { showToast("Migrate failed: "+e.message,"error"); }
  };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <h3 style={{ fontSize:16, fontWeight:700, color:"#0f172a", margin:0 }}>Categories ({cats.length})</h3>
        <div style={{ display:"flex", gap:8 }}>
          <BtnSecondary onClick={migrateAddons} style={{ padding:"6px 12px", fontSize:11 }}>Migrate Addons</BtnSecondary>
          <BtnPrimary onClick={()=>openForm(null)}><Plus size={14} /> Add Category</BtnPrimary>
        </div>
      </div>
      <GlassCard>
        {cats.map(c => (
          <div key={c.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", borderBottom:"1px solid #f8fafc" }}>
            <img src={c.image||"https://placehold.co/40/orange/white?text=Cat"} style={{ width:40, height:40, borderRadius:8, objectFit:"cover" }} alt="" />
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:600, color:"#0f172a" }}>{c.name}</div>
              <div style={{ fontSize:11, color:"#94a3b8" }}>Serial: {c.order||0}{c.addons?` · ${Object.keys(c.addons).length} addons`:""}</div>
            </div>
            <Edit3 size={14} color="#3b82f6" style={{ cursor:"pointer" }} onClick={()=>openForm(c)} />
            <Trash2 size={14} color="#ef4444" style={{ cursor:"pointer" }} onClick={()=>handleDelete(c.id)} />
          </div>
        ))}
        {cats.length===0&&<div style={{ textAlign:"center", padding:40, color:"#94a3b8", fontSize:13 }}>No categories yet</div>}
      </GlassCard>
      <Modal open={showForm} onClose={()=>setShowForm(false)}>
        <h3 style={{ fontSize:16, fontWeight:700, color:"#0f172a", marginBottom:16 }}>{editId?"Edit Category":"Add Category"}</h3>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <Input placeholder="Category name" value={name} onChange={e=>setName(e.target.value)} />
          <Input placeholder="Image URL" value={img} onChange={e=>setImg(e.target.value)} />
          <Input type="number" placeholder="Display order (0,1,2...)" value={order} onChange={e=>setOrder(e.target.value)} />
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
              <span style={{ fontSize:12, fontWeight:600, color:"#475569" }}>Category Addons</span>
              <button type="button" onClick={()=>setCatAddonList([...catAddonList,{name:"",price:0}])} style={{ fontSize:11, color:ORANGE, background:"none", border:"none", cursor:"pointer", fontWeight:600 }}>+ Add Addon</button>
            </div>
            {catAddonList.map((a,i)=>(
              <div key={i} style={{ display:"flex", gap:6, marginBottom:6, alignItems:"center" }}>
                <input placeholder="Addon name" value={a.name} onChange={e=>{const c=[...catAddonList];c[i]={...c[i],name:e.target.value};setCatAddonList(c);}} style={{ flex:1, padding:"6px 8px", borderRadius:6, border:"1px solid #e2e8f0", fontSize:12, outline:"none" }} />
                <input type="number" placeholder="Price" value={a.price} onChange={e=>{const c=[...catAddonList];c[i]={...c[i],price:Number(e.target.value)};setCatAddonList(c);}} style={{ width:80, padding:"6px 8px", borderRadius:6, border:"1px solid #e2e8f0", fontSize:12, outline:"none" }} />
                {catAddonList.length>1&&<div onClick={()=>setCatAddonList(catAddonList.filter((_,j)=>j!==i))} style={{ cursor:"pointer", color:"#ef4444", fontSize:16, lineHeight:1, padding:"0 2px" }}>✕</div>}
              </div>
            ))}
          </div>
          <BtnPrimary onClick={handleSave} style={{ width:"100%" }}>{editId?"Update":"Save"} Category</BtnPrimary>
        </div>
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MENU PAGE (CRUD with sizes, addons)
// ═══════════════════════════════════════════════════════════════════════════
function MenuPage({ showToast, requireAdminReauth }) {
  const [dishes, setDishes] = useState([]);
  const [cats, setCats] = useState([]);
  const [menuLoaded, setMenuLoaded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [f, setF] = useState({ name:"", category:"", price:0, image:"", order:0, stock:0, threshold:5 });
  const [sizeList, setSizeList] = useState([]);
  const [addonList, setAddonList] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [search, setSearch] = useState("");
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkSelected, setBulkSelected] = useState(new Set());
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkAction, setBulkAction] = useState("price_flat");
  const [bulkValue, setBulkValue] = useState("");
  const imgRef = useRef(null);

  useEffect(() => {
    let loadCount = 0;
    const r = Outlet("dishes");
    const r2 = Outlet("categories");
    if (!r||!r2) return;
    const u1 = onValue(r, snap => { 
      const v=snap.val(); 
      const dishesData = v?Object.keys(v).map(k=>({id:k,...v[k]})).sort((a,b)=>(a.order||0)-(b.order||0)):[];
      dishesData.forEach(d => {
        if (typeof d.stock === "boolean") {
          update(Outlet(`dishes/${d.id}`), { stock: 0, threshold: 5 });
          d.stock = 0;
          d.threshold = 5;
        } else if (typeof d.stock !== "number") {
          d.stock = Number(d.stock) || 0;
        }
        d.threshold = Number(d.threshold) || 5;
      });
      setDishes(dishesData);
      loadCount++; if (loadCount >= 2) setMenuLoaded(true);
    });
    const u2 = onValue(r2, snap => { const v=snap.val(); setCats(v?Object.keys(v).map(k=>({id:k,...v[k]})):[]); loadCount++; if (loadCount >= 2) setMenuLoaded(true); });
    return () => { off(r,"value",u1); off(r2,"value",u2); };
  }, []);

  const filtered = useMemo(() => {
    if (!search) return dishes;
    const s = search.toLowerCase();
    return dishes.filter(d => d.name.toLowerCase().includes(s)||(d.category||"").toLowerCase().includes(s));
  }, [dishes, search]);

  const openForm = (d) => {
    setImageFile(null);
    setImagePreview(null);
    if (d) { setEditId(d.id); setF({ name:d.name||"", category:d.category||"", price:d.price||0, image:d.image||"", order:d.order||0, stock:typeof d.stock==="number"?d.stock:0, threshold:Number(d.threshold)||5 }); setSizeList(d.sizes?Object.entries(d.sizes).map(([n,p])=>({name:n,price:Number(p)})):[{name:"Regular",price:d.price||0}]); setAddonList(d.addons?Object.entries(d.addons).map(([n,p])=>({name:n,price:Number(p)})):[]); setImagePreview(d.image||null); }
    else { setEditId(null); setF({ name:"", category:cats[0]?.name||"", price:0, image:"", order:0, stock:0, threshold:5 }); setSizeList([{name:"Regular",price:0}]); setAddonList([]); setImagePreview(null); }
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!f.name.trim()||!f.category) return showToast("Fill name & category","warning");
    let sizes = null, addons = null;
    if (sizeList.some(s=>s.name.trim())) sizes = sizeList.filter(s=>s.name.trim()).reduce((a,{name:n,price:p})=>({...a,[n.trim()]:Number(p)}),{});
    if (addonList.some(s=>s.name.trim())) addons = addonList.filter(s=>s.name.trim()).reduce((a,{name:n,price:p})=>({...a,[n.trim()]:Number(p)}),{});
    let image = f.image;
    try {
      if (imageFile) {
        image = await uploadImage(imageFile, `dishes/${Date.now()}_${imageFile.name}`);
        if (editId && f.image) deleteImage(f.image).catch(()=>{});
      }
      const data = { name:f.name.trim(), category:f.category, price:Number(f.price), image, order:Number(f.order), stock:Number(f.stock), threshold:Number(f.threshold), sizes, addons };
      if (editId) { await update(Outlet(`dishes/${editId}`), data); showToast("Dish updated","success"); }
      else { await push(Outlet("dishes"), data); showToast("Dish added","success"); }
      setShowForm(false);
    } catch(e) { showToast("Failed: "+e.message,"error"); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this dish?")) return;
    if (requireAdminReauth && !(await requireAdminReauth())) return;
    try {
      await remove(Outlet(`dishes/${id}`));
      logAudit(_bizId, _outletId, "delete_dish", { dishId: id }, getCurrentAdminActor());
      showToast("Deleted","success");
    } catch(e) { showToast("Delete failed","error"); }
  };


  if (!menuLoaded) return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, gap:12 }}>
        <div style={{ flex:1, position:"relative", maxWidth:300 }}>
          <Search size={14} style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"#94a3b8" }} />
          <input placeholder="Search dishes..." value={search} onChange={e=>setSearch(e.target.value)} style={{ padding:"8px 10px 8px 32px", borderRadius:10, border:"1.5px solid #e2e8f0", fontSize:13, width:"100%", background:"#f8fafc", outline:"none" }} />
        </div>
        <BtnPrimary onClick={()=>openForm(null)}><Plus size={14} /> Add Dish</BtnPrimary>
      </div>
      <SkeletonGrid cards={6} />
    </div>
  );

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, gap:12 }}>
        <div style={{ flex:1, position:"relative", maxWidth:300 }}>
          <Search size={14} style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"#94a3b8" }} />
          <input placeholder="Search dishes..." value={search} onChange={e=>setSearch(e.target.value)} style={{ padding:"8px 10px 8px 32px", borderRadius:10, border:"1.5px solid #e2e8f0", fontSize:13, width:"100%", background:"#f8fafc", outline:"none" }} />
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <button type="button" onClick={() => { setBulkMode(!bulkMode); if (bulkMode) setBulkSelected(new Set()); }} style={{ padding:"8px 14px", borderRadius:8, border:bulkMode?"2px solid #3b82f6":"1.5px solid #e2e8f0", background:bulkMode?"#eff6ff":"white", color:bulkMode?"#3b82f6":"#475569", fontSize:12, fontWeight:600, cursor:"pointer" }}>
            {bulkMode ? `Done (${bulkSelected.size})` : "Bulk Edit"}
          </button>
          <BtnPrimary onClick={()=>openForm(null)}><Plus size={14} /> Add Dish</BtnPrimary>
        </div>
      </div>
      {bulkMode && bulkSelected.size > 0 && (
        <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:12, padding:"8px 12px", borderRadius:10, background:"#eff6ff", border:"1px solid #bfdbfe", fontSize:12 }}>
          <span style={{ fontWeight:600, color:"#3b82f6" }}>{bulkSelected.size} selected</span>
          <button onClick={() => setBulkSelected(new Set(filtered.map(d => d.id)))} style={{ padding:"3px 8px", borderRadius:4, border:"none", background:"#3b82f6", color:"white", fontSize:10, fontWeight:600, cursor:"pointer" }}>Select All</button>
          <button onClick={() => setBulkSelected(new Set())} style={{ padding:"3px 8px", borderRadius:4, border:"1px solid #e2e8f0", background:"white", color:"#64748b", fontSize:10, fontWeight:600, cursor:"pointer" }}>Clear</button>
          <select value={bulkAction} onChange={e => setBulkAction(e.target.value)} style={{ padding:"4px 6px", borderRadius:4, border:"1px solid #e2e8f0", fontSize:11 }}>
            <option value="price_flat">Set Price (flat)</option>
            <option value="price_pct">Adjust Price (%)</option>
            <option value="stock">Set Stock</option>
            <option value="category">Set Category</option>
          </select>
          <input type="text" value={bulkValue} onChange={e => setBulkValue(e.target.value)} placeholder={bulkAction === "category" ? "Category name" : bulkAction === "price_pct" ? "+/- %" : "Value"} style={{ width:100, padding:"4px 6px", borderRadius:4, border:"1px solid #e2e8f0", fontSize:11 }} />
          <button onClick={() => { if (bulkValue === "") return showToast("Enter a value","warning"); setShowBulkModal(true); }} style={{ padding:"4px 12px", borderRadius:4, border:"none", background:"#22c55e", color:"white", fontSize:11, fontWeight:600, cursor:"pointer" }}>Apply</button>
        </div>
      )}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(240px,1fr))", gap:16 }}>
        {filtered.map(d => (
          <GlassCard key={d.id} style={{ overflow:"hidden", position:"relative" }}>
            {bulkMode && (
              <div style={{ position:"absolute", top:8, left:8, zIndex:10 }}>
                <input type="checkbox" checked={bulkSelected.has(d.id)} onChange={e => { const s = new Set(bulkSelected); e.target.checked ? s.add(d.id) : s.delete(d.id); setBulkSelected(s); }} style={{ width:18, height:18, cursor:"pointer", accentColor:"#3b82f6" }} />
              </div>
            )}
            <div style={{ position:"relative" }}>
              <img src={d.image||"https://placehold.co/240/orange/white?text=Dish"} alt="" style={{ width:"100%", height:150, objectFit:"cover" }} />
              <div style={{ position:"absolute", top:8, right:8, padding:"4px 10px", borderRadius:6, fontSize:11, fontWeight:600, background:d.stock===0?"rgba(239,68,68,0.9)":d.stock<=(d.threshold||5)?"rgba(251,146,60,0.9)":"rgba(34,197,94,0.9)", color:"white" }}>
                {d.stock===0?"OUT OF STOCK":d.stock<=(d.threshold||5)?`⚠ Low (${d.stock})`:`✓ ${d.stock}`}
              </div>
              <div style={{ position:"absolute", bottom:8, left:8, padding:"2px 8px", borderRadius:6, fontSize:10, fontWeight:600, background:"rgba(0,0,0,0.6)", color:"white" }}>{d.category||"General"}</div>
            </div>
            <div style={{ padding:"12px 14px 14px" }}>
              <div style={{ fontSize:15, fontWeight:700, color:"#0f172a", marginBottom:6 }}>{d.name}</div>
              {d.sizes ? Object.entries(d.sizes).map(([sz,pr])=>(
                <div key={sz} style={{ display:"flex", justifyContent:"space-between", fontSize:12, padding:"2px 0" }}>
                  <span style={{ color:"#64748b" }}>{sz}</span><span style={{ fontWeight:600, color:"#0f172a" }}>₹{pr}</span>
                </div>
              )) : <div style={{ fontSize:14, fontWeight:700, color:ORANGE, marginBottom:6 }}>₹{d.price||0}</div>}
              <div style={{ display:"flex", gap:6, marginTop:8, paddingTop:8, borderTop:"1px solid #f1f5f9" }}>
                <Edit3 size={13} color="#3b82f6" style={{ cursor:"pointer" }} onClick={()=>openForm(d)} />
                <Trash2 size={13} color="#ef4444" style={{ cursor:"pointer" }} onClick={()=>handleDelete(d.id)} />
                <span style={{ flex:1 }} />
                <button type="button" onClick={async (e) => { e.stopPropagation(); try { await push(Outlet("inventory"), { name: d.name, dishId: d.id, stock: 0, threshold: 5, unit: "units", updatedAt: new Date().toISOString() }); showToast("Now tracking stock for " + d.name, "success"); } catch(e) { showToast("Failed: " + (e?.message || e), "error"); } }} style={{ padding:"3px 8px", borderRadius:6, border:"1px solid #e2e8f0", background:"white", color:ORANGE, fontSize:10, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap" }}>
                  + Track Stock
                </button>
              </div>
            </div>
          </GlassCard>
        ))}
        {filtered.length===0&&<div style={{ gridColumn:"1/-1", textAlign:"center", padding:40, color:"#94a3b8" }}>No dishes found</div>}
      </div>
      <Modal open={showForm} onClose={()=>setShowForm(false)} wide>
        <h3 style={{ fontSize:16, fontWeight:700, color:"#0f172a", marginBottom:16 }}>{editId?"Edit Dish":"Add Dish"}</h3>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <Input placeholder="Dish name" value={f.name} onChange={e=>setF({...f,name:e.target.value})} />
          <Select value={f.category} onChange={e=>setF({...f,category:e.target.value})}>
            <option value="">Category</option>
            {cats.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}
          </Select>
          <Input type="number" placeholder="Base price" value={f.price} onChange={e=>setF({...f,price:e.target.value})} />
          <div onClick={()=>imgRef.current?.click()} style={{ border:"1.5px dashed #e2e8f0", borderRadius:10, padding:8, cursor:"pointer", textAlign:"center", minHeight:80, display:"flex", alignItems:"center", justifyContent:"center", background:"#fafafa" }}>
            {imagePreview ? <img src={imagePreview} alt="preview" style={{ maxHeight:80, borderRadius:6 }} /> : <span style={{ fontSize:12, color:"#94a3b8" }}>Click to upload image</span>}
            <input ref={imgRef} type="file" accept="image/*" hidden onChange={e=>{const file=e.target.files[0];if(file){setImageFile(file);setImagePreview(URL.createObjectURL(file));}}} />
          </div>
           <Input type="number" placeholder="Display order" value={f.order} onChange={e=>setF({...f,order:e.target.value})} />
           <Input type="number" placeholder="Stock quantity" value={f.stock} onChange={e=>setF({...f,stock:e.target.value})} min="0" />
           <Input type="number" placeholder="Low stock threshold" value={f.threshold} onChange={e=>setF({...f,threshold:e.target.value})} min="1" />
          <div style={{ gridColumn:"1/-1" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
              <span style={{ fontSize:12, fontWeight:600, color:"#475569" }}>Sizes</span>
              <button type="button" onClick={()=>setSizeList([...sizeList,{name:"",price:0}])} style={{ fontSize:11, color:ORANGE, background:"none", border:"none", cursor:"pointer", fontWeight:600 }}>+ Add Size</button>
            </div>
            {sizeList.map((s,i)=>(
              <div key={i} style={{ display:"flex", gap:6, marginBottom:6, alignItems:"center" }}>
                <input placeholder="Size name" value={s.name} onChange={e=>{const c=[...sizeList];c[i]={...c[i],name:e.target.value};setSizeList(c);}} style={{ flex:1, padding:"6px 8px", borderRadius:6, border:"1px solid #e2e8f0", fontSize:12, outline:"none" }} />
                <input type="number" placeholder="Price" value={s.price} onChange={e=>{const c=[...sizeList];c[i]={...c[i],price:Number(e.target.value)};setSizeList(c);}} style={{ width:80, padding:"6px 8px", borderRadius:6, border:"1px solid #e2e8f0", fontSize:12, outline:"none" }} />
                {sizeList.length>1&&<div onClick={()=>setSizeList(sizeList.filter((_,j)=>j!==i))} style={{ cursor:"pointer", color:"#ef4444", fontSize:16, lineHeight:1, padding:"0 2px" }}>✕</div>}
              </div>
            ))}
          </div>
          <div style={{ gridColumn:"1/-1" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
              <span style={{ fontSize:12, fontWeight:600, color:"#475569" }}>Addons</span>
              <button type="button" onClick={()=>setAddonList([...addonList,{name:"",price:0}])} style={{ fontSize:11, color:ORANGE, background:"none", border:"none", cursor:"pointer", fontWeight:600 }}>+ Add Addon</button>
            </div>
            {addonList.map((a,i)=>(
              <div key={i} style={{ display:"flex", gap:6, marginBottom:6, alignItems:"center" }}>
                <input placeholder="Addon name" value={a.name} onChange={e=>{const c=[...addonList];c[i]={...c[i],name:e.target.value};setAddonList(c);}} style={{ flex:1, padding:"6px 8px", borderRadius:6, border:"1px solid #e2e8f0", fontSize:12, outline:"none" }} />
                <input type="number" placeholder="Price" value={a.price} onChange={e=>{const c=[...addonList];c[i]={...c[i],price:Number(e.target.value)};setAddonList(c);}} style={{ width:80, padding:"6px 8px", borderRadius:6, border:"1px solid #e2e8f0", fontSize:12, outline:"none" }} />
                {addonList.length>1&&<div onClick={()=>setAddonList(addonList.filter((_,j)=>j!==i))} style={{ cursor:"pointer", color:"#ef4444", fontSize:16, lineHeight:1, padding:"0 2px" }}>✕</div>}
              </div>
            ))}
          </div>
        </div>
        <BtnPrimary onClick={handleSave} style={{ width:"100%", marginTop:16 }}>{editId?"Update":"Save"} Dish</BtnPrimary>
      </Modal>

      <Modal open={showBulkModal} onClose={()=>setShowBulkModal(false)}>
        <h3 style={{ fontSize:16, fontWeight:700, color:"#0f172a", marginBottom:12 }}>Confirm Bulk Update</h3>
        <div style={{ fontSize:13, color:"#475569", marginBottom:16 }}>
          Apply <strong>{bulkAction === "price_flat" ? "new price" : bulkAction === "price_pct" ? "price adjustment" : bulkAction}</strong> = <strong>{bulkValue}</strong> to <strong>{bulkSelected.size}</strong> dish{bulkSelected.size > 1 ? "es" : ""}?
        </div>
        <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
          <button onClick={() => setShowBulkModal(false)} style={{ padding:"8px 16px", borderRadius:8, border:"1.5px solid #e2e8f0", background:"white", color:"#64748b", fontSize:12, fontWeight:600, cursor:"pointer" }}>Cancel</button>
          <button onClick={async () => {
            setShowBulkModal(false);
            const ids = [...bulkSelected];
            let success = 0, fail = 0;
            for (const id of ids) {
              try {
                const dish = dishes.find(d => d.id === id);
                if (!dish) continue;
                const updates = {};
                if (bulkAction === "price_flat") {
                  updates.price = Number(bulkValue);
                  updates.sizes = null;
                } else if (bulkAction === "price_pct") {
                  const pct = Number(bulkValue);
                  if (dish.sizes) {
                    const newSizes = {};
                    Object.entries(dish.sizes).forEach(([sz, pr]) => { newSizes[sz] = Math.max(0, Math.round(Number(pr) * (1 + pct / 100))); });
                    updates.sizes = newSizes;
                  } else {
                    updates.price = Math.max(0, Math.round(Number(dish.price) * (1 + pct / 100)));
                  }
                } else if (bulkAction === "stock") {
                  updates.stock = Math.max(0, Number(bulkValue));
                } else if (bulkAction === "category") {
                  updates.category = bulkValue.trim();
                }
                if (Object.keys(updates).length) {
                  await update(Outlet(`dishes/${id}`), updates);
                  success++;
                }
              } catch (e) { fail++; }
            }
            showToast(`Updated ${success} dish${success !== 1 ? "es" : ""}${fail ? `, ${fail} failed` : ""}`, fail ? "warning" : "success");
            setBulkSelected(new Set());
          }} style={{ padding:"8px 16px", borderRadius:8, border:"none", background:"#22c55e", color:"white", fontSize:12, fontWeight:600, cursor:"pointer" }}>Apply to All</button>
        </div>
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DISCOUNT EVALUATOR (shared by POS checkout + reactive preview)
// ═══════════════════════════════════════════════════════════════════════════

const DISC_CACHE_TTL = 30000;
let _discCache = { data: null, fetchedAt: 0 };

async function fetchDiscounts() {
  const now = Date.now();
  if (_discCache.data && now - _discCache.fetchedAt < DISC_CACHE_TTL) return _discCache.data;
  const snap = await get(Outlet("discounts"));
  _discCache.data = snap.val() || {};
  _discCache.fetchedAt = now;
  return _discCache.data;
}

function cartHasCategory(cart, categoryIds) {
  if (!Array.isArray(cart) || !Array.isArray(categoryIds) || !categoryIds.length) return false;
  return cart.some(([, item]) => categoryIds.includes(item.category));
}

function discountAmount(d, subtotal) {
  let amt = d.type === "percentage" ? subtotal * Number(d.value) / 100 : Number(d.value) || 0;
  if (d.maxCap && amt > Number(d.maxCap)) amt = Number(d.maxCap);
  return Math.round(amt);
}

const DISC_PRIORITY = { first_order: 4, coupon: 3, category: 2, percentage: 1, flat: 1, bogo: 0 };

function evaluateDiscounts(discounts, ctx) {
  const { subtotal, cart, customer, couponCode, orderType, now = Date.now() } = ctx;
  if (!subtotal || subtotal <= 0 || !discounts) return null;

  const list = Object.entries(discounts)
    .filter(([, d]) => d && d.type && d.value != null)
    .map(([id, d]) => ({ id, ...d }));

  const candidates = list.filter(d =>
    d.enabled !== false
    && now >= (d.startsAt || 0)
    && (!d.endsAt || now <= d.endsAt)
    && (!d.minSubtotal || subtotal >= Number(d.minSubtotal))
    && (!d.globalLimit || (d.stats?.usedCount || 0) < d.globalLimit)
    && (!d.applicableTo || d.applicableTo === "all" || d.applicableTo === orderType?.toLowerCase())
  );

  const applicable = candidates.filter(d => {
    if (d.type === "percentage" || d.type === "flat") return true;
    if (d.type === "first_order") return !customer?.firstOrderDiscountUsed;
    if (d.type === "category") return cartHasCategory(cart, d.categoryIds);
    if (d.type === "coupon") return !!couponCode && String(couponCode).toLowerCase() === String(d.couponCode || "").toLowerCase();
    return false;
  });

  if (!applicable.length) return null;

  const byGroup = new Map();
  for (const d of applicable) {
    const g = d.exclusiveGroup || "__none__";
    if (!byGroup.has(g)) byGroup.set(g, []);
    byGroup.get(g).push(d);
  }

  const pickBest = (group) => group.slice().sort((a, b) => {
    const pa = DISC_PRIORITY[a.type] || 0, pb = DISC_PRIORITY[b.type] || 0;
    if (pa !== pb) return pb - pa;
    return discountAmount(b, subtotal) - discountAmount(a, subtotal);
  })[0];

  const bestPerGroup = [...byGroup.values()].map(g => pickBest(g));
  const exclusive = bestPerGroup.filter(d => !d.stackable);
  const stackable = bestPerGroup.filter(d => d.stackable);
  const chosen = exclusive.length > 0 ? [pickBest(exclusive, subtotal), ...stackable] : bestPerGroup;

  let total = 0;
  for (const d of chosen) total += discountAmount(d, subtotal);
  total = Math.min(total, subtotal);
  if (total <= 0) return null;

  const primary = chosen[0];
  return {
    discount: primary,
    allApplied: chosen,
    amount: total,
    label: primary.name || (primary.type === "first_order" ? "New Customer Discount" : "Discount"),
    source: primary.type === "coupon" ? `coupon:${primary.couponCode}` : primary.type === "first_order" ? "firstOrder" : `auto:${primary.type}`,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// POS PAGE (Walk-in cart, checkout)
// ═══════════════════════════════════════════════════════════════════════════
function POSPage({ showToast, outletInfo }) {
  const [dishes, setDishes] = useState([]);
  const [cats, setCats] = useState([]);
  const [catFilter, setCatFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState({});
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [discount, setDiscount] = useState(0);
  const [discFlat, setDiscFlat] = useState(0);
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(null);
  const [tableNo, setTableNo] = useState("");
  const [payMethod, setPayMethod] = useState("Cash");
  const [orderType, setOrderType] = useState("Dine-in");
  const [orderNotes, setOrderNotes] = useState("");
  const [selModal, setSelModal] = useState(null);
  const [selSize, setSelSize] = useState("");
  const [selAddons, setSelAddons] = useState({});
  const [selQty, setSelQty] = useState(1);
  const [editKey, setEditKey] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [posDiscounts, setPosDiscounts] = useState(null);
  const [posAllOrders, setPosAllOrders] = useState([]);
  const [posLoaded, setPosLoaded] = useState(false);
  const [posOffline, setPosOffline] = useState(false);
  const [deliverySettings, setDeliverySettings] = useState(null);
  const [deliveryDist, setDeliveryDist] = useState("");
  const [deliveryFee, setDeliveryFee] = useState(0);

  useEffect(() => {
    const r = Outlet("dishes"); const r2 = Outlet("categories"); const r3 = Outlet("discounts"); const r4 = Outlet("orders");
    if (!r||!r2) return;
    if (!isConnected()) { setPosOffline(true); return; }
    const u1 = onValue(r, snap => { const v=snap.val(); setDishes(v?Object.keys(v).map(k=>({id:k,...v[k]})):[]); setPosLoaded(true); });
    const u2 = onValue(r2, snap => { const v=snap.val(); setCats(v?Object.keys(v).map(k=>({id:k,...v[k]})):[]); });
    const u3 = r3 ? onValue(r3, snap => setPosDiscounts(snap.val() || {})) : null;
    const u4 = r4 ? onValue(r4, snap => { const v=snap.val(); setPosAllOrders(v?Object.keys(v).map(k=>({id:k,...v[k]})):[]); }) : null;
    return () => { off(r,"value",u1); off(r2,"value",u2); if (u3) off(r3,"value",u3); if (u4) off(r4,"value",u4); };
  }, []);

  // Load delivery settings for fee calculation
  useEffect(() => {
    const r = Outlet("settings/Delivery");
    if (!r) return;
    const u = onValue(r, snap => setDeliverySettings(snap.val() || {}));
    return () => off(r, "value", u);
  }, []);

  // Recalculate delivery fee when distance or slabs change
  useEffect(() => {
    const dist = Number(deliveryDist);
    if (orderType !== "Delivery" || !dist || dist <= 0 || !deliverySettings?.slabs) {
      setDeliveryFee(0);
      return;
    }
    const slabs = deliverySettings.slabs;
    // Find the highest slab where distance >= km threshold
    let fee = 0;
    for (const s of slabs) {
      if (dist >= Number(s.km)) fee = Number(s.fee) || 0;
    }
    setDeliveryFee(fee);
  }, [deliveryDist, deliverySettings, orderType]);

  // Auto-retry POS load on connection restore
  useEffect(() => {
    if (!posOffline) return;
    const unsub = onConnectionChange((online) => {
      if (!online) return;
      setPosOffline(false);
      setPosLoaded(false);
      const r = Outlet("dishes"); const r2 = Outlet("categories"); const r3 = Outlet("discounts"); const r4 = Outlet("orders");
      if (!r||!r2) return;
      const u1 = onValue(r, snap => { const v=snap.val(); setDishes(v?Object.keys(v).map(k=>({id:k,...v[k]})):[]); setPosLoaded(true); });
      const u2 = onValue(r2, snap => { const v=snap.val(); setCats(v?Object.keys(v).map(k=>({id:k,...v[k]})):[]); });
      const u3 = r3 ? onValue(r3, snap => setPosDiscounts(snap.val() || {})) : null;
      const u4 = r4 ? onValue(r4, snap => { const v=snap.val(); setPosAllOrders(v?Object.keys(v).map(k=>({id:k,...v[k]})):[]); }) : null;
      unsub();
    });
    return unsub;
  }, [posOffline]);

  // Reactive auto-discount evaluation on cart/customer/coupon change
  useEffect(() => {
    const hasManual = Number(discFlat) > 0 || discount > 0 || couponApplied;
    if (!posDiscounts || !cartItems.length || hasManual) { setAutoDisc(null); return; }
    const cleanPhone = custPhone ? custPhone.replace(/\D/g, "") : "";
    const hasPrevOrder = cleanPhone && cleanPhone !== "Walk-in" && posAllOrders.some(o => o.phone && o.phone.replace(/\D/g, "") === cleanPhone);
    const customer = cleanPhone && cleanPhone !== "Walk-in" ? { firstOrderDiscountUsed: hasPrevOrder } : null;
    const result = evaluateDiscounts(posDiscounts, {
      subtotal: cartItems.reduce((s,[_,i])=>s+i.price*i.qty,0), cart: cartItems,
      customer, couponCode: couponCode || null, orderType, now: Date.now(),
    });
    setAutoDisc(result);
  }, [cartItems, custPhone, couponCode, orderType, posDiscounts, discFlat, discount, couponApplied]);

  const addToCart = () => {
    if (!selModal||!selSize) return showToast("Select a size first","warning");
    const sizes = selModal.sizes||{};
    const basePrice = sizes[selSize] ?? selModal.price ?? 0;
    const addonTotal = Object.values(selAddons).reduce((a,b)=>a+Number(b),0);
    const pricePerItem = Number(basePrice) + addonTotal;
    const key = `${selModal.id}::${selSize}::${Object.keys(selAddons).sort().join("|")}`;
    setCart(prev => {
      let next = {...prev};
      if (editKey) delete next[editKey];
      if (next[key]) next[key] = {...next[key], qty: next[key].qty + selQty};
      else next[key] = { id:selModal.id, name:selModal.name, category:selModal.category, size:selSize, price:pricePerItem, qty:selQty, addons:Object.entries(selAddons).map(([n,p])=>({name:n,price:Number(p)})) };
      return next;
    });
    setEditKey(null);
    setSelModal(null);
    showToast(`${selQty}x ${selModal.name} ${editKey?"updated":"added"}`,"success");
  };

  const addToCartRef = useRef(addToCart);
  addToCartRef.current = addToCart;

  useEffect(() => {
    const handler = (e) => {
      if (!selModal) return;
      if (e.key === "Escape") { setSelModal(null); setEditKey(null); }
      if (e.key === "Enter") { e.preventDefault(); addToCartRef.current(); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [selModal]);

  const filtered = useMemo(() => {
    let list = dishes;
    if (catFilter !== "All") list = list.filter(d => d.category === catFilter);
    if (search) { const s=search.toLowerCase(); list = list.filter(d => d.name.toLowerCase().includes(s)); }
    return list;
  }, [dishes, catFilter, search]);

  const openSelection = (dish) => {
    setEditKey(null);
    setSelModal(dish);
    const sizes = dish.sizes ? Object.keys(dish.sizes) : ["Standard"];
    setSelSize(sizes[0]);
    setSelAddons({});
    setSelQty(1);
  };

  const openEditCartItem = (key, item) => {
    const dish = dishes.find(d => d.id === item.id);
    if (!dish) return showToast("Original dish no longer available","error");
    setEditKey(key);
    setSelModal(dish);
    setSelSize(item.size);
    const addonsMap = {};
    (item.addons||[]).forEach(a => { addonsMap[a.name] = a.price; });
    setSelAddons(addonsMap);
    setSelQty(item.qty);
  };

  const updateCartQty = (key, delta) => {
    setCart(prev => {
      const next = {...prev};
      if (next[key]) { next[key] = {...next[key], qty: Math.max(1, next[key].qty + delta)}; if (next[key].qty <= 0) delete next[key]; }
      return next;
    });
  };

  const removeFromCart = (key) => {
    setCart(prev => { const next = {...prev}; delete next[key]; return next; });
  };

  const clearCart = () => {
    setCart({}); setDiscount(0); setDiscFlat(0); setCouponCode(""); setCouponApplied(null); setCustName(""); setCustPhone(""); setOrderNotes(""); setOrderType("Dine-in"); setTableNo("");
  };

  const [autoDisc, setAutoDisc] = useState(null);
  const cartItems = Object.entries(cart);
  const subtotal = cartItems.reduce((s,[_,i])=>s+i.price*i.qty,0);
  const manualDiscVal = Number(discFlat) > 0 ? Number(discFlat) : (discount > 0 ? subtotal * discount / 100 : 0);
  const discVal = autoDisc?.amount || manualDiscVal;
  const couponDiscVal = couponApplied ? (couponApplied.type === "flat" ? couponApplied.value : Math.min(subtotal * Number(couponApplied.value) / 100, Number(couponApplied.maxCap) || Infinity)) : 0;
  const totalDisc = discVal + couponDiscVal;
  const taxVal = (subtotal - totalDisc) * 0.05;
  const total = Math.max(0, subtotal - totalDisc + taxVal + (orderType === "Delivery" ? deliveryFee : 0));

  const printReceiptHtml = useCallback((orderData, discLabel) => {
    const itemsHtml = Object.values(orderData.cart).map(i =>
      `<tr><td style="padding:4px 8px;border-bottom:1px dashed #ddd">${i.qty}x ${i.name}${i.size ? ` (${i.size})` : ""}</td><td style="padding:4px 8px;border-bottom:1px dashed #ddd;text-align:right">₹${(i.price * i.qty).toLocaleString("en-IN")}</td></tr>`
    ).join("");
    const taxLine = orderData.tax > 0 ? `<tr><td style="padding:4px 8px">Tax (5%)</td><td style="padding:4px 8px;text-align:right">₹${Number(orderData.tax).toLocaleString("en-IN")}</td></tr>` : "";
    const discLine = orderData.discount > 0 ? `<tr><td style="padding:4px 8px">Discount${discLabel ? ` (${discLabel})` : ""}</td><td style="padding:4px 8px;text-align:right;color:#ef4444">-₹${Number(orderData.discount).toLocaleString("en-IN")}</td></tr>` : "";
    const tableLine = orderData.tableNo ? `<div style="text-align:center;font-size:11px;color:#64748b;margin-bottom:4px">Table ${orderData.tableNo}</div>` : "";
    const storeLine = outletInfo?.name ? `<h2>${esc(outletInfo.name)}</h2>` : `<h2>FoodHubbie</h2>`;
    const addrLine = outletInfo?.address ? `<div class="addr">${esc(outletInfo.address)}</div>` : "";
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Receipt</title><style>body{font-family:monospace;font-size:12px;width:280px;margin:0 auto;padding:16px;color:#1e293b}h2{font-size:16px;text-align:center;margin:0 0 4px}.addr{font-size:10px;text-align:center;color:#64748b;margin-bottom:12px}hr{border:none;border-top:1px dashed #94a3b8;margin:8px 0}table{width:100%;border-collapse:collapse}.total td{padding:6px 8px;font-weight:700;font-size:14px}.footer{text-align:center;font-size:10px;color:#94a3b8;margin-top:12px}</style></head><body>
      ${storeLine}${addrLine}
      <div style="text-align:center;font-size:11px;color:#64748b;margin-bottom:2px">#${orderData.orderId}</div>
      ${tableLine}
      <div style="text-align:center;font-size:11px;color:#64748b;margin-bottom:8px">${esc(orderData.customerName)}${orderData.phone !== "Walk-in" ? ` · ${orderData.phone}` : ""}</div>
      <hr>${itemsHtml}<hr>
      <tr><td style="padding:4px 8px">Subtotal</td><td style="padding:4px 8px;text-align:right">₹${Number(orderData.subtotal).toLocaleString("en-IN")}</td></tr>
      ${discLine}${taxLine}
      <tr class="total"><td style="padding:6px 8px">TOTAL</td><td style="padding:6px 8px;text-align:right;font-size:16px">₹${Number(orderData.total).toLocaleString("en-IN")}</td></tr>
      <hr><div style="text-align:center;font-size:11px;color:#64748b">${orderData.paymentMethod} · ${orderData.paymentStatus}</div>
      <div class="footer">Thank you for your order!</div></body></html>`;
  }, [outletInfo]);

  const printReceipt = useCallback((html) => {
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:0";
    document.body.appendChild(iframe);
    const iframeDoc = iframe.contentWindow.document;
    iframeDoc.open(); iframeDoc.write(html); iframeDoc.close();
    setTimeout(() => {
      try { iframe.contentWindow.focus(); iframe.contentWindow.print(); } catch (_) {}
      setTimeout(() => document.body.removeChild(iframe), 1000);
    }, 300);
  }, []);

  const handleCheckout = async () => {
    if (cartItems.length === 0) return showToast("Cart is empty","error");
    if (custPhone && !/^[0-9]{10}$/.test(custPhone.replace(/\D/g, ""))) {
      return showToast("Valid phone required (10 digits)","error");
    }
    if (!_outletId) return showToast("Outlet not configured - refresh or re-login","error");
    setLoading(true);
    try {
      const [dishesSnap, catsSnap, discountsSnap, ordersSnap] = await Promise.all([
        get(Outlet("dishes")),
        get(Outlet("categories")),
        get(Outlet("discounts")),
        get(Outlet("orders"))
      ]);
      const freshDishes = dishesSnap.val() || {};
      const freshCats = catsSnap.val() || {};
      const discounts = discountsSnap.val() || {};
      const allOrders = ordersSnap.val() || {};

      for (const [key, item] of cartItems) {
        const dish = freshDishes[item.id];
        if (!dish) throw new Error(item.name + " no longer available");
        const availStock = Number(dish.stock) || 0;
        if (availStock < item.qty) throw new Error(`${item.name}: only ${availStock} in stock, you ordered ${item.qty}`);
        const sizes = dish.sizes || {};
        const basePrice = Number(sizes[item.size] ?? dish.price ?? 0);
        const cat = freshCats[dish.category] || {};
        const catAddons = cat.addons || {};
        const dishAddons = dish.addons || {};
        let addonTotal = 0;
        for (const a of (item.addons || [])) {
          const serverPrice = Number(catAddons[a.name] ?? dishAddons[a.name] ?? -1);
          if (serverPrice < 0) throw new Error(`${item.name}: addon "${a.name}" no longer available`);
          addonTotal += serverPrice;
        }
        const expectedPrice = basePrice + addonTotal;
        if (Math.abs(expectedPrice - Number(item.price)) > 0.01) {
          throw new Error(`${item.name} (${item.size}) price changed — expected ₹${expectedPrice.toFixed(2)}, cart shows ₹${Number(item.price).toFixed(2)}. Re-add the item.`);
        }
      }

      const cleanPhone = custPhone ? custPhone.replace(/\D/g, "") : "";

      // Resolve final discount: manual overrides auto
      const hasManualFlat = Number(discFlat) > 0;
      const hasManualPct = !hasManualFlat && discount > 0;
      let finalDiscVal, discLabel, finalDiscId, discSource;

      if (hasManualFlat) {
        finalDiscVal = Number(discFlat);
        discLabel = `Flat ₹${discFlat}`;
        finalDiscId = null; discSource = "manual:flat";
      } else if (hasManualPct) {
        finalDiscVal = subtotal * discount / 100;
        discLabel = `${discount}%`;
        finalDiscId = null; discSource = "manual:percent";
      } else {
        // Use shared evaluator
        const hasPrevOrder = cleanPhone && cleanPhone !== "Walk-in" && Object.values(allOrders).some(o => o.phone && o.phone.replace(/\D/g, "") === cleanPhone);
        const evalResult = evaluateDiscounts(discounts, {
          subtotal, cart: cartItems,
          customer: cleanPhone ? { firstOrderDiscountUsed: hasPrevOrder } : null,
          couponCode: couponCode || null, orderType, now: Date.now(),
        });

        // Also check BOGO
        let bogoVal = 0;
        const bogoDisc = Object.values(discounts).find(d => d.enabled && d.type === "bogo" && (!d.startsAt || Date.now() >= d.startsAt) && (!d.endsAt || Date.now() <= d.endsAt));
        if (bogoDisc) {
          const cheapest = cartItems.reduce((min, [, item]) => Math.min(min, item.price), Infinity);
          bogoVal = cheapest * Math.floor(cartItems.reduce((s, [, item]) => s + item.qty, 0) / 2);
        }

        const evalAmt = evalResult?.amount || 0;
        if (bogoVal > evalAmt) {
          finalDiscVal = bogoVal;
          discLabel = bogoDisc?.name || "BOGO";
          finalDiscId = bogoDisc?.id || null;
          discSource = "auto:bogo";
        } else if (evalResult) {
          finalDiscVal = evalAmt;
          discLabel = evalResult.label;
          finalDiscId = evalResult.discount?.id || null;
          discSource = evalResult.source;
        } else {
          finalDiscVal = 0;
          discLabel = "";
          finalDiscId = null;
          discSource = "none";
        }
      }

      const finalTotal = Math.max(0, subtotal - finalDiscVal + taxVal + (orderType === "Delivery" ? deliveryFee : 0));

      // Atomic order ID via runTransaction
      const today = new Date();
      const dateStr = `${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2,"0")}${today.getDate().toString().padStart(2,"0")}`;
      const seqRef = Outlet(`metadata/orderSequence/${dateStr}`);
      const { committed, snapshot } = await runTransaction(seqRef, (cur) => (cur || 0) + 1);
      if (!committed) throw new Error("Order ID collision — please retry");
      const orderId = `${dateStr}-${String(snapshot.val()).padStart(4, "0")}`;

      const orderData = {
        orderId, cart:Object.values(cart), subtotal, discount:finalDiscVal, tax:taxVal, total:finalTotal,
        paymentMethod:payMethod, paymentStatus:"Paid", customerName:custName||"Walk-in", phone:custPhone||"Walk-in",
        status: orderType === "Dine-in" ? "Confirmed" : "Placed", type:orderType, notes:orderNotes,
        discountId: finalDiscId, discountName: discLabel || null, discountSource: discSource || null,
        couponCode: couponCode || null, tableNo: tableNo || null, stockDeducted: true,
        outletAddress: outletInfo?.address || "", createdAt:new Date().toISOString(), outlet:_outletId,
        createdBy: getCurrentAdminActor()?.email || null,
        deliveryFee: orderType === "Delivery" ? deliveryFee : 0,
        deliveryDistance: orderType === "Delivery" ? Number(deliveryDist) || 0 : 0
      };

      await set(Outlet(`orders/${orderId}`), orderData);

      for (const [key, item] of cartItems) {
        const newStock = Math.max(0, (Number(freshDishes[item.id].stock) || 0) - item.qty);
        await update(Outlet(`dishes/${item.id}`), { stock: newStock });
      }

      // Auto-deduct from inventory (by dishId match, then name fallback)
      try {
        const invSnap = await get(Outlet("inventory"));
        const inventory = invSnap.val() || {};
        for (const [, item] of cartItems) {
          const itemName = (item.name || "").toLowerCase();
          let invEntry = Object.entries(inventory).find(([, data]) => data.dishId === item.id);
          if (!invEntry) invEntry = Object.entries(inventory).find(([, data]) => (data.name || "").toLowerCase() === itemName);
          if (invEntry) {
            const [invId, invData] = invEntry;
            const prevStock = Number(invData.stock) || 0;
            const nextStock = Math.max(0, prevStock - (item.qty || 1));
            await update(Outlet(`inventory/${invId}`), { stock: nextStock });
            if (!invData.dishId && item.id) {
              await update(Outlet(`inventory/${invId}`), { dishId: item.id });
            }
          }
        }
      } catch (e) { console.warn("[Inventory] Auto-deduct error:", e); }

      if (finalDiscId && finalDiscVal > 0) {
        const usageRef = Outlet(`discountsUsage/${orderId}`);
        await set(usageRef, { discountId: finalDiscId, discountLabel: discLabel, orderId, customerPhone: custPhone || "Walk-in", customerName: custName || "", amountGiven: Math.round(finalDiscVal), channel: "pos", source: discSource || "", appliedAt: Date.now() });
        try {
          await runTransaction(Outlet(`discounts/${finalDiscId}/stats`), (cur) => {
            cur = cur || {};
            return { usedCount: (cur.usedCount || 0) + 1, totalDiscountGiven: (cur.totalDiscountGiven || 0) + Math.round(finalDiscVal), lastUsedAt: Date.now() };
          });
        } catch (_) {}
      }

      // Customer LTV tracking
      if (cleanPhone && cleanPhone !== "Walk-in") {
        try {
          const custRef = Outlet(`customers/${cleanPhone}`);
          await runTransaction(custRef, (cur) => {
            const data = cur || { phone: cleanPhone, orderCount: 0, totalSpent: 0, firstOrder: cleanPhone };
            return { ...data, name: custName || data.name || "", phone: cleanPhone, orderCount: (data.orderCount || 0) + 1, totalSpent: (data.totalSpent || 0) + finalTotal, lastSeen: new Date().toISOString(), lastOrderId: orderId, lastOrderTotal: finalTotal };
          });
        } catch (_) {}
      }

      logAudit(_bizId, _outletId, "pos_checkout", {
        orderId, total: finalTotal, paymentMethod: payMethod, type: orderType, autoDisc: discLabel,
        items: Object.values(cart).map(i => ({ id: i.id, name: i.name, size: i.size, qty: i.qty, price: i.price }))
      }, getCurrentAdminActor());

      showToast(`Sale #${orderId} completed!${discLabel ? ` (${discLabel})` : ""}`,"success");
      printReceipt(printReceiptHtml(orderData, discLabel));
      clearCart();
      setAutoDisc(null);
      setCouponApplied(null);
    } catch(e) { showToast("Checkout failed: "+e.message,"error"); }
    finally { setLoading(false); }
  };

  const catAddons = selModal ? (cats.find(c=>c.name===selModal.category)?.addons||{}) : {};

  if (posOffline) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"calc(100vh - 140px)", gap:16, color:"#64748b" }}>
      <div style={{ width:64, height:64, borderRadius:16, background:"#f1f5f9", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <WifiOff size={28} color="#94a3b8" />
      </div>
      <div style={{ fontSize:16, fontWeight:700, color:"#0f172a" }}>Waiting for connection</div>
      <div style={{ fontSize:13, textAlign:"center", maxWidth:300 }}>The POS menu will load automatically when the connection is restored.</div>
      <button type="button" onClick={() => { setPosOffline(false); setPosLoaded(false); window.location.reload(); }} style={{ padding:"10px 24px", borderRadius:10, background:ORANGE, color:"white", border:"none", cursor:"pointer", fontSize:13, fontWeight:600, marginTop:8 }}>Retry Now</button>
    </div>
  );

  if (!posLoaded) return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 360px", gap:16, height:"calc(100vh - 140px)" }}>
      <SkeletonGrid cards={8} />
      <div />
    </div>
  );

  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 360px", gap:16, height:"calc(100vh - 140px)" }}>
      {/* Left: Menu Grid */}
      <div style={{ display:"flex", flexDirection:"column", overflow:"hidden", minHeight:0 }}>
        <div className="flex gap-2 mb-3" style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap" }}>
          <div style={{ position:"relative", flex:1, minWidth:150 }}>
            <Search size={14} style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"#94a3b8" }} />
            <input placeholder="Search dishes..." value={search} onChange={e=>setSearch(e.target.value)} style={{ padding:"8px 10px 8px 32px", borderRadius:10, border:"1.5px solid #e2e8f0", fontSize:13, width:"100%", background:"#f8fafc", outline:"none" }} />
          </div>
        </div>
        <div className="flex gap-2 mb-3" style={{ display:"flex", gap:6, marginBottom:12, flexWrap:"wrap", overflowX:"auto" }}>
          {["All", ...new Set(cats.map(c=>c.name))].map(c => (
            <div key={c} onClick={()=>setCatFilter(c)} style={{ padding:"5px 14px", borderRadius:8, cursor:"pointer", fontSize:12, fontWeight:600, whiteSpace:"nowrap", color:catFilter===c?"white":"#64748b", background:catFilter===c?ORANGE:"#f1f5f9" }}>{c}</div>
          ))}
        </div>
        <div style={{ flex:1, overflow:"auto", display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(140px,1fr))", gap:12, alignContent:"start", minHeight:0 }}>
           {filtered.map(d => {
              const price = d.sizes ? Object.values(d.sizes)[0] : (d.price||0);
              const isOos = (d.stock||0) === 0;
              const isLow = !isOos && d.stock <= (d.threshold || 5);
              return <div key={d.id} onClick={()=>!isOos && openSelection(d)} style={{ background:"white", borderRadius:12, cursor:isOos?"not-allowed":"pointer", border:"1px solid #f1f5f9", transition:"transform 0.15s", display:"flex", flexDirection:"column", minHeight:260, position:"relative", opacity:isOos?0.5:1 }}>
                {isOos && <div style={{ position:"absolute", inset:0, zIndex:5, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(255,255,255,0.3)", borderRadius:12 }}><div style={{ padding:"4px 12px", borderRadius:6, background:"rgba(100,116,139,0.85)", color:"white", fontSize:11, fontWeight:700, letterSpacing:0.5 }}>Currently Unavailable</div></div>}
                {isLow && <div style={{ position:"absolute", top:8, right:8, padding:"2px 8px", borderRadius:6, fontSize:9, fontWeight:700, background:"rgba(251,146,60,0.9)", color:"white", zIndex:10 }}>⚠ {d.stock}</div>}
                <img src={d.image||"https://placehold.co/300/fff7ed/ccc?text=🍽️"} alt="" style={{ width:"100%", height:160, objectFit:"cover", flexShrink:0 }} />
                <div style={{ flex:1, padding:"14px 14px 18px", minHeight:90, display:"flex", flexDirection:"column", justifyContent:"center" }}>
                  <div style={{ fontSize:14, fontWeight:600, color:"#0f172a", lineHeight:1.4, wordBreak:"break-word" }}>{d.name||"(no name)"}</div>
                  <div style={{ fontSize:13, color:ORANGE, fontWeight:700, marginTop:4 }}>₹{price}</div>
                </div>
              </div>;
            })}
        </div>
      </div>

      {/* Right: Cart */}
      <GlassCard style={{ display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <div style={{ padding:12, borderBottom:"1px solid #f1f5f9" }}>
          <div style={{ fontSize:14, fontWeight:700, color:"#0f172a", marginBottom:8 }}>Walk-in Cart ({cartItems.length})</div>
          <Input placeholder="Customer phone" value={custPhone} onChange={e=>setCustPhone(e.target.value)} style={{ marginBottom:6, fontSize:12, padding:"6px 10px" }} />
          <Input placeholder="Customer name" value={custName} onChange={e=>setCustName(e.target.value)} style={{ fontSize:12, padding:"6px 10px", marginBottom:4 }} />
          <Input placeholder="Table number (optional)" value={tableNo} onChange={e=>setTableNo(e.target.value)} style={{ fontSize:12, padding:"6px 10px", marginBottom:8 }} />
          <div style={{ fontSize:12, fontWeight:600, color:"#64748b", marginBottom:6 }}>Order Type</div>
          <div style={{ display:"flex", gap:8, marginBottom:12 }}>
            {["Dine-in", "Takeaway", "Delivery"].map(t => (
              <div key={t} onClick={()=>setOrderType(t)} style={{ flex:1, padding:"8px 0", borderRadius:8, textAlign:"center", fontSize:12, fontWeight:600, cursor:"pointer", color:orderType===t?"white":"#64748b", background:orderType===t?ORANGE:"#f1f5f9" }}>{t}</div>
            ))}
          </div>
          {orderType === "Delivery" && (
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:12, fontWeight:600, color:"#64748b", marginBottom:6 }}>Delivery Distance (km)</div>
              <input type="number" min="0" step="0.1" value={deliveryDist} onChange={e => setDeliveryDist(e.target.value)} placeholder="e.g. 5" style={{ width:"100%", padding:"6px 10px", borderRadius:6, border:"1px solid #e2e8f0", fontSize:12, fontFamily:"inherit", outline:"none", boxSizing:"border-box" }} />
              {deliveryFee > 0 && <div style={{ fontSize:11, color:"#64748b", marginTop:4 }}>Delivery fee: {fmt(deliveryFee)}</div>}
            </div>
          )}
          <textarea placeholder="Order notes (kitchen instructions)" value={orderNotes} onChange={e=>setOrderNotes(e.target.value)} style={{ width:"100%", minHeight:50, padding:"6px 10px", borderRadius:6, border:"1px solid #e2e8f0", fontSize:12, fontFamily:"inherit", outline:"none", resize:"none" }} />
        </div>
        <div style={{ flex:1, overflow:"auto", padding:12 }}>
          {cartItems.map(([key, item]) => (
            <div key={key} onClick={() => openEditCartItem(key, item)} style={{ padding:"8px 0", borderBottom:"1px solid #f8fafc", cursor:"pointer", borderRadius:6, transition:"background 0.15s" }}
                 onMouseEnter={e=>e.currentTarget.style.background="#fff7ed"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:"#0f172a" }}>{item.name} <span style={{ fontWeight:400, color:"#94a3b8" }}>({item.size})</span> <span style={{ fontSize:9, color:ORANGE, fontWeight:500 }}>(tap edit)</span></div>
                  {item.addons?.map((a,i)=><div key={i} style={{ fontSize:10, color:"#64748b" }}>+ {a.name}</div>)}
                </div>
                <div style={{ textAlign:"right" }}>
                  <div className="flex items-center gap-1" style={{ display:"flex", alignItems:"center", gap:4, justifyContent:"flex-end" }}>
                    <Minus size={12} style={{ cursor:"pointer", color:"#ef4444" }} onClick={()=>updateCartQty(key,-1)} />
                    <span style={{ fontSize:13, fontWeight:700, minWidth:16, textAlign:"center" }}>{item.qty}</span>
                    <Plus size={12} style={{ cursor:"pointer", color:ORANGE }} onClick={()=>updateCartQty(key,1)} />
                  </div>
                  <div style={{ fontSize:12, fontWeight:700, color:ORANGE }}>₹{(item.price*item.qty).toLocaleString()}</div>
                </div>
              </div>
              <Trash2 size={11} color="#ef4444" style={{ cursor:"pointer", marginTop:4 }} onClick={()=>removeFromCart(key)} />
            </div>
          ))}
          {cartItems.length===0&&<div style={{ textAlign:"center", padding:20, color:"#94a3b8", fontSize:12 }}>Tap dishes to add</div>}
        </div>
        <div style={{ padding:12, borderTop:"1px solid #f1f5f9" }}>
          <div className="flex justify-between mb-2" style={{ display:"flex", justifyContent:"space-between", marginBottom:4, fontSize:12 }}>
            <span style={{ color:"#64748b" }}>Subtotal</span><span style={{ fontWeight:600 }}>₹{subtotal.toLocaleString()}</span>
          </div>
          {autoDisc && <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6, padding:"4px 8px", borderRadius:6, background:"#fef3c7" }}>
            <span style={{ fontSize:11, fontWeight:600, color:"#92400e" }}>🎉 {autoDisc.name} applied</span>
            <span style={{ fontSize:11, fontWeight:700, color:"#ef4444" }}>-₹{totalDisc.toLocaleString()}</span>
          </div>}
          {couponApplied && <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6, padding:"4px 8px", borderRadius:6, background:"#dbeafe" }}>
            <span style={{ fontSize:11, fontWeight:600, color:"#1e40af" }}>🎫 Coupon "{couponCode}"</span>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ fontSize:11, fontWeight:700, color:"#ef4444" }}>-₹{couponDiscVal.toLocaleString()}</span>
              <span onClick={() => { setCouponApplied(null); setCouponCode(""); }} style={{ fontSize:13, cursor:"pointer", color:"#ef4444", fontWeight:700 }}>×</span>
            </div>
          </div>}
          <div style={{ display:"flex", gap:4, marginBottom:6, flexWrap:"wrap" }}>
            <span style={{ fontSize:11, color:"#64748b", alignSelf:"center" }}>Flat:</span>
            {[50, 100, 200].map(amt => (
              <div key={amt} onClick={() => { setDiscFlat(discFlat === amt ? 0 : amt); setDiscount(0); setAutoDisc(null); }} style={{ padding:"3px 10px", borderRadius:6, cursor:"pointer", fontSize:11, fontWeight:600, color:discFlat === amt ? "white" : "#64748b", background:discFlat === amt ? ORANGE : "#f1f5f9", border:"none" }}>₹{amt}</div>
            ))}
            <span style={{ fontSize:11, color:"#64748b", alignSelf:"center" }}>%:</span>
            {[5, 10, 20].map(pct => (
              <div key={pct} onClick={() => { setDiscount(discount === pct ? 0 : pct); setDiscFlat(0); setAutoDisc(null); }} style={{ padding:"3px 10px", borderRadius:6, cursor:"pointer", fontSize:11, fontWeight:600, color:discount === pct && !discFlat ? "white" : "#64748b", background:discount === pct && !discFlat ? ORANGE : "#f1f5f9", border:"none" }}>{pct}%</div>
            ))}
            <input type="number" placeholder="₹" value={discFlat > 0 && ![50,100,200].includes(discFlat) ? discFlat : ""} onChange={e => { const v = Number(e.target.value); setDiscFlat(v > 0 ? v : 0); setDiscount(0); setAutoDisc(null); }} min="0" style={{ width:50, padding:"3px 6px", borderRadius:6, border:"1px solid #e2e8f0", fontSize:11, textAlign:"center" }} />
          </div>
          {!discFlat && discount === 0 && (
            <div style={{ display:"flex", gap:4, marginBottom:6 }}>
              <input placeholder="Coupon code" value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} style={{ flex:1, padding:"4px 8px", borderRadius:6, border:"1px solid #e2e8f0", fontSize:11, textTransform:"uppercase" }} />
              <button type="button" onClick={async () => { if (!couponCode.trim()) return; setLoading(true); try { const snap = await get(Outlet("discounts")); const ds = snap.val() || {}; const found = Object.values(ds).find(d => d.enabled && d.type === "coupon" && d.couponCode && d.couponCode.toLowerCase() === couponCode.toLowerCase()); if (found) { setCouponApplied(found); showToast(`Coupon ${couponCode} applied!`,"success"); } else showToast("Invalid or expired coupon","error"); } catch(e) { showToast("Coupon check failed","error"); } finally { setLoading(false); } }} disabled={loading} style={{ padding:"4px 10px", borderRadius:6, border:"none", background:"#3b82f6", color:"white", fontSize:11, fontWeight:600, cursor:"pointer" }}>Apply</button>
            </div>
          )}
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
            {!autoDisc && totalDisc > 0 && !couponApplied && <span style={{ fontSize:11, color:"#ef4444", fontWeight:500 }}>-₹{totalDisc.toLocaleString()}</span>}
          </div>
          {taxVal>0&&<div className="flex justify-between mb-2" style={{ display:"flex", justifyContent:"space-between", marginBottom:8, fontSize:12 }}>
            <span style={{ color:"#64748b" }}>Tax (5%)</span><span style={{ fontWeight:600 }}>₹{taxVal.toLocaleString()}</span>
          </div>}
          {orderType === "Delivery" && deliveryFee > 0 && <div className="flex justify-between mb-2" style={{ display:"flex", justifyContent:"space-between", marginBottom:8, fontSize:12 }}>
            <span style={{ color:"#64748b" }}>Delivery Fee</span><span style={{ fontWeight:600 }}>₹{deliveryFee.toLocaleString()}</span>
          </div>}
          <div className="flex gap-2 mb-3" style={{ display:"flex", gap:6, marginBottom:12 }}>
            {["Cash","UPI","Card"].map(m => (
              <div key={m} onClick={()=>setPayMethod(m)} style={{ flex:1, padding:"6px 0", borderRadius:8, textAlign:"center", fontSize:11, fontWeight:600, cursor:"pointer", color:payMethod===m?"white":"#64748b", background:payMethod===m?ORANGE:"#f1f5f9" }}>{m}</div>
            ))}
          </div>
          <div className="flex justify-between mb-3" style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
            <span style={{ fontSize:16, fontWeight:700, color:"#0f172a" }}>Total</span>
            <span style={{ fontSize:18, fontWeight:800, color:ORANGE }}>₹{total.toLocaleString()}</span>
          </div>
          <BtnPrimary onClick={handleCheckout} disabled={loading} style={{ width:"100%" }}>
            {loading?"Processing...":"Record Sale"}
          </BtnPrimary>
          {cartItems.length>0&&<div onClick={clearCart} style={{ textAlign:"center", fontSize:11, color:"#ef4444", cursor:"pointer", marginTop:8, fontWeight:500 }}>Clear cart</div>}
        </div>
      </GlassCard>

      {/* Mobile cart summary bottom bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-3 z-40" style={{ boxShadow:"0 -4px 12px rgba(0,0,0,0.08)" }}>
        <button onClick={() => setShowMobileCart(!showMobileCart)} className="w-full flex items-center justify-between bg-orange-50 hover:bg-orange-100 transition-colors p-3 rounded-xl">
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:"#ea580c" }}>Walk-in Cart</div>
            <div style={{ fontSize:11, color:"#ea580c" }}>{cartItems.length} items • Total: ₹{total.toLocaleString()}</div>
          </div>
          <div style={{ width:32, height:32, borderRadius:8, background:"#fed7aa", display:"flex", alignItems:"center", justifyContent:"center", color:"#ea580c", fontSize:16 }}>
            <ShoppingCart size={16} />
          </div>
        </button>
      </div>

      {/* Mobile cart bottom sheet */}
      {showMobileCart && (
        <div style={{ position:"fixed", inset:0, zIndex:50, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"flex-end" }} onClick={() => setShowMobileCart(false)}>
          <div style={{ width:"100%", maxHeight:"90vh", background:"white", borderRadius:"20px 20px 0 0", boxShadow:"0 -8px 32px rgba(0,0,0,0.12)", animation:"slideSheetUp 0.3s ease-out", display:"flex", flexDirection:"column" }} onClick={e => e.stopPropagation()}>
            <div style={{ padding:"12px 16px", borderBottom:"1px solid #f1f5f9", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div style={{ fontSize:16, fontWeight:700, color:"#0f172a" }}>Walk-in Cart</div>
              <button onClick={() => setShowMobileCart(false)} style={{ background:"none", border:"none", cursor:"pointer", color:"#94a3b8", fontSize:20 }}>×</button>
            </div>
            <div style={{ flex:1, overflow:"auto", padding:16 }}>
              {cartItems.map(([key, item]) => (
                <div key={key} onClick={() => openEditCartItem(key, item)} style={{ padding:"8px 0", borderBottom:"1px solid #f8fafc", cursor:"pointer" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, fontWeight:600, color:"#0f172a" }}>{item.name} <span style={{ fontWeight:400, color:"#94a3b8" }}>({item.size})</span> <span style={{ fontSize:9, color:ORANGE, fontWeight:500 }}>(tap edit)</span></div>
                      {item.addons?.map((a,i)=><div key={i} style={{ fontSize:10, color:"#64748b" }}>+ {a.name}</div>)}
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:12, fontWeight:700, color:ORANGE }}>₹{(item.price*item.qty).toLocaleString()}</div>
                      <div className="flex items-center gap-1" style={{ display:"flex", alignItems:"center", gap:4, justifyContent:"flex-end", marginTop:4 }}>
                        <Minus size={12} style={{ cursor:"pointer", color:"#ef4444" }} onClick={(e) => { e.stopPropagation(); updateCartQty(key,-1); }} />
                        <span style={{ fontSize:13, fontWeight:700, minWidth:16, textAlign:"center" }}>{item.qty}</span>
                        <Plus size={12} style={{ cursor:"pointer", color:ORANGE }} onClick={(e) => { e.stopPropagation(); updateCartQty(key,1); }} />
                      </div>
                    </div>
                  </div>
                  <Trash2 size={11} color="#ef4444" style={{ cursor:"pointer", marginTop:4 }} onClick={(e) => { e.stopPropagation(); removeFromCart(key); }} />
                </div>
              ))}
              {cartItems.length===0&&<div style={{ textAlign:"center", padding:40, color:"#94a3b8", fontSize:12 }}>Tap dishes to add</div>}
            </div>
            <div style={{ padding:16, borderTop:"1px solid #f1f5f9", background:"white" }}>
              <div className="flex justify-between mb-2" style={{ display:"flex", justifyContent:"space-between", marginBottom:4, fontSize:12 }}>
                <span style={{ color:"#64748b" }}>Subtotal</span><span style={{ fontWeight:600 }}>₹{subtotal.toLocaleString()}</span>
              </div>
              {autoDisc && <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6, padding:"4px 8px", borderRadius:6, background:"#fef3c7" }}>
                <span style={{ fontSize:11, fontWeight:600, color:"#92400e" }}>🎉 {autoDisc.name} applied</span>
                <span style={{ fontSize:11, fontWeight:700, color:"#ef4444" }}>-₹{discVal.toLocaleString()}</span>
              </div>}
              {taxVal>0&&<div className="flex justify-between mb-2" style={{ display:"flex", justifyContent:"space-between", marginBottom:8, fontSize:12 }}>
                <span style={{ color:"#64748b" }}>Tax (5%)</span><span style={{ fontWeight:600 }}>₹{taxVal.toLocaleString()}</span>
              </div>}
              {orderType === "Delivery" && deliveryFee > 0 && <div className="flex justify-between mb-2" style={{ display:"flex", justifyContent:"space-between", marginBottom:8, fontSize:12 }}>
                <span style={{ color:"#64748b" }}>Delivery Fee</span><span style={{ fontWeight:600 }}>₹{deliveryFee.toLocaleString()}</span>
              </div>}
              <div className="flex gap-2 mb-3" style={{ display:"flex", gap:6, marginBottom:12 }}>
                {["Cash","UPI","Card"].map(m => (
                  <div key={m} onClick={()=>setPayMethod(m)} style={{ flex:1, padding:"6px 0", borderRadius:8, textAlign:"center", fontSize:11, fontWeight:600, cursor:"pointer", color:payMethod===m?"white":"#64748b", background:payMethod===m?ORANGE:"#f1f5f9" }}>{m}</div>
                ))}
              </div>
              <div className="flex justify-between mb-3" style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
                <span style={{ fontSize:16, fontWeight:700, color:"#0f172a" }}>Total</span>
                <span style={{ fontSize:18, fontWeight:800, color:ORANGE }}>₹{total.toLocaleString()}</span>
              </div>
              <BtnPrimary onClick={handleCheckout} disabled={loading} style={{ width:"100%" }}>{loading?"Processing...":"Record Sale"}</BtnPrimary>
              {cartItems.length>0&&<div onClick={clearCart} style={{ textAlign:"center", fontSize:11, color:"#ef4444", cursor:"pointer", marginTop:8, fontWeight:500 }}>Clear cart</div>}
            </div>
          </div>
        </div>
      )}

      {/* Selection Modal */}
      <Modal open={!!selModal} onClose={()=>{setSelModal(null);setEditKey(null);}}>
        {selModal&&(()=>{
          const sizes = selModal.sizes||{Standard:selModal.price||0};
          const catA = cats.find(c=>c.name===selModal.category)?.addons||{};
          return <div>
            <div style={{ fontSize:18, fontWeight:700, color:"#0f172a", marginBottom:4 }}>{selModal.name} {editKey&&<span style={{ fontSize:10, fontWeight:600, color:"white", background:ORANGE, padding:"2px 8px", borderRadius:6, verticalAlign:"middle", marginLeft:6 }}>Editing</span>}</div>
            <div style={{ fontSize:12, color:"#64748b", marginBottom:16 }}>{selModal.category}</div>
            <SectionLabel>Size</SectionLabel>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:16 }}>
              {Object.entries(sizes).map(([sz,pr])=>(
                <div key={sz} onClick={()=>setSelSize(sz)} style={{ padding:"10px", borderRadius:10, textAlign:"center", cursor:"pointer", border:selSize===sz?`2px solid ${ORANGE}`:"1.5px solid #e2e8f0", background:selSize===sz?"#fff7ed":"white" }}>
                  <div style={{ fontSize:13, fontWeight:600, color:"#0f172a" }}>{sz}</div>
                  <div style={{ fontSize:12, fontWeight:700, color:ORANGE }}>₹{pr}</div>
                </div>
              ))}
            </div>
            {Object.keys(catA).length>0&&<><SectionLabel>Addons</SectionLabel>
            <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:16 }}>
              {Object.entries(catA).map(([n,pr])=>(
                <div key={n} onClick={()=>setSelAddons(prev=>prev[n]?(()=>{const c={...prev};delete c[n];return c;})():{...prev,[n]:pr})} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 12px", borderRadius:10, cursor:"pointer", background:selAddons[n]?"#fff7ed":"#f8fafc", border:`1px solid ${selAddons[n]?ORANGE:"#e2e8f0"}` }}>
                  <span style={{ fontSize:13, fontWeight:500, color:"#0f172a" }}>+ {n}</span>
                  <span style={{ fontSize:12, fontWeight:600, color:ORANGE }}>₹{pr}</span>
                </div>
              ))}
            </div></>}
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
              <span style={{ fontSize:13, fontWeight:500 }}>Qty:</span>
              <Minus size={16} style={{ cursor:"pointer", color:"#ef4444" }} onClick={()=>setSelQty(Math.max(1,selQty-1))} />
              <span style={{ fontSize:16, fontWeight:700, minWidth:20, textAlign:"center" }}>{selQty}</span>
              <Plus size={16} style={{ cursor:"pointer", color:ORANGE }} onClick={()=>setSelQty(selQty+1)} />
            </div>
            <BtnPrimary onClick={addToCart} style={{ width:"100%" }}>Add to Cart • ₹{((Number(sizes[selSize]??selModal.price??0)+Object.values(selAddons).reduce((a,b)=>a+Number(b),0))*selQty).toLocaleString()}</BtnPrimary>
          </div>;
        })()}
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CUSTOMERS PAGE
// ═══════════════════════════════════════════════════════════════════════════
function CustomersPage({ showToast }) {
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [creditEdit, setCreditEdit] = useState(null);
  const [creditVal, setCreditVal] = useState("");

  useEffect(() => {
    const r = Outlet("customers"); const r2 = Outlet("orders");
    if (!r||!r2) return;
    const u1 = onValue(r, snap => { const v=snap.val(); setCustomers(v?Object.keys(v).map(k=>({phone:k,...v[k]})):[]); });
    const u2 = onValue(r2, snap => { const v=snap.val(); setOrders(v?Object.keys(v).map(k=>({id:k,...v[k]})):[]); });
    return () => { off(r,"value",u1); off(r2,"value",u2); };
  }, []);

  const data = useMemo(() => {
    let list = customers.map(c => {
      const myOrders = orders.filter(o => o.phone === c.phone);
      return {...c, orderCount: myOrders.length, ltv: myOrders.reduce((s,o)=>s+Number(o.total||0),0)};
    });
    if (search) { const s=search.toLowerCase(); list = list.filter(c => (c.name||"").toLowerCase().includes(s)||c.phone.includes(s)); }
    return list.sort((a,b)=>b.ltv-a.ltv);
  }, [customers, orders, search]);

  const totalOutstanding = useMemo(() => data.reduce((s,c)=>s+Math.max(0,Number(c.credit||0)),0), [data]);

  const handleSaveCredit = useCallback(async (phone) => {
    const newVal = Number(creditVal);
    if (isNaN(newVal)) { showToast("Enter a valid amount","error"); return; }
    try {
      await update(Outlet(`customers/${phone}`), { credit: newVal });
      showToast("Credit updated","success");
      setCreditEdit(null);
      setCreditVal("");
    } catch (e) { showToast("Failed to update credit","error"); }
  }, [creditVal, showToast]);

  const exportCustomers = useCallback(() => {
    downloadCSV(`customers-${new Date().toISOString().slice(0,10)}.csv`, data.map((c, index) => ({
      row: index + 1,
      name: c.name || "Anonymous",
      phone: c.phone,
      orders: c.orderCount,
      ltv: c.ltv,
      credit: c.credit || 0,
      registeredAt: c.registeredAt || "",
    })));
    showToast("Customers exported", "success");
  }, [data, showToast]);

  return (
    <div>
      <div className="sheet-toolbar">
        <div style={{ flex:1, maxWidth:300, position:"relative" }}>
          <Search size={14} style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"#94a3b8" }} />
          <input placeholder="Search by name or phone..." value={search} onChange={e=>setSearch(e.target.value)} style={{ padding:"8px 10px 8px 32px", borderRadius:10, border:"1.5px solid #e2e8f0", fontSize:13, width:"100%", background:"#f8fafc", outline:"none" }} />
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ fontSize:12, color:"#64748b" }}>Outstanding: <strong style={{ color:totalOutstanding>0?"#ef4444":"#22c55e" }}>{fmt(totalOutstanding)}</strong></span>
          <button type="button" className="sheet-button" onClick={exportCustomers}><Download size={14} /> Export CSV</button>
        </div>
      </div>
      <GlassCard style={{ overflow:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13, minWidth:700 }}>
          <thead><tr style={{ borderBottom:"1px solid #f1f5f9" }}>
            <th style={{ textAlign:"left", padding:"10px 12px", color:"#94a3b8", fontWeight:600, fontSize:11, textTransform:"uppercase" }}>Customer</th>
            <th style={{ textAlign:"left", padding:"10px 12px", color:"#94a3b8", fontWeight:600, fontSize:11, textTransform:"uppercase" }}>Contact</th>
            <th style={{ textAlign:"center", padding:"10px 12px", color:"#94a3b8", fontWeight:600, fontSize:11, textTransform:"uppercase" }}>Orders</th>
            <th style={{ textAlign:"right", padding:"10px 12px", color:"#94a3b8", fontWeight:600, fontSize:11, textTransform:"uppercase" }}>LTV</th>
            <th style={{ textAlign:"right", padding:"10px 12px", color:"#94a3b8", fontWeight:600, fontSize:11, textTransform:"uppercase" }}>Credit</th>
          </tr></thead>
          <tbody>
            {data.map(c => (
              <tr key={c.phone} style={{ borderBottom:"1px solid #f8fafc" }}>
                <td style={{ padding:"10px 12px" }}>
                  <div style={{ fontWeight:600, color:"#0f172a" }}>{c.name||"Anonymous"}</div>
                  <div style={{ fontSize:11, color:"#94a3b8" }}>Joined: {c.registeredAt?new Date(c.registeredAt).toLocaleDateString():"N/A"}</div>
                </td>
                <td style={{ padding:"10px 12px" }}>
                  <div style={{ fontSize:12, color:"#475569" }}>{c.phone}</div>
                  {c.phone&&<a href={`https://wa.me/91${c.phone.replace(/\D/g,"").slice(-10)}`} target="_blank" style={{ fontSize:11, color:ORANGE, fontWeight:600, textDecoration:"none" }}>📱 WhatsApp</a>}
                </td>
                <td style={{ padding:"10px 12px", textAlign:"center" }}>
                  <span style={{ fontWeight:700, color:ORANGE }}>{c.orderCount}</span>
                  <div style={{ fontSize:11, color:"#94a3b8" }}>purchases</div>
                </td>
                <td style={{ padding:"10px 12px", textAlign:"right", fontWeight:700, color:"#22c55e", fontSize:15 }}>{fmt(c.ltv)}</td>
                <td style={{ padding:"10px 12px", textAlign:"right" }}>
                  {creditEdit === c.phone ? (
                    <div style={{ display:"flex", alignItems:"center", gap:4, justifyContent:"flex-end" }}>
                      <input type="number" value={creditVal} onChange={e => setCreditVal(e.target.value)} style={{ width:80, padding:"3px 6px", borderRadius:4, border:"1px solid #e2e8f0", fontSize:12, textAlign:"right" }} autoFocus />
                      <button onClick={() => handleSaveCredit(c.phone)} style={{ padding:"2px 6px", borderRadius:4, border:"none", background:"#22c55e", color:"white", fontSize:10, fontWeight:600, cursor:"pointer" }}>Save</button>
                      <button onClick={() => setCreditEdit(null)} style={{ padding:"2px 6px", borderRadius:4, border:"none", background:"#e2e8f0", color:"#64748b", fontSize:10, fontWeight:600, cursor:"pointer" }}>X</button>
                    </div>
                  ) : (
                    <div onClick={() => { setCreditEdit(c.phone); setCreditVal(String(c.credit||0)); }} style={{ cursor:"pointer", fontWeight:700, color:Number(c.credit||0)>0?"#ef4444":"#64748b" }}>
                      {fmt(c.credit||0)}
                      <span style={{ marginLeft:4, fontSize:10, color:"#94a3b8" }}>(edit)</span>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.length===0&&<div style={{ textAlign:"center", padding:40, color:"#94a3b8", fontSize:13 }}>No customers found</div>}
      </GlassCard>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LIVE TRACKER (Leaflet map)
// ═══════════════════════════════════════════════════════════════════════════
function LiveTrackerPage() {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markers = useRef({});
  const [online, setOnline] = useState(0);

  useEffect(() => {
    let L, cleanup;
    (async () => {
      try {
        L = (await import("leaflet")).default;
        await import("leaflet/dist/leaflet.css");
      } catch(e) { console.warn("Leaflet not available, using simple view"); return; }
      if (!mapRef.current) return;
      if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; }
      const map = L.map(mapRef.current).setView([20.5937, 78.9629], 5);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution:"&copy; OpenStreetMap" }).addTo(map);
      mapInstance.current = map;
      const r = ref(db,"riders");
      const unsub = onValue(r, snap => {
        let oc = 0; const bounds = [];
        snap.forEach(child => {
          const rider = child.val();
          if (rider.status==="Online"&&rider.location) {
            oc++; const pos = [rider.location.lat, rider.location.lng]; bounds.push(pos);
            const popup = `<div><b>${rider.name||"Rider"}</b><br/>${rider.phone||""}<br/>${rider.status}</div>`;
            if (markers.current[child.key]) { markers.current[child.key].setLatLng(pos); markers.current[child.key].getPopup()?.setContent(popup); }
            else {
              const m = L.marker(pos).addTo(map).bindPopup(popup);
              markers.current[child.key] = m;
            }
          } else if (markers.current[child.key]) { map.removeLayer(markers.current[child.key]); delete markers.current[child.key]; }
        });
        setOnline(oc);
        if (bounds.length>0) map.fitBounds(L.latLngBounds(bounds), { padding:[50,50], maxZoom:15 });
      });
      cleanup = () => { off(r,"value",unsub); if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current=null; } };
    })();
    return () => { if (cleanup) cleanup(); };
  }, []);

  return (
    <div>
      <div style={{ fontSize:14, fontWeight:700, color:"#0f172a", marginBottom:12 }}>Live Rider Tracker — {online} Riders Online</div>
      <div ref={mapRef} style={{ width:"100%", height:"calc(100vh - 180px)", borderRadius:16, overflow:"hidden" }} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SETTINGS PAGE (Store, Delivery, Bot, Display tabs)
// ═══════════════════════════════════════════════════════════════════════════
function SettingsPage({ showToast, notifEnabled, setNotifEnabled, fcmToken }) {
  const [tab, setTab] = useState("store");
  const [s, setS] = useState({}); // store settings
  const [d, setD] = useState({}); // delivery settings
  const [inv, setInv] = useState({}); // inventory settings

  useEffect(() => {
    const r1 = Outlet("settings/Store"); const r2 = Outlet("settings/Delivery"); const r3 = Outlet("settings/inventory");
    if (!r1||!r2) return;
    const u1 = onValue(r1, snap => setS(snap.val()||{}));
    const u2 = onValue(r2, snap => setD(snap.val()||{}));
    const u3 = r3 ? onValue(r3, snap => setInv(snap.val()||{})) : null;
    return () => { off(r1,"value",u1); off(r2,"value",u2); if (u3) off(r3,"value",u3); };
  }, []);

  // Store settings fields
  const storeFields = [
    {key:"entityName", label:"Entity Name"}, {key:"storeName", label:"Store Name"}, {key:"address", label:"Address"},
    {key:"gstin", label:"GSTIN"}, {key:"fssai", label:"FSSAI"}, {key:"tagline", label:"Tagline"},
    {key:"poweredBy", label:"Powered By"}, {key:"wifiName", label:"WiFi Name"}, {key:"wifiPass", label:"WiFi Password"},
    {key:"instagram", label:"Instagram"}, {key:"facebook", label:"Facebook"}, {key:"reviewUrl", label:"Review URL"},
    {key:"lat", label:"Latitude", type:"number"}, {key:"lng", label:"Longitude", type:"number"},
    {key:"shopOpenTime", label:"Open Time", type:"time"}, {key:"shopCloseTime", label:"Close Time", type:"time"},
  ];
  const deliveryFields = [
    {key:"developerPhone", label:"Developer Phone"}, {key:"reportPhone", label:"Report Phone"},
    {key:"notifyPhone", label:"Admin Notification Phone"}, {key:"backupCode", label:"Backup Code (4 digits)"},
  ];

  const updateField = (setter, key, val) => setter(prev => ({...prev, [key]: val}));

  const handleSaveStore = async () => {
    const v = validateCoords(s.lat, s.lng);
    if (!v.valid) return showToast(v.msg, "error");
    const g = validateGSTIN(s.gstin);
    if (g!==true) return showToast(g.msg, "error");
    const f = validateFSSAI(s.fssai);
    if (f!==true) return showToast(f.msg, "error");
    try { await set(Outlet("settings/Store"), {...s, updatedAt:new Date().toISOString()}); showToast("Store settings saved","success"); }
    catch(e) { showToast("Save failed","error"); }
  };

  const handleSaveDelivery = async () => {
    try { await update(Outlet("settings/Delivery"), {...d, slabs:d.slabs||[]}); showToast("Delivery settings saved","success"); }
    catch(e) { showToast("Save failed","error"); }
  };

  const handleSaveInventory = async () => {
    try { await set(Outlet("settings/inventory"), inv); showToast("Inventory settings saved","success"); }
    catch(e) { showToast("Save failed","error"); }
  };

  const addSlab = () => {
    const slabs = d.slabs||[];
    setD({...d, slabs:[...slabs, {km:0, fee:0}]});
  };

  const updateSlab = (idx, field, val) => {
    const slabs = [...(d.slabs||[])];
    slabs[idx] = {...slabs[idx], [field]:Number(val)};
    setD({...d, slabs});
  };

  const removeSlab = (idx) => {
    const slabs = (d.slabs||[]).filter((_,i)=>i!==idx);
    setD({...d, slabs});
  };

  const renderField = (field, obj, setter) => (
    <div key={field.key} style={{ marginBottom:10 }}>
      <label style={{ fontSize:11, fontWeight:600, color:"#64748b", display:"block", marginBottom:3 }}>{field.label}</label>
      <Input type={field.type||"text"} value={obj[field.key]||""} onChange={e=>updateField(setter,field.key,e.target.value)} />
    </div>
  );

  return (
    <div>
      <div className="flex gap-2 mb-4" style={{ display:"flex", gap:8, marginBottom:16 }}>
        {["store","delivery","inventory","display","notifications"].map(t => (
          <div key={t} onClick={()=>setTab(t)} style={{ padding:"6px 18px", borderRadius:8, cursor:"pointer", fontSize:12, fontWeight:600, textTransform:"capitalize", color:tab===t?"white":"#64748b", background:tab===t?ORANGE:"#f1f5f9" }}>{t}</div>
        ))}
      </div>
      {tab==="store"&&<div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        {storeFields.map(f => renderField(f, s, setS))}
        <div style={{ gridColumn:"1/-1" }}><BtnPrimary onClick={handleSaveStore} style={{ width:"100%" }}>Save Store Settings</BtnPrimary></div>
      </div>}
      {tab==="delivery"&&<div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
          {deliveryFields.map(f => renderField(f, d, setD))}
        </div>
        <SectionLabel>Delivery Fee Slabs</SectionLabel>
        <div style={{ marginBottom:12 }}>
          {(d.slabs||[]).map((slab,i)=>(
            <div key={i} style={{ display:"flex", gap:8, marginBottom:6, alignItems:"center" }}>
              <Input type="number" placeholder="KM" value={slab.km} onChange={e=>updateSlab(i,"km",e.target.value)} style={{ width:100, fontSize:12, padding:"6px 10px" }} />
              <Input type="number" placeholder="Fee ₹" value={slab.fee} onChange={e=>updateSlab(i,"fee",e.target.value)} style={{ width:100, fontSize:12, padding:"6px 10px" }} />
              <Trash2 size={14} color="#ef4444" style={{ cursor:"pointer" }} onClick={()=>removeSlab(i)} />
            </div>
          ))}
        </div>
        <BtnSecondary onClick={addSlab} style={{ marginBottom:16 }}><Plus size={12} /> Add Slab</BtnSecondary>
        <BtnPrimary onClick={handleSaveDelivery} style={{ width:"100%" }}>Save Delivery Settings</BtnPrimary>
      </div>}
      {tab==="inventory"&&<div>
        <GlassCard className="p-5 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-800">Menu Availability</div>
              <div className="text-xs text-slate-500 mt-1">Mark dishes as Available or Out of Stock on the menu.</div>
            </div>
            <label className="toggle-switch" style={{ position:"relative", display:"inline-block", width:44, height:24 }}>
              <input type="checkbox" checked={!!inv.availability} onChange={e => setInv(p => ({...p, availability: e.target.checked}))}
                style={{ opacity:0, width:0, height:0 }} />
              <span style={{ position:"absolute", cursor:"pointer", inset:0, borderRadius:12, background:inv.availability?ORANGE:"#cbd5e1", transition:".2s" }}>
                <span style={{ position:"absolute", height:18, width:18, borderRadius:"50%", background:"white", top:3, left:inv.availability?23:3, transition:".2s" }} />
              </span>
            </label>
          </div>
        </GlassCard>
        <GlassCard className="p-5 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-800">Stock Inventory Tracking</div>
              <div className="text-xs text-slate-500 mt-1">Track quantity in stock for each item. Auto-deducts on sales.</div>
            </div>
            <label className="toggle-switch" style={{ position:"relative", display:"inline-block", width:44, height:24 }}>
              <input type="checkbox" checked={!!inv.stockTracking} onChange={e => setInv(p => ({...p, stockTracking: e.target.checked}))}
                style={{ opacity:0, width:0, height:0 }} />
              <span style={{ position:"absolute", cursor:"pointer", inset:0, borderRadius:12, background:inv.stockTracking?ORANGE:"#cbd5e1", transition:".2s" }}>
                <span style={{ position:"absolute", height:18, width:18, borderRadius:"50%", background:"white", top:3, left:inv.stockTracking?23:3, transition:".2s" }} />
              </span>
            </label>
          </div>
        </GlassCard>
        <BtnPrimary onClick={handleSaveInventory} style={{ width:"100%" }}>Save Inventory Settings</BtnPrimary>
      </div>}
      {tab==="display"&&<div>
        <p style={{ fontSize:13, color:"#64748b", marginBottom:12 }}>Display visibility checkboxes coming soon. Check the database for current settings.</p>
      </div>}
      {tab==="notifications"&&<div>
        <GlassCard className="p-5 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-800">Browser Notifications</div>
              <div className="text-xs text-slate-500 mt-1">Receive desktop notifications for new orders and low-stock alerts when the dashboard is open.</div>
            </div>
            <label className="toggle-switch" style={{ position:"relative", display:"inline-block", width:44, height:24 }}>
              <input type="checkbox" checked={!!notifEnabled} onChange={e => { const v = e.target.checked; setNotifEnabled(v); localStorage.setItem("fh_notif_enabled", String(v)); if (v && Notification.permission === "default") Notification.requestPermission(); }}
                style={{ opacity:0, width:0, height:0 }} />
              <span style={{ position:"absolute", cursor:"pointer", inset:0, borderRadius:12, background:notifEnabled?ORANGE:"#cbd5e1", transition:".2s" }}>
                <span style={{ position:"absolute", height:18, width:18, borderRadius:"50%", background:"white", top:3, left:notifEnabled?23:3, transition:".2s" }} />
              </span>
            </label>
          </div>
        </GlassCard>
        <GlassCard className="p-5 mb-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-800">Permission Status</div>
                <div className="text-xs text-slate-500 mt-1">{typeof Notification === "undefined" ? "Not supported in this browser" : `Current: ${Notification.permission}`}</div>
              </div>
              {typeof Notification !== "undefined" && Notification.permission !== "granted" && (
                <button type="button" onClick={() => Notification.requestPermission().then(p => showToast(`Permission: ${p}`,"info"))} className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background:ORANGE, color:"white", border:"none", cursor:"pointer" }}>Request Permission</button>
              )}
            </div>
            {fcmToken && <div style={{ fontSize:11, color:"#94a3b8", wordBreak:"break-all" }}>FCM Token: {fcmToken.slice(0,30)}...</div>}
            <button type="button" onClick={() => { if (Notification.permission === "granted") { try { new Notification("Test Notification", { body: "Your notifications are working!", icon: "/favicon.svg" }); showToast("Test notification sent","success"); } catch(e) { showToast("Failed: "+e.message,"error"); } } else { showToast("Notification permission not granted","warning"); } }} className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background:"#f1f5f9", color:"#475569", border:"1px solid #e2e8f0", cursor:"pointer" }}>Send Test Notification</button>
          </div>
        </GlassCard>
      </div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LIVE OPS PAGE (Firebase real-time + sequential status)
// ═══════════════════════════════════════════════════════════════════════════
function LiveOpsPage({ showToast }) {
  const [orders, setOrders] = useState([]);
  const [riders, setRiders] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editing, setEditing] = useState(null);
  const [advancing, setAdvancing] = useState({});

  useEffect(() => {
    const r = Outlet("orders");
    if (!r) return;
    const unsub = onValue(r, snap => { const v=snap.val(); setOrders(v?Object.keys(v).map(k=>({id:k,...v[k]})):[]); });
    const r2 = ref(db,"riders");
    const unsub2 = onValue(r2, snap => { const rd=[]; snap.forEach(ch=>rd.push({id:ch.key,...ch.val()})); setRiders(rd); });
    return () => { off(r,"value",unsub); off(r2,"value",unsub2); };
  }, []);

  const activeOrders = useMemo(() => orders.filter(o => o.status!=="Delivered" && o.status!=="Cancelled"), [orders]);
  const PRIORITY = { Placed:0, Confirmed:1, Preparing:2, Cooked:3, Ready:4, "Out for Delivery":5, "Reached Drop Location":6, "Pending":7, "New":8 };

  const filteredOps = useMemo(() => {
    let list = activeOrders;
    if (statusFilter !== "all") list = list.filter(o => o.status === statusFilter);
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(o => [o.id, o.customerName, o.phone, o.address, o.status, o.type].some(v => String(v||"").toLowerCase().includes(s)));
    }
    return list.sort((a,b) => {
      const p = (PRIORITY[a.status]||9) - (PRIORITY[b.status]||9);
      if (p) return p;
      return new Date(a.createdAt||0).getTime() - new Date(b.createdAt||0).getTime();
    });
  }, [activeOrders, search, statusFilter]);

  const advance = useCallback(async (id) => {
    const o = orders.find(x => x.id===id);
    if (!o || advancing[id]) return;
    const idx = SEQ.indexOf(o.status);
    if (idx===-1||idx>=SEQ.length-1) return;
    let next = SEQ[idx+1];
    if (o.type === "Dine-in" && (next === "Out for Delivery" || next === "Reached Drop Location")) { next = "Delivered"; }
    if (next==="Out for Delivery" && !o.riderId && !o.assignedRider) { showToast("Assign a rider first","error"); return; }
    setAdvancing(prev => ({...prev, [id]:true}));
    try { await update(Outlet(`orders/${id}`),{status:next}); showToast(`${o.id.slice(-6)} → ${ORD_ST[next].label}`,"success"); } catch(e) { showToast("Update failed","error"); }
    finally { setAdvancing(prev => ({...prev, [id]:false})); }
  },[orders,showToast,advancing]);

  const cancel = useCallback(async (id) => {
    const o = orders.find(x => x.id===id);
    if (!o) return;
    if (o.status==="Delivered") { showToast("Cannot cancel a delivered order","error"); return; }
    if (!confirm("Cancel this order?")) return;
    try { await update(Outlet(`orders/${id}`),{status:"Cancelled"}); showToast("Order cancelled","success"); } catch(e) { showToast("Cancel failed","error"); }
  },[orders,showToast]);

  const saveOperation = useCallback(async () => {
    if (!editing?.customerName?.trim()) return showToast("Customer name is required","error");
    try {
      if (editing.id && orders.find(o=>o.id===editing.id)) {
        await update(Outlet(`orders/${editing.id}`),{customerName:editing.customerName,phone:editing.phone,total:Number(editing.total||0),type:editing.type,status:editing.status||"Placed",address:editing.address||""});
      } else {
        await push(Outlet("orders"),{customerName:editing.customerName,phone:editing.phone,total:Number(editing.total||0),type:editing.type,status:"Placed",address:editing.address||"",createdAt:serverTimestamp()});
      }
      setEditing(null);
      showToast("Operation saved","success");
    } catch(e) { showToast("Save failed","error"); }
  },[editing,orders,showToast]);

  const deleteOperation = useCallback(async (id) => {
    if (!confirm("Delete this order permanently?")) return;
    try {
      await remove(Outlet(`orders/${id}`));
      logAudit(_bizId, _outletId, "delete_order_kitchen", { orderId: id }, getCurrentAdminActor());
      showToast("Order deleted","success");
    } catch(e) { showToast("Delete failed","error"); }
  },[showToast]);

  const assignRider = useCallback(async (orderId, riderId) => {
    try {
      const rs = await get(ref(db,`riders/${riderId}`));
      const rider = rs.val();
      if (!rider) return showToast("Rider not found","error");
      await update(Outlet(`orders/${orderId}`),{riderId,assignedRider:rider?.email||"",riderName:rider?.name||"",riderPhone:rider?.phone||"",assignedAt:serverTimestamp()});
      showToast(`Rider ${rider.name||""} assigned`,"success");
    } catch(e) { showToast("Assignment failed","error"); }
  },[showToast]);

  const exportOperations = useCallback(() => {
    downloadCSV(`live-operations-${new Date().toISOString().slice(0,10)}.csv`, filteredOps.map((o,i)=>({
      row:i+1,orderId:o.id,customer:o.customerName,phone:o.phone,items:orderItemsCount(o),total:o.total,type:o.type,status:o.status,address:o.address
    })));
    showToast("Live operations exported","success");
  },[filteredOps,showToast]);

  const relTime = (ts) => { if(!ts) return ""; const d=Date.now()-new Date(ts).getTime(); const m=Math.floor(d/60000); if(m<1) return "Just now"; if(m<60) return `${m}m ago`; const h=Math.floor(m/60); return `${h}h ${m%60}m ago`; };

  const flowLabels = { "Placed":"Accept","Confirmed":"Prep","Preparing":"Cook","Cooked":"Ready","Ready":"Dispatch","Out for Delivery":"Arrive","Reached Drop Location":"Deliver" };

  return (
    <div className="space-y-4">
      <div className="grid gap-3" style={{ gridTemplateColumns:"repeat(auto-fill, minmax(140px,1fr))" }}>
        <KPICard title="Live Orders" value={activeOrders.length} icon={Zap} color={COLORS.error} />
        <KPICard title="Pending Accept" value={activeOrders.filter(o=>o.status==="Placed").length} icon={Clock} color={COLORS.warning} />
        <KPICard title="In Kitchen" value={activeOrders.filter(o=>["Confirmed","Preparing","Cooked","Ready"].includes(o.status)).length} icon={ChefHat} color={COLORS.info} />
        <KPICard title="Out for Delivery" value={activeOrders.filter(o=>o.status==="Out for Delivery"||o.status==="Reached Drop Location").length} icon={Truck} color={COLORS.primary} />
      </div>
      <GlassCard className="p-4">
        <div className="sheet-toolbar">
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="font-bold text-slate-800 text-sm" style={{ fontFamily:"'Outfit', sans-serif" }}>Live Operations Sheet</span>
          </div>
          <div className="sheet-actions">
            <input className="sheet-input" placeholder="Search live ops..." value={search} onChange={e=>setSearch(e.target.value)} />
            <select className="sheet-select" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              {Object.keys(ORD_ST).filter(s=>s!=="Delivered"&&s!=="Cancelled").map(s=><option key={s} value={s}>{ORD_ST[s].label}</option>)}
            </select>
            <button type="button" className="sheet-button" onClick={()=>setEditing({customerName:"",phone:"",total:0,type:"delivery",address:""})}><Plus size={14} /> New Row</button>
            <button type="button" className="sheet-button" onClick={exportOperations}><Download size={14} /> Export CSV</button>
          </div>
        </div>
        <div className="sheet-table-wrap">
          <table className="sheet-table">
            <thead><tr><th className="sheet-row-number">#</th><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Time</th><th>Actions</th></tr></thead>
            <tbody>
              {filteredOps.map((o, index) => {
                const _idx = SEQ.indexOf(o.status);
                const canAdvance = _idx >= 0 && _idx < SEQ.length-1;
                const needRider = _idx >= 0 && _idx < SEQ.length-1 && SEQ[_idx+1] === "Out for Delivery";
                const stColor = ORD_ST[o.status]?.color || "#64748b";
                const stBg = ORD_ST[o.status]?.bg || "#f1f5f9";
                const nextStatus = canAdvance ? SEQ[_idx+1] : null;
                const nextColor = nextStatus ? (ORD_ST[nextStatus]?.color || stColor) : stColor;
                const minsSince = o.createdAt ? Math.floor((Date.now()-new Date(o.createdAt).getTime())/60000) : 0;
                const isAdvancing = advancing[o.id];
                const riderMissing = needRider && !o.riderId && !o.assignedRider;
                return (
                <tr key={o.id} style={{ borderLeft:`3px solid ${stColor}` }}>
                  <td className="sheet-row-number">{index + 1}</td>
                  <td className="sheet-cell-strong" style={{ color:ORANGE, fontFamily:"monospace", fontSize:11 }}>{o.orderId||o.id.slice(-6)}</td>
                  <td>
                    <div style={{ fontSize:12, fontWeight:600, color:"#0f172a" }}>{o.customerName}</div>
                    <div style={{ fontSize:10, color:"#94a3b8" }}>{o.phone} · {o.type||"online"}</div>
                  </td>
                  <td style={{ fontSize:12 }}>{orderItemsCount(o)}</td>
                  <td className="sheet-cell-strong" style={{ textAlign:"right", fontSize:13 }}>{fmt(o.total)}</td>
                  <td>
                    <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                      <div style={{ display:"flex", gap:2, alignItems:"center" }}>
                        {SEQ.map((s,i)=>{
                          const done = i < _idx;
                          const cur = i === _idx;
                          return <div key={s} style={{ width:14, height:cur?6:4, borderRadius:3, backgroundColor:done?stColor:(cur?stColor:"#e2e8f0"), transition:"all 0.2s" }} />;
                        })}
                      </div>
                      <span style={{ fontSize:10, fontWeight:600, color:stColor, whiteSpace:"nowrap" }}>{ORD_ST[o.status]?.label||o.status}</span>
                    </div>
                  </td>
                  <td style={{ fontSize:10, color:"#94a3b8", whiteSpace:"nowrap" }}>{minsSince<1?"<1m":`${minsSince}m`}</td>
                  <td>
                    <div style={{ display:"flex", flexDirection:"column", gap:3, minWidth:100 }}>
                      {/* Primary: Status Update Button */}
                      {canAdvance ? (
                        riderMissing ? (
                          <div style={{ display:"flex", gap:3, alignItems:"center" }}>
                            <select className="sheet-select" style={{ flex:1, fontSize:12, fontWeight:600, padding:"8px 6px", borderColor:ORANGE, outline:`2px solid ${ORANGE}`, borderRadius:8 }} defaultValue="" onChange={e=>{if(e.target.value)assignRider(o.id,e.target.value)}}><option value="" disabled>Assign rider..</option>{riders.filter(r=>r.status==="online"||r.status==="busy").map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select>
                          </div>
                        ) : (
                          <button type="button" disabled={isAdvancing} style={{ background:nextColor, color:"white", border:"none", borderRadius:24, padding:"10px 20px", minWidth:120, cursor:isAdvancing?"not-allowed":"pointer", opacity:isAdvancing?0.6:1, display:"flex", flexDirection:"column", alignItems:"center", gap:2, transition:"all 0.15s", boxShadow:"0 2px 6px rgba(0,0,0,0.15)" }} onClick={()=>advance(o.id)}>
                            <span style={{ fontSize:16, fontWeight:700, lineHeight:1.2 }}>{isAdvancing?"...":flowLabels[o.status]}</span>
                            <span style={{ fontSize:11, fontWeight:600, opacity:0.9, lineHeight:1.1 }}>→ {ORD_ST[nextStatus]?.label||nextStatus}</span>
                          </button>
                        )
                      ) : o.status==="Delivered"||o.status==="Cancelled" ? null : (
                        <div style={{ fontSize:10, color:"#94a3b8", fontStyle:"italic", padding:"6px 0" }}>Final</div>
                      )}
                      {/* Rider badge */}
                      {o.riderName&&!riderMissing&&<span style={{ fontSize:12, color:"#3b82f6", fontWeight:700, whiteSpace:"nowrap" }}>🛵 {o.riderName}</span>}
                      {/* Secondary: Cancel / Edit / Delete */}
                      <div style={{ display:"flex", gap:3, alignItems:"center", paddingTop:4, borderTop:"1px solid #f1f5f9" }}>
                        {o.status!=="Delivered"&&o.status!=="Cancelled"&&<button type="button" className="sheet-icon-button sheet-danger" title="Cancel" onClick={()=>cancel(o.id)}><XCircle size={12} /></button>}
                        <button type="button" className="sheet-icon-button" title="Edit" onClick={()=>setEditing({id:o.id,customerName:o.customerName||"",phone:o.phone||"",total:o.total||0,type:o.type||"delivery",status:o.status||"",address:o.address||""})}><Edit3 size={12} /></button>
                        <button type="button" className="sheet-icon-button sheet-danger" title="Delete" onClick={()=>deleteOperation(o.id)}><Trash2 size={12} /></button>
                      </div>
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
        {filteredOps.length===0&&<div style={{ textAlign:"center", padding:28, color:"#94a3b8", fontSize:13 }}>No active operations found</div>}
      </GlassCard>
      <div className="grid gap-4" style={{ gridTemplateColumns:"repeat(auto-fit, minmax(300px,1fr))" }}>
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="font-bold text-slate-800 text-sm" style={{ fontFamily:"'Outfit', sans-serif" }}>Live Order Feed</span>
          </div>
          <div className="space-y-3">
            {activeOrders.slice(0,10).map(o => (
              <div key={o.id} className="p-3 rounded-xl border border-slate-100 hover:border-orange-200 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold" style={{ color:ORANGE }}>#{o.id.slice(-6)}</span>
                  <StatusBadge status={o.status} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-slate-800">{o.customerName}</div>
                    <div className="text-xs text-slate-500">{orderItemsCount(o)} items · {fmt(o.total)} · {relTime(o.createdAt)}</div>
                  </div>
                  {o.status==="Placed" && <button onClick={()=>advance(o.id)} className="px-3 py-1 rounded-lg text-xs font-bold text-white ml-2 flex-shrink-0" style={{ backgroundColor:ORANGE }}>Accept</button>}
                </div>
              </div>
            ))}
            {activeOrders.length===0&&<div style={{ textAlign:"center", padding:24, color:"#94a3b8", fontSize:13 }}>No active orders</div>}
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
                        style={{ color: status==="online"?COLORS.success:status==="on delivery"||status==="busy"?COLORS.warning:"#94a3b8" }}>
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: status==="online"?COLORS.success:status==="on delivery"||status==="busy"?COLORS.warning:"#94a3b8" }} />
                        {status}
                      </div>
                      {activeOrder && <div className="text-xs text-slate-500 mt-0.5">{activeOrder}</div>}
                    </div>
                  </div>
                </div>
              );
            })}
            {riders.length === 0 && <div style={{ textAlign:"center", padding:20, color:"#94a3b8", fontSize:12 }}>No riders yet</div>}
          </div>
        </GlassCard>
      </div>
      <Modal open={!!editing} onClose={()=>setEditing(null)}>
        {editing && <div>
          <h3 style={{ fontSize:16, fontWeight:700, color:"#0f172a", marginBottom:16 }}>{editing.id&&orders.find(o=>o.id===editing.id)?"Edit Operation":"New Operation"}</h3>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <Input placeholder="Customer Name" value={editing.customerName} onChange={e=>setEditing({...editing,customerName:e.target.value})} />
            <Input placeholder="Phone" value={editing.phone} onChange={e=>setEditing({...editing,phone:e.target.value})} />
            <Input type="number" placeholder="Total" value={editing.total} onChange={e=>setEditing({...editing,total:e.target.value})} />
            <Select value={editing.type} onChange={e=>setEditing({...editing,type:e.target.value})}>
              <option value="delivery">Delivery</option>
              <option value="dinein">Dine-in</option>
              <option value="takeaway">Takeaway</option>
            </Select>
            <Input placeholder="Address / table / note" value={editing.address} onChange={e=>setEditing({...editing,address:e.target.value})} />
          </div>
          <BtnPrimary onClick={saveOperation} style={{ width:"100%", marginTop:14 }}>Save</BtnPrimary>
        </div>}
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// KITCHEN PAGE (Firebase real-time + sequential status)
// ═══════════════════════════════════════════════════════════════════════════
function KitchenPage({ showToast }) {
  const [kitchenOrders, setKitchenOrders] = useState([]);
  const [statusTimers, setStatusTimers] = useState({});
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const KITCHEN_ST = ["Placed","Confirmed","Preparing","Cooked","Ready"];
  const kColors = { Placed:"#f59e0b", Confirmed:"#3b82f6", Preparing:"#8b5cf6", Cooked:"#06b4e6", Ready:"#0ea5e9" };
  const flow = { Placed:"Confirmed", Confirmed:"Preparing", Preparing:"Cooked", Cooked:"Ready" };
  const actLabels = { Placed:"Confirm", Confirmed:"Start Prep", Preparing:"Mark Cooked", Cooked:"Mark Ready" };
  const PRIORITY = { Placed:0, Confirmed:1, Preparing:2, Cooked:3, Ready:4 };

  useEffect(() => {
    const r = Outlet("orders");
    if (!r) return;
    const unsub = onValue(r, snap => {
      const v = snap.val();
      setKitchenOrders(v ? Object.keys(v).map(k => ({ id:k, ...v[k] })).filter(o => KITCHEN_ST.includes(o.status)) : []);
    });
    return () => off(r, "value", unsub);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setStatusTimers(prev => {
      const next = {};
      kitchenOrders.forEach(o => { const k = o.id + o.status; next[k] = (prev[k] | 0) + 1; });
      return next;
    }), 60000);
    return () => clearInterval(t);
  }, [kitchenOrders]);

  const filtered = useMemo(() => kitchenOrders
    .filter(o => (filter==="all" || o.status===filter) && (!search || o.id.toLowerCase().includes(search.toLowerCase()) || (o.customerName||o.customer||"").toLowerCase().includes(search.toLowerCase())))
    .sort((a,b) => {
      const d = (PRIORITY[a.status]||9) - (PRIORITY[b.status]||9);
      if (d) return d;
      return ((statusTimers[b.id+b.status]|0) - (statusTimers[a.id+a.status]|0));
    }), [kitchenOrders, filter, search, statusTimers]);

  const advance = useCallback(async (id) => {
    const o = kitchenOrders.find(x => x.id===id);
    if (!o || !flow[o.status]) return;
    const next = flow[o.status];
    try {
      await update(Outlet(`orders/${id}`), { status: next });
      showToast(`${o.orderId||o.id.slice(-6)} → ${ORD_ST[next].label}`,"success");
    } catch(e) { showToast("Update failed","error"); }
  }, [kitchenOrders, showToast]);

  const advanceAll = useCallback(async () => {
    const eligible = kitchenOrders.filter(o => flow[o.status]);
    if (!eligible.length) return showToast("No orders to advance","info");
    for (const o of eligible) {
      await update(Outlet(`orders/${o.id}`), { status: flow[o.status] }).catch(() => {});
    }
    showToast(`${eligible.length} order${eligible.length>1?"s":""} advanced`,"success");
  }, [kitchenOrders, showToast]);

  const cancelOrder = useCallback(async (id) => {
    if (!confirm("Cancel this order?")) return;
    try {
      await update(Outlet(`orders/${id}`), { status:"Cancelled" });
      setSelected(null);
      showToast("Order cancelled","info");
    } catch(e) { showToast("Cancel failed","error"); }
  }, [showToast]);

  const counts = {};
  KITCHEN_ST.forEach(s => { counts[s] = kitchenOrders.filter(o=>o.status===s).length; });
  const total = kitchenOrders.length;

  const getItems = (o) => Array.isArray(o.cart) ? o.cart : (Array.isArray(o.items) ? o.items : (o.items ? Object.values(o.items) : []));
  const getNotes = (o) => o.notes || o.specialInstructions || "";

  return (
    <div className="space-y-4">
      <GlassCard className="p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 style={{fontSize:18,fontWeight:700,color:"#0f172a",fontFamily:"'Outfit', sans-serif"}}>Kitchen</h2>
          <span style={{fontSize:12,color:"#94a3b8"}}>{total} active</span>
          <div className="flex gap-1.5">
            <Pill label={`All (${total})`} active={filter==="all"} onClick={()=>setFilter("all")} />
            {KITCHEN_ST.map(s => (
              <Pill key={s} label={`${ORD_ST[s].label} (${counts[s]})`} active={filter===s} onClick={()=>setFilter(s)} />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div style={{position:"relative"}}>
            <Search size={14} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"#94a3b8"}} />
            <input placeholder="Search order or customer..." value={search} onChange={e=>setSearch(e.target.value)} style={{padding:"7px 12px 7px 32px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:13,width:200,outline:"none"}} />
          </div>
          <BtnSecondary onClick={advanceAll}><ShoppingBag size={13} style={{marginRight:4}} />Advance All</BtnSecondary>
        </div>
      </GlassCard>

      <div className="grid gap-4" style={{gridTemplateColumns:"repeat(auto-fill, minmax(340px, 1fr))"}}>
        {filtered.map(o => {
          const color = kColors[o.status] || ORANGE;
          const mins = statusTimers[o.id+o.status] | 0;
          const custName = o.customerName || o.customer || "";
          return (
            <GlassCard key={o.id} className="p-0" style={{cursor:"pointer",transition:"all 0.15s"}} onClick={()=>setSelected(o)}>
              <div style={{height:4,backgroundColor:color}} />
              <div className="p-4">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-sm font-bold whitespace-nowrap" style={{color}}>{o.orderId||o.id.slice(-6)}</span>
                    {mins>=10&&<span className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white flex-shrink-0" style={{backgroundColor:mins>=15?"#ef4444":"#f59e0b"}}>HOLD</span>}
                  </div>
                  <span className="text-xs font-semibold flex items-center gap-1 flex-shrink-0" style={{color:mins>=15?"#ef4444":mins>=10?"#f59e0b":"#94a3b8"}}>
                    <Clock size={10} />{mins}m
                  </span>
                </div>
                <div className="font-bold text-slate-800 mb-0.5 truncate">{custName}</div>
                <div className="text-xs text-slate-400 mb-0.5 truncate">{o.address||""}</div>
                <div className="text-xs text-slate-400 mb-3">
                  {orderItemsCount(o)} item{orderItemsCount(o)!==1?"s":""} · {o.type||"online"} · <span className="font-semibold" style={{color}}>{fmt(o.total)}</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge status={o.status} />
                  <div style={{marginLeft:"auto"}} className="flex gap-1.5 flex-shrink-0">
                    <button onClick={e=>{e.stopPropagation();cancelOrder(o.id);}} className="px-4 py-2 rounded-lg text-sm font-bold text-red-400 border border-red-200 bg-white cursor-pointer whitespace-nowrap" style={{transition:"all 0.15s"}}>Cancel</button>
                    {flow[o.status]&&<button onClick={e=>{e.stopPropagation();advance(o.id);}} className="px-5 py-2 rounded-lg text-sm font-bold text-white border-0 cursor-pointer whitespace-nowrap" style={{backgroundColor:color,transition:"all 0.15s"}}>{actLabels[o.status]}</button>}
                  </div>
                </div>
              </div>
            </GlassCard>
          );
        })}
        {filtered.length===0&&<EmptyState icon={ChefHat} msg={search?"No orders match your search":"Kitchen is clear! No active orders."} />}
      </div>

      <Modal open={!!selected} onClose={()=>setSelected(null)} wide>
        {selected&&(()=>{
          const color = kColors[selected.status] || ORANGE;
          const items = getItems(selected);
          const notes = getNotes(selected);
          const custName = selected.customerName || selected.customer || "";
          const mins = statusTimers[selected.id+selected.status] | 0;
          return <div className="space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-base font-bold" style={{color}}>#{selected.orderId||selected.id.slice(-6)}</span>
                  <StatusBadge status={selected.status} />
                </div>
                <div className="text-sm text-slate-500">{custName} · {selected.phone||"N/A"}</div>
                <div className="text-sm text-slate-400">{selected.address||""}</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold" style={{color}}>{fmt(selected.total)}</div>
                <div className="text-xs text-slate-400 flex items-center gap-1 justify-end mt-1">
                  <Clock size={10} /> {mins}m in status
                </div>
              </div>
            </div>

            <div>
              <SectionHeader title="Order Items" />
              <div className="space-y-2">
                {items.length > 0 ? items.map((item,i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{backgroundColor:color}}>{item.qty || item.quantity || 1}</span>
                      <span className="text-sm font-medium text-slate-800">{item.name || item.item || "Item"}</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-600">{fmt((item.lineTotal || item.total || item.price || 0) * (item.qty || item.quantity || 1))}</span>
                  </div>
                )) : (
                  <div className="text-sm text-slate-400 p-3">Item details not available</div>
                )}
              </div>
            </div>

            {notes && (
              <div>
                <SectionHeader title="Special Instructions" />
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 flex items-start gap-2">
                  <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                  {notes}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button onClick={()=>cancelOrder(selected.id)} className="px-4 py-2 rounded-xl text-sm font-semibold border border-red-200 text-red-400 bg-white cursor-pointer">Cancel Order</button>
              {flow[selected.status]&&<BtnPrimary onClick={()=>{advance(selected.id);setSelected(null);}}>{actLabels[selected.status]}</BtnPrimary>}
            </div>
          </div>;
        })()}
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// INVENTORY PAGE
// ═══════════════════════════════════════════════════════════════════════════
function InventoryPage({ showToast, requireAdminReauth }) {
  const [invItems, setInvItems] = useState([]);
  const [dishItems, setDishItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddInv, setShowAddInv] = useState(false);
  const [addInvForm, setAddInvForm] = useState({ name: "", category: "", stock: 0, threshold: 5, unit: "units" });
  const [addInvBusy, setAddInvBusy] = useState(false);
  const [editInvId, setEditInvId] = useState(null);
  const [editInvForm, setEditInvForm] = useState({ name: "", category: "", stock: 0, threshold: 5, unit: "units" });
  const [editInvBusy, setEditInvBusy] = useState(false);
  const [csvImportBusy, setCsvImportBusy] = useState(false);
  const csvInputRef = useRef(null);

  useEffect(() => {
    const r = Outlet("inventory");
    const d = Outlet("dishes");
    if (!d) { setLoading(false); return; }
    const u1 = r ? onValue(r, snap => { const v = snap.val() || {}; setInvItems(Object.keys(v).map(k => ({ id: k, source: "inventory", name: v[k].name || "Unnamed", stock: Number(v[k].stock)||0, threshold: Number(v[k].threshold)||5, unit: v[k].unit || "units", dishId: v[k].dishId || null }))); }) : () => {};
    const u2 = onValue(d, snap => {
      const v = snap.val() || {};
      setDishItems(Object.keys(v).map(k => ({ id: k, source: "dish", name: v[k].name || "Unnamed", stock: v[k].stock, stockType: typeof v[k].stock, category: v[k].category || "" })));
      setLoading(false);
    });
    return () => { if (r) off(r,"value",u1); off(d,"value",u2); };
  }, []);

  const items = invItems.length > 0 ? invItems : dishItems;
  const usingDishes = invItems.length === 0;

  const updateStock = useCallback(async (id, delta, source) => {
    if (source === "dish") {
      const cur = dishItems.find(i => i.id === id);
      if (!cur) return;
      if (cur.stockType === "boolean") {
        const newStock = !cur.stock;
        try {
          await update(Outlet(`dishes/${id}`), { stock: newStock });
          logAudit(_bizId, _outletId, "inventory_stock_toggle", {
            itemId: id, itemName: cur.name, itemType: "dish", unit: "boolean",
            previous: cur.stock, next: newStock
          }, getCurrentAdminActor());
          showToast(`${cur.name} marked ${newStock ? "In Stock" : "Out of Stock"}`,"success");
        }
        catch(e) { showToast("Update failed","error"); }
      } else {
        const previousStock = Number(cur.stock)||0;
        const newStock = Math.max(0, previousStock + delta);
        try {
          await update(Outlet(`dishes/${id}`), { stock: newStock });
          logAudit(_bizId, _outletId, "inventory_stock_adjust", {
            itemId: id, itemName: cur.name, itemType: "dish", unit: "count",
            previous: previousStock, next: newStock, delta
          }, getCurrentAdminActor());
          showToast(`Stock updated: ${newStock}`,"success");
        }
        catch(e) { showToast("Update failed","error"); }
      }
    } else {
      const cur = invItems.find(i => i.id === id);
      if (!cur) return;
      const previousStock = Number(cur.stock||0);
      const newStock = Math.max(0, previousStock + delta);
      try {
        await update(Outlet(`inventory/${id}`), { stock: newStock });
        logAudit(_bizId, _outletId, "inventory_stock_adjust", {
          itemId: id, itemName: cur.name, itemType: "raw_material", unit: cur.unit || "units",
          previous: previousStock, next: newStock, delta
        }, getCurrentAdminActor());
        showToast(`Stock updated: ${newStock}`,"success");
      }
      catch(e) { showToast("Update failed","error"); }
    }
  }, [dishItems, invItems, showToast]);

  const itemIsAvailable = (item) => {
    if (item.source === "dish") {
      if (item.stockType === "boolean") return item.stock === true;
      return (Number(item.stock)||0) > 0;
    }
    return stockStatus(Number(item.stock)||0, Number(item.threshold)||0) === "ok";
  };
  const low = items.filter(i => !itemIsAvailable(i) && (i.source === "dish" ? (i.stockType === "boolean" ? i.stock === false : (Number(i.stock)||0) > 0) : (Number(i.stock)||0) > 0)).length;
  const critical = items.filter(i => i.source === "dish" ? (i.stockType === "boolean" ? i.stock === false : (Number(i.stock)||0) === 0) : (Number(i.stock)||0) === 0).length;
  const exportInventory = useCallback(() => {
    downloadCSV(`inventory-${new Date().toISOString().slice(0,10)}.csv`, items.map((item, index) => ({
      row: index + 1,
      item: item.name,
      stock: item.source === "dish" && item.stockType === "boolean" ? (item.stock ? "available" : "unavailable") : (item.stock || 0),
      threshold: item.threshold || "",
      unit: item.unit || "",
      status: itemIsAvailable(item) ? "ok" : "out",
    })));
    showToast("Inventory exported", "success");
  }, [items, showToast]);

  const handleAddInventory = useCallback(async (e) => {
    e?.preventDefault?.();
    const name = (addInvForm.name || "").trim();
    if (!name) return showToast("Item name is required", "warning");
    const stock = Math.max(0, Number(addInvForm.stock) || 0);
    const threshold = Math.max(0, Number(addInvForm.threshold) || 0);
    const unit = (addInvForm.unit || "units").trim() || "units";
    const category = (addInvForm.category || "").trim();
    setAddInvBusy(true);
    try {
      const newRef = push(Outlet("inventory"));
      await set(newRef, {
        name, category, stock, threshold, unit,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      logAudit(_bizId, _outletId, "inventory_create", {
        itemId: newRef.key, name, category, stock, threshold, unit
      }, getCurrentAdminActor());
      showToast(`${name} added to inventory`, "success");
      setShowAddInv(false);
      setAddInvForm({ name: "", category: "", stock: 0, threshold: 5, unit: "units" });
    } catch (err) {
      showToast("Failed to add item: " + (err?.message || "unknown error"), "error");
    } finally {
      setAddInvBusy(false);
    }
  }, [addInvForm, showToast]);

  const openEditInventory = useCallback((item) => {
    setEditInvId(item.id);
    setEditInvForm({
      name: item.name || "",
      category: item.category || "",
      stock: Number(item.stock) || 0,
      threshold: Number(item.threshold) || 0,
      unit: item.unit || "units"
    });
  }, []);

  const handleEditInventory = useCallback(async (e) => {
    e?.preventDefault?.();
    if (!editInvId) return;
    const name = (editInvForm.name || "").trim();
    if (!name) return showToast("Item name is required", "warning");
    setEditInvBusy(true);
    try {
      const previous = invItems.find(i => i.id === editInvId);
      await update(Outlet(`inventory/${editInvId}`), {
        name,
        category: (editInvForm.category || "").trim(),
        stock: Math.max(0, Number(editInvForm.stock) || 0),
        threshold: Math.max(0, Number(editInvForm.threshold) || 0),
        unit: (editInvForm.unit || "units").trim() || "units",
        updatedAt: new Date().toISOString()
      });
      logAudit(_bizId, _outletId, "inventory_update", {
        itemId: editInvId, name,
        previous: previous ? { stock: previous.stock, threshold: previous.threshold, unit: previous.unit } : null,
        next: { stock: Number(editInvForm.stock) || 0, threshold: Number(editInvForm.threshold) || 0, unit: editInvForm.unit }
      }, getCurrentAdminActor());
      showToast(`${name} updated`, "success");
      setEditInvId(null);
    } catch (err) {
      showToast("Failed to update item: " + (err?.message || "unknown error"), "error");
    } finally {
      setEditInvBusy(false);
    }
  }, [editInvForm, editInvId, invItems, showToast]);

  const handleDeleteInventory = useCallback(async (item) => {
    if (!item || !item.id) return;
    if (!confirm(`Delete "${item.name}" from inventory?`)) return;
    if (requireAdminReauth && !(await requireAdminReauth())) return;
    try {
      await remove(Outlet(`inventory/${item.id}`));
      logAudit(_bizId, _outletId, "inventory_delete", {
        itemId: item.id, name: item.name, stock: item.stock, threshold: item.threshold, unit: item.unit
      }, getCurrentAdminActor());
      showToast(`${item.name} deleted`, "success");
    } catch (err) {
      showToast("Failed to delete: " + (err?.message || "unknown error"), "error");
    }
  }, [showToast, requireAdminReauth]);

  const handleCsvImport = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvImportBusy(true);
    try {
      const text = await file.text();
      const lines = text.trim().split("\n");
      if (lines.length < 2) { showToast("CSV must have a header row and at least one data row","warning"); setCsvImportBusy(false); return; }
      const headers = lines[0].toLowerCase().split(",").map(h => h.trim());
      const nameIdx = headers.findIndex(h => h === "name" || h === "item");
      const stockIdx = headers.findIndex(h => h === "stock" || h === "quantity" || h === "qty");
      const catIdx = headers.findIndex(h => h === "category");
      const threshIdx = headers.findIndex(h => h === "threshold" || h === "min" || h === "alert");
      const unitIdx = headers.findIndex(h => h === "unit");
      if (nameIdx === -1) { showToast("CSV must have a 'name' or 'item' column","warning"); setCsvImportBusy(false); return; }
      const rows = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map(c => c.trim());
        const name = cols[nameIdx];
        if (!name) continue;
        rows.push({
          name,
          category: catIdx >= 0 ? cols[catIdx] || "" : "",
          stock: Math.max(0, Number(cols[stockIdx >= 0 ? stockIdx : nameIdx]) || 0),
          threshold: Math.max(0, Number(cols[threshIdx >= 0 ? threshIdx : nameIdx]) || 5),
          unit: unitIdx >= 0 ? cols[unitIdx] || "units" : "units"
        });
      }
      if (rows.length === 0) { showToast("No valid rows found","warning"); setCsvImportBusy(false); return; }
      const promises = rows.map(r => push(Outlet("inventory"), { ...r, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }));
      await Promise.all(promises);
      logAudit(_bizId, _outletId, "inventory_csv_import", { count: rows.length, sample: rows.slice(0,3) }, getCurrentAdminActor());
      showToast(`Imported ${rows.length} item(s) from CSV`,`success`);
    } catch (err) { showToast("CSV import failed: "+(err?.message||"unknown error"),"error"); }
    finally { setCsvImportBusy(false); if (csvInputRef.current) csvInputRef.current.value = ""; }
  }, [showToast]);

  if (loading) return <SkeletonPage kpi={3} table={5} />;

  return (
    <div className="space-y-4">
      <div className="sheet-toolbar">
        <div style={{ fontSize:12, color:"#94a3b8" }}>
          {usingDishes
            ? `No raw-materials inventory found — showing dish availability (${dishItems.filter(d => d.stockType === "boolean").length} of ${dishItems.length} use boolean stock)`
            : `Showing raw materials from ${invItems.length} inventory record(s)`}
        </div>
        <input ref={csvInputRef} type="file" accept=".csv" style={{ display:"none" }} onChange={handleCsvImport} />
        <button type="button" className="sheet-button" onClick={() => csvInputRef.current?.click()} disabled={csvImportBusy}><Upload size={14} /> {csvImportBusy?"Importing...":"Import CSV"}</button>
        <button type="button" className="sheet-button" onClick={exportInventory}><Download size={14} /> Export CSV</button>
        <button type="button" className="sheet-button" onClick={() => setShowAddInv(true)} style={{ background:ORANGE, color:"white" }}><Plus size={14} /> New Item</button>
      </div>
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
        <KPICard title="Total Items" value={items.length} icon={Package} />
        <KPICard title="Unavailable" value={critical} icon={XCircle} color={COLORS.error} />
        <KPICard title={usingDishes ? "Out of Stock (dishes)" : "Low Stock"} value={low} icon={AlertTriangle} color={COLORS.warning} />
      </div>
      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: 500 }}>
            <thead>
              <tr className="border-b border-slate-100">
                {["Item","Category","Stock","Linked Dish","Status","Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && <tr><td colSpan={6} style={{ textAlign:"center", padding:32, color:"#94a3b8" }}>No inventory items. Add dishes in the Menu page or seed raw materials under inventory.</td></tr>}
              {items.map(item => {
                const available = itemIsAvailable(item);
                const isBool = item.source === "dish" && item.stockType === "boolean";
                const isDish = item.source === "dish";
                const numericStock = isBool ? (item.stock ? 1 : 0) : (Number(item.stock)||0);
                const threshold = Number(item.threshold)||0;
                const st = isBool
                  ? (item.stock === false ? statusColors.critical : statusColors.ok)
                  : statusColors[stockStatus(numericStock, threshold)];
                const pct = isBool ? (item.stock === false ? 5 : 100) : Math.min(100, numericStock / (threshold * 2 || 1) * 100);
                const linkedDish = item.dishId ? dishItems.find(d => d.id === item.dishId) : null;
                return (
                  <tr key={item.id} className="border-b border-slate-50 hover:bg-orange-50/30">
                    <td className="px-4 py-3 font-semibold text-slate-800">{item.name}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{isDish ? (item.category || "—") : (item.unit || "—")}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-800 w-12">
                          {isBool ? (item.stock === false ? "❌" : "✅") : numericStock}
                        </span>
                        <div className="flex-1 bg-slate-100 rounded-full h-1.5 w-20 min-w-0">
                          <div className="h-1.5 rounded-full transition-all" style={{ width:`${pct}%`, backgroundColor: st.color }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: linkedDish ? "#0f172a" : "#94a3b8" }}>
                      {linkedDish ? linkedDish.name : (item.dishId ? "Unknown dish" : "—")}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-full text-xs font-bold capitalize"
                        style={{ color: st.color, backgroundColor: st.bg }}>
                        {isBool ? (item.stock === false ? "out of stock" : "in stock") : stockStatus(numericStock, threshold)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        {isBool ? (
                          <button onClick={() => updateStock(item.id, 0, item.source)}
                            className="px-3 py-1 rounded-lg text-xs font-bold text-white"
                            style={{ backgroundColor: item.stock === false ? COLORS.success : COLORS.error }}>
                            {item.stock === false ? "Mark Available" : "Mark Unavailable"}
                          </button>
                        ) : (
                          <>
                            <button onClick={() => updateStock(item.id, -1, item.source)} className="px-2 py-1 rounded-lg text-xs font-bold bg-red-50 text-red-500">-1</button>
                            <button onClick={() => updateStock(item.id, 5, item.source)}  className="px-2 py-1 rounded-lg text-xs font-bold text-white" style={{ backgroundColor: ORANGE }}>+5</button>
                            <button onClick={() => updateStock(item.id, 10, item.source)} className="px-2 py-1 rounded-lg text-xs font-bold bg-green-50 text-green-600">+10</button>
                            {!isDish && (
                              <>
                                <button onClick={() => openEditInventory(item)} className="px-2 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-600" title="Edit item"><Edit3 size={11} /></button>
                                <button onClick={() => handleDeleteInventory(item)} className="px-2 py-1 rounded-lg text-xs font-bold bg-red-50 text-red-500" title="Delete item"><Trash2 size={11} /></button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <Modal open={showAddInv} onClose={() => setShowAddInv(false)} wide={false}>
        <form onSubmit={handleAddInventory}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:"#fff7ed", display:"flex", alignItems:"center", justifyContent:"center" }}><Package size={18} color={ORANGE}/></div>
            <div style={{ fontSize:17, fontWeight:700, color:"#0f172a" }}>Add Inventory Item</div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div style={{ gridColumn:"1 / -1" }}>
              <label style={{ fontSize:12, fontWeight:600, color:"#475569", display:"block", marginBottom:4 }}>Name *</label>
              <input value={addInvForm.name} onChange={e => setAddInvForm(f => ({...f, name: e.target.value}))} required autoFocus placeholder="e.g. Cheese, Flour, Tomato Sauce"
                style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:"1.5px solid #e2e8f0", fontSize:14, color:"#0f172a" }} />
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:"#475569", display:"block", marginBottom:4 }}>Category</label>
              <input value={addInvForm.category} onChange={e => setAddInvForm(f => ({...f, category: e.target.value}))} placeholder="e.g. Dairy, Vegetables"
                style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:"1.5px solid #e2e8f0", fontSize:14, color:"#0f172a" }} />
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:"#475569", display:"block", marginBottom:4 }}>Unit</label>
              <input value={addInvForm.unit} onChange={e => setAddInvForm(f => ({...f, unit: e.target.value}))} placeholder="kg, liters, units…"
                style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:"1.5px solid #e2e8f0", fontSize:14, color:"#0f172a" }} />
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:"#475569", display:"block", marginBottom:4 }}>Current Stock</label>
              <input type="number" min="0" value={addInvForm.stock} onChange={e => setAddInvForm(f => ({...f, stock: e.target.value}))}
                style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:"1.5px solid #e2e8f0", fontSize:14, color:"#0f172a" }} />
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:"#475569", display:"block", marginBottom:4 }}>Low-Stock Threshold</label>
              <input type="number" min="0" value={addInvForm.threshold} onChange={e => setAddInvForm(f => ({...f, threshold: e.target.value}))}
                style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:"1.5px solid #e2e8f0", fontSize:14, color:"#0f172a" }} />
            </div>
          </div>
          <div style={{ display:"flex", gap:8, marginTop:18, justifyContent:"flex-end" }}>
            <button type="button" onClick={() => setShowAddInv(false)} disabled={addInvBusy} style={{ padding:"9px 16px", borderRadius:8, border:"1.5px solid #e2e8f0", background:"white", color:"#475569", fontSize:13, fontWeight:600, cursor:"pointer" }}>Cancel</button>
            <button type="submit" disabled={addInvBusy} style={{ padding:"9px 16px", borderRadius:8, border:0, background:ORANGE, color:"white", fontSize:13, fontWeight:600, cursor:"pointer", opacity: addInvBusy ? 0.6 : 1 }}>{addInvBusy ? "Saving…" : "Add Item"}</button>
          </div>
        </form>
      </Modal>

      <Modal open={editInvId !== null} onClose={() => setEditInvId(null)} wide={false}>
        <form onSubmit={handleEditInventory}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:"#fff7ed", display:"flex", alignItems:"center", justifyContent:"center" }}><Edit3 size={18} color={ORANGE}/></div>
            <div style={{ fontSize:17, fontWeight:700, color:"#0f172a" }}>Edit Inventory Item</div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div style={{ gridColumn:"1 / -1" }}>
              <label style={{ fontSize:12, fontWeight:600, color:"#475569", display:"block", marginBottom:4 }}>Name *</label>
              <input value={editInvForm.name} onChange={e => setEditInvForm(f => ({...f, name: e.target.value}))} required autoFocus
                style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:"1.5px solid #e2e8f0", fontSize:14, color:"#0f172a" }} />
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:"#475569", display:"block", marginBottom:4 }}>Category</label>
              <input value={editInvForm.category} onChange={e => setEditInvForm(f => ({...f, category: e.target.value}))}
                style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:"1.5px solid #e2e8f0", fontSize:14, color:"#0f172a" }} />
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:"#475569", display:"block", marginBottom:4 }}>Unit</label>
              <input value={editInvForm.unit} onChange={e => setEditInvForm(f => ({...f, unit: e.target.value}))}
                style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:"1.5px solid #e2e8f0", fontSize:14, color:"#0f172a" }} />
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:"#475569", display:"block", marginBottom:4 }}>Current Stock</label>
              <input type="number" min="0" value={editInvForm.stock} onChange={e => setEditInvForm(f => ({...f, stock: e.target.value}))}
                style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:"1.5px solid #e2e8f0", fontSize:14, color:"#0f172a" }} />
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:"#475569", display:"block", marginBottom:4 }}>Low-Stock Threshold</label>
              <input type="number" min="0" value={editInvForm.threshold} onChange={e => setEditInvForm(f => ({...f, threshold: e.target.value}))}
                style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:"1.5px solid #e2e8f0", fontSize:14, color:"#0f172a" }} />
            </div>
          </div>
          <div style={{ display:"flex", gap:8, marginTop:18, justifyContent:"flex-end" }}>
            <button type="button" onClick={() => setEditInvId(null)} disabled={editInvBusy} style={{ padding:"9px 16px", borderRadius:8, border:"1.5px solid #e2e8f0", background:"white", color:"#475569", fontSize:13, fontWeight:600, cursor:"pointer" }}>Cancel</button>
            <button type="submit" disabled={editInvBusy} style={{ padding:"9px 16px", borderRadius:8, border:0, background:ORANGE, color:"white", fontSize:13, fontWeight:600, cursor:"pointer", opacity: editInvBusy ? 0.6 : 1 }}>{editInvBusy ? "Saving…" : "Save Changes"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// RIDERS PAGE
// ═══════════════════════════════════════════════════════════════════════════
function RidersPage({ showToast }) {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [view, setView] = useState("table");
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", phone: "", email: "", password: "", vehicle: "bike", zone: "" });
  const [addBusy, setAddBusy] = useState(false);
  const [addError, setAddError] = useState("");
  const [showReset, setShowReset] = useState(false);
  const [resetForm, setResetForm] = useState({ currentPassword: "", newPassword: "" });
  const [resetBusy, setResetBusy] = useState(false);
  const [resetError, setResetError] = useState("");
  const [settleAmount, setSettleAmount] = useState("");
  const [settleBusy, setSettleBusy] = useState(false);

  useEffect(() => {
    const r = ref(db, "riders");
    const unsub = onValue(r, snap => {
      const v = snap.val() || {};
      setRiders(Object.keys(v).map(k => normalizeRider({ id: k, ...v[k] })));
      setLoading(false);
    }, () => setLoading(false));
    return () => off(r, "value", unsub);
  }, []);

  const filtered = useMemo(() => riders.filter(r => (filter==="all"||r.status===filter) && (!search||(r.name||"").toLowerCase().includes(search.toLowerCase()))), [riders, filter, search]);
  const online = riders.filter(r => r.status==="online").length;
  const busy = riders.filter(r => r.status==="busy").length;
  const offline = riders.length - online - busy;
  const totalEarn = riders.reduce((s,r) => s + r.earn, 0);
  const avgRating = riders.length ? (riders.reduce((s,r) => s + r.rating, 0) / riders.length).toFixed(1) : "—";
  const avgCompletion = riders.length ? Math.round(riders.reduce((s,r) => s + r.completed, 0) / riders.length) : 0;
  const maxDeliv = Math.max(1, ...riders.map(r => Number(r.deliv)||0));
  const toggleStatus = async (id) => {
    const r = riders.find(x => x.id === id);
    if (!r) return;
    const next = r.status === "offline" ? "Online" : "Offline";
    try { await update(ref(db, `riders/${id}`), { status: next }); showToast(`Rider ${next}`,"success"); }
    catch(e) { showToast("Update failed","error"); }
  };
  const exportCSV = useCallback(() => { downloadCSV(`riders-${new Date().toISOString().slice(0,10)}.csv`, filtered.map((r,i)=>({row:i+1,name:r.name,phone:r.phone,vehicle:r.vehicle,status:r.status,deliveries:r.deliv,earnings:r.earn,rating:r.rating,zone:r.zone,order:r.order||""}))); showToast("Riders exported","success"); }, [filtered, showToast]);
  const selectedEarningsChart = useMemo(() => {
    if (!selected) return [];
    const hist = selected.earningsHistory && typeof selected.earningsHistory === "object" ? selected.earningsHistory : null;
    if (hist) {
      return DAY_KEYS.slice(1).concat(DAY_KEYS.slice(0,1)).map(d => ({ d, earn: Number(hist[d.toLowerCase()] || hist[d] || 0) }));
    }
    return DAY_KEYS.slice(1).concat(DAY_KEYS.slice(0,1)).map(d => ({ d, earn: 0 }));
  }, [selected]);

  const requireReauth = async (actionLabel) => {
    const fn = typeof window !== "undefined" ? window.__foodhubbieRequireReauth : null;
    if (!fn) return true; // dev / outside app
    const ok = await fn();
    if (!ok) showToast(`Re-auth failed — ${actionLabel} cancelled`, "error");
    return ok;
  };

  const handleAddRider = async (e) => {
    e?.preventDefault();
    if (addBusy) return;
    if (!addForm.name.trim() || !addForm.email.trim() || !addForm.password) {
      return setAddError("Name, email, and password are required");
    }
    if (addForm.password.length < 6) return setAddError("Password must be at least 6 characters");
    if (!/^[0-9]{10}$/.test((addForm.phone || "").replace(/\D/g, ""))) {
      return setAddError("Phone must be 10 digits");
    }
    setAddBusy(true); setAddError("");
    try {
      const ok = await requireReauth("Add rider");
      if (!ok) { setAddBusy(false); return; }
      const { uid, email } = await createRiderAuthAccount(addForm.email.trim(), addForm.password);
      await set(ref(db, `riders/${uid}`), {
        uid,
        name: addForm.name.trim(),
        email,
        phone: addForm.phone.trim(),
        vehicle: addForm.vehicle,
        zone: addForm.zone.trim(),
        status: "offline",
        todayEarnings: 0,
        todayDeliveries: 0,
        totalOrders: 0,
        completionRate: 0,
        rating: 0,
        createdAt: serverTimestamp(),
        joinedAt: new Date().toISOString(),
        createdBy: getCurrentAdminActor()?.email || "admin"
      });
      logAudit(_bizId, _outletId, "create_rider", { riderId: uid, name: addForm.name.trim(), email }, getCurrentAdminActor());
      showToast(`Rider ${addForm.name.trim()} created`, "success");
      setAddForm({ name: "", phone: "", email: "", password: "", vehicle: "bike", zone: "" });
      setShowAdd(false);
    } catch (e2) {
      const msg = (e2?.message || "Add failed").replace("Firebase: ", "");
      setAddError(msg);
    } finally {
      setAddBusy(false);
    }
  };

  const handleResetPassword = async (e) => {
    e?.preventDefault();
    if (resetBusy || !selected) return;
    if (!selected.email) return setResetError("Rider has no email on file");
    if (resetForm.newPassword.length < 6) return setResetError("New password must be at least 6 characters");
    setResetBusy(true); setResetError("");
    try {
      const ok = await requireReauth("Reset password");
      if (!ok) { setResetBusy(false); return; }
      await resetRiderPassword(resetForm.currentPassword, resetForm.newPassword, selected.email);
      logAudit(_bizId, _outletId, "reset_rider_password", { riderId: selected.id, email: selected.email }, getCurrentAdminActor());
      showToast("Password reset", "success");
      setShowReset(false);
      setResetForm({ currentPassword: "", newPassword: "" });
    } catch (e2) {
      setResetError((e2?.message || "Reset failed").replace("Firebase: ", ""));
    } finally {
      setResetBusy(false);
    }
  };

  const handleDeleteRider = async () => {
    if (!selected) return;
    if (!confirm(`Permanently delete rider "${selected.name}"? This removes their auth account and profile. Orders history is retained.`)) return;
    try {
      const ok = await requireReauth("Delete rider");
      if (!ok) return;
      if (selected.email) {
        // We need their current password to delete via secondary auth. If the admin
        // does not have it, we at least remove the profile and let the auth account
        // be cleaned up later by a Cloud Function or manual Firebase console op.
        const pwd = prompt("Enter the rider's current password to also remove their login account. Leave blank to remove profile only:");
        if (pwd) {
          try {
            await deleteRiderAuthAccount(selected.email, pwd);
          } catch (e2) {
            showToast("Auth account not removed: " + (e2?.message || "").replace("Firebase: ", ""), "error");
          }
        }
      }
      await remove(ref(db, `riders/${selected.id}`));
      logAudit(_bizId, _outletId, "delete_rider", { riderId: selected.id, name: selected.name, email: selected.email || null }, getCurrentAdminActor());
      showToast("Rider deleted", "success");
      setSelected(null);
    } catch (e2) {
      showToast("Delete failed: " + (e2?.message || ""), "error");
    }
  };

  const handleSettleWallet = async () => {
    if (!selected) return;
    const amt = Number(settleAmount);
    if (!amt || amt <= 0) return showToast("Enter a positive amount", "error");
    setSettleBusy(true);
    try {
      const ok = await requireReauth("Settle wallet");
      if (!ok) { setSettleBusy(false); return; }
      const snap = await get(ref(db, `riders/${selected.id}`));
      const prev = snap.val() || {};
      const newEarn = Math.max(0, Number(prev.todayEarnings || 0) - amt);
      await update(ref(db, `riders/${selected.id}`), { todayEarnings: newEarn });
      // Also record the settlement in the outlet's settlements log
      const settleRef = push(Outlet("settlements") || ref(db, "system/settlements"), {
        riderId: selected.id,
        riderName: selected.name,
        amount: amt,
        type: "wallet_settle",
        settledBy: getCurrentAdminActor()?.email || "admin",
        settledAt: serverTimestamp()
      });
      logAudit(_bizId, _outletId, "settle_rider_wallet", { riderId: selected.id, amount: amt, settleId: settleRef?.key || null }, getCurrentAdminActor());
      showToast(`Settled ${fmt(amt)} for ${selected.name}`, "success");
      setSettleAmount("");
    } catch (e2) {
      showToast("Settle failed: " + (e2?.message || ""), "error");
    } finally {
      setSettleBusy(false);
    }
  };

  if (loading) return <SkeletonPage kpi={4} table={7} />;

  return (
    <div className="space-y-4">
      <GlassCard className="p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 style={{fontSize:18,fontWeight:700,color:"#0f172a",fontFamily:"'Outfit', sans-serif"}}>Riders</h2>
          <span style={{fontSize:12,color:"#94a3b8"}}>{riders.length} total</span>
          <div className="flex gap-1.5">
            {[{k:"all",l:`All (${riders.length})`},{k:"online",l:`Online (${online})`},{k:"busy",l:`Busy (${busy})`},{k:"offline",l:`Offline (${offline})`}].map(f => (
              <Pill key={f.k} label={f.l} active={filter===f.k} onClick={()=>setFilter(f.k)} />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div style={{position:"relative"}}>
            <Search size={14} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"#94a3b8"}} />
            <input placeholder="Search riders..." value={search} onChange={e=>setSearch(e.target.value)} style={{padding:"7px 12px 7px 32px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:13,width:180,outline:"none"}} />
          </div>
          <BtnSecondary onClick={()=>setView(v=>v==="table"?"grid":"table")}>{view==="table"?<LayoutDashboard size={14}/>:<Menu size={14}/>}</BtnSecondary>
          <BtnSecondary onClick={exportCSV}><Download size={13} style={{marginRight:4}} />Export</BtnSecondary>
          <BtnPrimary onClick={() => { setAddError(""); setShowAdd(true); }}><Plus size={13} style={{marginRight:4}} />Add Rider</BtnPrimary>
        </div>
      </GlassCard>

      <div className="grid gap-3" style={{gridTemplateColumns:"repeat(auto-fill, minmax(160px, 1fr))"}}>
        <KPICard title="Online" value={online} icon={Activity} color={COLORS.success} sub={<span style={{color:"#64748b"}}>{riders.length ? `${((online/riders.length)*100).toFixed(0)}% of fleet` : "No riders"}</span>} />
        <KPICard title="On Delivery" value={busy} icon={Truck} color={COLORS.warning} />
        <KPICard title="Completion Rate" value={riders.length ? `${avgCompletion}%` : "—"} icon={CheckCircle} color={COLORS.info} />
        <KPICard title="Avg Rating" value={avgRating} icon={Star} color="#f59e0b" />
      </div>

      {view==="table" ? (
        <GlassCard>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {["Rider","Status","Deliveries","Earnings","Rating","Zone","Completion",""].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id} className="border-b border-slate-50 hover:bg-orange-50/30 cursor-pointer" onClick={()=>setSelected(r)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={r.name} size={34} />
                        <div>
                          <div className="font-semibold text-slate-800">{r.name}</div>
                          <div className="text-xs text-slate-400">{r.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 text-xs font-semibold capitalize" style={{color:r.status==="online"?COLORS.success:r.status==="busy"?COLORS.warning:"#94a3b8"}}>
                        <span className="w-2 h-2 rounded-full" style={{backgroundColor:r.status==="online"?COLORS.success:r.status==="busy"?COLORS.warning:"#94a3b8"}} />
                        {r.status}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5 capitalize">{r.vehicle}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{r.deliv}</div>
                      <div className="w-16 bg-slate-100 rounded-full h-1 mt-1">
                        <div className="h-1 rounded-full" style={{width:`${Math.min(100,(Number(r.deliv)||0)/maxDeliv*100)}%`,backgroundColor:COLORS.primary}} />
                      </div>
                    </td>
                    <td className="px-4 py-3 font-bold" style={{color:ORANGE}}>{fmt(r.earn)}</td>
                    <td className="px-4 py-3"><StarRating rating={r.rating} /></td>
                    <td className="px-4 py-3 text-xs text-slate-600">{r.zone}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold" style={{color:r.completed>=90?COLORS.success:r.completed>=80?COLORS.warning:COLORS.error}}>{r.completed}%</span>
                        <div className="w-12 bg-slate-100 rounded-full h-1.5">
                          <div className="h-1.5 rounded-full" style={{width:`${r.completed}%`,backgroundColor:r.completed>=90?COLORS.success:r.completed>=80?COLORS.warning:COLORS.error}} />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={e=>{e.stopPropagation();toggleStatus(r.id);}} style={{padding:"4px 10px",borderRadius:6,fontSize:11,fontWeight:600,border:"none",cursor:"pointer",background:r.status==="offline"?"#22c55e":"#ef4444",color:"white",transition:"all 0.2s"}}>
                        {r.status==="offline"?"Activate":"Deactivate"}
                      </button>
                    </td>
              </tr>
            ))}
            </tbody>
            </table>
            {filtered.length===0&&<EmptyState icon={Users} msg="No riders match this filter" />}
          </div>
        </GlassCard>
      ) : (
        <div className="grid gap-4" style={{gridTemplateColumns:"repeat(auto-fill, minmax(260px, 1fr))"}}>
          {filtered.map(r => (
            <GlassCard key={r.id} className="p-4 cursor-pointer" onClick={()=>setSelected(r)}>
              <div className="flex items-center gap-3 mb-3">
                <Avatar name={r.name} size={40} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-800">{r.name}</div>
                  <div className="text-xs text-slate-400">{r.phone}</div>
                </div>
                <span className="flex items-center gap-1 text-xs font-semibold capitalize" style={{color:r.status==="online"?COLORS.success:r.status==="busy"?COLORS.warning:"#94a3b8"}}>
                  <span className="w-2 h-2 rounded-full" style={{backgroundColor:r.status==="online"?COLORS.success:r.status==="busy"?COLORS.warning:"#94a3b8"}} />
                  {r.status}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center mb-3">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <div className="text-xs text-slate-400">Deliveries</div>
                  <div className="font-bold text-slate-800 text-sm">{r.deliv}</div>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                  <div className="text-xs text-slate-400">Earnings</div>
                  <div className="font-bold" style={{color:ORANGE,fontSize:13}}>{fmt(r.earn)}</div>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                  <div className="text-xs text-slate-400">Rating</div>
                  <div className="font-bold text-slate-800 text-sm">{r.rating}</div>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span style={{color:"#94a3b8"}}>Zone: <span className="font-semibold text-slate-600">{r.zone}</span></span>
                <span style={{color:"#94a3b8"}}>Vehicle: <span className="font-semibold text-slate-600 capitalize">{r.vehicle}</span></span>
              </div>
              {r.order&&<div className="mt-2 pt-2 border-t border-slate-100 text-xs flex items-center gap-1" style={{color:ORANGE}}><Truck size={11} /> Active: {r.order}</div>}
            </GlassCard>
          ))}
        </div>
      )}

      <Modal open={!!selected} onClose={()=>setSelected(null)} wide>
        {selected&&(
          <div className="space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Avatar name={selected.name} size={56} />
                <div>
                  <h3 style={{fontSize:20,fontWeight:700,color:"#0f172a",fontFamily:"'Outfit', sans-serif"}}>{selected.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span style={{fontSize:13,color:"#64748b"}}>{selected.phone}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <span className="capitalize text-xs font-semibold" style={{color:selected.status==="online"?COLORS.success:selected.status==="busy"?COLORS.warning:"#94a3b8"}}>● {selected.status}</span>
                  </div>
                </div>
              </div>
              <button onClick={()=>setSelected(null)} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 transition-all"><X size={17} /></button>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {[
                {l:"Deliveries Today",v:selected.deliv,c:COLORS.info},
                {l:"Earnings Today",v:fmt(selected.earn),c:ORANGE},
                {l:"Rating",v:`${selected.rating} ★`,c:"#f59e0b"},
                {l:"Completion",v:`${selected.completed}%`,c:selected.completed>=90?COLORS.success:COLORS.warning},
              ].map(s => (
                <div key={s.l} className="p-3 bg-slate-50 rounded-xl text-center">
                  <div className="text-xs text-slate-400 mb-1">{s.l}</div>
                  <div className="font-bold" style={{color:s.c,fontSize:18}}>{s.v}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                {l:"Vehicle",v:selected.vehicle,icon:Truck},
                {l:"Zone",v:selected.zone,icon:Navigation},
                {l:"Member Since",v:selected.joined,icon:Clock},
                {l:"Total Orders",v:selected.totalOrders,icon:ShoppingBag},
              ].map(s => {
                const Ic = s.icon;
                return <div key={s.l} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{backgroundColor:`${COLORS.primary}15`}}><Ic size={16} style={{color:COLORS.primary}} /></div>
                  <div>
                    <div className="text-xs text-slate-400">{s.l}</div>
                    <div className="font-semibold text-slate-800 capitalize">{s.v}</div>
                  </div>
                </div>;
              })}
            </div>

            <div>
              <SectionHeader title="This Week's Earnings" />
              <ResponsiveContainer width="100%" height={140}>
                <AreaChart data={selectedEarningsChart}>
                  <defs><linearGradient id="earnGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={ORANGE} stopOpacity={0.3} /><stop offset="100%" stopColor={ORANGE} stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="d" tick={{fontSize:10,fill:"#94a3b8"}} axisLine={false} tickLine={false} />
                  <YAxis hide domain={[0,"dataMax+50"]} />
                  <Tooltip formatter={v=>[fmt(v),"Earnings"]} />
                  <Area type="monotone" dataKey="earn" stroke={ORANGE} strokeWidth={2} fill="url(#earnGrad)" dot={{fill:ORANGE,stroke:"white",strokeWidth:2,r:3}} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <SectionHeader title="Wallet & Account" />
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1 p-3 bg-orange-50 rounded-xl">
                  <div className="text-xs text-slate-500 mb-1">Wallet Balance</div>
                  <div className="font-bold" style={{color:ORANGE,fontSize:20}}>{fmt(selected.earn)}</div>
                  <div className="text-[10px] text-slate-400 mt-1">From riders/{selected.id}/todayEarnings</div>
                </div>
                <div className="col-span-2 p-3 bg-slate-50 rounded-xl">
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Settle Amount (₹)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 500"
                      value={settleAmount}
                      onChange={e => setSettleAmount(e.target.value)}
                      style={{flex:1, padding:"9px 12px", borderRadius:8, border:"1.5px solid #e2e8f0", fontSize:13, outline:"none"}}
                    />
                    <BtnPrimary onClick={handleSettleWallet} disabled={settleBusy || !settleAmount}>
                      {settleBusy ? "Settling..." : "Settle"}
                    </BtnPrimary>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-2">Subtracts from rider's <code>todayEarnings</code> and writes to <code>settlements</code></div>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <BtnSecondary onClick={() => { setShowReset(true); setResetError(""); setResetForm({ currentPassword: "", newPassword: "" }); }}>
                  <Lock size={13} style={{marginRight:4}} />Reset Password
                </BtnSecondary>
                <button
                  onClick={handleDeleteRider}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white"
                  style={{background:"#ef4444", border:"none", cursor:"pointer"}}
                >
                  <Trash2 size={13} />Delete Rider
                </button>
              </div>
              {!selected.email && (
                <div className="text-[11px] text-slate-400 mt-2">⚠️ This rider has no email on file — password reset is unavailable. To set one, edit <code>riders/{selected.id}/email</code> directly in Firebase.</div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Add Rider Modal */}
      <Modal open={showAdd} onClose={() => !addBusy && setShowAdd(false)}>
        <form onSubmit={handleAddRider}>
          <div className="flex items-center justify-between mb-4">
            <h3 style={{fontSize:18, fontWeight:700, color:"#0f172a", fontFamily:"'Outfit', sans-serif"}}>Add New Rider</h3>
            <button type="button" onClick={() => !addBusy && setShowAdd(false)} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400"><X size={17} /></button>
          </div>
          <div className="text-xs text-slate-500 mb-3">Creates a Firebase Auth account and a <code>riders/&#123;uid&#125;</code> profile. You will be re-prompted for your password before the account is created.</div>
          {addError && <div role="alert" style={{padding:"8px 12px", borderRadius:8, marginBottom:12, background:"#fef2f2", color:"#b91c1c", fontSize:12, fontWeight:500}}>{addError}</div>}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Full Name *</label>
              <input value={addForm.name} onChange={e => setAddForm(p => ({...p, name:e.target.value}))} placeholder="e.g. Rahul Kumar" required style={{width:"100%", padding:"9px 12px", borderRadius:8, border:"1.5px solid #e2e8f0", fontSize:13, outline:"none"}} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Email *</label>
                <input type="email" value={addForm.email} onChange={e => setAddForm(p => ({...p, email:e.target.value}))} placeholder="rider@example.com" required style={{width:"100%", padding:"9px 12px", borderRadius:8, border:"1.5px solid #e2e8f0", fontSize:13, outline:"none"}} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Phone *</label>
                <input value={addForm.phone} onChange={e => setAddForm(p => ({...p, phone:e.target.value}))} placeholder="10-digit mobile" required style={{width:"100%", padding:"9px 12px", borderRadius:8, border:"1.5px solid #e2e8f0", fontSize:13, outline:"none"}} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Vehicle</label>
                <select value={addForm.vehicle} onChange={e => setAddForm(p => ({...p, vehicle:e.target.value}))} style={{width:"100%", padding:"9px 12px", borderRadius:8, border:"1.5px solid #e2e8f0", fontSize:13, outline:"none", background:"white"}}>
                  <option value="bike">Bike</option>
                  <option value="scooter">Scooter</option>
                  <option value="bicycle">Bicycle</option>
                  <option value="car">Car</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Zone</label>
                <input value={addForm.zone} onChange={e => setAddForm(p => ({...p, zone:e.target.value}))} placeholder="e.g. Central" style={{width:"100%", padding:"9px 12px", borderRadius:8, border:"1.5px solid #e2e8f0", fontSize:13, outline:"none"}} />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Initial Password * (min 6 chars)</label>
              <input type="password" value={addForm.password} onChange={e => setAddForm(p => ({...p, password:e.target.value}))} placeholder="Rider sets this on first login" required minLength={6} style={{width:"100%", padding:"9px 12px", borderRadius:8, border:"1.5px solid #e2e8f0", fontSize:13, outline:"none"}} />
            </div>
          </div>
          <div className="flex gap-2 mt-5">
            <BtnSecondary type="button" onClick={() => setShowAdd(false)} disabled={addBusy} style={{flex:1}}>Cancel</BtnSecondary>
            <BtnPrimary type="submit" disabled={addBusy} style={{flex:1}}>{addBusy ? "Creating..." : "Create Rider"}</BtnPrimary>
          </div>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal open={showReset} onClose={() => !resetBusy && setShowReset(false)}>
        <form onSubmit={handleResetPassword}>
          <div className="flex items-center justify-between mb-4">
            <h3 style={{fontSize:18, fontWeight:700, color:"#0f172a", fontFamily:"'Outfit', sans-serif"}}>Reset Rider Password</h3>
            <button type="button" onClick={() => !resetBusy && setShowReset(false)} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400"><X size={17} /></button>
          </div>
          <div className="text-xs text-slate-500 mb-3">Rider: <strong>{selected?.name}</strong> ({selected?.email})</div>
          {resetError && <div role="alert" style={{padding:"8px 12px", borderRadius:8, marginBottom:12, background:"#fef2f2", color:"#b91c1c", fontSize:12, fontWeight:500}}>{resetError}</div>}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Rider's Current Password *</label>
              <input type="password" value={resetForm.currentPassword} onChange={e => setResetForm(p => ({...p, currentPassword:e.target.value}))} required autoComplete="off" style={{width:"100%", padding:"9px 12px", borderRadius:8, border:"1.5px solid #e2e8f0", fontSize:13, outline:"none"}} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">New Password * (min 6 chars)</label>
              <input type="password" value={resetForm.newPassword} onChange={e => setResetForm(p => ({...p, newPassword:e.target.value}))} required minLength={6} autoComplete="new-password" style={{width:"100%", padding:"9px 12px", borderRadius:8, border:"1.5px solid #e2e8f0", fontSize:13, outline:"none"}} />
            </div>
          </div>
          <div className="flex gap-2 mt-5">
            <BtnSecondary type="button" onClick={() => setShowReset(false)} disabled={resetBusy} style={{flex:1}}>Cancel</BtnSecondary>
            <BtnPrimary type="submit" disabled={resetBusy} style={{flex:1}}>{resetBusy ? "Resetting..." : "Reset Password"}</BtnPrimary>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PARTNERS PAGE
// ═══════════════════════════════════════════════════════════════════════════
function PartnersPage({ showToast }) {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", type: "Raw Materials", contact: "" });

  useEffect(() => {
    const unsub = onValue(PARTNERS_REF, snap => {
      const v = snap.val() || {};
      setPartners(Object.keys(v).map(k => ({ id: k, ...v[k] })));
      setLoading(false);
    }, () => setLoading(false));
    return () => off(PARTNERS_REF, "value", unsub);
  }, []);

  const updatePartnerStatus = async (id, status) => {
    try {
      await update(ref(db, `system/partners/${id}`), { status });
      logAudit(_bizId, _outletId, "update_partner_status", { partnerId: id, status }, getCurrentAdminActor());
      showToast(`Partner ${status}`,"success");
    }
    catch(e) { showToast("Update failed","error"); }
  };
  const removePartner = async (id) => {
    if (!confirm("Delete this partner?")) return;
    try {
      await remove(ref(db, `system/partners/${id}`));
      logAudit(_bizId, _outletId, "delete_partner", { partnerId: id }, getCurrentAdminActor());
      showToast("Deleted","success");
    }
    catch(e) { showToast("Delete failed","error"); }
  };
  const save = async () => {
    if (!form.name.trim() || !form.contact.trim()) return showToast("Name and contact required","warning");
    try {
      const newRef = await push(ref(db, "system/partners"), { name: form.name.trim(), type: form.type, contact: form.contact.trim(), since: new Date().toISOString().slice(0,10), status: "pending", createdAt: serverTimestamp() });
      logAudit(_bizId, _outletId, "create_partner", { partnerId: newRef?.key || null, name: form.name.trim() }, getCurrentAdminActor());
      setForm({ name:"", type:"Raw Materials", contact:"" }); setShowForm(false); showToast("Partner added","success");
    }
    catch(e) { showToast("Save failed","error"); }
  };

  const statusStyle = {
    pending:  { color:"#f59e0b", bg:"#fef3c7" },
    approved: { color:"#22c55e", bg:"#dcfce7" },
    rejected: { color:"#ef4444", bg:"#fee2e2" },
  };
  const exportPartners = useCallback(() => {
    downloadCSV(`partners-${new Date().toISOString().slice(0,10)}.csv`, partners.map((p, index) => ({
      row: index + 1, name: p.name, type: p.type, since: p.since, contact: p.contact, status: p.status,
    })));
    showToast("Partners exported", "success");
  }, [partners, showToast]);

  if (loading) return <SkeletonPage table={6} />;

  return (
    <div className="space-y-4">
      <div className="sheet-toolbar">
        <div style={{ fontSize:12, color:"#94a3b8" }}>Path: <code>system/partners</code></div>
        <div className="flex gap-2">
          <BtnSecondary onClick={() => setShowForm(true)}><Plus size={13} /> Add</BtnSecondary>
          <button type="button" className="sheet-button" onClick={exportPartners}><Download size={14} /> Export CSV</button>
        </div>
      </div>
      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: 520 }}>
            <thead>
              <tr className="border-b border-slate-100">
                {["Partner","Type","Since","Contact","Status","Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {partners.length === 0 && <tr><td colSpan={6} style={{ textAlign:"center", padding:32, color:"#94a3b8" }}>No partners yet — click "Add" to create one.</td></tr>}
              {partners.map(p => {
                const st = statusStyle[p.status] || statusStyle.pending;
                return (
                  <tr key={p.id} className="border-b border-slate-50 hover:bg-orange-50/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={p.name} size={32} />
                        <span className="font-semibold text-slate-800">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{p.type}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{p.since || "—"}</td>
                    <td className="px-4 py-3 text-slate-500">{p.contact}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-full text-xs font-bold capitalize"
                        style={{ color: st.color, backgroundColor: st.bg }}>{p.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 items-center">
                        {p.status === "pending" && (
                          <>
                            <button onClick={() => updatePartnerStatus(p.id,"approved")} className="px-3 py-1 rounded-lg text-xs font-bold text-white" style={{ backgroundColor: COLORS.success }}>Approve</button>
                            <button onClick={() => updatePartnerStatus(p.id,"rejected")} className="px-3 py-1 rounded-lg text-xs font-bold text-white" style={{ backgroundColor: COLORS.error }}>Reject</button>
                          </>
                        )}
                        <button onClick={() => removePartner(p.id)} className="p-1 rounded-lg text-slate-400 hover:text-red-500" title="Delete"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>
      <Modal open={showForm} onClose={() => setShowForm(false)}>
        <h3 style={{ fontSize:16, fontWeight:700, color:"#0f172a", marginBottom:16 }}>Add Partner</h3>
        <div className="flex flex-col gap-3">
          <Input placeholder="Partner name" value={form.name} onChange={e => setForm({...form, name:e.target.value})} />
          <Select value={form.type} onChange={e => setForm({...form, type:e.target.value})}>
            <option>Raw Materials</option><option>Vegetables</option><option>Spices</option><option>Dairy</option><option>Beverages</option><option>Packaging</option><option>Other</option>
          </Select>
          <Input placeholder="Contact phone" value={form.contact} onChange={e => setForm({...form, contact:e.target.value})} />
          <BtnPrimary onClick={save} style={{ width:"100%" }}>Save Partner</BtnPrimary>
        </div>
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ANALYTICS PAGE
// ═══════════════════════════════════════════════════════════════════════════
function AnalyticsPage() {
  const [period, setPeriod] = useState("week");
  const [orders, setOrders] = useState([]);
  const [riders, setRiders] = useState([]);
  const [dishes, setDishes] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const oref = Outlet("orders");
    const rref = ref(db, "riders");
    const dref = Outlet("dishes");
    if (!oref || !dref) { setLoading(false); return; }
    const u1 = onValue(oref, snap => { setOrders(snap.val() ? Object.keys(snap.val()).map(k => ({ id: k, ...snap.val()[k] })) : []); setLoading(false); });
    const u2 = onValue(rref, snap => { const v = snap.val() || {}; setRiders(Object.keys(v).map(k => normalizeRider({ id: k, ...v[k] }))); });
    const u3 = onValue(dref, snap => setDishes(snap.val() || {}));
    return () => { off(oref,"value",u1); off(rref,"value",u2); off(dref,"value",u3); };
  }, []);

  const days = period === "week" ? 7 : period === "month" ? 30 : 90;
  const weekData = useMemo(() => aggregateByDay(orders, days), [orders, days]);
  const hourlyData = useMemo(() => aggregateByHour(orders), [orders]);
  const catData = useMemo(() => aggregateByCategory(orders, dishes), [orders, dishes]);
  const topDishes = useMemo(() => aggregateByDish(orders, 8), [orders]);
  const topCustomers = useMemo(() => aggregateByCustomer(orders, 6), [orders]);
  const totalRev = weekData.reduce((s, d) => s + d.rev, 0);
  const totalOrd = weekData.reduce((s, d) => s + d.ord, 0);
  const prevRev = weekData.reduce((s, d) => s + d.prevRev, 0);
  const prevOrd = weekData.reduce((s, d) => s + d.prevOrd, 0);
  const revTrend = prevRev > 0 ? ((totalRev - prevRev) / prevRev * 100).toFixed(1) : (totalRev > 0 ? "100.0" : "0.0");
  const ordTrend = prevOrd > 0 ? ((totalOrd - prevOrd) / prevOrd * 100).toFixed(1) : (totalOrd > 0 ? "100.0" : "0.0");
  const avgValue = totalOrd > 0 ? Math.round(totalRev / totalOrd) : 0;
  const prevAvg = prevOrd > 0 ? Math.round(prevRev / prevOrd) : 0;
  const avgTrend = prevAvg > 0 ? ((avgValue - prevAvg) / prevAvg * 100).toFixed(1) : (avgValue > 0 ? "100.0" : "0.0");
  const bestDay = weekData.reduce((b, d) => d.rev > b.rev ? d : b, weekData[0] || { d: "—", rev: 0, ord: 0 });
  const cancelledCount = orders.filter(o => String(o.status).toLowerCase() === "cancelled" || String(o.status).toLowerCase() === "canceled").length;
  const cancelRate = orders.length > 0 ? ((cancelledCount / orders.length) * 100).toFixed(1) : "0.0";
  const rangeLabel = useMemo(() => {
    const end = new Date();
    const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
    const fmtD = d => d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    return `${fmtD(start)} — ${fmtD(end)}, ${end.getFullYear()}`;
  }, [days]);
  const exportCSV = () => downloadCSV(`analytics-${period}-${new Date().toISOString().slice(0,10)}.csv`, weekData.map(d => ({ day: d.d, revenue: d.rev, orders: d.ord, prevRevenue: d.prevRev })));
  const topRiders = useMemo(() => [...riders].sort((a,b) => b.deliv - a.deliv).slice(0, 6), [riders]);
  const maxDeliv = Math.max(1, ...riders.map(r => r.deliv));

  if (loading) return <SkeletonPage kpi={5} />;

  return (
    <div className="space-y-5">
      <GlassCard className="p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 style={{fontSize:18,fontWeight:700,color:"#0f172a",fontFamily:"'Outfit', sans-serif"}}>Analytics</h2>
          <div className="flex gap-1.5">
            {["week","month","quarter"].map(p => (
              <Pill key={p} label={p.charAt(0).toUpperCase()+p.slice(1)} active={period===p} onClick={() => setPeriod(p)} />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span style={{fontSize:12,color:"#94a3b8"}}>{rangeLabel}</span>
          <BtnSecondary onClick={exportCSV}><Download size={13} style={{marginRight:5}} />Export</BtnSecondary>
        </div>
      </GlassCard>

      <div className="grid gap-4" style={{gridTemplateColumns:"repeat(auto-fill, minmax(180px, 1fr))"}}>
        <KPICard title="Revenue" value={fmt(totalRev)} icon={TrendingUp} color={COLORS.success}
          sub={<span style={{color:Number(revTrend)>=0?COLORS.success:COLORS.error,fontWeight:600}}>{Number(revTrend)>=0?"▲":"▼"} {Math.abs(Number(revTrend))}% vs prev</span>} />
        <KPICard title="Orders" value={totalOrd} icon={ShoppingBag} color={COLORS.info}
          sub={<span style={{color:Number(ordTrend)>=0?COLORS.success:COLORS.error,fontWeight:600}}>{Number(ordTrend)>=0?"▲":"▼"} {Math.abs(Number(ordTrend))}% vs prev</span>} />
        <KPICard title="Avg. Order Value" value={fmt(avgValue)} icon={DollarSign} color={COLORS.warning}
          sub={<span style={{color:Number(avgTrend)>=0?COLORS.success:COLORS.error,fontWeight:600}}>{Number(avgTrend)>=0?"▲":"▼"} {Math.abs(Number(avgTrend))}% vs prev</span>} />
        <KPICard title="Best Day" value={bestDay.d} icon={Star} color={ORANGE}
          sub={<span style={{color:"#64748b"}}>{fmt(bestDay.rev)} • {bestDay.ord} orders</span>} />
        <KPICard title="Cancellation Rate" value={`${cancelRate}%`} icon={XCircle} color={COLORS.error}
          sub={<span style={{color:"#64748b"}}>{cancelledCount} of {orders.length} orders</span>} />
      </div>

      <div className="grid gap-4" style={{gridTemplateColumns:"1.6fr 1fr"}}>
        <GlassCard className="p-5">
          <SectionHeader title="Revenue & Orders" />
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={weekData.map(d => ({ d: d.d, rev: d.rev, ord: d.ord, prevRev: d.prevRev }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="d" tick={{fontSize:11,fill:"#94a3b8"}} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{fontSize:11,fill:"#94a3b8"}} axisLine={false} tickLine={false} tickFormatter={v => `₹${v/1000}k`} width={50} />
              <YAxis yAxisId="right" orientation="right" tick={{fontSize:11,fill:"#94a3b8"}} axisLine={false} tickLine={false} width={35} />
              <Tooltip formatter={(v,n) => [n==="rev"?fmt(v):n==="ord"?v:fmt(v), n==="rev"?"Revenue":n==="ord"?"Orders":"Prev Revenue"]} />
              <Bar yAxisId="left" dataKey="rev" fill={ORANGE} radius={[4,4,0,0]} maxBarSize={32} />
              <Bar yAxisId="right" dataKey="ord" fill="#3b82f6" radius={[4,4,0,0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard className="p-5">
          <SectionHeader title="vs Previous Period" />
          <div className="flex items-center justify-center" style={{height:200}}>
            <div className="grid grid-cols-2 gap-8 text-center">
              <div>
                <div style={{fontSize:11,color:"#94a3b8",fontWeight:600,textTransform:"uppercase",marginBottom:4}}>Revenue</div>
                <div style={{fontSize:24,fontWeight:800,color:"#0f172a",fontFamily:"'Outfit', sans-serif"}}>{fmt(totalRev)}</div>
                <div style={{fontSize:13,fontWeight:600,marginTop:4,color:Number(revTrend)>=0?COLORS.success:COLORS.error}}>{Number(revTrend)>=0?"↑":"↓"} {Math.abs(Number(revTrend))}%</div>
                <div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>prev: {fmt(prevRev)}</div>
              </div>
              <div>
                <div style={{fontSize:11,color:"#94a3b8",fontWeight:600,textTransform:"uppercase",marginBottom:4}}>Orders</div>
                <div style={{fontSize:24,fontWeight:800,color:"#0f172a",fontFamily:"'Outfit', sans-serif"}}>{totalOrd}</div>
                <div style={{fontSize:13,fontWeight:600,marginTop:4,color:Number(ordTrend)>=0?COLORS.success:COLORS.error}}>{Number(ordTrend)>=0?"↑":"↓"} {Math.abs(Number(ordTrend))}%</div>
                <div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>prev: {prevOrd}</div>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="grid gap-4" style={{gridTemplateColumns:"1fr 1fr"}}>
        <GlassCard className="p-5">
          <SectionHeader title="Sales by Category" />
          {catData.length === 0 ? <div style={{textAlign:"center", padding:40, color:"#94a3b8", fontSize:13}}>No sales data yet</div> : (
            <div className="flex flex-col lg:flex-row items-center gap-4">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={catData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                    {catData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={v => [`${v}%`, "Share"]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2.5" style={{minWidth:176}}>
                {catData.slice(0,6).map((c,i) => (
                  <div key={c.name} className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{backgroundColor:PIE_COLORS[i]}} />
                    <span className="text-sm text-slate-700 flex-1">{c.name}</span>
                    <span className="text-sm font-bold text-slate-800">{c.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </GlassCard>

        <GlassCard className="p-5">
          <SectionHeader title="Orders by Hour" />
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="h" tick={{fontSize:10,fill:"#94a3b8"}} axisLine={false} tickLine={false} interval={1} />
              <YAxis hide />
              <Tooltip formatter={v => [v, "Orders"]} />
              <Area type="monotone" dataKey="ord" stroke={ORANGE} fill={`${ORANGE}20`} strokeWidth={2} dot={{fill:ORANGE,stroke:"white",strokeWidth:2,r:3}} />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      <GlassCard className="p-5">
        <SectionHeader title="Rider Performance" />
        {topRiders.length === 0 ? <div style={{textAlign:"center", padding:30, color:"#94a3b8", fontSize:13}}>No riders registered yet</div> : (
          <div className="space-y-4">
            {topRiders.map(r => (
              <div key={r.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Avatar name={r.name} size={28} />
                    <div>
                      <span className="text-sm font-semibold text-slate-800">{r.name}</span>
                      <span style={{fontSize:11,color:"#94a3b8",marginLeft:6}} className="capitalize">{r.vehicle}</span>
                      <span className="ml-2 text-xs font-semibold capitalize" style={{color:r.status==="online"?COLORS.success:r.status==="busy"?COLORS.warning:"#94a3b8"}}>● {r.status}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold text-slate-700">{r.deliv} deliveries</span>
                    <span className="text-sm font-bold" style={{color:ORANGE}}>{fmt(r.earn)}</span>
                    {r.rating > 0 ? <StarRating rating={r.rating} /> : <span className="text-xs text-slate-400">—</span>}
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="h-2 rounded-full transition-all" style={{width:`${(r.deliv/maxDeliv)*100}%`,backgroundColor:ORANGE}} />
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      <div className="grid gap-4" style={{gridTemplateColumns:"1fr 1fr"}}>
        <GlassCard className="p-5">
          <SectionHeader title="Top Dishes (by quantity sold)" />
          {topDishes.length === 0 ? <div style={{textAlign:"center", padding:30, color:"#94a3b8", fontSize:13}}>No sales data yet</div> : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={topDishes} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{fontSize:11,fill:"#94a3b8"}} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{fontSize:11,fill:"#475569"}} axisLine={false} tickLine={false} width={120} />
                <Tooltip formatter={(v, n) => [n === "qty" ? `${v} sold` : fmt(v), n === "qty" ? "Quantity" : "Revenue"]} />
                <Bar dataKey="qty" fill={ORANGE} radius={[0, 4, 4, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </GlassCard>

        <GlassCard className="p-5">
          <SectionHeader title="Top Customers" />
          {topCustomers.length === 0 ? <div style={{textAlign:"center", padding:30, color:"#94a3b8", fontSize:13}}>No customer data yet</div> : (
            <div className="space-y-3">
              {topCustomers.map((c, idx) => (
                <div key={c.uid} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center" style={{backgroundColor:`${PIE_COLORS[idx % PIE_COLORS.length]}20`, color:PIE_COLORS[idx % PIE_COLORS.length], fontWeight:700, fontSize:12}}>{idx + 1}</div>
                  <Avatar name={c.name} size={32} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-800 truncate">{c.name}</div>
                    <div style={{fontSize:11,color:"#94a3b8"}}>{c.orders} orders{c.phone ? ` • ${c.phone}` : ""}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold" style={{color:ORANGE}}>{fmt(c.revenue)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LOST SALES PAGE
// ═══════════════════════════════════════════════════════════════════════════
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
function SettlementsPage({ showToast }) {
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initOpen, setInitOpen] = useState(false);
  const [initForm, setInitForm] = useState({ amount:"", type:"settlement", method:"Bank Transfer", notes:"" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const r = Outlet("settlements");
    if (!r) { setLoading(false); return; }
    const unsub = onValue(r, snap => {
      const v = snap.val() || {};
      setTxns(Object.keys(v).map(k => ({ id: k, ...v[k] })).sort((a,b) => (b.settledAt||b.createdAt||0) - (a.settledAt||a.createdAt||0)));
      setLoading(false);
    }, () => setLoading(false));
    return () => off(r, "value", unsub);
  }, []);

  const total = txns.reduce((s,t) => s + (Number(t.amount) || 0), 0);
  const credits = txns.filter(t => Number(t.amount) > 0).reduce((s,t) => s + Number(t.amount), 0);
  const debits = txns.filter(t => Number(t.amount) < 0).reduce((s,t) => s + Math.abs(Number(t.amount)), 0);

  const exportCSV = useCallback(() => {
    downloadCSV(`settlements-${new Date().toISOString().slice(0,10)}.csv`, txns.map((t,i) => ({
      row: i + 1, id: t.id, date: t.date || (t.settledAt ? new Date(t.settledAt).toLocaleDateString() : ""), type: t.type || "settlement", amount: t.amount, method: t.method || "", status: t.status || "settled",
    })));
  }, [txns]);

  const handleInitiate = useCallback(async () => {
    const amount = Number(initForm.amount);
    if (!amount || amount <= 0) return showToast("Enter a valid amount", "warning");
    setSaving(true);
    try {
      const id = `stl_${Date.now().toString(36)}`;
      await set(Outlet(`settlements/${id}`), {
        amount: initForm.type === "debit" ? -amount : amount,
        type: initForm.type === "debit" ? "debit" : "credit",
        method: initForm.method || "Bank Transfer",
        notes: initForm.notes?.trim() || "",
        status: "pending",
        createdBy: getCurrentAdminActor()?.uid || "admin",
        createdAt: Date.now(),
        settledAt: Date.now(),
        date: new Date().toLocaleDateString("en-IN"),
      });
      logAudit(_bizId, _outletId, "settlement_initiated", { settlementId: id, amount, type: initForm.type }, getCurrentAdminActor());
      showToast("Settlement initiated", "success");
      setInitOpen(false);
      setInitForm({ amount:"", type:"settlement", method:"Bank Transfer", notes:"" });
    } catch(e) { showToast("Failed: " + (e?.message || "unknown"), "error"); }
    finally { setSaving(false); }
  }, [initForm, showToast]);

  const updateStatus = useCallback(async (id, status) => {
    try {
      await update(Outlet(`settlements/${id}`), { status, updatedAt: Date.now() });
      logAudit(_bizId, _outletId, "settlement_status_update", { settlementId: id, status }, getCurrentAdminActor());
      showToast(`Status: ${status}`, "success");
    } catch(e) { showToast("Update failed", "error"); }
  }, [showToast]);

  if (loading) return <SkeletonPage kpi={3} table={6} />;

  return (
    <div className="space-y-4">
      <div className="sheet-toolbar">
        <div style={{ fontSize:12, color:"#94a3b8" }}>Path: <code>businesses/.../settlements</code></div>
        <div className="flex gap-2">
          <BtnPrimary onClick={() => setInitOpen(true)} style={{ padding:"8px 14px", fontSize:13 }}><Plus size={14} /> Initiate Settlement</BtnPrimary>
          <button type="button" className="sheet-button" onClick={exportCSV}><Download size={14} /> Export CSV</button>
        </div>
      </div>
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
        <KPICard title="Net Balance" value={fmt(total)} icon={Wallet} color={total >= 0 ? COLORS.success : COLORS.error} />
        <KPICard title="Total Credits" value={fmt(credits)} icon={ArrowUp} color={COLORS.success} />
        <KPICard title="Total Debits" value={fmt(debits)} icon={ArrowDown} color={COLORS.error} />
      </div>
      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: 600 }}>
            <thead>
              <tr className="border-b border-slate-100">
                {["ID","Date","Type","Amount","Method","Status","Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {txns.length === 0 && <tr><td colSpan={7} style={{ textAlign:"center", padding:32, color:"#94a3b8" }}>No settlements recorded yet<br/><span style={{ fontSize:11 }}>Path: <code>businesses/.../settlements</code></span></td></tr>}
              {txns.map(t => (
                <tr key={t.id} className="border-b border-slate-50 hover:bg-orange-50/20">
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">{t.id.slice(-8)}</td>
                  <td className="px-4 py-3 text-slate-500">{t.date || (t.settledAt ? new Date(t.settledAt).toLocaleDateString("en-IN") : "—")}</td>
                  <td className="px-4 py-3 text-slate-700">{t.type || "Settlement"}</td>
                  <td className="px-4 py-3 font-bold" style={{ color: Number(t.amount) > 0 ? COLORS.success : COLORS.error }}>
                    {Number(t.amount) > 0 ? "+" : ""}{fmt(Math.abs(Number(t.amount) || 0))}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{t.method || "—"}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-full text-xs font-bold capitalize"
                      style={{ color: t.status==="reconciled" ? COLORS.success : t.status==="pending" ? COLORS.warning : "#16a34a", backgroundColor: t.status==="reconciled" ? "#dcfce7" : t.status==="pending" ? "#fef3c7" : "#dcfce7" }}>
                      {t.status || "settled"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {(!t.status || t.status === "pending" || t.status === "settled") && (
                      <button onClick={() => updateStatus(t.id, "reconciled")} style={{ padding:"3px 8px", borderRadius:6, border:"1px solid #dcfce7", background:"#f0fdf4", color:"#16a34a", fontSize:10, fontWeight:600, cursor:"pointer" }}><CheckCircle size={11} style={{marginRight:3}} />Reconcile</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <Modal open={initOpen} onClose={() => setInitOpen(false)}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0, fontFamily: "'Outfit', sans-serif" }}>Initiate Settlement</h3>
          <button type="button" onClick={() => setInitOpen(false)} style={{ width:36, height:36, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", border:"1px solid rgba(232, 73, 8,0.12)", background:"white", color:"#64748b", cursor:"pointer" }}><X size={18} /></button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <label style={_discLabelStyle}>Type</label>
            <Select value={initForm.type} onChange={e => setInitForm(f => ({...f, type: e.target.value}))}>
              <option value="settlement">Credit (incoming)</option>
              <option value="debit">Debit (outgoing)</option>
            </Select>
          </div>
          <div>
            <label style={_discLabelStyle}>Amount (₹) *</label>
            <Input type="number" placeholder="e.g. 5000" value={initForm.amount} onChange={e => setInitForm(f => ({...f, amount: e.target.value}))} />
          </div>
          <div>
            <label style={_discLabelStyle}>Method</label>
            <Select value={initForm.method} onChange={e => setInitForm(f => ({...f, method: e.target.value}))}>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cash">Cash</option>
              <option value="Cheque">Cheque</option>
              <option value="UPI">UPI</option>
              <option value="Card">Card</option>
            </Select>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={_discLabelStyle}>Notes</label>
            <Input placeholder="Optional notes" value={initForm.notes} onChange={e => setInitForm(f => ({...f, notes: e.target.value}))} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(0,0,0,0.06)" }}>
          <BtnSecondary onClick={() => setInitOpen(false)} style={{ padding:"8px 18px", fontSize:13 }}>Cancel</BtnSecondary>
          <BtnPrimary onClick={handleInitiate} disabled={saving} style={{ padding:"8px 18px", fontSize:13 }}>{saving ? "Initiating..." : "Initiate Settlement"}</BtnPrimary>
        </div>
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// FEEDBACK PAGE
// ═══════════════════════════════════════════════════════════════════════════
function FeedbackPage({ showToast }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const REVIEW_PAGE_SIZE = 20;
  const [reviewPage, setReviewPage] = useState(1);
  const [replyFor, setReplyFor] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [modTab, setModTab] = useState("all");

  useEffect(() => {
    const r = Outlet("reviews");
    if (!r) { setLoading(false); return; }
    const unsub = onValue(r, snap => {
      const v = snap.val() || {};
      setReviews(Object.keys(v).map(k => ({ id: k, ...v[k] })).sort((a,b) => (b.createdAt||0) - (a.createdAt||0)));
      setLoading(false);
    }, () => setLoading(false));
    return () => off(r, "value", unsub);
  }, []);

  const modFiltered = useMemo(() => {
    if (modTab === "all") return reviews;
    if (modTab === "pending") return reviews.filter(r => !r.status || r.status === "pending");
    return reviews.filter(r => r.status === modTab);
  }, [reviews, modTab]);

  useEffect(() => { setReviewPage(1); }, [modFiltered.length]);
  const totalPages = Math.max(1, Math.ceil(modFiltered.length / REVIEW_PAGE_SIZE));
  const paginatedReviews = modFiltered.slice((reviewPage - 1) * REVIEW_PAGE_SIZE, reviewPage * REVIEW_PAGE_SIZE);

  const modAction = useCallback(async (id, status) => {
    try {
      await update(Outlet(`reviews/${id}`), { status, moderatedAt: Date.now() });
      showToast(status === "approved" ? "Review approved" : status === "hidden" ? "Review hidden" : "Status updated", "success");
    } catch(e) { showToast("Action failed", "error"); }
  }, [showToast]);

  if (loading) return <SkeletonPage cards={6} />;

  const counts = [5,4,3,2,1].map(n => reviews.filter(r => Math.round(Number(r.rating)||0) === n).length);
  const total = reviews.length;
  const avg = total > 0 ? (reviews.reduce((s, r) => s + (Number(r.rating)||0), 0) / total) : 0;
  const pcts = counts.map(c => total ? Math.round((c / total) * 100) : 0);
  const pendingCount = reviews.filter(r => !r.status || r.status === "pending").length;

  return (
    <div className="space-y-4">
      <div style={{ fontSize:11, color:"#94a3b8" }}>Path: <code>businesses/.../reviews</code></div>
      <GlassCard className="p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="text-center">
            <div className="text-5xl font-black text-slate-800" style={{ fontFamily:"'Outfit', sans-serif" }}>{avg ? avg.toFixed(1) : "—"}</div>
            {avg > 0 ? <StarRating rating={avg} /> : <div className="text-xs text-slate-400 mt-1">No ratings yet</div>}
            <div className="text-xs text-slate-500 mt-1">{total} review{total !== 1 ? "s" : ""}</div>
          </div>
          <div className="flex-1 space-y-2 w-full">
            {[5,4,3,2,1].map((n,i) => (
              <div key={n} className="flex items-center gap-2">
                <span className="text-xs text-slate-500 w-4">{n}★</span>
                <div className="flex-1 bg-slate-100 rounded-full h-2">
                  <div className="h-2 rounded-full transition-all" style={{ width:`${pcts[i]}%`, backgroundColor:"#f59e0b" }} />
                </div>
                <span className="text-xs text-slate-400 w-8">{pcts[i]}%</span>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>
      <div className="flex gap-2 flex-wrap">
        <Pill label={`All (${reviews.length})`} active={modTab === "all"} onClick={() => setModTab("all")} />
        <Pill label={`Pending (${pendingCount})`} active={modTab === "pending"} onClick={() => setModTab("pending")} />
        <Pill label={`Approved (${reviews.filter(r => r.status === "approved").length})`} active={modTab === "approved"} onClick={() => setModTab("approved")} />
        <Pill label={`Hidden (${reviews.filter(r => r.status === "hidden").length})`} active={modTab === "hidden"} onClick={() => setModTab("hidden")} />
      </div>
      <div className="space-y-3">
        {modFiltered.length === 0 && <GlassCard className="p-6"><div className="text-center text-slate-400 text-sm">No reviews in this category.</div></GlassCard>}
        {paginatedReviews.map(f => {
          const st = f.status || "pending";
          return (
          <GlassCard key={f.id} className="p-4" style={{ opacity: st === "hidden" ? 0.6 : 1 }}>
            <div className="flex items-start gap-3">
              <Avatar name={f.customerName || f.name || "Guest"} size={36} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
                  <span className="font-semibold text-slate-800">{f.customerName || f.name || "Guest"}</span>
                  <div className="flex items-center gap-2">
                    {st === "pending" && <span className="status-pill" style={{ fontSize:9, fontWeight:700, background:"#fef3c7", color:"#d97706", textTransform:"uppercase" }}>Pending</span>}
                    {st === "approved" && <span className="status-pill" style={{ fontSize:9, fontWeight:700, background:"#dcfce7", color:"#16a34a", textTransform:"uppercase" }}>Approved</span>}
                    {st === "hidden" && <span className="status-pill" style={{ fontSize:9, fontWeight:700, background:"#fee2e2", color:"#dc2626", textTransform:"uppercase" }}>Hidden</span>}
                    <span className="text-xs text-slate-400">{f.createdAt ? relTime(f.createdAt) : ""}</span>
                  </div>
                </div>
                <StarRating rating={Number(f.rating)||0} />
                {f.comment && <p className="text-sm text-slate-600 mt-2 leading-relaxed">{f.comment}</p>}
                {f.dishName && <span className="text-xs mt-2 inline-block px-2 py-0.5 rounded-full" style={{ backgroundColor:"#fff7ed", color:ORANGE }}>re: {f.dishName}</span>}
                {f.reply && <div className="mt-3 pl-3 border-l-2 border-orange-300"><p className="text-xs text-orange-700 font-medium">Your reply:</p><p className="text-sm text-slate-600">{f.reply}</p></div>}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {!f.reply && replyFor !== f.id && (
                    <button onClick={() => { setReplyFor(f.id); setReplyText(""); }} style={{ padding:"3px 10px", borderRadius:6, border:"1px solid #e2e8f0", background:"white", color:ORANGE, fontSize:10, fontWeight:600, cursor:"pointer" }}>Reply</button>
                  )}
                  {st !== "approved" && (
                    <button onClick={() => modAction(f.id, "approved")} style={{ padding:"3px 10px", borderRadius:6, border:"1px solid #dcfce7", background:"#f0fdf4", color:"#16a34a", fontSize:10, fontWeight:600, cursor:"pointer" }}><CheckCircle size={12} style={{marginRight:3}} />Approve</button>
                  )}
                  {st !== "hidden" && (
                    <button onClick={() => modAction(f.id, "hidden")} style={{ padding:"3px 10px", borderRadius:6, border:"1px solid #fee2e2", background:"#fef2f2", color:"#dc2626", fontSize:10, fontWeight:600, cursor:"pointer" }}><EyeOff size={12} style={{marginRight:3}} />Hide</button>
                  )}
                </div>
                {replyFor === f.id && (
                  <div className="mt-3 flex gap-2">
                    <input value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Type your reply..." style={{ flex:1, padding:"6px 10px", borderRadius:6, border:"1px solid #e2e8f0", fontSize:12, outline:"none" }} autoFocus />
                    <button onClick={async () => { if (!replyText.trim()) return; try { await update(Outlet(`reviews/${f.id}`), { reply: replyText.trim(), repliedAt: Date.now() }); setReplyFor(null); showToast("Reply posted","success"); } catch(e) { showToast("Failed","error"); } }} style={{ padding:"6px 12px", borderRadius:6, border:"none", background:ORANGE, color:"white", fontSize:11, fontWeight:600, cursor:"pointer" }}>Send</button>
                    <button onClick={() => setReplyFor(null)} style={{ padding:"6px 8px", borderRadius:6, border:"1px solid #e2e8f0", background:"white", color:"#64748b", fontSize:11, cursor:"pointer" }}>X</button>
                  </div>
                )}
              </div>
            </div>
          </GlassCard>
          );
        })}
        <Pagination page={reviewPage} totalPages={totalPages} onPageChange={setReviewPage} totalItems={modFiltered.length} pageSize={REVIEW_PAGE_SIZE} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DISCOUNTS PAGE
// ═══════════════════════════════════════════════════════════════════════════
const _discLabelStyle = { display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 };

function DiscountsPage({ showToast }) {
  const [discounts, setDiscounts] = useState({});
  const [usage, setUsage] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("active");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);
  const [reportRange, setReportRange] = useState(7);
  const blankForm = { name:"", type:"percentage", value:"", maxCap:"", startsAt:"", endsAt:"", noEnd:true, minSubtotal:"", applicableTo:"all", couponCode:"", perCustomerLimit:"", globalLimit:"", priority:"", exclusiveGroup:"", stackable:false, enabled:true, categoryIds:"" };
  const [form, setForm] = useState(blankForm);
  const setField = useCallback((k, v) => setForm(f => ({ ...f, [k]: v })), []);

  useEffect(() => {
    const r = Outlet("discounts");
    if (!r) { setLoading(false); return; }
    const unsub = onValue(r, snap => { setDiscounts(snap.val() || {}); setLoading(false); });
    return () => { off(r, "value", unsub); };
  }, []);

  useEffect(() => {
    if (!reportsOpen) return;
    const r = Outlet("discountsUsage");
    if (!r) return;
    const unsub = onValue(r, snap => { const v = snap.val() || {}; setUsage(Object.entries(v).map(([id, u]) => ({ id, ...u }))); });
    return () => { off(r, "value", unsub); };
  }, [reportsOpen]);

  const discStatus = useCallback((d) => {
    const now = Date.now();
    if (d.enabled === false) return "disabled";
    if (d.startsAt && now < d.startsAt) return "scheduled";
    if (d.endsAt && d.endsAt > 0 && now > d.endsAt) return "expired";
    return "active";
  }, []);

  const all = useMemo(() => Object.entries(discounts).map(([id, d]) => ({ id, ...d })), [discounts]);
  const groups = useMemo(() => {
    const g = { active: [], scheduled: [], expired: [] };
    all.forEach(d => { const s = discStatus(d); (g[s] || g.expired).push(d); });
    return g;
  }, [all, discStatus]);
  const sorted = useCallback((arr) => [...arr].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)), []);
  const DISC_PAGE_SIZE = 20;
  const [discountPage, setDiscountPage] = useState(1);
  const currentDiscList = sorted(groups[tab] || []);
  const discTotalPages = Math.max(1, Math.ceil(currentDiscList.length / DISC_PAGE_SIZE));
  useEffect(() => { setDiscountPage(1); }, [tab]);
  const paginatedDiscs = currentDiscList.slice((discountPage - 1) * DISC_PAGE_SIZE, discountPage * DISC_PAGE_SIZE);

  const openEditor = useCallback((d) => {
    if (d) {
      setEditingId(d.id);
      setForm({
        name: d.name || "", type: d.type || "percentage", value: d.value ?? "",
        maxCap: d.maxCap ?? "", startsAt: d.startsAt ? toLocalInput(d.startsAt) : "",
        endsAt: d.endsAt ? toLocalInput(d.endsAt) : "", noEnd: !d.endsAt,
        minSubtotal: d.minSubtotal ?? "", applicableTo: d.applicableTo || "all",
        couponCode: d.couponCode || "", perCustomerLimit: d.perCustomerLimit ?? "",
        globalLimit: d.globalLimit ?? "", priority: d.priority ?? "",
        exclusiveGroup: d.exclusiveGroup || "", stackable: !!d.stackable,
        enabled: d.enabled !== false, categoryIds: (d.categoryIds || []).join(", "),
      });
    } else {
      setEditingId(null);
      setForm({ ...blankForm });
    }
    setEditorOpen(true);
  }, []);

  const handleSave = useCallback(async () => {
    const name = (form.name || "").trim();
    if (!name) return showToast("Discount name is required", "warning");
    const value = Number(form.value);
    if (form.type !== "bogo" && (!value || value <= 0)) return showToast("Enter a valid value", "warning");
    if (form.type === "percentage" && value > 100) return showToast("Percentage cannot exceed 100", "warning");
    if (form.type === "coupon" && !(form.couponCode || "").trim()) return showToast("Coupon code is required for coupon type", "warning");
    const startsAt = toMs(form.startsAt);
    const endsAt = form.noEnd ? 0 : toMs(form.endsAt);
    setSaving(true);
    try {
      const id = editingId || `disc_${Date.now().toString(36)}`;
      const categoryIds = (form.categoryIds || "").split(",").map(s => s.trim()).filter(Boolean);
      const doc = {
        name, type: form.type, value: form.type === "bogo" ? 1 : value,
        maxCap: Number(form.maxCap) || 0,
        startsAt: startsAt || 0, endsAt: endsAt || 0,
        minSubtotal: Number(form.minSubtotal) || 0,
        applicableTo: form.applicableTo || "all",
        couponCode: form.type === "coupon" ? (form.couponCode || "").trim().toUpperCase() : null,
        perCustomerLimit: Number(form.perCustomerLimit) || 0,
        globalLimit: Number(form.globalLimit) || 0,
        priority: Number(form.priority) || 0,
        exclusiveGroup: (form.exclusiveGroup || "").trim() || null,
        stackable: !!form.stackable, enabled: form.enabled,
        categoryIds: categoryIds.length > 0 ? categoryIds : null,
        updatedAt: Date.now(),
      };
      if (!editingId) { doc.createdAt = Date.now(); doc.stats = { usedCount: 0, totalDiscountGiven: 0 }; }
      await update(Outlet(`discounts/${id}`), doc);
      logAudit(_bizId, _outletId, editingId ? "discount_update" : "discount_create", { discountId: id, name, type: form.type }, getCurrentAdminActor());
      showToast(editingId ? "Discount updated" : "Discount created", "success");
      setEditorOpen(false);
    } catch (e) { showToast("Save failed: " + (e?.message || "unknown"), "error"); }
    finally { setSaving(false); }
  }, [form, editingId, showToast]);

  const handleToggle = useCallback(async (id, enabled) => {
    try {
      await update(Outlet(`discounts/${id}`), { enabled, updatedAt: Date.now() });
      logAudit(_bizId, _outletId, "discount_toggle", { discountId: id, enabled }, getCurrentAdminActor());
    } catch (e) { showToast("Toggle failed", "error"); }
  }, [showToast]);

  const handleDelete = useCallback(async (d) => {
    const used = d.stats?.usedCount || 0;
    if (!confirm(used > 0 ? `Delete "${d.name || d.id}"? It has ${used} usage(s) which will remain in logs.` : `Delete "${d.name || d.id}"?`)) return;
    try {
      await remove(Outlet(`discounts/${d.id}`));
      logAudit(_bizId, _outletId, "discount_delete", { discountId: d.id, name: d.name }, getCurrentAdminActor());
      showToast("Discount deleted", "success");
    } catch (e) { showToast("Delete failed", "error"); }
  }, [showToast]);

  const filteredUsage = useMemo(() => {
    if (!reportRange) return usage;
    const start = Date.now() - reportRange * 86400000;
    return usage.filter(u => (u.appliedAt || 0) >= start);
  }, [usage, reportRange]);

  const reportBreakdown = useMemo(() => {
    const map = new Map();
    filteredUsage.forEach(u => {
      const k = u.discountId || "unknown";
      if (!map.has(k)) map.set(k, { id: k, name: u.discountLabel || discounts[k]?.name || "Unknown", count: 0, total: 0 });
      const e = map.get(k); e.count += 1; e.total += Number(u.amountGiven) || 0;
    });
    return [...map.values()].sort((a, b) => b.total - a.total);
  }, [filteredUsage, discounts]);

  const exportReport = useCallback(() => {
    if (!reportBreakdown.length) return showToast("No data to export", "warning");
    downloadCSV(`discounts_report_${reportRange || "all"}d_${new Date().toISOString().slice(0,10)}.csv`, reportBreakdown.map(r => ({
      "Discount ID": r.id, Name: r.name, Redemptions: r.count,
      "Total Saved": Math.round(r.total), "Avg per Redemption": r.count > 0 ? Math.round(r.total / r.count) : 0,
    })));
    showToast("Report exported", "success");
  }, [reportBreakdown, reportRange, showToast]);

  const discUsagePct = useCallback((d) => {
    const used = d.stats?.usedCount || 0;
    if (!d.globalLimit || used === 0) return 0;
    return Math.min(100, Math.round(used / d.globalLimit * 100));
  }, []);

  if (loading) return <SkeletonPage kpi={4} cards={6} />;

  return (
    <div className="space-y-4">
      <div className="sheet-toolbar">
        <div className="flex gap-2">
          <BtnPrimary onClick={() => openEditor(null)} style={{ padding:"8px 14px", fontSize:13 }}><Plus size={14} /> New Discount</BtnPrimary>
          <BtnSecondary onClick={() => setReportsOpen(true)}><BarChart3 size={14} /> Reports</BtnSecondary>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px,1fr))", gap: 12 }}>
        <KPICard title="Total" value={all.length} icon={Tag} />
        <KPICard title="Active" value={groups.active.length} icon={CheckCircle} color={COLORS.success} />
        <KPICard title="Scheduled" value={groups.scheduled.length} icon={Clock} color={COLORS.info} />
        <KPICard title="Expired" value={groups.expired.length} icon={XCircle} color={COLORS.error} />
      </div>
      <div className="flex gap-2" style={{ flexWrap: "wrap" }}>
        <Pill label={`Active (${groups.active.length})`} active={tab === "active"} onClick={() => setTab("active")} />
        <Pill label={`Scheduled (${groups.scheduled.length})`} active={tab === "scheduled"} onClick={() => setTab("scheduled")} />
        <Pill label={`Expired/Disabled (${groups.expired.length})`} active={tab === "expired"} onClick={() => setTab("expired")} />
      </div>
      <div className="space-y-3">
        {currentDiscList.length === 0 && <EmptyState icon={Tag} msg={`No ${tab} discounts.`} />}
        {paginatedDiscs.map(d => {
          const st = discStatus(d);
          const stInfo = DISC_STATUS[st] || DISC_STATUS.disabled;
          const tInfo = discTypeStyle(d.type);
          const used = d.stats?.usedCount || 0;
          const given = d.stats?.totalDiscountGiven || 0;
          return (
            <GlassCard key={d.id} className="p-4">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div className="flex items-center gap-2 flex-wrap" style={{ marginBottom: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{d.name || d.id}</span>
                    <span className="status-pill" style={{ fontSize:10, fontWeight:700, background: tInfo.bg, color: tInfo.color, textTransform: "uppercase" }}>{d.type}</span>
                    <span className="status-pill" style={{ fontSize:10, background: stInfo.bg, color: stInfo.color }}>{"\u25CF"} {stInfo.label}</span>
                    {d.stackable && <span className="status-pill" style={{ fontSize:10, fontWeight:600, background:"#dbeafe", color:"#1d4ed8" }}>Stackable</span>}
                    {d.applicableTo && d.applicableTo !== "all" && <span className="status-pill" style={{ fontSize:10, fontWeight:600, background:"#f1f5f9", color:"#64748b" }}>{d.applicableTo === "dinein" ? "Dine-in" : "Delivery"}</span>}
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>
                    {d.type === "percentage" && <><strong>{Number(d.value)}%</strong> off{d.maxCap ? ` (cap ${fmt(d.maxCap)})` : ""}</>}
                    {d.type === "flat" && <><strong>{fmt(d.value)}</strong> off</>}
                    {d.type === "bogo" && <strong>Buy 1 Get 1 Free</strong>}
                    {d.type === "coupon" && <>Code: <code style={{ background: "#fef3c7", padding: "1px 6px", borderRadius: 4, fontWeight: 600 }}>{esc(d.couponCode)}</code>{d.value ? <> {"\u2014"} {Number(d.value)}% off</> : ""}</>}
                    {d.type === "category" && <><strong>{d.value ? `${Number(d.value)}%` : fmt(d.value)}</strong> on categories</>}
                    {d.type === "first_order" && <strong>New Customer Discount</strong>}
                    {d.minSubtotal ? <> {"\u00B7"} Min order: <strong>{fmt(d.minSubtotal)}</strong></> : ""}
                    {d.categoryIds?.length > 0 && <div style={{ marginTop: 2 }}>Categories: <strong>{d.categoryIds.join(", ")}</strong></div>}
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>
                    {d.type === "bogo" ? "Always on for new customers" : <>{fmtDate(d.startsAt)} {"\u2192"} {d.endsAt ? fmtDate(d.endsAt) : "No end"}</>}
                  </div>
                  {used > 0 && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Used <strong>{used}&times;</strong> {"\u00B7"} saved <strong>{fmt(given)}</strong>{d.globalLimit ? ` / ${d.globalLimit} limit` : ""}{d.stats?.lastUsedAt ? ` {"\u00B7"} Last: ${fmtDate(d.stats.lastUsedAt)}` : ""}</div>}
                  {d.globalLimit && used > 0 && <div style={{ marginTop: 4, height: 4, borderRadius: 2, background: "#f1f5f9", overflow: "hidden", maxWidth: 200 }}><div style={{ height: "100%", width: `${discUsagePct(d)}%`, background: ORANGE, borderRadius: 2 }} /></div>}
                </div>
                <div className="flex items-center gap-2">
                  <ToggleSwitch checked={d.enabled !== false} onChange={(v) => handleToggle(d.id, v)} />
                  <button type="button" onClick={() => openEditor(d)} className="shell-button" style={{ width:32, height:32, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", border:"1px solid #e2e8f0", background:"white", color:"#64748b", cursor:"pointer", transition:"all 0.2s" }} title="Edit"
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#E84908"; e.currentTarget.style.color = "#E84908"; e.currentTarget.style.background = "#FFF0E8"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.color = "#64748b"; e.currentTarget.style.background = "white"; }}>
                    <Edit3 size={15} />
                  </button>
                  <button type="button" onClick={() => handleDelete(d)} className="shell-button" style={{ width:32, height:32, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", border:"1px solid #e2e8f0", background:"white", color:"#ef4444", cursor:"pointer", transition:"all 0.2s" }} title="Delete"
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#ef4444"; e.currentTarget.style.background = "#fef2f2"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "white"; }}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </GlassCard>
          );
        })}
        <Pagination page={discountPage} totalPages={discTotalPages} onPageChange={setDiscountPage} totalItems={currentDiscList.length} pageSize={DISC_PAGE_SIZE} />
      </div>

      <Modal open={editorOpen} onClose={() => setEditorOpen(false)} wide>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0, fontFamily: "'Outfit', sans-serif" }}>{editingId ? "Edit Discount" : "New Discount"}</h3>
          <button type="button" onClick={() => setEditorOpen(false)} style={{ width:36, height:36, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", border:"1px solid rgba(232, 73, 8,0.12)", background:"white", color:"#64748b", cursor:"pointer", transition:"all 0.3s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "#fef2f2"; e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.transform = "rotate(90deg)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "white"; e.currentTarget.style.color = "#64748b"; e.currentTarget.style.transform = "none"; }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={_discLabelStyle}>Discount Name *</label>
            <Input placeholder="e.g. Weekend Special" value={form.name} onChange={e => setField("name", e.target.value)} />
          </div>
          <div>
            <label style={_discLabelStyle}>Type *</label>
            <Select value={form.type} onChange={e => setField("type", e.target.value)}>
              {DISC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Select>
          </div>
          <div>
            <label style={_discLabelStyle}>{form.type === "percentage" ? "Percentage (%)" : form.type === "flat" ? "Amount (\u20B9)" : "Value"}</label>
            <Input type="number" placeholder={form.type === "percentage" ? "e.g. 10" : "e.g. 50"} value={form.value} onChange={e => setField("value", e.target.value)} disabled={form.type === "bogo"} />
          </div>
          {form.type === "percentage" && <div>
            <label style={_discLabelStyle}>Max Discount Cap (\u20B9)</label>
            <Input type="number" placeholder="0 = no cap" value={form.maxCap} onChange={e => setField("maxCap", e.target.value)} />
          </div>}
          {form.type === "coupon" && <div style={{ gridColumn: "1 / -1" }}>
            <label style={_discLabelStyle}>Coupon Code *</label>
            <Input placeholder="e.g. WEEKEND20" value={form.couponCode} onChange={e => setField("couponCode", e.target.value.toUpperCase())} />
          </div>}
          <div>
            <label style={_discLabelStyle}>Start Date</label>
            <Input type="datetime-local" value={form.startsAt} onChange={e => setField("startsAt", e.target.value)} />
          </div>
          <div>
            <label style={_discLabelStyle}>End Date {form.noEnd && "(No end)"}</label>
            <div className="flex gap-2 items-center">
              <Input type="datetime-local" value={form.endsAt} onChange={e => setField("endsAt", e.target.value)} disabled={form.noEnd} style={{ flex: 1 }} />
              <label className="flex items-center gap-1" style={{ fontSize: 12, color: "#64748b", whiteSpace: "nowrap", cursor: "pointer" }}>
                <input type="checkbox" checked={form.noEnd} onChange={e => setField("noEnd", e.target.checked)} style={{ accentColor: ORANGE }} /> No end
              </label>
            </div>
          </div>
          <div>
            <label style={_discLabelStyle}>Min Order Value (\u20B9)</label>
            <Input type="number" placeholder="0 = no minimum" value={form.minSubtotal} onChange={e => setField("minSubtotal", e.target.value)} />
          </div>
          <div>
            <label style={_discLabelStyle}>Applicable To</label>
            <Select value={form.applicableTo} onChange={e => setField("applicableTo", e.target.value)}>
              {DISC_CHANNELS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </Select>
          </div>
          <div>
            <label style={_discLabelStyle}>Per Customer Limit</label>
            <Input type="number" placeholder="0 = unlimited" value={form.perCustomerLimit} onChange={e => setField("perCustomerLimit", e.target.value)} />
          </div>
          <div>
            <label style={_discLabelStyle}>Total Usage Limit</label>
            <Input type="number" placeholder="0 = unlimited" value={form.globalLimit} onChange={e => setField("globalLimit", e.target.value)} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={_discLabelStyle}>Category Restriction (comma-separated)</label>
            <Input placeholder="e.g. Pizza, Beverages (leave empty for all categories)" value={form.categoryIds} onChange={e => setField("categoryIds", e.target.value)} />
          </div>
          <div>
            <label style={_discLabelStyle}>Priority</label>
            <Input type="number" placeholder="Higher = preferred" value={form.priority} onChange={e => setField("priority", e.target.value)} />
          </div>
          <div>
            <label style={_discLabelStyle}>Exclusive Group</label>
            <Input placeholder="Group name" value={form.exclusiveGroup} onChange={e => setField("exclusiveGroup", e.target.value)} />
          </div>
          <div className="flex items-center gap-4" style={{ gridColumn: "1 / -1" }}>
            <label className="flex items-center gap-2" style={{ fontSize: 13, color: "#475569", cursor: "pointer" }}>
              <input type="checkbox" checked={form.stackable} onChange={e => setField("stackable", e.target.checked)} style={{ accentColor: ORANGE }} /> Stackable with other discounts
            </label>
            <div className="flex items-center gap-2">
              <ToggleSwitch checked={form.enabled} onChange={v => setField("enabled", v)} />
              <span style={{ fontSize: 13, color: "#475569" }}>Enabled</span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(0,0,0,0.06)" }}>
          <BtnSecondary onClick={() => setEditorOpen(false)} style={{ padding:"8px 18px", fontSize:13 }}>Cancel</BtnSecondary>
          <BtnPrimary onClick={handleSave} disabled={saving} style={{ padding:"8px 18px", fontSize:13 }}>{saving ? "Saving..." : editingId ? "Update" : "Create Discount"}</BtnPrimary>
        </div>
      </Modal>

      <Modal open={reportsOpen} onClose={() => setReportsOpen(false)} wide>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0, fontFamily: "'Outfit', sans-serif" }}>Discount Reports</h3>
          <button type="button" onClick={() => setReportsOpen(false)} style={{ width:36, height:36, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", border:"1px solid rgba(232, 73, 8,0.12)", background:"white", color:"#64748b", cursor:"pointer", transition:"all 0.3s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "#fef2f2"; e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.transform = "rotate(90deg)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "white"; e.currentTarget.style.color = "#64748b"; e.currentTarget.style.transform = "none"; }}>
            <X size={18} />
          </button>
        </div>
        <div className="flex gap-2 items-center" style={{ marginBottom: 16 }}>
          {[7, 30, 90, 0].map(r => (
            <Pill key={r} label={r ? `Last ${r}d` : "All Time"} active={reportRange === r} onClick={() => setReportRange(r)} />
          ))}
          <div style={{ flex: 1 }} />
          <BtnSecondary onClick={exportReport} disabled={!reportBreakdown.length} style={{ padding:"6px 12px", fontSize:12 }}><Download size={14} /> Export CSV</BtnSecondary>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px,1fr))", gap: 12, marginBottom: 16 }}>
          <KPICard title="Redemptions" value={filteredUsage.length.toLocaleString("en-IN")} icon={Tag} />
          <KPICard title="Total Saved" value={fmt(filteredUsage.reduce((s, u) => s + (Number(u.amountGiven) || 0), 0))} icon={TrendingDown} color={COLORS.success} />
          <KPICard title="Avg Savings" value={filteredUsage.length ? fmt(Math.round(filteredUsage.reduce((s, u) => s + (Number(u.amountGiven) || 0), 0) / filteredUsage.length)) : fmt(0)} icon={BarChart3} color={COLORS.info} />
          <KPICard title="Unique Discounts Used" value={new Set(filteredUsage.map(u => u.discountId)).size} icon={Percent} color="#8b5cf6" />
        </div>

        <GlassCard className="p-4" style={{ marginBottom: 16 }}>
          <SectionHeader title="Daily Redemption Trend" />
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={(() => {
                const dayMap = new Map();
                filteredUsage.forEach(u => {
                  const day = new Date(u.appliedAt || 0).toLocaleDateString("en-IN", { day:"2-digit", month:"short" });
                  dayMap.set(day, (dayMap.get(day) || 0) + 1);
                });
                return [...dayMap.entries()].map(([date, count]) => ({ date, count })).sort((a, b) => {
                  const da = a.date.split(" "), db = b.date.split(" ");
                  return new Date(`${da[1]} ${da[0]}, 2000`) - new Date(`${db[1]} ${db[0]}, 2000`);
                });
              })()}>
                <defs><linearGradient id="discGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#E84908" stopOpacity={0.3}/><stop offset="95%" stopColor="#E84908" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Area type="monotone" dataKey="count" stroke="#E84908" fill="url(#discGrad)" strokeWidth={2} name="Redemptions" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {reportBreakdown.length > 0 && <GlassCard className="p-4" style={{ marginBottom: 16 }}>
          <SectionHeader title="Top Discounts by Savings" />
          <div style={{ height: Math.min(reportBreakdown.length * 40 + 40, 280) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[...reportBreakdown].sort((a, b) => b.total - a.total).slice(0, 10)} layout="vertical" margin={{ left: 100 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} width={90} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} formatter={(v) => fmt(v)} />
                <Bar dataKey="total" fill="#E84908" radius={[0, 4, 4, 0]} name="Total Saved" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>}

        <div style={{ overflowX: "auto" }}>
          <table className="w-full text-sm" style={{ minWidth: 460 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                {["Discount", "Redemptions", "Total Saved", "Avg Savings"].map(h => (
                  <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reportBreakdown.length === 0 && <tr><td colSpan={4} style={{ padding: 24, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>No usage data for this range.</td></tr>}
              {reportBreakdown.map(r => {
                const d = discounts[r.id];
                const tInfo = discTypeStyle(d?.type);
                const pct = reportBreakdown.length > 0 ? Math.round(r.total / Math.max(...reportBreakdown.map(x => x.total)) * 100) : 0;
                return (
                  <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "8px 12px" }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{r.name}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}><span style={{ padding: "1px 6px", borderRadius: 99, fontSize: 9, fontWeight: 700, background: tInfo.bg, color: tInfo.color, textTransform: "uppercase", marginRight: 4 }}>{d?.type || "?"}</span>{d?.couponCode ? `Code: ${d.couponCode}` : ""}</div>
                    </td>
                    <td style={{ padding: "8px 12px", fontSize: 13, fontWeight: 600 }}>
                      {r.count}
                      <div style={{ marginTop: 3, height: 3, borderRadius: 2, background: "#f1f5f9", overflow: "hidden", width: 60 }}><div style={{ height: "100%", width: `${Math.min(100, r.count / Math.max(...reportBreakdown.map(x => x.count), 1) * 100)}%`, background: ORANGE, borderRadius: 2 }} /></div>
                    </td>
                    <td style={{ padding: "8px 12px", fontSize: 13, fontWeight: 600, color: COLORS.success }}>{fmt(r.total)}<div style={{ marginTop: 3, height: 3, borderRadius: 2, background: "#f1f5f9", overflow: "hidden", width: 60 }}><div style={{ height: "100%", width: `${pct}%`, background: "#22c55e", borderRadius: 2 }} /></div></td>
                    <td style={{ padding: "8px 12px", fontSize: 13 }}>{r.count > 0 ? fmt(Math.round(r.total / r.count)) : "\u2014"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PROMOTIONS PAGE
// ═══════════════════════════════════════════════════════════════════════════

const PROMO_TEMPLATES = [
  { cat:"New Customer Offers", items:[
    { title:"Welcome Offer", body:"Hi {name},\n\nWelcome to {storeName}! 🎉 Enjoy {offer} on your first order. Use code WELCOME. Order now!", note:"Replace {offer} with the actual welcome discount." },
    { title:"First Order Discount", body:"Hi {name},\n\nThank you for your first order! Here's a special discount for you: {offer}. Valid until {date}.", note:"Pair with coupon for tracking." },
    { title:"New Customer Bundle", body:"Hey {name}, 🎉\n\nAs a new customer, get our special combo at just {amount}! Includes {items}. Order now!", note:"List actual combo items in {items}." },
  ]},
  { cat:"Discounts & Sales", items:[
    { title:"Flat Discount", body:"Hi {name},\n\nSave ₹{amount} on your next order of ₹{minOrder}+ at {storeName}. Use code SAVE{amount}.", note:"Set minOrder to drive cart value." },
    { title:"Percentage Off", body:"Great news {name}! 🎉 Get {percent}% off on orders above ₹{minOrder}. Valid till {date}. Don't miss out!", note:"Use for clearance or seasonal sales." },
    { title:"B1G1 Free", body:"Hey {name}, Buy 1 Get 1 FREE at {storeName}! 🎉 Order any {item} and get another FREE. Use code BOGO.", note:"Define eligible item in {item}." },
    { title:"Clearance Sale", body:"Flash sale {name}! 🔥 Select items at just ₹{amount}. Stock limited. Order now at {storeName}.", note:"List specific clearance items." },
  ]},
  { cat:"Weekend & Seasonal", items:[
    { title:"Weekend Special", body:"It's the weekend {name}! 🎉 Enjoy {offer} at {storeName}. Order now and make it special!", note:"Best sent Friday evening or Saturday morning." },
    { title:"Festival Offer", body:"Happy {festival} {name}! 🎉 Celebrate with {storeName}. Get {offer} on orders above {minOrder}.", note:"Replace {festival} with the actual festival name." },
    { title:"Monsoon Special", body:"Rainy day {name}! 🌧️ Stay in and order from {storeName}. Get {offer} on all orders. Free delivery!", note:"Best sent on rainy days for higher engagement." },
    { title:"Summer Cooler", body:"Beat the heat {name}! ☀️ Try our summer specials at {storeName}. Cool drinks and ice creams at just {amount}!", note:"Feature cold items and beverages." },
  ]},
  { cat:"Re-engagement", items:[
    { title:"We Miss You", body:"We miss you {name}! 💔 It's been a while. Come back and enjoy {offer} at {storeName}.", note:"Target customers inactive >30 days." },
    { title:"Come Back Offer", body:"Hi {name}, it's been {days} days! Here's a special {offer} to welcome you back. Valid for 7 days.", note:"Personalize {days} based on inactivity period." },
    { title:"Last Order Reminder", body:"Hi {name}, your last order from {lastOrderDate} was delicious! 😋 Ready for another? Enjoy {offer}.", note:"Best paired with their last ordered items." },
  ]},
  { cat:"Referral & Loyalty", items:[
    { title:"Refer a Friend", body:"Hi {name}, refer a friend and you both get {offer}! 🎉 Share your code {code} with them.", note:"Set up coupon code for tracking." },
    { title:"Loyalty Bonus", body:"Thank you for being a loyal customer {name}! 🌟 Here's {offer} as our special thank you.", note:"Target high-order-count customers." },
    { title:"VIP Appreciation", body:"Dear VIP {name}, 🌟 You're one of our most valued customers. Enjoy exclusive {offer} at {storeName}.", note:"Send to top 10% customers by spend." },
  ]},
  { cat:"New Menu & Launches", items:[
    { title:"New Item Launch", body:"Exciting news {name}! 🎉 We've launched {item} at {storeName}. Be the first to try it at {offer}!", note:"Add image of the new item." },
    { title:"Seasonal Menu", body:"Our new {season} menu is here {name}! 🍂 Try {item} and other seasonal delights at {storeName}.", note:"Replace {season} with Spring/Summer/Monsoon/Winter." },
    { title:"Chef's Special", body:"Hi {name}, our chefs have created something special! 🧑‍🍳 Try {item} — {description}. Only at {storeName}.", note:"Add a mouth-watering description." },
  ]},
  { cat:"Birthday & Special Days", items:[
    { title:"Birthday Offer", body:"Happy Birthday {name}! 🎂🎉 Here's a special {offer} from {storeName}. Celebrate with us!", note:"Best sent on the customer's birthday morning." },
    { title:"Anniversary Offer", body:"Happy Anniversary {name}! 🎉 Thank you for {years} years with {storeName}. Enjoy {offer}!", note:"Track customer since-date for personalization." },
  ]},
  { cat:"Urgent & Flash Deals", items:[
    { title:"Flash Sale", body:"⚡ FLASH SALE {name}! ⚡ {offer} for the next {hours} hours only at {storeName}. Order fast!", note:"Use for limited-time urgency campaigns." },
    { title:"Slow Hour Boost", body:"It's quiet right now {name} and we have a deal! Get {offer} on orders in the next {hours} hours.", note:"Target slow hours (3-5 PM weekdays)." },
    { title:"Last Minute Deal", body:"Last minute offer {name}! Order within {minutes} min and get {offer}. Hurry!", note:"Best for evening dinner rush." },
  ]},
];

function PromotionsPage({ showToast }) {
  const [pane, setPane] = useState("compose");
  const [campaigns, setCampaigns] = useState({});
  const [promoEnabled, setPromoEnabled] = useState(true);
  const [killSwitch, setKillSwitch] = useState(false);
  const [botOnline, setBotOnline] = useState(true);

  // Compose state
  const [template, setTemplate] = useState("");
  const [greeting, setGreeting] = useState(true);
  const [attachMenu, setAttachMenu] = useState(false);
  const [menuText, setMenuText] = useState("");
  const [attachMenuImg, setAttachMenuImg] = useState(false);
  const [menuImgUrl, setMenuImgUrl] = useState("");
  const [closingMsg, setClosingMsg] = useState("");
  const [sendStop, setSendStop] = useState(true);
  const [recipientFilter, setRecipientFilter] = useState("all_customers");
  const [csvRecipients, setCsvRecipients] = useState([]);
  const [csvFileName, setCsvFileName] = useState("");
  const [recipientCount, setRecipientCount] = useState(0);
  const [delay, setDelay] = useState(2);
  const [generateCoupons, setGenerateCoupons] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [sendMode, setSendMode] = useState("now");
  const [scheduleAt, setScheduleAt] = useState("");
  const [quietStart, setQuietStart] = useState(22);
  const [quietEnd, setQuietEnd] = useState(8);
  const [mediaDataUrl, setMediaDataUrl] = useState(null);
  const [mediaFileName, setMediaFileName] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  const MAX_RECIPIENTS = 500;
  const MAX_CHARS = 1500;

  // Firebase listeners
  useEffect(() => {
    const campaignsRef = Outlet("promotions/campaigns");
    const enabledRef = Outlet("promotions/enabled");
    const killRef = Outlet("promotions/killSwitch");

    const unsubs = [];
    if (campaignsRef) {
      unsubs.push(onValue(campaignsRef, snap => setCampaigns(snap.val() || {})));
    }
    if (enabledRef) {
      unsubs.push(onValue(enabledRef, snap => setPromoEnabled(snap.val() !== false)));
    } else {
      setPromoEnabled(true);
    }
    if (killRef) {
      unsubs.push(onValue(killRef, snap => setKillSwitch(snap.val() === true)));
    }

    const handleBotStatus = (e) => setBotOnline(e.detail.online);
    window.addEventListener("botStatusChange", handleBotStatus);
    if (window._botOnline !== undefined) setBotOnline(window._botOnline);

    return () => { unsubs.forEach(u => u()); window.removeEventListener("botStatusChange", handleBotStatus); };
  }, []);

  // Recipient count estimation
  useEffect(() => {
    if (recipientFilter === "upload") {
      setRecipientCount(csvRecipients.length);
    } else if (recipientFilter === "custom_csv") {
      setRecipientCount(csvRecipients.length);
    } else {
      const custRef = Outlet("customers");
      if (!custRef) { setRecipientCount(0); return; }
      get(custRef).then(snap => {
        const customers = snap.val() || {};
        const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
        let count = 0;
        for (const [, c] of Object.entries(customers)) {
          if (!c || c.promotionalConsent !== true) continue;
          if (recipientFilter === "recent_30d") {
            if (!c.lastOrderDate) continue;
            if (new Date(c.lastOrderDate).getTime() < cutoff) continue;
          }
          count++;
        }
        setRecipientCount(Math.min(count, MAX_RECIPIENTS));
      }).catch(() => setRecipientCount(0));
    }
  }, [recipientFilter, csvRecipients]);

  const campaignsList = useMemo(() => {
    return Object.entries(campaigns)
      .map(([id, c]) => ({ id, ...c }))
      .sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
  }, [campaigns]);

  const activeCampaigns = useMemo(() =>
    campaignsList.filter(c => ["running", "scheduled", "paused"].includes(c.status)),
    [campaignsList]
  );

  const historyCampaigns = useMemo(() =>
    campaignsList.filter(c => ["done", "expired", "stopped", "aborted"].includes(c.status)),
    [campaignsList]
  );

  const fmtDate = (ms) => {
    if (!ms) return "\u2014";
    const d = new Date(ms);
    return d.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  const parseCsvText = (text) => {
    const out = [];
    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length === 0) return out;
    const PHONE_HINTS = ["whatsapp", "phone", "mobile", "number", "cell", "contact", "tel", "msisdn"];
    const cleanPhone = (p) => String(p || "").replace(/\D/g, "").slice(-10);
    const first = lines[0];
    const hasHeader = /[a-zA-Z]/.test(first);
    let phoneCol = 0;
    let startIdx = 0;
    if (hasHeader) {
      const headers = first.split(",").map(h => String(h || "").trim().toLowerCase());
      for (let i = 0; i < headers.length; i++) {
        for (const hint of PHONE_HINTS) {
          if (headers[i] === hint || headers[i].includes(hint)) { phoneCol = i; startIdx = 1; break; }
        }
        if (startIdx) break;
      }
    }
    for (let i = startIdx; i < lines.length; i++) {
      const cells = lines[i].split(",").map(c => c.trim().replace(/^"|"$/g, ""));
      const phone = cleanPhone(cells[phoneCol]);
      if (phone.length >= 10) out.push(phone);
    }
    return [...new Set(out)];
  };

  const handleCsvUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFileName(file.name);
    try {
      if (file.name.endsWith(".csv")) {
        const text = await file.text();
        const list = parseCsvText(text);
        setCsvRecipients(list);
        showToast(`Loaded ${list.length} numbers from ${file.name}`, "success");
      } else {
        showToast("Only .csv files supported in this dashboard", "warning");
      }
    } catch (err) {
      showToast(err.message || "Failed to parse file", "error");
    }
  };

  const downloadSampleCsv = () => {
    const rows = [["phone", "name"], ["9876543210", "Aarav Sharma"], ["9123456789", "Priya Singh"]];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "sample-template.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const handleMediaUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { setMediaDataUrl(ev.target.result); setMediaFileName(file.name); };
    reader.readAsDataURL(file);
  };

  const buildPreviewBody = () => {
    const sampleName = "Aarav";
    let body = template;
    const tokens = { "{storeName}": "Your Store", "{name}": sampleName, "{phone}": "9876543210", "{lastOrderDate}": "15 Jun 2026" };
    for (const [k, v] of Object.entries(tokens)) body = body.split(k).join(v);
    if (greeting) body = `Hi ${sampleName},\n\n${body}`;
    if (closingMsg) body += "\n\n" + closingMsg;
    if (sendStop) body += "\n\n_Reply STOP to unsubscribe._";
    return body;
  };

  const launchCampaign = async () => {
    if (!template.trim()) return showToast("Write a message first", "warning");
    if (launching) return;
    setLaunching(true);
    try {
      const recipients = await buildRecipients();
      if (!recipients.length) return showToast("No eligible recipients", "warning");

      if (!promoEnabled) {
        const r = Outlet("promotions/enabled");
        if (r) await set(r, true);
      }

      const campaignId = "c_" + Date.now().toString(36);
      const runAt = sendMode === "schedule" ? new Date(scheduleAt).getTime() : null;
      if (sendMode === "schedule" && (!runAt || isNaN(runAt))) {
        return showToast("Pick a valid date/time", "warning");
      }

      const campaignDoc = {
        id: campaignId,
        status: sendMode === "schedule" ? "scheduled" : "running",
        template: template.trim(),
        mediaUrl: mediaDataUrl || null,
        greeting,
        menuText: attachMenu ? menuText.trim() : null,
        menuImageUrl: attachMenuImg ? menuImgUrl : null,
        closingMessage: closingMsg.trim() || null,
        sendStopMsg: sendStop,
        recipients,
        delayMs: Math.max(1, Math.min(30, Number(delay) || 2)) * 1000,
        generateCoupons,
        runAt,
        quietHours: sendMode === "schedule" ? { start: Number(quietStart), end: Number(quietEnd) } : null,
        requestedBy: "admin",
        createdAt: Date.now(),
      };
      if (sendMode !== "schedule") campaignDoc.startedAt = Date.now();

      const campRef = Outlet(`promotions/campaigns/${campaignId}`);
      if (campRef) await set(campRef, campaignDoc);

      if (sendMode !== "schedule") {
        const cmdRef = Outlet("promotions/commands");
        if (cmdRef) {
          await push(cmdRef, {
            action: "SEND_PROMOTION",
            campaignId,
            template: template.trim(),
            mediaUrl: mediaDataUrl || null,
            greeting,
            menuText: attachMenu ? menuText.trim() : null,
            menuImageUrl: attachMenuImg ? menuImgUrl : null,
            closingMessage: closingMsg.trim() || null,
            sendStopMsg: sendStop,
            recipients,
            delayMs: Math.max(1, Math.min(30, Number(delay) || 2)) * 1000,
            generateCoupons,
            quietHours: sendMode === "schedule" ? { start: Number(quietStart), end: Number(quietEnd) } : null,
            requestedBy: "admin",
          });
        }
        showToast(`Campaign ${campaignId} launched!`, "success");
      } else {
        showToast(`Scheduled ${campaignId} for ${fmtDate(runAt)}`, "success");
      }
      setPane("active");
    } catch (e) {
      showToast("Launch failed: " + (e.message || "unknown"), "error");
    } finally { setLaunching(false); }
  };

  const buildRecipients = async () => {
    if (recipientFilter === "upload" || recipientFilter === "custom_csv") return csvRecipients.filter(Boolean);
    const custRef = Outlet("customers");
    if (!custRef) return [];
    const snap = await get(custRef);
    const customers = snap.val() || {};
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    let phones = [];
    for (const [phone, c] of Object.entries(customers)) {
      if (!c || c.promotionalConsent !== true) continue;
      if (recipientFilter === "recent_30d") {
        if (!c.lastOrderDate) continue;
        if (new Date(c.lastOrderDate).getTime() < cutoff) continue;
      }
      phones.push(String(phone).replace(/\D/g, "").slice(-10));
    }
    try {
      const optRef = Outlet("promotions/optout");
      if (optRef) {
        const optSnap = await get(optRef);
        if (optSnap.exists()) {
          const blocked = new Set(Object.keys(optSnap.val()));
          phones = phones.filter(p => !blocked.has(p));
        }
      }
    } catch (_) {}
    return [...new Set(phones.filter(Boolean))].slice(0, MAX_RECIPIENTS);
  };

  const sendTest = async () => {
    if (!template.trim()) return showToast("Write a template first", "warning");
    if (sendingTest) return;
    setSendingTest(true);
    try {
      const phone = testPhone.replace(/\D/g, "").slice(-10);
      if (phone.length !== 10) return showToast("Enter a valid 10-digit phone", "warning");
      const cmdRef = Outlet("promotions/commands");
      if (!cmdRef) return showToast("Outlet not configured", "error");
      await push(cmdRef, {
        action: "SEND_PROMOTION",
        campaignId: "test_" + Date.now().toString(36),
        template: template.trim(),
        mediaUrl: mediaDataUrl || null,
        greeting,
        menuText: attachMenu ? menuText.trim() : null,
        menuImageUrl: attachMenuImg ? menuImgUrl : null,
        closingMessage: closingMsg.trim() || null,
        sendStopMsg: sendStop,
        recipients: [phone],
        delayMs: 2000,
        generateCoupons: false,
        quietHours: null,
        requestedBy: "self-test",
        isTest: true,
      });
      showToast(`Test message queued for ${phone}`, "success");
    } catch (e) {
      showToast("Test failed: " + (e.message || "unknown"), "error");
    } finally { setSendingTest(false); }
  };

  const toggleKillSwitch = async () => {
    const ref2 = Outlet("promotions/killSwitch");
    if (!ref2) return;
    const next = !killSwitch;
    await set(ref2, next);
    showToast(next ? "Kill switch ENGAGED" : "Kill switch released", next ? "warning" : "success");
  };

  const togglePromoEnabled = async (val) => {
    const ref2 = Outlet("promotions/enabled");
    if (!ref2) return;
    await set(ref2, !!val);
    showToast(val ? "Promotions ENABLED" : "Promotions DISABLED", val ? "success" : "warning");
  };

  const stopCampaign = async (id) => {
    if (!confirm(`Stop campaign ${id}? Sent messages cannot be recalled.`)) return;
    const ref2 = Outlet(`promotions/campaigns/${id}`);
    if (ref2) await update(ref2, { status: "stopped", stoppedAt: Date.now() });
    showToast("Campaign stopped", "success");
  };

  const exportCampaignLog = async (id) => {
    const logRef = Outlet(`promotions/logs/${id}`);
    if (!logRef) return showToast("No log found", "warning");
    const snap = await get(logRef);
    if (!snap.exists()) return showToast("No log data for this campaign", "warning");
    const rows = [["phone", "status", "sentAt", "error", "couponCode", "reason"]];
    const log = snap.val();
    for (const [phone, r] of Object.entries(log)) {
      rows.push([phone, r.status || "", r.sentAt ? new Date(r.sentAt).toISOString() : "", r.error || "", r.couponCode || "", r.reason || ""]);
    }
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `promo-log-${id}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const cloneCampaign = (campaign) => {
    setTemplate(campaign.template || "");
    setGreeting(campaign.greeting !== false);
    setAttachMenu(!!campaign.menuText);
    setMenuText(campaign.menuText || "");
    setAttachMenuImg(!!campaign.menuImageUrl);
    setMenuImgUrl(campaign.menuImageUrl || "");
    setClosingMsg(campaign.closingMessage || "");
    setSendStop(campaign.sendStopMsg !== false);
    setPane("compose");
    showToast("Campaign loaded into composer", "success");
  };

  const canLaunch = template.trim().length > 0 && recipientCount > 0 && botOnline && promoEnabled;

  return (
    <div>
      {/* Kill-switch Banner */}
      <GlassCard style={{ padding:"12px 16px", marginBottom:16, display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <Octagon size={16} color={killSwitch ? "#ef4444" : "#22c55e"} />
          <span style={{ fontSize:13, fontWeight:600, color:"#0f172a" }}>Global Promotions</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginLeft:"auto" }}>
          <span style={{ fontSize:11, color:"#64748b" }}>Sending:</span>
          <ToggleSwitch checked={promoEnabled} onChange={togglePromoEnabled} />
          <span style={{ fontSize:11, fontWeight:600, color:promoEnabled ? "#22c55e" : "#ef4444" }}>{promoEnabled ? "ON" : "OFF"}</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:6, marginLeft:12 }}>
          <span className={`w-2 h-2 rounded-full ${botOnline ? "bg-green-500" : "bg-red-500 animate-pulse"}`} />
          <span style={{ fontSize:11, color:botOnline ? "#22c55e" : "#ef4444", fontWeight:600 }}>{botOnline ? "Bot Online" : "Bot Offline"}</span>
        </div>
        <button type="button" onClick={toggleKillSwitch}
          style={{ padding:"6px 14px", borderRadius:8, fontSize:12, fontWeight:700, cursor:"pointer",
            background:killSwitch ? "#ef4444" : "#f1f5f9", color:killSwitch ? "white" : "#64748b",
            border:killSwitch ? "1px solid #ef4444" : "1px solid #e2e8f0", transition:"all 0.2s" }}>
          <Octagon size={12} style={{ marginRight:4, verticalAlign:"middle" }} />
          {killSwitch ? "RELEASE KILL SWITCH" : "EMERGENCY STOP ALL"}
        </button>
      </GlassCard>

      {/* Pane Tabs */}
      <div style={{ display:"flex", gap:8, marginBottom:16 }}>
        {[{ id:"compose", label:"Compose" }, { id:"active", label:`Active (${activeCampaigns.length})` }, { id:"history", label:`History (${historyCampaigns.length})` }].map(t => (
          <div key={t.id} onClick={() => setPane(t.id)} className={`pill${pane === t.id ? " pill-active" : " pill-inactive"}`} style={{ fontSize:12 }}>
            {t.label}
          </div>
        ))}
      </div>

      {/* ─── COMPOSE PANE ─── */}
      {pane === "compose" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          {/* Left Column: Message Builder */}
          <GlassCard style={{ padding:20 }}>
            <SectionHeader title="Message Builder" action={
              <span style={{ fontSize:11, color:"#94a3b8" }}>{template.length}/{MAX_CHARS}</span>
            } />
            <div style={{ marginBottom:12 }}>
              <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", fontSize:13, color:"#475569" }}>
                <input type="checkbox" checked={greeting} onChange={e => setGreeting(e.target.checked)} style={{ accentColor:ORANGE }} />
                Greeting prefix ("Dear {"{name},"},")
              </label>
            </div>
            <div style={{ marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                <label style={{ fontSize:11, fontWeight:600, color:"#64748b" }}>Message Template</label>
                <div style={{ display:"flex", gap:4 }}>
                  <button type="button" onClick={() => setGuideOpen(true)} style={{ fontSize:10, color:"#64748b", background:"#f1f5f9", border:"1px solid #e2e8f0", borderRadius:6, padding:"2px 8px", cursor:"pointer" }}>Guide</button>
                  <button type="button" onClick={() => setTemplatePickerOpen(true)} style={{ fontSize:10, color:ORANGE, background:"#fff7ed", border:`1px solid ${ORANGE}`, borderRadius:6, padding:"2px 8px", cursor:"pointer", fontWeight:600 }}>+ Templates</button>
                </div>
              </div>
              <textarea value={template} onChange={e => setTemplate(e.target.value.slice(0, MAX_CHARS))}
                placeholder="Write your promotional message here... Use tokens like {name}, {phone}, {storeName}"
                style={{ width:"100%", minHeight:140, padding:12, borderRadius:10, border:"1.5px solid #e2e8f0",
                  fontSize:13, fontFamily:"inherit", outline:"none", resize:"vertical", background:"#f8fafc", color:"#1e293b" }} />
            </div>

            <div style={{ marginBottom:12 }}>
              <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", fontSize:13, color:"#475569" }}>
                <input type="checkbox" checked={attachMenu} onChange={e => setAttachMenu(e.target.checked)} style={{ accentColor:ORANGE }} />
                Attach menu footer
              </label>
              {attachMenu && (
                <textarea value={menuText} onChange={e => setMenuText(e.target.value)}
                  placeholder="Paste your menu text (sent as 2nd message)..."
                  style={{ width:"100%", minHeight:80, padding:10, borderRadius:10, border:"1.5px solid #e2e8f0",
                    fontSize:12, fontFamily:"inherit", outline:"none", resize:"vertical", marginTop:8, background:"#f8fafc" }} />
              )}
            </div>

            <div style={{ marginBottom:12 }}>
              <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", fontSize:13, color:"#475569" }}>
                <input type="checkbox" checked={attachMenuImg} onChange={e => setAttachMenuImg(e.target.checked)} style={{ accentColor:ORANGE }} />
                Attach menu image
              </label>
              {attachMenuImg && (
                <Input placeholder="Menu image URL (from Settings > Bot Aesthetics)"
                  value={menuImgUrl} onChange={e => setMenuImgUrl(e.target.value)}
                  style={{ marginTop:8, fontSize:12, padding:"6px 10px" }} />
              )}
            </div>

            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:11, fontWeight:600, color:"#64748b", display:"block", marginBottom:4 }}>Closing message (optional)</label>
              <textarea value={closingMsg} onChange={e => setClosingMsg(e.target.value)}
                placeholder="Thank you note, signature, etc."
                style={{ width:"100%", minHeight:50, padding:10, borderRadius:10, border:"1.5px solid #e2e8f0",
                  fontSize:12, fontFamily:"inherit", outline:"none", resize:"vertical", background:"#f8fafc" }} />
            </div>

            <div style={{ marginBottom:12 }}>
              <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", fontSize:13, color:"#475569" }}>
                <input type="checkbox" checked={sendStop} onChange={e => setSendStop(e.target.checked)} style={{ accentColor:ORANGE }} />
                Append "Reply STOP to unsubscribe"
              </label>
            </div>

            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:11, fontWeight:600, color:"#64748b", display:"block", marginBottom:4 }}>Attach image (sent before message)</label>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <label className="btn-secondary" style={{ padding:"6px 14px", fontSize:12, cursor:"pointer" }}>
                  <Upload size={12} style={{ marginRight:4, verticalAlign:"middle" }} />Choose Image
                  <input type="file" accept="image/*" onChange={handleMediaUpload} style={{ display:"none" }} />
                </label>
                {mediaFileName && <span style={{ fontSize:11, color:"#94a3b8" }}>{mediaFileName}</span>}
                {mediaDataUrl && (
                  <button type="button" onClick={() => { setMediaDataUrl(null); setMediaFileName(""); }}
                    style={{ fontSize:11, color:"#ef4444", background:"none", border:"none", cursor:"pointer", fontWeight:600 }}>Clear</button>
                )}
              </div>
              {mediaDataUrl && (
                <img src={mediaDataUrl} alt="Preview" style={{ maxWidth:"100%", maxHeight:120, borderRadius:8, marginTop:8, objectFit:"cover" }} />
              )}
            </div>
          </GlassCard>

          {/* Right Column: Recipients & Controls */}
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <GlassCard style={{ padding:20 }}>
              <SectionHeader title="Recipients" />
              <div style={{ marginBottom:12 }}>
                <Select value={recipientFilter} onChange={e => { setRecipientFilter(e.target.value); if (e.target.value !== "upload" && e.target.value !== "custom_csv") { setCsvRecipients([]); setCsvFileName(""); } }}>
                  <option value="all_customers">All consenting customers</option>
                  <option value="recent_30d">Active in last 30 days</option>
                  <option value="custom_csv">Custom CSV upload</option>
                </Select>
              </div>
              {(recipientFilter === "custom_csv" || recipientFilter === "upload") && (
                <div style={{ marginBottom:12 }}>
                  <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:6 }}>
                    <label className="btn-secondary" style={{ padding:"6px 14px", fontSize:12, cursor:"pointer" }}>
                      <Upload size={12} style={{ marginRight:4, verticalAlign:"middle" }} />Upload CSV
                      <input type="file" accept=".csv" onChange={handleCsvUpload} style={{ display:"none" }} />
                    </label>
                    <button type="button" onClick={downloadSampleCsv}
                      style={{ fontSize:11, color:ORANGE, background:"none", border:"none", cursor:"pointer", fontWeight:600 }}>
                      Download sample
                    </button>
                  </div>
                  {csvFileName && <div style={{ fontSize:11, color:"#64748b" }}>{csvFileName} \u2014 {csvRecipients.length} numbers</div>}
                </div>
              )}
              <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 14px", borderRadius:10, background:"#f8fafc", border:"1.5px solid #e2e8f0" }}>
                <Users size={16} color={ORANGE} />
                <span style={{ fontSize:14, fontWeight:700, color:recipientCount > MAX_RECIPIENTS ? "#ef4444" : "#0f172a" }}>{recipientCount}</span>
                <span style={{ fontSize:12, color:"#64748b" }}>recipients</span>
                {recipientCount >= MAX_RECIPIENTS && (
                  <span style={{ marginLeft:"auto", fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:6, background:"#fef3c7", color:"#b45309" }}>CAP {MAX_RECIPIENTS}</span>
                )}
              </div>
            </GlassCard>

            <GlassCard style={{ padding:20 }}>
              <SectionHeader title="Settings" />
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
                <div>
                  <label style={{ fontSize:11, fontWeight:600, color:"#64748b", display:"block", marginBottom:4 }}>Delay (seconds)</label>
                  <Input type="number" min="1" max="30" value={delay} onChange={e => setDelay(e.target.value)}
                    style={{ fontSize:12, padding:"6px 10px" }} />
                </div>
                <div style={{ display:"flex", alignItems:"flex-end" }}>
                  <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", fontSize:12, color:"#475569" }}>
                    <input type="checkbox" checked={generateCoupons} onChange={e => setGenerateCoupons(e.target.checked)} style={{ accentColor:ORANGE }} />
                    Unique coupons
                  </label>
                </div>
              </div>

              <div style={{ marginBottom:12 }}>
                <label style={{ fontSize:11, fontWeight:600, color:"#64748b", display:"block", marginBottom:4 }}>Test phone number</label>
                <div style={{ display:"flex", gap:8 }}>
                  <Input placeholder="10-digit number" value={testPhone} onChange={e => setTestPhone(e.target.value)}
                    style={{ fontSize:12, padding:"6px 10px" }} />
                  <BtnSecondary onClick={sendTest} style={{ fontSize:12, padding:"6px 14px", opacity:sendingTest ? 0.5 : 1 }}>
                    <Send size={12} style={{ marginRight:4 }} />Test
                  </BtnSecondary>
                </div>
              </div>

              <div style={{ marginBottom:12 }}>
                <label style={{ fontSize:11, fontWeight:600, color:"#64748b", display:"block", marginBottom:4 }}>Send timing</label>
                <div style={{ display:"flex", gap:6, marginBottom:8 }}>
                  {[{ id:"now", label:"Send Now" }, { id:"schedule", label:"Schedule" }].map(m => (
                    <div key={m.id} onClick={() => setSendMode(m.id)} className={`pill${sendMode === m.id ? " pill-active" : " pill-inactive"}`} style={{ flex:1, textAlign:"center", fontSize:12 }}>
                      {m.label}
                    </div>
                  ))}
                </div>
                {sendMode === "schedule" && (
                  <div>
                    <Input type="datetime-local" value={scheduleAt} onChange={e => setScheduleAt(e.target.value)}
                      style={{ fontSize:12, padding:"6px 10px", marginBottom:8 }} />
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                      <div>
                        <label style={{ fontSize:10, color:"#94a3b8" }}>Quiet hours start</label>
                        <Input type="number" min="0" max="23" value={quietStart} onChange={e => setQuietStart(e.target.value)}
                          style={{ fontSize:12, padding:"6px 10px" }} />
                      </div>
                      <div>
                        <label style={{ fontSize:10, color:"#94a3b8" }}>Quiet hours end</label>
                        <Input type="number" min="0" max="23" value={quietEnd} onChange={e => setQuietEnd(e.target.value)}
                          style={{ fontSize:12, padding:"6px 10px" }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </GlassCard>

            <div style={{ display:"flex", gap:8 }}>
              <BtnPrimary onClick={launchCampaign} disabled={!canLaunch || launching}
                style={{ flex:1, justifyContent:"center", padding:"12px 18px" }}>
                {sendMode === "schedule" ? <><Clock size={14} style={{ marginRight:6 }} />{launching ? "Scheduling..." : "Schedule Campaign"}</> : <><Send size={14} style={{ marginRight:6 }} />{launching ? "Launching..." : "Launch Campaign"}</>}
              </BtnPrimary>
              <BtnSecondary onClick={() => setPreviewOpen(true)} style={{ padding:"12px 18px" }}>
                <Eye size={14} /> Preview
              </BtnSecondary>
            </div>
          </div>
        </div>
      )}

      {/* ─── ACTIVE PANE ─── */}
      {pane === "active" && (
        <div>
          {activeCampaigns.length === 0 && <EmptyState icon={Send} msg="No active campaigns. Compose your first one above." />}
          {activeCampaigns.map(c => {
            const pct = c.recipients && c.recipients.length ? Math.min(100, Math.round((c.currentIndex || 0) / c.recipients.length * 100)) : 0;
            return (
              <GlassCard key={c.id} style={{ padding:16, marginBottom:12 }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10, flexWrap:"wrap", gap:8 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                    <span style={{ fontSize:14, fontWeight:700, color:"#0f172a" }}>{c.id}</span>
                    <span style={{ padding:"2px 10px", borderRadius:99, fontSize:11, fontWeight:600,
                      color:c.status === "running" ? "#22c55e" : c.status === "scheduled" ? "#3b82f6" : "#f59e0b",
                      background:c.status === "running" ? "#dcfce7" : c.status === "scheduled" ? "#dbeafe" : "#fef3c7" }}>
                      {c.status}
                    </span>
                    {c.runAt && <span style={{ fontSize:11, color:"#94a3b8" }}>scheduled {fmtDate(c.runAt)}</span>}
                    {c.menuText && <span style={{ fontSize:11, color:"#94a3b8" }}>\u2022 menu</span>}
                  </div>
                  <div style={{ display:"flex", gap:6 }}>
                    <button type="button" onClick={() => cloneCampaign(c)} style={{ padding:"4px 10px", borderRadius:8, fontSize:11, fontWeight:600, cursor:"pointer", background:"#f1f5f9", color:"#64748b", border:"1px solid #e2e8f0" }}>Clone</button>
                    {(c.status === "running" || c.status === "paused") && (
                      <button type="button" onClick={() => stopCampaign(c.id)}
                        className="shell-button" style={{ padding:"4px 12px", borderRadius:8, fontSize:11, fontWeight:600, cursor:"pointer",
                          background:"#fef2f2", color:"#ef4444", border:"1px solid #fecaca", transition:"all 0.2s" }}
                        onMouseEnter={e => { e.target.style.background = "#fee2e2"; }}
                        onMouseLeave={e => { e.target.style.background = "#fef2f2"; }}>
                        Stop
                      </button>
                    )}
                  </div>
                </div>
                <div style={{ height:6, borderRadius:3, background:"#f1f5f9", overflow:"hidden", marginBottom:6 }}>
                  <div style={{ height:"100%", width:`${pct}%`, borderRadius:3, background:ORANGE, transition:"width 0.5s" }} />
                </div>
                <div style={{ display:"flex", justifyContent:"space-between" }}>
                  <span style={{ fontSize:11, color:"#94a3b8" }}>{c.currentIndex || 0} / {c.recipients ? c.recipients.length : "?"} \u2022 sent {c.totalSent || 0} \u2022 failed {c.totalFailed || 0}</span>
                  <span style={{ fontSize:11, color:"#94a3b8" }}>{fmtDate(c.lastHeartbeat || c.startedAt)}</span>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* ─── HISTORY PANE ─── */}
      {pane === "history" && (
        <div>
          {historyCampaigns.length === 0 && <EmptyState icon={Clock} msg="Past campaigns will appear here once completed." />}
          {historyCampaigns.map(c => (
            <GlassCard key={c.id} style={{ padding:16, marginBottom:12 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                  <span style={{ fontSize:14, fontWeight:700, color:"#0f172a" }}>{c.id}</span>
                  <span style={{ padding:"2px 10px", borderRadius:99, fontSize:11, fontWeight:600,
                    color:c.status === "done" ? "#22c55e" : "#ef4444",
                    background:c.status === "done" ? "#dcfce7" : "#fee2e2" }}>
                    {c.status}
                  </span>
                  {c.reason && <span style={{ fontSize:11, color:"#94a3b8" }}>{c.reason}</span>}
                </div>
                <div style={{ display:"flex", gap:6 }}>
                  <button type="button" onClick={() => cloneCampaign(c)} style={{ padding:"4px 10px", borderRadius:8, fontSize:11, fontWeight:600, cursor:"pointer", background:"#f1f5f9", color:"#64748b", border:"1px solid #e2e8f0" }}>Clone</button>
                  <button type="button" onClick={() => exportCampaignLog(c.id)} className="btn-secondary"
                    style={{ padding:"4px 12px", fontSize:11, display:"flex", alignItems:"center", gap:4 }}>
                    <Download size={12} />Export CSV
                  </button>
                </div>
              </div>
              <div style={{ fontSize:11, color:"#94a3b8", marginTop:6 }}>
                sent {c.totalSent || 0} \u2022 failed {c.totalFailed || 0} \u2022 completed {fmtDate(c.completedAt || c.startedAt)}
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* ─── PREVIEW MODAL ─── */}
      <Modal open={previewOpen} onClose={() => setPreviewOpen(false)} wide>
        <h3 style={{ fontSize:16, fontWeight:700, color:"#0f172a", marginBottom:12 }}>Message Preview</h3>
        {mediaDataUrl && (
          <img src={mediaDataUrl} alt="Attached" style={{ maxWidth:"100%", maxHeight:160, borderRadius:8, marginBottom:12, objectFit:"cover" }} />
        )}
        <div style={{ whiteSpace:"pre-wrap", background:"#0f172a", color:"#e5e7eb", padding:14, borderRadius:10, fontFamily:"monospace", fontSize:13, lineHeight:1.5 }}>
          {template.trim() ? buildPreviewBody() : "(No message written yet)"}
        </div>
        {attachMenu && menuText.trim() && (
          <div style={{ marginTop:12, paddingTop:12, borderTop:"1px dashed #cbd5e1" }}>
            <div style={{ fontSize:11, color:"#94a3b8", marginBottom:6 }}>\u2014 followed by a 2nd message with the menu \u2014</div>
            <div style={{ whiteSpace:"pre-wrap", background:"#0f172a", color:"#e5e7eb", padding:14, borderRadius:10, fontFamily:"monospace", fontSize:12 }}>
              {menuText}
            </div>
          </div>
        )}
        {attachMenuImg && menuImgUrl && (
          <div style={{ marginTop:12, paddingTop:12, borderTop:"1px dashed #cbd5e1" }}>
            <div style={{ fontSize:11, color:"#94a3b8", marginBottom:6 }}>\u2014 followed by a message with the menu image \u2014</div>
            <img src={menuImgUrl} alt="Menu" style={{ maxWidth:"100%", maxHeight:120, borderRadius:8 }} />
          </div>
        )}
        {!sendStop && <div style={{ fontSize:11, color:"#94a3b8", marginTop:8 }}>STOP footer is OFF</div>}
      </Modal>

      {/* Template Picker Modal */}
      <Modal open={templatePickerOpen} onClose={() => setTemplatePickerOpen(false)} wide>
        <h3 style={{ fontSize:16, fontWeight:700, color:"#0f172a", marginBottom:12 }}>Choose a Template</h3>
        <div style={{ maxHeight:"60vh", overflow:"auto", display:"flex", flexDirection:"column", gap:12 }}>
          {PROMO_TEMPLATES.map(({ cat, items }) => (
            <GlassCard key={cat} style={{ padding:14 }}>
              <div style={{ fontSize:13, fontWeight:700, color:"#0f172a", marginBottom:8 }}>{cat}</div>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {items.map(t => (
                  <div key={t.title} onClick={() => { setTemplate(t.body); setTemplatePickerOpen(false); showToast(`Template "${t.title}" loaded`,"success"); }}
                    style={{ padding:"8px 12px", borderRadius:8, cursor:"pointer", background:"#f8fafc", border:"1px solid #e2e8f0" }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = ORANGE}
                    onMouseLeave={e => e.currentTarget.style.borderColor = "#e2e8f0"}>
                    <div style={{ fontSize:12, fontWeight:600, color:ORANGE, marginBottom:2 }}>{t.title}</div>
                    <div style={{ fontSize:11, color:"#64748b", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{t.body}</div>
                    <div style={{ fontSize:10, color:"#94a3b8", marginTop:2 }}>{t.note}</div>
                  </div>
                ))}
              </div>
            </GlassCard>
          ))}
        </div>
      </Modal>

      {/* Guide Modal */}
      <Modal open={guideOpen} onClose={() => setGuideOpen(false)}>
        <h3 style={{ fontSize:16, fontWeight:700, color:"#0f172a", marginBottom:12 }}>Promotions Guide</h3>
        <div style={{ display:"flex", flexDirection:"column", gap:10, fontSize:13, color:"#475569", lineHeight:1.6 }}>
          <div><strong style={{ color:"#0f172a" }}>1. Compose</strong> — Write your message. Use <code style={{ background:"#f1f5f9", padding:"1px 5px", borderRadius:4, fontSize:12 }}>{`{name}`}</code>, <code style={{ background:"#f1f5f9", padding:"1px 5px", borderRadius:4, fontSize:12 }}>{`{storeName}`}</code>, etc. for personalization.</div>
          <div><strong style={{ color:"#0f172a" }}>2. Recipients</strong> — Choose audience or upload CSV. Customers must have promotional consent.</div>
          <div><strong style={{ color:"#0f172a" }}>3. Preview</strong> — See how the message will look with sample data before sending.</div>
          <div><strong style={{ color:"#0f172a" }}>4. Send Test</strong> — Send to your own number first to verify formatting.</div>
          <div><strong style={{ color:"#0f172a" }}>5. Launch</strong> — Send now or schedule. The bot sends messages with a delay between each.</div>
          <div style={{ background:"#fff7ed", padding:10, borderRadius:8, fontSize:12, color:"#c2410c", marginTop:4 }}>
            <strong>Tips:</strong> Keep messages under 1500 chars. Use the STOP footer (required by WhatsApp policy). Monitor active campaigns progress.
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// RIDER ANALYTICS PAGE
// ═══════════════════════════════════════════════════════════════════════════
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
      logAudit(_bizId, _outletId, "settle_rider_wallet_analytics", { riderId: selectedRider, amount: stats.pendingCash }, getCurrentAdminActor());
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
      logAudit(_bizId, _outletId, "payment_reconciled", { orderId: o.id, amount: o.total }, getCurrentAdminActor());
      showToast("Payment reconciled", "success");
    } catch(e) { showToast("Failed", "error"); }
  }, [showToast]);

  const handleDispute = useCallback(async () => {
    if (!disputeOrder || !disputeReason.trim()) return showToast("Enter a dispute reason", "warning");
    setSaving(true);
    try {
      await update(Outlet(`orders/${disputeOrder.id}`), { disputed: true, disputeReason: disputeReason.trim(), disputedAt: Date.now() });
      logAudit(_bizId, _outletId, "payment_disputed", { orderId: disputeOrder.id, reason: disputeReason.trim() }, getCurrentAdminActor());
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
function ActivityLogPage({ showToast }) {
  const [logs, setLogs] = useState([]);
  const [logFilter, setLogFilter] = useState("all");
  const [logLoading, setLogLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [logSearch, setLogSearch] = useState("");
  const LOG_PAGE_SIZE = 50;
  const [logPage, setLogPage] = useState(1);
  useEffect(() => {
    const r = _bizId && _outletId ? ref(db, `businesses/${_bizId}/outlets/${_outletId}/logs/audit`) : null;
    if (!r) { setLogLoading(false); return; }
    const unsub = onValue(r, snap => {
      const v = snap.val();
      setLogs(v ? Object.entries(v).map(([id, entry]) => ({ id, ...entry })).sort((a, b) => (b.ts || b.clientTs || 0) - (a.ts || a.clientTs || 0)) : []);
      setLogLoading(false);
    });
    return () => off(r, "value", unsub);
  }, []);
  const actionTypes = [...new Set(logs.map(l => l.action))];
  const searched = logSearch ? logs.filter(l => JSON.stringify(l.details || {}).toLowerCase().includes(logSearch.toLowerCase()) || (l.action || "").toLowerCase().includes(logSearch.toLowerCase())) : logs;
  const filteredLogs = logFilter === "all" ? searched : searched.filter(l => l.action === logFilter);
  const logTotalPages = Math.max(1, Math.ceil(filteredLogs.length / LOG_PAGE_SIZE));
  useEffect(() => { setLogPage(1); }, [logFilter, logSearch]);
  const paginatedLogs = filteredLogs.slice((logPage - 1) * LOG_PAGE_SIZE, logPage * LOG_PAGE_SIZE);
  if (logLoading) return <SkeletonPage table={8} />;
  return (
    <div>
      <div style={{ marginBottom:12, display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
        <div onClick={()=>setLogFilter("all")} style={{ padding:"5px 14px", borderRadius:8, cursor:"pointer", fontSize:12, fontWeight:600, color:logFilter==="all"?"white":"#64748b", background:logFilter==="all"?ORANGE:"#f1f5f9" }}>All ({filteredLogs.length})</div>
        {actionTypes.slice(0, 10).map(a => (
          <div key={a} onClick={()=>setLogFilter(a)} style={{ padding:"5px 14px", borderRadius:8, cursor:"pointer", fontSize:12, fontWeight:600, color:logFilter===a?"white":"#64748b", background:logFilter===a?ORANGE:"#f1f5f9" }}>{a}</div>
        ))}
        <input placeholder="Search details..." value={logSearch} onChange={e => setLogSearch(e.target.value)} style={{ marginLeft:"auto", padding:"5px 10px", borderRadius:8, border:"1.5px solid #e2e8f0", fontSize:12, outline:"none", maxWidth:200 }} />
      </div>
      <GlassCard>
        {filteredLogs.length === 0 ? <div style={{ padding:40, textAlign:"center", color:"#94a3b8", fontSize:13 }}>No audit logs found</div> : (
          <div style={{ overflowX:"auto" }}>
            <table className="sheet-table"><thead><tr>
              <th>#</th><th>Action</th><th>Actor</th><th>Details</th><th>Time</th>
            </tr></thead><tbody>
              {paginatedLogs.map((l, i) => (
                <tr key={l.id}>
                  <td className="sheet-row-number">{(logPage - 1) * LOG_PAGE_SIZE + i + 1}</td>
                  <td><span style={{ padding:"2px 8px", borderRadius:6, fontSize:11, fontWeight:600, background:"#fff7ed", color:ORANGE }}>{l.action}</span></td>
                  <td>{l.actor?.email || l.actor?.name || "—"}</td>
                  <td style={{ maxWidth:300, fontSize:12, color:"#64748b", cursor:"pointer" }} onClick={() => setExpandedId(expandedId === l.id ? null : l.id)}>
                    {l.details ? (
                      expandedId === l.id
                        ? <pre style={{ fontSize:11, whiteSpace:"pre-wrap", wordBreak:"break-all", margin:0, background:"#f8fafc", padding:8, borderRadius:6, maxHeight:200, overflow:"auto" }}>{JSON.stringify(l.details, null, 2)}</pre>
                        : <span>{JSON.stringify(l.details).slice(0, 80)}… <span style={{ color:ORANGE, fontWeight:600 }}>▼</span></span>
                    ) : "—"}
                  </td>
                  <td style={{ whiteSpace:"nowrap", fontSize:12, color:"#64748b" }}>{l.clientTs ? new Date(l.clientTs).toLocaleString("en-IN") : "—"}</td>
                </tr>
              ))}
            </tbody></table>
          </div>
        )}
        <Pagination page={logPage} totalPages={logTotalPages} onPageChange={setLogPage} totalItems={filteredLogs.length} pageSize={LOG_PAGE_SIZE} />
      </GlassCard>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE REGISTRY
// ═══════════════════════════════════════════════════════════════════════════
const PAGES = {
  dashboard: DashboardPage, orders: OrdersPage, liveops: LiveOpsPage, kitchen: KitchenPage, tables: TablesPage,
  pos: POSPage, menu: MenuPage, categories: CategoriesPage, discounts: DiscountsPage,
  inventory: InventoryPage, customers: CustomersPage, riders: RidersPage, partners: PartnersPage,
  riderAnalytics: RiderAnalyticsPage,
  analytics: AnalyticsPage, lostsales: LostSalesPage, settlements: SettlementsPage, payments: PaymentsPage,
  activitylog: ActivityLogPage,
  promotions: PromotionsPage, feedback: FeedbackPage, livetracker: LiveTrackerPage, settings: SettingsPage,
};
const VALID_PAGE_IDS = new Set(Object.keys(PAGES));

// ═══════════════════════════════════════════════════════════════════════════
// ROOT APP
// ═══════════════════════════════════════════════════════════════════════════
function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const authUnsubRef = useRef(null);
  const [page, setPage] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.page);
    return VALID_PAGE_IDS.has(saved) ? saved : "dashboard";
  });
  const [dark, setDark] = useState(() => localStorage.getItem(STORAGE_KEYS.theme) === "dark");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(STORAGE_KEYS.sidebar) === "true");
  const [toast, setToast] = useState(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [outletInfo, setOutletInfo] = useState(null);
  const [reauthOpen, setReauthOpen] = useState(false);
  const [reauthBusy, setReauthBusy] = useState(false);
  const [reauthError, setReauthError] = useState("");
  const reauthResolverRef = useRef(null);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [lowStockDismissed, setLowStockDismissed] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(() => localStorage.getItem("fh_notif_enabled") !== "false");
  const [fcmToken, setFcmToken] = useState(null);
  const [isConnected, setIsConnected] = useState(true);
  const [showVersionBanner, setShowVersionBanner] = useState(false);
  const [badgeCounts, setBadgeCounts] = useState({});
  const [guideOpen, setGuideOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [broadcasts, setBroadcasts] = useState([]);
  const [outlets, setOutlets] = useState({});
  const [outletSwitcherOpen, setOutletSwitcherOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const unacknowledgedRef = useRef(new Set());

  const playAlertSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 800; osc.type = "sine";
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.5);
      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2); gain2.connect(ctx.destination);
        osc2.frequency.value = 1000; osc2.type = "sine";
        gain2.gain.setValueAtTime(0.2, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc2.start(ctx.currentTime); osc2.stop(ctx.currentTime + 0.4);
      }, 200);
    } catch (_) {}
  }, []);

  // Version update banner
  useEffect(() => {
    const stored = localStorage.getItem("foodhubbie_admin_version");
    if (!stored) {
      localStorage.setItem("foodhubbie_admin_version", APP_VERSION);
    } else if (stored !== APP_VERSION) {
      localStorage.setItem("foodhubbie_admin_version", APP_VERSION);
      setShowVersionBanner(true);
    }
  }, []);

  // Firebase connection state — uses centralized watcher from firebase.js
  useEffect(() => {
    if (!user) return;
    setIsConnected(isConnected());
    const unsub = onConnectionChange(setIsConnected);
    return unsub;
  }, [user]);

  // Global Escape key — closes all overlays
  useEffect(() => {
    const handler = (e) => {
      if (e.key !== "Escape") return;
      if (reauthOpen) { setReauthOpen(false); setReauthError(""); reauthResolverRef.current?.resolve?.(false); reauthResolverRef.current = null; }
      setSidebarOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [reauthOpen]);

  // New-order alert — sound + OS notification + toast
  useEffect(() => {
    if (!user || !_bizId || !_outletId) return;
    const r = Outlet("orders");
    if (!r) return;
    let initialLoad = true;
    const unsub = onValue(r, (snap) => {
      const v = snap.val();
      if (!v) return;
      if (initialLoad) { initialLoad = false; Object.keys(v).forEach(k => unacknowledgedRef.current.add(k)); return; }
      const newPlaced = Object.keys(v).filter(k => !unacknowledgedRef.current.has(k) && v[k] && v[k].status && ["Placed","New","Pending"].includes(v[k].status));
      if (newPlaced.length > 0) {
        newPlaced.forEach(k => {
          unacknowledgedRef.current.add(k);
          const order = v[k];
          const name = order.customerName || "Customer";
          const total = order.total || 0;
          const items = order.items ? (Array.isArray(order.items) ? order.items.length : typeof order.items === "object" ? Object.keys(order.items).length : 0) : 0;
          const label = `#${order.id?.slice(-6) || k.slice(-6)}`;
          // OS notification
          if (notifEnabled && Notification.permission === "granted") {
            try { new Notification(`New Order ${label}`, { body: `${name} · ₹${Number(total).toLocaleString()} · ${items} item(s)`, icon: "/favicon.svg" }); } catch (_) {}
          }
          // Toast
          showToastRef.current?.(`${label}: ${name} — ₹${Number(total).toLocaleString()} (${items} items)`, "info");
        });
        playAlertSound();
        setBadgeCounts(prev => ({ ...prev, liveops: (prev.liveops || 0) + newPlaced.length }));
      }
    });
    return () => off(r, "value", unsub);
  }, [user, reloadKey, playAlertSound, notifEnabled]);

  // Clear unacknowledged badge when navigating to orders/liveops
  useEffect(() => {
    if (page === "orders" || page === "liveops") {
      setBadgeCounts(prev => ({ ...prev, liveops: 0 }));
    }
  }, [page]);

  // Listen for broadcasts (notifications)
  useEffect(() => {
    if (!user || !_bizId || !_outletId) return;
    const outletRef = Outlet("broadcasts");
    if (!outletRef) return;
    const unsub = onValue(outletRef, snap => {
      const v = snap.val();
      setBroadcasts(v ? Object.entries(v).map(([id, entry]) => ({ id, ...entry })).sort((a, b) => (b.sentAt || 0) - (a.sentAt || 0)) : []);
    });
    return () => off(outletRef, "value", unsub);
  }, [user, reloadKey]);

  // Fetch available outlets for switcher
  useEffect(() => {
    if (!user || !_bizId) return;
    const outletsRef = ref(db, `businesses/${_bizId}/outlets`);
    const unsub = onValue(outletsRef, snap => {
      setOutlets(snap.val() || {});
    });
    return () => off(outletsRef, "value", unsub);
  }, [user, reloadKey]);

  const handleVersionRefresh = useCallback(async () => {
    try {
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.unregister()));
      }
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.filter(k => k.includes("foodhubbie") || k.includes("admin")).map(k => caches.delete(k)));
      }
    } catch (_) { /* best-effort */ }
    window.location.replace(window.location.origin + window.location.pathname + "?v=" + Date.now());
  }, []);

  const handleVersionDismiss = useCallback(() => setShowVersionBanner(false), []);

  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        const auth = await getAuthInstance();
        const unsub = onAuthStateChanged(auth, (u) => {
          setUser((prev) => {
            if ((u?.uid || null) === (prev?.uid || null)) return prev;
            return u;
          });
          setAuthLoading((prev) => prev ? false : prev);
        });
        authUnsubRef.current = unsub;
      } catch (e) {
        console.warn("Auth init failed", e);
        setAuthLoading(false);
      }
    }, 100);
    return () => { clearTimeout(t); if (authUnsubRef.current) { authUnsubRef.current(); authUnsubRef.current = null; } };
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.page, page);
  }, [page]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.theme, dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.sidebar, String(collapsed));
  }, [collapsed]);

  const handleLogin = useCallback(async (event) => {
    event?.preventDefault();
    if (loginLoading) return;
    setLoginError("");
    setLoginLoading(true);
    try {
      const auth = await getAuthInstance();
      await signInWithEmailAndPassword(auth, loginEmail.trim(), loginPassword);
    }
    catch (e) { setLoginError(e.message.replace("Firebase: ", "")); }
    finally { setLoginLoading(false); }
  }, [loginEmail, loginPassword, loginLoading]);

  const handleLogout = useCallback(async () => {
    try {
      const auth = await getAuthInstance();
      await signOut(auth);
    } catch (e) { console.warn("Sign-out failed", e); }
    setUser(null); setOutletInfo(null);
  }, []);

  const unlockWithPassword = useCallback(async (password) => {
    if (!user?.email) return;
    setReauthBusy(true);
    setReauthError("");
    try {
      const auth = await getAuthInstance();
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(auth, credential);
      setReauthOpen(false);
      setReauthError("");
      reauthResolverRef.current?.resolve?.(true);
      reauthResolverRef.current = null;
    } catch (e) {
      const msg = (e?.message || "Re-authentication failed").replace("Firebase: ", "");
      setReauthError(msg);
      reauthResolverRef.current?.resolve?.(false);
      reauthResolverRef.current = null;
    } finally {
      setReauthBusy(false);
    }
  }, [user]);

  const cancelReauth = useCallback(async () => {
    setReauthOpen(false);
    setReauthError("");
    reauthResolverRef.current?.resolve?.(false);
    reauthResolverRef.current = null;
    await handleLogout();
  }, [handleLogout]);

  // Promise-based reauth gate. Pages can call this before destructive ops
  // (delete rider/category/partner, reset password, etc.). Resolves to true
  // if reauth succeeded, false otherwise (signed out or password wrong).
  const requireAdminReauth = useCallback(() => {
    return new Promise((resolve) => {
      if (!user?.email) { resolve(false); return; }
      reauthResolverRef.current = { resolve };
      setReauthError("");
      setReauthOpen(true);
    });
  }, [user]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.__foodhubbieRequireReauth = requireAdminReauth;
    }
    return () => {
      if (typeof window !== "undefined") {
        delete window.__foodhubbieRequireReauth;
      }
    };
  }, [requireAdminReauth]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const snap = await get(ref(db, "admins/" + user.uid));
        if (snap.exists()) {
          const d = snap.val();
          _bizId = d.businessId; _outletId = d.outletId;
          setOutletContext(d.businessId, d.outletId);
          startBotStatusWatcher();
          setOutletInfo({ name: d.outletName || "", address: d.outletAddress || "" });
          setReloadKey(k => k + 1);
        }
      } catch (e) { console.warn("Failed to fetch admin info", e); }
    })();
  }, [user]);

  // FCM init + notification permission + token storage
  useEffect(() => {
    if (!user) return;
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "granted" || notifEnabled) {
      if (Notification.permission !== "granted") {
        Notification.requestPermission().catch(() => {});
      }
    }
    (async () => {
      try {
        const supported = await isMessagingSupported();
        if (!supported) return;
        const messaging = getMessaging();
        const token = await getToken(messaging, { vapidKey: "BFGSVdKCs_7sXhG5NhFPBTSxoBbsckYqgFfOZQ5D9AiBPL0N10CqQOYc1Zv26cMjxpWCgVh8XIKHZP_YIEbr8T8" });
        if (token) {
          setFcmToken(token);
          await update(ref(db, `admins/${user.uid}`), { fcmToken: token });
        }
      } catch (e) {
        if (e.code === "messaging/permission-blocked") {
          setNotifEnabled(false);
          localStorage.setItem("fh_notif_enabled", "false");
        }
      }
    })();
  }, [user, notifEnabled]);

  // Foreground FCM messages — show toast
  useEffect(() => {
    if (!user || !notifEnabled) return;
    let unsub = null;
    (async () => {
      try {
        const supported = await isMessagingSupported();
        if (!supported) return;
        const messaging = getMessaging();
        unsub = onFcmMessage(messaging, (payload) => {
          const title = payload.notification?.title || "FoodHubbie";
          const body = payload.notification?.body || "";
          showToastRef.current?.(`${title}: ${body}`, "info");
          if (Notification.permission === "granted") {
            new Notification(title, { body, icon: "/favicon.svg" });
          }
        });
      } catch (_) {}
    })();
    return () => { if (unsub) unsub(); };
  }, [user, notifEnabled]);

  useEffect(() => {
    if (!user || !_bizId || !_outletId) {
      return;
    }
    const counts = { inv: 0, dish: 0 };
    const mergeCounts = () => {
      const newCount = counts.inv + counts.dish;
      setLowStockCount(prev => {
        if (prev === 0 && newCount > 0 && notifEnabled && Notification.permission === "granted") {
          try { new Notification("Stock Alert", { body: `${newCount} item(s) need attention — stock is low or out.`, icon: "/favicon.svg" }); } catch (_) {}
        }
        return newCount;
      });
    };
    const invRef = ref(db, `businesses/${_bizId}/outlets/${_outletId}/inventory`);
    const dishRef = ref(db, `businesses/${_bizId}/outlets/${_outletId}/dishes`);
    const invUnsub = onValue(invRef, (snap) => {
      const v = snap.val() || {};
      counts.inv = Object.keys(v).filter(k => {
        const it = v[k];
        const stock = Number(it && it.stock) || 0;
        const threshold = Number(it && it.threshold) || 0;
        return threshold > 0 && stock <= threshold;
      }).length;
      mergeCounts();
    }, () => {});
    const dishUnsub = onValue(dishRef, (snap) => {
      const v = snap.val() || {};
      counts.dish = Object.keys(v).filter(k => {
        const d = v[k];
        if (!d) return false;
        if (typeof d.stock === 'boolean') return d.stock === false;
        if (d.stock === undefined || d.stock === null) return false;
        return (Number(d.stock) || 0) <= 0;
      }).length;
      mergeCounts();
    }, () => {});
    return () => { off(invRef, "value", invUnsub); off(dishRef, "value", dishUnsub); };
  }, [user, reloadKey, notifEnabled]);

  useEffect(() => {
    if (lowStockCount > 0) setLowStockDismissed(false);
  }, [lowStockCount]);

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3500);
  }, []);
  const showToastRef = useRef(showToast);
  useEffect(() => { showToastRef.current = showToast; }, [showToast]);

  if (authLoading) {
    return (
      <div style={{ minHeight:"100vh", display:"grid", placeItems:"center", background:"radial-gradient(at 0% 0%, rgba(232, 73, 8,0.05) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(59,130,246,0.05) 0px, transparent 50%), #f8fafc", color:"#1e293b" }}>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:16 }}>
          <div style={{ width:52, height:52, borderRadius:16, background:`linear-gradient(135deg,${ORANGE},#D94400)`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 12px 28px rgba(232, 73, 8,0.25)" }}>
            <Store size={24} color="white" />
          </div>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:18, fontWeight:800, color:"#0f172a", fontFamily:"'Outfit', sans-serif" }}>FoodHubbie Admin</div>
            <div style={{ fontSize:13, color:"#64748b", marginTop:4 }}>Preparing your workspace...</div>
          </div>
          <div aria-label="Loading dashboard" role="status" style={{ width:36, height:36, border:"3px solid rgba(232, 73, 8,0.15)", borderTopColor:ORANGE, borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", padding: 24, gap: 40,
        background: "linear-gradient(135deg, #E84908 0%, #D94400 50%, #C43800 100%)",
        position: "relative", overflow: "hidden"
      }}>
        {/* Corner-stitch decorative elements */}
        <div style={{ position:"absolute", top:-12, left:-12, width:48, height:48, border:"3px solid rgba(255,255,255,0.15)", borderRadius:4, transform:"rotate(45deg)", opacity:0.5 }} />
        <div style={{ position:"absolute", top:-12, right:-12, width:48, height:48, border:"3px solid rgba(255,255,255,0.15)", borderRadius:4, transform:"rotate(-45deg)", opacity:0.5 }} />
        <div style={{ position:"absolute", bottom:-12, left:-12, width:48, height:48, border:"3px solid rgba(255,255,255,0.15)", borderRadius:4, transform:"rotate(-45deg)", opacity:0.5 }} />
        <div style={{ position:"absolute", bottom:-12, right:-12, width:48, height:48, border:"3px solid rgba(255,255,255,0.15)", borderRadius:4, transform:"rotate(45deg)", opacity:0.5 }} />
        {/* Top-right accent */}
        <div style={{ position:"absolute", top:-60, right:-60, width:160, height:160, borderRadius:"50%", background:"rgba(255,255,255,0.04)", pointerEvents:"none" }} />
        <div style={{ position:"absolute", bottom:-80, left:-80, width:200, height:200, borderRadius:"50%", background:"rgba(255,255,255,0.03)", pointerEvents:"none" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 14, position:"relative", zIndex:1 }}>
          <div style={{ width: 60, height: 60, borderRadius: 18, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)" }}>
            <Store size={34} color="white" />
          </div>
          <div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "white", letterSpacing: -0.5, fontFamily: "'Outfit', sans-serif" }}>FoodHubbie</div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>Admin Dashboard</div>
          </div>
        </div>
        <div className="glass-premium" style={{ width: "100%", maxWidth: 400, padding: 32, position:"relative", zIndex:1 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "#1e293b", fontFamily: "'Outfit', sans-serif" }}>Welcome Back</h2>
            <div className="animate-pulse-live" style={{ width:8, height:8, borderRadius:"50%", background:"#22c55e" }} />
          </div>
          <p style={{ fontSize: 14, color: "#64748b", marginBottom: 24 }}>Sign in to manage your outlet</p>
          {loginError && <div role="alert" style={{ padding: "10px 14px", borderRadius: 10, marginBottom: 16, background: "#fef2f2", color: "#ef4444", fontSize: 13, fontWeight: 500 }}>{loginError}</div>}
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <input aria-label="Email address" autoComplete="email" inputMode="email" placeholder="Email address" value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
              style={{ padding: "14px 16px", borderRadius: 12, border: "1.5px solid #e2e8f0", fontSize: 14, color: "#1e293b", background: "#fff", outline:"none", transition:"border-color 0.2s, box-shadow 0.2s" }}
              onFocus={e => { e.target.style.borderColor = ORANGE; e.target.style.boxShadow = "0 0 0 3px rgba(232, 73, 8,0.15)"; e.target.style.borderStyle = "dashed"; }}
              onBlur={e => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; e.target.style.borderStyle = "solid"; }} />
            <input aria-label="Password" autoComplete="current-password" type="password" placeholder="Password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)}
              style={{ padding: "14px 16px", borderRadius: 12, border: "1.5px solid #e2e8f0", fontSize: 14, color: "#1e293b", background: "#fff", outline:"none", transition:"border-color 0.2s, box-shadow 0.2s" }}
              onFocus={e => { e.target.style.borderColor = ORANGE; e.target.style.boxShadow = "0 0 0 3px rgba(232, 73, 8,0.15)"; e.target.style.borderStyle = "dashed"; }}
              onBlur={e => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; e.target.style.borderStyle = "solid"; }} />
            <BtnPrimary type="submit" disabled={loginLoading} style={{ width: "100%", padding: "14px 0", fontSize: 15, borderRadius: 12, position:"relative" }}>
              {loginLoading ? <span style={{ display:"inline-flex", alignItems:"center", gap:4 }}>Signing In<span className="loading-dots" /></span> : "Sign In"}
            </BtnPrimary>
          </form>
        </div>
      </div>
    );
  }

  const PageComponent = PAGES[page] || DashboardPage;
  const bg = dark ? "#0f172a" : "#f8fafc";
  const sideBg = dark ? "#1e293b" : "#ffffff";
  const textCol = dark ? "#f1f5f9" : "#1e293b";

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: bg, color: textCol, transition: "background 0.3s, color 0.3s" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;900&family=Inter:wght@400;500;600&display=swap');
        * { box-sizing: border-box; font-family: 'Inter', sans-serif; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #E8490830; border-radius: 99px; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 39, background: "rgba(0,0,0,0.4)" }} />}
      <ReauthModal
        open={reauthOpen}
        busy={reauthBusy}
        error={reauthError}
        onConfirm={unlockWithPassword}
        onCancel={cancelReauth}
      />
      <PageGuideModal open={guideOpen} page={page} onClose={()=>setGuideOpen(false)} />
      {!isConnected && (
        <div role="alert" style={{ position:"fixed", top:0, left:0, right:0, zIndex:99999, background:"#dc2626", color:"white", padding:"10px 16px", display:"flex", alignItems:"center", justifyContent:"center", gap:8, fontSize:13, fontWeight:500, animation:"slideDown 0.3s ease-out" }}>
          <WifiOff size={16} /> No internet connection — changes may not save
          <button type="button" onClick={() => window.location.reload()} style={{ marginLeft:12, padding:"4px 14px", borderRadius:6, background:"rgba(255,255,255,0.2)", color:"white", border:"1px solid rgba(255,255,255,0.4)", cursor:"pointer", fontSize:12, fontWeight:600 }}>Retry</button>
        </div>
      )}
      {showVersionBanner && (
        <div role="alert" style={{ position:"fixed", top:isConnected?0:44, left:0, right:0, zIndex:99998, background:"linear-gradient(135deg,#f59e0b,#d97706)", color:"white", padding:"10px 16px", display:"flex", alignItems:"center", justifyContent:"center", gap:10, fontSize:13, fontWeight:500, animation:"slideDown 0.3s ease-out", flexWrap:"wrap" }}>
          <AlertTriangle size={16} /> A new version is available — click Refresh to update.
          <button type="button" onClick={handleVersionRefresh} style={{ padding:"4px 12px", borderRadius:8, border:"1px solid rgba(255,255,255,0.4)", background:"rgba(255,255,255,0.15)", color:"white", fontSize:12, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:4 }}><RefreshCw size={13} /> Refresh</button>
          <button type="button" onClick={handleVersionDismiss} aria-label="Dismiss" style={{ padding:"2px 8px", borderRadius:6, border:"none", background:"transparent", color:"rgba(255,255,255,0.7)", cursor:"pointer", fontSize:16, lineHeight:1 }}>×</button>
        </div>
      )}
      <aside style={{ position:"fixed", top:0, left:0, bottom:0, zIndex:40, width:collapsed?56:224, background:sideBg, borderRight:dark?"1px solid #334155":"1px solid rgba(0,0,0,0.06)", display:"flex", flexDirection:"column", transition:"width 0.3s, transform 0.3s, background 0.3s", overflow:"hidden", transform:sidebarOpen?"translateX(0)":"" }} className="sidebar">
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:collapsed?"16px 0":"16px 18px", borderBottom:dark?"1px solid #334155":"1px solid rgba(0,0,0,0.06)", justifyContent:collapsed?"center":"flex-start", flexShrink:0 }}>
          <div style={{ width:32, height:32, borderRadius:10, background:`linear-gradient(135deg,${ORANGE},#D94400)`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><Store size={16} color="white" /></div>
          {!collapsed && <div><div style={{ fontSize:18, fontWeight:900, letterSpacing:-0.5, background:`linear-gradient(135deg,${ORANGE},#d95a1a)`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", lineHeight:1.2 }}>FoodHubbie</div><div style={{ fontSize:10, fontWeight:700, color:"#94a3b8", letterSpacing:0.5, textTransform:"uppercase", marginTop:2 }}>Admin Panel</div></div>}
        </div>
        <button type="button" onClick={()=>setCollapsed(!collapsed)} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:"8px 0", cursor:"pointer", color:"#94a3b8", borderBottom:dark?"1px solid #334155":"1px solid rgba(0,0,0,0.06)", background:"transparent", borderTop:0, borderLeft:0, borderRight:0, flexShrink:0 }} className="collapse-toggle shell-button">{collapsed?<ChevronRight size={16}/>:<ChevronLeft size={16}/>}</button>
        {outletInfo&&!collapsed&&<div style={{ position:"relative", margin:"8px 12px", padding:"10px 12px", borderRadius:10, background:dark?"#0f172a":"#fff7ed", border:dark?"1px solid #334155":"1px solid rgba(232, 73, 8,0.15)", cursor:"pointer" }} onClick={() => setOutletSwitcherOpen(!outletSwitcherOpen)}>
          <div style={{ fontSize:11, color:"#94a3b8", fontWeight:600, textTransform:"uppercase", letterSpacing:0.5, marginBottom:2 }}>OUTLET <ChevronDown size={10} style={{ marginLeft:4 }} /></div>
          <div style={{ fontSize:13, fontWeight:600, color:ORANGE }}>{outletInfo.name}</div>
          {outletInfo.address&&<div style={{ fontSize:11, color:"#94a3b8", marginTop:2, display:"flex", alignItems:"center", gap:4 }}><MapPin size={10}/> {outletInfo.address}</div>}
          {outletSwitcherOpen && (
            <div style={{ position:"absolute", left:0, right:0, top:"100%", marginTop:4, zIndex:50, background:"white", borderRadius:10, boxShadow:"0 12px 40px rgba(0,0,0,0.15)", border:"1px solid #e2e8f0", maxHeight:200, overflow:"auto" }}>
              {Object.keys(outlets).filter(k => k !== _outletId).map(k => (
                <div key={k} onClick={async (e) => { e.stopPropagation(); setOutletSwitcherOpen(false); const snap = await get(ref(db, `businesses/${_bizId}/outlets/${k}`)); const d = snap.val(); if (d) { _outletId = k; setOutletContext(_bizId, _outletId); startBotStatusWatcher(); setOutletInfo({ name: d.name || k, address: d.address || "" }); setReloadKey(r => r + 1); showToast(`Switched to ${d.name || k}`,"success"); } }}
                  style={{ padding:"8px 12px", fontSize:12, fontWeight:500, color:"#475569", cursor:"pointer", borderBottom:"1px solid #f1f5f9" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  {outlets[k]?.name || k}
                </div>
              ))}
              {Object.keys(outlets).filter(k => k !== _outletId).length === 0 && <div style={{ padding:"8px 12px", fontSize:12, color:"#94a3b8" }}>No other outlets</div>}
            </div>
          )}
        </div>}
        {outletInfo&&collapsed&&<div style={{ display:"flex", justifyContent:"center", padding:"8px 0" }}><Avatar name={outletInfo.name} size={28}/></div>}
        <nav style={{ flex:1, overflow:"auto", padding:collapsed?"4px 0":"6px 10px" }}>
          {NAV_GROUPS.map(group => (
            <div key={group.label} style={{ marginBottom:collapsed?2:4 }}>
              {!collapsed&&<div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:1.2, color:"#94a3b8", padding:"10px 14px 4px", pointerEvents:"none" }}>{group.label}</div>}
              {group.items.map((item, idx) => {
                const Icon = item.icon; const active = page === item.id;
                return <div key={item.id} style={{ position:"relative" }}>
                  {active && !collapsed && <div style={{ position:"absolute", left:0, top:8, bottom:8, width:4, background:ORANGE, borderRadius:"0 4px 4px 0", boxShadow:"0 0 8px rgba(232, 73, 8,0.25)", zIndex:1 }} />}
                  <button type="button" onClick={()=>{setPage(item.id);setSidebarOpen(false);}} aria-current={active ? "page" : undefined} style={{ display:"flex", alignItems:"center", gap:10, padding:collapsed?"10px 0":"9px 14px", margin:collapsed?"2px 0":"1px 0", borderRadius:10, cursor:"pointer", justifyContent:collapsed?"center":"flex-start", background:active?(dark?"rgba(232, 73, 8,0.15)":"rgba(232, 73, 8,0.08)"):"transparent", color:active?ORANGE:(dark?"#cbd5e1":"#475569"), transition:"all 0.15s", border:0, width:"100%", textAlign:"left", fontWeight:active?600:500, fontSize:13 }} title={collapsed?item.label:undefined} className="shell-button"
                    onMouseEnter={e => { if(!active) { e.currentTarget.style.background = "rgba(0,0,0,0.05)"; e.currentTarget.style.transform = "translateX(3px)"; }}}
                    onMouseLeave={e => { if(!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.transform = "none"; }}}>
                    <Icon size={collapsed?20:18} style={{ flexShrink:0, color:active?ORANGE:(dark?"#94a3b8":"#64748b"), transition:"color 0.15s" }} />
                    {!collapsed&&<><span style={{ fontSize:13, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{item.label}</span>{(badgeCounts[item.id] != null ? badgeCounts[item.id] : item.badge) != null && <span style={{ marginLeft:"auto", fontSize:10, fontWeight:700, padding:"1px 7px", borderRadius:99, background:active?"rgba(232, 73, 8,0.2)":ORANGE, color:active?ORANGE:"white" }}>{badgeCounts[item.id] != null ? badgeCounts[item.id] : item.badge}</span>}</>}
                  </button>
                </div>;
              })}
            </div>
          ))}
        </nav>
        <div style={{ borderTop:dark?"1px solid #334155":"1px solid rgba(0,0,0,0.06)", padding:collapsed?"8px 0":"10px 14px", display:"flex", flexDirection:"column", gap:2 }}>
          <button type="button" onClick={()=>setDark(!dark)} style={{ display:"flex", alignItems:"center", gap:10, padding:collapsed?"10px 0":"8px 12px", borderRadius:10, cursor:"pointer", justifyContent:collapsed?"center":"flex-start", color:dark?"#cbd5e1":"#475569", background:"transparent", border:0, width:"100%", fontSize:13 }} title={collapsed?"Toggle theme":undefined} aria-label="Toggle theme" className="shell-button"
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,0,0,0.04)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
            {dark?<Sun size={18}/>:<Moon size={18}/>}
            {!collapsed&&<span style={{ fontWeight:500 }}>{dark?"Light Mode":"Dark Mode"}</span>}
          </button>
          <button type="button" onClick={handleLogout} style={{ display:"flex", alignItems:"center", gap:10, padding:collapsed?"10px 0":"8px 12px", borderRadius:10, cursor:"pointer", justifyContent:collapsed?"center":"flex-start", color:"#ef4444", background:"transparent", border:0, width:"100%", fontSize:13 }} title={collapsed?"Logout":undefined} className="shell-button"
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.08)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
            <LogOut size={18}/>
            {!collapsed&&<span style={{ fontWeight:500 }}>Logout</span>}
          </button>
        </div>
      </aside>
      <div style={{ flex:1, display:"flex", flexDirection:"column", marginLeft:collapsed?56:224, transition:"margin-left 0.3s", minHeight:"100vh" }} className="main-wrapper">
        <header style={{ position:"sticky", top:0, zIndex:30, display:"flex", alignItems:"center", gap:12, padding:"14px 24px", background:dark?"#0f172a":"white", borderBottom:dark?"1px solid #1e293b":"1px solid rgba(0,0,0,0.06)" }}>
          <button type="button" className="hamburger-mobile shell-button" onClick={()=>setSidebarOpen(true)} aria-label="Open navigation" style={{ cursor:"pointer", color:dark?"#f1f5f9":"#475569", background:"transparent", border:0, padding:6, borderRadius:8 }}><Menu size={22}/></button>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:20, fontWeight:700, color:dark?"#f1f5f9":"#0f172a", fontFamily:"'Outfit', sans-serif" }}>{PAGE_TITLES[page]||"Dashboard"}</div>
            {outletInfo&&<div style={{ fontSize:12, color:"#94a3b8", display:"flex", alignItems:"center", gap:4, marginTop:2 }}><Store size={12}/> {outletInfo.name}</div>}
          </div>
          <button type="button" onClick={()=>setGuideOpen(true)} title="Page guide" className="shell-button" style={{ cursor:"pointer", color:dark?"#94a3b8":"#64748b", background:"transparent", border:0, padding:"2px 6px", borderRadius:8, fontSize:16, fontWeight:700, lineHeight:1 }}>?</button>
           {notifOpen && <div onClick={() => setNotifOpen(false)} style={{ position:"fixed", inset:0, zIndex:49 }} />}
          <button type="button" aria-label="Open notifications" className="shell-button" style={{ position:"relative", cursor:"pointer", color:dark?"#94a3b8":"#64748b", background:"transparent", border:0, padding:6, borderRadius:8, zIndex:notifOpen?51:"auto" }} onClick={() => setNotifOpen(!notifOpen)}><Megaphone size={20}/><div style={{ position:"absolute", top:4, right:4, width:8, height:8, borderRadius:"50%", background:"#ef4444" }}/></button>
           {notifOpen && (
             <div style={{ position:"absolute", right:0, top:"100%", marginTop:8, zIndex:50, width:340, maxHeight:320, background:"white", borderRadius:12, boxShadow:"0 12px 40px rgba(0,0,0,0.15)", border:"1px solid #e2e8f0", overflow:"hidden" }}>
               <div style={{ padding:"12px 16px", borderBottom:"1px solid #f1f5f9", fontSize:13, fontWeight:600, color:"#475569", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                 Notifications {broadcasts.length > 0 && <span style={{ padding:"2px 8px", borderRadius:10, background:"#fef3c7", color:"#b45309", fontSize:11, fontWeight:600 }}>{broadcasts.length}</span>}
                 <button type="button" onClick={() => setNotifOpen(false)} style={{ background:"transparent", border:"none", cursor:"pointer", color:"#94a3b8", fontSize:16, lineHeight:1 }}>×</button>
               </div>
               <div style={{ maxHeight:260, overflow:"auto" }}>
                 {broadcasts.length === 0 ? <div style={{ padding:40, textAlign:"center", color:"#94a3b8", fontSize:12 }}>No notifications</div> : broadcasts.slice(0,10).map(b => (
                   <div key={b.id} style={{ padding:"12px 16px", borderBottom:"1px solid #f9fafb", fontSize:12, cursor:"pointer", background: b.audience === "vip" ? "#fff7ed" : "transparent", borderLeft:b.audience === "vip"?"4px solid #f97316":"none" }} onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"} onMouseLeave={e => e.currentTarget.style.background = b.audience === "vip" ? "#fff7ed" : "transparent"}>
                     <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:4 }}>
                       <div style={{ fontWeight:600, color:"#0f172a" }}>{b.title || "Notification"}</div>
                       <div style={{ fontSize:10, color:"#94a3b8" }}>{new Date(b.sentAt || b.createdAt || Date.now()).toLocaleString("en-IN", {hour12:false})}</div>
                     </div>
                     <div style={{ color:"#64748b", lineHeight:1.4 }}>{b.body}</div>
                   </div>
                 ))}
               </div>
               <div style={{ padding:"12px 16px", borderTop:"1px solid #f1f5f9", textAlign:"center", fontSize:11, color:"#64748b", cursor:"pointer" }} onClick={() => { setNotifOpen(false); setPage("notifications"); }}>View all notifications →</div>
             </div>
           )}
          <div title={isConnected ? "Connected" : "Disconnected"} style={{ width:10, height:10, borderRadius:"50%", background:isConnected?"#22c55e":"#ef4444", boxShadow:isConnected?"0 0 8px rgba(34,197,94,0.5)":"0 0 8px rgba(239,68,68,0.5)", transition:"background 0.3s", animation:isConnected?"none":"pulse 2s infinite" }}/>
          {outletInfo&&<Avatar name={outletInfo.name} size={32}/>}
        </header>
        <main style={{ flex:1, padding:"24px 24px 88px", overflow:"auto" }}>
          {lowStockCount > 0 && !lowStockDismissed && (
            <div role="status" className="glass-card" style={{
              display:"flex", alignItems:"center", gap:12,
              padding:"10px 16px", marginBottom:16,
              background:"#fef3c7", border:"1px solid #fcd34d", color:"#92400e"
            }}>
              <AlertTriangle size={18} color="#b45309" />
              <div style={{ flex:1, fontSize:13, fontWeight:500 }}>
                <strong>{lowStockCount} item{lowStockCount === 1 ? "" : "s"}</strong>{" "}
                need attention — stock is low or out.
              </div>
              <button type="button" onClick={() => setPage("inventory")} className="shell-button" style={{ padding:"4px 12px", borderRadius:8, border:"1.5px solid #b45309", background:"transparent", color:"#b45309", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                View Inventory
              </button>
              <button type="button" onClick={() => setLowStockDismissed(true)} aria-label="Dismiss" className="shell-button" style={{ padding:4, borderRadius:6, border:0, background:"transparent", color:"#b45309", cursor:"pointer" }}>
                <X size={14} />
              </button>
            </div>
          )}
          <div className="page-content">{PageComponent && <PageComponent key={reloadKey} showToast={showToast} outletInfo={outletInfo} notifEnabled={notifEnabled} setNotifEnabled={setNotifEnabled} fcmToken={fcmToken} requireAdminReauth={requireAdminReauth} setPage={setPage} setSelOrder={setSelOrder} />}</div>
        </main>
      </div>
      <div className="mobile-bottom-nav" style={{ position:"fixed", bottom:0, left:0, right:0, zIndex:30, display:"flex", alignItems:"center", justifyContent:"space-around", padding:"6px 0 env(safe-area-inset-bottom,6px)", background:dark?"#1e293b":"rgba(255,255,255,0.9)", backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)", borderTop:dark?"1px solid #334155":"1px solid rgba(0,0,0,0.06)" }}>
        {MOBILE_NAV.map(item => {
          const Icon = item.icon; const active = page === item.id;
          return <button type="button" key={item.id} onClick={()=>setPage(item.id)} aria-current={active ? "page" : undefined} className="shell-button" style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2, padding:"4px 8px", cursor:"pointer", position:"relative", color:active?ORANGE:(dark?"#64748b":"#94a3b8"), background:"transparent", border:0, minWidth:54, transition:"color 0.15s" }}>
            <Icon size={20}/><span style={{ fontSize:10, fontWeight:active?600:500 }}>{item.label}</span>
            {active&&<div style={{ position:"absolute", top:-6, width:16, height:3, borderRadius:"0 0 3px 3px", background:ORANGE }}/>}
          </button>;
        })}
      </div>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)} />}
    </div>
  );
}

export default App;
