// === src/components/earnings/EarningsDetail.tsx ===
import { useState } from "react";
import { useLocation } from "wouter";
import { ChevronLeft } from "lucide-react";
import { useEarnings } from "@/hooks/useEarnings";
import { TodayHero } from "@/components/earnings/TodayHero";
import { SummaryGrid } from "@/components/earnings/SummaryGrid";
import { WeeklyChart } from "@/components/earnings/WeeklyChart";
import { ShopBreakdown } from "@/components/earnings/ShopBreakdown";
import { SettlementButton } from "@/components/earnings/SettlementButton";
import { SettlementModal } from "@/components/modals/SettlementModal";

export function EarningsDetail() {
  const { todayTotal, todayOrderCount, weekly, weeklyTotal, byOutlet, unsettledCash, onlineHoursSession } = useEarnings();
  const [, navigate] = useLocation();
  const [settleOpen, setSettleOpen] = useState(false);

  return (
    <div>
      <div className="flex items-center gap-2.5 h-[var(--header-height)] px-3.5 border-b border-border bg-card sticky top-0 z-10">
        <button onClick={() => navigate("/dashboard")} className="flex size-9 items-center justify-center rounded-[10px] bg-muted">
          <ChevronLeft size={18} />
        </button>
        <b className="text-[14.5px] font-extrabold">Earnings Detail</b>
      </div>

      <div className="px-3.5 pt-4 pb-6">
        <TodayHero total={todayTotal} orders={todayOrderCount} onlineHours={onlineHoursSession} />
        <SummaryGrid unsettledCash={unsettledCash} weeklyTotal={weeklyTotal} onViewSettlements={() => setSettleOpen(true)} />

        <h3 className="text-[13px] font-extrabold mb-2.5">This Week</h3>
        <WeeklyChart data={weekly} />

        <h3 className="text-[13px] font-extrabold mb-2.5 mt-4">Earnings by Outlet</h3>
        <ShopBreakdown data={byOutlet} />

        <SettlementButton onClick={() => setSettleOpen(true)} />
      </div>

      <SettlementModal open={settleOpen} onOpenChange={setSettleOpen} />
    </div>
  );
}
