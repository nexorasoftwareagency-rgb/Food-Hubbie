import { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard, ShoppingBag, Zap, ChefHat, Monitor,
  UtensilsCrossed, Tag, Package, Users, Bike, Handshake,
  BarChart3, TrendingDown, CreditCard, Bell, MessageSquare,
  MapPin, Settings as SettingsIcon, LogOut, Sun, Moon,
  Menu as MenuIcon, ChevronRight, ChevronLeft, Store, Wallet, X
} from "lucide-react";

import Dashboard from "./sections/Dashboard";
import Orders from "./sections/Orders";
import LiveOps from "./sections/LiveOps";
import Kitchen from "./sections/Kitchen";
import Inventory from "./sections/Inventory";
import Customers from "./sections/Customers";
import Riders from "./sections/Riders";
import Partners from "./sections/Partners";
import Analytics from "./sections/Analytics";
import LostSales from "./sections/LostSales";
import Settlements from "./sections/Settlements";
import Notifications from "./sections/Notifications";
import Feedback from "./sections/Feedback";
import LiveTracker from "./sections/LiveTracker";
import Pos from "./sections/Pos";
import MenuPage from "./sections/Menu";
import Categories from "./sections/Categories";
import SettingsPage from "./sections/Settings";

import GlassCard from "./components/GlassCard";
import Avatar from "./components/Avatar";
import BtnPrimary from "./components/BtnPrimary";
import ToastComponent from "./components/Toast";

import { ORANGE, COLORS } from "./utils/constants";
import { auth, db, onAuthStateChanged, signInWithEmailAndPassword, signOut, setOutletContext, get, ref } from "./firebase";
import { fmt } from "./utils/formatters";
import "./App.css";

const NAV_GROUPS = [
  { label: "Operations", items: [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "orders", label: "Orders", icon: ShoppingBag, badge: 3 },
    { id: "liveops", label: "Live Ops", icon: Zap, badge: "LIVE" },
    { id: "kitchen", label: "Kitchen", icon: ChefHat },
    { id: "pos", label: "POS / Walk-in", icon: Monitor },
  ]},
  { label: "Catalog", items: [
    { id: "menu", label: "Menu", icon: UtensilsCrossed },
    { id: "categories", label: "Categories", icon: Tag },
    { id: "inventory", label: "Inventory", icon: Package },
  ]},
  { label: "People", items: [
    { id: "customers", label: "Customers", icon: Users },
    { id: "riders", label: "Riders", icon: Bike },
    { id: "partners", label: "Partners", icon: Handshake },
  ]},
  { label: "Insights", items: [
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "lostsales", label: "Lost Sales", icon: TrendingDown },
    { id: "settlements", label: "Settlements", icon: CreditCard },
  ]},
  { label: "Engagement", items: [
    { id: "notifications", label: "Push Notifs", icon: Bell },
    { id: "feedback", label: "Feedback", icon: MessageSquare },
    { id: "livetracker", label: "Live Tracker", icon: MapPin },
  ]},
  { label: "System", items: [
    { id: "settings", label: "Settings", icon: SettingsIcon },
  ]},
];

const PAGE_TITLES = {
  dashboard: "Dashboard",
  orders: "Orders",
  liveops: "Live Ops",
  kitchen: "Kitchen",
  pos: "POS / Walk-in",
  menu: "Menu",
  categories: "Categories",
  inventory: "Inventory",
  customers: "Customers",
  riders: "Riders",
  partners: "Partners",
  analytics: "Analytics",
  lostsales: "Lost Sales",
  settlements: "Settlements",
  notifications: "Push Notifications",
  feedback: "Feedback",
  livetracker: "Live Tracker",
  settings: "Settings",
};

const APP_PAGES = {
  dashboard: Dashboard,
  orders: Orders,
  liveops: LiveOps,
  kitchen: Kitchen,
  pos: Pos,
  menu: MenuPage,
  categories: Categories,
  inventory: Inventory,
  customers: Customers,
  riders: Riders,
  partners: Partners,
  analytics: Analytics,
  lostsales: LostSales,
  settlements: Settlements,
  notifications: Notifications,
  feedback: Feedback,
  livetracker: LiveTracker,
  settings: SettingsPage,
};

const MOBILE_NAV = [
  { id: "dashboard", icon: LayoutDashboard, label: "Home" },
  { id: "orders", icon: ShoppingBag, label: "Orders" },
  { id: "kitchen", icon: ChefHat, label: "Kitchen" },
  { id: "menu", icon: UtensilsCrossed, label: "Menu" },
  { id: "settings", icon: SettingsIcon, label: "More" },
];

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

  const PageComponent = APP_PAGES[page];

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

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      background: dark ? "#0f172a" : "#f8f9fc",
      color: dark ? "#f1f5f9" : "#1e293b",
      transition: "background 0.3s, color 0.3s",
    }}>
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
        background: dark ? "#1e293b" : "white",
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

        {/* Collapse toggle - desktop only */}
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
            <MenuIcon size={22} />
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
        <ToastComponent
          msg={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default App;
