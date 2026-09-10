// === src/services/orderService.ts ===
// The core delivery lifecycle. Every write here mirrors the legacy vanilla-JS
// app.js patterns extracted in PRD §12 — atomic transactions, exact field names,
// and proximity gates are preserved so ShopAdmin / SupremeAdmin / Marketplace
// keep working against this data unchanged.

import {
  db,
  ref,
  get,
  set,
  update,
  remove,
  runTransaction,
  query,
  orderByChild,
  equalTo,
  onValue,
  off,
  serverTimestamp,
} from "@/lib/firebase";
import { dbPaths, PROXIMITY, OTP_LIMITS } from "@/lib/constants";
import { getDistanceKm, isGhostOrder } from "@/lib/utils";
import { whatsappService } from "@/services/whatsappService";
import type {
  AvailableOrder,
  Business,
  OtpAttemptRecord,
  OutletRef,
  RiderOrder,
} from "@/types";

export class ProximityError extends Error {
  distanceKm: number;
  maxKm: number;
  constructor(distanceKm: number, maxKm: number) {
    super(`Too far away (${distanceKm.toFixed(2)}km). Move within ${maxKm}km and try again.`);
    this.name = "ProximityError";
    this.distanceKm = distanceKm;
    this.maxKm = maxKm;
  }
}

export class OrderTakenError extends Error {
  constructor() {
    super("This order has already been accepted by another rider.");
    this.name = "OrderTakenError";
  }
}

export class OtpBlockedError extends Error {
  retryAfterMs: number;
  constructor(retryAfterMs: number) {
    super(`Too many attempts. Try again in ${Math.ceil(retryAfterMs / 1000)}s.`);
    this.name = "OtpBlockedError";
    this.retryAfterMs = retryAfterMs;
  }
}

function assertProximity(riderLat: number, riderLng: number, targetLat: number, targetLng: number, maxKm: number) {
  const distance = getDistanceKm(riderLat, riderLng, targetLat, targetLng);
  if (distance > maxKm) throw new ProximityError(distance, maxKm);
}

/** ─── Outlet discovery (PRD §12.10) ──────────────────────────────────── */

export type OutletInfo = OutletRef & {
  name: string;
  phone: string;
  lat: number;
  lng: number;
  riderAcceptanceRadius: number;
  backupCode: string;
};

export async function discoverOutlets(): Promise<OutletInfo[]> {
  const snap = await get(ref(db, dbPaths.businesses()));
  const businesses = (snap.val() || {}) as Record<string, Business>;
  const outlets: OutletInfo[] = [];
  for (const [bid, biz] of Object.entries(businesses)) {
    for (const [oid, outlet] of Object.entries(biz.outlets || {})) {
      const lat = parseFloat(outlet.settings?.Store?.lat as any) || 0;
      const lng = parseFloat(outlet.settings?.Store?.lng as any) || 0;
      outlets.push({
        bid,
        oid,
        name: outlet.name || "Outlet",
        phone: outlet.phone || "",
        lat,
        lng,
        // NOTE: riderAcceptanceRadius is stored directly in km (legacy app.js line ~490
        // reads it with no unit conversion) — do NOT divide by 1000 here.
        riderAcceptanceRadius: parseFloat(outlet.settings?.Delivery?.riderAcceptanceRadius as any) || 1.0,
        // Two possible legacy field names, checked in the same order as app.js line ~1359.
        backupCode: outlet.settings?.Delivery?.backupCode || (outlet.settings?.Store as any)?.deliveryBackupCode || "",
      });
    }
  }
  return outlets;
}

/** ─── Real-time order listeners across every outlet (PRD §12.10) ───────── */

type OrderMap = Record<string, RiderOrder & { bid: string; oid: string; outletName: string }>;

