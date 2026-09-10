// === src/components/wallet/WalletView.tsx ===
import { useWallet } from "@/hooks/useWallet";
import { EarningsHero } from "@/components/wallet/EarningsHero";
import { FilterPills } from "@/components/wallet/FilterPills";
import { TransactionList } from "@/components/wallet/TransactionList";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorState } from "@/components/shared/ErrorState";

export function WalletView() {
  const { wallet, ledger, loading, error, retry, filter, setFilter, todayTotal, unsettledCash } = useWallet();

  if (loading) return <LoadingSpinner fullscreen label="Loading your wallet..." />;
  if (error) {
    return <ErrorState title="Couldn't load your wallet" description="Check your connection and try again." onRetry={retry} />;
  }

  return (
    <div className="px-3.5 pt-4 pb-6">
      <EarningsHero balance={wallet.balance} today={todayTotal} unsettled={unsettledCash} />
      <FilterPills value={filter} onChange={setFilter} />
      <TransactionList entries={ledger} />
    </div>
  );
}
