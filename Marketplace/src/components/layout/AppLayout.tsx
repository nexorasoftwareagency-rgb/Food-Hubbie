import { ReactNode } from "react";
import { TopNav } from "./TopNav";
import { BottomNav } from "./BottomNav";
import { FloatingCart } from "../ui/FloatingCart";
import { useLocation } from "wouter";

export function AppLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const isCheckoutOrTracking = location.startsWith("/checkout") || location.startsWith("/tracking");

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0 flex flex-col">
      {!isCheckoutOrTracking && <TopNav />}
      
      <main className="flex-1">
        {children}
      </main>

      {!isCheckoutOrTracking && (
        <>
          <FloatingCart />
          <BottomNav />
        </>
      )}
    </div>
  );
}