export function subscribeAvailableOrders(
  outlets: OutletInfo[],
  callback: (orders: AvailableOrder[]) => void,
  onError?: (err: Error) => void
) {
  const cache: OrderMap = {};
  const unsubs: Array<() => void> = [];

  const emit = () => {
    const list: AvailableOrder[] = Object.values(cache)
      .filter((o) => o.status === "Ready" && !isGhostOrder(o.createdAt, false))
      .map((o) => ({
        id: o.id,
        outletName: o.outletName,
        outletId: o.oid,
        businessId: o.bid,
        outletPhone: o.outletPhone,
        outletAddress: o.outletAddress,
        outletLat: o.outletLat || 0,
        outletLng: o.outletLng || 0,
        status: o.status,
        address: o.address,
        lat: o.lat,
        lng: o.lng,
        deliveryFee: o.deliveryFee,
        total: o.total,
        subtotal: o.subtotal,
        discount: o.discount,
        items: o.items || [],
        createdAt: o.createdAt,
      }));
    callback(list);
  };

  outlets.forEach(({ bid, oid, name, lat, lng, phone }) => {
    const ordersPath = dbPaths.orders(bid, oid);
    const q = query(ref(db, ordersPath), orderByChild("assignedRider"), equalTo(""));
    const handler = onValue(
      q,
      (snap) => {
        const val = snap.val() || {};
        // Clear this outlet's previous unassigned entries, then repopulate
        Object.keys(cache).forEach((key) => {
          if (cache[key].bid === bid && cache[key].oid === oid && !cache[key].assignedRider) delete cache[key];
        });
        Object.entries(val).forEach(([orderId, data]) => {
          cache[`${bid}:${oid}:${orderId}`] = {
            ...(data as RiderOrder),
            id: orderId,
            bid,
            oid,
            outletName: name,
            outletAddress: (data as any).outletAddress,
            outletPhone: (data as any).outletPhone || phone,
            outletLat: lat,
            outletLng: lng,
          } as any;
        });
        emit();
      },
      (err) => onError?.(err as unknown as Error)
    );
    unsubs.push(() => off(q, "value", handler));
  });

  return () => unsubs.forEach((fn) => fn());
}

export function subscribeActiveOrders(
  outlets: OutletInfo[],
  riderEmail: string,
  callback: (orders: Array<RiderOrder & { bid: string; oid: string; outletName: string; outletLat: number; outletLng: number; riderAcceptanceRadius: number; backupCode: string }>) => void,
  onError?: (err: Error) => void
) {
  const cache: Record<string, any> = {};
  const unsubs: Array<() => void> = [];

  const emit = () => {
    const list = Object.values(cache).filter(
      (o: any) => o.status !== "Delivered" && o.status !== "Cancelled"
    );
    callback(list as any);
  };

  outlets.forEach(({ bid, oid, name, lat, lng, phone, riderAcceptanceRadius, backupCode }) => {
    const ordersPath = dbPaths.orders(bid, oid);
    const q = query(ref(db, ordersPath), orderByChild("assignedRider"), equalTo(riderEmail.toLowerCase()));
    const handler = onValue(
      q,
      (snap) => {
        const val = snap.val() || {};
        Object.keys(cache).forEach((key) => {
          if (cache[key].bid === bid && cache[key].oid === oid) delete cache[key];
        });
        Object.entries(val).forEach(([orderId, data]) => {
          cache[`${bid}:${oid}:${orderId}`] = {
            ...(data as RiderOrder),
            id: orderId,
            bid,
            oid,
            outletName: name,
            outletPhone: (data as any).outletPhone || phone,
            outletLat: lat,
            outletLng: lng,
            riderAcceptanceRadius,
            backupCode,
          };
        });
        emit();
      },
      (err) => onError?.(err as unknown as Error)
    );
    unsubs.push(() => off(q, "value", handler));
  });

  return () => unsubs.forEach((fn) => fn());
}

