import { Outlet, db, ServerValue } from '../firebase.js';
import { state } from '../state.js';
import { showToast, getISTDateString } from '../utils.js';

/**
 * SETTLEMENT ENGINE | Foodhubbie ShopAdmin
 * Handles automated partner payouts and platform commission calculation.
 */

/**
 * Calculates and logs a settlement for a delivered order
 * Refactored for Strong Backend Logic (Zomato/Swiggy Style)
 */
export async function calculateAndLogSettlement(orderId, order) {
    console.log(`[FinancialEngine] Processing Order #${orderId}...`);
    
    try {
        const revSnap = await Outlet.ref("settings/Revenue").once("value");
        const rev = revSnap.val() || { commissionType: "PERCENTAGE", commissionValue: 20 };

        const total = parseFloat(order.total || 0);
        const deliveryFee = parseFloat(order.deliveryFee || 0);
        const itemTotal = total - deliveryFee;

        let commission = (rev.commissionType === "PERCENTAGE") 
            ? (itemTotal * (parseFloat(rev.commissionValue) / 100)) 
            : parseFloat(rev.commissionValue);

        const riderPayout = deliveryFee; 
        const shopNet = Math.round((total - commission - riderPayout) * 100) / 100;
        const txId = `XACT_${orderId}_${Date.now()}`;

        // 1. Prepare Settlement Object
        const settlement = {
            orderId,
            txId,
            customerName: order.customerName || "Walk-in",
            orderTotal: total,
            itemTotal: itemTotal,
            deliveryFee: deliveryFee,
            platformCommission: Math.round(commission * 100) / 100,
            riderPayout: riderPayout,
            shopNet: shopNet,
            settledStatus: "PENDING",
            timestamp: ServerValue.TIMESTAMP,
            date: getISTDateString(new Date())
        };

        // 2. ATOMIC WALLET UPDATE & LEDGER POSTING
        const walletRef = Outlet.ref("wallet/balance");
        const updates = {};
        
        updates[`settlements/${orderId}`] = settlement;
        updates[`ledger/${txId}`] = {
            id: txId,
            type: 'ORDER_CREDIT',
            amount: shopNet,
            refId: orderId,
            timestamp: ServerValue.TIMESTAMP,
            description: `Revenue from Order #${orderId.slice(-5)}`
        };

        // 3. Increment Balance Atomically
        await walletRef.transaction((currentBalance) => {
            return (currentBalance || 0) + shopNet;
        });

        // 4. Batch write other records
        await Outlet.ref().update(updates);
        
        console.log(`[FinancialEngine] Ledger Entry Created: ${txId} | Net: ₹${shopNet}`);
        return true;
    } catch (err) {
        console.error("[FinancialEngine] CRITICAL: Failed to credit wallet:", err);
        return false;
    }
}

/**
 * Renders the settlements table and KPIs
 */
export async function renderSettlements() {
    const tableBody = document.getElementById('settlementsTable');
    if (!tableBody) return;

    // --- DATE FILTERING ---
    const fromVal = document.getElementById('settleFrom').value;
    const toVal = document.getElementById('settleTo').value;

    try {
        // Query logic: For better performance, we'd use indexOn in Firebase
        // For now, we load all and filter in memory as the ledger is outlet-specific
        const snap = await Outlet.ref("settlements").once("value");
        const data = snap.val();

        if (!data) {
            tableBody.innerHTML = `<tr><td colspan="7" class="text-center p-40 text-muted">No settlement history found.</td></tr>`;
            resetKPIs();
            return;
        }

        let html = '';
        let stats = {
            revenue: 0,
            commission: 0,
            rider: 0,
            settled: 0
        };

        // Convert to array and filter
        const list = Object.values(data).filter(s => {
            if (!s.date) return true;
            if (fromVal && s.date < fromVal) return false;
            if (toVal && s.date > toVal) return false;
            return true;
        }).sort((a, b) => b.timestamp - a.timestamp);

        if (list.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="7" class="text-center p-40 text-muted">No records found for the selected date range.</td></tr>`;
            resetKPIs();
            return;
        }

        list.forEach(s => {
            stats.revenue += (s.orderTotal || 0);
            stats.commission += (s.platformCommission || 0);
            stats.rider += (s.riderPayout || 0);
            
            const isSettled = s.settledStatus === "SETTLED";
            if (isSettled) {
                stats.settled += (s.shopNet || 0);
            }

            html += `
                <tr class="settlement-row ${isSettled ? 'row-settled' : ''}">
                    <td>
                        <div class="font-600">#${s.orderId}</div>
                        <div class="text-muted-small">${s.date}</div>
                    </td>
                    <td class="font-600">₹${s.orderTotal}</td>
                    <td class="color-danger">₹${s.platformCommission}</td>
                    <td class="color-info">₹${s.riderPayout}</td>
                    <td class="color-success font-700">₹${s.shopNet}</td>
                    <td>
                        <span class="status-badge ${isSettled ? 'status-active' : 'status-pending'}">
                            ${isSettled ? 'Settled' : 'Pending'}
                        </span>
                    </td>
                    <td class="text-right">
                        <button class="btn-icon-v4" title="View Audit Details"><i data-lucide="info"></i></button>
                    </td>
                </tr>
            `;
        });

        tableBody.innerHTML = html;
        
        // Update KPIs
        document.getElementById('settleTotalRevenue').innerText = `₹${Math.round(stats.revenue)}`;
        document.getElementById('settleTotalComm').innerText = `₹${Math.round(stats.commission)}`;
        document.getElementById('settleTotalRider').innerText = `₹${Math.round(stats.rider)}`;
        document.getElementById('settleTotalSettled').innerText = `₹${Math.round(stats.settled)}`;

        if (window.lucide) window.lucide.createIcons({ root: tableBody });

    } catch (err) {
        console.error("[Settlements] Render Error:", err);
        showToast("Failed to load settlement ledger", "error");
    }
}

function resetKPIs() {
    ['settleTotalRevenue', 'settleTotalComm', 'settleTotalRider', 'settleTotalSettled'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerText = '₹0';
    });
}

export function exportSettlementLedger() {
    showToast("Exporting ledger to CSV...", "info");
    // Implementation for CSV export would go here
}
