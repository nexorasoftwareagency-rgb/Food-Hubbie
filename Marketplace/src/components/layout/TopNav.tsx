import { Link } from "wouter";
import { Search, ShoppingBag, User } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useLocationContext } from "@/context/LocationContext";
import { cn } from "@/lib/utils";

export function TopNav() {
  const { itemCount } = useCart();
  const { state: locationState } = useLocationContext();

  return (
    <header className="sticky top-0 z-50 w-full glass">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-heading font-bold text-2xl text-primary flex items-center gap-2">
            <span className="bg-primary text-primary-foreground rounded-md p-1">FH</span>
            Foodhubbie
          </Link>
          
          <div className="hidden md:flex flex-col ml-4">
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">DELIVERING TO</span>
            <span className="text-sm font-medium truncate max-w-[200px]">
              {locationState.address || "Select Location"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input 
              type="search" 
              placeholder="Search food or outlets..." 
              className="w-full bg-background/50 border-border rounded-full pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <Link href="/cart" className="relative p-2 text-foreground hover:text-primary transition-colors">
            <ShoppingBag className="h-6 w-6" />
            {itemCount > 0 && (
              <span className="absolute top-0 right-0 bg-secondary text-secondary-foreground text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center border-2 border-background">
                {itemCount}
              </span>
            )}
          </Link>

          <Link href="/profile" className="hidden md:flex p-2 text-foreground hover:text-primary transition-colors">
            <User className="h-6 w-6" />
          </Link>
        </div>
      </div>
    </header>
  );
}
