import React, { useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense } from "react";
import {
  LayoutDashboard, ShoppingBag, Zap, ChefHat, Monitor, UtensilsCrossed,
  Tag, Package, Percent, Users, Bike, Handshake, BarChart3, TrendingDown,
  CreditCard, MessageSquare, MapPin, Settings, LogOut,
  Sun, Moon, Search, X, Menu, ChevronRight, ChevronLeft, ChevronDown,
  ShoppingCart, Wallet, Store, Plus, Edit3, Trash2, Printer,
  Minus, Phone, Save, Image, Upload, DollarSign, CheckCircle,
  AlertTriangle, ArrowUp, ArrowDown, Clock, TrendingUp, Globe,
  Activity, Navigation, Truck, Eye, EyeOff, Download, Send, Star, XCircle, Lock, Octagon, Megaphone,
  WifiOff, RefreshCw, Smartphone, History
} from "lucide-react";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { getAuthInstance, db, onAuthStateChanged, signInWithEmailAndPassword, signOut, setOutletContext, get, ref, update, push, set, remove, serverTimestamp, onValue, off, query, orderByChild, equalTo, uploadImage, deleteImage, runTransaction, logAudit, getCurrentAdminActor, createRiderAuthAccount, deleteRiderAuthAccount, resetRiderPassword, EmailAuthProvider, reauthenticateWithCredential, getMessaging, getToken, onMessage as onFcmMessage, isMessagingSupported, isConnected, onConnectionChange, startBotStatusWatcher, Outlet, getBizId, getOutletId } from "./firebase";
import { ORANGE, COLORS, ORD_ST, ORDER_STATUSES, SEQ, LIVE_ST, KITCHEN_ST, PIE_COLORS, HOURS_8_TO_23, DAY_KEYS, TRANSLATIONS, APP_VERSION, NAV_GROUPS, MOBILE_NAV, PAGE_TITLES, DISC_TYPES, DISC_STATUS, DISC_CHANNELS, PAYMENT_PAGE_SIZE, PAGE_GUIDES, STORAGE_KEYS, PARTNERS_REF, statusColors, stockStatus } from "./constants";
import TablesPage from "./TablesPage";
import { fmt, esc, csvValue, downloadCSV, orderItemsCount, orderItemsText, validateGSTIN, validateFSSAI, validateCoords, handleImageError, buildTodayRevenue, buildWeekRevenue, normalizeRider, aggregateByDay, aggregateByHour, aggregateByCategory, aggregateByDish, aggregateByCustomer, relTime, fmtDate, toLocalInput, toMs, discTypeStyle } from "./utils";
import { KPICard, StarRating, Pill, ToggleSwitch, EmptyState, SectionHeader, StatusBadge, GlassCard, BtnPrimary, BtnSecondary, Modal, Toast, Avatar, Skeleton, SkeletonCircle, SkeletonKPI, SkeletonCard, SkeletonText, SkeletonTable, SkeletonGrid, SkeletonPage, Loading, Input, Select, StatCard, SectionLabel, Pagination, ReauthModal, PageGuideModal } from "./components";
import "./App.css";

import DashboardPage from "./pages/DashboardPage";
import OrdersPage from "./pages/OrdersPage";
import CategoriesPage from "./pages/CategoriesPage";
import MenuPage from "./pages/MenuPage";
import POSPage from "./pages/POSPage";
import CustomersPage from "./pages/CustomersPage";
import LiveTrackerPage from "./pages/LiveTrackerPage";
import SettingsPage from "./pages/SettingsPage";
import LiveOpsPage from "./pages/LiveOpsPage";
import KitchenPage from "./pages/KitchenPage";
import InventoryPage from "./pages/InventoryPage";
import RidersPage from "./pages/RidersPage";
import PartnersPage from "./pages/PartnersPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import LostSalesPage from "./pages/LostSalesPage";
import SettlementsPage from "./pages/SettlementsPage";
import FeedbackPage from "./pages/FeedbackPage";
import DiscountsPage from "./pages/DiscountsPage";
import PromotionsPage from "./pages/PromotionsPage";
import RiderAnalyticsPage from "./pages/RiderAnalyticsPage";
import PaymentsPage from "./pages/PaymentsPage";
import ActivityLogPage from "./pages/ActivityLogPage";
import NotificationsPage from "./pages/NotificationsPage";
import StaffPage from "./pages/StaffPage";

const t = (key, fallback) => TRANSLATIONS[key] || fallback || key;

