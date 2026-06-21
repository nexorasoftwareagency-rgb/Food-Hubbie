import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
const QR_BASE = "https://foodhubbie-menu.web.app/";
import { Grid3x3, Plus, QrCode, Printer, Download, Search, X, ChevronRight, ChevronLeft, Trash2, Edit3, Ban, Check, CheckCheck, Receipt, ExternalLink, Clock, Users, DollarSign, AlertTriangle, WifiOff, Bell } from "lucide-react";
import { get, Outlet, getCurrentOutletContext, onValue, off, set, update, push, remove, runTransaction, serverTimestamp } from "./firebase";
import { ORANGE, COLORS, ORD_ST } from "./constants";
import { fmt, esc } from "./utils";
import { GlassCard, StatCard } from "./components";



const TABLE_STATUS_META = {
  free: { label: "Free", color: COLORS.success, bg: "#dcfce7" },
  occupied: { label: "Occupied", color: "#3b82f6", bg: "#dbeafe" },
  billing: { label: "Billing", color: COLORS.warning, bg: "#fef3c7" },
  disabled: { label: "Disabled", color: COLORS.muted, bg: "#f1f5f9" },
};

function secureToken() {
  const bytes = new Uint8Array(12);
  (window.crypto || window.msCrypto).getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(36)).join("").slice(0, 16).toUpperCase();
}

