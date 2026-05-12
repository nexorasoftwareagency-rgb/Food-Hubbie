/**
 * ============================================================
 * FOODHUBBIE SAAS — Order Status Monitor
 * ============================================================
 * Listens for order status changes in Firebase and sends
 * real-time WhatsApp notifications to customers and riders.
 */

const { db, BUSINESS_ID, OUTLET_ID, resolvePath, getData } = require('./firebase');
const { formatJid } = require('../shared/utils');

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
      processedStatus[snap.key] = order.status;
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

/**
 * Sends notifications based on the status.
 */
async function handleStatusUpdate(sock, orderId, order, isNew = false) {
  const currentStatus = order.status || "Placed";
  
  if (processedStatus[orderId] === currentStatus && !isNew) return;
  processedStatus[orderId] = currentStatus;

  console.log(`[Monitor] Order #${orderId} status changed to: ${currentStatus}`);

  const customerJid = order.whatsappNumber || formatJid(order.phone);
  if (!customerJid) return;

  const botSettings = await getData('settings/Bot') || {};
  let msg = "";
  let img = null;

  switch (currentStatus) {
    case "Confirmed":
      msg = `✅ *ORDER CONFIRMED!* 🎊\n━━━━━━━━━━━━━━━━━━━━\nYour order #${orderId.slice(-6)} has been confirmed and is being prepared! 👨‍🍳\n\n💰 *Total:* ₹${order.total}`;
      img = botSettings.imgConfirmed;
      break;

    case "Preparing":
      msg = `👨‍🍳 *PREPARING YOUR MEAL* 🔥\n━━━━━━━━━━━━━━━━━━━━\nChef is working on your order #${orderId.slice(-6)}! It'll be ready soon.`;
      img = botSettings.imgPreparing;
      break;

    case "Out for Delivery":
    case "Picked Up":
      const otp = order.otp || order.deliveryOTP || "N/A";
      msg = `🛵 *OUT FOR DELIVERY!* 🚀\n━━━━━━━━━━━━━━━━━━━━\nOur rider is on the way! 🛵💨\n\n🆔 *Order:* #${orderId.slice(-6)}\n🔑 *OTP:* ${otp}\n💰 *Total:* ₹${order.total}\n\n_Please share the OTP ONLY with the rider._`;
      img = botSettings.imgOut;
      break;

    case "Delivered":
      msg = `✅ *DELIVERED!* 🍕❤️\n━━━━━━━━━━━━━━━━━━━━\nEnjoy your delicious meal! 🙏\n\n_Thank you for choosing Foodhubbie._`;
      img = botSettings.imgDelivered;
      break;

    case "Cancelled":
      msg = `❌ *ORDER CANCELLED*\n━━━━━━━━━━━━━━━━━━━━\nWe're sorry, your order #${orderId.slice(-6)} has been cancelled.`;
      break;
  }

  if (msg) {
    try {
      if (img) {
        await sock.sendMessage(customerJid, { image: { url: img }, caption: msg });
      } else {
        await sock.sendMessage(customerJid, { text: msg });
      }
    } catch (err) {
      console.error(`[Monitor] Failed to notify customer ${customerJid}:`, err.message);
    }
  }
}

module.exports = {
  initStatusMonitor
};
