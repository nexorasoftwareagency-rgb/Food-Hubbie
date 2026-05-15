import { ref, update, push, get, runTransaction, serverTimestamp } from "firebase/database";
import { WalletTransaction } from "@/types";
import { logMarketplaceAudit } from "./auditService";

/**
 * Wallet Service
 * Handles institutional-grade wallet operations for Foodhubbie users.
 * Credits (Refunds/Promotions) and Debits (Payments) are handled atomically.
 */

export const walletService = {
  /**
   * Fetches the current wallet balance and history for a user
   */
  /**
   * Fetches the current wallet balance and history for a user
   */
  async getWalletData(userId: string) {
    if (typeof userId !== 'string' || !userId.trim()) {
      throw new Error("Invalid User ID");
    }

    const snap = await get(ref(db, `users/${userId.trim()}/wallet`));
    const data = snap.val() || { balance: 0, history: {} };
    
    // Convert history object to array sorted by timestamp
    const historyArr: WalletTransaction[] = Object.entries(data.history || {})
      .map(([id, t]: [string, any]) => {
        // Handle serverTimestamp placeholder if data is still syncing
        let ts = 0;
        if (t.createdAt) {
          if (typeof t.createdAt === 'number') {
            ts = t.createdAt;
          } else if (typeof t.createdAt === 'string') {
            ts = Date.parse(t.createdAt);
          } else if (typeof t.createdAt === 'object' && t.createdAt['.sv'] === 'timestamp') {
            ts = Date.now(); // Fallback for local preview of serverTimestamp
          }
        }
        return { 
          id, 
          ...t, 
          amount: t.amount || 0,
          _ts: isFinite(ts) ? ts : 0 
        };
      })
      .sort((a, b) => b._ts - a._ts);

    return {
      balance: data.balance || 0,
      history: historyArr
    };
  },

  /**
   * Adds money to user wallet (Refunds, Rewards, Add Money)
   */
  async creditWallet(userId: string, amount: number, description: string, orderId?: string) {
    if (typeof userId !== 'string' || !userId.trim()) throw new Error("Invalid User ID");
    if (typeof amount !== 'number' || amount <= 0 || !isFinite(amount)) throw new Error("Invalid Amount");
    if (typeof description !== 'string' || description.length > 256) throw new Error("Invalid Description");

    const walletRef = ref(db, `users/${userId}/wallet`);
    
    // Generate transaction ID outside to ensure consistency across retries
    const transactionId = push(ref(db, `users/${userId}/wallet/history`)).key;
    if (!transactionId) throw new Error("Failed to generate transaction ID");

    await runTransaction(walletRef, (current) => {
      const data = current || { balance: 0, history: {} };
      data.balance = (data.balance || 0) + amount;
      
      if (!data.history) data.history = {};
      
      data.history[transactionId] = {
        amount,
        type: "credit",
        description: description.trim(),
        orderId: orderId || null,
        createdAt: serverTimestamp() // Use RTDB server timestamp placeholder
      };
      
      return data;
    });

    // 🚀 AUDIT LOG
    await logMarketplaceAudit('WALLET_CREDIT', {
      userId,
      amount,
      description,
      orderId,
      transactionId
    });
  },

  /**
   * Deducts money from wallet (Order Payment)
   * Throws error if insufficient balance
   */
  async debitWallet(userId: string, amount: number, description: string, orderId?: string) {
    if (typeof userId !== 'string' || !userId.trim()) throw new Error("Invalid User ID");
    if (typeof amount !== 'number' || amount <= 0 || !isFinite(amount)) throw new Error("Invalid Amount");
    if (typeof description !== 'string' || description.length > 256) throw new Error("Invalid Description");

    const walletRef = ref(db, `users/${userId}/wallet`);
    
    // Generate transaction ID outside to ensure consistency across retries
    const transactionId = push(ref(db, `users/${userId}/wallet/history`)).key;
    if (!transactionId) throw new Error("Failed to generate transaction ID");

    const result = await runTransaction(walletRef, (current) => {
      const data = current || { balance: 0, history: {} };
      if ((data.balance || 0) < amount) {
        return; // Abort transaction if insufficient funds
      }
      
      data.balance -= amount;
      
      if (!data.history) data.history = {};
      
      data.history[transactionId] = {
        amount,
        type: "debit",
        description: description.trim(),
        orderId: orderId || null,
        createdAt: serverTimestamp()
      };
      
      return data;
    });

    if (!result.committed) {
      throw new Error("INSUFFICIENT_FUNDS");
    }

    // 🚀 AUDIT LOG
    await logMarketplaceAudit('WALLET_DEBIT', {
      userId,
      amount,
      description,
      orderId,
      transactionId
    });
  }
};