function TablesPage({ showToast, outletInfo }) {
  const [tables, setTables] = useState({});
  const [sessions, setSessions] = useState({});
  const [orders, setOrders] = useState({});
  const [drawerTableId, setDrawerTableId] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editNumber, setEditNumber] = useState("");
  const [editCapacity, setEditCapacity] = useState(4);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrTable, setQrTable] = useState(null);
  const [qrDataUri, setQrDataUri] = useState(null);
  const [paymentModal, setPaymentModal] = useState({ show: false, tableId: null, total: 0 });
  const paymentDataRef = useRef({ tableId: null, total: 0 });
  const [kdsTab, setKdsTab] = useState("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [tableRequests, setTableRequests] = useState({});
  const tablesLoaded = useRef(false);
  const sessionsLoaded = useRef(false);
  const ordersLoaded = useRef(false);

  useEffect(() => {
    const ctx = getCurrentOutletContext();
    if (!ctx.businessId || !ctx.outletId) return;
    const tRef = Outlet("tables");
    const unsub = onValue(tRef, snap => { setTables(snap.val() || {}); tablesLoaded.current = true; });
    return () => { off(tRef, "value", unsub); };
  }, [outletInfo]);

  useEffect(() => {
    const ctx = getCurrentOutletContext();
    if (!ctx.businessId || !ctx.outletId) return;
    const sRef = Outlet("tableSessions");
    if (!sRef) return;
    const unsub = onValue(sRef, snap => { setSessions(snap.val() || {}); sessionsLoaded.current = true; });
    return () => { off(sRef, "value", unsub); };
  }, [outletInfo]);

  useEffect(() => {
    const ctx = getCurrentOutletContext();
    if (!ctx.businessId || !ctx.outletId) return;
    const oRef = Outlet("orders");
    if (!oRef) return;
    const unsub = onValue(oRef, snap => { setOrders(snap.val() || {}); ordersLoaded.current = true; });
    return () => { off(oRef, "value", unsub); };
  }, [outletInfo]);

  useEffect(() => {
    const ctx = getCurrentOutletContext();
    if (!ctx.businessId || !ctx.outletId) return;
    const r = Outlet("tableRequests");
    if (!r) return;
    const unsub = onValue(r, snap => { setTableRequests(snap.val() || {}); });
    return () => { off(r, "value", unsub); };
  }, [outletInfo]);

  const REQUEST_TYPE_META = {
    waiter: { label: "Call Waiter" },
    water: { label: "Request Water" },
    bill: { label: "Request Bill" },
    clean: { label: "Clean Table" },
  };

  const pendingRequests = useMemo(() => Object.entries(tableRequests).map(([id, r]) => ({ id, ...r })).filter(r => r.status !== "resolved").sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)), [tableRequests]);

  const resolveRequest = useCallback(async (reqId) => {
    try {
      await update(Outlet(`tableRequests/${reqId}`), { status: "resolved", resolvedAt: serverTimestamp() });
      showToast("Request resolved", "success");
    } catch (e) {
      showToast("Could not resolve request: " + (e?.message || e), "error");
    }
  }, [showToast]);

  const tableList = useMemo(() => Object.entries(tables).map(([id, t]) => ({ id, ...t })).sort((a, b) => Number(a.number) - Number(b.number)), [tables]);

  const tableCounts = useMemo(() => {
    const counts = { free: 0, occupied: 0, billing: 0, disabled: 0 };
    tableList.forEach(t => { if (counts[t.status] !== undefined) counts[t.status]++; });
    return counts;
  }, [tableList]);

  const activeSessions = useMemo(() => Object.values(sessions).filter(s => s.status !== "closed"), [sessions]);

  const kpis = useMemo(() => ({
    free: tableCounts.free, occupied: tableCounts.occupied, billing: tableCounts.billing,
    sessionCount: activeSessions.length,
    guestCount: activeSessions.reduce((s, sess) => s + (sess.guestCount || 0), 0),
    revenue: activeSessions.reduce((s, sess) => s + (sess.grandTotal || 0), 0),
    avgTime: activeSessions.length ? Math.round(activeSessions.reduce((s, sess) => s + (sess.openedAt ? Math.floor((Date.now() - sess.openedAt) / 60000) : 0), 0) / activeSessions.length) : 0,
  }), [tableCounts, activeSessions]);

  const dineInOrders = useMemo(() => Object.entries(orders).map(([id, o]) => ({ id, ...o })).filter(o => o.type === "Dine-in" && o.status !== "Delivered" && o.status !== "Cancelled").sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)), [orders]);

  function sessionForTable(tableId) {
    const t = tables[tableId];
    if (!t?.currentSession) return null;
    return sessions[t.currentSession] || null;
  }

  function ordersForSession(sessionId) {
    const sess = sessions[sessionId];
    if (!sess?.orders) return [];
    return sess.orders.map(oid => ({ id: oid, ...(orders[oid] || {}) })).filter(o => o.id);
  }

  const kdsGroups = useMemo(() => {
    const groups = { New: [], Confirmed: [], Ready: [] };
    dineInOrders.forEach(o => {
      const st = o.status || "Placed";
      if (st === "Placed") groups.New.push(o);
      else if (st === "Confirmed" || st === "Preparing") groups.Confirmed.push(o);
      else if (st === "Ready") groups.Ready.push(o);
    });
    return groups;
  }, [dineInOrders]);

  const openEditor = useCallback((id) => {
    if (id && tables[id]) {
      const t = tables[id];
      setEditingId(id);
      setEditNumber(String(t.number));
      setEditCapacity(t.capacity || 4);
    } else {
      setEditingId(null);
      setEditNumber(String(tableList.length + 1).padStart(2, "0"));
      setEditCapacity(4);
    }
    setEditorOpen(true);
  }, [tables, tableList]);

  const saveTable = useCallback(async () => {
    const number = editNumber.trim();
    const capacity = Number(editCapacity) || 2;
    if (!number) { showToast("Please enter a table number", "warning"); return; }
    const duplicate = Object.entries(tables).find(([id, t]) => t.number === number && id !== editingId);
    if (duplicate) { showToast(`Table ${number} already exists`, "warning"); return; }
    try {
      const tRef = Outlet("tables");
      if (!tRef) return;
      if (editingId) {
        await update(Outlet(`tables/${editingId}`), { number, capacity, updatedAt: serverTimestamp() });
        showToast("Table updated", "success");
      } else {
        const newRef = push(tRef);
        const token = secureToken();
        await set(newRef, {
          id: newRef.key, number, capacity, status: "free", active: true,
          token, currentSession: null, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
        });
        showToast(`Table ${number} created`, "success");
      }
      setEditorOpen(false);
    } catch (e) {
      showToast("Save failed: " + (e?.message || e), "error");
    }
  }, [editNumber, editCapacity, editingId, tables, showToast]);

  const deleteTable = useCallback(async (id) => {
    const t = tables[id];
    if (!t) return;
    if (t.currentSession) { showToast("Cannot delete a table with an active session", "warning"); return; }
    if (!window.confirm(`Delete Table ${t.number}? This will permanently remove it and invalidate its QR code.`)) return;
    try {
        await remove(Outlet(`tables/${id}`));
      if (drawerTableId === id) setDrawerTableId(null);
      showToast("Table deleted", "success");
    } catch (e) {
      showToast("Delete failed", "error");
    }
  }, [tables, drawerTableId, showToast]);

  const setTableEnabled = useCallback(async (id, enabled) => {
    try {
      await update(Outlet(`tables/${id}`), { status: enabled ? "free" : "disabled", active: enabled, updatedAt: serverTimestamp() });
      showToast(enabled ? "Table enabled" : "Table disabled", "success");
    } catch (e) {
      showToast("Update failed", "error");
    }
  }, [showToast]);

  const requestBillForTable = useCallback(async (tableId) => {
    const t = tables[tableId];
    const sess = sessionForTable(tableId);
    if (!t || !sess) return;
    try {
      await update(Outlet(`tableSessions/${sess.sessionId}`), { status: "billing" });
      await update(Outlet(`tables/${tableId}`), { status: "billing", updatedAt: serverTimestamp() });
      showToast("Bill generated — table marked for billing", "success");
    } catch (e) {
      showToast("Failed: " + (e?.message || e), "error");
    }
  }, [tables, sessions, showToast]);

  const closeSessionForTable = useCallback(async (tableId) => {
    const t = tables[tableId];
    const sess = sessionForTable(tableId);
    if (!t || !sess) return;
    const total = sess.grandTotal || sess.runningTotal || 0;
    paymentDataRef.current = { tableId, total };
    setPaymentModal({ show: true, tableId, total });
  }, [tables, sessions]);

  const handlePaymentSelection = useCallback(async (method) => {
    if (!method) { setPaymentModal(s => ({ ...s, show: false })); return; }
    const { tableId } = paymentDataRef.current;
    const sess = sessionForTable(tableId);
    if (!sess) { setPaymentModal(s => ({ ...s, show: false })); return; }
    try {
      await update(Outlet(`tableSessions/${sess.sessionId}`), { status: "closed", closedAt: serverTimestamp(), paymentMethod: method, paidAt: serverTimestamp() });
      await update(Outlet(`tables/${tableId}`), { status: "free", currentSession: null, updatedAt: serverTimestamp() });
      if (drawerTableId === tableId) setDrawerTableId(null);
      showToast(`Table closed — ${method} received`, "success");
    } catch (e) {
      showToast("Failed: " + (e?.message || e), "error");
    }
    setPaymentModal(s => ({ ...s, show: false }));
  }, [tables, sessions, drawerTableId, showToast]);

  const cancelSessionForTable = useCallback(async (tableId) => {
    const t = tables[tableId];
    const sess = sessionForTable(tableId);
    if (!t) return;
    if (!window.confirm(`Cancel session for Table ${t.number}? Existing orders remain in Orders history but the running bill is discarded.`)) return;
    try {
      if (sess) await update(Outlet(`tableSessions/${sess.sessionId}`), { status: "closed", closedAt: serverTimestamp() });
      await update(Outlet(`tables/${tableId}`), { status: "free", currentSession: null, updatedAt: serverTimestamp() });
      if (drawerTableId === tableId) setDrawerTableId(null);
      showToast("Session cancelled, table freed", "success");
    } catch (e) {
      showToast("Failed: " + (e?.message || e), "error");
    }
  }, [tables, sessions, drawerTableId, showToast]);

  const advanceOrder = useCallback(async (orderId, nextStatus) => {
    try {
      await update(Outlet(`orders/${orderId}`), { status: nextStatus, updatedAt: serverTimestamp() });
      showToast(`Order moved to ${nextStatus}`, "success");
    } catch (e) {
      showToast("Update failed: " + (e?.message || e), "error");
    }
  }, [showToast]);

  const ensureQrLib = useCallback(async () => {
    if (window.QRCode) return true;
    return new Promise(resolve => {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.head.appendChild(s);
    });
  }, []);

  const openQrModal = useCallback(async (id) => {
    const t = tables[id];
    if (!t) return;
    setQrTable(t);
    setQrDataUri(null);
    setQrModalOpen(true);
    const ok = await ensureQrLib();
    if (!ok || !window.QRCode) { showToast("QR library failed to load", "error"); return; }
    const base = QR_BASE;
    const ctx = getCurrentOutletContext();
    if (!ctx.businessId || !ctx.outletId) { showToast("Outlet context not loaded", "error"); return; }
    const url = `${base}?b=${ctx.businessId}&o=${ctx.outletId}&t=${t.token}`;
    const holder = document.createElement("div");
    new window.QRCode(holder, { text: url, width: 240, height: 240, colorDark: "#1a1a1a", colorLight: "#ffffff", correctLevel: window.QRCode.CorrectLevel.M });
    setTimeout(() => {
      const img = holder.querySelector("img");
      const canvas = holder.querySelector("canvas");
      const uri = img?.src || canvas?.toDataURL("image/png") || null;
      setQrDataUri(uri);
    }, 150);
  }, [tables, ensureQrLib, showToast]);

  const printKOT = useCallback((tableId) => {
    const t = tables[tableId];
    const sess = sessionForTable(tableId);
    if (!t || !sess) { showToast("No active session to print", "warning"); return; }
    const orders = ordersForSession(sess.sessionId || t.currentSession);
    const allItems = [];
    orders.forEach(o => Object.values(o.items || {}).forEach(it => allItems.push(it)));
    const itemRows = allItems.map(it => `<div class="kot-item-row"><span>${it.qty || 1} ×</span><span>${esc(it.name || "Item")}</span></div>`).join("");
    const w = window.open("", "_blank", "width=380,height=600");
    w.document.write(`<html><head><title>KOT — Table ${esc(t.number)}</title><style>
      body{font-family:'Courier New',monospace;padding:16px;width:280px;}
      h2{text-align:center;margin-bottom:2px;font-size:18px;}
      .sub{text-align:center;font-size:11px;color:#555;margin-bottom:14px;border-bottom:1px dashed #000;padding-bottom:10px;}
      .kot-item-row{display:flex;gap:8px;font-size:14px;padding:4px 0;border-bottom:1px dotted #ccc;}
      .kot-item-row span:first-child{font-weight:700;min-width:30px;}
      .foot{margin-top:14px;font-size:11px;text-align:center;color:#777;}
      </style></head><body>
      <h2>KOT — TABLE ${esc(t.number)}</h2>
      <div class="sub">${new Date().toLocaleString("en-IN")} · Session ${esc(sess.sessionId || "")}</div>
      ${itemRows || "<p>No items</p>"}
      <div class="foot">FoodHubbie — Kitchen Copy</div>
      <script>window.onload=function(){window.print();};</script></body></html>`);
    w.document.close();
  }, [tables, sessions, orders, showToast]);

  const printBill = useCallback((tableId) => {
    const t = tables[tableId];
    const sess = sessionForTable(tableId);
    if (!t || !sess) { showToast("No active session to print bill", "warning"); return; }
    const orders = ordersForSession(sess.sessionId || t.currentSession);
    const allItems = [];
    orders.forEach(o => Object.values(o.items || {}).forEach(it => allItems.push(it)));
    const itemRows = allItems.map(it => `<tr><td>${it.qty || 1} × ${esc(it.name || "Item")}</td><td style="text-align:right">₹${Number(it.price || 0).toFixed(2)}</td></tr>`).join("");
    const total = Number(sess.grandTotal || sess.runningTotal || 0);
    const w = window.open("", "_blank", "width=380,height=600");
    w.document.write(`<html><head><title>Bill — Table ${esc(t.number)}</title><style>
      body{font-family:'Courier New',monospace;padding:16px;width:280px;margin:0 auto;}
      h2{text-align:center;margin-bottom:2px;font-size:20px;letter-spacing:1px;}
      .sub{text-align:center;font-size:11px;color:#555;margin-bottom:4px;}
      .divider{border-top:1px dashed #000;margin:10px 0;}
      table{width:100%;border-collapse:collapse;font-size:13px;}
      td{padding:4px 0;}
      .total-row td{font-weight:700;font-size:15px;padding-top:8px;border-top:2px solid #000;}
      .foot{text-align:center;font-size:11px;color:#777;margin-top:14px;padding-top:10px;border-top:1px dashed #000;}
      .thank-you{text-align:center;font-size:14px;font-weight:700;margin:8px 0;}
      </style></head><body>
      <h2>FOODHUBBIE</h2>
      <div class="sub">${new Date().toLocaleString("en-IN")}</div>
      <div class="sub">Table ${esc(t.number)} · Session ${esc(sess.sessionId || "").slice(-6).toUpperCase()}</div>
      <div class="divider"></div>
      <table>${itemRows}</table>
      <div class="divider"></div>
      <table><tr class="total-row"><td>Total</td><td style="text-align:right">₹${total.toFixed(2)}</td></tr></table>
      <div class="thank-you">Thank You!</div>
      <div class="foot">FoodHubbie — Bill Copy</div>
      <script>window.onload=function(){window.print();};</script></body></html>`);
    w.document.close();
  }, [tables, sessions, orders, showToast]);

  const exportCsv = useCallback(() => {
    const rows = [["Table", "Capacity", "Status", "Current Session", "Running Total"]];
    tableList.forEach(t => {
      const sess = sessionForTable(t.id);
      rows.push([t.number, t.capacity, t.status, sess?.sessionId || "", sess ? (sess.grandTotal ?? sess.runningTotal ?? 0) : ""]);
    });
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `tables-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("CSV exported", "success");
  }, [tableList, sessions, showToast]);

  const filteredTables = useMemo(() => {
    if (!searchTerm) return tableList;
    const s = searchTerm.toLowerCase();
    return tableList.filter(t => String(t.number).toLowerCase().includes(s) || (t.status || "").toLowerCase().includes(s));
  }, [tableList, searchTerm]);

  if (tableList.length === 0 && !tablesLoaded.current) {
    return (
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:400 }}>
        <div style={{ textAlign:"center", color:"#94a3b8" }}>
          <div style={{ width:36,height:36,border:"3px solid rgba(232, 73, 8,0.15)",borderTopColor:ORANGE,borderRadius:"50%",animation:"spin 0.8s linear infinite",margin:"0 auto 12px" }} />
          <div style={{ fontSize:13 }}>Loading tables…</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(140px, 1fr))", gap:12, marginBottom:20 }}>
        <StatCard label="Free" value={kpis.free} icon={Grid3x3} color={COLORS.success} bg="rgba(34,197,94,0.1)" />
        <StatCard label="Occupied" value={kpis.occupied} icon={Users} color="#3b82f6" bg="rgba(59,130,246,0.1)" />
        <StatCard label="Billing" value={kpis.billing} icon={Receipt} color={COLORS.warning} bg="rgba(245,158,11,0.1)" />
        <StatCard label="Active Sessions" value={kpis.sessionCount} icon={Clock} color="#8b5cf6" bg="rgba(139,92,246,0.1)" />
        <StatCard label="Guests" value={kpis.guestCount} icon={Users} color={ORANGE} bg="rgba(232, 73, 8,0.1)" />
        <StatCard label="Revenue (Live)" value={fmt(kpis.revenue)} icon={DollarSign} color="#16a34a" bg="rgba(22,163,74,0.1)" sub={`Avg ${kpis.avgTime} min`} />
      </div>

      {pendingRequests.length > 0 && (
        <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:12, padding:"10px 14px", borderRadius:10, background:"#fef3c7", border:"1px solid #f59e0b40" }}>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <Bell size={14} color="#f59e0b" />
            <span style={{ fontSize:12, fontWeight:700, color:"#92400e" }}>{pendingRequests.length} Request{pendingRequests.length > 1 ? "s" : ""}</span>
          </div>
          {pendingRequests.map(r => {
            const meta = REQUEST_TYPE_META[r.type] || { label: r.type || "Request" };
            const mins = Math.max(0, Math.floor((Date.now() - (r.createdAt || Date.now())) / 60000));
            return (
              <div key={r.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:8, padding:"6px 10px", borderRadius:8, background:"white", border:"1px solid #fde68a" }}>
                <div style={{ fontSize:12, color:"#78350f" }}>
                  <strong>Table {r.tableNumber || ""}</strong> · {meta.label} · {mins} min ago
                </div>
                <button type="button" onClick={() => resolveRequest(r.id)} style={{ padding:"4px 12px", borderRadius:6, border:"none", background:"#f59e0b", color:"white", fontSize:11, fontWeight:600, cursor:"pointer" }}>
                  Resolve
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16, flexWrap:"wrap" }}>
        <div style={{ position:"relative", flex:1, minWidth:200 }}>
          <Search size={16} style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#94a3b8" }} />
          <input type="text" placeholder="Search tables…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            style={{ width:"100%", padding:"10px 14px 10px 38px", borderRadius:10, border:"1.5px solid #e2e8f0", fontSize:13, outline:"none", background:"#fff", color:"#1e293b" }}
            onFocus={e => { e.target.style.borderColor = ORANGE; }}
            onBlur={e => { e.target.style.borderColor = "#e2e8f0"; }} />
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button type="button" onClick={() => openEditor(null)} style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 16px", borderRadius:10, border:"none", background:ORANGE, color:"white", fontSize:13, fontWeight:600, cursor:"pointer" }}>
            <Plus size={16} /> Add Table
          </button>
          <button type="button" onClick={() => setKdsTab(kdsTab === "grid" ? "kds" : "grid")} style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 16px", borderRadius:10, border:"1.5px solid #e2e8f0", background:"white", color:"#475569", fontSize:13, fontWeight:600, cursor:"pointer" }}>
            {kdsTab === "grid" ? "Kitchen View" : "Floor Grid"}
          </button>
          <button type="button" onClick={exportCsv} style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 14px", borderRadius:10, border:"1.5px solid #e2e8f0", background:"white", color:"#475569", fontSize:13, fontWeight:600, cursor:"pointer" }}>
            <Download size={15} /> Export
          </button>
        </div>
      </div>

      {kdsTab === "kds" ? (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14, minHeight:400 }}>
          {[
            { key: "New", label: "New Orders", count: kdsGroups.New.length, color: "#f59e0b", bg: "#fef3c7", items: kdsGroups.New },
            { key: "Confirmed", label: "Preparing", count: kdsGroups.Confirmed.length, color: "#8b5cf6", bg: "#ede9fe", items: kdsGroups.Confirmed },
            { key: "Ready", label: "Ready to Serve", count: kdsGroups.Ready.length, color: "#22c55e", bg: "#dcfce7", items: kdsGroups.Ready },
          ].map(col => (
            <GlassCard key={col.key} style={{ padding:14, minHeight:200 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                <span style={{ fontSize:13, fontWeight:700, color:"#1e293b" }}>{col.label}</span>
                <span style={{ padding:"2px 10px", borderRadius:99, fontSize:11, fontWeight:700, background:col.bg, color:col.color }}>{col.count}</span>
              </div>
              {col.items.length === 0 ? (
                <div style={{ textAlign:"center", padding:24, color:"#94a3b8", fontSize:12 }}>No orders</div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {col.items.map(o => {
                    const t = tables[o.tableId];
                    const items = Object.values(o.items || {});
                    const mins = Math.floor((Date.now() - (o.createdAt || Date.now())) / 60000);
                    const urgent = mins >= 15;
                    return (
                      <div key={o.id} style={{ padding:12, borderRadius:10, background:"white", border:`1px solid ${urgent ? "#fecaca" : "#e2e8f0"}`, boxShadow:urgent ? "0 0 0 2px #fecaca" : "none" }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                          <span style={{ fontSize:13, fontWeight:700, color:ORANGE }}>Table {t?.number || o.table || "?"}</span>
                          <span style={{ fontSize:11, color:urgent ? "#ef4444" : "#64748b", fontWeight:600 }}>
                            {Math.floor(mins / 60)}:{String(mins % 60).padStart(2, "0")}
                          </span>
                        </div>
                        {items.slice(0, 3).map((it, i) => (
                          <div key={i} style={{ fontSize:12, color:"#475569", padding:"2px 0" }}>{it.qty || 1} × {it.name || "Item"}</div>
                        ))}
                        {items.length > 3 && <div style={{ fontSize:11, color:"#94a3b8" }}>+{items.length - 3} more</div>}
                        {col.key === "New" && (
                          <button type="button" onClick={() => advanceOrder(o.id, "Confirmed")} style={{ marginTop:8, width:"100%", padding:"6px 0", borderRadius:8, border:"none", background:"#3b82f6", color:"white", fontSize:11, fontWeight:600, cursor:"pointer" }}>
                            Accept Order
                          </button>
                        )}
                        {col.key === "Confirmed" && (
                          <button type="button" onClick={() => advanceOrder(o.id, "Ready")} style={{ marginTop:8, width:"100%", padding:"6px 0", borderRadius:8, border:"none", background:"#8b5cf6", color:"white", fontSize:11, fontWeight:600, cursor:"pointer" }}>
                            Mark Ready
                          </button>
                        )}
                        {col.key === "Ready" && (
                          <button type="button" onClick={() => advanceOrder(o.id, "Delivered")} style={{ marginTop:8, width:"100%", padding:"6px 0", borderRadius:8, border:"none", background:"#22c55e", color:"white", fontSize:11, fontWeight:600, cursor:"pointer" }}>
                            Served
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </GlassCard>
          ))}
        </div>
      ) : (
        <div style={{ display:"flex", gap:16, alignItems:"flex-start" }}>
          <div style={{ flex:1, display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(150px, 1fr))", gap:12 }}>
            {filteredTables.map(t => {
              const meta = TABLE_STATUS_META[t.status] || TABLE_STATUS_META.free;
              const sess = sessionForTable(t.id);
              return (
                <button key={t.id} type="button" onClick={() => setDrawerTableId(t.id)}
                  disabled={t.status === "disabled"}
                  style={{ padding:16, borderRadius:12, border:`1.5px solid ${t.status === "disabled" ? "#e2e8f0" : meta.color}20`, background:"white", cursor:"pointer", textAlign:"center", transition:"all 0.15s", opacity:t.status==="disabled"?0.5:1, position:"relative", boxShadow:t.status!=="disabled"?`0 2px 8px ${meta.color}10`:"none" }}>
                  <div style={{ fontSize:28, fontWeight:900, color:meta.color }}>{t.number}</div>
                  <div style={{ fontSize:11, color:"#94a3b8", marginTop:2 }}>{t.capacity || 0} Seats</div>
                  {sess && t.status !== "free" ? (
                    <>
                      <div style={{ fontSize:13, fontWeight:700, color:"#1e293b", marginTop:6 }}>₹{Number(sess.grandTotal || sess.runningTotal || 0).toLocaleString("en-IN")}</div>
                      <div style={{ fontSize:10, color:"#94a3b8" }}>{(sess.orders || []).length} orders · {sess.openedAt ? Math.floor((Date.now() - sess.openedAt) / 60000) : 0} min</div>
                    </>
                  ) : (
                    <div style={{ marginTop:6, padding:"2px 8px", borderRadius:99, display:"inline-block", fontSize:10, fontWeight:700, background:meta.bg, color:meta.color }}>{meta.label}</div>
                  )}
                </button>
              );
            })}
            {filteredTables.length === 0 && (
              <div style={{ gridColumn:"1 / -1", textAlign:"center", padding:40, color:"#94a3b8" }}>
                <Grid3x3 size={32} style={{ margin:"0 auto 8px", opacity:0.5 }} />
                <div style={{ fontSize:13 }}>No tables found. Click "Add Table" to create one.</div>
              </div>
            )}
          </div>

          {drawerTableId && tables[drawerTableId] && (
            <div style={{ width:340, flexShrink:0 }}>
              <GlassCard style={{ padding:16 }}>
                {(() => {
                  const t = tables[drawerTableId];
                  const meta = TABLE_STATUS_META[t.status] || TABLE_STATUS_META.free;
                  const sess = sessionForTable(t.id);
                  return (
                    <>
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
                        <div>
                          <div style={{ fontSize:20, fontWeight:800, color:"#1e293b" }}>Table {t.number}</div>
                          <span style={{ padding:"2px 10px", borderRadius:99, fontSize:10, fontWeight:700, background:meta.bg, color:meta.color }}>{meta.label}</span>
                        </div>
                        <button type="button" onClick={() => setDrawerTableId(null)} style={{ padding:6, borderRadius:8, border:"none", background:"transparent", cursor:"pointer", color:"#94a3b8" }}>
                          <X size={18} />
                        </button>
                      </div>

                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:14 }}>
                        <div><div style={{ fontSize:10, color:"#94a3b8", fontWeight:600 }}>Capacity</div><div style={{ fontSize:13, fontWeight:600, color:"#1e293b" }}>{t.capacity || "—"}</div></div>
                        <div><div style={{ fontSize:10, color:"#94a3b8", fontWeight:600 }}>Status</div><div style={{ fontSize:13, fontWeight:600, color:meta.color }}>{meta.label}</div></div>
                        <div><div style={{ fontSize:10, color:"#94a3b8", fontWeight:600 }}>Session</div><div style={{ fontSize:13, fontWeight:600, color:"#1e293b" }}>{sess ? (sess.status === "billing" ? "Billing" : "Active") : "None"}</div></div>
                        <div><div style={{ fontSize:10, color:"#94a3b8", fontWeight:600 }}>Time</div><div style={{ fontSize:13, fontWeight:600, color:"#1e293b" }}>{sess?.openedAt ? Math.floor((Date.now() - sess.openedAt) / 60000) + " min" : "—"}</div></div>
                      </div>

                      {sess ? (
                        <>
                          <div style={{ marginBottom:12 }}>
                            <div style={{ fontSize:11, fontWeight:600, color:"#475569", marginBottom:6 }}>Orders ({sess.orders?.length || 0})</div>
                            {ordersForSession(sess.sessionId).map(o => (
                              <div key={o.id} style={{ padding:"8px 10px", borderRadius:8, background:"#f8fafc", marginBottom:6 }}>
                                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                                  <span style={{ fontSize:11, fontWeight:600, color:"#475569" }}>#{String(o.id).slice(-6).toUpperCase()}</span>
                                  <span style={{ padding:"1px 6px", borderRadius:4, fontSize:9, fontWeight:700, background:ORD_ST[o.status]?.bg||"#f1f5f9", color:ORD_ST[o.status]?.color||"#64748b" }}>{o.status}</span>
                                </div>
                                {Object.values(o.items || {}).slice(0, 2).map((it, i) => (
                                  <div key={i} style={{ fontSize:11, color:"#94a3b8", padding:"1px 0" }}>{it.qty || 1} × {it.name}</div>
                                ))}
                                <div style={{ display:"flex", gap:4, marginTop:4 }}>
                                  {o.status === "Placed" && <button type="button" onClick={() => advanceOrder(o.id, "Confirmed")} style={{ padding:"2px 8px", borderRadius:4, border:"none", background:"#3b82f6", color:"white", fontSize:9, fontWeight:600, cursor:"pointer" }}>Confirm</button>}
                                  {o.status === "Confirmed" && <button type="button" onClick={() => advanceOrder(o.id, "Ready")} style={{ padding:"2px 8px", borderRadius:4, border:"none", background:"#8b5cf6", color:"white", fontSize:9, fontWeight:600, cursor:"pointer" }}>Ready</button>}
                                  {o.status === "Ready" && <button type="button" onClick={() => advanceOrder(o.id, "Delivered")} style={{ padding:"2px 8px", borderRadius:4, border:"none", background:"#22c55e", color:"white", fontSize:9, fontWeight:600, cursor:"pointer" }}>Served</button>}
                                </div>
                              </div>
                            ))}
                          </div>

                          <div style={{ padding:"10px 14px", borderRadius:10, background:ORANGE+"10", border:`1px solid ${ORANGE}30`, marginBottom:12 }}>
                            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                              <span style={{ fontSize:11, color:"#64748b", fontWeight:600 }}>Current Total</span>
                              <span style={{ fontSize:18, fontWeight:800, color:ORANGE }}>₹{Number(sess.grandTotal || sess.runningTotal || 0).toLocaleString("en-IN")}</span>
                            </div>
                            <div style={{ fontSize:10, color:"#94a3b8" }}>{(sess.orders || []).length} orders · pending payment</div>
                          </div>

                          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                            {sess.status !== "billing" ? (
                              <button type="button" onClick={() => requestBillForTable(drawerTableId)} style={{ padding:"8px 0", borderRadius:8, border:"none", background:ORANGE, color:"white", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                                <Receipt size={14} style={{ marginRight:6, verticalAlign:"middle" }} /> Generate Bill
                              </button>
                            ) : (
                              <button type="button" onClick={() => closeSessionForTable(drawerTableId)} style={{ padding:"8px 0", borderRadius:8, border:"none", background:"#22c55e", color:"white", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                                <CheckCheck size={14} style={{ marginRight:6, verticalAlign:"middle" }} /> Close Table (Paid)
                              </button>
                            )}
                            <button type="button" onClick={() => printBill(drawerTableId)} style={{ padding:"8px 0", borderRadius:8, border:"1.5px solid #e2e8f0", background:"white", color:"#475569", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                              <Printer size={14} style={{ marginRight:6, verticalAlign:"middle" }} /> Print Bill
                            </button>
                            <button type="button" onClick={() => printKOT(drawerTableId)} style={{ padding:"8px 0", borderRadius:8, border:"1.5px solid #e2e8f0", background:"white", color:"#475569", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                              <Printer size={14} style={{ marginRight:6, verticalAlign:"middle" }} /> Print KOT
                            </button>
                            <button type="button" onClick={() => openQrModal(drawerTableId)} style={{ padding:"8px 0", borderRadius:8, border:"1.5px solid #e2e8f0", background:"white", color:"#475569", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                              <QrCode size={14} style={{ marginRight:6, verticalAlign:"middle" }} /> View QR
                            </button>
                            <button type="button" onClick={() => cancelSessionForTable(drawerTableId)} style={{ padding:"8px 0", borderRadius:8, border:"1.5px solid #fecaca", background:"white", color:"#ef4444", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                              <X size={14} style={{ marginRight:6, verticalAlign:"middle" }} /> Cancel / Free Table
                            </button>
                          </div>
                        </>
                      ) : (
                        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                          <div style={{ padding:16, textAlign:"center", color:"#94a3b8", fontSize:12 }}>No active session for this table.</div>
                          <button type="button" onClick={() => openQrModal(drawerTableId)} style={{ padding:"8px 0", borderRadius:8, border:"1.5px solid #e2e8f0", background:"white", color:"#475569", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                            <QrCode size={14} style={{ marginRight:6, verticalAlign:"middle" }} /> View / Print QR
                          </button>
                          <button type="button" onClick={() => openEditor(drawerTableId)} style={{ padding:"8px 0", borderRadius:8, border:"1.5px solid #e2e8f0", background:"white", color:"#475569", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                            <Edit3 size={14} style={{ marginRight:6, verticalAlign:"middle" }} /> Edit Table
                          </button>
                          {t.status === "disabled" ? (
                            <button type="button" onClick={() => setTableEnabled(drawerTableId, true)} style={{ padding:"8px 0", borderRadius:8, border:"none", background:"#22c55e", color:"white", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                              <Check size={14} style={{ marginRight:6, verticalAlign:"middle" }} /> Enable Table
                            </button>
                          ) : (
                            <button type="button" onClick={() => setTableEnabled(drawerTableId, false)} style={{ padding:"8px 0", borderRadius:8, border:"1.5px solid #fecaca", background:"white", color:"#ef4444", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                              <Ban size={14} style={{ marginRight:6, verticalAlign:"middle" }} /> Disable Table
                            </button>
                          )}
                          <button type="button" onClick={() => deleteTable(drawerTableId)} style={{ padding:"8px 0", borderRadius:8, border:"1.5px solid #fecaca", background:"white", color:"#ef4444", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                            <Trash2 size={14} style={{ marginRight:6, verticalAlign:"middle" }} /> Delete Table
                          </button>
                        </div>
                      )}
                    </>
                  );
                })()}
              </GlassCard>
            </div>
          )}
        </div>
      )}

      <div style={{ display:"flex", gap:8, marginTop:16, justifyContent:"flex-end" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, fontSize:11, color:"#94a3b8" }}>
          <span style={{ display:"flex", alignItems:"center", gap:4 }}><span style={{ width:10,height:10,borderRadius:"50%",background:COLORS.success}} /> Free: {kpis.free}</span>
          <span style={{ display:"flex", alignItems:"center", gap:4 }}><span style={{ width:10,height:10,borderRadius:"50%",background:"#3b82f6"}} /> Occupied: {kpis.occupied}</span>
          <span style={{ display:"flex", alignItems:"center", gap:4 }}><span style={{ width:10,height:10,borderRadius:"50%",background:COLORS.warning}} /> Billing: {kpis.billing}</span>
          <span style={{ display:"flex", alignItems:"center", gap:4 }}><span style={{ width:10,height:10,borderRadius:"50%",background:COLORS.muted}} /> Disabled: {kpis.disabled}</span>
        </div>
      </div>

      {editorOpen && (
        <div style={{ position:"fixed", inset:0, zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(0,0,0,0.4)" }}>
          <div style={{ width:360, padding:24, borderRadius:16, background:"white", boxShadow:"0 20px 60px rgba(0,0,0,0.15)" }}>
            <div style={{ fontSize:16, fontWeight:700, color:"#1e293b", marginBottom:16 }}>{editingId ? "Edit Table" : "Add Table"}</div>
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:12, fontWeight:600, color:"#475569", marginBottom:4, display:"block" }}>Table Number</label>
              <input type="text" value={editNumber} onChange={e => setEditNumber(e.target.value)} placeholder="e.g. 01"
                style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #e2e8f0", fontSize:14, outline:"none" }}
                onFocus={e => { e.target.style.borderColor = ORANGE; }}
                onBlur={e => { e.target.style.borderColor = "#e2e8f0"; }} />
            </div>
            <div style={{ marginBottom:20 }}>
              <label style={{ fontSize:12, fontWeight:600, color:"#475569", marginBottom:4, display:"block" }}>Capacity (Seats)</label>
              <input type="number" value={editCapacity} onChange={e => setEditCapacity(Number(e.target.value))} min={1} max={20}
                style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #e2e8f0", fontSize:14, outline:"none" }}
                onFocus={e => { e.target.style.borderColor = ORANGE; }}
                onBlur={e => { e.target.style.borderColor = "#e2e8f0"; }} />
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button type="button" onClick={() => setEditorOpen(false)} style={{ flex:1, padding:"10px 0", borderRadius:10, border:"1.5px solid #e2e8f0", background:"white", color:"#475569", fontSize:13, fontWeight:600, cursor:"pointer" }}>Cancel</button>
              <button type="button" onClick={saveTable} style={{ flex:1, padding:"10px 0", borderRadius:10, border:"none", background:ORANGE, color:"white", fontSize:13, fontWeight:600, cursor:"pointer" }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {qrModalOpen && qrTable && (
        <div style={{ position:"fixed", inset:0, zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(0,0,0,0.4)" }}>
          <div style={{ width:360, padding:24, borderRadius:16, background:"white", boxShadow:"0 20px 60px rgba(0,0,0,0.15)", textAlign:"center" }}>
            <div style={{ fontSize:16, fontWeight:700, color:"#1e293b", marginBottom:4 }}>Table {qrTable.number} QR Code</div>
            <div style={{ fontSize:12, color:"#94a3b8", marginBottom:16 }}>Scan to order</div>
            {qrDataUri ? (
              <img src={qrDataUri} alt={`QR for Table ${qrTable.number}`} style={{ width:220, height:220, margin:"0 auto 12px", display:"block" }} />
            ) : (
              <div style={{ width:220, height:220, margin:"0 auto 12px", display:"flex", alignItems:"center", justifyContent:"center", background:"#f8fafc", borderRadius:12 }}>
                <div style={{ width:24,height:24,border:"3px solid rgba(232, 73, 8,0.15)",borderTopColor:ORANGE,borderRadius:"50%",animation:"spin 0.8s linear infinite" }} />
              </div>
            )}
            <div style={{ fontSize:11, color:"#94a3b8", wordBreak:"break-all", marginBottom:14, padding:"8px 12px", background:"#f8fafc", borderRadius:8 }}>
              {(() => { const ctx = getCurrentOutletContext(); return `${QR_BASE}?b=${ctx.businessId}&o=${ctx.outletId}&t=${qrTable.token}`; })()}
            </div>
            <div style={{ display:"flex", gap:8, justifyContent:"center" }}>
              <button type="button" onClick={() => { const ctx = getCurrentOutletContext(); navigator.clipboard?.writeText(`${QR_BASE}?b=${ctx.businessId}&o=${ctx.outletId}&t=${qrTable.token}`).then(() => showToast("Link copied", "success")); }}
                style={{ padding:"8px 14px", borderRadius:8, border:"1.5px solid #e2e8f0", background:"white", color:"#475569", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                Copy Link
              </button>
              <button type="button" onClick={() => setQrModalOpen(false)} style={{ padding:"8px 14px", borderRadius:8, border:"none", background:ORANGE, color:"white", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {paymentModal.show && (
        <div style={{ position:"fixed", inset:0, zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(0,0,0,0.4)" }}
          onClick={(e) => { if (e.target === e.currentTarget) handlePaymentSelection(null); }}>
          <div style={{ width:360, padding:24, borderRadius:16, background:"white", boxShadow:"0 20px 60px rgba(0,0,0,0.15)", textAlign:"center" }}>
            <div style={{ fontSize:18, fontWeight:700, color:"#1e293b", marginBottom:4 }}>Record Payment</div>
            <div style={{ fontSize:13, color:"#64748b", marginBottom:4 }}>Confirm payment method</div>
            <div style={{ fontSize:28, fontWeight:800, color:ORANGE, margin:"12px 0" }}>
              ₹{Number(paymentModal.total).toLocaleString("en-IN")}
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              <button type="button" onClick={() => handlePaymentSelection("Cash")} style={{ padding:"12px 0", borderRadius:10, border:"none", background:"#dcfce7", color:"#16a34a", fontSize:15, fontWeight:700, cursor:"pointer" }}>
                💵 Cash
              </button>
              <button type="button" onClick={() => handlePaymentSelection("UPI")} style={{ padding:"12px 0", borderRadius:10, border:"none", background:"#dbeafe", color:"#2563eb", fontSize:15, fontWeight:700, cursor:"pointer" }}>
                📱 UPI
              </button>
              <button type="button" onClick={() => handlePaymentSelection(null)} style={{ padding:"10px 0", borderRadius:10, border:"1.5px solid #e2e8f0", background:"white", color:"#64748b", fontSize:13, fontWeight:600, cursor:"pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TablesPage;
