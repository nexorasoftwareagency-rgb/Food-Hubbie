import { useState } from "react";
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
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useOrderContext } from "@/context/OrderContext";
import { motion } from "framer-motion";

export default function Profile() {
  const { user, signOut } = useAuth();
  const { orders } = useOrderContext();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [name, setName] = useState(user?.name ?? "");

  const deliveredOrders = orders.filter((o) => o.status === "Delivered");
  const totalSpent = deliveredOrders.reduce((s, o) => s + o.total, 0);

  const menuItems = [
    {
      icon: MapPin,
      title: "Manage Addresses",
      desc: `${user?.savedAddresses?.length ?? 0} saved address(es)`,
    },
    {
      icon: CreditCard,
      title: "Payments & Wallets",
      desc: "Manage cards and UPI IDs",
    },
    {
      icon: Star,
      title: "Loyalty Points",
      desc: `${user?.loyaltyPoints?.toLocaleString() ?? 0} points earned`,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl pb-24">
      {/* Avatar + name */}
      <div className="flex items-center gap-5 mb-6 bg-card p-6 rounded-3xl border border-border shadow-sm">
        <div className="relative">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-24 h-24 rounded-full object-cover border-4 border-background shadow-md"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-secondary/20 flex items-center justify-center border-4 border-background shadow-md">
              <User className="h-10 w-10 text-secondary" />
            </div>
          )}
          <button
            data-testid="btn-edit-avatar"
            className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground w-7 h-7 rounded-full flex items-center justify-center shadow-md"
          >
            <Edit3 className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex-1 min-w-0">
          {isEditingProfile ? (
            <div className="flex gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 border border-border rounded-lg px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                data-testid="input-profile-name"
              />
              <button
                onClick={() => setIsEditingProfile(false)}
                className="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-sm font-bold"
              >
                Save
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 mb-0.5">
              <h1 className="text-xl font-heading font-bold text-foreground truncate">
                {user?.name ?? "Guest"}
              </h1>
              <button
                onClick={() => setIsEditingProfile(true)}
                data-testid="btn-edit-name"
                className="p-1 hover:bg-muted rounded transition-colors shrink-0"
              >
                <Edit3 className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-muted-foreground text-sm mb-1">
            <Phone className="h-3.5 w-3.5" />
            <span>{user?.phone}</span>
          </div>
          {user?.email && (
            <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
              <Mail className="h-3.5 w-3.5" />
              <span className="truncate">{user.email}</span>
            </div>
          )}
          <div className="mt-2 inline-flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            <Star className="h-3 w-3 fill-current" />
            Foodhubbie Pro
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Orders", value: orders.length },
          { label: "Delivered", value: deliveredOrders.length },
          { label: "Points", value: user?.loyaltyPoints?.toLocaleString() ?? 0 },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-card border border-border rounded-2xl p-4 text-center shadow-sm"
          >
            <p className="text-2xl font-heading font-bold text-primary">
              {stat.value}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Saved addresses */}
      {user?.savedAddresses && user.savedAddresses.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5 mb-4 shadow-sm">
          <h3 className="font-bold mb-3 text-foreground">Saved Addresses</h3>
          <div className="space-y-3">
            {user.savedAddresses.map((addr) => (
              <div
                key={addr.id}
                className="flex items-start gap-3 p-3 bg-muted/50 rounded-xl"
              >
                <div className="bg-primary/10 p-1.5 rounded-lg shrink-0 mt-0.5">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">
                    {addr.label}
                    {addr.isDefault && (
                      <span className="ml-2 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold uppercase">
                        Default
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {addr.address}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Menu list */}
      <div className="space-y-3 mb-6">
        {menuItems.map((item) => (
          <motion.button
            key={item.title}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-card p-4 rounded-2xl border border-border hover:border-primary/30 hover:bg-muted/50 transition-all flex items-center gap-4 text-left group shadow-sm"
          >
            <div className="bg-muted p-3 rounded-xl group-hover:bg-primary/10 group-hover:text-primary transition-colors">
              <item.icon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-foreground">{item.title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {item.desc}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </motion.button>
        ))}
      </div>

      <button
        onClick={signOut}
        data-testid="btn-sign-out"
        className="w-full py-4 text-destructive font-bold flex items-center justify-center gap-2 hover:bg-destructive/5 rounded-xl transition-colors"
      >
        <LogOut className="h-5 w-5" />
        Log Out
      </button>
    </div>
  );
}
