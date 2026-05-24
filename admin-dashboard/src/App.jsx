import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  LayoutDashboard, ShoppingBag, Zap, ChefHat, Monitor, UtensilsCrossed,
  Tag, Package, Users, Bike, Handshake, BarChart3, TrendingDown,
  CreditCard, Bell, MessageSquare, MapPin, Settings, LogOut,
  Sun, Moon, Search, ChevronDown, Plus, Download,
  Eye, Edit2, Trash2, CheckCircle, XCircle, Clock, Truck,
  AlertTriangle, Star, ArrowUp, ArrowDown, ArrowRight,
  RefreshCw, X, Menu, ChevronRight, ChevronLeft,
  ShoppingCart, TrendingUp, Activity, Wallet, Store,
  Send, Target, Layers, Map, Navigation, UserCheck,
  Flame, Coffee, Check, Minus, Receipt, Filter
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

import { auth, db, onAuthStateChanged, signInWithEmailAndPassword, signOut, setOutletContext, get, ref, Outlet } from "./firebase";
import "./App.css";

// ─── THEME ──────────────────────────────────────────────────────────────────
const ORANGE = "#f36b21";
const COLORS = {
  primary: "#f36b21",
  success: "#22c55e",
  warning: "#f59e0b",
  info: "#3b82f6",
  error: "#ef4444",
  muted: "#64748b",
};
const PIE_COLORS = ["#f36b21", "#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899"];

const ORDER_STATUSES = {
  pending:          { label: "Pending",         color: "#f59e0b", bg: "#fef3c7" },
  confirmed:        { label: "Confirmed",        color: "#3b82f6", bg: "#dbeafe" },
  preparing:        { label: "Preparing",        color: "#8b5cf6", bg: "#ede9fe" },
  ready:            { label: "Ready",            color: "#06b6d4", bg: "#cffafe" },
  out_for_delivery: { label: "Out for Delivery", color: "#f36b21", bg: "#ffedd5" },
  delivered:        { label: "Delivered",        color: "#22c55e", bg: "#dcfce7" },
  cancelled:        { label: "Cancelled",        color: "#ef4444", bg: "#fee2e2" },
};

// ─── MOCK DATA ──────────────────────────────────────────────────────────────
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

const MOCK_MENU = [
  { id:"d1", name:"Butter Chicken",  cat:"Main Course", price:280, veg:false, avail:true,  best:true,  rating:4.8, stock:50, emoji:"🍛" },
  { id:"d2", name:"Paneer Tikka",    cat:"Starters",    price:220, veg:true,  avail:true,  best:false, rating:4.5, stock:30, emoji:"🧆" },
  { id:"d3", name:"Dal Makhani",     cat:"Main Course", price:180, veg:true,  avail:true,  best:true,  rating:4.7, stock:40, emoji:"🍲" },
  { id:"d4", name:"Chicken Biryani", cat:"Rice",        price:320, veg:false, avail:false, best:true,  rating:4.9, stock:0,  emoji:"🍚" },
  { id:"d5", name:"Garlic Naan",     cat:"Breads",      price:45,  veg:true,  avail:true,  best:false, rating:4.3, stock:100,emoji:"🫓" },
  { id:"d6", name:"Gulab Jamun",     cat:"Desserts",    price:80,  veg:true,  avail:true,  best:false, rating:4.6, stock:60, emoji:"🍮" },
  { id:"d7", name:"Tandoori Chicken",cat:"Starters",    price:260, veg:false, avail:true,  best:false, rating:4.4, stock:25, emoji:"🍗" },
  { id:"d8", name:"Mango Lassi",     cat:"Drinks",      price:90,  veg:true,  avail:true,  best:false, rating:4.2, stock:80, emoji:"🥭" },
];

const MOCK_RIDERS = [
  { id:"r1", name:"Rajesh Kumar",  phone:"+91 9876543210", vehicle:"bike",   status:"online",  earn:1840, deliv:12, rating:4.7, order:"ORD-1003" },
  { id:"r2", name:"Suresh Yadav",  phone:"+91 9845671230", vehicle:"scooty", status:"busy",    earn:2100, deliv:15, rating:4.5, order:"ORD-1007" },
  { id:"r3", name:"Mohan Singh",   phone:"+91 9765432109", vehicle:"bike",   status:"offline", earn:980,  deliv:7,  rating:4.2, order:null },
  { id:"r4", name:"Ramesh Thakur", phone:"+91 9654321098", vehicle:"cycle",  status:"online",  earn:1560, deliv:11, rating:4.8, order:null },
];

