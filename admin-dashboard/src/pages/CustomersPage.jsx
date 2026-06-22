import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Search, X, Save, Download } from "lucide-react";
import { update, onValue, off, Outlet } from "../firebase";
import { fmt, downloadCSV } from "../utils";
import { GlassCard } from "../components";
import { ORANGE } from "../constants";
import "../App.css";

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

export default CustomersPage;