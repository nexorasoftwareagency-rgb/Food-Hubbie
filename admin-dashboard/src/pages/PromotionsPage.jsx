import React, { useState, useEffect, useMemo } from "react";
import { Monitor, Users, Settings, Menu, Store, Image, Upload, Clock, Eye, Download, Send, Octagon, History } from "lucide-react";
import { get, update, push, set, onValue, Outlet } from "../firebase";
import { fmtDate } from "../utils";
import { ToggleSwitch, EmptyState, SectionHeader, GlassCard, BtnPrimary, BtnSecondary, Modal, Input, Select } from "../components";
import { ORANGE } from "../constants";
import "../App.css";

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

export default PromotionsPage;