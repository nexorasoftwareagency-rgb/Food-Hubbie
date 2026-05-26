/**
 * ============================================================
 * FOODHUBBIE SAAS — Order Status Monitor
 * ============================================================
 * Listens for order status changes in Firebase and sends
 * real-time WhatsApp notifications to customers and riders.
 */

const { db, admin, BUSINESS_ID, OUTLET_ID, resolvePath, getData } = require('./firebase');
const { formatJid } = require('../shared/utils');
const { notifyAdmins } = require('../shared/push-notifications');

// Track processed statuses to avoid duplicate notifications
const processedStatus = {};

/**
 * Initializes listeners for the specific outlet.
 */
function initStatusMonitor(sock) {
  const path = resolvePath('orders');
  console.log(`[Monitor] Listening for status changes at: ${path}`);

  const orderRef = db.ref(path);

  // Handle existing/new orders
  orderRef.on('child_added', (snap) => {
    const order = snap.val();
    if (!order) return;
    
    // Mark as processed if it's an old order (more than 10 mins old)
    const createdAt = new Date(order.createdAt).getTime();
    if (Date.now() - createdAt > 600000) {
      processedStatus[snap.key] = { status: order.status, riderId: order.riderId || "", timestamp: Date.now() };
      return;
    }

    handleStatusUpdate(sock, snap.key, order, true);
  });

  // Handle status updates
  orderRef.on('child_changed', (snap) => {
    const order = snap.val();
    if (!order) return;
    handleStatusUpdate(sock, snap.key, order);
  });
}

// ─── Helper: extract items from order ─────────────────────────

function getOrderItems(order) {
  return Array.isArray(order.cart) ? order.cart :
         (Array.isArray(order.items) ? order.items :
         (order.items ? Object.values(order.items) : []));
}

// ─── Helper: in-app notification for riders ──────────────────

async function addRiderNotification(riderId, title, body) {
  if (!riderId) return;
  try {
    const notifId = "NOTIF" + Date.now();
    await db.ref(`riders/${riderId}/notifications/${notifId}`).set({
      id: notifId, title, body, type: "order", icon: "package",
      timestamp: Date.now(), read: false
    });
  } catch (err) {
    console.error("[Monitor] Rider notification error:", err.message);
  }
}

// ─── Helper: notify assigned rider ────────────────────────────

async function notifyRiderAssignment(sock, orderId, order) {
  try {
    if (!sock) return;
    const riderId = order.riderId || order.assignedRider;
    const riderPhone = order.riderPhone;
    if (!riderPhone) {
      console.warn(`[Monitor] Cannot notify rider assignment: no phone for #${orderId.slice(-6)}`);
      return;
    }
    const riderJid = formatJid(riderPhone);
    if (!riderJid) return;

    const items = getOrderItems(order);
    let itemsText = items.map(i => `• ${i.name || i.item || 'Item'} x${i.qty || i.quantity || 1}`).join('\n') || "_No items_";

    const mapsLink = (order.lat && order.lng)
      ? `https://www.google.com/maps?q=${order.lat},${order.lng}`
      : (order.locationLink || "");

    let msg = `🔔 *NEW ORDER ASSIGNED* 🔔\n━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `🆔 *Order ID:* #${orderId.slice(-6).toUpperCase()}\n\n`;
    msg += `🧾 *INVOICE:*\n${itemsText}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `💰 *Total:* ₹${order.total || 0} (${order.paymentMethod || 'N/A'})\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    msg += `👤 *Customer:* ${order.customerName || 'Customer'}\n`;
    msg += `📞 *Phone:* ${order.phone || 'N/A'}\n`;
    msg += `📍 *Address:* ${order.address || 'Not provided'}\n`;
    if (mapsLink) msg += `📍 *Location:* ${mapsLink}\n`;
    msg += `\n━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `🚀 *Please reach the outlet for pickup!*`;

    await sock.sendMessage(riderJid, { text: msg });
    console.log(`[Monitor] ✅ Rider assignment notified for #${orderId.slice(-6)}`);

    if (riderId) {
      await addRiderNotification(riderId, "New Order Assigned",
        `Order #${orderId.slice(-6).toUpperCase()} has been assigned to you.`);
    }
  } catch (err) {
    console.error("[Monitor] Rider assignment error:", err.message);
  }
}

// ─── Helper: broadcast pickup available to online riders ──────

