// === src/components/dashboard/PerformanceGrid.tsx ===
import { useMemo } from "react";
import { CheckCircle2, Clock, Wallet, Star } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { formatCurrency } from "@/lib/utils";
import { useEarnings } from "@/hooks/useEarnings";
import { useOrderHistory } from "@/hooks/useOrderHistory";
import { useRiderContext } from "@/contexts/RiderContext";

export function PerformanceGrid() {
  const { todayTotal, todayOrderCount } = useEarnings();
  const { rider } = useRiderContext();
  const { history } = useOrderHistory();

  // Real on-time % — compares each delivered order's actual duration
  // (deliveredAt - acceptedAt) against its own estimatedMinutes. No fabricated numbers.
  const onTimePct = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todays = history.filter((o) => (o.deliveredAt || 0) >= todayStart.getTime() && o.acceptedAt && o.deliveredAt);
    if (todays.length === 0) return null;
    const onTime = todays.filter((o) => {
      const durationMin = ((o.deliveredAt as number) - (o.acceptedAt as number)) / 60000;
      return durationMin <= (o.estimatedMinutes || 45) + 5; // small 5-min grace window
    }).length;
    return Math.round((onTime / todays.length) * 100);
  }, [history]);

  return (
    <div className="grid grid-cols-2 gap-2.5 my-4">
      <StatCard color="green" icon={<CheckCircle2 size={18} />} value={String(todayOrderCount)} label="Delivered Today" />
      <StatCard
        color="blue"
        icon={<Clock size={18} />}
        value={onTimePct === null ? "\u2014" : `${onTimePct}%`}
        label="On-Time Rate"
      />
      <StatCard color="orange" icon={<Wallet size={18} />} value={formatCurrency(todayTotal)} label="Today's Earnings" />
      <StatCard
        color="gold"
        icon={<Star size={18} />}
        value={rider?.rating ? rider.rating.toFixed(1) : "New"}
        label="Rider Rating"
      />
    </div>
  );
}
