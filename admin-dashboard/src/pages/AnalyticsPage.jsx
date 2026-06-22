import React, { useState, useEffect, useMemo } from "react";
import { ShoppingBag, DollarSign, TrendingUp, Download, Star, XCircle } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { db, ref, onValue, off, Outlet } from "../firebase";
import { fmt, downloadCSV, normalizeRider, aggregateByDay, aggregateByHour, aggregateByCategory, aggregateByDish, aggregateByCustomer } from "../utils";
import { KPICard, StarRating, Pill, SectionHeader, GlassCard, BtnSecondary, Avatar, SkeletonPage } from "../components";
import { ORANGE, COLORS, PIE_COLORS } from "../constants";
import "../App.css";

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

export default AnalyticsPage;