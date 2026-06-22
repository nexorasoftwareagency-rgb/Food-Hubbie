import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Zap, ChefHat, Search, Plus, Edit3, Trash2, Phone, Save, Clock, Activity, Truck, Download, XCircle } from "lucide-react";
import { db, get, ref, update, push, remove, serverTimestamp, onValue, off, logAudit, getCurrentAdminActor, Outlet, getBizId, getOutletId } from "../firebase";
import { fmt, downloadCSV, orderItemsCount, relTime } from "../utils";
import { KPICard, SectionHeader, StatusBadge, GlassCard, BtnPrimary, Modal, Avatar, Input, Select } from "../components";
import { ORANGE, COLORS, ORD_ST, SEQ } from "../constants";
import "../App.css";

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
      logAudit(getBizId(), getOutletId(), "delete_order_kitchen", { orderId: id }, getCurrentAdminActor());
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

export default LiveOpsPage;