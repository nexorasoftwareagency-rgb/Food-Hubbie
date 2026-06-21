/**
 * ============================================================
 * FOODHUBBIE SAAS — Scheduled Reports Cron (tenant-aware)
 * ============================================================
 * Sends daily / weekly / monthly summary reports to the store
 * owner via WhatsApp for each registered tenant.
 *
 * SCHEDULE (all times in IST, UTC+5:30):
 *   - Daily   : 21:30 IST — summary of today's orders
 *   - Weekly  : Monday 09:00 IST — previous Monday→Sunday
 *   - Monthly : 1st of month 09:00 IST — previous month
 *
 * Crash safety:
 *   - Last-sent timestamps persist to
 *     `system/report_logs/{businessId}_{outletId}/{slot}/lastSent`
 *   - On restart the cron checks the timestamp; if the slot's
 *     window is still "in the past and un-sent", it sends and
 *     marks complete. If the next slot has not yet arrived, it
 *     waits.
 *
 * Tenant lifecycle:
 *   - `registerTenant(sock, tenant)` — call once connection opens.
 *   - `deregisterTenant(tenant)` — call on socket close.
 *   - Internally one `setInterval(60s)` ticks and fans out to all
 *     registered tenants.
 * ============================================================
 */

const { db, tenantContext } = require('./firebase');
const { admin } = require('./firebase');

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

const SLOTS = {
  daily:   { hour: 21, minute: 30, windowDays: 1,   title: 'Daily Report' },
  weekly:  { hour: 9,  minute: 0,  windowDays: 7,   title: 'Weekly Report', weekday: 1 /* Mon */ },
  monthly: { hour: 9,  minute: 0,  windowDays: null /* computed from prev month */, title: 'Monthly Report', dayOfMonth: 1 }
};

// 60s tick keeps the clock drift negligible and matches Roshani's cadence.
const TICK_MS = 60 * 1000;

const registered = new Map(); // tenantKey -> { sock, tenant, inFlight }

function tenantKey(t) { return `${t.businessId}/${t.outletId}`; }

function getISTParts(d = new Date()) {
  const ist = new Date(d.getTime() + IST_OFFSET_MS);
  return {
    year: ist.getUTCFullYear(),
    month: ist.getUTCMonth(),        // 0-11
    day: ist.getUTCDate(),           // 1-31
    hour: ist.getUTCHours(),
    minute: ist.getUTCMinutes(),
    weekday: ist.getUTCDay(),        // 0=Sun..6=Sat
    iso: ist.toISOString()
  };
}

function istDateString(d) {
  return new Date(d.getTime() + IST_OFFSET_MS).toISOString().split('T')[0];
}

function pad(n) { return n.toString().padStart(2, '0'); }

function fmtINR(n) {
  const v = Math.round(Number(n) || 0);
  return '₹' + v.toLocaleString('en-IN');
}

/**
 * Compute the IST [start, end) epoch-ms window for a slot. End is exclusive.
 * `now` is a Date instance.
 */
function computeWindow(slot, now) {
  const istNow = getISTParts(now);
  const start = new Date(now.getTime() + IST_OFFSET_MS);
  start.setUTCHours(0, 0, 0, 0);
  const startMs = start.getTime() - IST_OFFSET_MS;

  let endMs;
  if (slot === 'daily') {
    endMs = startMs + 24 * 60 * 60 * 1000;
  } else if (slot === 'weekly') {
    // Previous Monday 00:00 IST → today 00:00 IST
    const daysBack = (istNow.weekday === 0 ? 7 : istNow.weekday); // 1..7
    endMs = startMs;
    start.setUTCDate(start.getUTCDate() - daysBack);
    const startBack = start.getTime() - IST_OFFSET_MS;
    return { startMs: startBack, endMs, label: `Last ${daysBack} day${daysBack>1?'s':''}` };
  } else if (slot === 'monthly') {
    // Previous calendar month 1st 00:00 IST → this month 1st 00:00 IST
    const thisMonthStart = new Date(startMs + IST_OFFSET_MS);
    thisMonthStart.setUTCDate(1);
    thisMonthStart.setUTCHours(0, 0, 0, 0);
    const thisMonthStartMs = thisMonthStart.getTime() - IST_OFFSET_MS;
    const prevMonthStart = new Date(thisMonthStartMs);
    prevMonthStart.setUTCMonth(prevMonthStart.getUTCMonth() - 1);
    return {
      startMs: prevMonthStart.getTime(),
      endMs: thisMonthStartMs,
      label: `${prevMonthStart.toLocaleString('en-US', { month: 'long', timeZone: 'UTC' })} ${prevMonthStart.getUTCFullYear()}`
    };
  }
  return { startMs, endMs, label: 'Today' };
}

