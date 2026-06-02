import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  LayoutDashboard, ShoppingBag, Zap, ChefHat, Monitor, UtensilsCrossed,
  Tag, Package, Users, Bike, Handshake, BarChart3, TrendingDown,
  CreditCard, Bell, MessageSquare, MapPin, Settings, LogOut,
  Sun, Moon, Search, X, Menu, ChevronRight, ChevronLeft,
  ShoppingCart, Wallet, Store, Plus, Edit3, Trash2, Printer,
  Minus, Phone, Save, Image, Upload, DollarSign, CheckCircle,
  AlertTriangle, ArrowUp, ArrowDown, Clock, TrendingUp, Globe,
  Activity, Navigation, Truck, Eye, Download, Send, Star, XCircle
} from "lucide-react";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { getAuthInstance, db, onAuthStateChanged, signInWithEmailAndPassword, signOut, setOutletContext, get, ref, update, push, set, remove, serverTimestamp, onValue, off, query, orderByChild, equalTo, uploadImage } from "./firebase";
import "./App.css";

const ORANGE = "#f36b21";
const COLORS = { primary: "#f36b21", success: "#22c55e", warning: "#f59e0b", info: "#3b82f6", error: "#ef4444", muted: "#64748b" };
const ORD_ST = {
  Placed: { label: "Placed", color: "#f59e0b", bg: "#fef3c7" }, Confirmed: { label: "Confirmed", color: "#3b82f6", bg: "#dbeafe" },
  Preparing: { label: "Preparing", color: "#8b5cf6", bg: "#ede9fe" }, Cooked: { label: "Cooked", color: "#06b6d4", bg: "#cffafe" },
  Ready: { label: "Ready", color: "#0ea5e9", bg: "#e0f2fe" }, "Out for Delivery": { label: "Out for Delivery", color: "#f36b21", bg: "#ffedd5" },
  "Reached Drop Location": { label: "Reached Drop", color: "#f97316", bg: "#fff7ed" }, Delivered: { label: "Delivered", color: "#22c55e", bg: "#dcfce7" },
  Cancelled: { label: "Cancelled", color: "#ef4444", bg: "#fee2e2" },
};
const ORDER_STATUSES = {
  pending: { label: "Pending", color: "#f59e0b", bg: "#fef3c7" }, confirmed: { label: "Confirmed", color: "#3b82f6", bg: "#dbeafe" },
  preparing: { label: "Preparing", color: "#8b5cf6", bg: "#ede9fe" }, ready: { label: "Ready", color: "#06b6d4", bg: "#cffafe" },
  out_for_delivery: { label: "Out for Delivery", color: "#f36b21", bg: "#ffedd5" }, delivered: { label: "Delivered", color: "#22c55e", bg: "#dcfce7" },
  cancelled: { label: "Cancelled", color: "#ef4444", bg: "#fee2e2" },
};
const SEQ = ["Placed", "Confirmed", "Preparing", "Cooked", "Ready", "Out for Delivery", "Reached Drop Location", "Delivered"];
const LIVE_ST = ["Placed", "Confirmed", "Preparing", "Cooked", "Ready", "Out for Delivery", "Pending", "New"];
const fmt = (v) => `\u20B9${Number(v).toLocaleString("en-IN")}`;
const esc = (t) => { if (!t) return ""; const m = {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}; return String(t).replace(/[&<>"']/g, c => m[c]); };
const csvValue = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
const downloadCSV = (filename, rows) => {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [headers.map(csvValue).join(","), ...rows.map(row => headers.map(h => csvValue(row[h])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
const orderItemsCount = (order) => Array.isArray(order.cart) ? order.cart.length : (order.items ? Object.keys(order.items).length : Number(order.items || 0));
const orderItemsText = (order) => Array.isArray(order.cart)
  ? order.cart.map(i => `${i.qty || 1}x ${i.name || i.item || "Item"}`).join(", ")
  : (order.items && typeof order.items === "object" ? Object.values(order.items).map(i => `${i.qty || 1}x ${i.name || i.item || "Item"}`).join(", ") : `${order.items || ""}`);
const validateGSTIN = (g) => { if (!g) return true; return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(g) ? true : {valid:false,msg:"Invalid GSTIN"}; };
const validateFSSAI = (f) => { if (!f) return true; return /^[0-9]{14}$/.test(f) ? true : {valid:false,msg:"FSSAI must be 14 digits"}; };
const validateCoords = (lat,lng) => { const l=parseFloat(lat),n=parseFloat(lng); if(isNaN(l)||l<-90||l>90)return {valid:false,msg:"Invalid Lat"}; if(isNaN(n)||n<-180||n>180)return {valid:false,msg:"Invalid Lng"}; return {valid:true}; };

let _bizId=null,_outletId=null;
function Outlet(path) { return _bizId&&_outletId ? ref(db,`businesses/${_bizId}/outlets/${_outletId}/${path}`) : null; }

// ─── MOCK DATA ──────────────────────────────────────────────────────────────
const PIE_COLORS = ["#f36b21", "#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899"];
const MOCK_ORDERS = [
  { id:"ORD-1001", customer:"Rahul Sharma",  items:3, total:485,  status:"pending",          type:"delivery", time:"2 min ago",  phone:"+91 9876543210", address:"14 MG Road, Ranchi" },
  { id:"ORD-1002", customer:"Priya Singh",   items:2, total:320,  status:"preparing",        type:"dinein",   time:"8 min ago",  phone:"+91 9845671230", address:"Table 4" },
  { id:"ORD-1003", customer:"Amit Kumar",    items:5, total:890,  status:"out_for_delivery", type:"delivery", time:"15 min ago", phone:"+91 9123456789", address:"22 Ashok Nagar" },
  { id:"ORD-1004", customer:"Sunita Verma",  items:1, total:150,  status:"delivered",        type:"takeaway", time:"22 min ago", phone:"+91 9988776655", address:"Takeaway" },
  { id:"ORD-1005", customer:"Deepak Jha",    items:4, total:640,  status:"confirmed",        type:"delivery", time:"5 min ago",  phone:"+91 9012345678", address:"7 Kokar Colony" },
  { id:"ORD-1006", customer:"Anjali Mishra", items:2, total:275,  status:"cancelled",        type:"delivery", time:"30 min ago", phone:"+91 9567890123", address:"Harmu Housing Colony" },
  { id:"ORD-1007", customer:"Vikram Pandey", items:6, total:1120, status:"ready",            type:"delivery", time:"12 min ago", phone:"+91 9345678901", address:"Lalpur Chowk" },
  { id:"ORD-1008", customer:"Neha Gupta",    items:2, total:390,  status:"pending",          type:"dinein",   time:"1 min ago",  phone:"+91 9678901234", address:"Table 7" },
];
const MOCK_RIDERS = [
  { id:"r1", name:"Rajesh Kumar",  phone:"+91 9876543210", vehicle:"bike",   status:"online",  earn:1840, deliv:12, rating:4.7, order:"ORD-1003", zone:"Downtown", joined:"Jan 2024", completed:95, totalOrders:1450 },
  { id:"r2", name:"Suresh Yadav",  phone:"+91 9845671230", vehicle:"scooty", status:"busy",    earn:2100, deliv:15, rating:4.5, order:"ORD-1007", zone:"Kokar",    joined:"Mar 2024", completed:92, totalOrders:1210 },
  { id:"r3", name:"Mohan Singh",   phone:"+91 9765432109", vehicle:"bike",   status:"offline", earn:980,  deliv:7,  rating:4.2, order:null,      zone:"Lalpur",   joined:"Jun 2024", completed:88, totalOrders:890 },
  { id:"r4", name:"Ramesh Thakur", phone:"+91 9654321098", vehicle:"cycle",  status:"online",  earn:1560, deliv:11, rating:4.8, order:null,      zone:"Harmu",    joined:"Feb 2024", completed:97, totalOrders:1620 },
  { id:"r5", name:"Vikram Pandey", phone:"+91 9543210987", vehicle:"bike",   status:"busy",    earn:1920, deliv:13, rating:4.4, order:"ORD-1012", zone:"Doranda",  joined:"May 2024", completed:90, totalOrders:1080 },
  { id:"r6", name:"Arun Kumar",    phone:"+91 9432109876", vehicle:"scooty", status:"offline", earn:750,  deliv:5,  rating:4.0, order:null,      zone:"Bariatu",  joined:"Aug 2024", completed:85, totalOrders:520 },
];
const RIDER_CHART = {
  r1:[{d:"Mon",earn:320},{d:"Tue",earn:280},{d:"Wed",earn:410},{d:"Thu",earn:350},{d:"Fri",earn:520},{d:"Sat",earn:480}],
  r2:[{d:"Mon",earn:380},{d:"Tue",earn:420},{d:"Wed",earn:310},{d:"Thu",earn:490},{d:"Fri",earn:550},{d:"Sat",earn:510}],
  r3:[{d:"Mon",earn:200},{d:"Tue",earn:180},{d:"Wed",earn:250},{d:"Thu",earn:190},{d:"Fri",earn:220},{d:"Sat",earn:170}],
  r4:[{d:"Mon",earn:290},{d:"Tue",earn:340},{d:"Wed",earn:270},{d:"Thu",earn:380},{d:"Fri",earn:430},{d:"Sat",earn:460}],
  r5:[{d:"Mon",earn:350},{d:"Tue",earn:300},{d:"Wed",earn:380},{d:"Thu",earn:420},{d:"Fri",earn:470},{d:"Sat",earn:430}],
  r6:[{d:"Mon",earn:150},{d:"Tue",earn:120},{d:"Wed",earn:180},{d:"Thu",earn:140},{d:"Fri",earn:160},{d:"Sat",earn:130}],
};
const ORDER_ITEMS = {
  "ORD-1001":[{name:"Butter Chicken",qty:2,price:350},{name:"Naan",qty:4,price:60},{name:"Dal Makhani",qty:1,price:180}],
  "ORD-1002":[{name:"Paneer Tikka",qty:1,price:280},{name:"Naan",qty:2,price:60}],
  "ORD-1003":[{name:"Chicken Biryani",qty:3,price:250},{name:"Raita",qty:3,price:40},{name:"Gulab Jamun",qty:2,price:80}],
  "ORD-1005":[{name:"Tandoori Chicken",qty:2,price:300},{name:"Naan",qty:2,price:60}],
  "ORD-1007":[{name:"Seekh Kebab",qty:6,price:160},{name:"Roomali Roti",qty:6,price:30}],
  "ORD-1008":[{name:"Chole Bhature",qty:2,price:160},{name:"Lassi",qty:2,price:70}],
};
const ORDER_NOTES = {
  "ORD-1001":"Extra spicy, please!",
  "ORD-1003":"No onion, no garlic",
  "ORD-1008":"Call before delivery — gate code: 4521",
};
const MOCK_FEEDBACK = [
  { id:1, customer:"Rahul S.", rating:5, comment:"Amazing food and super fast delivery! The butter chicken was exceptional.", dish:"Butter Chicken", time:"1 hr ago" },
  { id:2, customer:"Priya S.", rating:4, comment:"Really good paneer tikka. Could be a bit more spicy but overall great.", dish:"Paneer Tikka", time:"3 hrs ago" },
  { id:3, customer:"Amit K.", rating:5, comment:"Best biryani in Ranchi! Will definitely order again.", dish:"Biryani", time:"5 hrs ago" },
  { id:4, customer:"Neha G.", rating:3, comment:"Food was good but delivery took longer than expected.", dish:"Dal Makhani", time:"Yesterday" },
  { id:5, customer:"Deepak J.", rating:5, comment:"Excellent quality and packaging. Rider was very polite.", dish:"Tandoori Chicken", time:"2 days ago" },
];
const MOCK_LOST = [
  { id:"ORD-0985", customer:"Arun Tiwari",   reason:"Customer cancelled", time:"Yesterday", total:480 },
  { id:"ORD-0971", customer:"Suman Devi",    reason:"Item unavailable",   time:"2 days ago", total:320 },
  { id:"ORD-0954", customer:"Manish Roy",    reason:"No rider available",  time:"3 days ago", total:890 },
  { id:"ORD-0940", customer:"Kavita Sinha",  reason:"Customer cancelled", time:"4 days ago", total:225 },
  { id:"ORD-0921", customer:"Pankaj Gupta",  reason:"Store closed",       time:"5 days ago", total:650 },
];
const MOCK_TRANSACTIONS = [
  { id:"TXN-001", date:"May 23", type:"Order Sales",    amount:8450,  method:"UPI",  status:"settled" },
  { id:"TXN-002", date:"May 23", type:"Commission",     amount:-845,  method:"Auto", status:"settled" },
  { id:"TXN-003", date:"May 22", type:"Order Sales",    amount:11200, method:"UPI",  status:"settled" },
  { id:"TXN-004", date:"May 22", type:"Rider Payout",   amount:-1840, method:"NEFT", status:"pending" },
  { id:"TXN-005", date:"May 21", type:"Order Sales",    amount:9600,  method:"UPI",  status:"settled" },
  { id:"TXN-006", date:"May 21", type:"Refund Issued",  amount:-320,  method:"UPI",  status:"settled" },
];
const MOCK_PARTNERS = [
  { id:"p1", name:"Ravi Supplies Co.",    type:"Raw Materials", status:"pending",  since:"May 20", contact:"9876001234" },
  { id:"p2", name:"Freshmart Veggies",    type:"Vegetables",    status:"approved", since:"Apr 12", contact:"9812345678" },
  { id:"p3", name:"SpiceBox India",       type:"Spices",        status:"pending",  since:"May 22", contact:"9901234567" },
  { id:"p4", name:"Dairy Fresh Pvt Ltd",  type:"Dairy",         status:"rejected", since:"May 10", contact:"9845611234" },
];
const MOCK_INVENTORY = [
  { id:1, name:"Chicken (kg)",   stock:12, threshold:5,  unit:"kg" },
  { id:2, name:"Paneer (kg)",    stock:3,  threshold:4,  unit:"kg" },
  { id:3, name:"Rice (kg)",      stock:25, threshold:10, unit:"kg" },
  { id:4, name:"Tomatoes (kg)",  stock:2,  threshold:5,  unit:"kg" },
  { id:5, name:"Onions (kg)",    stock:18, threshold:8,  unit:"kg" },
  { id:6, name:"Cream (L)",      stock:4,  threshold:3,  unit:"L"  },
  { id:7, name:"Butter (kg)",    stock:1,  threshold:2,  unit:"kg" },
  { id:8, name:"Maida (kg)",     stock:30, threshold:10, unit:"kg" },
];
const WEEK_DATA = [
  { d:"Mon", rev:38000, ord:62 }, { d:"Tue", rev:42000, ord:68 },
  { d:"Wed", rev:35000, ord:55 }, { d:"Thu", rev:51000, ord:84 },
  { d:"Fri", rev:68000, ord:110 }, { d:"Sat", rev:82000, ord:134 },
  { d:"Sun", rev:74000, ord:121 },
];
const CAT_DATA = [
  { name:"Main Course", value:38 }, { name:"Starters", value:22 },
  { name:"Rice", value:18 }, { name:"Desserts", value:12 }, { name:"Breads", value:10 },
];
const PREV_WEEK_DATA = [
  { d:"Mon", rev:32000, ord:51 }, { d:"Tue", rev:38000, ord:60 },
  { d:"Wed", rev:40000, ord:63 }, { d:"Thu", rev:45000, ord:72 },
  { d:"Fri", rev:59000, ord:95 }, { d:"Sat", rev:75000, ord:122 },
  { d:"Sun", rev:68000, ord:108 },
];
const HOURLY_DATA = [
  { h:"8a", ord:12 }, { h:"9a", ord:18 }, { h:"10a", ord:24 }, { h:"11a", ord:35 },
  { h:"12p", ord:58 }, { h:"1p", ord:62 }, { h:"2p", ord:38 }, { h:"3p", ord:22 },
  { h:"4p", ord:18 }, { h:"5p", ord:28 }, { h:"6p", ord:45 }, { h:"7p", ord:67 },
  { h:"8p", ord:71 }, { h:"9p", ord:52 }, { h:"10p", ord:31 },
];

const stockStatus = (stock, thr) => stock === 0 ? "critical" : stock <= thr ? "low" : "ok";
const statusColors = { ok: { color: COLORS.success, bg: "#dcfce7" }, low: { color: COLORS.warning, bg: "#fef3c7" }, critical: { color: COLORS.error, bg: "#fee2e2" } };

const KPICard = ({ title, value, sub, icon: Icon, color = ORANGE }) => (
  <GlassCard className="p-4 flex flex-col gap-2">
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
      <span className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}18` }}>
        <Icon size={15} style={{ color }} />
      </span>
    </div>
    <div className="text-2xl font-bold text-slate-800" style={{ fontFamily: "'Outfit', sans-serif" }}>{value}</div>
    {sub && <div className="text-xs text-slate-500">{sub}</div>}
  </GlassCard>
);
const StarRating = ({ rating }) => (
  <div style={{ display:"flex", alignItems:"center", gap:2 }}>
    {[1,2,3,4,5].map(i => <Star key={i} size={11} fill={i <= Math.round(rating) ? "#f59e0b" : "none"} stroke={i <= Math.round(rating) ? "#f59e0b" : "#cbd5e1"} />)}
    <span style={{ fontSize:11, color:"#64748b", marginLeft:2 }}>{rating}</span>
  </div>
);
const Pill = ({ label, active, onClick }) => (
  <div onClick={onClick} style={{ padding:"5px 14px", borderRadius:99, cursor:"pointer", fontSize:12, fontWeight:600, whiteSpace:"nowrap", transition:"all 0.2s", color:active?"white":"#64748b", background:active?ORANGE:"#f1f5f9" }}>{label}</div>
);
const ToggleSwitch = ({ checked, onChange }) => (
  <div onClick={()=>onChange(!checked)} style={{ width:36, height:20, borderRadius:10, background:checked?ORANGE:"#cbd5e1", position:"relative", cursor:"pointer", flexShrink:0 }}>
    <div style={{ width:16, height:16, borderRadius:"50%", background:"white", position:"absolute", top:2, boxShadow:"0 1px 3px rgba(0,0,0,0.15)", transition:"left 0.15s", left:checked?"18px":"2px" }} />
  </div>
);
const EmptyState = ({ icon: Icon, msg }) => (
  <div style={{ textAlign:"center", padding:40, color:"#94a3b8" }}>
    <Icon size={36} style={{ margin:"0 auto 8px", opacity:0.3 }} />
    <div style={{ fontSize:13, fontWeight:500 }}>{msg}</div>
  </div>
);
const SectionHeader = ({ title, action }) => (
  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
    <h3 style={{ fontSize:14, fontWeight:700, color:"#0f172a", margin:0, fontFamily:"'Outfit', sans-serif" }}>{title}</h3>
    {action}
  </div>
);

// Shared components
const StatusBadge = ({ status }) => {
  const s = ORD_ST[status] || ORDER_STATUSES[status] || { label: status || "Unknown", color: "#64748b", bg: "#f1f5f9" };
  return <span style={{ padding:"2px 10px", borderRadius:99, fontSize:11, fontWeight:600, whiteSpace:"nowrap", color:s.color, backgroundColor:s.bg, border:`1px solid ${s.color}30` }}>● {s.label}</span>;
};
const GlassCard = ({ children, className="", style }) => (
  <div className={className} style={{ background:"rgba(255,255,255,0.85)", backdropFilter:"blur(12px)", borderRadius:16, border:"1px solid rgba(243,107,33,0.08)", boxShadow:"0 4px 24px rgba(0,0,0,0.04)", ...style }}>{children}</div>
);
const BtnPrimary = ({ children, className="", style, onClick, disabled, type = "button" }) => (
  <button type={type} onClick={onClick} disabled={disabled} className={className} style={{ background:`linear-gradient(135deg,${ORANGE},#e85d1a)`, color:"white", border:"none", fontWeight:600, cursor:disabled?"not-allowed":"pointer", opacity:disabled?0.5:1, fontSize:14, transition:"all 0.2s", borderRadius:10, padding:"10px 18px", ...style }}>{children}</button>
);
const BtnSecondary = ({ children, style, onClick }) => (
  <button onClick={onClick} style={{ padding:"8px 14px", borderRadius:10, border:"1.5px solid #e2e8f0", background:"white", fontSize:13, fontWeight:600, color:"#475569", cursor:"pointer", transition:"all 0.2s", ...style }}>{children}</button>
);
const Modal = ({ children, open, onClose, wide }) => open ? (
  <div style={{ position:"fixed", inset:0, zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
    <div onClick={onClose} style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.5)" }} />
    <div style={{ position:"relative", maxWidth:wide?700:500, width:"100%", maxHeight:"90vh", overflow:"auto", background:"white", borderRadius:20, padding:24, boxShadow:"0 24px 80px rgba(0,0,0,0.2)" }}>{children}</div>
  </div>
) : null;
const Toast = ({ msg, type, onClose }) => (
  <div onClick={onClose} style={{ position:"fixed", bottom:80, left:"50%", transform:"translateX(-50%)", zIndex:99999, display:"flex", alignItems:"center", gap:10, padding:"12px 20px", borderRadius:12, background:type==="error"?"#ef4444":type==="info"?"#3b82f6":"#16a34a", color:"white", fontSize:13, fontWeight:500, boxShadow:"0 8px 32px rgba(0,0,0,0.15)", cursor:"pointer", maxWidth:"90vw" }}>
    <CheckCircle size={16} />{msg}
  </div>
);
const Avatar = ({ name, size=32 }) => {
  const initials = (name||"A").split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2);
  return <div style={{ width:size, height:size, borderRadius:"50%", background:`linear-gradient(135deg,${ORANGE},#e85d1a)`, display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:size*0.38, fontWeight:700, flexShrink:0 }}>{initials}</div>;
};
const Loading = () => (
  <div className="text-center py-12" style={{ color:"#94a3b8" }}>
    <div style={{ width:32, height:32, border:"3px solid #f1f5f9", borderTopColor:ORANGE, borderRadius:"50%", animation:"spin 0.8s linear infinite", margin:"0 auto 8px" }} />
    <div style={{ fontSize:13 }}>Loading...</div>
  </div>
);
const Input = (p) => <input {...p} style={{ padding:"10px 14px", borderRadius:10, border:"1.5px solid #e2e8f0", fontSize:13, color:"#1e293b", background:"#f8fafc", outline:"none", width:"100%", transition:"border-color 0.2s", ...p.style }} />;
const Select = ({ children, ...p }) => <select {...p} style={{ padding:"10px 14px", borderRadius:10, border:"1.5px solid #e2e8f0", fontSize:13, color:"#1e293b", background:"#f8fafc", outline:"none", width:"100%", ...p.style }}>{children}</select>;
const StatCard = ({ label, value, icon: Icon, color, bg, sub }) => (
  <GlassCard className="p-4 flex flex-col gap-2" style={{ flex: 1, minWidth: 160 }}>
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
      <span className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: bg || `${color || ORANGE}18` }}>
        <Icon size={15} style={{ color: color || ORANGE }} />
      </span>
    </div>
    <div className="text-2xl font-bold" style={{ fontFamily: "'Outfit', sans-serif", color: color || ORANGE }}>{value ?? "—"}</div>
    {sub && <div className="text-xs text-slate-500">{sub}</div>}
  </GlassCard>
);
const SectionLabel = ({ children }) => <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:0.8, color:"#94a3b8", marginBottom:8 }}>{children}</div>;

// ─── NAVIGATION ──────────────────────────────────────────────────────────
const NAV_GROUPS = [
  { label:"Main", items:[{ id:"dashboard",label:"Dashboard",icon:LayoutDashboard },{ id:"orders",label:"Orders",icon:ShoppingBag },{ id:"liveops",label:"Live Ops",icon:Zap },{ id:"kitchen",label:"Kitchen",icon:ChefHat }]},
  { label:"Sales", items:[{ id:"pos",label:"POS",icon:Monitor },{ id:"menu",label:"Menu",icon:UtensilsCrossed },{ id:"categories",label:"Categories",icon:Tag }]},
  { label:"Data", items:[{ id:"inventory",label:"Inventory",icon:Package },{ id:"customers",label:"Customers",icon:Users },{ id:"riders",label:"Riders",icon:Bike },{ id:"partners",label:"Partners",icon:Handshake }]},
  { label:"Insights", items:[{ id:"analytics",label:"Analytics",icon:BarChart3 },{ id:"lostsales",label:"Lost Sales",icon:TrendingDown },{ id:"settlements",label:"Settlements",icon:CreditCard }]},
  { label:"Tools", items:[{ id:"notifications",label:"Notifications",icon:Bell,badge:"3" },{ id:"feedback",label:"Feedback",icon:MessageSquare },{ id:"livetracker",label:"Live Tracker",icon:MapPin },{ id:"settings",label:"Settings",icon:Settings }]},
];
const MOBILE_NAV = [{ id:"dashboard",label:"Home",icon:LayoutDashboard },{ id:"orders",label:"Orders",icon:ShoppingBag },{ id:"pos",label:"POS",icon:Monitor },{ id:"menu",label:"Menu",icon:UtensilsCrossed },{ id:"settings",label:"Settings",icon:Settings }];
const PAGE_TITLES = { dashboard:"Dashboard", orders:"Orders", liveops:"Live Operations", kitchen:"Kitchen", pos:"Point of Sale", menu:"Menu Management", categories:"Categories", inventory:"Inventory", customers:"Customers", riders:"Riders", partners:"Partners", analytics:"Analytics", lostsales:"Lost Sales", settlements:"Settlements", notifications:"Notifications", feedback:"Customer Feedback", livetracker:"Live Rider Tracker", settings:"Settings" };

// ═══════════════════════════════════════════════════════════════════════════
// DASHBOARD PAGE
// ═══════════════════════════════════════════════════════════════════════════
function DashboardPage({ showToast }) {
  const [orders, setOrders] = useState([]);
  const [riderCount, setRiderCount] = useState(0);
  const [tab, setTab] = useState("today");

  useEffect(() => {
    const r = Outlet("orders");
    if (!r) return;
    const unsub = onValue(r, snap => { const v=snap.val(); setOrders(v?Object.keys(v).map(k=>({id:k,...v[k]})):[]); });
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

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(180px,1fr))", gap:16, marginBottom:24 }}>
        <StatCard label="Today's Revenue" value={fmt(todayRev)} icon={Wallet} color="#16a34a" bg="rgba(22,163,74,0.1)" sub={`${todayOrd.length} orders`} />
        <StatCard label="Pending" value={todayOrd.filter(o=>o.status==="Placed").length} icon={Clock} color="#f59e0b" bg="rgba(245,158,11,0.1)" sub="Awaiting action" />
        <StatCard label="In Progress" value={pending} icon={TrendingUp} color="#8b5cf6" bg="rgba(139,92,246,0.1)" sub="Being prepared" />
        <StatCard label="Active Riders" value={riderCount} icon={Bike} color={ORANGE} bg="rgba(243,107,33,0.1)" sub="On the road" />
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
            <AreaChart data={tab==="today"?[{t:"8am",rev:1200},{t:"10am",rev:2800},{t:"12pm",rev:8200},{t:"2pm",rev:7200},{t:"4pm",rev:3200},{t:"6pm",rev:7800},{t:"8pm",rev:13400}]:[{d:"Mon",rev:38000},{d:"Tue",rev:42000},{d:"Wed",rev:35000},{d:"Thu",rev:51000},{d:"Fri",rev:68000},{d:"Sat",rev:82000},{d:"Sun",rev:74000}]}>
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
function OrdersPage({ showToast }) {
  const [search, setSearch] = useState("");
  const [orderTab, setOrderTab] = useState("all");
  const [orders, setOrders] = useState([]);
  const [selOrder, setSelOrder] = useState(null);
  const [riders, setRiders] = useState([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    const r = Outlet("orders");
    if (!r) return;
    const unsub = onValue(r, snap => { const v=snap.val(); setOrders(v?Object.keys(v).map(k=>({id:k,...v[k]})):[]); });
    const r2 = ref(db,"riders");
    const unsub2 = onValue(r2, snap => { const rd=[]; snap.forEach(ch=>rd.push({id:ch.key,...ch.val()})); setRiders(rd); });
    return () => { off(r,"value",unsub); off(r2,"value",unsub2); };
  }, []);

  const filtered = useMemo(() => {
    let list = [...orders];
    if (orderTab === "live") list = list.filter(o => LIVE_ST.includes(o.status));
    else if (orderTab === "history") list = list.filter(o => !LIVE_ST.includes(o.status));
    if (search) { const s=search.toLowerCase(); list = list.filter(o => (o.customerName||"").toLowerCase().includes(s) || (o.phone||"").includes(s) || (o.orderId||o.id).toLowerCase().includes(s)); }
    if (fromDate && toDate) { list = list.filter(o => o.createdAt && new Date(o.createdAt).toISOString().split("T")[0] >= fromDate && new Date(o.createdAt).toISOString().split("T")[0] <= toDate); }
    return list.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  }, [orders, search, orderTab, fromDate, toDate]);

  const updateStatus = useCallback(async (id, status) => {
    const order = orders.find(o=>o.id===id);
    if (!order) return;
    const seq = SEQ;
    const curLvl = seq.indexOf(order.status);
    const newLvl = seq.indexOf(status);
    if (status === "Cancelled" && order.status === "Delivered") { showToast("Cannot cancel a delivered order","error"); return; }
    if (status !== "Cancelled" && newLvl !== curLvl+1 && status !== order.status) { const expected = seq[curLvl+1]||"None"; showToast(`Next step must be "${expected}"`,"error"); return; }
    if (status === "Out for Delivery" && !order.riderId) { showToast("Assign a rider first","error"); return; }
    try {
      await update(Outlet(`orders/${id}`), { status, paymentStatus: status==="Delivered"?"Paid":order.paymentStatus });
      showToast(`Status → ${status}`,"success");
    } catch(e) { showToast("Update failed","error"); }
  }, [orders, showToast]);

  const assignRider = useCallback(async (orderId, riderId) => {
    try {
      const snap = await get(Outlet(`orders/${orderId}`));
      const o = snap.val();
      if (!o) return;
      const rs = await get(ref(db,`riders/${riderId}`));
      const rider = rs.val();
      await update(Outlet(`orders/${orderId}`), { riderId, assignedRider:rider?.email, riderName:rider?.name, riderPhone:rider?.phone, assignedAt:serverTimestamp() });
      showToast(`Rider ${rider?.name||''} assigned`,"success");
    } catch(e) { showToast("Assignment failed","error"); }
  }, [showToast]);

  const deleteOrder = useCallback(async (id) => {
    if (!confirm("Delete this order permanently?")) return;
    try {
      await remove(Outlet(`orders/${id}`));
      setSelOrder(null);
      showToast("Order deleted", "success");
    } catch(e) {
      showToast("Delete failed", "error");
    }
  }, [showToast]);

  const exportOrders = useCallback(() => {
    downloadCSV(`orders-${new Date().toISOString().slice(0,10)}.csv`, filtered.map((o, index) => ({
      row: index + 1,
      orderId: o.orderId || o.id,
      customer: o.customerName || "Guest",
      phone: o.phone || "",
      items: orderItemsText(o),
      itemCount: orderItemsCount(o),
      total: o.total || 0,
      paymentMethod: o.paymentMethod || "Cash",
      paymentStatus: o.paymentStatus || "",
      status: o.status || "",
      rider: o.riderName || "",
      createdAt: o.createdAt || "",
    })));
    showToast("Orders exported", "success");
  }, [filtered, showToast]);

  const activeRiders = riders.filter(r=>r.status==="Online"||r.status==="On Delivery");

  return (
    <div>
      <div className="sheet-toolbar">
        <div style={{ flex:1, minWidth:240, position:"relative", maxWidth:420 }}>
          <Search size={14} style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"#94a3b8" }} />
          <input className="sheet-input" placeholder="Search orders, customers, phone..." value={search} onChange={e=>setSearch(e.target.value)} style={{ paddingLeft:32 }} />
        </div>
        <div className="sheet-actions">
          <input className="sheet-input" type="date" value={fromDate} onChange={e=>setFromDate(e.target.value)} />
          <input className="sheet-input" type="date" value={toDate} onChange={e=>setToDate(e.target.value)} />
          {[{id:"all",label:"All"}, {id:"live",label:"Live"}, {id:"history",label:"History"}].map(t=>(
            <button type="button" key={t.id} onClick={()=>setOrderTab(t.id)} className="sheet-button" style={{ color:orderTab===t.id?"white":"#64748b", background:orderTab===t.id?ORANGE:"#fff", borderColor:orderTab===t.id?ORANGE:"#e2e8f0" }}>{t.label} {t.id==="live"?`(${orders.filter(o=>LIVE_ST.includes(o.status)).length})`:""}</button>
          ))}
          <button type="button" className="sheet-button" onClick={exportOrders}><Download size={14} /> Export CSV</button>
        </div>
      </div>
      <GlassCard style={{ overflow:"hidden" }}>
        <div className="sheet-table-wrap">
        <table className="sheet-table">
          <thead><tr>
            <th className="sheet-row-number">#</th>
            <th>Order</th>
            <th>Customer</th>
            <th>Phone</th>
            <th>Items</th>
            <th>Total</th>
            <th>Payment</th>
            <th>Status</th>
            <th>Rider</th>
            <th>Created</th>
            <th>Actions</th>
          </tr></thead>
          <tbody>
            {filtered.map((o, index) => (
              <tr key={o.id} onDoubleClick={()=>setSelOrder(o)}>
                <td className="sheet-row-number">{index + 1}</td>
                <td className="sheet-cell-strong" style={{ color:ORANGE, fontFamily:"monospace" }}>#{o.orderId||o.id.slice(-5)}</td>
                <td className="sheet-cell-strong">
                  {o.customerName||"Guest"}
                </td>
                <td>{o.phone||""}</td>
                <td title={orderItemsText(o)}>
                  {(Array.isArray(o.cart)?o.cart.length+" items":(o.items?Object.keys(o.items).length+" items":"—"))}
                </td>
                <td className="sheet-cell-strong" style={{ textAlign:"right" }}>{fmt(o.total)}</td>
                <td>{o.paymentMethod||"Cash"} {o.paymentStatus ? `/${o.paymentStatus}` : ""}</td>
                <td>
                  <select className="sheet-select" value={o.status || ""} onChange={e=>updateStatus(o.id,e.target.value)} onClick={e=>e.stopPropagation()}>
                    {[...new Set([o.status, ...SEQ, "Cancelled"].filter(Boolean))].map(s=><option key={s} value={s}>{ORD_ST[s]?.label || ORDER_STATUSES[s]?.label || s}</option>)}
                  </select>
                </td>
                <td>
                  <select className="sheet-select" value={o.riderId || ""} onChange={e=>e.target.value && assignRider(o.id,e.target.value)} onClick={e=>e.stopPropagation()}>
                    <option value="">{o.riderName || "Unassigned"}</option>
                    {activeRiders.map(r=><option key={r.id} value={r.id}>{r.name || r.email || r.id}</option>)}
                  </select>
                </td>
                <td>{o.createdAt ? new Date(o.createdAt).toLocaleString("en-IN") : ""}</td>
                <td>
                  <div style={{ display:"flex", gap:6 }}>
                    <button type="button" className="sheet-icon-button" title="Open order" onClick={()=>setSelOrder(o)}><Eye size={14} /></button>
                    <button type="button" className="sheet-icon-button sheet-danger" title="Delete order" onClick={()=>deleteOrder(o.id)}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        {filtered.length===0&&<div style={{ textAlign:"center", padding:40, color:"#94a3b8", fontSize:13 }}>No orders found</div>}
      </GlassCard>

      {/* Order Detail Drawer */}
      <Modal open={!!selOrder} onClose={()=>setSelOrder(null)} wide>
        {selOrder && (()=>{
          const items = Array.isArray(selOrder.cart)?selOrder.cart:(selOrder.items?Object.values(selOrder.items):[]);
          return <div>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
              <div><div style={{ fontSize:18, fontWeight:800, color:"#0f172a" }}>Order #{selOrder.orderId||selOrder.id.slice(-5)}</div>
              <div style={{ fontSize:12, color:"#64748b" }}>{selOrder.createdAt?new Date(selOrder.createdAt).toLocaleString():""}</div></div>
              <StatusBadge status={selOrder.status} />
            </div>
            <div className="flex gap-3 mb-4" style={{ display:"flex", gap:12, marginBottom:16 }}>
              <div style={{ flex:1, padding:12, borderRadius:12, background:"#f8fafc" }}>
                <div style={{ fontSize:11, color:"#64748b", marginBottom:2 }}>Customer</div>
                <div style={{ fontSize:14, fontWeight:600, color:"#0f172a" }}>{selOrder.customerName||"Guest"}</div>
                <div style={{ fontSize:12, color:"#64748b" }}>{selOrder.phone||""}</div>
              </div>
              <div style={{ flex:1, padding:12, borderRadius:12, background:"#f8fafc" }}>
                <div style={{ fontSize:11, color:"#64748b", marginBottom:2 }}>Delivery</div>
                <div style={{ fontSize:13, color:"#0f172a" }}>{selOrder.address||"Counter Sale"}</div>
                {(selOrder.lat&&selOrder.lng)&&<a href={`https://www.google.com/maps?q=${selOrder.lat},${selOrder.lng}`} target="_blank" style={{ fontSize:11, color:ORANGE, fontWeight:600 }}>📍 View Map</a>}
              </div>
            </div>
            <SectionLabel>Items ({items.length})</SectionLabel>
            <div style={{ marginBottom:16 }}>
              {items.map((item,i)=>(
                <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid #f1f5f9" }}>
                  <div><div style={{ fontSize:13, fontWeight:500, color:"#0f172a" }}>{item.name||item.item} {item.size?`(${item.size})`:""}</div>
                  {item.addons&&Array.isArray(item.addons)&&item.addons.map((a,j)=><span key={j} style={{ fontSize:11, color:"#64748b", marginRight:4 }}>+{a.name||a}</span>)}</div>
                  <div style={{ textAlign:"right" }}><div style={{ fontSize:13, fontWeight:700 }}>₹{item.price||item.total||0}</div><div style={{ fontSize:11, color:"#94a3b8" }}>x{item.qty||1}</div></div>
                </div>
              ))}
            </div>
            <div style={{ padding:16, borderRadius:12, background:"#0f172a", color:"white", marginBottom:16 }}>
              <div className="flex justify-between mb-2" style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}><span style={{ opacity:0.7, fontSize:13 }}>Subtotal</span><span>₹{selOrder.subtotal||0}</span></div>
              <div className="flex justify-between mb-2" style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}><span style={{ opacity:0.7, fontSize:13 }}>Discount</span><span style={{ color:"#22c55e" }}>-₹{selOrder.discount||0}</span></div>
              <div className="flex justify-between mb-2" style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}><span style={{ opacity:0.7, fontSize:13 }}>Delivery</span><span>₹{selOrder.deliveryFee||0}</span></div>
              <div style={{ borderTop:"1px solid rgba(255,255,255,0.1)", paddingTop:12, display:"flex", justifyContent:"space-between" }}>
                <span style={{ fontWeight:700 }}>Total</span><span style={{ fontSize:20, fontWeight:800, color:ORANGE }}>{fmt(selOrder.total)}</span>
              </div>
            </div>
            <SectionLabel>Controls</SectionLabel>
            <div className="flex gap-3" style={{ display:"flex", gap:12 }}>
              <select onChange={e=>{const v=e.target.value;if(v)updateStatus(selOrder.id,v);e.target.value="";}} style={{ flex:1, padding:"10px 14px", borderRadius:10, border:"1.5px solid #e2e8f0", fontSize:13 }}>
                <option value="">Update Status</option>
                {SEQ.filter(s=>s!==selOrder.status).map(s=><option key={s} value={s}>{s}</option>)}
                {selOrder.status!=="Delivered"&&selOrder.status!=="Cancelled"&&<option value="Cancelled">Cancel Order</option>}
              </select>
              <select onChange={e=>{const v=e.target.value;if(v)assignRider(selOrder.id,v);e.target.value="";}} style={{ flex:1, padding:"10px 14px", borderRadius:10, border:"1.5px solid #e2e8f0", fontSize:13 }}>
                <option value="">{selOrder.riderId?"Change Rider":"Assign Rider"}</option>
                {activeRiders.map(r=><option key={r.id} value={r.id}>{r.name} ({r.status})</option>)}
              </select>
            </div>
          </div>;
        })()}
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORIES PAGE (CRUD with addons)
// ═══════════════════════════════════════════════════════════════════════════
function CategoriesPage({ showToast }) {
  const [cats, setCats] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState(""); const [order, setOrder] = useState(0); const [img, setImg] = useState("");

  useEffect(() => {
    const r = Outlet("categories");
    if (!r) return;
    return onValue(r, snap => { const v=snap.val(); setCats(v?Object.keys(v).map(k=>({id:k,...v[k]})).sort((a,b)=>(a.order||0)-(b.order||0)):[]); });
  }, []);

  const handleSave = async () => {
    if (!name.trim()) return showToast("Enter category name","warning");
    try { await push(Outlet("categories"), { name:name.trim(), image:img, order:Number(order), addons:null }); setName(""); setOrder(0); setImg(""); setShowForm(false); showToast("Category added","success"); }
    catch(e) { showToast("Failed: "+e.message,"error"); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this category and associated dishes?")) return;
    try { await remove(Outlet(`categories/${id}`)); showToast("Deleted","success"); }
    catch(e) { showToast("Delete failed","error"); }
  };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <h3 style={{ fontSize:16, fontWeight:700, color:"#0f172a", margin:0 }}>Categories ({cats.length})</h3>
        <BtnPrimary onClick={()=>setShowForm(true)}><Plus size={14} /> Add Category</BtnPrimary>
      </div>
      <GlassCard>
        {cats.map(c => (
          <div key={c.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", borderBottom:"1px solid #f8fafc" }}>
            <img src={c.image||"https://placehold.co/40/orange/white?text=Cat"} style={{ width:40, height:40, borderRadius:8, objectFit:"cover" }} alt="" />
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:600, color:"#0f172a" }}>{c.name}</div>
              <div style={{ fontSize:11, color:"#94a3b8" }}>Serial: {c.order||0}{c.addons?` · ${Object.keys(c.addons).length} addons`:""}</div>
            </div>
            <Trash2 size={14} color="#ef4444" style={{ cursor:"pointer" }} onClick={()=>handleDelete(c.id)} />
          </div>
        ))}
        {cats.length===0&&<div style={{ textAlign:"center", padding:40, color:"#94a3b8", fontSize:13 }}>No categories yet</div>}
      </GlassCard>
      <Modal open={showForm} onClose={()=>setShowForm(false)}>
        <h3 style={{ fontSize:16, fontWeight:700, color:"#0f172a", marginBottom:16 }}>Add Category</h3>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <Input placeholder="Category name" value={name} onChange={e=>setName(e.target.value)} />
          <Input placeholder="Image URL" value={img} onChange={e=>setImg(e.target.value)} />
          <Input type="number" placeholder="Display order (0,1,2...)" value={order} onChange={e=>setOrder(e.target.value)} />
          <BtnPrimary onClick={handleSave} style={{ width:"100%" }}>Save Category</BtnPrimary>
        </div>
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MENU PAGE (CRUD with sizes, addons)
// ═══════════════════════════════════════════════════════════════════════════
function MenuPage({ showToast }) {
  const [dishes, setDishes] = useState([]);
  const [cats, setCats] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [f, setF] = useState({ name:"", category:"", price:0, image:"", order:0, stock:0, threshold:5, sizes:"", addons:"" });
  const [sizeList, setSizeList] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const r = Outlet("dishes");
    const r2 = Outlet("categories");
    if (!r||!r2) return;
    const u1 = onValue(r, snap => { 
      const v=snap.val(); 
      const dishesData = v?Object.keys(v).map(k=>({id:k,...v[k]})).sort((a,b)=>(a.order||0)-(b.order||0)):[];
      // Auto-migrate old stock:boolean to stock:numeric
      dishesData.forEach(d => {
        if (typeof d.stock === "boolean") {
          update(Outlet(`dishes/${d.id}`), { stock: 0, threshold: 5 });
          d.stock = 0;
          d.threshold = 5;
        } else if (typeof d.stock !== "number") {
          d.stock = Number(d.stock) || 0;
        }
        d.threshold = Number(d.threshold) || 5;
      });
      setDishes(dishesData); 
    });
    const u2 = onValue(r2, snap => { const v=snap.val(); setCats(v?Object.keys(v).map(k=>({id:k,...v[k]})):[]); });
    return () => { off(r,"value",u1); off(r2,"value",u2); };
  }, []);

  const filtered = useMemo(() => {
    if (!search) return dishes;
    const s = search.toLowerCase();
    return dishes.filter(d => d.name.toLowerCase().includes(s)||(d.category||"").toLowerCase().includes(s));
  }, [dishes, search]);

  const openForm = (d) => {
    if (d) { setEditId(d.id); setF({ name:d.name||"", category:d.category||"", price:d.price||0, image:d.image||"", order:d.order||0, stock:typeof d.stock==="number"?d.stock:0, threshold:Number(d.threshold)||5, sizes:d.sizes?JSON.stringify(d.sizes):"", addons:d.addons?JSON.stringify(d.addons):"" }); setSizeList(d.sizes?Object.entries(d.sizes).map(([n,p])=>({name:n,price:Number(p)})):[{name:"Regular",price:d.price||0}]); }
    else { setEditId(null); setF({ name:"", category:cats[0]?.name||"", price:0, image:"", order:0, stock:0, threshold:5, sizes:"", addons:"" }); setSizeList([{name:"Regular",price:0}]); }
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!f.name.trim()||!f.category) return showToast("Fill name & category","warning");
    let sizes = null, addons = null;
    if (sizeList.some(s=>s.name.trim())) sizes = sizeList.filter(s=>s.name.trim()).reduce((a,{name:n,price:p})=>({...a,[n.trim()]:Number(p)}),{});
    try { if (f.addons.trim()) addons = JSON.parse(f.addons); } catch(e) { return showToast("Invalid addons JSON","error"); }
    const data = { name:f.name.trim(), category:f.category, price:Number(f.price), image:f.image, order:Number(f.order), stock:Number(f.stock), threshold:Number(f.threshold), sizes, addons };
    try {
      if (editId) { await update(Outlet(`dishes/${editId}`), data); showToast("Dish updated","success"); }
      else { await push(Outlet("dishes"), data); showToast("Dish added","success"); }
      setShowForm(false);
    } catch(e) { showToast("Failed: "+e.message,"error"); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this dish?")) return;
    try { await remove(Outlet(`dishes/${id}`)); showToast("Deleted","success"); } catch(e) { showToast("Delete failed","error"); }
  };


  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, gap:12 }}>
        <div style={{ flex:1, position:"relative", maxWidth:300 }}>
          <Search size={14} style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"#94a3b8" }} />
          <input placeholder="Search dishes..." value={search} onChange={e=>setSearch(e.target.value)} style={{ padding:"8px 10px 8px 32px", borderRadius:10, border:"1.5px solid #e2e8f0", fontSize:13, width:"100%", background:"#f8fafc", outline:"none" }} />
        </div>
        <BtnPrimary onClick={()=>openForm(null)}><Plus size={14} /> Add Dish</BtnPrimary>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(240px,1fr))", gap:16 }}>
        {filtered.map(d => (
          <GlassCard key={d.id} style={{ overflow:"hidden" }}>
            <div style={{ position:"relative" }}>
              <img src={d.image||"https://placehold.co/240/orange/white?text=Dish"} alt="" style={{ width:"100%", height:150, objectFit:"cover" }} />
              <div style={{ position:"absolute", top:8, right:8, padding:"4px 10px", borderRadius:6, fontSize:11, fontWeight:600, background:d.stock===0?"rgba(239,68,68,0.9)":d.stock<=(d.threshold||5)?"rgba(251,146,60,0.9)":"rgba(34,197,94,0.9)", color:"white" }}>
                {d.stock===0?"OUT OF STOCK":d.stock<=(d.threshold||5)?`⚠ Low (${d.stock})`:`✓ ${d.stock}`}
              </div>
              <div style={{ position:"absolute", bottom:8, left:8, padding:"2px 8px", borderRadius:6, fontSize:10, fontWeight:600, background:"rgba(0,0,0,0.6)", color:"white" }}>{d.category||"General"}</div>
            </div>
            <div style={{ padding:"12px 14px 14px" }}>
              <div style={{ fontSize:15, fontWeight:700, color:"#0f172a", marginBottom:6 }}>{d.name}</div>
              {d.sizes ? Object.entries(d.sizes).map(([sz,pr])=>(
                <div key={sz} style={{ display:"flex", justifyContent:"space-between", fontSize:12, padding:"2px 0" }}>
                  <span style={{ color:"#64748b" }}>{sz}</span><span style={{ fontWeight:600, color:"#0f172a" }}>₹{pr}</span>
                </div>
              )) : <div style={{ fontSize:14, fontWeight:700, color:ORANGE, marginBottom:6 }}>₹{d.price||0}</div>}
              <div style={{ display:"flex", gap:6, marginTop:8, paddingTop:8, borderTop:"1px solid #f1f5f9" }}>
                <Edit3 size={13} color="#3b82f6" style={{ cursor:"pointer" }} onClick={()=>openForm(d)} />
                <Trash2 size={13} color="#ef4444" style={{ cursor:"pointer" }} onClick={()=>handleDelete(d.id)} />
              </div>
            </div>
          </GlassCard>
        ))}
        {filtered.length===0&&<div style={{ gridColumn:"1/-1", textAlign:"center", padding:40, color:"#94a3b8" }}>No dishes found</div>}
      </div>
      <Modal open={showForm} onClose={()=>setShowForm(false)} wide>
        <h3 style={{ fontSize:16, fontWeight:700, color:"#0f172a", marginBottom:16 }}>{editId?"Edit Dish":"Add Dish"}</h3>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <Input placeholder="Dish name" value={f.name} onChange={e=>setF({...f,name:e.target.value})} />
          <Select value={f.category} onChange={e=>setF({...f,category:e.target.value})}>
            <option value="">Category</option>
            {cats.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}
          </Select>
          <Input type="number" placeholder="Base price" value={f.price} onChange={e=>setF({...f,price:e.target.value})} />
          <Input placeholder="Image URL" value={f.image} onChange={e=>setF({...f,image:e.target.value})} />
           <Input type="number" placeholder="Display order" value={f.order} onChange={e=>setF({...f,order:e.target.value})} />
           <Input type="number" placeholder="Stock quantity" value={f.stock} onChange={e=>setF({...f,stock:e.target.value})} min="0" />
           <Input type="number" placeholder="Low stock threshold" value={f.threshold} onChange={e=>setF({...f,threshold:e.target.value})} min="1" />
          <div style={{ gridColumn:"1/-1" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
              <span style={{ fontSize:12, fontWeight:600, color:"#475569" }}>Sizes</span>
              <button type="button" onClick={()=>setSizeList([...sizeList,{name:"",price:0}])} style={{ fontSize:11, color:ORANGE, background:"none", border:"none", cursor:"pointer", fontWeight:600 }}>+ Add Size</button>
            </div>
            {sizeList.map((s,i)=>(
              <div key={i} style={{ display:"flex", gap:6, marginBottom:6, alignItems:"center" }}>
                <input placeholder="Size name" value={s.name} onChange={e=>{const c=[...sizeList];c[i]={...c[i],name:e.target.value};setSizeList(c);}} style={{ flex:1, padding:"6px 8px", borderRadius:6, border:"1px solid #e2e8f0", fontSize:12, outline:"none" }} />
                <input type="number" placeholder="Price" value={s.price} onChange={e=>{const c=[...sizeList];c[i]={...c[i],price:Number(e.target.value)};setSizeList(c);}} style={{ width:80, padding:"6px 8px", borderRadius:6, border:"1px solid #e2e8f0", fontSize:12, outline:"none" }} />
                {sizeList.length>1&&<div onClick={()=>setSizeList(sizeList.filter((_,j)=>j!==i))} style={{ cursor:"pointer", color:"#ef4444", fontSize:16, lineHeight:1, padding:"0 2px" }}>✕</div>}
              </div>
            ))}
          </div>
        </div>
        <Input placeholder='Addons JSON: {"Extra Cheese":30}' value={f.addons} onChange={e=>setF({...f,addons:e.target.value})} style={{ marginTop:12 }} />
        <BtnPrimary onClick={handleSave} style={{ width:"100%", marginTop:16 }}>{editId?"Update":"Save"} Dish</BtnPrimary>
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// POS PAGE (Walk-in cart, checkout)
// ═══════════════════════════════════════════════════════════════════════════
function POSPage({ showToast, outletInfo }) {
  const [dishes, setDishes] = useState([]);
  const [cats, setCats] = useState([]);
  const [catFilter, setCatFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState({});
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [discount, setDiscount] = useState(0);
  const [payMethod, setPayMethod] = useState("Cash");
  const [orderType, setOrderType] = useState("Dine-in");
  const [orderNotes, setOrderNotes] = useState("");
  const [selModal, setSelModal] = useState(null);
  const [selSize, setSelSize] = useState("");
  const [selAddons, setSelAddons] = useState({});
  const [selQty, setSelQty] = useState(1);
  const [editKey, setEditKey] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const r = Outlet("dishes"); const r2 = Outlet("categories");
    if (!r||!r2) return;
     const u1 = onValue(r, snap => { const v=snap.val(); setDishes(v?Object.keys(v).map(k=>({id:k,...v[k]})).filter(d=>(d.stock||0)>0):[]); });
    const u2 = onValue(r2, snap => { const v=snap.val(); setCats(v?Object.keys(v).map(k=>({id:k,...v[k]})):[]); });
    return () => { off(r,"value",u1); off(r2,"value",u2); };
  }, []);

  const addToCart = () => {
    if (!selModal||!selSize) return showToast("Select a size first","warning");
    const sizes = selModal.sizes||{};
    const basePrice = sizes[selSize] ?? selModal.price ?? 0;
    const addonTotal = Object.values(selAddons).reduce((a,b)=>a+Number(b),0);
    const pricePerItem = Number(basePrice) + addonTotal;
    const key = `${selModal.id}::${selSize}::${Object.keys(selAddons).sort().join("|")}`;
    setCart(prev => {
      let next = {...prev};
      if (editKey) delete next[editKey];
      if (next[key]) next[key] = {...next[key], qty: next[key].qty + selQty};
      else next[key] = { id:selModal.id, name:selModal.name, size:selSize, price:pricePerItem, qty:selQty, addons:Object.entries(selAddons).map(([n,p])=>({name:n,price:Number(p)})) };
      return next;
    });
    setEditKey(null);
    setSelModal(null);
    showToast(`${selQty}x ${selModal.name} ${editKey?"updated":"added"}`,"success");
  };

  const addToCartRef = useRef(addToCart);
  addToCartRef.current = addToCart;

  useEffect(() => {
    const handler = (e) => {
      if (!selModal) return;
      if (e.key === "Escape") { setSelModal(null); setEditKey(null); }
      if (e.key === "Enter") { e.preventDefault(); addToCartRef.current(); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [selModal]);

  const filtered = useMemo(() => {
    let list = dishes;
    if (catFilter !== "All") list = list.filter(d => d.category === catFilter);
    if (search) { const s=search.toLowerCase(); list = list.filter(d => d.name.toLowerCase().includes(s)); }
    return list;
  }, [dishes, catFilter, search]);

  const openSelection = (dish) => {
    setEditKey(null);
    setSelModal(dish);
    const sizes = dish.sizes ? Object.keys(dish.sizes) : ["Standard"];
    setSelSize(sizes[0]);
    setSelAddons({});
    setSelQty(1);
  };

  const openEditCartItem = (key, item) => {
    const dish = dishes.find(d => d.id === item.id);
    if (!dish) return showToast("Original dish no longer available","error");
    setEditKey(key);
    setSelModal(dish);
    setSelSize(item.size);
    const addonsMap = {};
    (item.addons||[]).forEach(a => { addonsMap[a.name] = a.price; });
    setSelAddons(addonsMap);
    setSelQty(item.qty);
  };

  const updateCartQty = (key, delta) => {
    setCart(prev => {
      const next = {...prev};
      if (next[key]) { next[key] = {...next[key], qty: Math.max(1, next[key].qty + delta)}; if (next[key].qty <= 0) delete next[key]; }
      return next;
    });
  };

  const removeFromCart = (key) => {
    setCart(prev => { const next = {...prev}; delete next[key]; return next; });
  };

  const clearCart = () => {
    setCart({}); setDiscount(0); setCustName(""); setCustPhone(""); setOrderNotes(""); setOrderType("Dine-in");
  };

  const cartItems = Object.entries(cart);
  const subtotal = cartItems.reduce((s,[_,i])=>s+i.price*i.qty,0);
  const discVal = discount > 0 ? (subtotal * discount) / 100 : 0;
  const taxVal = (subtotal - discVal) * 0.05;
  const total = Math.max(0, subtotal - discVal + taxVal);

  const handleCheckout = async () => {
    if (cartItems.length === 0) return showToast("Cart is empty","error");
    // Validate phone (basic - 10 digits)
    if (custPhone && !/^[0-9]{10}$/.test(custPhone.replace(/\D/g, ""))) {
      return showToast("Valid phone required (10 digits)","error");
    }
    if (!_outletId) return showToast("Outlet not configured - refresh or re-login","error");
    setLoading(true);
    try {
      // STEP 9: Fetch fresh stock and validate availability
      const dishesSnap = await get(Outlet("dishes"));
      const freshDishes = dishesSnap.val() || {};
      for (const [key, item] of cartItems) {
        const dish = freshDishes[item.id];
        if (!dish) throw new Error(item.name + " no longer available");
        const availStock = dish.stock || 0;
        if (availStock < item.qty) {
          throw new Error(`${item.name}: only ${availStock} in stock, you ordered ${item.qty}`);
        }
      }
      
      // Generate order
      const today = new Date();
      const seq = await get(Outlet("metadata/orderSequence"));
      const seqNum = (seq.val()||0) + 1;
      const dateStr = `${today.getFullYear()}${(today.getMonth()+1).toString().padStart(2,"0")}${today.getDate().toString().padStart(2,"0")}`;
      const orderId = `${dateStr}-${seqNum.toString().padStart(4,"0")}`;
      
      const orderData = {
        orderId, cart:Object.values(cart), subtotal, discount:discVal, tax:taxVal, total, paymentMethod:payMethod,
        customerName:custName||"Walk-in", phone:custPhone||"Walk-in", status:"Confirmed", type:orderType, notes:orderNotes,
        outletAddress: outletInfo?.address || "",
        createdAt:new Date().toISOString(), outlet:_outletId
      };
      
      // Save order
      await set(Outlet(`orders/${orderId}`), orderData);
      await update(Outlet("metadata/orderSequence"), seqNum);
      
      // STEP 10: Decrement stock for each item
      for (const [key, item] of cartItems) {
        const newStock = Math.max(0, (freshDishes[item.id].stock || 0) - item.qty);
        await update(Outlet(`dishes/${item.id}`), { stock: newStock });
      }
      
      showToast(`Sale #${orderId} completed!`,"success");
      window.open(`data:text/html,<html><body onload="window.print()"><h2>${orderData.customerName}</h2><p>${orderData.orderId} (${orderType})</p>${outletInfo?.address?`<p style="font-size:11px;color:#64748b">${outletInfo.address}</p>`:""}<table>${Object.values(cart).map(i=>`<tr><td>${i.qty}x ${i.name} (${i.size})</td><td>₹${(i.price*i.qty).toLocaleString()}</td></tr>`).join("")}</table><tr><td colspan=2><hr></td></tr><tr><td>Tax (5%):</td><td>₹${taxVal.toLocaleString()}</td></tr><tr><td><strong>Total:</strong></td><td><strong>₹${total.toLocaleString()}</strong></td></tr></body></html>`,"_blank");
      clearCart();
    } catch(e) { showToast("Checkout failed: "+e.message,"error"); }
    finally { setLoading(false); }
  };

  const catAddons = selModal ? (cats.find(c=>c.name===selModal.category)?.addons||{}) : {};

  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 360px", gap:16, height:"calc(100vh - 140px)" }}>
      {/* Left: Menu Grid */}
      <div style={{ display:"flex", flexDirection:"column", overflow:"hidden", minHeight:0 }}>
        <div className="flex gap-2 mb-3" style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap" }}>
          <div style={{ position:"relative", flex:1, minWidth:150 }}>
            <Search size={14} style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"#94a3b8" }} />
            <input placeholder="Search dishes..." value={search} onChange={e=>setSearch(e.target.value)} style={{ padding:"8px 10px 8px 32px", borderRadius:10, border:"1.5px solid #e2e8f0", fontSize:13, width:"100%", background:"#f8fafc", outline:"none" }} />
          </div>
        </div>
        <div className="flex gap-2 mb-3" style={{ display:"flex", gap:6, marginBottom:12, flexWrap:"wrap", overflowX:"auto" }}>
          {["All", ...new Set(cats.map(c=>c.name))].map(c => (
            <div key={c} onClick={()=>setCatFilter(c)} style={{ padding:"5px 14px", borderRadius:8, cursor:"pointer", fontSize:12, fontWeight:600, whiteSpace:"nowrap", color:catFilter===c?"white":"#64748b", background:catFilter===c?ORANGE:"#f1f5f9" }}>{c}</div>
          ))}
        </div>
        <div style={{ flex:1, overflow:"auto", display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(140px,1fr))", gap:12, alignContent:"start", minHeight:0 }}>
           {filtered.map(d => {
             const price = d.sizes ? Object.values(d.sizes)[0] : (d.price||0);
             const isLow = d.stock <= (d.threshold || 5);
             return <div key={d.id} onClick={()=>openSelection(d)} style={{ background:"white", borderRadius:12, cursor:"pointer", border:"1px solid #f1f5f9", transition:"transform 0.15s", display:"flex", flexDirection:"column", minHeight:260, position:"relative" }}>
               {isLow && <div style={{ position:"absolute", top:8, right:8, padding:"2px 8px", borderRadius:6, fontSize:9, fontWeight:700, background:"rgba(251,146,60,0.9)", color:"white", zIndex:10 }}>⚠ {d.stock}</div>}
               <img src={d.image||"https://placehold.co/300/fff7ed/ccc?text=🍽️"} alt="" style={{ width:"100%", height:160, objectFit:"cover", flexShrink:0 }} />
               <div style={{ flex:1, padding:"14px 14px 18px", minHeight:90, display:"flex", flexDirection:"column", justifyContent:"center" }}>
                 <div style={{ fontSize:14, fontWeight:600, color:"#0f172a", lineHeight:1.4, wordBreak:"break-word" }}>{d.name||"(no name)"}</div>
                 <div style={{ fontSize:13, color:ORANGE, fontWeight:700, marginTop:4 }}>₹{price}</div>
               </div>
             </div>;
           })}
        </div>
      </div>

      {/* Right: Cart */}
      <GlassCard style={{ display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <div style={{ padding:12, borderBottom:"1px solid #f1f5f9" }}>
          <div style={{ fontSize:14, fontWeight:700, color:"#0f172a", marginBottom:8 }}>Walk-in Cart ({cartItems.length})</div>
          <Input placeholder="Customer phone" value={custPhone} onChange={e=>setCustPhone(e.target.value)} style={{ marginBottom:6, fontSize:12, padding:"6px 10px" }} />
          <Input placeholder="Customer name" value={custName} onChange={e=>setCustName(e.target.value)} style={{ fontSize:12, padding:"6px 10px", marginBottom:8 }} />
          <div style={{ fontSize:12, fontWeight:600, color:"#64748b", marginBottom:6 }}>Order Type</div>
          <div style={{ display:"flex", gap:8, marginBottom:12 }}>
            {["Dine-in", "Takeaway"].map(t => (
              <div key={t} onClick={()=>setOrderType(t)} style={{ flex:1, padding:"8px 0", borderRadius:8, textAlign:"center", fontSize:12, fontWeight:600, cursor:"pointer", color:orderType===t?"white":"#64748b", background:orderType===t?ORANGE:"#f1f5f9" }}>{t}</div>
            ))}
          </div>
          <textarea placeholder="Order notes (kitchen instructions)" value={orderNotes} onChange={e=>setOrderNotes(e.target.value)} style={{ width:"100%", minHeight:50, padding:"6px 10px", borderRadius:6, border:"1px solid #e2e8f0", fontSize:12, fontFamily:"inherit", outline:"none", resize:"none" }} />
        </div>
        <div style={{ flex:1, overflow:"auto", padding:12 }}>
          {cartItems.map(([key, item]) => (
            <div key={key} onClick={() => openEditCartItem(key, item)} style={{ padding:"8px 0", borderBottom:"1px solid #f8fafc", cursor:"pointer", borderRadius:6, transition:"background 0.15s" }}
                 onMouseEnter={e=>e.currentTarget.style.background="#fff7ed"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:"#0f172a" }}>{item.name} <span style={{ fontWeight:400, color:"#94a3b8" }}>({item.size})</span> <span style={{ fontSize:9, color:ORANGE, fontWeight:500 }}>(tap edit)</span></div>
                  {item.addons?.map((a,i)=><div key={i} style={{ fontSize:10, color:"#64748b" }}>+ {a.name}</div>)}
                </div>
                <div style={{ textAlign:"right" }}>
                  <div className="flex items-center gap-1" style={{ display:"flex", alignItems:"center", gap:4, justifyContent:"flex-end" }}>
                    <Minus size={12} style={{ cursor:"pointer", color:"#ef4444" }} onClick={()=>updateCartQty(key,-1)} />
                    <span style={{ fontSize:13, fontWeight:700, minWidth:16, textAlign:"center" }}>{item.qty}</span>
                    <Plus size={12} style={{ cursor:"pointer", color:ORANGE }} onClick={()=>updateCartQty(key,1)} />
                  </div>
                  <div style={{ fontSize:12, fontWeight:700, color:ORANGE }}>₹{(item.price*item.qty).toLocaleString()}</div>
                </div>
              </div>
              <Trash2 size={11} color="#ef4444" style={{ cursor:"pointer", marginTop:4 }} onClick={()=>removeFromCart(key)} />
            </div>
          ))}
          {cartItems.length===0&&<div style={{ textAlign:"center", padding:20, color:"#94a3b8", fontSize:12 }}>Tap dishes to add</div>}
        </div>
        <div style={{ padding:12, borderTop:"1px solid #f1f5f9" }}>
          <div className="flex justify-between mb-2" style={{ display:"flex", justifyContent:"space-between", marginBottom:4, fontSize:12 }}>
            <span style={{ color:"#64748b" }}>Subtotal</span><span style={{ fontWeight:600 }}>₹{subtotal.toLocaleString()}</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
            <span style={{ fontSize:11, color:"#64748b" }}>Disc %</span>
            <input type="number" value={discount} onChange={e=>setDiscount(Math.max(0, Math.min(100, Number(e.target.value))))} min="0" max="100" style={{ width:60, padding:"4px 8px", borderRadius:6, border:"1px solid #e2e8f0", fontSize:12, textAlign:"center" }} />
            {discVal>0&&<span style={{ fontSize:11, color:"#ef4444", fontWeight:500 }}>-₹{discVal.toLocaleString()}</span>}
          </div>
          {taxVal>0&&<div className="flex justify-between mb-2" style={{ display:"flex", justifyContent:"space-between", marginBottom:8, fontSize:12 }}>
            <span style={{ color:"#64748b" }}>Tax (5%)</span><span style={{ fontWeight:600 }}>₹{taxVal.toLocaleString()}</span>
          </div>}
          <div className="flex gap-2 mb-3" style={{ display:"flex", gap:6, marginBottom:12 }}>
            {["Cash","UPI","Card"].map(m => (
              <div key={m} onClick={()=>setPayMethod(m)} style={{ flex:1, padding:"6px 0", borderRadius:8, textAlign:"center", fontSize:11, fontWeight:600, cursor:"pointer", color:payMethod===m?"white":"#64748b", background:payMethod===m?ORANGE:"#f1f5f9" }}>{m}</div>
            ))}
          </div>
          <div className="flex justify-between mb-3" style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
            <span style={{ fontSize:16, fontWeight:700, color:"#0f172a" }}>Total</span>
            <span style={{ fontSize:18, fontWeight:800, color:ORANGE }}>₹{total.toLocaleString()}</span>
          </div>
          <BtnPrimary onClick={handleCheckout} disabled={loading} style={{ width:"100%" }}>
            {loading?"Processing...":"Record Sale"}
          </BtnPrimary>
          {cartItems.length>0&&<div onClick={clearCart} style={{ textAlign:"center", fontSize:11, color:"#ef4444", cursor:"pointer", marginTop:8, fontWeight:500 }}>Clear cart</div>}
        </div>
      </GlassCard>

      {/* Selection Modal */}
      <Modal open={!!selModal} onClose={()=>{setSelModal(null);setEditKey(null);}}>
        {selModal&&(()=>{
          const sizes = selModal.sizes||{Standard:selModal.price||0};
          const catA = cats.find(c=>c.name===selModal.category)?.addons||{};
          return <div>
            <div style={{ fontSize:18, fontWeight:700, color:"#0f172a", marginBottom:4 }}>{selModal.name} {editKey&&<span style={{ fontSize:10, fontWeight:600, color:"white", background:ORANGE, padding:"2px 8px", borderRadius:6, verticalAlign:"middle", marginLeft:6 }}>Editing</span>}</div>
            <div style={{ fontSize:12, color:"#64748b", marginBottom:16 }}>{selModal.category}</div>
            <SectionLabel>Size</SectionLabel>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:16 }}>
              {Object.entries(sizes).map(([sz,pr])=>(
                <div key={sz} onClick={()=>setSelSize(sz)} style={{ padding:"10px", borderRadius:10, textAlign:"center", cursor:"pointer", border:selSize===sz?`2px solid ${ORANGE}`:"1.5px solid #e2e8f0", background:selSize===sz?"#fff7ed":"white" }}>
                  <div style={{ fontSize:13, fontWeight:600, color:"#0f172a" }}>{sz}</div>
                  <div style={{ fontSize:12, fontWeight:700, color:ORANGE }}>₹{pr}</div>
                </div>
              ))}
            </div>
            {Object.keys(catA).length>0&&<><SectionLabel>Addons</SectionLabel>
            <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:16 }}>
              {Object.entries(catA).map(([n,pr])=>(
                <div key={n} onClick={()=>setSelAddons(prev=>prev[n]?(()=>{const c={...prev};delete c[n];return c;})():{...prev,[n]:pr})} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 12px", borderRadius:10, cursor:"pointer", background:selAddons[n]?"#fff7ed":"#f8fafc", border:`1px solid ${selAddons[n]?ORANGE:"#e2e8f0"}` }}>
                  <span style={{ fontSize:13, fontWeight:500, color:"#0f172a" }}>+ {n}</span>
                  <span style={{ fontSize:12, fontWeight:600, color:ORANGE }}>₹{pr}</span>
                </div>
              ))}
            </div></>}
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
              <span style={{ fontSize:13, fontWeight:500 }}>Qty:</span>
              <Minus size={16} style={{ cursor:"pointer", color:"#ef4444" }} onClick={()=>setSelQty(Math.max(1,selQty-1))} />
              <span style={{ fontSize:16, fontWeight:700, minWidth:20, textAlign:"center" }}>{selQty}</span>
              <Plus size={16} style={{ cursor:"pointer", color:ORANGE }} onClick={()=>setSelQty(selQty+1)} />
            </div>
            <BtnPrimary onClick={addToCart} style={{ width:"100%" }}>Add to Cart • ₹{((Number(sizes[selSize]??selModal.price??0)+Object.values(selAddons).reduce((a,b)=>a+Number(b),0))*selQty).toLocaleString()}</BtnPrimary>
          </div>;
        })()}
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CUSTOMERS PAGE
// ═══════════════════════════════════════════════════════════════════════════
function CustomersPage({ showToast }) {
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");

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

  const exportCustomers = useCallback(() => {
    downloadCSV(`customers-${new Date().toISOString().slice(0,10)}.csv`, data.map((c, index) => ({
      row: index + 1,
      name: c.name || "Anonymous",
      phone: c.phone,
      orders: c.orderCount,
      ltv: c.ltv,
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
        <button type="button" className="sheet-button" onClick={exportCustomers}><Download size={14} /> Export CSV</button>
      </div>
      <GlassCard style={{ overflow:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13, minWidth:600 }}>
          <thead><tr style={{ borderBottom:"1px solid #f1f5f9" }}>
            <th style={{ textAlign:"left", padding:"10px 12px", color:"#94a3b8", fontWeight:600, fontSize:11, textTransform:"uppercase" }}>Customer</th>
            <th style={{ textAlign:"left", padding:"10px 12px", color:"#94a3b8", fontWeight:600, fontSize:11, textTransform:"uppercase" }}>Contact</th>
            <th style={{ textAlign:"center", padding:"10px 12px", color:"#94a3b8", fontWeight:600, fontSize:11, textTransform:"uppercase" }}>Orders</th>
            <th style={{ textAlign:"right", padding:"10px 12px", color:"#94a3b8", fontWeight:600, fontSize:11, textTransform:"uppercase" }}>LTV</th>
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
function LiveTrackerPage() {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markers = useRef({});
  const [online, setOnline] = useState(0);

  useEffect(() => {
    let L, cleanup;
    (async () => {
      try {
        L = (await import("leaflet")).default;
        await import("leaflet/dist/leaflet.css");
      } catch(e) { console.warn("Leaflet not available, using simple view"); return; }
      if (!mapRef.current) return;
      if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; }
      const map = L.map(mapRef.current).setView([20.5937, 78.9629], 5);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution:"&copy; OpenStreetMap" }).addTo(map);
      mapInstance.current = map;
      const r = ref(db,"riders");
      const unsub = onValue(r, snap => {
        let oc = 0; const bounds = [];
        snap.forEach(child => {
          const rider = child.val();
          if (rider.status==="Online"&&rider.location) {
            oc++; const pos = [rider.location.lat, rider.location.lng]; bounds.push(pos);
            const popup = `<div><b>${rider.name||"Rider"}</b><br/>${rider.phone||""}<br/>${rider.status}</div>`;
            if (markers.current[child.key]) { markers.current[child.key].setLatLng(pos); markers.current[child.key].getPopup()?.setContent(popup); }
            else {
              const m = L.marker(pos).addTo(map).bindPopup(popup);
              markers.current[child.key] = m;
            }
          } else if (markers.current[child.key]) { map.removeLayer(markers.current[child.key]); delete markers.current[child.key]; }
        });
        setOnline(oc);
        if (bounds.length>0) map.fitBounds(L.latLngBounds(bounds), { padding:[50,50], maxZoom:15 });
      });
      cleanup = () => { off(r,"value",unsub); if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current=null; } };
    })();
    return () => { if (cleanup) cleanup(); };
  }, []);

  return (
    <div>
      <div style={{ fontSize:14, fontWeight:700, color:"#0f172a", marginBottom:12 }}>Live Rider Tracker — {online} Riders Online</div>
      <div ref={mapRef} style={{ width:"100%", height:"calc(100vh - 180px)", borderRadius:16, overflow:"hidden" }} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SETTINGS PAGE (Store, Delivery, Bot, Display tabs)
// ═══════════════════════════════════════════════════════════════════════════
function SettingsPage({ showToast }) {
  const [tab, setTab] = useState("store");
  const [s, setS] = useState({}); // store settings
  const [d, setD] = useState({}); // delivery settings

  useEffect(() => {
    const r1 = Outlet("settings/Store"); const r2 = Outlet("settings/Delivery");
    if (!r1||!r2) return;
    const u1 = onValue(r1, snap => setS(snap.val()||{}));
    const u2 = onValue(r2, snap => setD(snap.val()||{}));
    return () => { off(r1,"value",u1); off(r2,"value",u2); };
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
        {["store","delivery","display"].map(t => (
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
      {tab==="display"&&<div>
        <p style={{ fontSize:13, color:"#64748b", marginBottom:12 }}>Display visibility checkboxes coming soon. Check the database for current settings.</p>
      </div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LIVE OPS PAGE (Firebase real-time + sequential status)
// ═══════════════════════════════════════════════════════════════════════════
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
    const next = SEQ[idx+1];
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
    try { await remove(Outlet(`orders/${id}`)); showToast("Order deleted","success"); } catch(e) { showToast("Delete failed","error"); }
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
            {MOCK_RIDERS.map(r => (
              <div key={r.id} className="p-3 rounded-xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <Avatar name={r.name} size={36} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-800">{r.name}</div>
                    <div className="text-xs text-slate-500">{r.vehicle} · {fmt(r.earn)} today</div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1.5 text-xs font-semibold capitalize" style={{ color: r.status==="online"?COLORS.success:r.status==="busy"?COLORS.warning:"#94a3b8" }}>
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor:r.status==="online"?COLORS.success:r.status==="busy"?COLORS.warning:"#94a3b8" }} />
                      {r.status}
                    </div>
                    {r.order && <div className="text-xs text-slate-500 mt-0.5">{r.order}</div>}
                  </div>
                </div>
              </div>
            ))}
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
function InventoryPage({ showToast }) {
  const [items, setItems] = useState(MOCK_INVENTORY.map(i => ({ ...i, status: stockStatus(i.stock, i.threshold) })));

  const updateStock = useCallback((id, delta) => {
    setItems(prev => prev.map(i => {
      if (i.id !== id) return i;
      const stock = Math.max(0, i.stock + delta);
      return { ...i, stock, status: stockStatus(stock, i.threshold) };
    }));
  }, []);

  const low = items.filter(i => i.status !== "ok").length;
  const critical = items.filter(i => i.status === "critical").length;
  const exportInventory = useCallback(() => {
    downloadCSV(`inventory-${new Date().toISOString().slice(0,10)}.csv`, items.map((item, index) => ({
      row: index + 1,
      item: item.name,
      stock: item.stock,
      threshold: item.threshold,
      unit: item.unit,
      status: item.status,
    })));
    showToast("Inventory exported", "success");
  }, [items, showToast]);

  return (
    <div className="space-y-4">
      <div className="sheet-toolbar">
        <div />
        <button type="button" className="sheet-button" onClick={exportInventory}><Download size={14} /> Export CSV</button>
      </div>
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
        <KPICard title="Total Items" value={items.length} icon={Package} />
        <KPICard title="Low Stock" value={low} icon={AlertTriangle} color={COLORS.warning} />
        <KPICard title="Out of Stock" value={critical} icon={XCircle} color={COLORS.error} />
      </div>
      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: 500 }}>
            <thead>
              <tr className="border-b border-slate-100">
                {["Item","Stock","Threshold","Status","Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map(item => {
                const st = statusColors[item.status];
                const pct = Math.min(100, item.stock / (item.threshold * 2) * 100);
                return (
                  <tr key={item.id} className="border-b border-slate-50 hover:bg-orange-50/30">
                    <td className="px-4 py-3 font-semibold text-slate-800">{item.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-800 w-8">{item.stock}</span>
                        <div className="flex-1 bg-slate-100 rounded-full h-1.5 w-20 min-w-0">
                          <div className="h-1.5 rounded-full transition-all" style={{ width:`${pct}%`, backgroundColor: st.color }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{item.threshold} {item.unit}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-full text-xs font-bold capitalize"
                        style={{ color: st.color, backgroundColor: st.bg }}>{item.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <button onClick={() => updateStock(item.id, -1)} className="px-2 py-1 rounded-lg text-xs font-bold bg-red-50 text-red-500">-1</button>
                        <button onClick={() => updateStock(item.id, 5)}  className="px-2 py-1 rounded-lg text-xs font-bold text-white" style={{ backgroundColor: ORANGE }}>+5</button>
                        <button onClick={() => updateStock(item.id, 10)} className="px-2 py-1 rounded-lg text-xs font-bold bg-green-50 text-green-600">+10</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// RIDERS PAGE
// ═══════════════════════════════════════════════════════════════════════════
function RidersPage({ showToast }) {
  const [riders, setRiders] = useState(MOCK_RIDERS);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [view, setView] = useState("table");
  const filtered = useMemo(() => riders.filter(r => (filter==="all"||r.status===filter) && (!search||r.name.toLowerCase().includes(search.toLowerCase()))), [riders, filter, search]);
  const online = riders.filter(r => r.status==="online").length;
  const busy = riders.filter(r => r.status==="busy").length;
  const totalEarn = riders.reduce((s,r) => s + r.earn, 0);
  const avgRating = (riders.reduce((s,r) => s + r.rating, 0) / riders.length).toFixed(1);
  const avgCompletion = Math.round(riders.reduce((s,r) => s + r.completed, 0) / riders.length);
  const toggleStatus = id => setRiders(p => p.map(r => r.id===id ? {...r,status:r.status==="offline"?"online":"offline"} : r));
  const exportCSV = useCallback(() => { downloadCSV(`riders-${new Date().toISOString().slice(0,10)}.csv`, filtered.map((r,i)=>({row:i+1,name:r.name,phone:r.phone,vehicle:r.vehicle,status:r.status,deliveries:r.deliv,earnings:r.earn,rating:r.rating,zone:r.zone,order:r.order||""}))); showToast("Riders exported","success"); }, [filtered, showToast]);

  return (
    <div className="space-y-4">
      <GlassCard className="p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 style={{fontSize:18,fontWeight:700,color:"#0f172a",fontFamily:"'Outfit', sans-serif"}}>Riders</h2>
          <span style={{fontSize:12,color:"#94a3b8"}}>{riders.length} total</span>
          <div className="flex gap-1.5">
            {[{k:"all",l:`All (${riders.length})`},{k:"online",l:`Online (${online})`},{k:"busy",l:`Busy (${busy})`},{k:"offline",l:`Offline (${riders.length-online-busy})`}].map(f => (
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
        </div>
      </GlassCard>

      <div className="grid gap-3" style={{gridTemplateColumns:"repeat(auto-fill, minmax(160px, 1fr))"}}>
        <KPICard title="Online" value={online} icon={Activity} color={COLORS.success} sub={<span style={{color:"#64748b"}}>{((online/riders.length)*100).toFixed(0)}% of fleet</span>} />
        <KPICard title="On Delivery" value={busy} icon={Truck} color={COLORS.warning} />
        <KPICard title="Completion Rate" value={`${avgCompletion}%`} icon={CheckCircle} color={COLORS.info} />
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
                        <div className="h-1 rounded-full" style={{width:`${(r.deliv/15)*100}%`,backgroundColor:COLORS.primary}} />
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
                <AreaChart data={RIDER_CHART[selected.id]||[]}>
                  <defs><linearGradient id="earnGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={ORANGE} stopOpacity={0.3} /><stop offset="100%" stopColor={ORANGE} stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="d" tick={{fontSize:10,fill:"#94a3b8"}} axisLine={false} tickLine={false} />
                  <YAxis hide domain={["dataMin-50","dataMax+50"]} />
                  <Tooltip formatter={v=>[fmt(v),"Earnings"]} />
                  <Area type="monotone" dataKey="earn" stroke={ORANGE} strokeWidth={2} fill="url(#earnGrad)" dot={{fill:ORANGE,stroke:"white",strokeWidth:2,r:3}} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PARTNERS PAGE
// ═══════════════════════════════════════════════════════════════════════════
function PartnersPage({ showToast }) {
  const [partners, setPartners] = useState(MOCK_PARTNERS);

  const update = (id, status) => {
    setPartners(prev => prev.map(p => p.id === id ? { ...p, status } : p));
    showToast(`Partner ${status}`);
  };

  const statusStyle = {
    pending:  { color:"#f59e0b", bg:"#fef3c7" },
    approved: { color:"#22c55e", bg:"#dcfce7" },
    rejected: { color:"#ef4444", bg:"#fee2e2" },
  };
  const exportPartners = useCallback(() => {
    downloadCSV(`partners-${new Date().toISOString().slice(0,10)}.csv`, partners.map((p, index) => ({
      row: index + 1,
      name: p.name,
      type: p.type,
      since: p.since,
      contact: p.contact,
      status: p.status,
    })));
    showToast("Partners exported", "success");
  }, [partners, showToast]);

  return (
    <div className="space-y-4">
      <div className="sheet-toolbar">
        <div />
        <button type="button" className="sheet-button" onClick={exportPartners}><Download size={14} /> Export CSV</button>
      </div>
      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: 520 }}>
            <thead>
              <tr className="border-b border-slate-100">
                {["Partner","Type","Since","Contact","Status","Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {partners.map(p => {
                const st = statusStyle[p.status];
                return (
                  <tr key={p.id} className="border-b border-slate-50 hover:bg-orange-50/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={p.name} size={32} />
                        <span className="font-semibold text-slate-800">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{p.type}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{p.since}</td>
                    <td className="px-4 py-3 text-slate-500">{p.contact}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-full text-xs font-bold capitalize"
                        style={{ color: st.color, backgroundColor: st.bg }}>{p.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      {p.status === "pending" && (
                        <div className="flex gap-2">
                          <button onClick={() => update(p.id,"approved")}
                            className="px-3 py-1 rounded-lg text-xs font-bold text-white" style={{ backgroundColor: COLORS.success }}>Approve</button>
                          <button onClick={() => update(p.id,"rejected")}
                            className="px-3 py-1 rounded-lg text-xs font-bold text-white" style={{ backgroundColor: COLORS.error }}>Reject</button>
                        </div>
                      )}
                      {p.status !== "pending" && <span className="text-xs text-slate-400">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ANALYTICS PAGE
// ═══════════════════════════════════════════════════════════════════════════
function AnalyticsPage() {
  const [period, setPeriod] = useState("week");
  const totalRev = WEEK_DATA.reduce((s, d) => s + d.rev, 0);
  const totalOrd = WEEK_DATA.reduce((s, d) => s + d.ord, 0);
  const prevRev = PREV_WEEK_DATA.reduce((s, d) => s + d.rev, 0);
  const prevOrd = PREV_WEEK_DATA.reduce((s, d) => s + d.ord, 0);
  const revTrend = ((totalRev - prevRev) / prevRev * 100).toFixed(1);
  const ordTrend = ((totalOrd - prevOrd) / prevOrd * 100).toFixed(1);
  const avgValue = Math.round(totalRev / totalOrd);
  const prevAvg = Math.round(prevRev / prevOrd);
  const avgTrend = ((avgValue - prevAvg) / prevAvg * 100).toFixed(1);
  const bestDay = WEEK_DATA.reduce((b, d) => d.rev > b.rev ? d : b, WEEK_DATA[0]);
  const exportCSV = () => downloadCSV(`analytics-${period}-${new Date().toISOString().slice(0,10)}.csv`, WEEK_DATA.map((d, i) => ({ day: d.d, revenue: d.rev, orders: d.ord, prevRevenue: PREV_WEEK_DATA[i].rev })));

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
          <span style={{fontSize:12,color:"#94a3b8"}}>May 18 — May 24, 2026</span>
          <BtnSecondary onClick={exportCSV}><Download size={13} style={{marginRight:5}} />Export</BtnSecondary>
        </div>
      </GlassCard>

      <div className="grid gap-4" style={{gridTemplateColumns:"repeat(auto-fill, minmax(180px, 1fr))"}}>
        <KPICard title="Revenue" value={fmt(totalRev)} icon={TrendingUp} color={COLORS.success}
          sub={<span style={{color:revTrend>=0?COLORS.success:COLORS.error,fontWeight:600}}>{revTrend>=0?"▲":"▼"} {Math.abs(revTrend)}% vs last week</span>} />
        <KPICard title="Orders" value={totalOrd} icon={ShoppingBag} color={COLORS.info}
          sub={<span style={{color:ordTrend>=0?COLORS.success:COLORS.error,fontWeight:600}}>{ordTrend>=0?"▲":"▼"} {Math.abs(ordTrend)}% vs last week</span>} />
        <KPICard title="Avg. Order Value" value={fmt(avgValue)} icon={DollarSign} color={COLORS.warning}
          sub={<span style={{color:avgTrend>=0?COLORS.success:COLORS.error,fontWeight:600}}>{avgTrend>=0?"▲":"▼"} {Math.abs(avgTrend)}% vs last week</span>} />
        <KPICard title="Best Day" value={bestDay.d} icon={Star} color={ORANGE}
          sub={<span style={{color:"#64748b"}}>{fmt(bestDay.rev)} • {bestDay.ord} orders</span>} />
      </div>

      <div className="grid gap-4" style={{gridTemplateColumns:"1.6fr 1fr"}}>
        <GlassCard className="p-5">
          <SectionHeader title="Revenue & Orders" />
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={WEEK_DATA.map((d,i) => ({...d, prevRev:PREV_WEEK_DATA[i].rev}))}>
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
          <SectionHeader title="vs Last Week" />
          <div className="flex items-center justify-center" style={{height:200}}>
            <div className="grid grid-cols-2 gap-8 text-center">
              <div>
                <div style={{fontSize:11,color:"#94a3b8",fontWeight:600,textTransform:"uppercase",marginBottom:4}}>Revenue</div>
                <div style={{fontSize:24,fontWeight:800,color:"#0f172a",fontFamily:"'Outfit', sans-serif"}}>{fmt(totalRev)}</div>
                <div style={{fontSize:13,fontWeight:600,marginTop:4,color:revTrend>=0?COLORS.success:COLORS.error}}>{revTrend>=0?"↑":"↓"} {Math.abs(revTrend)}%</div>
                <div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>prev: {fmt(prevRev)}</div>
              </div>
              <div>
                <div style={{fontSize:11,color:"#94a3b8",fontWeight:600,textTransform:"uppercase",marginBottom:4}}>Orders</div>
                <div style={{fontSize:24,fontWeight:800,color:"#0f172a",fontFamily:"'Outfit', sans-serif"}}>{totalOrd}</div>
                <div style={{fontSize:13,fontWeight:600,marginTop:4,color:ordTrend>=0?COLORS.success:COLORS.error}}>{ordTrend>=0?"↑":"↓"} {Math.abs(ordTrend)}%</div>
                <div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>prev: {prevOrd}</div>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="grid gap-4" style={{gridTemplateColumns:"1fr 1fr"}}>
        <GlassCard className="p-5">
          <SectionHeader title="Sales by Category" />
          <div className="flex flex-col lg:flex-row items-center gap-4">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={CAT_DATA} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {CAT_DATA.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={v => [`${v}%`, "Share"]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2.5" style={{minWidth:176}}>
              {CAT_DATA.map((c,i) => (
                <div key={c.name} className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{backgroundColor:PIE_COLORS[i]}} />
                  <span className="text-sm text-slate-700 flex-1">{c.name}</span>
                  <span className="text-sm font-bold text-slate-800">{c.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <SectionHeader title="Orders by Hour" />
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={HOURLY_DATA}>
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
        <div className="space-y-4">
          {MOCK_RIDERS.map(r => (
            <div key={r.id}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Avatar name={r.name} size={28} />
                  <div>
                    <span className="text-sm font-semibold text-slate-800">{r.name}</span>
                    <span style={{fontSize:11,color:"#94a3b8",marginLeft:6}}>{r.vehicle}</span>
                    <span className="ml-2 text-xs font-semibold capitalize" style={{color:r.status==="online"?COLORS.success:r.status==="busy"?COLORS.warning:"#94a3b8"}}>● {r.status}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-slate-700">{r.deliv} deliveries</span>
                  <span className="text-sm font-bold" style={{color:ORANGE}}>{fmt(r.earn)}</span>
                  <StarRating rating={r.rating} />
                </div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="h-2 rounded-full transition-all" style={{width:`${(r.deliv/15)*100}%`,backgroundColor:ORANGE}} />
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LOST SALES PAGE
// ═══════════════════════════════════════════════════════════════════════════
function LostSalesPage() {
  const totalLoss = MOCK_LOST.reduce((s, l) => s + l.total, 0);
  return (
    <div className="space-y-4">
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
        <KPICard title="Total Loss" value={fmt(totalLoss)} icon={TrendingDown} color={COLORS.error} />
        <KPICard title="Cancelled Orders" value={MOCK_LOST.length} icon={XCircle} color={COLORS.warning} />
        <KPICard title="Avg Loss/Order" value={fmt(Math.round(totalLoss / MOCK_LOST.length))} icon={AlertTriangle} />
      </div>
      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: 480 }}>
            <thead>
              <tr className="border-b border-slate-100">
                {["Order ID","Customer","Reason","Time","Loss"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_LOST.map(l => (
                <tr key={l.id} className="border-b border-slate-50 hover:bg-red-50/20">
                  <td className="px-4 py-3 font-mono text-xs font-bold text-red-400">{l.id}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={l.customer} size={28} />
                      <span className="font-medium text-slate-800">{l.customer}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{l.reason}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{l.time}</td>
                  <td className="px-4 py-3 font-bold text-red-500">-{fmt(l.total)}</td>
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
// SETTLEMENTS PAGE
// ═══════════════════════════════════════════════════════════════════════════
function SettlementsPage() {
  const total = MOCK_TRANSACTIONS.reduce((s,t) => s + t.amount, 0);
  const credits = MOCK_TRANSACTIONS.filter(t => t.amount > 0).reduce((s,t) => s + t.amount, 0);
  const debits = MOCK_TRANSACTIONS.filter(t => t.amount < 0).reduce((s,t) => s + Math.abs(t.amount), 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
        <KPICard title="Net Balance" value={fmt(total)} icon={Wallet} color={total >= 0 ? COLORS.success : COLORS.error} />
        <KPICard title="Total Credits" value={fmt(credits)} icon={ArrowUp} color={COLORS.success} />
        <KPICard title="Total Debits" value={fmt(debits)} icon={ArrowDown} color={COLORS.error} />
      </div>
      <GlassCard>
        <div className="p-4 flex gap-3 border-b border-slate-100">
          <BtnPrimary><Download size={13} /> Export CSV</BtnPrimary>
          <button className="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50">
            <Download size={13} className="inline mr-1.5" /> Export PDF
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: 500 }}>
            <thead>
              <tr className="border-b border-slate-100">
                {["ID","Date","Type","Amount","Method","Status"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_TRANSACTIONS.map(t => (
                <tr key={t.id} className="border-b border-slate-50 hover:bg-orange-50/20">
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">{t.id}</td>
                  <td className="px-4 py-3 text-slate-500">{t.date}</td>
                  <td className="px-4 py-3 text-slate-700">{t.type}</td>
                  <td className="px-4 py-3 font-bold" style={{ color: t.amount > 0 ? COLORS.success : COLORS.error }}>
                    {t.amount > 0 ? "+" : ""}{fmt(Math.abs(t.amount))}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{t.method}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-full text-xs font-bold capitalize"
                      style={{ color: t.status==="settled" ? COLORS.success : COLORS.warning, backgroundColor: t.status==="settled" ? "#dcfce7" : "#fef3c7" }}>
                      {t.status}
                    </span>
                  </td>
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
// NOTIFICATIONS PAGE
// ═══════════════════════════════════════════════════════════════════════════
function NotificationsPage({ showToast }) {
  const [form, setForm] = useState({ title:"", body:"", audience:"all" });
  const [sent, setSent] = useState([
    { id:1, title:"Flash Sale! 20% Off", body:"Hurry, offer valid until 10 PM tonight!", audience:"all", time:"2 hrs ago", sent:1240 },
    { id:2, title:"New Item: Mango Lassi", body:"Try our refreshing new summer special!", audience:"new", time:"Yesterday", sent:480 },
  ]);

  const sendNotif = () => {
    if (!form.title || !form.body) return;
    setSent(prev => [{ id: Date.now(), ...form, time:"Just now", sent:Math.floor(Math.random()*1500+200) }, ...prev]);
    setForm({ title:"", body:"", audience:"all" });
    showToast("Notification sent successfully!");
  };

  return (
    <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
      <GlassCard className="p-5 h-fit">
        <SectionHeader title="Compose Notification" />
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Title</label>
            <input value={form.title} onChange={e => setForm(p => ({...p, title:e.target.value}))}
              placeholder="e.g. Flash Sale Today!"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-orange-300" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Message</label>
            <textarea value={form.body} onChange={e => setForm(p => ({...p, body:e.target.value}))}
              placeholder="Your notification message..."
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-orange-300 resize-none"
              rows={3} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Target Audience</label>
            <select value={form.audience} onChange={e => setForm(p => ({...p, audience:e.target.value}))}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none">
              <option value="all">All Customers</option>
              <option value="new">New Customers</option>
              <option value="vip">VIP Customers</option>
              <option value="inactive">Inactive (7+ days)</option>
            </select>
          </div>
          <BtnPrimary onClick={sendNotif} className="w-full py-2.5 justify-center">
            <Send size={14} /> Send Notification
          </BtnPrimary>
        </div>
      </GlassCard>
      <div>
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Sent History</div>
        <div className="space-y-3">
          {sent.map(n => (
            <GlassCard key={n.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="font-bold text-slate-800 text-sm">{n.title}</div>
                <span className="text-xs text-slate-400">{n.time}</span>
              </div>
              <div className="text-xs text-slate-500 mb-2">{n.body}</div>
              <div className="flex items-center gap-3 text-xs">
                <span className="px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor:"#fff7ed", color:ORANGE }}>{n.audience}</span>
                <span className="text-slate-500">{n.sent.toLocaleString("en-IN")} recipients</span>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// FEEDBACK PAGE
// ═══════════════════════════════════════════════════════════════════════════
function FeedbackPage() {
  return (
    <div className="space-y-4">
      <GlassCard className="p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="text-center">
            <div className="text-5xl font-black text-slate-800" style={{ fontFamily:"'Outfit', sans-serif" }}>4.7</div>
            <StarRating rating={4.7} />
            <div className="text-xs text-slate-500 mt-1">148 reviews</div>
          </div>
          <div className="flex-1 space-y-2 w-full">
            {[5,4,3,2,1].map((n,i) => {
              const pcts = [70,18,8,2,2];
              return (
                <div key={n} className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 w-4">{n}★</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2">
                    <div className="h-2 rounded-full transition-all" style={{ width:`${pcts[i]}%`, backgroundColor:"#f59e0b" }} />
                  </div>
                  <span className="text-xs text-slate-400 w-8">{pcts[i]}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </GlassCard>
      <div className="space-y-3">
        {MOCK_FEEDBACK.map(f => (
          <GlassCard key={f.id} className="p-4">
            <div className="flex items-start gap-3">
              <Avatar name={f.customer} size={36} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-800">{f.customer}</span>
                  <span className="text-xs text-slate-400">{f.time}</span>
                </div>
                <StarRating rating={f.rating} />
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">{f.comment}</p>
                <span className="text-xs mt-2 inline-block px-2 py-0.5 rounded-full" style={{ backgroundColor:"#fff7ed", color:ORANGE }}>re: {f.dish}</span>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE REGISTRY
// ═══════════════════════════════════════════════════════════════════════════
const PAGES = {
  dashboard: DashboardPage, orders: OrdersPage, liveops: LiveOpsPage, kitchen: KitchenPage,
  pos: POSPage, menu: MenuPage, categories: CategoriesPage,
  inventory: InventoryPage, customers: CustomersPage, riders: RidersPage, partners: PartnersPage,
  analytics: AnalyticsPage, lostsales: LostSalesPage, settlements: SettlementsPage,
  notifications: NotificationsPage, feedback: FeedbackPage, livetracker: LiveTrackerPage, settings: SettingsPage,
};
const VALID_PAGE_IDS = new Set(Object.keys(PAGES));
const STORAGE_KEYS = {
  page: "foodhubbie-admin-page",
  theme: "foodhubbie-admin-theme",
  sidebar: "foodhubbie-admin-sidebar-collapsed",
};

// ═══════════════════════════════════════════════════════════════════════════
// ROOT APP
// ═══════════════════════════════════════════════════════════════════════════
function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const authUnsubRef = useRef(null);
  const [page, setPage] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.page);
    return VALID_PAGE_IDS.has(saved) ? saved : "dashboard";
  });
  const [dark, setDark] = useState(() => localStorage.getItem(STORAGE_KEYS.theme) === "dark");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(STORAGE_KEYS.sidebar) === "true");
  const [toast, setToast] = useState(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [outletInfo, setOutletInfo] = useState(null);

  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        const auth = await getAuthInstance();
        const unsub = onAuthStateChanged(auth, (u) => {
          setUser((prev) => {
            if ((u?.uid || null) === (prev?.uid || null)) return prev;
            return u;
          });
          setAuthLoading((prev) => prev ? false : prev);
        });
        authUnsubRef.current = unsub;
      } catch (e) {
        console.warn("Auth init failed", e);
        setAuthLoading(false);
      }
    }, 100);
    return () => { clearTimeout(t); if (authUnsubRef.current) { authUnsubRef.current(); authUnsubRef.current = null; } };
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.page, page);
  }, [page]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.theme, dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.sidebar, String(collapsed));
  }, [collapsed]);

  const handleLogin = useCallback(async (event) => {
    event?.preventDefault();
    if (loginLoading) return;
    setLoginError("");
    setLoginLoading(true);
    try {
      const auth = await getAuthInstance();
      await signInWithEmailAndPassword(auth, loginEmail.trim(), loginPassword);
    }
    catch (e) { setLoginError(e.message.replace("Firebase: ", "")); }
    finally { setLoginLoading(false); }
  }, [loginEmail, loginPassword, loginLoading]);

  const handleLogout = useCallback(async () => {
    try {
      const auth = await getAuthInstance();
      await signOut(auth);
    } catch (e) { console.warn("Sign-out failed", e); }
    setUser(null); setOutletInfo(null);
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const snap = await get(ref(db, "admins/" + user.uid));
        if (snap.exists()) {
          const d = snap.val();
          _bizId = d.businessId; _outletId = d.outletId;
          setOutletContext(d.businessId, d.outletId);
          setOutletInfo({ name: d.outletName || "", address: d.outletAddress || "" });
        }
      } catch (e) { console.warn("Failed to fetch admin info", e); }
    })();
  }, [user]);

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3500);
  }, []);

  if (authLoading) {
    return (
      <div style={{ minHeight:"100vh", display:"grid", placeItems:"center", background:"#f8fafc", color:"#1e293b" }}>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:14 }}>
          <div style={{ width:42, height:42, borderRadius:14, background:`linear-gradient(135deg,${ORANGE},#e85d1a)`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 12px 28px rgba(243,107,33,0.25)" }}>
            <Store size={21} color="white" />
          </div>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:16, fontWeight:800, color:"#0f172a" }}>FoodHubbie Admin</div>
            <div style={{ fontSize:12, color:"#64748b", marginTop:4 }}>Preparing your workspace...</div>
          </div>
          <div aria-label="Loading dashboard" role="status" style={{ width:34, height:34, border:"3px solid #fed7aa", borderTopColor:ORANGE, borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", padding: 24,
        background: "linear-gradient(135deg, #f36b21 0%, #e85d1a 50%, #d44a0f 100%)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 40 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Store size={32} color="white" />
          </div>
          <div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "white", letterSpacing: -0.5 }}>FoodHubbie</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>Admin Dashboard</div>
          </div>
        </div>
        <GlassCard style={{ width: "100%", maxWidth: 400, padding: 32 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>Welcome Back</h2>
          <p style={{ fontSize: 14, color: "#64748b", marginBottom: 24 }}>Sign in to manage your outlet</p>
          {loginError && <div role="alert" style={{ padding: "10px 14px", borderRadius: 10, marginBottom: 16, background: "#fef2f2", color: "#ef4444", fontSize: 13, fontWeight: 500 }}>{loginError}</div>}
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <input aria-label="Email address" autoComplete="email" inputMode="email" placeholder="Email address" value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
              style={{ padding: "12px 16px", borderRadius: 12, border: "1.5px solid #e2e8f0", fontSize: 14, color: "#1e293b", background: "#f8fafc" }} />
            <input aria-label="Password" autoComplete="current-password" type="password" placeholder="Password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)}
              style={{ padding: "12px 16px", borderRadius: 12, border: "1.5px solid #e2e8f0", fontSize: 14, color: "#1e293b", background: "#f8fafc" }} />
            <BtnPrimary type="submit" disabled={loginLoading} style={{ width: "100%", padding: "12px 0" }}>{loginLoading ? "Signing In..." : "Sign In"}</BtnPrimary>
          </form>
        </GlassCard>
      </div>
    );
  }

  const PageComponent = PAGES[page] || DashboardPage;
  const bg = dark ? "#0f172a" : "#f8fafc";
  const sideBg = dark ? "#1e293b" : "#ffffff";
  const textCol = dark ? "#f1f5f9" : "#1e293b";

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: bg, color: textCol, transition: "background 0.3s, color 0.3s" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;900&family=Inter:wght@400;500;600&display=swap');
        * { box-sizing: border-box; font-family: 'Inter', sans-serif; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #f36b2130; border-radius: 99px; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 39, background: "rgba(0,0,0,0.4)" }} />}
      <aside style={{ position:"fixed", top:0, left:0, bottom:0, zIndex:40, width:collapsed?56:224, background:sideBg, borderRight:dark?"1px solid #334155":"1px solid #e2e8f0", display:"flex", flexDirection:"column", transition:"width 0.3s, transform 0.3s, background 0.3s", overflow:"hidden", transform:sidebarOpen?"translateX(0)":"" }} className="sidebar">
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:collapsed?"16px 0":"16px 18px", borderBottom:dark?"1px solid #334155":"1px solid #f1f5f9", justifyContent:collapsed?"center":"flex-start" }}>
          <div style={{ width:32, height:32, borderRadius:10, background:`linear-gradient(135deg,${ORANGE},#e85d1a)`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><Store size={16} color="white" /></div>
          {!collapsed && <div><div style={{ fontSize:15, fontWeight:800, color:dark?"#f1f5f9":"#1e293b", lineHeight:1.2 }}>FoodHubbie</div><div style={{ fontSize:10, color:"#64748b", fontWeight:500 }}>Admin Panel</div></div>}
        </div>
        <button type="button" onClick={()=>setCollapsed(!collapsed)} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:"8px 0", cursor:"pointer", color:"#94a3b8", borderBottom:dark?"1px solid #334155":"1px solid #f1f5f9", background:"transparent", borderTop:0, borderLeft:0, borderRight:0 }} className="collapse-toggle shell-button">{collapsed?<ChevronRight size={16}/>:<ChevronLeft size={16}/>}</button>
        {outletInfo&&!collapsed&&<div style={{ margin:"8px 12px", padding:"10px 12px", borderRadius:10, background:dark?"#0f172a":"#fff7ed", border:dark?"1px solid #334155":"1px solid rgba(243,107,33,0.15)" }}>
          <div style={{ fontSize:11, color:"#94a3b8", fontWeight:600, textTransform:"uppercase", letterSpacing:0.5, marginBottom:2 }}>OUTLET</div>
          <div style={{ fontSize:13, fontWeight:600, color:ORANGE }}>{outletInfo.name}</div>
          {outletInfo.address&&<div style={{ fontSize:11, color:"#94a3b8", marginTop:2, display:"flex", alignItems:"center", gap:4 }}><MapPin size={10}/> {outletInfo.address}</div>}
        </div>}
        {outletInfo&&collapsed&&<div style={{ display:"flex", justifyContent:"center", padding:"8px 0" }}><Avatar name={outletInfo.name} size={28}/></div>}
        <nav style={{ flex:1, overflow:"auto", padding:collapsed?"4px 0":"8px 0" }}>
          {NAV_GROUPS.map(group => (
            <div key={group.label} style={{ marginBottom:collapsed?2:4 }}>
              {!collapsed&&<div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:0.8, color:"#94a3b8", padding:"12px 18px 6px" }}>{group.label}</div>}
              {group.items.map(item => {
                const Icon = item.icon; const active = page === item.id;
                return <button type="button" key={item.id} onClick={()=>{setPage(item.id);setSidebarOpen(false);}} aria-current={active ? "page" : undefined} style={{ display:"flex", alignItems:"center", gap:10, padding:collapsed?"10px 0":"8px 16px", margin:collapsed?"2px 0":"2px 8px", borderRadius:8, cursor:"pointer", justifyContent:collapsed?"center":"flex-start", background:active?ORANGE:"transparent", color:active?"white":(dark?"#cbd5e1":"#475569"), transition:"all 0.2s", border:0, width:collapsed?"100%":"calc(100% - 16px)", textAlign:"left" }} title={collapsed?item.label:undefined} className="shell-button">
                  <Icon size={collapsed?20:18} style={{ flexShrink:0 }} />
                  {!collapsed&&<><span style={{ fontSize:13, fontWeight:active?600:500, whiteSpace:"nowrap" }}>{item.label}</span>{item.badge&&<span style={{ marginLeft:"auto", fontSize:10, fontWeight:700, padding:"1px 7px", borderRadius:99, background:active?"rgba(255,255,255,0.25)":ORANGE, color:"white" }}>{item.badge}</span>}</>}
                </button>;
              })}
            </div>
          ))}
        </nav>
        <div style={{ borderTop:dark?"1px solid #334155":"1px solid #f1f5f9", padding:collapsed?"8px 0":"8px 12px", display:"flex", flexDirection:"column", gap:2 }}>
          <button type="button" onClick={()=>setDark(!dark)} style={{ display:"flex", alignItems:"center", gap:10, padding:collapsed?"10px 0":"8px 12px", borderRadius:8, cursor:"pointer", justifyContent:collapsed?"center":"flex-start", color:dark?"#cbd5e1":"#475569", background:"transparent", border:0, width:"100%" }} title={collapsed?"Toggle theme":undefined} aria-label="Toggle theme" className="shell-button">
            {dark?<Sun size={collapsed?20:18}/>:<Moon size={collapsed?20:18}/>}
            {!collapsed&&<span style={{ fontSize:13, fontWeight:500 }}>{dark?"Light Mode":"Dark Mode"}</span>}
          </button>
          <button type="button" onClick={handleLogout} style={{ display:"flex", alignItems:"center", gap:10, padding:collapsed?"10px 0":"8px 12px", borderRadius:8, cursor:"pointer", justifyContent:collapsed?"center":"flex-start", color:"#ef4444", background:"transparent", border:0, width:"100%" }} title={collapsed?"Logout":undefined} className="shell-button">
            <LogOut size={collapsed?20:18}/>
            {!collapsed&&<span style={{ fontSize:13, fontWeight:500 }}>Logout</span>}
          </button>
        </div>
      </aside>
      <div style={{ flex:1, display:"flex", flexDirection:"column", marginLeft:collapsed?56:224, transition:"margin-left 0.3s", minHeight:"100vh" }} className="main-wrapper">
        <header style={{ position:"sticky", top:0, zIndex:30, display:"flex", alignItems:"center", gap:12, padding:"12px 24px", background:dark?"#0f172a":"white", borderBottom:dark?"1px solid #1e293b":"1px solid #e2e8f0" }}>
          <button type="button" className="hamburger-mobile shell-button" onClick={()=>setSidebarOpen(true)} aria-label="Open navigation" style={{ cursor:"pointer", color:dark?"#f1f5f9":"#475569", background:"transparent", border:0, padding:6, borderRadius:8 }}><Menu size={22}/></button>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:20, fontWeight:700, color:dark?"#f1f5f9":"#0f172a" }}>{PAGE_TITLES[page]||"Dashboard"}</div>
            {outletInfo&&<div style={{ fontSize:12, color:"#94a3b8", display:"flex", alignItems:"center", gap:4 }}><Store size={12}/> {outletInfo.name}</div>}
          </div>
          <button type="button" aria-label="Open notifications" className="shell-button" style={{ position:"relative", cursor:"pointer", color:dark?"#94a3b8":"#64748b", background:"transparent", border:0, padding:6, borderRadius:8 }}><Bell size={20}/><div style={{ position:"absolute", top:4, right:4, width:8, height:8, borderRadius:"50%", background:"#ef4444" }}/></button>
          {outletInfo&&<Avatar name={outletInfo.name} size={32}/>}
        </header>
        <main style={{ flex:1, padding:"24px 24px 88px", overflow:"auto" }}>
          {PageComponent && <PageComponent showToast={showToast} outletInfo={outletInfo} />}
        </main>
      </div>
      <div className="mobile-bottom-nav" style={{ position:"fixed", bottom:0, left:0, right:0, zIndex:30, display:"flex", alignItems:"center", justifyContent:"space-around", padding:"6px 0 env(safe-area-inset-bottom,6px)", background:dark?"#1e293b":"white", borderTop:dark?"1px solid #334155":"1px solid #e2e8f0" }}>
        {MOBILE_NAV.map(item => {
          const Icon = item.icon; const active = page === item.id;
          return <button type="button" key={item.id} onClick={()=>setPage(item.id)} aria-current={active ? "page" : undefined} className="shell-button" style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2, padding:"4px 8px", cursor:"pointer", position:"relative", color:active?ORANGE:(dark?"#64748b":"#94a3b8"), background:"transparent", border:0, minWidth:54 }}>
            <Icon size={20}/><span style={{ fontSize:10, fontWeight:active?600:500 }}>{item.label}</span>
            {active&&<div style={{ position:"absolute", top:-6, width:4, height:4, borderRadius:"50%", background:ORANGE }}/>}
          </button>;
        })}
      </div>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)} />}
    </div>
  );
}

export default App;
