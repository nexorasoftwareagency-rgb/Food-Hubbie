import { Link, useLocation } from "wouter";
import { Home, Store, ShoppingBag, Receipt, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/context/CartContext";

export function BottomNav() {
  const [location] = useLocation();
  const { itemCount } = useCart();

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/outlets", icon: Store, label: "Outlets" },
    { href: "/cart", icon: ShoppingBag, label: "Cart", badge: itemCount },
    { href: "/orders", icon: Receipt, label: "Orders" },
    { href: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border pb-safe">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full relative transition-colors duration-200",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <item.icon className={cn("h-6 w-6", isActive && "fill-primary/20")} strokeWidth={isActive ? 2.5 : 2} />
                {item.badge ? (
                  <span className="absolute -top-1 -right-1 bg-secondary text-secondary-foreground text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center border border-background">
                    {item.badge}
                  </span>
                ) : null}
              </div>
              <span className={cn("text-[10px] mt-1 font-medium", isActive && "font-bold")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
