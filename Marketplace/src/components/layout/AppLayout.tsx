import { ReactNode, useState, useEffect, useRef } from "react";
import { TopNav } from "./TopNav";
import { BottomNav } from "./BottomNav";
import { FloatingCart } from "../ui/FloatingCart";
import { useLocation } from "wouter";
import { RefreshCw } from "lucide-react";

export function AppLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const isCheckoutOrTracking = location.startsWith("/checkout") || location.startsWith("/tracking");

  const [pulling, setPulling] = useState(false);
  const [pullDist, setPullDist] = useState(0);
  const touchStartRef = useRef(0);
  const pullDistRef = useRef(0);

  useEffect(() => {
    const handleStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        touchStartRef.current = e.touches[0].pageY;
      } else {
        touchStartRef.current = 0;
      }
    };

    const handleMove = (e: TouchEvent) => {
      if (touchStartRef.current === 0) return;
      const touchY = e.touches[0].pageY;
      const diff = touchY - touchStartRef.current;
      
      if (diff > 0 && window.scrollY === 0) {
        pullDistRef.current = Math.min(diff, 250);
        setPulling(true);
        setPullDist(pullDistRef.current);
        if (diff > 10 && e.cancelable) e.preventDefault();
      }
    };

    const handleEnd = () => {
      if (pullDistRef.current > 200) {
        window.location.reload();
      }
      setPulling(false);
      setPullDist(0);
      touchStartRef.current = 0;
      pullDistRef.current = 0;
    };

    window.addEventListener("touchstart", handleStart, { passive: false });
    window.addEventListener("touchmove", handleMove, { passive: false });
    window.addEventListener("touchend", handleEnd);

    return () => {
      window.removeEventListener("touchstart", handleStart);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0 flex flex-col relative">
      {pulling && (
        <div 
          className="fixed top-0 left-0 w-full flex justify-center z-[100] transition-opacity duration-200"
          style={{ 
            transform: `translateY(${Math.min(pullDist / 3, 60)}px)`,
            opacity: Math.min(pullDist / 200, 1)
          }}
        >
          <div className={`p-3 rounded-full shadow-lg ${pullDist > 200 ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground'} transition-colors duration-300`}>
            <RefreshCw 
              className={`h-5 w-5 ${pullDist > 200 ? 'animate-spin' : ''}`} 
              style={{ transform: `rotate(${pullDist * 2}deg)` }}
            />
          </div>
        </div>
      )}

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
