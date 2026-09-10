// === src/services/walletService.ts ===
import { db, ref, onValue, off } from "@/lib/firebase";
import { dbPaths } from "@/lib/constants";
import type { LedgerEntry, RiderWallet, Settlement } from "@/types";

type ErrCb = (err: Error) => void;

export function subscribeWallet(uid: string, callback: (wallet: RiderWallet) => void, onError?: ErrCb) {
  const walletRef = ref(db, dbPaths.riderWallet(uid));
  const handler = onValue(
    walletRef,
    (snap) => {
      const val = snap.val() as RiderWallet | null;
      callback(val || { balance: 0, totalEarned: 0, lastTx: "", lastTxAt: 0 });
    },
    (err) => onError?.(err as unknown as Error)
  );
  return () => off(walletRef, "value", handler);
}

export function subscribeLedger(
  uid: string,
  callback: (entries: Array<LedgerEntry & { id: string }>) => void,
  onError?: ErrCb
) {
  const ledgerRef = ref(db, dbPaths.riderLedger(uid));
  const handler = onValue(
    ledgerRef,
    (snap) => {
      const val = snap.val() || {};
      const list = Object.entries(val)
        .map(([id, e]) => ({ id, ...(e as LedgerEntry) }))
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      callback(list);
    },
    (err) => onError?.(err as unknown as Error)
  );
  return () => off(ledgerRef, "value", handler);
}

export function subscribeSettlements(
  uid: string,
  callback: (settlements: Array<Settlement>) => void,
  onError?: ErrCb
) {
  const settleRef = ref(db, dbPaths.settlements(uid));
  const handler = onValue(
    settleRef,
    (snap) => {
      const val = snap.val() || {};
      const list = Object.entries(val)
        .map(([id, s]) => ({ id, ...(s as Omit<Settlement, "id">) }))
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      callback(list);
    },
    (err) => onError?.(err as unknown as Error)
  );
  return () => off(settleRef, "value", handler);
}

/** Computes cash collected via COD that hasn't shown up as a SETTLEMENT ledger entry yet. */
export function computeUnsettledCash(entries: Array<LedgerEntry>): number {
  let running = 0;
  const chronological = [...entries].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  for (const e of chronological) {
    if (e.type === "EARNING" && e.method !== "UPI") running += e.amount;
    if (e.type === "SETTLEMENT") running = Math.max(0, running - Math.abs(e.amount));
  }
  return running;
}
