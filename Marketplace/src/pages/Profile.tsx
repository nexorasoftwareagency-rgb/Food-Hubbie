import { useState } from "react";
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
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useOrderContext } from "@/context/OrderContext";
import { motion } from "framer-motion";

export default function Profile() {
  const { user, signOut, authState, updateUser } = useAuth();
  const [, setLocation] = useLocation();
  const { orders = [] } = useOrderContext();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [isSaving, setIsSaving] = useState(false);

  // Redirect if not logged in
  if (authState === "unauthenticated") {
    setLocation("/login");
    return null;
  }

  if (authState === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-muted-foreground font-medium animate-pulse">Syncing profile...</p>
      </div>
    );
  }

  const deliveredOrders = (orders || []).filter((o) => o.status === "Delivered");

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

  const menuSections = [
    {
      title: "Account & Security",
      items: [
        {
          icon: MapPin,
          title: "Manage Addresses",
          desc: `${user?.savedAddresses?.length ?? 0} saved locations`,
          color: "bg-blue-500/10 text-blue-500",
        },
        {
          icon: CreditCard,
          title: "Payments & Wallets",
          desc: "UPI, Cards & Wallets",
          color: "bg-emerald-500/10 text-emerald-500",
        },
        {
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
          icon: Heart,
          title: "Your Favorites",
          desc: "View saved items & outlets",
          color: "bg-rose-500/10 text-rose-500",
        },
        {
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
          icon: HelpCircle,
          title: "Help & Support",
          desc: "FAQs & Chat Support",
          color: "bg-indigo-500/10 text-indigo-500",
        },
        {
          icon: FileText,
          title: "Legal & Privacy",
          desc: "Terms, Privacy & Licenses",
          color: "bg-zinc-500/10 text-zinc-500",
        },
      ],
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl pb-24 bg-gradient-to-b from-background to-muted/20 min-h-screen">
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
            <button
              data-testid="btn-edit-avatar"
              className="absolute bottom-1 right-1 bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform active:scale-95 border-2 border-background"
            >
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
          { label: "Points", value: user?.loyaltyPoints ?? 0, color: "text-amber-600" },
          { label: "Savings", value: "₹450", color: "text-emerald-600" },
        ] : [
          { label: "Orders", value: 0, color: "text-blue-600" },
          { label: "Points", value: user?.loyaltyPoints ?? 0, color: "text-amber-600" },
          { label: "Savings", value: "₹450", color: "text-emerald-600" },
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
                  key={item.title}
                  whileHover={{ backgroundColor: "rgba(var(--muted), 0.5)" }}
                  whileTap={{ scale: 0.995 }}
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
    </div>
  );
}
