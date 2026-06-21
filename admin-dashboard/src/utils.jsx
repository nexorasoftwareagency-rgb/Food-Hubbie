import { ORANGE, PIE_COLORS, DAY_KEYS, HOURS_8_TO_23, DISC_TYPES } from "./constants";

export const fmt = (v) => `\u20B9${Number(v).toLocaleString("en-IN")}`;
export const esc = (t) => { if (!t) return ""; const m = {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}; return String(t).replace(/[&<>"']/g, c => m[c]); };
export const csvValue = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
export const downloadCSV = (filename, rows) => {
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
export const orderItemsCount = (order) => Array.isArray(order.cart) ? order.cart.length : (order.items ? Object.keys(order.items).length : Number(order.items || 0));
export const orderItemsText = (order) => Array.isArray(order.cart)
  ? order.cart.map(i => `${i.qty || 1}x ${i.name || i.item || "Item"}`).join(", ")
  : (order.items && typeof order.items === "object" ? Object.values(order.items).map(i => `${i.qty || 1}x ${i.name || i.item || "Item"}`).join(", ") : `${order.items || ""}`);
export const validateGSTIN = (g) => { if (!g) return true; return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(g) ? true : {valid:false,msg:"Invalid GSTIN"}; };
export const validateFSSAI = (f) => { if (!f) return true; return /^[0-9]{14}$/.test(f) ? true : {valid:false,msg:"FSSAI must be 14 digits"}; };
export const validateCoords = (lat,lng) => { const l=parseFloat(lat),n=parseFloat(lng); if(isNaN(l)||l<-90||l>90)return {valid:false,msg:"Invalid Lat"}; if(isNaN(n)||n<-180||n>180)return {valid:false,msg:"Invalid Lng"}; return {valid:true}; };
export const handleImageError = (e) => { e.target.onerror = null; e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='1.5'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Cpath d='M8 12l2 2 4-4'/%3E%3C/svg%3E"; };

export function buildTodayRevenue(orders) {
  const slots = ["8am","10am","12pm","2pm","4pm","6pm","8pm"];
  const buckets = slots.map(t => ({ t, rev: 0 }));
  const now = new Date();
  const todayKey = now.toISOString().split("T")[0];
  orders.forEach(o => {
    if (!o.createdAt) return;
    const d = new Date(o.createdAt);
    if (d.toISOString().split("T")[0] !== todayKey) return;
    if (String(o.status).toLowerCase() !== "delivered") return;
    const h = d.getHours();
    const slotIdx = h < 10 ? 0 : h < 12 ? 1 : h < 14 ? 2 : h < 16 ? 3 : h < 18 ? 4 : h < 20 ? 5 : 6;
    buckets[slotIdx].rev += Number(o.total) || 0;
  });
  return buckets;
}

export function buildWeekRevenue(orders) {
  const buckets = DAY_KEYS.map(d => ({ d, rev: 0 }));
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  orders.forEach(o => {
    if (!o.createdAt) return;
    const ts = new Date(o.createdAt).getTime();
    if (ts < cutoff) return;
    if (String(o.status).toLowerCase() !== "delivered") return;
    const day = new Date(o.createdAt).getDay();
    buckets[day].rev += Number(o.total) || 0;
  });
  return buckets;
}

export function normalizeRider(r) {
  const status = String(r.status || "offline");
  const statusNorm = status === "Online" || status === "on delivery" || status === "On Delivery" || status === "busy"
    ? (status.toLowerCase() === "on delivery" || status === "On Delivery" ? "busy" : status.toLowerCase())
    : "offline";
  return {
    id: r.id || r.uid,
    name: r.name || r.displayName || r.email || r.id || r.uid,
    phone: r.phone || r.phoneNumber || "",
    vehicle: r.vehicle || r.vehicleType || "bike",
    status: statusNorm,
    earn: Number(r.todayEarnings || r.earn || 0),
    deliv: Number(r.todayDeliveries || r.deliveries || r.deliv || 0),
    rating: Number(r.rating || 0),
    zone: r.zone || r.area || "",
    order: r.currentOrderId || r.order || null,
    joined: r.joined || r.joinedAt || (r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ""),
    completed: Number(r.completionRate || r.completed || 0),
    totalOrders: Number(r.totalOrders || 0),
  };
}

export function aggregateByDay(orders, daysBack) {
  const start = Date.now() - daysBack * 24 * 60 * 60 * 1000;
  const out = DAY_KEYS.map(d => ({ d, rev: 0, ord: 0, prevRev: 0, prevOrd: 0 }));
  const prevStart = start - daysBack * 24 * 60 * 60 * 1000;
  orders.forEach(o => {
    if (!o.createdAt) return;
    const ts = new Date(o.createdAt).getTime();
    const delivered = String(o.status).toLowerCase() === "delivered";
    const day = new Date(o.createdAt).getDay();
    if (ts >= start) { out[day].ord += 1; if (delivered) out[day].rev += Number(o.total)||0; }
    else if (ts >= prevStart) { out[day].prevOrd += 1; if (delivered) out[day].prevRev += Number(o.total)||0; }
  });
  return out;
}

export function aggregateByHour(orders) {
  const buckets = HOURS_8_TO_23.map(h => ({ h, ord: 0 }));
  orders.forEach(o => {
    if (!o.createdAt) return;
    const h = new Date(o.createdAt).getHours();
    if (h < 8 || h > 23) return;
    buckets[h - 8].ord += 1;
  });
  return buckets;
}

export function aggregateByCategory(orders, dishes) {
  const counts = {};
  const dishCat = {};
  Object.keys(dishes).forEach(id => { dishCat[id] = dishes[id].category || "Other"; });
  orders.forEach(o => {
    (Array.isArray(o.cart) ? o.cart : (o.items ? Object.values(o.items) : [])).forEach(i => {
      const cat = dishCat[i.id] || dishCat[i.menuItemId] || i.category || "Other";
      counts[cat] = (counts[cat] || 0) + (Number(i.qty) || 1);
    });
  });
  const total = Object.values(counts).reduce((s, v) => s + v, 0) || 1;
  return Object.entries(counts).map(([name, value]) => ({ name, value: Math.round((value / total) * 100) })).sort((a,b) => b.value - a.value);
}

export function aggregateByDish(orders, topN = 8) {
  const counts = {};
  orders.forEach(o => {
    if (!o || !o.createdAt) return;
    const ts = new Date(o.createdAt).getTime();
    (Array.isArray(o.cart) ? o.cart : (o.items ? Object.values(o.items) : [])).forEach(i => {
      const name = i.name || i.menuItemId || "Unknown";
      const qty = Number(i.qty) || 1;
      const revenue = qty * (Number(i.price) || 0);
      if (!counts[name]) counts[name] = { name, qty: 0, revenue: 0 };
      counts[name].qty += qty;
      counts[name].revenue += revenue;
    });
  });
  return Object.values(counts).sort((a, b) => b.qty - a.qty).slice(0, topN);
}

export function aggregateByCustomer(orders, topN = 6) {
  const counts = {};
  orders.forEach(o => {
    if (!o || !o.createdAt) return;
    const uid = o.userId || o.uid || o.phone || "Anonymous";
    if (!counts[uid]) counts[uid] = { uid, name: o.customerName || o.name || "Anonymous", phone: o.phone || "", orders: 0, revenue: 0 };
    counts[uid].orders += 1;
    if (String(o.status).toLowerCase() === "delivered") {
      counts[uid].revenue += Number(o.total) || 0;
    }
  });
  return Object.values(counts).sort((a, b) => b.revenue - a.revenue).slice(0, topN);
}

export function relTime(ts) {
  if (!ts) return "—";
  const d = Date.now() - new Date(ts).getTime();
  const m = Math.floor(d / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString("en-IN");
}

export const fmtDate = (ms) => { if (!ms) return "\u2014"; return new Date(ms).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); };
export const toLocalInput = (ms) => { if (!ms) return ""; const d = new Date(ms); const pad = n => String(n).padStart(2, "0"); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`; };
export const toMs = (str) => str ? new Date(str).getTime() : 0;
export const discTypeStyle = (t) => (DISC_TYPES.find(d => d.value === t) || DISC_TYPES[0]);