const MOCK_CUSTOMERS = [
  { id:"c1", name:"Rahul Sharma",  phone:"+91 9876543210", orders:24, spent:8640,  last:"2 hours ago", addr:"14 MG Road",  city:"Ranchi" },
  { id:"c2", name:"Priya Singh",   phone:"+91 9845671230", orders:18, spent:6120,  last:"Yesterday",   addr:"Kokar Colony", city:"Ranchi" },
  { id:"c3", name:"Amit Kumar",    phone:"+91 9123456789", orders:31, spent:11280, last:"Today",        addr:"Ashok Nagar", city:"Ranchi" },
  { id:"c4", name:"Sunita Verma",  phone:"+91 9988776655", orders:9,  spent:2430,  last:"3 days ago",  addr:"Harmu",       city:"Ranchi" },
  { id:"c5", name:"Deepak Jha",    phone:"+91 9012345678", orders:42, spent:15960, last:"1 hour ago",  addr:"Lalpur",      city:"Ranchi" },
  { id:"c6", name:"Neha Gupta",    phone:"+91 9678901234", orders:14, spent:4780,  last:"Today",       addr:"Ratu Road",   city:"Ranchi" },
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

const MOCK_FEEDBACK = [
  { id:1, customer:"Rahul S.", rating:5, comment:"Amazing food and super fast delivery! The butter chicken was exceptional.", dish:"Butter Chicken", time:"1 hr ago" },
  { id:2, customer:"Priya S.", rating:4, comment:"Really good paneer tikka. Could be a bit more spicy but overall great.", dish:"Paneer Tikka", time:"3 hrs ago" },
  { id:3, customer:"Amit K.", rating:5, comment:"Best biryani in Ranchi! Will definitely order again.", dish:"Biryani", time:"5 hrs ago" },
  { id:4, customer:"Neha G.", rating:3, comment:"Food was good but delivery took longer than expected.", dish:"Dal Makhani", time:"Yesterday" },
  { id:5, customer:"Deepak J.", rating:5, comment:"Excellent quality and packaging. Rider was very polite.", dish:"Tandoori Chicken", time:"2 days ago" },
];

const REVENUE_DATA = [
  { t:"8am", rev:1200, ord:4 }, { t:"9am", rev:2800, ord:9 },
  { t:"10am", rev:1800, ord:6 }, { t:"11am", rev:3400, ord:11 },
  { t:"12pm", rev:8200, ord:28 }, { t:"1pm", rev:9800, ord:34 },
  { t:"2pm", rev:7200, ord:24 }, { t:"3pm", rev:4100, ord:14 },
  { t:"4pm", rev:3200, ord:10 }, { t:"5pm", rev:5600, ord:18 },
  { t:"6pm", rev:7800, ord:26 }, { t:"7pm", rev:11200, ord:38 },
  { t:"8pm", rev:13400, ord:45 }, { t:"9pm", rev:10200, ord:34 },
  { t:"10pm", rev:6800, ord:22 },
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

const MOCK_TRANSACTIONS = [
  { id:"TXN-001", date:"May 23", type:"Order Sales",    amount:8450,  method:"UPI",  status:"settled" },
  { id:"TXN-002", date:"May 23", type:"Commission",     amount:-845,  method:"Auto", status:"settled" },
  { id:"TXN-003", date:"May 22", type:"Order Sales",    amount:11200, method:"UPI",  status:"settled" },
  { id:"TXN-004", date:"May 22", type:"Rider Payout",   amount:-1840, method:"NEFT", status:"pending" },
  { id:"TXN-005", date:"May 21", type:"Order Sales",    amount:9600,  method:"UPI",  status:"settled" },
  { id:"TXN-006", date:"May 21", type:"Refund Issued",  amount:-320,  method:"UPI",  status:"settled" },
];

const MOCK_LOST = [
  { id:"ORD-0985", customer:"Arun Tiwari",   reason:"Customer cancelled", time:"Yesterday", total:480 },
  { id:"ORD-0971", customer:"Suman Devi",    reason:"Item unavailable",   time:"2 days ago", total:320 },
  { id:"ORD-0954", customer:"Manish Roy",    reason:"No rider available",  time:"3 days ago", total:890 },
  { id:"ORD-0940", customer:"Kavita Sinha",  reason:"Customer cancelled", time:"4 days ago", total:225 },
  { id:"ORD-0921", customer:"Pankaj Gupta",  reason:"Store closed",       time:"5 days ago", total:650 },
];

const MOCK_PARTNERS = [
  { id:"p1", name:"Ravi Supplies Co.",    type:"Raw Materials", status:"pending",  since:"May 20", contact:"9876001234" },
  { id:"p2", name:"Freshmart Veggies",    type:"Vegetables",    status:"approved", since:"Apr 12", contact:"9812345678" },
  { id:"p3", name:"SpiceBox India",       type:"Spices",        status:"pending",  since:"May 22", contact:"9901234567" },
  { id:"p4", name:"Dairy Fresh Pvt Ltd",  type:"Dairy",         status:"rejected", since:"May 10", contact:"9845611234" },
];

const MOCK_CATS = [
  { id:"cat1", name:"Starters",    icon:"🥗", items:8,  sort:1, active:true },
  { id:"cat2", name:"Main Course", icon:"🍛", items:12, sort:2, active:true },
  { id:"cat3", name:"Rice & Biryani", icon:"🍚", items:5, sort:3, active:true },
  { id:"cat4", name:"Breads",      icon:"🫓", items:6,  sort:4, active:true },
  { id:"cat5", name:"Desserts",    icon:"🍮", items:4,  sort:5, active:true },
  { id:"cat6", name:"Drinks",      icon:"🥤", items:7,  sort:6, active:false },
];

// ─── UTILS ─────────────────────────────────────────────────────────────────
const fmt = (v) => `₹${v.toLocaleString("en-IN")}`;
const cn = (...c) => c.filter(Boolean).join(" ");

const stockStatus = (stock, thr) =>
  stock === 0 ? "critical" : stock <= thr ? "low" : "ok";

const statusColors = {
  ok:       { color: COLORS.success, bg: "#dcfce7" },
  low:      { color: COLORS.warning, bg: "#fef3c7" },
  critical: { color: COLORS.error,   bg: "#fee2e2" },
};

// ─── SHARED COMPONENTS ─────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const s = ORDER_STATUSES[status] || { label: status, color: "#64748b", bg: "#f1f5f9" };
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{ color: s.color, backgroundColor: s.bg, border: `1px solid ${s.color}30` }}>
      {s.label}
    </span>
  );
};

