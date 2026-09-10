import { useState, useEffect, useCallback, useRef } from "react";
import { db, get, ref, update, query, orderByChild, orderByKey, equalTo, limitToLast, startAt, endAt, endBefore, onValue, onChildAdded, onChildChanged, off, serverTimestamp, push, set, runTransaction, Outlet, getBizId, getOutletId, logAudit, getCurrentAdminActor } from "../firebase";
import { STATUS_SEQUENCES, STATUS_MAPPING, LIVE_STATUSES, RIDER_STALE_MS, ORD_ST, SEQ } from "../constants";

const PAGE_SIZE = 50;
const DATERANGE_LIMIT = 200;

function isRiderFresh(r) {
  if (!r) return false;
  if (r.status === "On Delivery") return true;
  if (r.status !== "Online") return false;
  const ts = r.lastSeen || r.location?.ts || 0;
  return ts && (Date.now() - ts) < RIDER_STALE_MS;
}

function normalizeItems(order) {
  let items = [];
  if (Array.isArray(order.cart)) items = order.cart;
  else if (order.items) items = Array.isArray(order.items) ? order.items : Object.values(order.items);
  else if (order.item) items = [{ name: order.item, size: order.size || 'Regular', addon: order.addon || 'None', qty: 1, price: order.total || 0 }];
  return items;
}

