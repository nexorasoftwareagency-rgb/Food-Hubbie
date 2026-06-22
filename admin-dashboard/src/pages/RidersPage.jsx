import React, { useState, useEffect, useCallback, useMemo } from "react";
import { LayoutDashboard, ShoppingBag, Users, Bike, Search, X, Menu, Wallet, Plus, Trash2, Phone, CheckCircle, Clock, Activity, Navigation, Truck, Download, Star, Lock } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { db, get, ref, update, push, set, remove, serverTimestamp, onValue, off, logAudit, getCurrentAdminActor, createRiderAuthAccount, deleteRiderAuthAccount, resetRiderPassword, Outlet, getBizId, getOutletId } from "../firebase";
import { fmt, downloadCSV, normalizeRider } from "../utils";
import { KPICard, StarRating, Pill, EmptyState, SectionHeader, GlassCard, BtnPrimary, BtnSecondary, Modal, Avatar, SkeletonPage } from "../components";
import { ORANGE, COLORS, DAY_KEYS } from "../constants";
import "../App.css";

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
      logAudit(getBizId(), getOutletId(), "create_rider", { riderId: uid, name: addForm.name.trim(), email }, getCurrentAdminActor());
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
      logAudit(getBizId(), getOutletId(), "reset_rider_password", { riderId: selected.id, email: selected.email }, getCurrentAdminActor());
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
      logAudit(getBizId(), getOutletId(), "delete_rider", { riderId: selected.id, name: selected.name, email: selected.email || null }, getCurrentAdminActor());
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
      logAudit(getBizId(), getOutletId(), "settle_rider_wallet", { riderId: selected.id, amount: amt, settleId: settleRef?.key || null }, getCurrentAdminActor());
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

export default RidersPage;