const GlassCard = ({ children, className = "", style = {}, dark }) => (
  <div className={`rounded-2xl border ${className}`}
    style={{
      background: dark ? "rgba(15,23,42,0.85)" : "rgba(255,255,255,0.9)",
      backdropFilter: "blur(12px)",
      borderColor: "rgba(243,107,33,0.12)",
      boxShadow: "0 2px 20px rgba(243,107,33,0.06)",
      ...style
    }}>
    {children}
  </div>
);

const KPICard = ({ title, value, sub, icon: Icon, trend, color = ORANGE }) => (
  <GlassCard className="p-4 flex flex-col gap-2">
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider leading-tight">{title}</span>
      <span className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}18` }}>
        <Icon size={15} style={{ color }} />
      </span>
    </div>
    <div className="text-2xl font-bold text-slate-800" style={{ fontFamily: "'Outfit', sans-serif" }}>{value}</div>
    {sub && <div className="text-xs text-slate-500 leading-tight">{sub}</div>}
    {trend !== undefined && (
      <div className="flex items-center gap-1 text-xs">
        {trend >= 0 ? <ArrowUp size={11} style={{ color: COLORS.success }} /> : <ArrowDown size={11} style={{ color: COLORS.error }} />}
        <span style={{color: trend >= 0 ? COLORS.success : COLORS.error}}>{Math.abs(trend)}% vs yesterday</span>
      </div>
    )}
  </GlassCard>
);

const Avatar = ({ name, size = 32 }) => {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const hue = name.charCodeAt(0) * 7 % 360;
  return (
    <div className="rounded-full flex items-center justify-center font-bold text-white flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.35, background: `hsl(${hue},60%,50%)` }}>
      {initials}
    </div>
  );
};

const StarRating = ({ rating }) => (
  <div className="flex items-center gap-0.5">
    {[1,2,3,4,5].map(i => (
      <Star key={i} size={11} fill={i <= Math.round(rating) ? "#f59e0b" : "none"} stroke={i <= Math.round(rating) ? "#f59e0b" : "#cbd5e1"} />
    ))}
    <span className="text-xs text-slate-500 ml-1">{rating}</span>
  </div>
);

const SearchInput = ({ placeholder, value, onChange, className = "" }) => (
  <div className={`relative ${className}`}>
    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 bg-white/80 focus:outline-none focus:border-orange-300 focus:ring-1 focus:ring-orange-100 w-full transition-all" />
  </div>
);

const Pill = ({ label, active, onClick }) => (
  <button onClick={onClick} className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap"
    style={active ? { backgroundColor: ORANGE, color:"#fff" } : { backgroundColor:"#f1f5f9", color:"#64748b" }}>
    {label}
  </button>
);

const Toast = ({ msg, type = "success", onClose }) => (
  <div className="fixed bottom-20 right-4 lg:bottom-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-white text-sm font-medium animate-bounce"
    style={{ background: type === "success" ? "#22c55e" : type === "error" ? "#ef4444" : ORANGE, minWidth: 240, maxWidth: "90vw" }}>
    {type === "success" ? <CheckCircle size={15} /> : <AlertTriangle size={15} />}
    <span className="flex-1">{msg}</span>
    <button onClick={onClose} className="ml-auto opacity-80 hover:opacity-100"><X size={13} /></button>
  </div>
);

const Modal = ({ title, onClose, children, maxW = "max-w-lg" }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}>
    <GlassCard className={`w-full ${maxW} flex flex-col max-h-[90vh]`}>
      <div className="flex items-center justify-between p-5 border-b border-slate-100 flex-shrink-0">
        <h3 className="font-bold text-base text-slate-800" style={{ fontFamily: "'Outfit', sans-serif" }}>{title}</h3>
        <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 transition-all"><X size={17} /></button>
      </div>
      <div className="overflow-y-auto flex-1 p-5">{children}</div>
    </GlassCard>
  </div>
);

const EmptyState = ({ icon: Icon, msg }) => (
  <div className="py-16 text-center text-slate-400">
    <Icon size={40} className="mx-auto mb-3 opacity-25" />
    <div className="text-sm font-medium">{msg}</div>
  </div>
);

const BtnPrimary = ({ children, onClick, className = "", disabled }) => (
  <button onClick={onClick} disabled={disabled}
    className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 ${className}`}
    style={{ backgroundColor: ORANGE }}>
    {children}
  </button>
);

const ToggleSwitch = ({ checked, onChange }) => (
  <div className="w-10 h-5 rounded-full relative cursor-pointer transition-all flex-shrink-0"
    style={{ backgroundColor: checked ? ORANGE : "#cbd5e1" }}
    onClick={() => onChange(!checked)}>
    <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
      style={{ left: checked ? "calc(100% - 18px)" : 2 }} />
  </div>
);

