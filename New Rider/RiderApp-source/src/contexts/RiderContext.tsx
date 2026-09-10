// === src/contexts/RiderContext.tsx ===
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { useRiderProfile } from "@/hooks/useRiderProfile";
import { setRiderStatus } from "@/services/riderService";
import { subscribeWallet } from "@/services/walletService";
import { subscribeRiderStats } from "@/services/orderService";
import { discoverOutlets, type OutletInfo } from "@/services/orderService";
import { logRiderError } from "@/services/auditService";
import { toast } from "@/hooks/use-toast";
import type { Rider, RiderStats, RiderWallet } from "@/types";

type RiderContextValue = {
  rider: Rider | null;
  riderLoading: boolean;
  riderError: Error | null;
  isOnline: boolean;
  toggleOnline: () => Promise<void>;
  wallet: RiderWallet;
  stats: RiderStats;
  outlets: OutletInfo[];
  outletsLoading: boolean;
  outletsError: Error | null;
  retryOutlets: () => void;
};

const RiderContext = createContext<RiderContextValue | undefined>(undefined);

const EMPTY_WALLET: RiderWallet = { balance: 0, totalEarned: 0, lastTx: "", lastTxAt: 0 };
const EMPTY_STATS: RiderStats = { totalOrders: 0, totalEarnings: 0, deliveriesToday: 0, earningsToday: 0 };

export function RiderProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthContext();
  const { rider, loading: riderLoading, error: riderError } = useRiderProfile(user?.uid);
  const [wallet, setWallet] = useState<RiderWallet>(EMPTY_WALLET);
  const [stats, setStats] = useState<RiderStats>(EMPTY_STATS);
  const [outlets, setOutlets] = useState<OutletInfo[]>([]);
  const [outletsLoading, setOutletsLoading] = useState(true);
  const [outletsError, setOutletsError] = useState<Error | null>(null);
  const [retryTick, setRetryTick] = useState(0);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    if (!user?.uid) {
      setWallet(EMPTY_WALLET);
      return;
    }
    return subscribeWallet(user.uid, setWallet, (err) => logRiderError(user.uid, "subscribeWallet", err));
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) {
      setStats(EMPTY_STATS);
      return;
    }
    return subscribeRiderStats(user.uid, setStats, (err) => logRiderError(user.uid, "subscribeRiderStats", err));
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;
    let cancelled = false;
    setOutletsLoading(true);
    setOutletsError(null);
    discoverOutlets()
      .then((list) => {
        if (!cancelled) setOutlets(list);
      })
      .catch((err) => {
        if (cancelled) return;
        setOutletsError(err);
        logRiderError(user.uid, "discoverOutlets", err);
        toast.error("Could not load restaurant list. Pull to refresh.");
      })
      .finally(() => {
        if (!cancelled) setOutletsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.uid, retryTick]);

  const isOnline = rider?.status === "Online";

  const toggleOnline = async () => {
    if (!user?.uid || toggling) return;
    setToggling(true);
    const next = isOnline ? "Offline" : "Online";
    try {
      await setRiderStatus(user.uid, next);
      toast[next === "Online" ? "success" : "warning"](
        next === "Online" ? "You are Online" : "You are Offline",
        {
          description:
            next === "Online"
              ? "GPS tracking started. New orders will ping you."
              : "You will not receive new order pings.",
        }
      );
    } catch (err) {
      logRiderError(user.uid, "toggleOnline", err);
      toast.error("Could not update your status. Check your connection.");
    } finally {
      setToggling(false);
    }
  };

  return (
    <RiderContext.Provider
      value={{
        rider,
        riderLoading,
        riderError,
        isOnline,
        toggleOnline,
        wallet,
        stats,
        outlets,
        outletsLoading,
        outletsError,
        retryOutlets: () => setRetryTick((t) => t + 1),
      }}
    >
      {children}
    </RiderContext.Provider>
  );
}

export function useRiderContext(): RiderContextValue {
  const ctx = useContext(RiderContext);
  if (!ctx) throw new Error("useRiderContext must be used within RiderProvider");
  return ctx;
}
