// === src/components/wallet/TransactionList.tsx ===
import { Wallet } from "lucide-react";
import { TransactionItem } from "@/components/wallet/TransactionItem";
import { EmptyState } from "@/components/shared/EmptyState";
import { GlassCard } from "@/components/shared/GlassCard";
import type { LedgerEntry } from "@/types";

export function TransactionList({ entries }: { entries: Array<LedgerEntry & { id: string }> }) {
  if (entries.length === 0) {
    return (
      <GlassCard>
        <EmptyState icon={<Wallet />} title="No transactions yet" description="Your earnings and settlements will appear here." />
      </GlassCard>
    );
  }
  return (
    <GlassCard>
      {entries.map((e) => (
        <TransactionItem key={e.id} entry={e} />
      ))}
    </GlassCard>
  );
}