const SectionHeader = ({ title, action }) => (
  <div className="flex items-center justify-between mb-4">
    <h3 className="font-bold text-slate-800 text-sm" style={{ fontFamily: "'Outfit', sans-serif" }}>{title}</h3>
    {action}
  </div>
);

// ─── NAV CONFIG ─────────────────────────────────────────────────────────────
const NAV_GROUPS = [
  { label:"Operations", items:[
    { id:"dashboard",     label:"Dashboard",      icon:LayoutDashboard },
    { id:"orders",        label:"Orders",         icon:ShoppingBag,  badge:3 },
    { id:"liveops",       label:"Live Ops",       icon:Zap,          badge:"LIVE" },
    { id:"kitchen",       label:"Kitchen",        icon:ChefHat },
    { id:"pos",           label:"POS / Walk-in",  icon:Monitor },
  ]},
  { label:"Catalog", items:[
    { id:"menu",          label:"Menu",           icon:UtensilsCrossed },
    { id:"categories",    label:"Categories",     icon:Tag },
    { id:"inventory",     label:"Inventory",      icon:Package },
  ]},
  { label:"People", items:[
    { id:"customers",     label:"Customers",      icon:Users },
    { id:"riders",        label:"Riders",         icon:Bike },
    { id:"partners",      label:"Partners",       icon:Handshake },
  ]},
  { label:"Insights", items:[
    { id:"analytics",     label:"Analytics",      icon:BarChart3 },
    { id:"lostsales",     label:"Lost Sales",     icon:TrendingDown },
    { id:"settlements",   label:"Settlements",    icon:CreditCard },
  ]},
  { label:"Engagement", items:[
    { id:"notifications", label:"Push Notifs",    icon:Bell },
    { id:"feedback",      label:"Feedback",       icon:MessageSquare },
    { id:"livetracker",   label:"Live Tracker",   icon:MapPin },
  ]},
  { label:"System", items:[
    { id:"settings",      label:"Settings",       icon:Settings },
  ]},
];

const MOBILE_NAV = [
  { id:"dashboard", label:"Home",    icon:LayoutDashboard },
  { id:"orders",    label:"Orders",  icon:ShoppingBag },
  { id:"kitchen",   label:"Kitchen", icon:ChefHat },
  { id:"menu",      label:"Menu",    icon:UtensilsCrossed },
  { id:"settings",  label:"More",    icon:Settings },
];

const PAGE_TITLES = {
  dashboard:"Dashboard", orders:"Orders", liveops:"Live Operations", kitchen:"Kitchen",
  pos:"POS / Walk-in", menu:"Menu", categories:"Categories", inventory:"Inventory",
  customers:"Customers", riders:"Riders", partners:"Partners", analytics:"Analytics",
  lostsales:"Lost Sales", settlements:"Settlements", notifications:"Push Notifications",
  feedback:"Customer Feedback", livetracker:"Live Tracker", settings:"Settings",
};

