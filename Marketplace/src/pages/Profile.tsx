import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  User,
  MapPin,
  CreditCard,
  ChevronRight,
  LogOut,
  Star,
  Edit3,
  Phone,
  Mail,
  HelpCircle,
  FileText,
  Heart,
  Settings,
  Bell,
  Lock,
  ArrowLeft,
  Plus,
  Home,
  Briefcase,
  Smartphone,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useOrderContext } from "@/context/OrderContext";
import { motion, AnimatePresence } from "framer-motion";

type SubView = "main" | "addresses" | "settings" | "payments";

export default function Profile() {
  const { user, signOut, authState, updateUser } = useAuth();
  const [, setLocation] = useLocation();
  const { orders = [] } = useOrderContext();
  const [activeView, setActiveView] = useState<SubView>("main");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({ label: "Home" as "Home" | "Work" | "Other", address: "", landmark: "" });

  // Redirect if not logged in
  useEffect(() => {
    if (authState === "unauthenticated") {
      setLocation("/login");
    }
  }, [authState, setLocation]);

  if (authState === "unauthenticated") return null;

  if (authState === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-muted-foreground font-medium animate-pulse">Syncing profile...</p>
      </div>
    );
  }

  const handleSaveName = async () => {
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      await updateUser({ name: name.trim() });
      setIsEditingProfile(false);
    } catch (err) {
      console.error("Update failed:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAddress = async () => {
    if (!newAddress.address.trim()) return;
    const updatedAddresses = [...(user?.savedAddresses || []), {
      id: `addr_${Date.now()}`,
      label: newAddress.label,
      address: newAddress.address,
      landmark: newAddress.landmark,
      coords: { lat: 0, lng: 0 },
      isDefault: user?.savedAddresses.length === 0,
    }];
    try {
      await updateUser({ savedAddresses: updatedAddresses } as any);
      setShowAddAddress(false);
      setNewAddress({ label: "Home", address: "", landmark: "" });
    } catch (err) {
      console.error("Save address failed:", err);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    const updatedAddresses = user?.savedAddresses.filter(a => a.id !== id) || [];
    try {
      await updateUser({ savedAddresses: updatedAddresses } as any);
    } catch (err) {
      console.error("Delete address failed:", err);
    }
  };

  const menuSections = [
    {
      title: "Account & Security",
      items: [
        {
          id: "addresses",
          icon: MapPin,
          title: "Manage Addresses",
          desc: `${user?.savedAddresses?.length ?? 0} saved locations`,
          color: "bg-blue-500/10 text-blue-500",
        },
        {
          id: "payments",
          icon: CreditCard,
          title: "Payments & Wallets",
          desc: "UPI, Cards & Wallets",
          color: "bg-emerald-500/10 text-emerald-500",
        },
        {
          id: "loyalty",
          icon: Star,
          title: "Loyalty Program",
          desc: `${user?.loyaltyPoints?.toLocaleString() ?? 0} points available`,
          color: "bg-amber-500/10 text-amber-500",
        },
      ],
    },
    {
      title: "Preferences",
      items: [
        {
          id: "favorites",
          icon: Heart,
          title: "Your Favorites",
          desc: "View saved items & outlets",
          color: "bg-rose-500/10 text-rose-500",
        },
        {
          id: "settings",
          icon: Settings,
          title: "Account Settings",
          desc: "Notifications & Privacy",
          color: "bg-slate-500/10 text-slate-500",
        },
      ],
    },
    {
      title: "Support",
      items: [
        {
          id: "help",
          icon: HelpCircle,
          title: "Help & Support",
          desc: "FAQs & Chat Support",
          color: "bg-indigo-500/10 text-indigo-500",
        },
        {
          id: "legal",
          icon: FileText,
          title: "Legal & Privacy",
          desc: "Terms, Privacy & Licenses",
          color: "bg-zinc-500/10 text-zinc-500",
        },
      ],
    },
  ];

  const renderAddresses = () => (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => setActiveView("main")} className="p-2 bg-muted rounded-full hover:bg-muted/80 transition-colors" title="Back to Profile">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="text-xl font-black font-heading">Saved Addresses</h2>
      </div>

      {showAddAddress ? (
        <div className="bg-card border border-border rounded-3xl p-5 space-y-4">
          <h3 className="font-bold text-foreground">Add New Address</h3>
          <div className="flex gap-2">
            {(["Home", "Work", "Other"] as const).map(label => (
              <button
                key={label}
                onClick={() => setNewAddress(prev => ({ ...prev, label }))}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${newAddress.label === label ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <textarea
            value={newAddress.address}
            onChange={(e) => setNewAddress(prev => ({ ...prev, address: e.target.value }))}
            placeholder="Enter full address..."
            className="w-full bg-muted/30 border border-border/50 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[80px]"
          />
          <input
            value={newAddress.landmark}
            onChange={(e) => setNewAddress(prev => ({ ...prev, landmark: e.target.value }))}
            placeholder="Landmark (optional)"
            className="w-full bg-muted/30 border border-border/50 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <div className="flex gap-2">
            <button onClick={() => { setShowAddAddress(false); setNewAddress({ label: "Home", address: "", landmark: "" }); }} className="flex-1 py-3 border border-border rounded-xl font-semibold text-foreground hover:bg-muted transition-colors">
              Cancel
            </button>
            <button onClick={handleSaveAddress} className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors">
              Save
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {(Array.isArray(user?.savedAddresses) && user.savedAddresses.length > 0) ? (
            user.savedAddresses.map((addr, i) => (
              <div key={addr.id || i} className="bg-card border border-border rounded-3xl p-5 flex gap-4 hover:shadow-md transition-all group">
                <div className={`p-3 rounded-2xl text-primary bg-primary/10 h-fit`}>
                  <MapPin className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-foreground">{addr.label}</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{addr?.address ?? '—'}</p>
                  {addr.landmark && <p className="text-[10px] text-muted-foreground/60 mt-0.5">Near: {addr.landmark}</p>}
                </div>
                <button onClick={() => handleDeleteAddress(addr.id)} className="p-2 text-muted-foreground/30 hover:text-destructive transition-colors" title="Delete">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          ) : (
            <div className="bg-muted/30 rounded-[2rem] p-10 text-center border-2 border-dashed border-border">
              <MapPin className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-bold text-muted-foreground">No saved addresses yet</p>
            </div>
          )}
        </div>
      )}
      
      {!showAddAddress && (
        <button onClick={() => setShowAddAddress(true)} className="w-full py-5 border-2 border-dashed border-border rounded-3xl text-muted-foreground font-bold text-sm flex items-center justify-center gap-2 hover:border-primary/30 hover:text-primary hover:bg-primary/5 transition-all">
          <Plus className="h-5 w-5" />
          Add New Address
        </button>
      )}
    </motion.div>
  );

  const renderSettings = () => (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => setActiveView("main")} className="p-2 bg-muted rounded-full hover:bg-muted/80 transition-colors" title="Back to Profile">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="text-xl font-black font-heading">Account Settings</h2>
      </div>

      <div className="bg-card rounded-[2rem] border border-border overflow-hidden divide-y divide-border">
        {[
          { icon: Bell, title: "Notifications", desc: "Order updates & offers", toggle: true },
          { icon: Smartphone, title: "SMS Alerts", desc: "Critical delivery status", toggle: true },
          { icon: Lock, title: "Privacy", desc: "Manage your data & visibility", toggle: false },
          { icon: Smartphone, title: "App Appearance", desc: "Dark mode & accents", toggle: false },
        ].map((set, i) => (
          <div key={i} className="p-5 flex items-center gap-4">
            <div className="p-3 bg-muted rounded-2xl">
              <set.icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-sm text-foreground">{set.title}</h3>
              <p className="text-[11px] text-muted-foreground">{set.desc}</p>
            </div>
            {set.toggle ? (
              <div className="w-10 h-6 bg-primary rounded-full relative p-1 shadow-inner">
                <div className="w-4 h-4 bg-white rounded-full ml-auto shadow-sm" />
              </div>
            ) : (
              <ChevronRight className="h-5 w-5 text-muted-foreground/30" />
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );

  const renderPayments = () => (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => setActiveView("main")} className="p-2 bg-muted rounded-full hover:bg-muted/80 transition-colors" title="Back to Profile">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="text-xl font-black font-heading">Payments & Wallets</h2>
      </div>

      <div className="space-y-4">
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 p-6 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-white/10 transition-all" />
          <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-60 mb-1">Foodhubbie Wallet</p>
          <p className="text-3xl font-black font-heading tracking-tight">₹{(user?.walletBalance ?? 0).toLocaleString()}</p>
          <div className="mt-6 flex justify-between items-center">
            <span className="text-[10px] font-black uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full">Active</span>
            <button className="text-xs font-bold text-primary hover:underline">Add Money</button>
          </div>
        </div>

        <h3 className="px-4 text-xs font-black text-muted-foreground uppercase tracking-widest mt-6">Saved Payment Methods</h3>
        <div className="bg-muted/30 rounded-[2rem] p-10 text-center border-2 border-dashed border-border">
          <CreditCard className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-bold text-muted-foreground">No saved cards yet</p>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl pb-24 bg-gradient-to-b from-background to-muted/20 min-h-screen">
      <AnimatePresence mode="wait">
        {activeView === "main" ? (
          <motion.div
            key="main"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {/* Header / Avatar */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative mb-8 bg-card p-8 rounded-[2.5rem] border border-border shadow-xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-secondary/5 rounded-full -ml-12 -mb-12 blur-2xl" />

              <div className="flex flex-col items-center text-center relative z-10">
                <div className="relative mb-4 group">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl group-hover:bg-primary/30 transition-all scale-110" />
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-28 h-28 rounded-full object-cover border-4 border-background shadow-2xl relative"
                    />
                  ) : (
                    <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border-4 border-background shadow-2xl relative">
                      <User className="h-12 w-12 text-primary" />
                    </div>
                  )}
                  <button className="absolute bottom-1 right-1 bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform active:scale-95 border-2 border-background" title="Edit Avatar">
                    <Edit3 className="h-4 w-4" />
                  </button>
                </div>

                {isEditingProfile ? (
                  <div className="w-full max-w-xs animate-in fade-in slide-in-from-top-2">
                    <div className="flex gap-2">
                      <input
                        autoFocus
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="flex-1 border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-inner"
                        placeholder="Enter name"
                      />
                      <button
                        onClick={handleSaveName}
                        disabled={isSaving}
                        className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50"
                      >
                        {isSaving ? "..." : "Save"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsEditingProfile(true)}>
                    <h1 className="text-2xl font-heading font-black text-foreground">
                      {user?.name ?? "Guest User"}
                    </h1>
                    <Edit3 className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                )}

                <p className="text-muted-foreground font-medium text-sm mt-1">{user?.phone || user?.email}</p>
                
                <div className="mt-4 inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/20">
                  <Star className="h-3 w-3 fill-current animate-pulse" />
                  Foodhubbie Premium
                </div>
              </div>
            </motion.div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              {(Array.isArray(orders) ? [
                { label: "Orders", value: orders.length, color: "text-blue-600" },
                { label: "Wallet", value: `₹${(user?.walletBalance ?? 0).toLocaleString()}`, color: "text-emerald-600" },
                { label: "Points", value: user?.loyaltyPoints ?? 0, color: "text-amber-600" },
              ] : [
                { label: "Orders", value: 0, color: "text-blue-600" },
                { label: "Wallet", value: `₹${(user?.walletBalance ?? 0).toLocaleString()}`, color: "text-emerald-600" },
                { label: "Points", value: user?.loyaltyPoints ?? 0, color: "text-amber-600" },
              ]).map((stat, idx) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-card border border-border rounded-3xl p-4 text-center shadow-sm hover:shadow-md transition-shadow"
                >
                  <p className={`text-2xl font-heading font-black ${stat.color}`}>
                    {stat.value}
                  </p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Menu Sections */}
            <div className="space-y-8 mb-8">
              {(Array.isArray(menuSections) ? menuSections : []).map((section, sIdx) => (
                <div key={section.title} className="animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${sIdx * 100}ms` }}>
                  <h2 className="px-4 mb-4 text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">
                    {section.title}
                  </h2>
                  <div className="bg-card rounded-[2rem] border border-border shadow-sm overflow-hidden divide-y divide-border">
                    {(Array.isArray(section.items) ? section.items : []).map((item) => (
                      <motion.button
                        key={item.id}
                        whileHover={{ backgroundColor: "rgba(var(--muted), 0.5)" }}
                        whileTap={{ scale: 0.995 }}
                        onClick={() => ["addresses", "settings", "payments"].includes(item.id) && setActiveView(item.id as SubView)}
                        className="w-full p-4 flex items-center gap-4 text-left group transition-all"
                      >
                        <div className={`p-3 rounded-2xl ${item.color} transition-transform group-hover:scale-110 shadow-sm`}>
                          <item.icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-foreground text-sm">{item.title}</h3>
                          <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
                            {item.desc}
                          </p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                      </motion.button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Log Out */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={signOut}
              className="w-full py-4 bg-destructive/5 text-destructive font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 rounded-3xl border border-destructive/10 hover:bg-destructive/10 transition-all shadow-sm"
            >
              <LogOut className="h-5 w-5" />
              Log Out From Account
            </motion.button>
            
            <p className="text-center text-[10px] text-muted-foreground/40 font-bold uppercase tracking-widest mt-10">
              Foodhubbie v2.5.0 Premium
            </p>
          </motion.div>
        ) : activeView === "addresses" ? (
          renderAddresses()
        ) : activeView === "settings" ? (
          renderSettings()
        ) : activeView === "payments" ? (
          renderPayments()
        ) : null}
      </AnimatePresence>
    </div>
  );
}
