import React, { useState, useEffect } from "react";
import { Bike, Wallet, CheckCircle, Clock, TrendingUp, XCircle } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { db, ref, onValue, off, Outlet } from "../firebase";
import { fmt, buildTodayRevenue, buildWeekRevenue } from "../utils";
import { StatusBadge, GlassCard, SkeletonPage, StatCard } from "../components";
import { ORANGE, ORD_ST, LIVE_ST } from "../constants";
import "../App.css";

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

export default DashboardPage;