// ═══════════════════════════════════════════════════════════════════════════
// DASHBOARD PAGE
// ═══════════════════════════════════════════════════════════════════════════
const DashboardPage = ({ showToast }) => {
  const [incoming, setIncoming] = useState(true);
  const [chartPeriod, setChartPeriod] = useState("hourly");

  useEffect(() => {
    const t = setTimeout(() => setIncoming(false), 10000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="space-y-5">
      {incoming && (
        <div className="rounded-2xl p-4 flex items-center gap-4 text-white"
          style={{ background: `linear-gradient(135deg, ${ORANGE}, #c45a18)`, animation: "pulse 2s infinite" }}>
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <Bell size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm">🔔 New Order — ORD-1009</div>
            <div className="text-xs text-white/80 truncate">Neha Gupta · ₹380 · Delivery · 2 items</div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => { setIncoming(false); showToast("Order ORD-1009 accepted!"); }}
              className="px-3 py-1.5 rounded-xl bg-white text-orange-600 text-xs font-bold">Accept</button>
            <button onClick={() => setIncoming(false)}
              className="px-3 py-1.5 rounded-xl bg-white/20 text-xs font-bold">Dismiss</button>
          </div>
        </div>
      )}

      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
        <KPICard title="Today's Revenue" value="₹42,680" sub="68 orders completed" icon={TrendingUp} trend={12.4} />
        <KPICard title="Pending Orders" value="8" sub="3 urgent, 5 normal" icon={Clock} trend={-4} color={COLORS.warning} />
        <KPICard title="Active Riders" value="3/4" sub="2 on delivery, 1 free" icon={Bike} color={COLORS.info} />
        <KPICard title="Avg Order Value" value="₹628" sub="vs ₹584 yesterday" icon={ShoppingCart} trend={7.5} color={COLORS.success} />
      </div>

      <GlassCard className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800" style={{ fontFamily: "'Outfit', sans-serif" }}>Revenue & Orders</h3>
          <div className="flex gap-2">
            <Pill label="Hourly" active={chartPeriod === "hourly"} onClick={() => setChartPeriod("hourly")} />
            <Pill label="Weekly" active={chartPeriod === "weekly"} onClick={() => setChartPeriod("weekly")} />
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartPeriod === "hourly" ? REVENUE_DATA : WEEK_DATA}>
            <defs>
              <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={ORANGE} stopOpacity={0.25} />
                <stop offset="95%" stopColor={ORANGE} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey={chartPeriod === "hourly" ? "t" : "d"} tick={{ fontSize:10, fill:"#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize:10, fill:"#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v/1000}k`} width={45} />
            <Tooltip formatter={(v, n) => [n === "rev" ? fmt(v) : v, n === "rev" ? "Revenue" : "Orders"]} />
            <Area type="monotone" dataKey="rev" stroke={ORANGE} strokeWidth={2.5} fill="url(#grad1)" />
            <Area type="monotone" dataKey="ord" stroke={COLORS.info} strokeWidth={1.5} fill="none" strokeDasharray="4 2" />
          </AreaChart>
        </ResponsiveContainer>
      </GlassCard>

      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
        <GlassCard className="p-4">
          <SectionHeader title="Priority Orders" />
          <div className="space-y-2">
            {MOCK_ORDERS.filter(o => o.status === "pending" || o.status === "confirmed").map(o => (
              <div key={o.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background:"#fff7ed" }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: ORANGE }}>{o.items}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-800 truncate">{o.customer}</div>
                  <div className="text-xs text-slate-500">{o.id} · {o.time}</div>
                </div>
                <StatusBadge status={o.status} />
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <SectionHeader title="Fleet Status" />
          <div className="space-y-3">
            {MOCK_RIDERS.map(r => (
              <div key={r.id} className="flex items-center gap-3">
                <Avatar name={r.name} size={36} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-800 truncate">{r.name}</div>
                  <div className="text-xs text-slate-500">{r.vehicle} · {r.deliv} deliveries</div>
                </div>
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: r.status==="online" ? COLORS.success : r.status==="busy" ? COLORS.warning : "#94a3b8" }} />
                <span className="text-xs font-medium capitalize"
                  style={{ color: r.status==="online" ? COLORS.success : r.status==="busy" ? COLORS.warning : "#94a3b8" }}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <SectionHeader title="Top Sellers Today" />
          <div className="space-y-3">
            {MOCK_MENU.filter(m => m.best).map((m, i) => (
              <div key={m.id} className="flex items-center gap-3">
                <span className="text-2xl">{m.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-800 truncate">{m.name}</div>
                  <StarRating rating={m.rating} />
                </div>
                <span className="text-sm font-bold" style={{ color: ORANGE }}>{fmt(m.price)}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// ORDERS PAGE
// ═══════════════════════════════════════════════════════════════════════════
const OrdersPage = ({ showToast }) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [orders, setOrders] = useState(MOCK_ORDERS);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const filtered = useMemo(() =>
    orders.filter(o =>
      (statusFilter === "all" || o.status === statusFilter) &&
      (o.customer.toLowerCase().includes(search.toLowerCase()) || o.id.toLowerCase().includes(search.toLowerCase()))
    ), [orders, search, statusFilter]);

  const updateStatus = useCallback((id, s) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: s } : o));
    setSelectedOrder(prev => prev?.id === id ? { ...prev, status: s } : prev);
    showToast(`Status updated to ${ORDER_STATUSES[s]?.label}`);
  }, [showToast]);

  const statusFlow = ["pending","confirmed","preparing","ready","out_for_delivery","delivered"];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <SearchInput placeholder="Search orders or customers..." value={search} onChange={setSearch} className="flex-1 min-w-48" />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none">
          <option value="all">All Status</option>
          {Object.entries(ORDER_STATUSES).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <BtnPrimary><Download size={13} /> Export</BtnPrimary>
      </div>

      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: 640 }}>
            <thead>
              <tr className="border-b border-slate-100">
                {["Order","Customer","Total","Type","Status","Time",""].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.id} className="border-b border-slate-50 hover:bg-orange-50/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-bold" style={{ color: ORANGE }}>{o.id}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={o.customer} size={28} />
                      <span className="font-medium text-slate-800 whitespace-nowrap">{o.customer}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-800">{fmt(o.total)}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium capitalize" style={{ backgroundColor:"#f1f5f9", color:"#475569" }}>{o.type}</span>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                  <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{o.time}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => setSelectedOrder(o)}
                      className="p-1.5 rounded-lg hover:bg-orange-50 text-orange-400 transition-all"><Eye size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <EmptyState icon={ShoppingBag} msg="No orders found" />}
        </div>
      </GlassCard>

      {selectedOrder && (
        <Modal title={`Order ${selectedOrder.id}`} onClose={() => setSelectedOrder(null)}>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <Avatar name={selectedOrder.customer} size={40} />
              <div>
                <div className="font-bold text-slate-800">{selectedOrder.customer}</div>
                <div className="text-xs text-slate-500">{selectedOrder.phone}</div>
                <div className="text-xs text-slate-500">{selectedOrder.address}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-xs text-slate-500 mb-1">Items</div>
                <div className="font-bold text-slate-800">{selectedOrder.items} items</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-xs text-slate-500 mb-1">Total</div>
                <div className="font-bold" style={{ color: ORANGE }}>{fmt(selectedOrder.total)}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-xs text-slate-500 mb-1">Type</div>
                <div className="font-bold text-slate-800 capitalize">{selectedOrder.type}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-xs text-slate-500 mb-1">Status</div>
                <StatusBadge status={selectedOrder.status} />
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500 mb-2">Update Status</div>
              <div className="flex flex-wrap gap-2">
                {statusFlow.map(s => (
                  <button key={s} onClick={() => updateStatus(selectedOrder.id, s)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                    style={selectedOrder.status === s
                      ? { backgroundColor: ORANGE, color:"#fff" }
                      : { backgroundColor:"#f1f5f9", color:"#475569" }}>
                    {ORDER_STATUSES[s].label}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => updateStatus(selectedOrder.id, "cancelled")}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-red-500 border border-red-200 hover:bg-red-50 transition-all">
              Cancel Order
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// Placeholder pages (same structure as v2.jsx but abbreviated for space)
const LiveOpsPage = ({ showToast }) => {
  const [orders, setOrders] = useState(MOCK_ORDERS.filter(o => !["delivered","cancelled"].includes(o.status)));
  return <div className="text-slate-400">Live Ops page - coming soon</div>;
};

const KitchenPage = ({ showToast }) => {
  const [orders, setOrders] = useState(MOCK_ORDERS.filter(o => !["delivered","cancelled"].includes(o.status)));
  return <div className="text-slate-400">Kitchen page - coming soon</div>;
};

const POSPage = ({ showToast }) => <div className="text-slate-400">POS page - coming soon</div>;
const MenuPage = ({ showToast }) => <div className="text-slate-400">Menu page - coming soon</div>;
const CategoriesPage = ({ showToast }) => <div className="text-slate-400">Categories page - coming soon</div>;
const InventoryPage = ({ showToast }) => <div className="text-slate-400">Inventory page - coming soon</div>;
const CustomersPage = ({ showToast }) => <div className="text-slate-400">Customers page - coming soon</div>;
const RidersPage = ({ showToast }) => <div className="text-slate-400">Riders page - coming soon</div>;
const PartnersPage = ({ showToast }) => <div className="text-slate-400">Partners page - coming soon</div>;
const AnalyticsPage = ({ showToast }) => <div className="text-slate-400">Analytics page - coming soon</div>;
const LostSalesPage = ({ showToast }) => <div className="text-slate-400">Lost Sales page - coming soon</div>;
const SettlementsPage = ({ showToast }) => <div className="text-slate-400">Settlements page - coming soon</div>;
const NotificationsPage = ({ showToast }) => <div className="text-slate-400">Notifications page - coming soon</div>;
const FeedbackPage = ({ showToast }) => <div className="text-slate-400">Feedback page - coming soon</div>;
const LiveTrackerPage = ({ showToast }) => <div className="text-slate-400">Live Tracker page - coming soon</div>;
const SettingsPage = ({ showToast }) => <div className="text-slate-400">Settings page - coming soon</div>;

// ═══════════════════════════════════════════════════════════════════════════
// PAGE REGISTRY
// ═══════════════════════════════════════════════════════════════════════════
const PAGES = {
  dashboard: DashboardPage, orders: OrdersPage, liveops: LiveOpsPage,
  kitchen: KitchenPage, pos: POSPage, menu: MenuPage,
  categories: CategoriesPage, inventory: InventoryPage, customers: CustomersPage,
  riders: RidersPage, partners: PartnersPage, analytics: AnalyticsPage,
  lostsales: LostSalesPage, settlements: SettlementsPage, notifications: NotificationsPage,
  feedback: FeedbackPage, livetracker: LiveTrackerPage, settings: SettingsPage,
};

// ═══════════════════════════════════════════════════════════════════════════
// ROOT APP WITH FIREBASE AUTH
// ═══════════════════════════════════════════════════════════════════════════
function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [page, setPage] = useState("dashboard");
  const [dark, setDark] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [toast, setToast] = useState(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [outletInfo, setOutletInfo] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  const handleLogin = useCallback(async () => {
    setLoginError("");
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
    } catch (e) {
      setLoginError(e.message.replace("Firebase: ", ""));
    }
  }, [loginEmail, loginPassword]);

  const handleLogout = useCallback(async () => {
    await signOut(auth);
    setUser(null);
    setOutletInfo(null);
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const snap = await get(ref(db, "admins/" + user.uid));
        if (snap.exists()) {
          const d = snap.val();
          setOutletContext(d.businessId, d.outletId);
          setOutletInfo({ name: d.outletName || "", address: d.outletAddress || "" });
        }
      } catch (e) {
        console.warn("Failed to fetch admin info", e);
      }
    })();
  }, [user]);

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  if (authLoading) return null;

  if (!user) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "linear-gradient(135deg, #f36b21 0%, #e85d1a 50%, #d44a0f 100%)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 40 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: "rgba(255,255,255,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Store size={32} color="white" />
          </div>
          <div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "white", letterSpacing: -0.5 }}>FoodHubbie</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>Admin Dashboard</div>
          </div>
        </div>

        <GlassCard className="p-8" style={{ width: "100%", maxWidth: 400, padding: 32 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>Welcome Back</h2>
          <p style={{ fontSize: 14, color: "#64748b", marginBottom: 24 }}>Sign in to manage your outlet</p>

          {loginError && (
            <div style={{
              padding: "10px 14px", borderRadius: 10, marginBottom: 16,
              background: "#fef2f2", color: "#ef4444", fontSize: 13, fontWeight: 500,
            }}>{loginError}</div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <input
              placeholder="Email address"
              value={loginEmail}
              onChange={e => setLoginEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              style={{
                padding: "12px 16px", borderRadius: 12, border: "1.5px solid #e2e8f0",
                fontSize: 14, color: "#1e293b", background: "#f8fafc",
                transition: "border-color 0.2s",
              }}
            />
            <input
              type="password"
              placeholder="Password"
              value={loginPassword}
              onChange={e => setLoginPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              style={{
                padding: "12px 16px", borderRadius: 12, border: "1.5px solid #e2e8f0",
                fontSize: 14, color: "#1e293b", background: "#f8fafc",
                transition: "border-color 0.2s",
              }}
            />
            <BtnPrimary onClick={handleLogin} className="w-full" style={{ width: "100%", padding: "12px 0", borderRadius: 12 }}>
              Sign In
            </BtnPrimary>
          </div>
        </GlassCard>
      </div>
    );
  }

  const PageComponent = PAGES[page] || DashboardPage;
  const bg      = dark ? "#0f172a" : "#f8fafc";
  const sideBg  = dark ? "#1e293b" : "#ffffff";
  const textCol = dark ? "#f1f5f9" : "#1e293b";
  const mutedCol= dark ? "#94a3b8" : "#64748b";

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      background: bg,
      color: textCol,
      transition: "background 0.3s, color 0.3s",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;900&family=Inter:wght@400;500;600&display=swap');
        * { box-sizing: border-box; font-family: 'Inter', sans-serif; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #f36b2130; border-radius: 99px; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.6} }
      `}</style>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 39,
            background: "rgba(0,0,0,0.4)",
          }}
        />
      )}

      {/* Sidebar */}
      <aside style={{
        position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 40,
        width: collapsed ? 56 : 224,
        background: sideBg,
        borderRight: dark ? "1px solid #334155" : "1px solid #e2e8f0",
        display: "flex", flexDirection: "column",
        transition: "width 0.3s, transform 0.3s, background 0.3s",
        overflow: "hidden",
        transform: sidebarOpen ? "translateX(0)" : "",
      }}
        className="sidebar"
      >
        {/* Logo */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: collapsed ? "16px 0" : "16px 18px",
          borderBottom: dark ? "1px solid #334155" : "1px solid #f1f5f9",
          justifyContent: collapsed ? "center" : "flex-start",
          transition: "padding 0.3s",
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: `linear-gradient(135deg,${ORANGE},#e85d1a)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <Store size={16} color="white" />
          </div>
          {!collapsed && (
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: dark ? "#f1f5f9" : "#1e293b", lineHeight: 1.2 }}>
                FoodHubbie
              </div>
              <div style={{ fontSize: 10, color: "#64748b", fontWeight: 500 }}>Admin Panel</div>
            </div>
          )}
        </div>

        {/* Collapse toggle */}
        <div
          onClick={() => setCollapsed(!collapsed)}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "8px 0", cursor: "pointer", color: "#94a3b8",
            borderBottom: dark ? "1px solid #334155" : "1px solid #f1f5f9",
          }}
          className="collapse-toggle"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </div>

        {/* Outlet badge */}
        {outletInfo && !collapsed && (
          <div style={{
            margin: "8px 12px", padding: "10px 12px", borderRadius: 10,
            background: dark ? "#0f172a" : "#fff7ed",
            border: dark ? "1px solid #334155" : "1px solid rgba(243,107,33,0.15)",
          }}>
            <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>
              OUTLET
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: ORANGE }}>{outletInfo.name}</div>
            {outletInfo.address && (
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                <MapPin size={10} /> {outletInfo.address}
              </div>
            )}
          </div>
        )}

        {/* Avatar placeholder when collapsed */}
        {outletInfo && collapsed && (
          <div style={{ display: "flex", justifyContent: "center", padding: "8px 0" }}>
            <Avatar name={outletInfo.name} size={28} />
          </div>
        )}

        {/* Nav groups */}
        <nav style={{ flex: 1, overflow: "auto", padding: collapsed ? "4px 0" : "8px 0" }}>
          {NAV_GROUPS.map((group) => (
            <div key={group.label} style={{ marginBottom: collapsed ? 2 : 4 }}>
              {!collapsed && (
                <div style={{
                  fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                  letterSpacing: 0.8, color: "#94a3b8",
                  padding: "12px 18px 6px",
                }}>
                  {group.label}
                </div>
              )}
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = page === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => { setPage(item.id); setSidebarOpen(false); }}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: collapsed ? "10px 0" : "8px 16px",
                      margin: collapsed ? "2px 0" : "2px 8px",
                      borderRadius: 8,
                      cursor: "pointer",
                      justifyContent: collapsed ? "center" : "flex-start",
                      background: active ? ORANGE : "transparent",
                      color: active ? "white" : (dark ? "#cbd5e1" : "#475569"),
                      transition: "all 0.2s",
                    }}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon size={collapsed ? 20 : 18} style={{ flexShrink: 0 }} />
                    {!collapsed && (
                      <>
                        <span style={{ fontSize: 13, fontWeight: active ? 600 : 500, whiteSpace: "nowrap" }}>
                          {item.label}
                        </span>
                        {item.badge && (
                          <span style={{
                            marginLeft: "auto", fontSize: 10, fontWeight: 700,
                            padding: "1px 7px", borderRadius: 99,
                            background: active ? "rgba(255,255,255,0.25)" : ORANGE,
                            color: "white",
                          }}>
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom actions */}
        <div style={{
          borderTop: dark ? "1px solid #334155" : "1px solid #f1f5f9",
          padding: collapsed ? "8px 0" : "8px 12px",
          display: "flex", flexDirection: "column", gap: 2,
        }}>
          <div
            onClick={() => setDark(!dark)}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: collapsed ? "10px 0" : "8px 12px",
              borderRadius: 8, cursor: "pointer",
              justifyContent: collapsed ? "center" : "flex-start",
              color: dark ? "#cbd5e1" : "#475569",
              transition: "all 0.2s",
            }}
            title={collapsed ? "Toggle theme" : undefined}
          >
            {dark ? <Sun size={collapsed ? 20 : 18} /> : <Moon size={collapsed ? 20 : 18} />}
            {!collapsed && <span style={{ fontSize: 13, fontWeight: 500 }}>{dark ? "Light Mode" : "Dark Mode"}</span>}
          </div>
          <div
            onClick={handleLogout}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: collapsed ? "10px 0" : "8px 12px",
              borderRadius: 8, cursor: "pointer",
              justifyContent: collapsed ? "center" : "flex-start",
              color: "#ef4444",
              transition: "all 0.2s",
            }}
            title={collapsed ? "Logout" : undefined}
          >
            <LogOut size={collapsed ? 20 : 18} />
            {!collapsed && <span style={{ fontSize: 13, fontWeight: 500 }}>Logout</span>}
          </div>
        </div>
      </aside>

      {/* Main content wrapper */}
      <div style={{
        flex: 1,
        display: "flex", flexDirection: "column",
        marginLeft: collapsed ? 56 : 224,
        transition: "margin-left 0.3s",
        minHeight: "100vh",
      }}
        className="main-wrapper"
      >
        {/* Top bar */}
        <header style={{
          position: "sticky", top: 0, zIndex: 30,
          display: "flex", alignItems: "center", gap: 12,
          padding: "12px 24px",
          background: dark ? "#0f172a" : "white",
          borderBottom: dark ? "1px solid #1e293b" : "1px solid #e2e8f0",
          transition: "background 0.3s",
        }}>
          {/* Hamburger - mobile */}
          <div className="hamburger-mobile" onClick={() => setSidebarOpen(true)} style={{ cursor: "pointer", color: dark ? "#f1f5f9" : "#475569" }}>
            <Menu size={22} />
          </div>

          {/* Title area */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: dark ? "#f1f5f9" : "#0f172a" }}>
              {PAGE_TITLES[page] || "Dashboard"}
            </div>
            {outletInfo && (
              <div style={{ fontSize: 12, color: "#94a3b8", display: "flex", alignItems: "center", gap: 4 }}>
                <Store size={12} />
                {outletInfo.name}
              </div>
            )}
          </div>

          {/* Revenue badge */}
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "6px 14px", borderRadius: 99,
            background: dark ? "#1e293b" : "#fff7ed",
            border: dark ? "1px solid #334155" : "1px solid rgba(243,107,33,0.15)",
            fontSize: 13, fontWeight: 700, color: ORANGE,
          }}>
            <Wallet size={14} />
            {fmt(42680)}
          </div>

          {/* Notification bell */}
          <div style={{ position: "relative", cursor: "pointer", color: dark ? "#94a3b8" : "#64748b" }}>
            <Bell size={20} />
            <div style={{
              position: "absolute", top: -2, right: -2,
              width: 8, height: 8, borderRadius: "50%",
              background: "#ef4444",
            }} />
          </div>

          {/* Avatar */}
          {outletInfo && <Avatar name={outletInfo.name} size={32} />}
        </header>

        {/* Page content */}
        <main style={{
          flex: 1,
          padding: 24,
          overflow: "auto",
        }}>
          {PageComponent && <PageComponent showToast={showToast} />}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <div className="mobile-bottom-nav" style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 30,
        display: "flex", alignItems: "center", justifyContent: "space-around",
        padding: "6px 0 env(safe-area-inset-bottom,6px)",
        background: dark ? "#1e293b" : "white",
        borderTop: dark ? "1px solid #334155" : "1px solid #e2e8f0",
      }}>
        {MOBILE_NAV.map((item) => {
          const Icon = item.icon;
          const active = page === item.id;
          return (
            <div
              key={item.id}
              onClick={() => setPage(item.id)}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                padding: "4px 8px", cursor: "pointer", position: "relative",
                color: active ? ORANGE : (dark ? "#64748b" : "#94a3b8"),
                transition: "color 0.2s",
              }}
            >
              <Icon size={20} />
              <span style={{ fontSize: 10, fontWeight: active ? 600 : 500 }}>{item.label}</span>
              {active && (
                <div style={{
                  position: "absolute", top: -6,
                  width: 4, height: 4, borderRadius: "50%",
                  background: ORANGE,
                }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          msg={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default App;
