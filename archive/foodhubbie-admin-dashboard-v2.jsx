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

// ─── THEME ──────────────────────────────────────────────────────────────────
const ORANGE = "#E84908";
const COLORS = {
  primary: "#E84908",
  success: "#22c55e",
  warning: "#f59e0b",
  info: "#3b82f6",
  error: "#ef4444",
  muted: "#64748b",
};
const PIE_COLORS = ["#E84908", "#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899"];

const ORDER_STATUSES = {
  pending:          { label: "Pending",         color: "#f59e0b", bg: "#fef3c7" },
  confirmed:        { label: "Confirmed",        color: "#3b82f6", bg: "#dbeafe" },
  preparing:        { label: "Preparing",        color: "#8b5cf6", bg: "#ede9fe" },
  ready:            { label: "Ready",            color: "#06b6d4", bg: "#cffafe" },
  out_for_delivery: { label: "Out for Delivery", color: "#E84908", bg: "#ffedd5" },
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
      borderColor: "rgba(232, 73, 8,0.12)",
      boxShadow: "0 2px 20px rgba(232, 73, 8,0.06)",
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
        {trend >= 0 ? <ArrowUp size={11} className="text-emerald-500" /> : <ArrowDown size={11} className="text-red-500" />}
        <span className={trend >= 0 ? "text-emerald-600" : "text-red-500"}>{Math.abs(trend)}% vs yesterday</span>
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

// ═══════════════════════════════════════════════════════════════════════════
// LIVE OPS PAGE
// ═══════════════════════════════════════════════════════════════════════════
const LiveOpsPage = ({ showToast }) => {
  const [orders, setOrders] = useState(MOCK_ORDERS.filter(o => !["delivered","cancelled"].includes(o.status)));
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick(p => p + 1), 5000);
    return () => clearInterval(t);
  }, []);

  const accept = useCallback((id) => {
    setOrders(prev => prev.map(o => o.id === id && o.status === "pending" ? { ...o, status:"confirmed" } : o));
    showToast("Order confirmed!");
  }, [showToast]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
        <KPICard title="Live Orders" value={orders.length} icon={Zap} color={COLORS.error} />
        <KPICard title="Pending Accept" value={orders.filter(o=>o.status==="pending").length} icon={Clock} color={COLORS.warning} />
        <KPICard title="In Kitchen" value={orders.filter(o=>["confirmed","preparing"].includes(o.status)).length} icon={ChefHat} color={COLORS.info} />
        <KPICard title="Out for Delivery" value={orders.filter(o=>o.status==="out_for_delivery").length} icon={Truck} color={COLORS.primary} />
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="font-bold text-slate-800 text-sm" style={{ fontFamily:"'Outfit', sans-serif" }}>Live Order Feed</span>
          </div>
          <div className="space-y-3">
            {orders.map(o => (
              <div key={o.id} className="p-3 rounded-xl border border-slate-100 hover:border-orange-200 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold" style={{ color: ORANGE }}>{o.id}</span>
                  <StatusBadge status={o.status} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-slate-800">{o.customer}</div>
                    <div className="text-xs text-slate-500">{o.items} items · {fmt(o.total)} · {o.time}</div>
                  </div>
                  {o.status === "pending" && (
                    <button onClick={() => accept(o.id)}
                      className="px-3 py-1 rounded-lg text-xs font-bold text-white ml-2 flex-shrink-0"
                      style={{ backgroundColor: ORANGE }}>Accept</button>
                  )}
                </div>
              </div>
            ))}
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
                    <div className="flex items-center gap-1.5 text-xs font-semibold capitalize"
                      style={{ color: r.status==="online" ? COLORS.success : r.status==="busy" ? COLORS.warning : "#94a3b8" }}>
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: r.status==="online" ? COLORS.success : r.status==="busy" ? COLORS.warning : "#94a3b8" }} />
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
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// KITCHEN PAGE
// ═══════════════════════════════════════════════════════════════════════════
const KitchenPage = ({ showToast }) => {
  const [orders, setOrders] = useState(MOCK_ORDERS.filter(o => !["delivered","cancelled"].includes(o.status)));
  const [timers, setTimers] = useState({});

  useEffect(() => {
    const t = setInterval(() => setTimers(p => {
      const next = { ...p };
      orders.forEach(o => { next[o.id] = (next[o.id] || 0) + 1; });
      return next;
    }), 60000);
    return () => clearInterval(t);
  }, [orders]);

  const flow = { pending:"confirmed", confirmed:"preparing", preparing:"ready", ready:"out_for_delivery", out_for_delivery:"delivered" };
  const kColors = { pending:"#f59e0b", confirmed:"#3b82f6", preparing:"#8b5cf6", ready:"#06b6d4", out_for_delivery:ORANGE };
  const kLabels = { pending:"Confirm", confirmed:"Start Prep", preparing:"Mark Ready", ready:"Dispatch", out_for_delivery:"Delivered" };

  const advance = useCallback((id) => {
    setOrders(prev => {
      const o = prev.find(x => x.id === id);
      if (!o || !flow[o.status]) return prev;
      const next = flow[o.status];
      showToast(`${id} → ${ORDER_STATUSES[next]?.label}`);
      if (next === "delivered") return prev.filter(x => x.id !== id);
      return prev.map(x => x.id === id ? { ...x, status: next } : x);
    });
  }, [showToast]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {["pending","confirmed","preparing","ready","out_for_delivery"].map(s => (
          <div key={s} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ backgroundColor: `${kColors[s]}18`, color: kColors[s] }}>
            {ORDER_STATUSES[s].label}
            <span className="w-5 h-5 rounded-full text-white text-xs flex items-center justify-center"
              style={{ backgroundColor: kColors[s] }}>
              {orders.filter(o => o.status === s).length}
            </span>
          </div>
        ))}
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
        {orders.map(o => (
          <GlassCard key={o.id} className="p-4" style={{ borderLeft: `3px solid ${kColors[o.status] || ORANGE}` }}>
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-xs font-bold" style={{ color: ORANGE }}>{o.id}</span>
              <span className="text-xs text-slate-400 flex items-center gap-1"><Clock size={10} />{timers[o.id] || 0}m</span>
            </div>
            <div className="font-bold text-slate-800 mb-1">{o.customer}</div>
            <div className="text-xs text-slate-500 mb-3">{o.items} items · {o.type} · {fmt(o.total)}</div>
            <StatusBadge status={o.status} />
            {flow[o.status] && (
              <button onClick={() => advance(o.id)}
                className="w-full mt-3 py-2 rounded-xl text-xs font-bold text-white"
                style={{ backgroundColor: kColors[o.status] }}>
                {kLabels[o.status]}
              </button>
            )}
          </GlassCard>
        ))}
        {orders.length === 0 && <EmptyState icon={ChefHat} msg="Kitchen is clear! No active orders." />}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// POS PAGE
