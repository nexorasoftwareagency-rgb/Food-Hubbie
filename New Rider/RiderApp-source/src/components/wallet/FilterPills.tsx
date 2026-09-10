// === src/components/wallet/FilterPills.tsx ===
import { cn } from "@/lib/utils";
import type { LedgerFilter } from "@/hooks/useWallet";

const OPTIONS: { value: LedgerFilter; label: string }[] = [
  { value: "all", label: "ALL" },
  { value: "EARNING", label: "EARNINGS" },
  { value: "SETTLEMENT", label: "SETTLEMENTS" },
];

export function FilterPills({ value, onChange }: { value: LedgerFilter; onChange: (v: LedgerFilter) => void }) {
  return (
    <div className="flex gap-2 mb-3.5">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded-full px-3.5 py-1.5 text-[11.5px] font-bold transition-colors",
            value === opt.value ? "bg-primary text-white" : "bg-muted text-muted-foreground"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