export function subscribeOrderHistory(
  outlets: OutletInfo[],
  riderEmail: string,
  callback: (orders: Array<RiderOrder & { bid: string; oid: string; outletName: string }>) => void,
  onError?: (err: Error) => void
) {
  const cache: Record<string, any> = {};
  const unsubs: Array<() => void> = [];

  const emit = () => {
    const list = Object.values(cache)
      .filter((o: any) => o.status === "Delivered")
      .sort((a: any, b: any) => (b.deliveredAt || 0) - (a.deliveredAt || 0));
    callback(list as any);
  };

  outlets.forEach(({ bid, oid, name }) => {
    const ordersPath = dbPaths.orders(bid, oid);
    const q = query(ref(db, ordersPath), orderByChild("assignedRider"), equalTo(riderEmail.toLowerCase()));
    const handler = onValue(
      q,
      (snap) => {
        const val = snap.val() || {};
        Object.keys(cache).forEach((key) => {
          if (cache[key].bid === bid && cache[key].oid === oid) delete cache[key];
        });
        Object.entries(val).forEach(([orderId, data]) => {
          cache[`${bid}:${oid}:${orderId}`] = { ...(data as RiderOrder), id: orderId, bid, oid, outletName: name };
        });
        emit();
      },
      (err) => onError?.(err as unknown as Error)
    );
    unsubs.push(() => off(q, "value", handler));
  });

  return () => unsubs.forEach((fn) => fn());
}

/** ─── Accept order — atomic transaction (PRD §12.1) ─────────────────────── */

export async function acceptOrder(params: {
  bid: string;
  oid: string;
  orderId: string;
  riderEmail: string;
  riderUid: string;
  riderPhone: string;
  riderName: string;
  riderLat: number;
  riderLng: number;
  outletLat: number;
  outletLng: number;
  customerPhone?: string;
}): Promise<void> {
  const { bid, oid, orderId, riderEmail, riderUid, riderPhone, riderName, riderLat, riderLng, outletLat, outletLng, customerPhone } =
    params;

  if (outletLat && outletLng) {
    assertProximity(riderLat, riderLng, outletLat, outletLng, PROXIMITY.ACCEPT_ORDER_KM);
  }

  const orderPath = dbPaths.singleOrder(bid, oid, orderId);
  const result = await runTransaction(ref(db, orderPath), (current) => {
    if (!current) return current; // order vanished — abort
    if (current.assignedRider) return; // already taken — abort transaction
    const initialOTP = Math.floor(1000 + Math.random() * 9000).toString();
    return {
      ...current,
      deliveryOTP: initialOTP,
      otp: initialOTP, // legacy field — always write both
      assignedRider: riderEmail.toLowerCase(),
      riderId: riderUid,
      riderPhone: riderPhone || "",
      acceptedAt: Date.now(),
      status: current.status === "Cooked" || current.status === "Preparing" ? current.status : "Ready",
      statusUpdatedAt: Date.now(),
      statusUpdatedBy: riderUid,
    };
  });

  if (!result.committed) {
    throw new OrderTakenError();
  }

  try {
    localStorage.setItem("activeOrderId", orderId);
  } catch {
    /* ignore */
  }

  if (customerPhone) {
    await whatsappService.sendAccepted(bid, oid, customerPhone, riderName, orderId).catch(() => {});
  }
}

/** ─── Reached outlet (PRD §12.3 proximity) ───────────────────────────── */

export async function markReachedOutlet(params: {
  bid: string;
  oid: string;
  orderId: string;
  riderUid: string;
  riderLat: number;
  riderLng: number;
  outletLat: number;
  outletLng: number;
}): Promise<void> {
  const { bid, oid, orderId, riderUid, riderLat, riderLng, outletLat, outletLng } = params;
  if (outletLat && outletLng) {
    assertProximity(riderLat, riderLng, outletLat, outletLng, PROXIMITY.REACHED_OUTLET_KM);
  }
  await update(ref(db, dbPaths.singleOrder(bid, oid, orderId)), {
    arrivedAtRestaurantAt: serverTimestamp(),
    statusUpdatedAt: serverTimestamp(),
    statusUpdatedBy: riderUid,
  });
}

/** ─── Confirm pickup (0.3km gate) ─────────────────────────────────────── */

export async function confirmPickup(params: {
  bid: string;
  oid: string;
  orderId: string;
  riderUid: string;
  riderLat: number;
  riderLng: number;
  outletLat: number;
  outletLng: number;
  riderName: string;
  riderPhone: string;
  customerPhone?: string;
}): Promise<void> {
  const { bid, oid, orderId, riderUid, riderLat, riderLng, outletLat, outletLng, riderName, riderPhone, customerPhone } =
    params;
  if (outletLat && outletLng) {
    assertProximity(riderLat, riderLng, outletLat, outletLng, PROXIMITY.CONFIRM_PICKUP_KM);
  }
  await update(ref(db, dbPaths.singleOrder(bid, oid, orderId)), {
    status: "Out for Delivery",
    pickedUpAt: serverTimestamp(),
    statusUpdatedAt: serverTimestamp(),
    statusUpdatedBy: riderUid,
  });
  if (customerPhone) {
    await whatsappService.sendPickedUp(bid, oid, customerPhone, riderName, riderPhone, orderId).catch(() => {});
  }
}

