// === src/components/earnings/ShopBreakdown.tsx ===
import { Store } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatCurrency } from "@/lib/utils";

export function ShopBreakdown({ data }: { data: { outlet: string; total: number; orders: number }[] }) {
  if (data.length === 0) {
    return (
      <GlassCard>
        <EmptyState icon={<Store />} title="No earnings yet" description="Deliveries you complete will be grouped by restaurant here." />
      </GlassCard>
    );
  }
  return (
    <GlassCard>
      {data.map((row) => (
        <div key={row.outlet} className="flex items-center gap-2.5 py-2.5 border-b border-border/70 last:border-0">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-[var(--primary-light)]">
            <Store size={15} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <b className="block text-[12.5px] font-bold truncate">{row.outlet}</b>
            <span className="block text-[10.5px] text-muted-foreground">{row.orders} orders total</span>
          </div>
          <div className="text-[13px] font-extrabold text-[#10B981] shrink-0">{formatCurrency(row.total)}</div>
        </div>
      ))}
    </GlassCard>
  );
}
