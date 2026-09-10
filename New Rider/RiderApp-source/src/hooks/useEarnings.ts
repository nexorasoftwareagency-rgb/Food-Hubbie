// === src/hooks/useEarnings.ts ===
import { useEffect, useMemo, useRef, useState } from "react";
import { useWallet } from "@/hooks/useWallet";
import { useRiderContext } from "@/contexts/RiderContext";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function useEarnings() {
  const { allLedger, unsettledCash } = useWallet();
  const { isOnline, stats } = useRiderContext();

  // Tracks time spent Online *this app session* — an honest, locally-measured figure
  // (the schema has no server-side online-duration log to read from).
  const [onlineSeconds, setOnlineSeconds] = useState(0);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (isOnline) {
      intervalRef.current = window.setInterval(() => setOnlineSeconds((s) => s + 1), 1000);
    } else if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [isOnline]);

  const earnings = useMemo(() => allLedger.filter((e) => e.type === "EARNING"), [allLedger]);

  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);

  const todayEntries = useMemo(() => earnings.filter((e) => (e.timestamp || 0) >= todayStart), [earnings, todayStart]);
  const todayTotal = useMemo(() => todayEntries.reduce((s, e) => s + e.amount, 0), [todayEntries]);
  const todayOrderCount = todayEntries.length;

  const weekly = useMemo(() => {
    const days: { d: string; date: string; v: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - i);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      const total = earnings
        .filter((e) => (e.timestamp || 0) >= date.getTime() && (e.timestamp || 0) < nextDate.getTime())
        .reduce((s, e) => s + e.amount, 0);
      days.push({ d: DAY_LABELS[date.getDay()], date: date.toISOString(), v: total });
    }
    return days;
  }, [earnings]);

  const weeklyTotal = useMemo(() => weekly.reduce((s, d) => s + d.v, 0), [weekly]);

  const byOutlet = useMemo(() => {
    const map = new Map<string, { outlet: string; total: number; orders: number }>();
    for (const e of earnings) {
      const key = e.outlet || "Other";
      const entry = map.get(key) || { outlet: key, total: 0, orders: 0 };
      entry.total += e.amount;
      entry.orders += 1;
      map.set(key, entry);
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [earnings]);

  return {
    todayTotal,
    todayOrderCount,
    weekly,
    weeklyTotal,
    byOutlet,
    unsettledCash,
    onlineHoursSession: Math.round((onlineSeconds / 3600) * 10) / 10,
    totalOrders: stats.totalOrders,
    totalEarnings: stats.totalEarnings,
  };
}