async function broadcastPickupAvailable(sock, orderId, order) {
  try {
    if (!sock) return;
    const riders = await getData("riders") || {};
    const onlineRiders = Object.entries(riders)
      .map(([uid, data]) => ({ uid, ...data }))
      .filter(r => r.status === "online" && r.phone);

    if (onlineRiders.length === 0) {
      console.log(`[Monitor] No online riders to notify for #${orderId.slice(-6)}`);
      return;
    }

    const items = getOrderItems(order);
    let itemsText = items.map(i => `• ${i.name || i.item || 'Item'} x${i.qty || i.quantity || 1}`).join('\n') || "_No items_";

    const mapsLink = (order.lat && order.lng)
      ? `https://www.google.com/maps?q=${order.lat},${order.lng}`
      : (order.locationLink || "");

    let msg = `🔔 *PICKUP AVAILABLE* 🔔\n━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `🆔 *Order ID:* #${orderId.slice(-6).toUpperCase()}\n\n`;
    msg += `🧾 *INVOICE:*\n${itemsText}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `💰 *Total:* ₹${order.total || 0}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    msg += `👤 *Customer:* ${order.customerName || 'Customer'}\n`;
    msg += `📞 *Phone:* ${order.phone || 'N/A'}\n`;
    msg += `📍 *Address:* ${order.address || 'Not provided'}\n`;
    if (mapsLink) msg += `📍 *Location:* ${mapsLink}\n`;
    msg += `\n━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `🚀 *Go to Rider Portal to Accept!*`;

    for (const rider of onlineRiders) {
      try {
        const riderJid = formatJid(rider.phone);
        if (riderJid) {
          await sock.sendMessage(riderJid, { text: msg });
          await addRiderNotification(rider.uid, "New Pickup Available!",
            `Order #${orderId.slice(-6).toUpperCase()} is ready for pickup.`);
        }
      } catch (sendErr) {
        console.error(`[Monitor] Failed to notify rider ${rider.phone}:`, sendErr.message);
      }
    }
    console.log(`[Monitor] ✅ Pickup broadcast sent to ${onlineRiders.length} riders for #${orderId.slice(-6)}`);
  } catch (err) {
    console.error("[Monitor] Broadcast error:", err.message);
  }
}

/**
 * Sends notifications based on the status.
 */