/**
 * Aggregate orders in a window.
 * `ordersObj` is the raw RTDB object of {orderId: orderData}.
 */
function aggregateOrders(ordersObj, windowStartMs, windowEndMs) {
  const counts = { total: 0, delivered: 0, cancelled: 0, pending: 0 };
  const revenue = { total: 0, delivered: 0 };
  const byHour = new Array(24).fill(0);
  const items = {};
  const paymentMethods = {};

  for (const o of Object.values(ordersObj || {})) {
    if (!o || !o.createdAt) continue;
    const t = new Date(o.createdAt).getTime();
    if (isNaN(t)) continue;
    if (t < windowStartMs || t >= windowEndMs) continue;

    counts.total++;
    const status = String(o.status || '').toLowerCase();
    if (status === 'delivered') counts.delivered++;
    else if (status === 'cancelled') counts.cancelled++;
    else counts.pending++;

    const total = Number(o.total || 0);
    revenue.total += total;
    if (status === 'delivered') revenue.delivered += total;

    const hr = getISTParts(new Date(t)).hour;
    byHour[hr] += total;

    const pm = String(o.paymentMethod || 'unknown');
    paymentMethods[pm] = (paymentMethods[pm] || 0) + 1;

    // Items (handles both array `cart` and object `items`)
    const itemsList = Array.isArray(o.cart) ? o.cart
      : (o.items && typeof o.items === 'object') ? Object.values(o.items)
      : [];
    for (const it of itemsList) {
      const name = it.name || it.item || 'Item';
      if (!items[name]) items[name] = { qty: 0, revenue: 0 };
      items[name].qty += Number(it.qty || 1);
      items[name].revenue += Number(it.price || 0) * Number(it.qty || 1);
    }
  }

  const topItems = Object.entries(items)
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  return { counts, revenue, byHour, topItems, paymentMethods };
}

function formatReport(slot, window, agg, generatedAt) {
  const istStr = `${pad(generatedAt.hour)}:${pad(generatedAt.minute)} IST`;
  let body = `📊 *${SLOTS[slot].title}* — ${window.label}\n`;
  body += `⏰ Generated: ${istStr}\n\n`;
  body += `*Orders*\n`;
  body += `• Total: ${agg.counts.total}\n`;
  body += `• Delivered: ${agg.counts.delivered}\n`;
  body += `• Cancelled: ${agg.counts.cancelled}\n`;
  body += `• In-progress: ${agg.counts.pending}\n\n`;
  body += `*Revenue*\n`;
  body += `• All orders: ${fmtINR(agg.revenue.total)}\n`;
  body += `• Delivered only: ${fmtINR(agg.revenue.delivered)}\n\n`;
  if (agg.topItems.length) {
    body += `*Top Items*\n`;
    agg.topItems.forEach((it, i) => {
      body += `${i+1}. ${it.name} — ${it.qty}× (${fmtINR(it.revenue)})\n`;
    });
    body += '\n';
  }
  const pmEntries = Object.entries(agg.paymentMethods);
  if (pmEntries.length) {
    body += `*Payments*\n`;
    pmEntries.forEach(([m, c]) => { body += `• ${m}: ${c}\n`; });
  }
  return body;
}

/**
 * Persist last-sent timestamp for a slot. Uses admin SDK to write outside
 * the tenant scope (reports live in system/report_logs).
 */
