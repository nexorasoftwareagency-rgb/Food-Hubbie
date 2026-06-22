import React, { useState, useEffect, useCallback, useMemo } from "react";
import { ShoppingBag, ChefHat, Search, AlertTriangle, Clock } from "lucide-react";
import { update, onValue, off, Outlet } from "../firebase";
import { fmt, orderItemsCount } from "../utils";
import { Pill, EmptyState, SectionHeader, StatusBadge, GlassCard, BtnPrimary, BtnSecondary, Modal } from "../components";
import { ORANGE, ORD_ST, KITCHEN_ST } from "../constants";
import "../App.css";

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

export default KitchenPage;