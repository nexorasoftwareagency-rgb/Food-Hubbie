// === src/components/wallet/TransactionItem.tsx ===
import { ArrowUpRight, CircleDollarSign } from "lucide-react";
import { formatCurrency, getRelativeTime, cn } from "@/lib/utils";
import type { LedgerEntry } from "@/types";

export function TransactionItem({ entry }: { entry: LedgerEntry & { id: string } }) {
  const isEarning = entry.type === "EARNING";
  return (
    <div className="flex items-center gap-2.5 py-3 border-b border-border/70 last:border-0">
      <div
        className={cn(
          "flex size-9.5 shrink-0 items-center justify-center rounded-[11px]",
          isEarning ? "bg-[#E7F7EF] text-[#10B981]" : "bg-[#EAF2FF] text-[#3B82F6]"
        )}
      >
        {isEarning ? <ArrowUpRight size={16} /> : <CircleDollarSign size={16} />}
      </div>
      <div className="flex-1 min-w-0">
        <b className="block text-[12.5px] font-bold truncate">{entry.description}</b>
        <span className="block text-[10.5px] text-muted-foreground/80">{getRelativeTime(entry.timestamp)}</span>
      </div>
      <div className={cn("text-[13.5px] font-extrabold shrink-0", entry.amount > 0 ? "text-[#10B981]" : "text-destructive")}>
        {entry.amount > 0 ? "+" : ""}
        {formatCurrency(Math.abs(entry.amount))}
      </div>
    </div>
  );
}