/** ─── Reached drop location ────────────────────────────────────────────── */

export async function markReachedDrop(params: {
  bid: string;
  oid: string;
  orderId: string;
  riderUid: string;
  riderLat: number;
  riderLng: number;
  dropLat: number;
  dropLng: number;
  radiusKm?: number;
  customerPhone?: string;
  existingOtp?: string;
}): Promise<{ otp: string }> {
  const { bid, oid, orderId, riderUid, riderLat, riderLng, dropLat, dropLng, radiusKm, customerPhone, existingOtp } =
    params;
  assertProximity(riderLat, riderLng, dropLat, dropLng, radiusKm || PROXIMITY.DEFAULT_DROP_RADIUS_KM);

  const otp = existingOtp && /^\d{4}$/.test(existingOtp) ? existingOtp : Math.floor(1000 + Math.random() * 9000).toString();

  await update(ref(db, dbPaths.singleOrder(bid, oid, orderId)), {
    status: "Reached Drop Location",
    reachedDropAt: serverTimestamp(),
    statusUpdatedAt: serverTimestamp(),
    statusUpdatedBy: riderUid,
    deliveryOTP: otp,
    otp,
  });

  if (customerPhone) {
    await whatsappService.sendReachedDrop(bid, oid, customerPhone, orderId).catch(() => {});
    await whatsappService.sendOtp(bid, oid, customerPhone, orderId, otp).catch(() => {});
  }

  return { otp };
}

/** ─── OTP verification with rate limiting (PRD §12.4) ───────────────────── */

export async function verifyOtp(params: {
  bid: string;
  oid: string;
  orderId: string;
  enteredOtp: string;
  actualOtp: string;
  backupCode?: string;
  isAdmin?: boolean;
}): Promise<{ success: boolean; verifiedBy: "OTP" | "ADMIN_FALLBACK"; attemptsRemaining?: number }> {
  const { bid, oid, orderId, enteredOtp, actualOtp, backupCode, isAdmin } = params;
  const attemptsPath = dbPaths.otpAttempts(bid, oid, orderId);

  const existingSnap = await get(ref(db, attemptsPath));
  const existing = (existingSnap.val() as OtpAttemptRecord | null) || null;
  const now = Date.now();
  if (existing?.blockedUntil && existing.blockedUntil > now) {
    throw new OtpBlockedError(existing.blockedUntil - now);
  }

  const isCorrect = enteredOtp === actualOtp;
  const isAdminOverride = Boolean(isAdmin && backupCode && enteredOtp === backupCode);

  if (isCorrect || isAdminOverride) {
    await remove(ref(db, attemptsPath));
    return { success: true, verifiedBy: isCorrect ? "OTP" : "ADMIN_FALLBACK" };
  }

  const result = await runTransaction(ref(db, attemptsPath), (current) => {
    const data: OtpAttemptRecord = current || { count: 0, lastTry: 0, blockedUntil: 0, lastResend: 0, resendCount: 0 };
    data.count = (data.count || 0) + 1;
    data.lastTry = now;
    if (data.count >= OTP_LIMITS.MAX_ATTEMPTS) {
      data.blockedUntil = now + OTP_LIMITS.BLOCK_DURATION_MS;
    }
    return data;
  });

  const updated = result.snapshot.val() as OtpAttemptRecord;
  if (updated?.blockedUntil && updated.blockedUntil > now) {
    throw new OtpBlockedError(updated.blockedUntil - now);
  }

  return {
    success: false,
    verifiedBy: "OTP",
    attemptsRemaining: Math.max(0, OTP_LIMITS.MAX_ATTEMPTS - (updated?.count || 0)),
  };
}

