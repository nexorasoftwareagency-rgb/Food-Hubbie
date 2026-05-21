import { Link, useLocation } from "wouter";
import { Search, ShoppingBag, User, Home } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useLocationContext } from "@/context/LocationContext";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Wallet } from "lucide-react";

export function TopNav() {
  const { itemCount } = useCart();
  const { user } = useAuth();
  const { state: locationState } = useLocationContext();
  const [location, setLocation] = useLocation();
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setLocation(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const navItems = [
    { label: "Home", icon: Home, href: "/", active: location === "/" },
    { label: "Search", icon: Search, href: "/search", active: location === "/search" },
    { label: "Orders", icon: ShoppingBag, href: "/orders", active: location === "/orders" },
    { label: "Profile", icon: User, href: "/profile", active: location === "/profile" },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 w-full glass shadow-soft">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-heading font-bold text-2xl text-primary flex items-center gap-2">
              <span className="bg-primary text-primary-foreground rounded-lg p-1 shadow-lg shadow-primary/20">FH</span>
              <span className="hidden sm:inline tracking-tight">Foodhubbie</span>
            </Link>
            
            <div className="hidden md:flex flex-col ml-4 border-l border-border pl-4">
              <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-70">DELIVERING TO</span>
              <span className="text-sm font-bold truncate max-w-[200px] text-foreground/80">
                {locationState.address || "Select Location"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <form onSubmit={handleSearch} className="relative group">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input 
                type="search" 
                placeholder="Search..." 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-32 md:w-64 bg-muted/50 border-none rounded-full pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all focus:w-48 md:focus:w-80"
              />
            </form>

            {user && (
              <Link href="/profile" className="hidden lg:flex items-center gap-2 px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full hover:bg-primary/20 transition-all group">
                <Wallet className="h-4 w-4 text-primary group-hover:rotate-12 transition-transform" />
                <span className="text-sm font-black text-primary">₹{user.walletBalance || 0}</span>
              </Link>
            )}

            <Link href="/cart" className="relative p-2.5 text-foreground hover:bg-primary/10 rounded-full transition-all group">
              <ShoppingBag className="h-5 w-5 group-hover:scale-110 transition-transform" />
              {itemCount > 0 && (
                <span className="absolute top-1 right-1 bg-primary text-white text-[10px] font-black h-4 w-4 rounded-full flex items-center justify-center border-2 border-background animate-in zoom-in duration-300">
                  {itemCount}
                </span>
              )}
            </Link>

            <Link href="/profile" className="hidden sm:flex p-2.5 text-foreground hover:bg-primary/10 rounded-full transition-all">
              <User className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Bottom Navigation for Mobile */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-t border-border px-6 py-3 flex items-center justify-between shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => (
          <Link key={item.label} href={item.href} className="flex flex-col items-center gap-1 group">
            <div className={cn(
              "p-1.5 rounded-xl transition-all duration-300",
              item.active ? "bg-primary text-white shadow-lg shadow-primary/20 scale-110" : "text-muted-foreground hover:text-primary hover:bg-primary/10"
            )}>
              <item.icon className="h-5 w-5" />
            </div>
            <span className={cn(
              "text-[10px] font-bold transition-colors",
              item.active ? "text-primary" : "text-muted-foreground"
            )}>
              {item.label}
            </span>
          </Link>
        ))}
      </nav>
    </>
  );
}
