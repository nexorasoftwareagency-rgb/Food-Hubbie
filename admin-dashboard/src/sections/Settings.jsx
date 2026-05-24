import { useState, useEffect, useCallback } from "react";
import { Save, Store, Bike, Bell, Palette, MessageCircle } from "lucide-react";
import GlassCard from "../components/GlassCard";
import { useRealtimeObject } from "../hooks/useRealtimeData";
import { Outlet, update, set as fbSet } from "../firebase";
import { ORANGE } from "../utils/constants";

function validatePhone(phone, label) {
  if (!phone) return true;
  const clean = String(phone).replace(/\D/g, "");
  if (clean.length === 10) return true;
  if (clean.length === 12 && clean.startsWith("91")) return true;
  return { valid: false, msg: label + " must be 10 digits" };
}

function validateGSTIN(gst) {
  if (!gst) return true;
  if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gst))
    return { valid: false, msg: "Invalid GSTIN Format" };
  return true;
}

function validateCoords(lat, lng) {
  const l = parseFloat(lat);
  const n = parseFloat(lng);
  if (isNaN(l) || l < -90 || l > 90) return { valid: false, msg: "Invalid Latitude" };
  if (isNaN(n) || n < -180 || n > 180) return { valid: false, msg: "Invalid Longitude" };
  return { valid: true };
}

const DEFAULT_STORE = {
  name:"Foodhubbie", phone:"+91 9876543210", email:"admin@foodhubbie.com",
  address:"MG Road, Ranchi", gst:"", fssai:"", timing:"10:00 AM - 11:00 PM", open:true
};
const DEFAULT_DELIVERY = { radius:15, minOrder:100, charge:30, freeAbove:500, avgTime:35 };
const DEFAULT_DISPLAY = { currency:"₹", timezone:"Asia/Kolkata", lang:"en", theme:"light" };
const DEFAULT_NOTIF = { orderSMS:true, orderEmail:true, promoPush:true, dailyReport:false };
const DEFAULT_BOT = { whatsapp:"", welcomeMsg:"Welcome! How can we help you?", autoReply:true, bizHours:true };