export async function resendOtp(params: {
  bid: string;
  oid: string;
  orderId: string;
  customerPhone?: string;
}): Promise<{ otp: string }> {
  const { bid, oid, orderId, customerPhone } = params;
  const attemptsPath = dbPaths.otpAttempts(bid, oid, orderId);
  const snap = await get(ref(db, attemptsPath));
  const existing = (snap.val() as OtpAttemptRecord | null) || null;
  const now = Date.now();

  if (existing?.lastResend && now - existing.lastResend < OTP_LIMITS.RESEND_COOLDOWN_MS) {
    const remaining = OTP_LIMITS.RESEND_COOLDOWN_MS - (now - existing.lastResend);
    throw new Error(`Wait ${Math.ceil(remaining / 1000)}s before resending.`);
  }

  const newOtp = Math.floor(1000 + Math.random() * 9000).toString();
  await update(ref(db, dbPaths.singleOrder(bid, oid, orderId)), { deliveryOTP: newOtp, otp: newOtp });
  await update(ref(db, attemptsPath), {
    lastResend: now,
    resendCount: (existing?.resendCount || 0) + 1,
  });

  if (customerPhone) {
    await whatsappService.sendOtp(bid, oid, customerPhone, orderId, newOtp).catch(() => {});
  }

  return { otp: newOtp };
}

/** ─── Payment complete → wallet + ledger + stats (PRD §12.6) ────────────── */

export async function completeDelivery(params: {
  bid: string;
  oid: string;
  orderId: string;
  riderId: string;
  deliveryFee: number;
  outletName: string;
  paymentMethod: "cod" | "upi" | "card" | "wallet";
  verifiedBy: "OTP" | "ADMIN_FALLBACK";
}): Promise<{ txId: string }> {
  const { bid, oid, orderId, riderId, deliveryFee, outletName, paymentMethod, verifiedBy } = params;

  await update(ref(db, dbPaths.singleOrder(bid, oid, orderId)), {
    status: "Delivered",
    deliveredAt: serverTimestamp(),
    verifiedBy,
    paymentCollected: true,
    paymentMethod: paymentMethod.toUpperCase(),
    otpVerifiedAt: serverTimestamp(),
  });

  const txId = `RDX_${Date.now()}_${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  await set(ref(db, `${dbPaths.riderLedger(riderId)}/${txId}`), {
    txId,
    orderId,
    amount: deliveryFee,
    type: "EARNING",
    description: `Delivery Fee for Order #${orderId}`,
    timestamp: serverTimestamp(),
    outlet: outletName,
    method: paymentMethod.toUpperCase(),
  });

  await runTransaction(ref(db, dbPaths.riderWallet(riderId)), (current) => {
    const data = current || { balance: 0, totalEarned: 0 };
    return {
      balance: (data.balance || 0) + deliveryFee,
      totalEarned: (data.totalEarned || 0) + deliveryFee,
      lastTx: txId,
      lastTxAt: Date.now(),
    };
  });

  await runTransaction(ref(db, dbPaths.riderStats(riderId)), (current) => {
    if (!current) return { totalOrders: 1, totalEarnings: deliveryFee, deliveriesToday: 1, earningsToday: deliveryFee };
    return {
      ...current,
      totalOrders: (current.totalOrders || 0) + 1,
      totalEarnings: (current.totalEarnings || 0) + deliveryFee,
      deliveriesToday: (current.deliveriesToday || 0) + 1,
      earningsToday: (current.earningsToday || 0) + deliveryFee,
    };
  });

  try {
    localStorage.removeItem("activeOrderId");
    localStorage.removeItem("activeOrderData");
  } catch {
    /* ignore */
  }

  return { txId };
}

export function subscribeRiderStats(uid: string, callback: (stats: any) => void, onError?: (err: Error) => void) {
  const statsRef = ref(db, dbPaths.riderStats(uid));
  const handler = onValue(
    statsRef,
    (snap) => {
      callback(snap.val() || { totalOrders: 0, totalEarnings: 0, deliveriesToday: 0, earningsToday: 0 });
    },
    (err) => onError?.(err as unknown as Error)
  );
  return () => off(statsRef, "value", handler);
}