async function markSlotSent(tenant, slot) {
  const k = tenantKey(tenant).replace(/\//g, '_');
  return db.ref(`system/report_logs/${k}/${slot}/lastSent`).set(admin.database.ServerValue.TIMESTAMP);
}

async function getLastSent(tenant, slot) {
  const k = tenantKey(tenant).replace(/\//g, '_');
  const snap = await db.ref(`system/report_logs/${k}/${slot}/lastSent`).once('value');
  return snap.val() || 0;
}

/**
 * Should we send the slot right now? Returns the window if yes, else null.
 * - Daily: send if hour:minute match AND we haven't sent today (IST date).
 * - Weekly: send if Mon 09:00 matches AND we haven't sent this Mon (IST week).
 * - Monthly: send if 1st 09:00 matches AND we haven't sent this month.
 */
async function shouldSend(tenant, slot, now) {
  const def = SLOTS[slot];
  const istNow = getISTParts(now);
  if (istNow.hour !== def.hour || istNow.minute < def.minute || istNow.minute >= def.minute + 2) {
    return null; // not the firing minute (allow 2-min window for ticks)
  }
  if (slot === 'weekly' && istNow.weekday !== 1) return null;
  if (slot === 'monthly' && istNow.day !== 1) return null;

  const last = await getLastSent(tenant, slot);
  const todayMs = new Date(`${istNow.year}-${pad(istNow.month+1)}-${pad(istNow.day)}T00:00:00+05:30`).getTime();
  if (slot === 'daily' && last >= todayMs) return null;
  if (slot === 'weekly') {
    // week starts Monday
    const monday = new Date(todayMs - (istNow.weekday === 0 ? 6 : istNow.weekday - 1) * 86400000);
    if (last >= monday.getTime()) return null;
  }
  if (slot === 'monthly') {
    const monthStart = new Date(`${istNow.year}-${pad(istNow.month+1)}-01T00:00:00+05:30`).getTime();
    if (last >= monthStart) return null;
  }
  return computeWindow(slot, now);
}

async function runSlotForTenant(slot, sock, tenant, t) {
  const now = new Date();
  const window = await shouldSend(tenant, slot, now);
  if (!window) return;

  try {
    const ordersSnap = await db.ref(t.resolvePath('orders')).once('value');
    const agg = aggregateOrders(ordersSnap.val(), window.startMs, window.endMs);

    // Try to find a recipient: settings.Store.reportPhone → tenant's own phone
    let recipient = null;
    try {
      const storeSnap = await db.ref(t.resolvePath('settings/Store/reportPhone')).once('value');
      recipient = storeSnap.val();
    } catch (_) { /* noop */ }
    if (!recipient) recipient = tenant.phone;
    if (!recipient) {
      console.warn(`[Reports] [${tenant.label}] No report recipient configured (settings.Store.reportPhone or tenant phone)`);
      return;
    }
    const jid = String(recipient).replace(/[^0-9]/g, '') + '@s.whatsapp.net';

    const body = formatReport(slot, window, agg, getISTParts(now));
    await sock.sendMessage(jid, { text: body });
    await markSlotSent(tenant, slot);
    console.log(`[Reports] [${tenant.label}] Sent ${slot} report to ${recipient}`);
  } catch (e) {
    console.error(`[Reports] [${tenant.label}] ${slot} report failed:`, e.message);
  }
}

async function tickAll() {
  for (const [key, entry] of registered.entries()) {
    if (entry.inFlight) continue;
    if (entry.sock?.ws?.readyState !== 1) continue; // not OPEN
    entry.inFlight = true;
    try {
      const t = tenantContext(entry.tenant);
      for (const slot of Object.keys(SLOTS)) {
        try { await runSlotForTenant(slot, entry.sock, entry.tenant, t); } catch (e) {
          console.error(`[Reports] [${entry.tenant.label}] slot=${slot}:`, e.message);
        }
      }
    } finally {
      entry.inFlight = false;
    }
  }
}

let _interval = null;
function ensureTicker() {
  if (_interval) return;
  _interval = setInterval(() => { tickAll().catch(() => null); }, TICK_MS);
  _interval.unref?.();
  console.log('[Reports] Cron ticker started (every 60s, IST 21:30 daily / Mon 09:00 weekly / 1st 09:00 monthly)');
}

function registerTenant(sock, tenant) {
  const k = tenantKey(tenant);
  registered.set(k, { sock, tenant, inFlight: false });
  ensureTicker();
  console.log(`[Reports] [${tenant.label}] Registered for scheduled reports`);
}

function deregisterTenant(tenant) {
  const k = tenantKey(tenant);
  registered.delete(k);
  if (registered.size === 0 && _interval) {
    clearInterval(_interval);
    _interval = null;
    console.log('[Reports] No tenants registered — ticker stopped');
  }
}

// Manual trigger (for "send now" admin action). Not wired in this PR but
// exported for use by an admin command later.
async function triggerReport(tenant, slot) {
  const k = tenantKey(tenant);
  const entry = registered.get(k);
  if (!entry) throw new Error(`Tenant ${k} not registered (socket not open)`);
  const t = tenantContext(tenant);
  const window = computeWindow(slot, new Date());
  const ordersSnap = await db.ref(t.resolvePath('orders')).once('value');
  const agg = aggregateOrders(ordersSnap.val(), window.startMs, window.endMs);
  return formatReport(slot, window, agg, getISTParts(new Date()));
}

module.exports = { registerTenant, deregisterTenant, triggerReport, SLOTS, getISTParts, computeWindow, aggregateOrders, formatReport };
