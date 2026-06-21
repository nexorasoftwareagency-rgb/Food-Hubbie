/**
 * Menu/js/session.js
 * Secure token validation and session lifecycle for QR dine-in ordering.
 *
 * Uses FoodHubbie's multi-tenant Firebase paths:
 *   businesses/{bizId}/outlets/{outletId}/tables
 *   businesses/{bizId}/outlets/{outletId}/tableSessions
 *
 * Flow:
 *   Scan QR → Read ?t=TOKEN → Validate Token → Find Table →
 *   Load Active Session → (join or create) → Load Menu
 */
import { db, BIZ_ID, OUTLET_ID, outletRef, get, set, push, update, runTransaction } from './firebase.js';
import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

export const Session = {
    table: null,
    tableId: null,
    session: null,
    sessionId: null,
    _sessionUnsub: null,
};

function getTokenFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('t');
}

async function validateToken(token) {
    if (!token) return null;
    const snap = await get(outletRef('tables'));
    const tables = snap.val() || {};
    const entry = Object.entries(tables).find(([, t]) => t.token === token && t.active !== false);
    if (!entry) return null;
    return { id: entry[0], ...entry[1] };
}

async function joinOrCreateSession(table) {
    const sessionsSnap = await get(outletRef(`tableSessions`));
    const allSessions = sessionsSnap.val() || {};

    if (table.currentSession && allSessions[table.currentSession] && allSessions[table.currentSession].status !== 'closed') {
        return { id: table.currentSession, ...allSessions[table.currentSession] };
    }

    let createdSessionId = null;
    let createdSessionData = null;

    // Use outletRef-based transaction path for multi-tenant compatibility
    const txnRef = ref(db, `businesses/${BIZ_ID}/outlets/${OUTLET_ID}/tables/${table.id}/currentSession`);
    await runTransaction(txnRef, (current) => {
        if (current) {
            return undefined;
        }
        const newRef = push(outletRef('tableSessions'));
        createdSessionId = newRef.key;
        createdSessionData = {
            sessionId: newRef.key,
            tableId: table.id,
            tableNumber: table.number,
            tableToken: table.token,
            status: 'active',
            openedAt: Date.now(),
            closedAt: null,
            customerName: '',
            customerPhone: '',
            guestCount: 1,
            orders: [],
            runningTotal: 0,
            discount: 0,
            tax: 0,
            grandTotal: 0
        };
        return newRef.key;
    });

    if (createdSessionId && createdSessionData) {
        await set(outletRef(`tableSessions/${createdSessionId}`), createdSessionData);
        await update(outletRef(`tables/${table.id}`), { status: 'occupied', updatedAt: Date.now() });
        return { id: createdSessionId, ...createdSessionData };
    }

    const freshSnap = await get(outletRef(`tables/${table.id}`));
    const freshTable = freshSnap.val();
    const sessSnap = await get(outletRef(`tableSessions/${freshTable.currentSession}`));
    return { id: freshTable.currentSession, ...sessSnap.val() };
}

export async function initSession() {
    const token = getTokenFromUrl();
    const table = await validateToken(token);
    if (!table) return { ok: false, reason: 'invalid-token' };

    // Store biz/outlet context for transaction paths
    table.__bizId = BIZ_ID;
    table.__outletId = OUTLET_ID;
    Session.table = table;
    Session.tableId = table.id;

    const session = await joinOrCreateSession(table);
    Session.session = session;
    Session.sessionId = session.id;

    watchSession();
    return { ok: true };
}

function watchSession() {
    if (Session._sessionUnsub) Session._sessionUnsub();
    Session._sessionUnsub = onValue(outletRef(`tableSessions/${Session.sessionId}`), (snap) => {
        const data = snap.val();
        if (!data) return;
        Session.session = { id: Session.sessionId, ...data };
        window.dispatchEvent(new CustomEvent('session:updated', { detail: Session.session }));
    });
}

export async function attachOrderToSession(orderId, orderTotals) {
    const txnRef = ref(db, `businesses/${BIZ_ID}/outlets/${OUTLET_ID}/tableSessions/${Session.sessionId}`);
    await runTransaction(txnRef, (sess) => {
        if (!sess) return sess;
        sess.orders = Array.isArray(sess.orders) ? sess.orders : [];
        sess.orders.push(orderId);
        sess.runningTotal = (sess.runningTotal || 0) + (orderTotals.subtotal || 0);
        sess.tax = (sess.tax || 0) + (orderTotals.tax || 0);
        sess.grandTotal = (sess.grandTotal || 0) + (orderTotals.total || 0);
        return sess;
    });
}

export async function requestBill() {
    if (!Session.sessionId) return;
    await update(outletRef(`tableSessions/${Session.sessionId}`), { status: 'billing' });
    await update(outletRef(`tables/${Session.tableId}`), { status: 'billing', updatedAt: Date.now() });
}

export async function saveCheckoutContact(name, phone) {
    if (!Session.sessionId) return;
    const patch = {};
    if (name) patch.customerName = name;
    if (phone) patch.customerPhone = phone;
    if (Object.keys(patch).length) await update(outletRef(`tableSessions/${Session.sessionId}`), patch);
}

export function cleanupSession() {
    if (Session._sessionUnsub) { Session._sessionUnsub(); Session._sessionUnsub = null; }
}
