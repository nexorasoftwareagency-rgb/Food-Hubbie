import { db } from "@/lib/firebase";
import { ref, update, push, get, runTransaction, serverTimestamp } from "firebase/database";
import { WalletTransaction } from "@/types";

/**
 * Wallet Service
 * Handles institutional-grade wallet operations for Foodhubbie users.
 * Credits (Refunds/Promotions) and Debits (Payments) are handled atomically.
 */

export const walletService = {
  /**
   * Fetches the current wallet balance and history for a user
   */
  async getWalletData(userId: string) {
    const snap = await get(ref(db, `users/${userId}/wallet`));
    const data = snap.val() || { balance: 0, history: {} };
    
    // Convert history object to array sorted by timestamp
    const historyArr: WalletTransaction[] = Object.entries(data.history || {})
      .map(([id, t]: [string, any]) => ({ id, ...t }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return {
      balance: data.balance || 0,
      history: historyArr
    };
  },

  /**
   * Adds money to user wallet (Refunds, Rewards, Add Money)
   */
  async creditWallet(userId: string, amount: number, description: string, orderId?: string) {
    const walletRef = ref(db, `users/${userId}/wallet`);
    
    await runTransaction(walletRef, (current) => {
      const data = current || { balance: 0, history: {} };
      data.balance = (data.balance || 0) + amount;
      
      const transactionId = push(ref(db, `users/${userId}/wallet/history`)).key;
      if (!data.history) data.history = {};
      
      data.history[transactionId!] = {
        amount,
        type: "credit",
        description,
        orderId: orderId || null,
        createdAt: new Date().toISOString()
      };
      
      return data;
    });
  },

  /**
   * Deducts money from wallet (Order Payment)
   * Throws error if insufficient balance
   */
  async debitWallet(userId: string, amount: number, description: string, orderId?: string) {
    const walletRef = ref(db, `users/${userId}/wallet`);
    
    const result = await runTransaction(walletRef, (current) => {
      const data = current || { balance: 0, history: {} };
      if ((data.balance || 0) < amount) {
        return; // Abort transaction if insufficient funds
      }
      
      data.balance -= amount;
      
      const transactionId = push(ref(db, `users/${userId}/wallet/history`)).key;
      if (!data.history) data.history = {};
      
      data.history[transactionId!] = {
        amount,
        type: "debit",
        description,
        orderId: orderId || null,
        createdAt: new Date().toISOString()
      };
      
      return data;
    });

    if (!result.committed) {
      throw new Error("INSUFFICIENT_FUNDS");
    }
  }
};