const Settings = ({ showToast }) => {
  const { data: storeFB } = useRealtimeObject("settings/Store");
  const { data: deliveryFB } = useRealtimeObject("settings/Delivery");
  const { data: displayFB } = useRealtimeObject("settings/Display");
  const { data: botFB } = useRealtimeObject("settings/Bot");

  const [store, setStore] = useState(DEFAULT_STORE);
  const [delivery, setDelivery] = useState(DEFAULT_DELIVERY);
  const [display, setDisplay] = useState(DEFAULT_DISPLAY);
  const [notif, setNotif] = useState(DEFAULT_NOTIF);
  const [bot, setBot] = useState(DEFAULT_BOT);
  const [tab, setTab] = useState("store");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (storeFB) {
      setStore(prev => ({
        name: storeFB.name || prev.name, phone: storeFB.phone || prev.phone,
        email: storeFB.email || prev.email, address: storeFB.address || prev.address,
        gst: storeFB.gst || prev.gst, fssai: storeFB.fssai || prev.fssai,
        timing: storeFB.timing || prev.timing, open: storeFB.open !== false
      }));
    }
  }, [storeFB]);

  useEffect(() => {
    if (deliveryFB) setDelivery(prev => ({ ...prev, ...deliveryFB }));
  }, [deliveryFB]);

  useEffect(() => {
    if (displayFB) setDisplay(prev => ({ ...prev, ...displayFB }));
  }, [displayFB]);

  useEffect(() => {
    if (botFB) setBot(prev => ({ ...prev, ...botFB }));
  }, [botFB]);

  const save = useCallback(async () => {
    const vCoord = validateCoords(store.lat, store.lng);
    if (vCoord !== true && !vCoord?.valid) { showToast(vCoord.msg, "error"); return; }

    const vGst = validateGSTIN(store.gst);
    if (vGst !== true && !vGst?.valid) { showToast(vGst.msg, "error"); return; }

    for (const field of ["phone", "email"]) {
      const v = validatePhone(store[field], field);
      if (v !== true && !v?.valid) { showToast(v.msg, "error"); return; }
    }

    setSaving(true);
    try {
      await Promise.all([
        update(Outlet("settings/Store"), {
          name: store.name, phone: store.phone, email: store.email,
          address: store.address, gst: store.gst, fssai: store.fssai,
          timing: store.timing, open: store.open, updatedAt: Date.now()
        }),
        update(Outlet("settings/Delivery"), {
          radius: delivery.radius, minOrder: delivery.minOrder,
          charge: delivery.charge, freeAbove: delivery.freeAbove,
          avgTime: delivery.avgTime, updatedAt: Date.now()
        }),
        fbSet(Outlet("settings/Display"), { ...display, updatedAt: Date.now() }),
        update(Outlet("settings/Bot"), {
          whatsapp: bot.whatsapp, welcomeMsg: bot.welcomeMsg,
          autoReply: bot.autoReply, bizHours: bot.bizHours, updatedAt: Date.now()
        }),
      ]);
      showToast("Settings saved to Firebase!");
    } catch (e) {
      showToast("Save failed: " + e.message, "error");
    } finally {
      setSaving(false);
    }
  }, [store, delivery, display, showToast]);

  const tabs = [
    { id:"store", label:"Store", icon:Store },
    { id:"delivery", label:"Delivery", icon:Bike },
    { id:"display", label:"Display", icon:Palette },
    { id:"notif", label:"Notifications", icon:Bell },
    { id:"bot", label:"Bot", icon:MessageCircle },
  ];

  const section = () => {
    switch (tab) {
      case "store":
        return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {["name","phone","email","address","gst","fssai","timing"].map(f => (
            <div key={f}>
              <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">{f}</label>
              <input value={store[f] || ""} onChange={e => setStore(p => ({ ...p, [f]: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-300" />
            </div>
          ))}
          <div className="md:col-span-2 flex items-center gap-3">
            <label className="text-sm text-slate-600">Store Open</label>
            <button onClick={() => setStore(p => ({ ...p, open: !p.open }))}
              className={`relative w-12 h-6 rounded-full transition-all ${store.open ? "bg-green-500" : "bg-slate-300"}`}>
              <div className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-all ${store.open ? "left-6" : "left-0.5"}`} />
            </button>
          </div>
        </div>;
      case "bot":
        return <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">WhatsApp Number</label>
            <input value={bot.whatsapp} onChange={e => setBot(p => ({ ...p, whatsapp: e.target.value }))}
              placeholder="+91 9876543210"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-300" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Welcome Message</label>
            <textarea value={bot.welcomeMsg} onChange={e => setBot(p => ({ ...p, welcomeMsg: e.target.value }))} rows={2}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none resize-none" />
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
            <span className="text-sm text-slate-700">Auto-reply enabled</span>
            <button onClick={() => setBot(p => ({ ...p, autoReply: !p.autoReply }))}
              className={`relative w-11 h-5 rounded-full transition-all ${bot.autoReply ? "bg-green-500" : "bg-slate-300"}`}>
              <div className={`absolute w-4 h-4 bg-white rounded-full top-0.5 transition-all ${bot.autoReply ? "left-6" : "left-0.5"}`} />
            </button>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
            <span className="text-sm text-slate-700">Business hours only</span>
            <button onClick={() => setBot(p => ({ ...p, bizHours: !p.bizHours }))}
              className={`relative w-11 h-5 rounded-full transition-all ${bot.bizHours ? "bg-green-500" : "bg-slate-300"}`}>
              <div className={`absolute w-4 h-4 bg-white rounded-full top-0.5 transition-all ${bot.bizHours ? "left-6" : "left-0.5"}`} />
            </button>
          </div>
        </div>;
      case "delivery":
        return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {["radius","minOrder","charge","freeAbove","avgTime"].map(f => (
            <div key={f}>
              <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">{f.replace(/([A-Z])/g, " $1")}</label>
              <input type="number" value={delivery[f] || ""} onChange={e => setDelivery(p => ({ ...p, [f]: +e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none" />
            </div>
          ))}
        </div>;
      case "display":
        return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Currency</label>
            <select value={display.currency} onChange={e => setDisplay(p => ({ ...p, currency: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none">
              <option value="₹">₹ (INR)</option>
              <option value="$">$ (USD)</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Timezone</label>
            <select value={display.timezone} onChange={e => setDisplay(p => ({ ...p, timezone: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none">
              <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
              <option value="Asia/Dubai">Asia/Dubai (GST)</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Language</label>
            <select value={display.lang} onChange={e => setDisplay(p => ({ ...p, lang: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none">
              <option value="en">English</option>
              <option value="hi">Hindi</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Theme</label>
            <select value={display.theme} onChange={e => setDisplay(p => ({ ...p, theme: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none">
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
        </div>;
      case "notif":
        return <div className="space-y-3">
          {[
            { k:"orderSMS", label:"Order confirmation via SMS" },
            { k:"orderEmail", label:"Order confirmation via Email" },
            { k:"promoPush", label:"Promotional push notifications" },
            { k:"dailyReport", label:"Daily sales report" },
          ].map(n => (
            <div key={n.k} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
              <span className="text-sm text-slate-700">{n.label}</span>
              <button onClick={() => setNotif(p => ({ ...p, [n.k]: !p[n.k] }))}
                className={`relative w-11 h-5 rounded-full transition-all ${notif[n.k] ? "bg-green-500" : "bg-slate-300"}`}>
                <div className={`absolute w-4 h-4 bg-white rounded-full top-0.5 transition-all ${notif[n.k] ? "left-6" : "left-0.5"}`} />
              </button>
            </div>
          ))}
        </div>;
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <GlassCard className="p-4">
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap"
              style={tab === t.id ? { backgroundColor: ORANGE, color:"#fff" } : { backgroundColor:"#f1f5f9", color:"#475569" }}>
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>
        {section()}
        <div className="mt-6 flex justify-end">
          <button onClick={save} disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50"
            style={{ backgroundColor: ORANGE }}>
            <Save size={15} /> {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </GlassCard>
    </div>
  );
};

export default Settings;