async function handleStatusUpdate(sock, orderId, order, isNew = false) {
  const currentStatus = order.status || "Placed";
  const currentRider = order.riderId || "";
  const prev = processedStatus[orderId] || {};
  const prevStatus = prev.status;
  const prevRider = prev.riderId || "";
  const isRiderChanged = !!(currentRider && currentRider !== prevRider);

  // Skip if nothing changed (status same, rider same, not new)
  if (prevStatus === currentStatus && !isNew && !isRiderChanged) return;

  // Update tracking
  processedStatus[orderId] = { status: currentStatus, riderId: currentRider, timestamp: Date.now() };

  console.log(`[Monitor] Order #${orderId} status: ${prevStatus||'new'} → ${currentStatus}${isRiderChanged ? ' (rider changed)' : ''}`);

  // --- HANDLE RIDER ASSIGNMENT (separate from status change) ---
  if (isRiderChanged) {
    const riderStatuses = ["Placed", "Confirmed", "Preparing", "Cooked", "Ready", "Packed", "Out for Delivery", "Reached Drop Location", "Delivered"];
    console.log(`[Monitor] Rider change detected for #${orderId.slice(-6)}: ${prevRider||'none'} → ${currentRider}`);
    await notifyRiderAssignment(sock, orderId, order);
  }

  // --- NOTIFY ADMIN ON NEW ORDER ---
  if (isNew && currentStatus === "Placed") {
    const storeSettings = await getData('settings/Store') || {};
    const adminPhone = storeSettings.reportPhone;
    
    if (adminPhone) {
        const adminJid = formatJid(adminPhone);
        const items = getOrderItems(order);
        const orderSummary = items.length > 0 ? 
            items.map(i => `- ${i.qty || 1}x ${i.name || i.item || 'Item'}`).join('\n') :
            "_Items summary unavailable_";

        const adminMsg = `🔔 *NEW WEBSITE ORDER!* 🚀\n━━━━━━━━━━━━━━━━━━━━\n🆔 *Order:* #${orderId.slice(-6).toUpperCase()}\n👤 *Customer:* ${order.customerName || 'Guest'}\n📞 *Phone:* ${order.phone || 'N/A'}\n📍 *Address:* ${order.address || 'Counter Sale'}\n\n📦 *Items:*\n${orderSummary}\n\n💰 *Total:* ₹${order.total || 0}\n━━━━━━━━━━━━━━━━━━━━\n_Action required: Confirm order in Admin Dashboard._`;
        
        try {
            await sock.sendMessage(adminJid, { text: adminMsg });
            console.log(`[Monitor] Admin notified of new order #${orderId}`);
        } catch (err) {
            console.error(`[Monitor] Failed to notify admin ${adminJid}:`, err.message);
        }
    }

    // --- PUSH NOTIFICATION TO ADMIN ---
    notifyAdmins(admin, db, BUSINESS_ID, OUTLET_ID, {
        title: "🆕 New Website Order!",
        body: `Order #${orderId.slice(-6).toUpperCase()} from ${order.customerName} (₹${order.total})`,
        data: { orderId, type: "NEW_ORDER", outletId: OUTLET_ID }
    }).catch(e => console.error("Admin Push Error:", e));
  }

  // --- NOTIFY CUSTOMER ON STATUS CHANGE ---
  const customerJid = order.whatsappNumber || formatJid(order.phone);
  if (!customerJid) return;

  const botSettings = await getData('settings/Bot') || {};
  let msg = "";
  let img = null;

  switch (currentStatus) {
    case "Confirmed":
      msg = `✅ *ORDER CONFIRMED!* 🎊\n━━━━━━━━━━━━━━━━━━━━\nYour order #${orderId.slice(-6).toUpperCase()} has been confirmed and is being prepared! 👨‍🍳\n\n💰 *Total:* ₹${order.total}`;
      img = botSettings.imgConfirmed;
      break;

    case "Preparing":
      msg = `👨‍🍳 *PREPARING YOUR MEAL* 🔥\n━━━━━━━━━━━━━━━━━━━━\nChef is working on your order #${orderId.slice(-6).toUpperCase()}! It'll be ready soon.`;
      img = botSettings.imgPreparing;
      break;

    case "Cooked":
      msg = `🔥 *COOKING COMPLETE!* 🔥\n━━━━━━━━━━━━━━━━━━━━\nYour order #${orderId.slice(-6).toUpperCase()} has been cooked and is being packed! 🍱\n\n_Will be ready for pickup/delivery shortly._`;
      img = botSettings.imgCooked || botSettings.imgPreparing;
      break;

    case "Ready":
    case "Packed":
      msg = `📦 *ORDER READY!* ✨\n━━━━━━━━━━━━━━━━━━━━\nYour order #${orderId.slice(-6).toUpperCase()} is packed and ready! 🚀\n\n${order.riderName ? `🛵 *Rider:* ${order.riderName}` : "Waiting for rider assignment."}`;
      img = botSettings.imgReady || botSettings.imgCooked;
      break;

    case "Out for Delivery":
    case "Picked Up":
      if (!order.riderName) {
        console.log(`[Monitor] Skipping customer notification for #${orderId.slice(-6)} — no rider assigned yet.`);
        break;
      }
      const otp = order.otp || order.deliveryOTP || "N/A";
      const items2 = getOrderItems(order);
      const invoice = items2.length > 0 ?
        items2.map(i => `• ${i.qty || 1}x ${i.name || i.item || 'Item'} — ₹${(i.price || i.total || 0) * (i.qty || 1)}`).join('\n') :
        "_Items summary unavailable_";
      msg = `🛵 *OUT FOR DELIVERY!* 🚀\n━━━━━━━━━━━━━━━━━━━━\n🛵 *Rider:* ${order.riderName}\n📞 *Contact:* ${order.riderPhone || 'N/A'}\n🔑 *OTP:* ${otp}\n━━━━━━━━━━━━━━━━━━━━\n🧾 *INVOICE*\n${invoice}\n━━━━━━━━━━━━━━━━━━━━\n💰 *Total:* ₹${order.total}\n\n_Please share the OTP ONLY with the rider._`;
      img = botSettings.imgOut;
      break;

    case "Reached Drop Location":
      const otp2 = order.otp || order.deliveryOTP || "N/A";
      msg = `📍 *RIDER ARRIVED!* 🛵\n━━━━━━━━━━━━━━━━━━━━\nYour rider has reached the drop location with order #${orderId.slice(-6).toUpperCase()}! 🎯\n\n🔑 *OTP:* ${otp2}\n\n_Please share the OTP with the rider._`;
      img = botSettings.imgOut;
      break;

    case "Delivered":
      msg = `✅ *DELIVERED!* 🍕❤️\n━━━━━━━━━━━━━━━━━━━━\nEnjoy your delicious meal! 🙏\n\n_Thank you for choosing Foodhubbie._`;
      img = botSettings.imgDelivered;
      break;

    case "Cancelled":
      msg = `❌ *ORDER CANCELLED*\n━━━━━━━━━━━━━━━━━━━━\nWe're sorry, your order #${orderId.slice(-6).toUpperCase()} has been cancelled.`;
      break;
  }

  if (msg) {
    try {
      if (img) {
        await sock.sendMessage(customerJid, { image: { url: img }, caption: msg });
      } else {
        await sock.sendMessage(customerJid, { text: msg });
      }
      console.log(`[Monitor] ✅ ${currentStatus} notification sent to customer for #${orderId.slice(-6)}`);
    } catch (err) {
      console.error(`[Monitor] Failed to notify customer ${customerJid}:`, err.message);
    }
  }

  // --- RIDER BROADCAST (only if no rider assigned yet) ---
  if (!currentRider && !isRiderChanged && ["Cooked", "Ready", "Packed"].includes(currentStatus)) {
    await broadcastPickupAvailable(sock, orderId, order);
  }
}

module.exports = {
  initStatusMonitor
};