const PAGES = {
  dashboard: DashboardPage, orders: OrdersPage, liveops: LiveOpsPage, kitchen: KitchenPage,
  tables: TablesPage, pos: POSPage, menu: MenuPage, categories: CategoriesPage,
  discounts: DiscountsPage, inventory: InventoryPage, customers: CustomersPage,
  riders: RidersPage, partners: PartnersPage, riderAnalytics: RiderAnalyticsPage,
  analytics: AnalyticsPage, lostsales: LostSalesPage, settlements: SettlementsPage,
  payments: PaymentsPage, activitylog: ActivityLogPage, promotions: PromotionsPage,
  feedback: FeedbackPage, livetracker: LiveTrackerPage, settings: SettingsPage,
  notifications: NotificationsPage, staff: StaffPage,
};
const VALID_PAGE_IDS = new Set(Object.keys(PAGES));

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
  const [reauthOpen, setReauthOpen] = useState(false);
  const [reauthBusy, setReauthBusy] = useState(false);
  const [reauthError, setReauthError] = useState("");
  const reauthResolverRef = useRef(null);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [lowStockDismissed, setLowStockDismissed] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(() => localStorage.getItem("fh_notif_enabled") !== "false");
  const [fcmToken, setFcmToken] = useState(null);
  const [isConnected, setIsConnected] = useState(true);
  const [showVersionBanner, setShowVersionBanner] = useState(false);
  const [badgeCounts, setBadgeCounts] = useState({});
  const [guideOpen, setGuideOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [broadcasts, setBroadcasts] = useState([]);
  const [outlets, setOutlets] = useState({});
  const [outletSwitcherOpen, setOutletSwitcherOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const unacknowledgedRef = useRef(new Set());

  const playAlertSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 800; osc.type = "sine";
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.5);
      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2); gain2.connect(ctx.destination);
        osc2.frequency.value = 1000; osc2.type = "sine";
        gain2.gain.setValueAtTime(0.2, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc2.start(ctx.currentTime); osc2.stop(ctx.currentTime + 0.4);
      }, 200);
    } catch (_) {}
  }, []);

  // Version update banner
  useEffect(() => {
    const stored = localStorage.getItem("foodhubbie_admin_version");
    if (!stored) {
      localStorage.setItem("foodhubbie_admin_version", APP_VERSION);
    } else if (stored !== APP_VERSION) {
      localStorage.setItem("foodhubbie_admin_version", APP_VERSION);
      setShowVersionBanner(true);
    }
  }, []);

  // Firebase connection state — uses centralized watcher from firebase.js
  useEffect(() => {
    if (!user) return;
    setIsConnected(isConnected());
    const unsub = onConnectionChange(setIsConnected);
    return unsub;
  }, [user]);

  // Global Escape key — closes all overlays
  useEffect(() => {
    const handler = (e) => {
      if (e.key !== "Escape") return;
      if (reauthOpen) { setReauthOpen(false); setReauthError(""); reauthResolverRef.current?.resolve?.(false); reauthResolverRef.current = null; }
      setSidebarOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [reauthOpen]);

  // New-order alert — sound + OS notification + toast
  useEffect(() => {
    if (!user || !getBizId() || !getOutletId()) return;
    const r = Outlet("orders");
    if (!r) return;
    let initialLoad = true;
    const unsub = onValue(r, (snap) => {
      const v = snap.val();
      if (!v) return;
      if (initialLoad) { initialLoad = false; Object.keys(v).forEach(k => unacknowledgedRef.current.add(k)); return; }
      const newPlaced = Object.keys(v).filter(k => !unacknowledgedRef.current.has(k) && v[k] && v[k].status && ["Placed","New","Pending"].includes(v[k].status));
      if (newPlaced.length > 0) {
        newPlaced.forEach(k => {
          unacknowledgedRef.current.add(k);
          const order = v[k];
          const name = order.customerName || "Customer";
          const total = order.total || 0;
          const items = order.items ? (Array.isArray(order.items) ? order.items.length : typeof order.items === "object" ? Object.keys(order.items).length : 0) : 0;
          const label = `#${order.id?.slice(-6) || k.slice(-6)}`;
          // OS notification
          if (notifEnabled && Notification.permission === "granted") {
            try { new Notification(`New Order ${label}`, { body: `${name} · ₹${Number(total).toLocaleString()} · ${items} item(s)`, icon: "/favicon.svg" }); } catch (_) {}
          }
          // Toast
          showToastRef.current?.(`${label}: ${name} — ₹${Number(total).toLocaleString()} (${items} items)`, "info");
        });
        playAlertSound();
        setBadgeCounts(prev => ({ ...prev, liveops: (prev.liveops || 0) + newPlaced.length }));
      }
    });
    return () => off(r, "value", unsub);
  }, [user, reloadKey, playAlertSound, notifEnabled]);

  // Clear unacknowledged badge when navigating to orders/liveops
  useEffect(() => {
    if (page === "orders" || page === "liveops") {
      setBadgeCounts(prev => ({ ...prev, liveops: 0 }));
    }
  }, [page]);

  // Listen for broadcasts (notifications)
  useEffect(() => {
    if (!user || !getBizId() || !getOutletId()) return;
    const outletRef = Outlet("broadcasts");
    if (!outletRef) return;
    const unsub = onValue(outletRef, snap => {
      const v = snap.val();
      setBroadcasts(v ? Object.entries(v).map(([id, entry]) => ({ id, ...entry })).sort((a, b) => (b.sentAt || 0) - (a.sentAt || 0)) : []);
    });
    return () => off(outletRef, "value", unsub);
  }, [user, reloadKey]);

  // Fetch available outlets for switcher
  useEffect(() => {
    if (!user || !getBizId()) return;
    const outletsRef = ref(db, `businesses/${getBizId()}/outlets`);
    const unsub = onValue(outletsRef, snap => {
      setOutlets(snap.val() || {});
    });
    return () => off(outletsRef, "value", unsub);
  }, [user, reloadKey]);

  const handleVersionRefresh = useCallback(async () => {
    try {
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.unregister()));
      }
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.filter(k => k.includes("foodhubbie") || k.includes("admin")).map(k => caches.delete(k)));
      }
    } catch (_) { /* best-effort */ }
    window.location.replace(window.location.origin + window.location.pathname + "?v=" + Date.now());
  }, []);

  const handleVersionDismiss = useCallback(() => setShowVersionBanner(false), []);

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

  const unlockWithPassword = useCallback(async (password) => {
    if (!user?.email) return;
    setReauthBusy(true);
    setReauthError("");
    try {
      const auth = await getAuthInstance();
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(auth, credential);
      setReauthOpen(false);
      setReauthError("");
      reauthResolverRef.current?.resolve?.(true);
      reauthResolverRef.current = null;
    } catch (e) {
      const msg = (e?.message || "Re-authentication failed").replace("Firebase: ", "");
      setReauthError(msg);
      reauthResolverRef.current?.resolve?.(false);
      reauthResolverRef.current = null;
    } finally {
      setReauthBusy(false);
    }
  }, [user]);

  const cancelReauth = useCallback(async () => {
    setReauthOpen(false);
    setReauthError("");
    reauthResolverRef.current?.resolve?.(false);
    reauthResolverRef.current = null;
    await handleLogout();
  }, [handleLogout]);

  // Promise-based reauth gate. Pages can call this before destructive ops
  // (delete rider/category/partner, reset password, etc.). Resolves to true
  // if reauth succeeded, false otherwise (signed out or password wrong).
  const requireAdminReauth = useCallback(() => {
    return new Promise((resolve) => {
      if (!user?.email) { resolve(false); return; }
      reauthResolverRef.current = { resolve };
      setReauthError("");
      setReauthOpen(true);
    });
  }, [user]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.__foodhubbieRequireReauth = requireAdminReauth;
    }
    return () => {
      if (typeof window !== "undefined") {
        delete window.__foodhubbieRequireReauth;
      }
    };
  }, [requireAdminReauth]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const snap = await get(ref(db, "admins/" + user.uid));
        if (snap.exists()) {
          const d = snap.val();
          setOutletContext(d.businessId, d.outletId);
          startBotStatusWatcher();
          setOutletInfo({ name: d.outletName || "", address: d.outletAddress || "" });
          setReloadKey(k => k + 1);
        }
      } catch (e) { console.warn("Failed to fetch admin info", e); }
    })();
  }, [user]);

  // FCM init + notification permission + token storage
  useEffect(() => {
    if (!user) return;
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "granted" || notifEnabled) {
      if (Notification.permission !== "granted") {
        Notification.requestPermission().catch(() => {});
      }
    }
    (async () => {
      try {
        const supported = await isMessagingSupported();
        if (!supported) return;
        const messaging = getMessaging();
        const token = await getToken(messaging, { vapidKey: "BFGSVdKCs_7sXhG5NhFPBTSxoBbsckYqgFfOZQ5D9AiBPL0N10CqQOYc1Zv26cMjxpWCgVh8XIKHZP_YIEbr8T8" });
        if (token) {
          setFcmToken(token);
          await update(ref(db, `admins/${user.uid}`), { fcmToken: token });
        }
      } catch (e) {
        if (e.code === "messaging/permission-blocked") {
          setNotifEnabled(false);
          localStorage.setItem("fh_notif_enabled", "false");
        }
      }
    })();
  }, [user, notifEnabled]);

  // Foreground FCM messages — show toast
  useEffect(() => {
    if (!user || !notifEnabled) return;
    let unsub = null;
    (async () => {
      try {
        const supported = await isMessagingSupported();
        if (!supported) return;
        const messaging = getMessaging();
        unsub = onFcmMessage(messaging, (payload) => {
          const title = payload.notification?.title || "FoodHubbie";
          const body = payload.notification?.body || "";
          showToastRef.current?.(`${title}: ${body}`, "info");
          if (Notification.permission === "granted") {
            new Notification(title, { body, icon: "/favicon.svg" });
          }
        });
      } catch (_) {}
    })();
    return () => { if (unsub) unsub(); };
  }, [user, notifEnabled]);

  useEffect(() => {
    if (!user || !getBizId() || !getOutletId()) {
      return;
    }
    const counts = { inv: 0, dish: 0 };
    const mergeCounts = () => {
      const newCount = counts.inv + counts.dish;
      setLowStockCount(prev => {
        if (prev === 0 && newCount > 0 && notifEnabled && Notification.permission === "granted") {
          try { new Notification("Stock Alert", { body: `${newCount} item(s) need attention — stock is low or out.`, icon: "/favicon.svg" }); } catch (_) {}
        }
        return newCount;
      });
    };
    const invRef = ref(db, `businesses/${getBizId()}/outlets/${getOutletId()}/inventory`);
    const dishRef = ref(db, `businesses/${getBizId()}/outlets/${getOutletId()}/dishes`);
    const invUnsub = onValue(invRef, (snap) => {
      const v = snap.val() || {};
      counts.inv = Object.keys(v).filter(k => {
        const it = v[k];
        const stock = Number(it && it.stock) || 0;
        const threshold = Number(it && it.threshold) || 0;
        return threshold > 0 && stock <= threshold;
      }).length;
      mergeCounts();
    }, () => {});
    const dishUnsub = onValue(dishRef, (snap) => {
      const v = snap.val() || {};
      counts.dish = Object.keys(v).filter(k => {
        const d = v[k];
        if (!d) return false;
        if (typeof d.stock === 'boolean') return d.stock === false;
        if (d.stock === undefined || d.stock === null) return false;
        return (Number(d.stock) || 0) <= 0;
      }).length;
      mergeCounts();
    }, () => {});
    return () => { off(invRef, "value", invUnsub); off(dishRef, "value", dishUnsub); };
  }, [user, reloadKey, notifEnabled]);

  useEffect(() => {
    if (lowStockCount > 0) setLowStockDismissed(false);
  }, [lowStockCount]);

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3500);
  }, []);
  const showToastRef = useRef(showToast);
  useEffect(() => { showToastRef.current = showToast; }, [showToast]);

  if (authLoading) {
    return (
      <div style={{ minHeight:"100vh", display:"grid", placeItems:"center", background:"radial-gradient(at 0% 0%, rgba(232, 73, 8,0.05) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(59,130,246,0.05) 0px, transparent 50%), #f8fafc", color:"#1e293b" }}>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:16 }}>
          <div style={{ width:52, height:52, borderRadius:16, background:`linear-gradient(135deg,${ORANGE},#D94400)`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 12px 28px rgba(232, 73, 8,0.25)" }}>
            <Store size={24} color="white" />
          </div>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:18, fontWeight:800, color:"#0f172a", fontFamily:"'Outfit', sans-serif" }}>FoodHubbie Admin</div>
            <div style={{ fontSize:13, color:"#64748b", marginTop:4 }}>Preparing your workspace...</div>
          </div>
          <div aria-label="Loading dashboard" role="status" style={{ width:36, height:36, border:"3px solid rgba(232, 73, 8,0.15)", borderTopColor:ORANGE, borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", padding: 24, gap: 40,
        background: "linear-gradient(135deg, #E84908 0%, #D94400 50%, #C43800 100%)",
        position: "relative", overflow: "hidden"
      }}>
        {/* Corner-stitch decorative elements */}
        <div style={{ position:"absolute", top:-12, left:-12, width:48, height:48, border:"3px solid rgba(255,255,255,0.15)", borderRadius:4, transform:"rotate(45deg)", opacity:0.5 }} />
        <div style={{ position:"absolute", top:-12, right:-12, width:48, height:48, border:"3px solid rgba(255,255,255,0.15)", borderRadius:4, transform:"rotate(-45deg)", opacity:0.5 }} />
        <div style={{ position:"absolute", bottom:-12, left:-12, width:48, height:48, border:"3px solid rgba(255,255,255,0.15)", borderRadius:4, transform:"rotate(-45deg)", opacity:0.5 }} />
        <div style={{ position:"absolute", bottom:-12, right:-12, width:48, height:48, border:"3px solid rgba(255,255,255,0.15)", borderRadius:4, transform:"rotate(45deg)", opacity:0.5 }} />
        {/* Top-right accent */}
        <div style={{ position:"absolute", top:-60, right:-60, width:160, height:160, borderRadius:"50%", background:"rgba(255,255,255,0.04)", pointerEvents:"none" }} />
        <div style={{ position:"absolute", bottom:-80, left:-80, width:200, height:200, borderRadius:"50%", background:"rgba(255,255,255,0.03)", pointerEvents:"none" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 14, position:"relative", zIndex:1 }}>
          <div style={{ width: 60, height: 60, borderRadius: 18, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)" }}>
            <Store size={34} color="white" />
          </div>
          <div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "white", letterSpacing: -0.5, fontFamily: "'Outfit', sans-serif" }}>FoodHubbie</div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>Admin Dashboard</div>
          </div>
        </div>
        <div className="glass-premium" style={{ width: "100%", maxWidth: 400, padding: 32, position:"relative", zIndex:1 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "#1e293b", fontFamily: "'Outfit', sans-serif" }}>Welcome Back</h2>
            <div className="animate-pulse-live" style={{ width:8, height:8, borderRadius:"50%", background:"#22c55e" }} />
          </div>
          <p style={{ fontSize: 14, color: "#64748b", marginBottom: 24 }}>Sign in to manage your outlet</p>
          {loginError && <div role="alert" style={{ padding: "10px 14px", borderRadius: 10, marginBottom: 16, background: "#fef2f2", color: "#ef4444", fontSize: 13, fontWeight: 500 }}>{loginError}</div>}
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <input aria-label="Email address" autoComplete="email" inputMode="email" placeholder="Email address" value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
              style={{ padding: "14px 16px", borderRadius: 12, border: "1.5px solid #e2e8f0", fontSize: 14, color: "#1e293b", background: "#fff", outline:"none", transition:"border-color 0.2s, box-shadow 0.2s" }}
              onFocus={e => { e.target.style.borderColor = ORANGE; e.target.style.boxShadow = "0 0 0 3px rgba(232, 73, 8,0.15)"; e.target.style.borderStyle = "dashed"; }}
              onBlur={e => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; e.target.style.borderStyle = "solid"; }} />
            <input aria-label="Password" autoComplete="current-password" type="password" placeholder="Password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)}
              style={{ padding: "14px 16px", borderRadius: 12, border: "1.5px solid #e2e8f0", fontSize: 14, color: "#1e293b", background: "#fff", outline:"none", transition:"border-color 0.2s, box-shadow 0.2s" }}
              onFocus={e => { e.target.style.borderColor = ORANGE; e.target.style.boxShadow = "0 0 0 3px rgba(232, 73, 8,0.15)"; e.target.style.borderStyle = "dashed"; }}
              onBlur={e => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; e.target.style.borderStyle = "solid"; }} />
            <BtnPrimary type="submit" disabled={loginLoading} style={{ width: "100%", padding: "14px 0", fontSize: 15, borderRadius: 12, position:"relative" }}>
              {loginLoading ? <span style={{ display:"inline-flex", alignItems:"center", gap:4 }}>Signing In<span className="loading-dots" /></span> : "Sign In"}
            </BtnPrimary>
          </form>
        </div>
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
        ::-webkit-scrollbar-thumb { background: #E8490830; border-radius: 99px; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 39, background: "rgba(0,0,0,0.4)" }} />}
      <ReauthModal
        open={reauthOpen}
        busy={reauthBusy}
        error={reauthError}
        onConfirm={unlockWithPassword}
        onCancel={cancelReauth}
      />
      <PageGuideModal open={guideOpen} page={page} onClose={()=>setGuideOpen(false)} />
      {!isConnected && (
        <div role="alert" style={{ position:"fixed", top:0, left:0, right:0, zIndex:99999, background:"#dc2626", color:"white", padding:"10px 16px", display:"flex", alignItems:"center", justifyContent:"center", gap:8, fontSize:13, fontWeight:500, animation:"slideDown 0.3s ease-out" }}>
          <WifiOff size={16} /> No internet connection — changes may not save
          <button type="button" onClick={() => window.location.reload()} style={{ marginLeft:12, padding:"4px 14px", borderRadius:6, background:"rgba(255,255,255,0.2)", color:"white", border:"1px solid rgba(255,255,255,0.4)", cursor:"pointer", fontSize:12, fontWeight:600 }}>Retry</button>
        </div>
      )}
      {showVersionBanner && (
        <div role="alert" style={{ position:"fixed", top:isConnected?0:44, left:0, right:0, zIndex:99998, background:"linear-gradient(135deg,#f59e0b,#d97706)", color:"white", padding:"10px 16px", display:"flex", alignItems:"center", justifyContent:"center", gap:10, fontSize:13, fontWeight:500, animation:"slideDown 0.3s ease-out", flexWrap:"wrap" }}>
          <AlertTriangle size={16} /> A new version is available — click Refresh to update.
          <button type="button" onClick={handleVersionRefresh} style={{ padding:"4px 12px", borderRadius:8, border:"1px solid rgba(255,255,255,0.4)", background:"rgba(255,255,255,0.15)", color:"white", fontSize:12, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:4 }}><RefreshCw size={13} /> Refresh</button>
          <button type="button" onClick={handleVersionDismiss} aria-label="Dismiss" style={{ padding:"2px 8px", borderRadius:6, border:"none", background:"transparent", color:"rgba(255,255,255,0.7)", cursor:"pointer", fontSize:16, lineHeight:1 }}>×</button>
        </div>
      )}
      <aside style={{ position:"fixed", top:0, left:0, bottom:0, zIndex:40, width:collapsed?56:224, background:sideBg, borderRight:dark?"1px solid #334155":"1px solid rgba(0,0,0,0.06)", display:"flex", flexDirection:"column", transition:"width 0.3s, transform 0.3s, background 0.3s", overflow:"hidden", transform:sidebarOpen?"translateX(0)":"" }} className="sidebar">
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:collapsed?"16px 0":"16px 18px", borderBottom:dark?"1px solid #334155":"1px solid rgba(0,0,0,0.06)", justifyContent:collapsed?"center":"flex-start", flexShrink:0 }}>
          <div style={{ width:32, height:32, borderRadius:10, background:`linear-gradient(135deg,${ORANGE},#D94400)`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><Store size={16} color="white" /></div>
          {!collapsed && <div><div style={{ fontSize:18, fontWeight:900, letterSpacing:-0.5, background:`linear-gradient(135deg,${ORANGE},#d95a1a)`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", lineHeight:1.2 }}>FoodHubbie</div><div style={{ fontSize:10, fontWeight:700, color:"#94a3b8", letterSpacing:0.5, textTransform:"uppercase", marginTop:2 }}>Admin Panel</div></div>}
        </div>
        <button type="button" onClick={()=>setCollapsed(!collapsed)} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:"8px 0", cursor:"pointer", color:"#94a3b8", borderBottom:dark?"1px solid #334155":"1px solid rgba(0,0,0,0.06)", background:"transparent", borderTop:0, borderLeft:0, borderRight:0, flexShrink:0 }} className="collapse-toggle shell-button">{collapsed?<ChevronRight size={16}/>:<ChevronLeft size={16}/>}</button>
        {outletInfo&&!collapsed&&<div style={{ position:"relative", margin:"8px 12px", padding:"10px 12px", borderRadius:10, background:dark?"#0f172a":"#fff7ed", border:dark?"1px solid #334155":"1px solid rgba(232, 73, 8,0.15)", cursor:"pointer" }} onClick={() => setOutletSwitcherOpen(!outletSwitcherOpen)}>
          <div style={{ fontSize:11, color:"#94a3b8", fontWeight:600, textTransform:"uppercase", letterSpacing:0.5, marginBottom:2 }}>OUTLET <ChevronDown size={10} style={{ marginLeft:4 }} /></div>
          <div style={{ fontSize:13, fontWeight:600, color:ORANGE }}>{outletInfo.name}</div>
          {outletInfo.address&&<div style={{ fontSize:11, color:"#94a3b8", marginTop:2, display:"flex", alignItems:"center", gap:4 }}><MapPin size={10}/> {outletInfo.address}</div>}
          {outletSwitcherOpen && (
            <div style={{ position:"absolute", left:0, right:0, top:"100%", marginTop:4, zIndex:50, background:"white", borderRadius:10, boxShadow:"0 12px 40px rgba(0,0,0,0.15)", border:"1px solid #e2e8f0", maxHeight:200, overflow:"auto" }}>
              {Object.keys(outlets).filter(k => k !== getOutletId()).map(k => (
                <div key={k} onClick={async (e) => { e.stopPropagation(); setOutletSwitcherOpen(false); const snap = await get(ref(db, `businesses/${getBizId()}/outlets/${k}`)); const d = snap.val(); if (d) { setOutletContext(getBizId(), k); startBotStatusWatcher(); setOutletInfo({ name: d.name || k, address: d.address || "" }); setReloadKey(r => r + 1); showToast(`Switched to ${d.name || k}`,"success"); } }}
                  style={{ padding:"8px 12px", fontSize:12, fontWeight:500, color:"#475569", cursor:"pointer", borderBottom:"1px solid #f1f5f9" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  {outlets[k]?.name || k}
                </div>
              ))}
              {Object.keys(outlets).filter(k => k !== getOutletId()).length === 0 && <div style={{ padding:"8px 12px", fontSize:12, color:"#94a3b8" }}>No other outlets</div>}
            </div>
          )}
        </div>}
        {outletInfo&&collapsed&&<div style={{ display:"flex", justifyContent:"center", padding:"8px 0" }}><Avatar name={outletInfo.name} size={28}/></div>}
        <nav style={{ flex:1, overflow:"auto", padding:collapsed?"4px 0":"6px 10px" }}>
          {NAV_GROUPS.map(group => (
            <div key={group.label} style={{ marginBottom:collapsed?2:4 }}>
              {!collapsed&&<div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:1.2, color:"#94a3b8", padding:"10px 14px 4px", pointerEvents:"none" }}>{group.label}</div>}
              {group.items.map((item, idx) => {
                const Icon = item.icon; const active = page === item.id;
                return <div key={item.id} style={{ position:"relative" }}>
                  {active && !collapsed && <div style={{ position:"absolute", left:0, top:8, bottom:8, width:4, background:ORANGE, borderRadius:"0 4px 4px 0", boxShadow:"0 0 8px rgba(232, 73, 8,0.25)", zIndex:1 }} />}
                  <button type="button" onClick={()=>{setPage(item.id);setSidebarOpen(false);}} aria-current={active ? "page" : undefined} style={{ display:"flex", alignItems:"center", gap:10, padding:collapsed?"10px 0":"9px 14px", margin:collapsed?"2px 0":"1px 0", borderRadius:10, cursor:"pointer", justifyContent:collapsed?"center":"flex-start", background:active?(dark?"rgba(232, 73, 8,0.15)":"rgba(232, 73, 8,0.08)"):"transparent", color:active?ORANGE:(dark?"#cbd5e1":"#475569"), transition:"all 0.15s", border:0, width:"100%", textAlign:"left", fontWeight:active?600:500, fontSize:13 }} title={collapsed?item.label:undefined} className="shell-button"
                    onMouseEnter={e => { if(!active) { e.currentTarget.style.background = "rgba(0,0,0,0.05)"; e.currentTarget.style.transform = "translateX(3px)"; }}}
                    onMouseLeave={e => { if(!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.transform = "none"; }}}>
                    <Icon size={collapsed?20:18} style={{ flexShrink:0, color:active?ORANGE:(dark?"#94a3b8":"#64748b"), transition:"color 0.15s" }} />
                    {!collapsed&&<><span style={{ fontSize:13, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{item.label}</span>{(badgeCounts[item.id] != null ? badgeCounts[item.id] : item.badge) != null && <span style={{ marginLeft:"auto", fontSize:10, fontWeight:700, padding:"1px 7px", borderRadius:99, background:active?"rgba(232, 73, 8,0.2)":ORANGE, color:active?ORANGE:"white" }}>{badgeCounts[item.id] != null ? badgeCounts[item.id] : item.badge}</span>}</>}
                  </button>
                </div>;
              })}
            </div>
          ))}
        </nav>
        <div style={{ borderTop:dark?"1px solid #334155":"1px solid rgba(0,0,0,0.06)", padding:collapsed?"8px 0":"10px 14px", display:"flex", flexDirection:"column", gap:2 }}>
          <button type="button" onClick={()=>setDark(!dark)} style={{ display:"flex", alignItems:"center", gap:10, padding:collapsed?"10px 0":"8px 12px", borderRadius:10, cursor:"pointer", justifyContent:collapsed?"center":"flex-start", color:dark?"#cbd5e1":"#475569", background:"transparent", border:0, width:"100%", fontSize:13 }} title={collapsed?"Toggle theme":undefined} aria-label="Toggle theme" className="shell-button"
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,0,0,0.04)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
            {dark?<Sun size={18}/>:<Moon size={18}/>}
            {!collapsed&&<span style={{ fontWeight:500 }}>{dark?"Light Mode":"Dark Mode"}</span>}
          </button>
          <button type="button" onClick={handleLogout} style={{ display:"flex", alignItems:"center", gap:10, padding:collapsed?"10px 0":"8px 12px", borderRadius:10, cursor:"pointer", justifyContent:collapsed?"center":"flex-start", color:"#ef4444", background:"transparent", border:0, width:"100%", fontSize:13 }} title={collapsed?"Logout":undefined} className="shell-button"
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.08)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
            <LogOut size={18}/>
            {!collapsed&&<span style={{ fontWeight:500 }}>Logout</span>}
          </button>
        </div>
      </aside>
      <div style={{ flex:1, display:"flex", flexDirection:"column", marginLeft:collapsed?56:224, transition:"margin-left 0.3s", minHeight:"100vh" }} className="main-wrapper">
        <header style={{ position:"sticky", top:0, zIndex:30, display:"flex", alignItems:"center", gap:12, padding:"14px 24px", background:dark?"#0f172a":"white", borderBottom:dark?"1px solid #1e293b":"1px solid rgba(0,0,0,0.06)" }}>
          <button type="button" className="hamburger-mobile shell-button" onClick={()=>setSidebarOpen(true)} aria-label="Open navigation" style={{ cursor:"pointer", color:dark?"#f1f5f9":"#475569", background:"transparent", border:0, padding:6, borderRadius:8 }}><Menu size={22}/></button>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:20, fontWeight:700, color:dark?"#f1f5f9":"#0f172a", fontFamily:"'Outfit', sans-serif" }}>{PAGE_TITLES[page]||"Dashboard"}</div>
            {outletInfo&&<div style={{ fontSize:12, color:"#94a3b8", display:"flex", alignItems:"center", gap:4, marginTop:2 }}><Store size={12}/> {outletInfo.name}</div>}
          </div>
          <button type="button" onClick={()=>setGuideOpen(true)} title="Page guide" className="shell-button" style={{ cursor:"pointer", color:dark?"#94a3b8":"#64748b", background:"transparent", border:0, padding:"2px 6px", borderRadius:8, fontSize:16, fontWeight:700, lineHeight:1 }}>?</button>
           {notifOpen && <div onClick={() => setNotifOpen(false)} style={{ position:"fixed", inset:0, zIndex:49 }} />}
          <button type="button" aria-label="Open notifications" className="shell-button" style={{ position:"relative", cursor:"pointer", color:dark?"#94a3b8":"#64748b", background:"transparent", border:0, padding:6, borderRadius:8, zIndex:notifOpen?51:"auto" }} onClick={() => setNotifOpen(!notifOpen)}><Megaphone size={20}/><div style={{ position:"absolute", top:4, right:4, width:8, height:8, borderRadius:"50%", background:"#ef4444" }}/></button>
           {notifOpen && (
             <div style={{ position:"absolute", right:0, top:"100%", marginTop:8, zIndex:50, width:340, maxHeight:320, background:"white", borderRadius:12, boxShadow:"0 12px 40px rgba(0,0,0,0.15)", border:"1px solid #e2e8f0", overflow:"hidden" }}>
               <div style={{ padding:"12px 16px", borderBottom:"1px solid #f1f5f9", fontSize:13, fontWeight:600, color:"#475569", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                 Notifications {broadcasts.length > 0 && <span style={{ padding:"2px 8px", borderRadius:10, background:"#fef3c7", color:"#b45309", fontSize:11, fontWeight:600 }}>{broadcasts.length}</span>}
                 <button type="button" onClick={() => setNotifOpen(false)} style={{ background:"transparent", border:"none", cursor:"pointer", color:"#94a3b8", fontSize:16, lineHeight:1 }}>×</button>
               </div>
               <div style={{ maxHeight:260, overflow:"auto" }}>
                 {broadcasts.length === 0 ? <div style={{ padding:40, textAlign:"center", color:"#94a3b8", fontSize:12 }}>No notifications</div> : broadcasts.slice(0,10).map(b => (
                   <div key={b.id} style={{ padding:"12px 16px", borderBottom:"1px solid #f9fafb", fontSize:12, cursor:"pointer", background: b.audience === "vip" ? "#fff7ed" : "transparent", borderLeft:b.audience === "vip"?"4px solid #f97316":"none" }} onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"} onMouseLeave={e => e.currentTarget.style.background = b.audience === "vip" ? "#fff7ed" : "transparent"}>
                     <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:4 }}>
                       <div style={{ fontWeight:600, color:"#0f172a" }}>{b.title || "Notification"}</div>
                       <div style={{ fontSize:10, color:"#94a3b8" }}>{new Date(b.sentAt || b.createdAt || Date.now()).toLocaleString("en-IN", {hour12:false})}</div>
                     </div>
                     <div style={{ color:"#64748b", lineHeight:1.4 }}>{b.body}</div>
                   </div>
                 ))}
               </div>
               <div style={{ padding:"12px 16px", borderTop:"1px solid #f1f5f9", textAlign:"center", fontSize:11, color:"#64748b", cursor:"pointer" }} onClick={() => { setNotifOpen(false); setPage("notifications"); }}>View all notifications →</div>
             </div>
           )}
          <div title={isConnected ? "Connected" : "Disconnected"} style={{ width:10, height:10, borderRadius:"50%", background:isConnected?"#22c55e":"#ef4444", boxShadow:isConnected?"0 0 8px rgba(34,197,94,0.5)":"0 0 8px rgba(239,68,68,0.5)", transition:"background 0.3s", animation:isConnected?"none":"pulse 2s infinite" }}/>
          {outletInfo&&<Avatar name={outletInfo.name} size={32}/>}
        </header>
        <main style={{ flex:1, padding:"24px 24px 88px", overflow:"auto" }}>
          {lowStockCount > 0 && !lowStockDismissed && (
            <div role="status" className="glass-card" style={{
              display:"flex", alignItems:"center", gap:12,
              padding:"10px 16px", marginBottom:16,
              background:"#fef3c7", border:"1px solid #fcd34d", color:"#92400e"
            }}>
              <AlertTriangle size={18} color="#b45309" />
              <div style={{ flex:1, fontSize:13, fontWeight:500 }}>
                <strong>{lowStockCount} item{lowStockCount === 1 ? "" : "s"}</strong>{" "}
                need attention — stock is low or out.
              </div>
              <button type="button" onClick={() => setPage("inventory")} className="shell-button" style={{ padding:"4px 12px", borderRadius:8, border:"1.5px solid #b45309", background:"transparent", color:"#b45309", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                View Inventory
              </button>
              <button type="button" onClick={() => setLowStockDismissed(true)} aria-label="Dismiss" className="shell-button" style={{ padding:4, borderRadius:6, border:0, background:"transparent", color:"#b45309", cursor:"pointer" }}>
                <X size={14} />
              </button>
            </div>
          )}
          <div className="page-content">{PageComponent && <PageComponent key={reloadKey} showToast={showToast} outletInfo={outletInfo} notifEnabled={notifEnabled} setNotifEnabled={setNotifEnabled} fcmToken={fcmToken} requireAdminReauth={requireAdminReauth} setPage={setPage} setSelOrder={setSelOrder} />}</div>
        </main>
      </div>
      <div className="mobile-bottom-nav" style={{ position:"fixed", bottom:0, left:0, right:0, zIndex:30, display:"flex", alignItems:"center", justifyContent:"space-around", padding:"6px 0 env(safe-area-inset-bottom,6px)", background:dark?"#1e293b":"rgba(255,255,255,0.9)", backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)", borderTop:dark?"1px solid #334155":"1px solid rgba(0,0,0,0.06)" }}>
        {MOBILE_NAV.map(item => {
          const Icon = item.icon; const active = page === item.id;
          return <button type="button" key={item.id} onClick={()=>setPage(item.id)} aria-current={active ? "page" : undefined} className="shell-button" style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2, padding:"4px 8px", cursor:"pointer", position:"relative", color:active?ORANGE:(dark?"#64748b":"#94a3b8"), background:"transparent", border:0, minWidth:54, transition:"color 0.15s" }}>
            <Icon size={20}/><span style={{ fontSize:10, fontWeight:active?600:500 }}>{item.label}</span>
            {active&&<div style={{ position:"absolute", top:-6, width:16, height:3, borderRadius:"0 0 3px 3px", background:ORANGE }}/>}
          </button>;
        })}
      </div>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)} />}
    </div>
  );
}

export default App;