function getISTDateString(date) {
  if (!date) date = new Date();
  else if (typeof date === 'number') date = new Date(date);
  else if (typeof date === 'string') date = new Date(date);
  if (isNaN(date.getTime())) date = new Date();
  return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

function getNextValidStatus(currentStatus, type) {
  const seq = STATUS_SEQUENCES[type] || STATUS_SEQUENCES.Default;
  const idx = seq.indexOf(currentStatus);
  if (idx >= 0 && idx < seq.length - 1) return seq[idx + 1];
  return null;
}

async function autoDeductStock(order) {
  const biz = getBizId();
  const outlet = getOutletId();
  if (!biz || !outlet) return;
  try {
    const trackSnap = await get(ref(db, `businesses/${biz}/outlets/${outlet}/settings/inventory/stockTracking`));
    if (trackSnap.val() === false) return;
  } catch (_) {}
  const items = normalizeItems(order);
  if (items.length === 0) return;
  try {
    const invSnap = await get(ref(db, `businesses/${biz}/outlets/${outlet}/inventory`));
    const inventory = invSnap.val() || {};
    for (const item of items) {
      const itemName = (item.name || "").toLowerCase();
      let invKey = null;
      if (item.id) {
        const entry = Object.entries(inventory).find(([, data]) => data.dishId === item.id);
        if (entry) invKey = entry[0];
      }
      if (!invKey) {
        const entry = Object.entries(inventory).find(([, data]) => (data.name || "").toLowerCase() === itemName);
        if (entry) invKey = entry[0];
      }
      if (invKey) {
        const delta = -(item.qty || 1);
        const itemRef = ref(db, `businesses/${biz}/outlets/${outlet}/inventory/${invKey}/stock`);
        try {
          await runTransaction(itemRef, (currentStock) => Math.max(0, (currentStock || 0) + delta));
        } catch (_) {}
      }
    }
  } catch (e) { console.error("[Stock] Auto-deduct error:", e); }
}

export default function useOrders({ showToast, playAlertSound, ready, reloadKey }) {
  const [orders, setOrders] = useState([]);
  const [ordersMap, setOrdersMap] = useState(new Map());
  const [liveOrdersMap, setLiveOrdersMap] = useState(new Map());
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ordersPageData, setOrdersPageData] = useState([]);
  const [ordersPageCursor, setOrdersPageCursor] = useState(null);
  const [ordersLoadedKeys, setOrdersLoadedKeys] = useState(new Set());
  const [hasMoreOrders, setHasMoreOrders] = useState(true);
  const [ordersPageLoading, setOrdersPageLoading] = useState(false);
  const [highlightedOrderId, setHighlightedOrderId] = useState(null);

  const lastOrdersSnapRef = useRef(null);
  const loadingRef = useRef(false);
  const initialLoadRef = useRef(true);
  const unacknowledgedRef = useRef(new Set());
  const continuousSoundRef = useRef(null);
  const continuousIntervalRef = useRef(null);

  const liveOrders = orders.filter(o => {
    const s = (o.status || '').toLowerCase();
    return LIVE_STATUSES.some(ls => ls.toLowerCase() === s);
  });

  const activeOrders = orders.filter(o => o.status !== "Delivered" && o.status !== "Cancelled");

  // ─── Firebase Listeners ─────────────────────────────────────────────────
  useEffect(() => {
    if (!ready) return;
    const biz = getBizId();
    const outlet = getOutletId();
    if (!biz || !outlet) return;

    setLoading(true);
    initialLoadRef.current = true;
    const loadTime = Date.now();
    const ordersRef = Outlet("orders");
    if (!ordersRef) return;

    const childAddedUnsub = onChildAdded(ordersRef, snap => {
      if (!initialLoadRef.current) {
        const order = snap.val();
        if (!order) return;
        const orderTime = typeof order.createdAt === 'number' ? order.createdAt : new Date(order.createdAt).getTime();
        const isRecent = orderTime && (Date.now() - orderTime) < 120000;
        const isPostLoad = orderTime && orderTime > loadTime - 5000;
        if (order.status === "Placed" && isRecent && isPostLoad) {
          unacknowledgedRef.current.add(snap.key);
          startContinuousSound();
          const id = snap.key;
          setTimeout(() => setHighlightedOrderId(id), 1000);
          setTimeout(() => setHighlightedOrderId(prev => prev === id ? null : prev), 6000);
        }
      }
    });

    const childChangedUnsub = onChildChanged(ordersRef, snap => {
      const order = snap.val();
      if (order) {
        if (order.status !== "Placed") {
          unacknowledgedRef.current.delete(snap.key);
          if (unacknowledgedRef.current.size === 0) stopContinuousSound();
        }
      }
    });

    const valueUnsub = onValue(ordersRef, snap => {
      initialLoadRef.current = false;
      lastOrdersSnapRef.current = snap;
      const v = snap.val();
      const entries = v ? Object.keys(v).map(k => ({ id: k, ...v[k] })) : [];
      setOrders(entries);

      const map = new Map();
      entries.forEach(o => map.set(o.id, o));
      setOrdersMap(map);

      const liveMap = new Map();
      entries.forEach(o => {
        const s = (o.status || '').toLowerCase();
        if (LIVE_STATUSES.some(ls => ls.toLowerCase() === s)) liveMap.set(o.id, o);
      });
      setLiveOrdersMap(liveMap);
      setLoading(false);
    }, err => {
      console.error("[Orders] Firebase Error:", err);
      if (showToast) showToast("Error loading orders", "error");
      setLoading(false);
    });

    // Riders listener
    const ridersRef = ref(db, "riders");
    const ridersUnsub = onValue(ridersRef, snap => {
      const rd = [];
      snap.forEach(ch => rd.push({ id: ch.key, ...ch.val() }));
      setRiders(rd);
    });

    return () => {
      off(ordersRef, "value", valueUnsub);
      if (childAddedUnsub) childAddedUnsub();
      if (childChangedUnsub) childChangedUnsub();
      off(ridersRef, "value", ridersUnsub);
      stopContinuousSound();
    };
  }, [ready, reloadKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Continuous Sound ───────────────────────────────────────────────────
  const startContinuousSound = useCallback(() => {
    if (continuousIntervalRef.current) return;
    continuousIntervalRef.current = setInterval(() => {
      if (playAlertSound) playAlertSound();
    }, 2000);
  }, [playAlertSound]);

  const stopContinuousSound = useCallback(() => {
    if (continuousIntervalRef.current) {
      clearInterval(continuousIntervalRef.current);
      continuousIntervalRef.current = null;
    }
  }, []);

  // ─── Pagination ─────────────────────────────────────────────────────────
  const loadOrdersPage = useCallback(async (reset = false) => {
    if (loadingRef.current && !reset) return;
    loadingRef.current = true;
    setOrdersPageLoading(true);

    const biz = getBizId();
    const outlet = getOutletId();
    if (!biz || !outlet) return;

    if (reset) {
      setOrdersPageData([]);
      setOrdersPageCursor(null);
      setOrdersLoadedKeys(new Set());
      setHasMoreOrders(true);
    }

    const fromDate = "";
    const toDate = "";
    const ordersRef = Outlet("orders");
    if (!ordersRef) return;

    let queryRef;
    if (!fromDate && !toDate) {
      const pageCursor = reset ? null : ordersPageCursor;
      if (pageCursor) {
        queryRef = query(ordersRef, orderByKey(), endBefore(pageCursor), limitToLast(PAGE_SIZE));
      } else {
        queryRef = query(ordersRef, orderByKey(), limitToLast(PAGE_SIZE));
      }
    } else {
      const d1 = new Date(fromDate);
      const d2 = new Date(toDate);
      if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
        const qStart = new Date(d1); qStart.setDate(qStart.getDate() - 1);
        const qEnd = new Date(d2); qEnd.setDate(qEnd.getDate() + 1);
        queryRef = query(ordersRef, orderByChild("createdAt"),
          startAt(`${qStart.toISOString().split('T')[0]}T00:00:00.000Z`),
          endAt(`${qEnd.toISOString().split('T')[0]}T23:59:59.999Z`),
          limitToLast(DATERANGE_LIMIT));
      }
    }

    try {
      const snap = await get(queryRef);
      if (!snap.exists() || !snap.val()) {
        setHasMoreOrders(false);
        loadingRef.current = false;
        setOrdersPageLoading(false);
        return;
      }

      const entries = [];
      const loadedKeys = new Set(reset ? [] : [...ordersLoadedKeys]);
      snap.forEach(child => {
        const key = child.key;
        if (!loadedKeys.has(key)) {
          loadedKeys.add(key);
          entries.push({ id: key, ...child.val() });
        }
      });

      if (entries.length === 0 && !reset) {
        setHasMoreOrders(false);
        loadingRef.current = false;
        setOrdersPageLoading(false);
        return;
      }

      const keys = entries.map(e => e.id);
      setOrdersPageCursor(keys[0]);
      setOrdersLoadedKeys(loadedKeys);

      setOrdersPageData(prev => [...prev, ...entries]);

      if (entries.length < PAGE_SIZE) {
        setHasMoreOrders(false);
      } else {
        setHasMoreOrders(true);
      }
    } catch (err) {
      console.error("[Orders] Pagination error:", err);
      if (showToast) showToast("Error loading more orders", "error");
    }

    loadingRef.current = false;
    setOrdersPageLoading(false);
  }, [ordersPageCursor, ordersLoadedKeys, showToast]);

  // ─── Status Update ──────────────────────────────────────────────────────
  const updateStatus = useCallback(async (id, status) => {
    const order = ordersMap.get(id) || liveOrdersMap.get(id);
    if (!order) {
      if (showToast) showToast("Order not found", "error");
      return;
    }

    const currentStatus = order.status || "Placed";
    const type = order.type || 'Online';
    const sequence = STATUS_SEQUENCES[type] || STATUS_SEQUENCES.Default;
    const currentLevel = sequence.indexOf(currentStatus);
    const nextLevel = sequence.indexOf(status);

    const isPosSale = (type || '').toLowerCase() === 'dine-in';
    const isPosSkipReady = isPosSale && currentStatus === "Confirmed" && status === "Delivered";
    const isCancelling = status === "Cancelled";
    const canCancel = isCancelling && currentStatus !== "Delivered";
    const isNextStep = nextLevel === currentLevel + 1;
    const isResurrecting = currentStatus === "Cancelled" && status === "Placed";

    if (!isNextStep && !canCancel && !isResurrecting && !isPosSkipReady && status !== currentStatus) {
      if (nextLevel <= currentLevel && nextLevel !== -1 && !isCancelling) {
        if (showToast) showToast(`Cannot reverse from ${currentStatus} to ${status}`, "error");
      } else if (isCancelling && currentStatus === "Delivered") {
        if (showToast) showToast("Cannot cancel a delivered order", "error");
      } else {
        const expectedNext = sequence[currentLevel + 1] || "None";
        if (showToast) showToast(`Next step must be "${expectedNext}"`, "error");
      }
      return;
    }

    if (status === "Out for Delivery") {
      const checkOrder = ordersMap.get(id) || liveOrdersMap.get(id);
      if (checkOrder && !checkOrder.riderId) {
        if (showToast) showToast("Assign a rider first before Out for Delivery", "error");
        return;
      }
    }

    let paymentMethod = order.paymentMethod || "Cash";
    let paymentStatus = order.paymentStatus || "Pending";

    return { method: paymentMethod, paymentStatus, isPosSale };
  }, [ordersMap, liveOrdersMap, showToast]);

  // ─── Execute Status Update ──────────────────────────────────────────────
  const executeStatusUpdate = useCallback(async (id, status, paymentMethod) => {
    const order = ordersMap.get(id) || liveOrdersMap.get(id);
    if (!order) return;

    try {
      const updates = { status };
      if (status === "Delivered") {
        updates.paymentStatus = "Paid";
        if (paymentMethod) updates.paymentMethod = paymentMethod;
        if (!order.stockDeducted) {
          autoDeductStock(order);
          updates.stockDeducted = true;
        }
      }
      await update(Outlet(`orders/${id}`), updates);
      logAudit(getBizId(), getOutletId(), "update_status", { orderId: id, status }, getCurrentAdminActor());
      if (showToast) showToast(`Status → ${ORD_ST[status]?.label || status}`, "success");
      return true;
    } catch (e) {
      if (showToast) showToast("Status update failed: " + e.message, "error");
      return false;
    }
  }, [ordersMap, liveOrdersMap, showToast]);

  // ─── Rider Assignment ───────────────────────────────────────────────────
  const assignRider = useCallback(async (orderId, riderId) => {
    try {
      const rs = await get(ref(db, `riders/${riderId}`));
      const rider = rs.val();
      if (!rider) {
        if (showToast) showToast("Rider not found", "error");
        return;
      }
      const order = ordersMap.get(orderId) || liveOrdersMap.get(orderId);
      if (!order) return;

      const updateData = {
        riderId,
        assignedRider: rider.email?.toLowerCase() || "",
        riderName: rider.name || "",
        riderPhone: rider.phone || "",
        assignedAt: serverTimestamp(),
      };

      const currentStatus = (order.status || "").toLowerCase();
      if (currentStatus === "placed") {
        updateData.status = "Confirmed";
        if (!order.stockDeducted) {
          autoDeductStock(order);
          updateData.stockDeducted = true;
        }
      }

      await update(Outlet(`orders/${orderId}`), updateData);
      logAudit(getBizId(), getOutletId(), "assign_rider", { orderId, riderId, riderName: rider.name }, getCurrentAdminActor());
      // Notify rider via in-app notification
      try {
        const notifRef = push(ref(db, `riders/${riderId}/notifications`));
        await set(notifRef, {
          id: notifRef.key,
          title: `New Order #${orderId.slice(-5)}`,
          body: `Order for ₹${order.total || 0} assigned to you.`,
          type: 'new',
          timestamp: serverTimestamp(),
          read: false,
          icon: 'package'
        });
      } catch (_) {}
      if (showToast) showToast(`Rider ${rider.name || ""} assigned`, "success");
    } catch (e) {
      if (showToast) showToast("Rider assignment failed: " + e.message, "error");
    }
  }, [ordersMap, liveOrdersMap, showToast]);

  // ─── Order Deletion ─────────────────────────────────────────────────────
  const deleteOrder = useCallback(async (id) => {
    if (!window.confirm("Delete this order permanently?")) return;
    try {
      await remove(Outlet(`orders/${id}`));
      logAudit(getBizId(), getOutletId(), "delete_order", { orderId: id }, getCurrentAdminActor());
      if (showToast) showToast("Order deleted", "success");
    } catch (e) {
      if (showToast) showToast("Delete failed: " + e.message, "error");
    }
  }, [showToast]);

  // ─── Reset Pagination ───────────────────────────────────────────────────
  const resetPagination = useCallback(() => {
    setOrdersPageData([]);
    setOrdersPageCursor(null);
    setOrdersLoadedKeys(new Set());
    setHasMoreOrders(true);
  }, []);

  // ─── Normalize Items Helper (exported for use) ─────────────────────────
  const getOrderItems = useCallback((order) => normalizeItems(order), []);

  return {
    orders, ordersMap, liveOrdersMap, liveOrders, activeOrders, riders, loading,
    ordersPageData, ordersPageCursor, ordersLoadedKeys, hasMoreOrders, ordersPageLoading,
    loadOrdersPage, resetPagination,
    updateStatus, executeStatusUpdate, assignRider, deleteOrder,
    getOrderItems, isRiderFresh, normalizeItems, getISTDateString, getNextValidStatus,
    lastOrdersSnapRef, unacknowledgedRef,
    startContinuousSound, stopContinuousSound,
    highlightedOrderId,
  };
}