// ═══════════════════════════════════════════════════════════════════════════
const POSPage = ({ showToast }) => {
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("All");
  const [discount, setDiscount] = useState(0);
  const [payMethod, setPayMethod] = useState("cash");
  const [custName, setCustName] = useState("");
  const [showCart, setShowCart] = useState(false);

  const cats = useMemo(() => ["All", ...new Set(MOCK_MENU.map(m => m.cat))], []);
  const filtered = useMemo(() => MOCK_MENU.filter(m =>
    (cat === "All" || m.cat === cat) && m.name.toLowerCase().includes(search.toLowerCase()) && m.avail
  ), [cat, search]);

  const addToCart = useCallback((item) => {
    setCart(prev => {
      const ex = prev.find(c => c.id === item.id);
      if (ex) return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { ...item, qty: 1 }];
    });
  }, []);

  const updateQty = useCallback((id, delta) => {
    setCart(prev => prev.map(c => c.id === id ? { ...c, qty: Math.max(0, c.qty + delta) } : c).filter(c => c.qty > 0));
  }, []);

  const subtotal = useMemo(() => cart.reduce((s, c) => s + c.price * c.qty, 0), [cart]);
  const discAmt = Math.round(subtotal * discount / 100);
  const total = subtotal - discAmt;
  const cartCount = cart.reduce((s, c) => s + c.qty, 0);

  const checkout = () => {
    if (!cart.length) return;
    showToast(`Walk-in sale recorded! ${fmt(total)}`);
    setCart([]); setDiscount(0); setCustName(""); setShowCart(false);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4" style={{ minHeight: "calc(100vh - 160px)" }}>
      {/* Dish Picker */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        <div className="flex gap-3">
          <SearchInput placeholder="Search dishes..." value={search} onChange={setSearch} className="flex-1" />
          {/* Mobile: show cart button */}
          <button className="lg:hidden relative flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ backgroundColor: ORANGE }} onClick={() => setShowCart(true)}>
            <ShoppingCart size={15} />
            {cartCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white text-orange-600 text-xs font-black flex items-center justify-center">{cartCount}</span>}
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {cats.map(c => <Pill key={c} label={c} active={cat === c} onClick={() => setCat(c)} />)}
        </div>
        <div className="grid gap-3 overflow-y-auto" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))" }}>
          {filtered.map(item => (
            <GlassCard key={item.id} className="p-3 cursor-pointer transition-all hover:scale-[1.02]" onClick={() => addToCart(item)}>
              <div className="text-3xl text-center mb-2">{item.emoji}</div>
              <div className="text-xs font-bold text-slate-800 truncate">{item.name}</div>
              <div className="text-xs text-slate-400 mb-1">{item.cat}</div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold" style={{ color: ORANGE }}>{fmt(item.price)}</span>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.veg ? "#22c55e" : "#ef4444" }} />
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* Cart — always visible on desktop, modal on mobile */}
      <div className={`${showCart ? "fixed inset-0 z-50 flex items-end lg:static lg:inset-auto lg:flex" : "hidden lg:flex"} lg:w-72 flex-col`}>
        {showCart && <div className="lg:hidden flex-1 bg-black/40" onClick={() => setShowCart(false)} />}
        <GlassCard className="lg:w-72 w-full flex flex-col p-4 lg:h-full rounded-b-none lg:rounded-2xl max-h-[85vh] lg:max-h-none overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-800" style={{ fontFamily:"'Outfit', sans-serif" }}>Cart {cartCount > 0 && `(${cartCount})`}</h3>
            <button className="lg:hidden p-1.5 rounded-xl hover:bg-slate-100" onClick={() => setShowCart(false)}><X size={16} /></button>
          </div>
          <input value={custName} onChange={e => setCustName(e.target.value)}
            placeholder="Customer name (optional)"
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 mb-3 focus:outline-none" />
          <div className="flex-1 space-y-2 mb-3 overflow-y-auto">
            {!cart.length && <div className="py-8 text-center text-slate-400 text-sm">Add items to get started</div>}
            {cart.map(c => (
              <div key={c.id} className="flex items-center gap-2 p-2 rounded-xl" style={{ backgroundColor:"#fff7ed" }}>
                <span className="text-lg">{c.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-800 truncate">{c.name}</div>
                  <div className="text-xs" style={{ color: ORANGE }}>{fmt(c.price)}</div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => updateQty(c.id, -1)} className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-xs font-bold flex items-center justify-center">-</button>
                  <span className="text-xs font-bold w-5 text-center">{c.qty}</span>
                  <button onClick={() => updateQty(c.id, 1)} className="w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center" style={{ backgroundColor: ORANGE }}>+</button>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-100 pt-3 space-y-3">
            <div>
              <div className="text-xs font-semibold text-slate-500 mb-2">Discount</div>
              <div className="flex gap-1.5">
                {[0,5,10,15,20].map(d => (
                  <button key={d} onClick={() => setDiscount(d)}
                    className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all"
                    style={discount === d ? { backgroundColor: ORANGE, color:"#fff" } : { backgroundColor:"#f1f5f9", color:"#64748b" }}>
                    {d}%
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500 mb-2">Payment</div>
              <div className="grid grid-cols-3 gap-1.5">
                {["cash","upi","card"].map(m => (
                  <button key={m} onClick={() => setPayMethod(m)}
                    className="py-1.5 rounded-lg text-xs font-bold capitalize transition-all"
                    style={payMethod === m ? { backgroundColor: ORANGE, color:"#fff" } : { backgroundColor:"#f1f5f9", color:"#64748b" }}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1 text-sm border-t border-slate-100 pt-3">
              <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
              {discount > 0 && <div className="flex justify-between text-green-600"><span>Discount ({discount}%)</span><span>-{fmt(discAmt)}</span></div>}
              <div className="flex justify-between font-bold text-slate-800 text-base pt-1">
                <span>Total</span><span style={{ color: ORANGE }}>{fmt(total)}</span>
              </div>
            </div>
            <BtnPrimary onClick={checkout} disabled={!cart.length} className="w-full py-3">Record Sale</BtnPrimary>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// MENU PAGE
// ═══════════════════════════════════════════════════════════════════════════
const MenuPage = ({ showToast }) => {
  const [items, setItems] = useState(MOCK_MENU);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name:"", cat:"Main Course", price:"", desc:"", veg:true });

  const filtered = useMemo(() => items.filter(m => m.name.toLowerCase().includes(search.toLowerCase())), [items, search]);

  const toggleAvail = useCallback((id) => {
    setItems(prev => prev.map(m => m.id === id ? { ...m, avail: !m.avail } : m));
    showToast("Availability updated");
  }, [showToast]);

  const openEdit = (item) => {
    setEditing(item);
    setForm({ name: item.name, cat: item.cat, price: item.price, desc: item.desc || "", veg: item.veg });
    setShowModal(true);
  };

  const saveItem = () => {
    if (editing) {
      setItems(prev => prev.map(m => m.id === editing.id ? { ...m, ...form, price: +form.price } : m));
      showToast("Dish updated!");
    } else {
      setItems(prev => [...prev, { ...form, id:`d${Date.now()}`, price:+form.price, rating:4.0, stock:50, avail:true, best:false, emoji:"🍽️" }]);
      showToast("Dish added!");
    }
    setShowModal(false); setEditing(null);
    setForm({ name:"", cat:"Main Course", price:"", desc:"", veg:true });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <SearchInput placeholder="Search menu..." value={search} onChange={setSearch} className="flex-1" />
        <BtnPrimary onClick={() => { setEditing(null); setForm({ name:"", cat:"Main Course", price:"", desc:"", veg:true }); setShowModal(true); }}>
          <Plus size={14} /> Add Dish
        </BtnPrimary>
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
        {filtered.map(item => (
          <GlassCard key={item.id} className={`p-4 ${!item.avail ? "opacity-60" : ""}`}>
            <div className="flex items-start justify-between mb-3">
              <span className="text-4xl">{item.emoji}</span>
              <div className="flex gap-1">
                <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><Edit2 size={13} /></button>
                <button onClick={() => toggleAvail(item.id)}
                  className="px-2 py-1 rounded-lg text-xs font-bold"
                  style={item.avail ? { backgroundColor:"#dcfce7", color:"#16a34a" } : { backgroundColor:"#f1f5f9", color:"#94a3b8" }}>
                  {item.avail ? "ON" : "OFF"}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-slate-800 text-sm">{item.name}</span>
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.veg ? "#22c55e" : "#ef4444" }} />
            </div>
            {item.best && <span className="text-xs px-1.5 py-0.5 rounded-full font-bold mb-1 inline-block" style={{ backgroundColor:"#fff7ed", color: ORANGE }}>⭐ Best Seller</span>}
            <div className="text-xs text-slate-400 mb-2">{item.cat}</div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-base" style={{ color: ORANGE }}>{fmt(item.price)}</span>
              <StarRating rating={item.rating} />
            </div>
          </GlassCard>
        ))}
      </div>

      {showModal && (
        <Modal title={editing ? "Edit Dish" : "Add New Dish"} onClose={() => setShowModal(false)}>
          <div className="space-y-3">
            {[["name","Dish Name","text"],["price","Price (₹)","number"],["desc","Description","text"]].map(([field, label, type]) => (
              <div key={field}>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">{label}</label>
                <input type={type} value={form[field]} onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-orange-300" />
              </div>
            ))}
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Category</label>
              <select value={form.cat} onChange={e => setForm(p => ({ ...p, cat: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none">
                {["Starters","Main Course","Rice","Breads","Desserts","Drinks"].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-50 rounded-xl">
              <ToggleSwitch checked={form.veg} onChange={v => setForm(p => ({ ...p, veg: v }))} />
              <span className="text-sm font-medium text-slate-700">{form.veg ? "Vegetarian" : "Non-Vegetarian"}</span>
            </label>
          </div>
          <div className="flex gap-3 mt-5">
            <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50">Cancel</button>
            <BtnPrimary onClick={saveItem} className="flex-1 py-2.5 justify-center">{editing ? "Save Changes" : "Add Dish"}</BtnPrimary>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORIES PAGE
// ═══════════════════════════════════════════════════════════════════════════
const CategoriesPage = ({ showToast }) => {
  const [cats, setCats] = useState(MOCK_CATS);
  const [form, setForm] = useState({ name:"", icon:"🍽️", sort:0 });

  const addCat = () => {
    if (!form.name.trim()) return;
    setCats(prev => [...prev, { id:`cat${Date.now()}`, ...form, items:0, active:true }]);
    setForm({ name:"", icon:"🍽️", sort:0 });
    showToast("Category added!");
  };

  const toggleCat = (id) => {
    setCats(prev => prev.map(c => c.id === id ? { ...c, active: !c.active } : c));
    showToast("Category updated");
  };

  const deleteCat = (id) => {
    setCats(prev => prev.filter(c => c.id !== id));
    showToast("Category deleted");
  };

  return (
    <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
      {/* Add Form */}
      <GlassCard className="p-5 h-fit">
        <SectionHeader title="Add New Category" />
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Category Name</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Soups & Salads"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-orange-300" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Emoji / Icon</label>
            <input value={form.icon} onChange={e => setForm(p => ({ ...p, icon: e.target.value }))}
              placeholder="e.g. 🍜"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-orange-300" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Sort Order</label>
            <input type="number" value={form.sort} onChange={e => setForm(p => ({ ...p, sort: +e.target.value }))}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-orange-300" />
          </div>
          <BtnPrimary onClick={addCat} className="w-full py-2.5 justify-center">
            <Plus size={14} /> Add Category
          </BtnPrimary>
        </div>
      </GlassCard>

      {/* Grid */}
      <div>
        <div className="grid gap-3">
          {cats.map(c => (
            <GlassCard key={c.id} className={`p-4 flex items-center gap-3 ${!c.active ? "opacity-60" : ""}`}>
              <span className="text-3xl">{c.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-800">{c.name}</div>
                <div className="text-xs text-slate-500">{c.items} items · Sort #{c.sort}</div>
              </div>
              <ToggleSwitch checked={c.active} onChange={() => toggleCat(c.id)} />
              <button onClick={() => deleteCat(c.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-400 transition-all">
                <Trash2 size={14} />
              </button>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// INVENTORY PAGE
// ═══════════════════════════════════════════════════════════════════════════
const InventoryPage = ({ showToast }) => {
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

  return (
    <div className="space-y-4">
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
};

// ═══════════════════════════════════════════════════════════════════════════
// CUSTOMERS PAGE
// ═══════════════════════════════════════════════════════════════════════════
const CustomersPage = () => {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const filtered = useMemo(() =>
    MOCK_CUSTOMERS.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)),
    [search]);

  return (
    <div className="space-y-4">
      <SearchInput placeholder="Search customers..." value={search} onChange={setSearch} />
      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: 520 }}>
            <thead>
              <tr className="border-b border-slate-100">
                {["Customer","Phone","Orders","Spent","Last Order",""].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="border-b border-slate-50 hover:bg-orange-50/30 cursor-pointer" onClick={() => setSelected(c)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={c.name} size={32} />
                      <span className="font-semibold text-slate-800">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{c.phone}</td>
                  <td className="px-4 py-3 font-semibold text-slate-800">{c.orders}</td>
                  <td className="px-4 py-3 font-bold" style={{ color: ORANGE }}>{fmt(c.spent)}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{c.last}</td>
                  <td className="px-4 py-3"><Eye size={14} className="text-slate-400" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {selected && (
        <Modal title="Customer Profile" onClose={() => setSelected(null)}>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
              <Avatar name={selected.name} size={52} />
              <div>
                <div className="font-bold text-lg text-slate-800">{selected.name}</div>
                <div className="text-sm text-slate-500">{selected.phone}</div>
                <div className="text-sm text-slate-500">{selected.addr}, {selected.city}</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[["Total Orders", selected.orders], ["Total Spent", fmt(selected.spent)], ["Last Order", selected.last]].map(([l,v]) => (
                <div key={l} className="p-3 bg-slate-50 rounded-xl text-center">
                  <div className="text-xs text-slate-500 mb-1">{l}</div>
                  <div className="font-bold text-slate-800">{v}</div>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// RIDERS PAGE
// ═══════════════════════════════════════════════════════════════════════════
const RidersPage = ({ showToast }) => {
  const [riders, setRiders] = useState(MOCK_RIDERS);
  const [selected, setSelected] = useState(null);

  const online = riders.filter(r => r.status === "online").length;
  const busy = riders.filter(r => r.status === "busy").length;

  return (
    <div className="space-y-4">
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
        <KPICard title="Online" value={online} icon={Activity} color={COLORS.success} />
        <KPICard title="On Delivery" value={busy} icon={Truck} color={COLORS.warning} />
        <KPICard title="Offline" value={riders.filter(r => r.status === "offline").length} icon={XCircle} color={COLORS.muted} />
        <KPICard title="Total Earnings" value={fmt(riders.reduce((s,r) => s+r.earn, 0))} icon={Wallet} color={COLORS.info} />
      </div>
      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: 580 }}>
            <thead>
              <tr className="border-b border-slate-100">
                {["Rider","Vehicle","Status","Deliveries","Earnings","Rating","Order",""].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {riders.map(r => (
                <tr key={r.id} className="border-b border-slate-50 hover:bg-orange-50/30 cursor-pointer" onClick={() => setSelected(r)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={r.name} size={32} />
                      <div><div className="font-semibold text-slate-800">{r.name}</div><div className="text-xs text-slate-500">{r.phone}</div></div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 capitalize">{r.vehicle}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5 text-xs font-semibold capitalize whitespace-nowrap"
                      style={{ color: r.status==="online" ? COLORS.success : r.status==="busy" ? COLORS.warning : "#94a3b8" }}>
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: r.status==="online" ? COLORS.success : r.status==="busy" ? COLORS.warning : "#94a3b8" }} />
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800">{r.deliv}</td>
                  <td className="px-4 py-3 font-bold" style={{ color: ORANGE }}>{fmt(r.earn)}</td>
                  <td className="px-4 py-3"><StarRating rating={r.rating} /></td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: r.order ? ORANGE : "#94a3b8" }}>{r.order || "—"}</td>
                  <td className="px-4 py-3"><Eye size={14} className="text-slate-400" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {selected && (
        <Modal title="Rider Profile" onClose={() => setSelected(null)}>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
              <Avatar name={selected.name} size={52} />
              <div>
                <div className="font-bold text-lg text-slate-800">{selected.name}</div>
                <div className="text-sm text-slate-500">{selected.phone}</div>
                <div className="capitalize text-sm" style={{ color: selected.status==="online" ? COLORS.success : selected.status==="busy" ? COLORS.warning : "#94a3b8" }}>● {selected.status}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[["Deliveries Today", selected.deliv], ["Earnings Today", fmt(selected.earn)], ["Rating", selected.rating + " ★"], ["Vehicle", selected.vehicle]].map(([l,v]) => (
                <div key={l} className="p-3 bg-slate-50 rounded-xl">
                  <div className="text-xs text-slate-500 mb-1">{l}</div>
                  <div className="font-bold text-slate-800 capitalize">{v}</div>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// PARTNERS PAGE
// ═══════════════════════════════════════════════════════════════════════════
const PartnersPage = ({ showToast }) => {
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

  return (
    <div className="space-y-4">
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
};

// ═══════════════════════════════════════════════════════════════════════════
// ANALYTICS PAGE
// ═══════════════════════════════════════════════════════════════════════════
const AnalyticsPage = () => {
  const [tab, setTab] = useState("revenue");

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {["revenue","categories","riders"].map(t => (
          <Pill key={t} label={t.charAt(0).toUpperCase()+t.slice(1)} active={tab===t} onClick={() => setTab(t)} />
        ))}
      </div>

      {tab === "revenue" && (
        <div className="space-y-4">
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
            <KPICard title="Weekly Revenue" value="₹3,91,000" icon={TrendingUp} trend={8.2} />
            <KPICard title="Weekly Orders" value="634" icon={ShoppingBag} trend={5.1} />
            <KPICard title="Best Day" value="Sat" icon={Star} color={COLORS.warning} />
            <KPICard title="Avg Per Day" value="₹55,857" icon={BarChart3} />
          </div>
          <GlassCard className="p-4">
            <SectionHeader title="Revenue This Week" />
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={WEEK_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="d" tick={{ fontSize:11, fill:"#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:11, fill:"#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v/1000}k`} width={45} />
                <Tooltip formatter={(v,n) => [n==="rev" ? fmt(v) : v, n==="rev" ? "Revenue":"Orders"]} />
                <Bar dataKey="rev" fill={ORANGE} radius={[6,6,0,0]} />
                <Bar dataKey="ord" fill={COLORS.info} radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>
        </div>
      )}

      {tab === "categories" && (
        <GlassCard className="p-4">
          <SectionHeader title="Sales by Category" />
          <div className="flex flex-col lg:flex-row items-center gap-6">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={CAT_DATA} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                  {CAT_DATA.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => [`${v}%`, "Share"]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3 min-w-48">
              {CAT_DATA.map((c, i) => (
                <div key={c.name} className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i] }} />
                  <span className="text-sm text-slate-700 flex-1">{c.name}</span>
                  <span className="text-sm font-bold text-slate-800">{c.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      )}

      {tab === "riders" && (
        <GlassCard className="p-4">
          <SectionHeader title="Rider Performance" />
          <div className="space-y-4">
            {MOCK_RIDERS.map(r => (
              <div key={r.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Avatar name={r.name} size={28} />
                    <span className="text-sm font-semibold text-slate-800">{r.name}</span>
                  </div>
                  <span className="text-sm font-bold" style={{ color: ORANGE }}>{r.deliv} deliveries</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="h-2 rounded-full transition-all" style={{ width:`${(r.deliv/15)*100}%`, backgroundColor: ORANGE }} />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// LOST SALES PAGE
// ═══════════════════════════════════════════════════════════════════════════
const LostSalesPage = () => {
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
};

// ═══════════════════════════════════════════════════════════════════════════
// SETTLEMENTS PAGE
// ═══════════════════════════════════════════════════════════════════════════
const SettlementsPage = () => {
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
};

// ═══════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS PAGE
// ═══════════════════════════════════════════════════════════════════════════
const NotificationsPage = ({ showToast }) => {
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
};

// ═══════════════════════════════════════════════════════════════════════════
// FEEDBACK PAGE
// ═══════════════════════════════════════════════════════════════════════════
const FeedbackPage = () => (
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

// ═══════════════════════════════════════════════════════════════════════════
// LIVE TRACKER PAGE
// ═══════════════════════════════════════════════════════════════════════════
const LiveTrackerPage = () => (
  <div className="space-y-4">
    <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
      <KPICard title="Online Riders" value="2" icon={Navigation} color={COLORS.success} />
      <KPICard title="Active Deliveries" value="2" icon={Truck} color={COLORS.warning} />
      <KPICard title="Avg Delivery Time" value="28 min" icon={Clock} color={COLORS.info} />
    </div>
    <GlassCard className="p-4">
      <SectionHeader title="Live Map" />
      <div className="rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center"
        style={{ height: 320, background: "linear-gradient(135deg, #e2e8f0, #cbd5e1)" }}>
        <div className="text-center">
          <MapPin size={36} className="mx-auto mb-3" style={{ color: ORANGE }} />
          <div className="font-bold text-slate-600">Live Map — Ranchi, Jharkhand</div>
          <div className="text-sm text-slate-400 mt-1">Connect Firebase for real-time rider tracking</div>
          <div className="flex items-center gap-4 mt-4 justify-center">
            {MOCK_RIDERS.filter(r => r.status !== "offline").map(r => (
              <div key={r.id} className="text-center">
                <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold mx-auto mb-1">
                  {r.name.split(" ").map(w=>w[0]).join("")}
                </div>
                <div className="text-xs text-slate-600 font-medium">{r.name.split(" ")[0]}</div>
                <div className="text-xs" style={{ color: r.status==="online" ? COLORS.success : COLORS.warning }}>{r.status}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </GlassCard>
    <div className="space-y-2">
      {MOCK_RIDERS.map(r => (
        <GlassCard key={r.id} className="p-4 flex items-center gap-3">
          <Avatar name={r.name} size={36} />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-slate-800">{r.name}</div>
            <div className="text-xs text-slate-500">{r.vehicle} · {r.order ? `On ${r.order}` : "Available"}</div>
          </div>
          <div className="text-right">
            <div className="text-xs font-semibold capitalize" style={{ color: r.status==="online" ? COLORS.success : r.status==="busy" ? COLORS.warning : "#94a3b8" }}>
              ● {r.status}
            </div>
            <div className="text-xs text-slate-400">{r.deliv} today</div>
          </div>
        </GlassCard>
      ))}
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════
// SETTINGS PAGE
// ═══════════════════════════════════════════════════════════════════════════
const SettingsPage = ({ showToast }) => {
  const [s, setS] = useState({
    commission:10, riderBase:30, riderKm:5, minOrder:100,
    delivMin:25, delivMax:45, adminPhone:"+91 9876543210",
    wifi:"FoodHubbie_Guest", wifiPass:"welcome123",
    instagram:"@foodhubbie", facebook:"fb.com/foodhubbie", reviewUrl:"g.page/foodhubbie/review",
    showName:true, showAddr:true, showGST:false, showFSSAI:true, showPowered:true,
    autoAccept:false, soundAlert:true, emailReport:true,
  });
  const set = (k, v) => setS(p => ({ ...p, [k]: v }));

  const Section = ({ title, children }) => (
    <GlassCard className="p-5">
      <h3 className="font-bold text-slate-800 mb-4" style={{ fontFamily:"'Outfit', sans-serif" }}>{title}</h3>
      {children}
    </GlassCard>
  );

  const Field = ({ label, field, type="text" }) => (
    <div>
      <label className="text-xs font-semibold text-slate-500 mb-1 block">{label}</label>
      <input type={type} value={s[field]} onChange={e => set(field, type==="number" ? +e.target.value : e.target.value)}
        className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-orange-300" />
    </div>
  );

  const Toggle = ({ label, field }) => (
    <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-orange-50/30 cursor-pointer" onClick={() => set(field, !s[field])}>
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <ToggleSwitch checked={s[field]} onChange={v => set(field, v)} />
    </div>
  );

  return (
    <div className="space-y-5 max-w-3xl">
      <Section title="Commission & Fees">
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          <Field label="Commission %" field="commission" type="number" />
          <Field label="Base Rider Fee (₹)" field="riderBase" type="number" />
          <Field label="Per KM Incentive (₹)" field="riderKm" type="number" />
        </div>
      </Section>

      <Section title="Order Settings">
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          <Field label="Min Order Amount (₹)" field="minOrder" type="number" />
          <Field label="Min Delivery Time (min)" field="delivMin" type="number" />
          <Field label="Max Delivery Time (min)" field="delivMax" type="number" />
          <Field label="Admin WhatsApp" field="adminPhone" />
        </div>
      </Section>

      <Section title="WiFi Info">
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          <Field label="WiFi Network Name" field="wifi" />
          <Field label="WiFi Password" field="wifiPass" />
        </div>
      </Section>

      <Section title="Social Links">
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          <Field label="Instagram" field="instagram" />
          <Field label="Facebook" field="facebook" />
          <Field label="Google Review URL" field="reviewUrl" />
        </div>
      </Section>

      <Section title="Receipt Settings">
        <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          {[["Show Store Name","showName"],["Show Address","showAddr"],["Show GSTIN","showGST"],["Show FSSAI","showFSSAI"],["Show Powered By","showPowered"]].map(([l,f]) => (
            <Toggle key={f} label={l} field={f} />
          ))}
        </div>
      </Section>

      <Section title="Automation">
        <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          {[["Auto-Accept Orders","autoAccept"],["Sound Alerts","soundAlert"],["Daily Email Reports","emailReport"]].map(([l,f]) => (
            <Toggle key={f} label={l} field={f} />
          ))}
        </div>
      </Section>

      <BtnPrimary onClick={() => showToast("Settings saved successfully!")} className="py-3 px-8">Save All Changes</BtnPrimary>
    </div>
  );
};

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
// ROOT APP
// ═══════════════════════════════════════════════════════════════════════════
export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [page, setPage] = useState("dashboard");
  const [dark, setDark] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [toast, setToast] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginErr, setLoginErr] = useState("");

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const bg      = dark ? "#0f172a" : "#f8fafc";
  const sideBg  = dark ? "#1e293b" : "#ffffff";
  const textCol = dark ? "#f1f5f9" : "#1e293b";
  const mutedCol= dark ? "#94a3b8" : "#64748b";

  const handleLogin = () => {
    if (email === "admin@foodhubbie.com" && password === "admin123") {
      setLoggedIn(true); setLoginErr("");
    } else {
      setLoginErr("Invalid credentials. Try admin@foodhubbie.com / admin123");
    }
  };

  // ── Login Screen ──────────────────────────────────────────────────────
  if (!loggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4"
        style={{ background: `linear-gradient(135deg, #fff7ed 0%, #fed7aa 50%, #fef3c7 100%)` }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;900&family=Inter:wght@400;500;600&display=swap');
          * { font-family: 'Inter', sans-serif; box-sizing: border-box; }
          @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.7} }
        `}</style>
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-3xl mb-4 shadow-lg"
              style={{ background: `linear-gradient(135deg, ${ORANGE}, #c45a18)` }}>🍽️</div>
            <div className="text-2xl font-black text-slate-800" style={{ fontFamily:"'Outfit', sans-serif" }}>FoodHubbie</div>
            <div className="text-sm font-semibold mt-1" style={{ color: ORANGE }}>Admin Dashboard</div>
          </div>
          <GlassCard className="p-6">
            <h2 className="font-bold text-slate-800 mb-5" style={{ fontFamily:"'Outfit', sans-serif" }}>Sign in to your account</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Email</label>
                <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="admin@foodhubbie.com"
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-orange-300"
                  onKeyDown={e => e.key==="Enter" && handleLogin()} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Password</label>
                <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="••••••••"
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-orange-300"
                  onKeyDown={e => e.key==="Enter" && handleLogin()} />
              </div>
              {loginErr && <div className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-xl">{loginErr}</div>}
              <BtnPrimary onClick={handleLogin} className="w-full py-3 justify-center text-base">Sign In</BtnPrimary>
              <div className="text-center text-xs text-slate-400">admin@foodhubbie.com · admin123</div>
            </div>
          </GlassCard>
        </div>
      </div>
    );
  }

  const PageComp = PAGES[page] || DashboardPage;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: bg, fontFamily:"'Inter', sans-serif", color: textCol }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;900&family=Inter:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #E8490830; border-radius: 99px; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.6} }
      `}</style>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 flex flex-col transition-all duration-300 ease-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        style={{ width: collapsed ? 56 : 224, background: sideBg, borderRight:`1px solid rgba(232, 73, 8,0.1)`, flexShrink:0, minWidth: collapsed ? 56 : 224 }}>

        {/* Logo */}
        <div className="flex items-center gap-2.5 px-3 py-4 border-b" style={{ borderColor:"rgba(232, 73, 8,0.1)" }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-black flex-shrink-0"
            style={{ background:`linear-gradient(135deg, ${ORANGE}, #c45a18)` }}>🍽</div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="font-black text-sm text-slate-800 leading-tight" style={{ fontFamily:"'Outfit', sans-serif" }}>FoodHubbie</div>
              <div className="text-xs" style={{ color: ORANGE }}>Admin Panel</div>
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded-lg hover:bg-orange-50 transition-all flex-shrink-0"
            style={{ color: mutedCol }}>
            {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
          </button>
        </div>

        {/* Outlet badge */}
        {!collapsed && (
          <div className="mx-2 my-2 px-2.5 py-2 rounded-xl flex items-center gap-2 text-xs font-semibold" style={{ backgroundColor:"#fff7ed", color: ORANGE }}>
            <Store size={11} />
            <span className="truncate">Spice Garden · Main</span>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-1.5 py-1">
          {NAV_GROUPS.map(g => (
            <div key={g.label} className="mb-2">
              {!collapsed && <div className="text-xs font-bold uppercase tracking-widest px-2 py-1 mb-0.5" style={{ color: mutedCol, fontSize:9 }}>{g.label}</div>}
              {g.items.map(item => {
                const Icon = item.icon;
                const active = page === item.id;
                return (
                  <button key={item.id} onClick={() => { setPage(item.id); setSidebarOpen(false); }}
                    title={collapsed ? item.label : ""}
                    className="w-full flex items-center gap-2 px-2 py-2 rounded-xl mb-0.5 text-xs font-medium transition-all relative"
                    style={active ? { backgroundColor: ORANGE, color:"#fff" } : { color: mutedCol }}>
                    <Icon size={15} className="flex-shrink-0" />
                    {!collapsed && <span className="flex-1 text-left truncate">{item.label}</span>}
                    {!collapsed && item.badge && (
                      <span className="px-1.5 py-0.5 rounded-full text-xs font-black"
                        style={active ? { backgroundColor:"rgba(255,255,255,0.25)", color:"#fff" } : { backgroundColor: item.badge==="LIVE" ? "#fee2e2" : "#fff7ed", color: item.badge==="LIVE" ? COLORS.error : ORANGE }}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-1.5 pb-3 border-t space-y-1 pt-2" style={{ borderColor:"rgba(232, 73, 8,0.1)" }}>
          <button onClick={() => setDark(!dark)}
            className="w-full flex items-center gap-2 px-2 py-2 rounded-xl text-xs font-medium hover:bg-orange-50 transition-all"
            style={{ color: mutedCol }}>
            {dark ? <Sun size={15} /> : <Moon size={15} />}
            {!collapsed && <span>{dark ? "Light Mode" : "Dark Mode"}</span>}
          </button>
          <button onClick={() => setLoggedIn(false)}
            className="w-full flex items-center gap-2 px-2 py-2 rounded-xl text-xs font-medium hover:bg-red-50 hover:text-red-500 transition-all"
            style={{ color: mutedCol }}>
            <LogOut size={15} />
            {!collapsed && <span>Log Out</span>}
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TOP BAR */}
        <header className="flex items-center gap-3 px-4 py-3 border-b flex-shrink-0 z-10"
          style={{ background: sideBg, borderColor:"rgba(232, 73, 8,0.1)" }}>
          <button className="lg:hidden p-2 rounded-xl hover:bg-slate-100 transition-all" onClick={() => setSidebarOpen(true)}>
            <Menu size={17} style={{ color: mutedCol }} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-slate-800 leading-tight" style={{ fontFamily:"'Outfit', sans-serif", fontSize:15 }}>{PAGE_TITLES[page]}</h1>
            <div className="text-xs text-slate-400 truncate">Spice Garden · Main Branch · Ranchi</div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
              style={{ backgroundColor:"#fff7ed", color: ORANGE }}>
              <Wallet size={11} /> ₹42,680
            </div>
            <button className="relative p-2 rounded-xl hover:bg-orange-50 transition-all">
              <Bell size={15} style={{ color: mutedCol }} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
            </button>
            <div className="flex items-center gap-2 cursor-pointer">
              <Avatar name="Admin User" size={30} />
              <div className="hidden sm:block">
                <div className="text-xs font-bold text-slate-800">Admin</div>
                <div className="text-xs" style={{ color: ORANGE }}>Owner</div>
              </div>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-5 pb-20 lg:pb-6">
          <PageComp showToast={showToast} />
        </main>

        {/* MOBILE BOTTOM NAV */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 flex items-center border-t"
          style={{ background: sideBg, borderColor:"rgba(232, 73, 8,0.1)" }}>
          {MOBILE_NAV.map(item => {
            const Icon = item.icon;
            const active = page === item.id;
            return (
              <button key={item.id} onClick={() => setPage(item.id)}
                className="flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-all"
                style={{ color: active ? ORANGE : mutedCol }}>
                <Icon size={19} />
                <span style={{ fontSize: 10 }}>{item.label}</span>
                {active && <span className="w-1 h-1 rounded-full" style={{ backgroundColor: ORANGE }} />}
              </button>
            );
          })}
        </nav>
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
