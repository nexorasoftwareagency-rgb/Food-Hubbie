import React, { useState, useEffect } from "react";
import { Settings, Menu, Store, Plus, Trash2, Phone, Save, Send } from "lucide-react";
import { update, set, onValue, off, Outlet } from "../firebase";
import { validateGSTIN, validateFSSAI, validateCoords } from "../utils";
import { GlassCard, BtnPrimary, BtnSecondary, Input, SectionLabel } from "../components";
import { ORANGE } from "../constants";
import "../App.css";

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

export default SettingsPage;