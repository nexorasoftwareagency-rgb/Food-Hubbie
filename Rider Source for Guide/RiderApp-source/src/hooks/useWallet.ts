// === src/hooks/useWallet.ts ===
import { useEffect, useMemo, useState } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { useRiderContext } from "@/contexts/RiderContext";
import { subscribeLedger, computeUnsettledCash } from "@/services/walletService";
import { logRiderError } from "@/services/auditService";
import type { LedgerEntry } from "@/types";

export type LedgerFilter = "all" | "EARNING" | "SETTLEMENT";

export function useWallet() {
  const { user } = useAuthContext();
  const { wallet } = useRiderContext();
  const [ledger, setLedger] = useState<Array<LedgerEntry & { id: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filter, setFilter] = useState<LedgerFilter>("all");
  const [retryTick, setRetryTick] = useState(0);

  useEffect(() => {
    if (!user?.uid) return;
    setLoading(true);
    setError(null);
    const unsubscribe = subscribeLedger(
      user.uid,
      (entries) => {
        setLedger(entries);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
        logRiderError(user.uid, "subscribeLedger", err);
      }
    );
    return unsubscribe;
  }, [user?.uid, retryTick]);

  const filteredLedger = useMemo(() => {
    if (filter === "all") return ledger;
    return ledger.filter((e) => e.type === filter);
  }, [ledger, filter]);

  const todayTotal = useMemo(() => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    return ledger
      .filter((e) => e.type === "EARNING" && (e.timestamp || 0) >= startOfDay.getTime())
      .reduce((sum, e) => sum + e.amount, 0);
  }, [ledger]);

  const unsettledCash = useMemo(() => computeUnsettledCash(ledger), [ledger]);

  return {
    wallet,
    ledger: filteredLedger,
    allLedger: ledger,
    loading,
    error,
    retry: () => setRetryTick((t) => t + 1),
    filter,
    setFilter,
    todayTotal,
    unsettledCash,
  };
}
