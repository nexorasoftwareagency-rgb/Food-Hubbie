/**
 * ============================================================
 * FOODHUBBIE SAAS — WhatsApp State Machine Engine
 * ============================================================
 * Implements the interactive ordering flow with Global Discovery.
 */

const { getData, saveUserProfile, getUserProfile, setData, updateData, pushData, getGlobalData, BUSINESS_ID, OUTLET_ID, db } = require('./firebase');
const { formatJid, isShopOpen, calculateDistance, calculateDeliveryFee, generateOTP } = require('../shared/utils');
const { logBotAudit } = require('./audit');

// Session Cache (In-memory layer for performance with TTL eviction to prevent memory leaks)
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes
const sessionCache = new Map();

function getCachedSession(jid) {
  const entry = sessionCache.get(jid);
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    sessionCache.delete(jid);
    return null;
  }
  return entry.data;
}

function setCachedSession(jid, data) {
  sessionCache.set(jid, { data, expiry: Date.now() + SESSION_TTL_MS });
}

// Periodic cleanup every 10 minutes to evict expired sessions
setInterval(() => {
  const now = Date.now();
  for (const [jid, entry] of sessionCache) {
    if (now > entry.expiry) sessionCache.delete(jid);
  }
}, 10 * 60 * 1000);

/**
 * Persists user session to Firebase
 */
async function persistSession(jid, session) {
  try {
    // We store sessions in a dedicated path: system/botSessions/{BUSINESS_ID}/{OUTLET_ID}/{jid}
    // We sanitize the jid key for Firebase (replace . with ,)
    const safeJid = jid.replace(/\./g, ',');
    const path = `system/botSessions/${BUSINESS_ID}/${OUTLET_ID}/${safeJid}`;
    await setData(path, session);
    setCachedSession(jid, session);
  } catch (err) {
    console.error(`[Session] Failed to persist for ${jid}:`, err.message);
  }
}

/**
 * Loads user session from Firebase or Cache
 */
async function getSession(jid) {
  const cached = getCachedSession(jid);
  if (cached) return cached;
  
  try {
    const safeJid = jid.replace(/\./g, ',');
    const path = `system/botSessions/${BUSINESS_ID}/${OUTLET_ID}/${safeJid}`;
    const session = await getData(path);
    if (session) {
      setCachedSession(jid, session);
      return session;
    }
  } catch (err) {
    console.error(`[Session] Failed to load for ${jid}:`, err.message);
  }
  return null;
}

/**
 * Main message handler
 */
async function handleIncomingMessage(sock, m) {
  const senderJid = m.key.remoteJid;
  if (!senderJid.endsWith('@s.whatsapp.net')) return;

  const sender = senderJid.replace(/[^0-9]/g, '');
  const text = (m.message?.conversation || m.message?.extendedTextMessage?.text || '').trim();
  const location = m.message?.locationMessage;
  const pushName = m.pushName || "";

  // Initialize session (Load from DB if not in cache)
  let user = await getSession(senderJid);
  
  if (!user) {
    const profile = await getUserProfile(senderJid);
    user = {
      step: 'START',
      cart: [],
      current: {},
      activeOutlet: OUTLET_ID === 'GLOBAL' ? null : OUTLET_ID,
      activeBid: BUSINESS_ID,
      lastActivity: Date.now(),
      profile: profile || null,
      name: profile?.name || null,
      phone: profile?.phone || sender.slice(-10),
      address: profile?.address || null,
      location: profile?.location || null
    };
    setCachedSession(senderJid, user);
  }
  
  user.lastActivity = Date.now();

  // Rate limiting & reset handling
  if (text.toLowerCase() === 'reset' || text.toLowerCase() === 'menu') {
    user.step = 'START';
    user.cart = [];
    user.current = {};
    if (OUTLET_ID === 'GLOBAL') user.activeOutlet = null;
    await persistSession(senderJid, user);
    await sock.sendMessage(senderJid, { text: "🔄 *System Reset.* Reply with any message to start again." });
    
    // 🚀 AUDIT LOG
    await logBotAudit('BOT_RESET', { reason: text.toLowerCase() }, senderJid);
    return;
  }

  try {
    switch (user.step) {
      case 'START':
        await handleStart(sock, senderJid, user);
        break;

      case 'DISCOVERY_LOCATION':
        await handleDiscoveryLocation(sock, senderJid, user, location);
        break;

      case 'DISCOVERY_CATEGORY':
        await handleDiscoveryCategorySelection(sock, senderJid, user, text);
        break;

      case 'SELECT_OUTLET':
        await handleOutletSelection(sock, senderJid, user, text);
        break;

      case 'CATEGORY':
        await handleCategorySelection(sock, senderJid, user, text);
        break;

      case 'DISH':
        await handleDishSelection(sock, senderJid, user, text);
        break;

      case 'SIZE':
        await handleSizeSelection(sock, senderJid, user, text);
        break;

      case 'QUANTITY':
        await handleQuantitySelection(sock, senderJid, user, text);
        break;

      case 'CART_VIEW':
        await handleCartAction(sock, senderJid, user, text);
        break;

      case 'REUSE_PROFILE':
        await handleReuseProfile(sock, senderJid, user, text);
        break;

      case 'COLLECT_NAME':
        await handleNameCollection(sock, senderJid, user, text);
        break;

      case 'COLLECT_PHONE':
        await handlePhoneCollection(sock, senderJid, user, text);
        break;

      case 'COLLECT_ADDRESS':
        await handleAddressCollection(sock, senderJid, user, text);
        break;

      case 'LOCATION':
        await handleLocationReceived(sock, senderJid, user, location, text);
        break;

      case 'CONFIRM_PAY':
        await handleFinalCheckout(sock, senderJid, user, text);
        break;

      default:
        user.step = 'START';
        await handleStart(sock, senderJid, user);
        break;
    }
  } catch (err) {
    console.error(`[Bot Error] ${senderJid}:`, err);
    await sock.sendMessage(senderJid, { text: "❌ Sorry, something went wrong. Type *RESET* to try again." });
  }
}

// ─── Step Handlers ───────────────────────────────────────────

async function handleStart(sock, jid, user) {
  if (OUTLET_ID === 'GLOBAL' && !user.activeOutlet) {
    user.step = 'DISCOVERY_LOCATION';
    let msg = `✨ *WELCOME TO FOODHUBBIE* ✨\n\n`;
    msg += `Find the best flavors near you! 🍕🍰\n\n`;
    msg += `🌐 *BROWSE ONLINE:* https://foodhubbie.com\n`;
    msg += `_(Search all 20+ shops instantly!)_\n\n`;
    msg += `📍 *SHARE YOUR LOCATION* to find nearby outlets via Chat:\n\n`;
    msg += `1️⃣ Click 📎 or +\n2️⃣ Select 'Location'\n3️⃣ 'Send Current Location'`;
    return sock.sendMessage(jid, { text: msg });
  }
  
  // Single Outlet Mode or Outlet Already Selected
  await showMenu(sock, jid, user);
}

async function handleDiscoveryLocation(sock, jid, user, location) {
  if (!location) return sock.sendMessage(jid, { text: "⚠️ Please share your location using the WhatsApp location feature to find nearby shops." });

  const lat = location.degreesLatitude;
  const lng = location.degreesLongitude;
  user.location = { lat, lng };

  // Discover All Outlets within 10km and aggregate categories
  const businesses = await getGlobalData('businesses') || {};
  const nearbyOutlets = [];
  const categoryMap = {}; // { CategoryName: [OutletDetails] }
  
  Object.entries(businesses).forEach(([bid, biz]) => {
    if (biz.outlets) {
      Object.entries(biz.outlets).forEach(([oid, outlet]) => {
        const store = outlet.settings?.Store || {};
        const dist = calculateDistance(lat, lng, parseFloat(store.lat || 0), parseFloat(store.lng || 0));
        
        if (dist <= 10) {
          const outletInfo = { bid, oid, name: store.storeName || outlet.name, dist };
          nearbyOutlets.push(outletInfo);
          
          // Extract categories from this outlet
          const cats = outlet.categories || {};
          Object.values(cats).forEach(c => {
            if (c.name) {
              if (!categoryMap[c.name]) categoryMap[c.name] = [];
              categoryMap[c.name].push(outletInfo);
            }
          });
        }
      });
    }
  });

  if (nearbyOutlets.length === 0) {
    return sock.sendMessage(jid, { text: "❌ No outlets found within 10 kms of your location. Please try a different location!" });
  }

  // Store discovery data in session
  user.discoveryCategories = Object.keys(categoryMap).sort();
  user.categoryMap = categoryMap;

  let msg = `🤔 *WHAT WOULD YOU LIKE TO ORDER?*\n\n`;
  user.discoveryCategories.forEach((cat, i) => {
    msg += `${i + 1}️⃣  ${cat}\n`;
  });
  msg += `\n_Reply with a number to see shops_`;

  user.step = 'DISCOVERY_CATEGORY';
  await sock.sendMessage(jid, { text: msg });
}

async function handleDiscoveryCategorySelection(sock, jid, user, text) {
  const idx = parseInt(text) - 1;
  const selectedCat = user.discoveryCategories ? user.discoveryCategories[idx] : null;
  
  if (!selectedCat) return sock.sendMessage(jid, { text: "⚠️ Invalid selection. Please reply with a number from the list." });

  const outlets = user.categoryMap[selectedCat] || [];
  user.discoveryList = outlets.sort((a, b) => a.dist - b.dist);

  let msg = `📍 *SHOPS SERVING ${selectedCat.toUpperCase()}* 🏘️\n\n`;
  user.discoveryList.forEach((o, i) => {
    msg += `${i + 1}️⃣  *${o.name}* (${o.dist.toFixed(1)} km)\n`;
  });
  msg += `\n_Select a shop to view its menu_`;

  user.step = 'SELECT_OUTLET';
  await sock.sendMessage(jid, { text: msg });
}

async function handleOutletSelection(sock, jid, user, text) {
  const idx = parseInt(text) - 1;
  const selected = user.discoveryList ? user.discoveryList[idx] : null;
  
  if (!selected) return sock.sendMessage(jid, { text: "⚠️ Invalid selection. Please reply with a number from the list." });

  user.activeOutlet = selected.oid;
  user.activeBid = selected.bid;
  
  await sock.sendMessage(jid, { text: `✨ Entering *${selected.name}*...` });
  await showMenu(sock, jid, user);
}

async function showMenu(sock, jid, user) {
  const oid = user.activeOutlet;
  const store = await getData('settings/Store', oid);
  const botSettings = await getData('settings/Bot', oid) || {};
  
  if (store && !isShopOpen(store.shopOpenTime, store.shopCloseTime)) {
    user.activeOutlet = null; // Reset for global mode
    user.step = 'START';
    return sock.sendMessage(jid, { 
      text: `🌙 *${(store.storeName || 'Shop').toUpperCase()} IS CLOSED*\n\nHours: ${store.shopOpenTime || 'N/A'} - ${store.shopCloseTime || 'N/A'}\n\nType any message to find other open shops! 👋` 
    });
  }

  const categories = await getData('categories', oid);
  if (!categories) {
    user.step = 'START';
    return sock.sendMessage(jid, { text: "❌ This shop has no menu items available yet." });
  }

  user.categoryList = Object.entries(categories)
    .map(([id, val]) => ({ id, ...val }))
    .sort((a, b) => (a.order || 999) - (b.order || 999));

  const storeName = store.storeName || "Foodhubbie";
  let msg = `✨ *${storeName.toUpperCase()}* ✨\n`;
  msg += `🌐 *Order Online:* https://foodhubbie.com\n\n`;
  msg += `🍽️ *SELECT CATEGORY*\n\n`;

  user.categoryList.forEach((c, i) => {
    msg += `${i + 1}️⃣  ${c.name}\n`;
  });

  msg += `\n🛒 *9* View Cart\n${OUTLET_ID === 'GLOBAL' ? '0️⃣ *Change Shop* 🏘️' : ''}\n_Reply with a number to browse_`;

  user.step = 'CATEGORY';
  const menuImg = botSettings.menuImage || store.bannerImage;
  await sendImage(sock, jid, menuImg, msg);
}

async function handleCategorySelection(sock, jid, user, text) {
  const oid = user.activeOutlet;
  if (text === "0") {
    user.activeOutlet = null;
    user.step = 'START';
    return handleStart(sock, jid, user);
  }
  if (text === "9") return sendCartView(sock, jid, user);

  const idx = parseInt(text) - 1;
  const cat = user.categoryList[idx];
  if (!cat) return sock.sendMessage(jid, { text: "⚠️ Invalid category. Please reply with a number from the list." });

  const dishes = await getData('dishes', oid) || {};
  const inventory = await getData('inventory', oid) || {};

  user.dishList = Object.entries(dishes)
    .filter(([id, d]) => d.category === cat.name && d.available !== false)
    .map(([id, d]) => {
      const invItem = Object.values(inventory).find(inv => inv.name.toLowerCase() === d.name.toLowerCase());
      const stockCount = invItem ? (invItem.stock || 0) : 999;
      return { id, ...d, inStock: stockCount > 0 };
    })
    .sort((a, b) => (a.order || 999) - (b.order || 999));

  if (user.dishList.length === 0) return sock.sendMessage(jid, { text: "❌ No items in this category right now." });

  let dMsg = `🍽️ *${cat.name.toUpperCase()}*\n\n`;
  user.dishList.forEach((d, i) => {
    dMsg += `${i + 1}️⃣  *${d.name}* ${d.inStock ? "" : "— _(Sold Out)_ 🚫"}\n\n`;
  });
  dMsg += `🛒 *9* View Cart\n0️⃣ *Back to Categories* 🔙`;

  user.step = "DISH";
  await sendImage(sock, jid, cat.image, dMsg);
}

async function handleDishSelection(sock, jid, user, text) {
  if (text === "0") {
    return showMenu(sock, jid, user);
  }
  if (text === "9") return sendCartView(sock, jid, user);

  const idx = parseInt(text) - 1;
  const dish = user.dishList[idx];
  if (!dish) return sock.sendMessage(jid, { text: "⚠️ Invalid item. Please reply with a number from the list." });

  if (!dish.inStock) {
    return sock.sendMessage(jid, { text: `🚫 *SORRY!* *${dish.name}* is currently out of stock. Please select another item! 😋` });
  }

  user.current = { dish };
  user.sizeList = Object.entries(dish.sizes || { "Regular": dish.price });
  
  let sMsg = `📏 *SELECT SIZE*\n\n`;
  user.sizeList.forEach(([s, p], i) => {
    const price = typeof p === 'object' ? (p.price || 0) : p;
    sMsg += `${i + 1}️⃣  ${s} — ₹${price}\n`;
  });
  sMsg += `\n0️⃣ *Back* 🔙`;

  user.step = "SIZE";
  await sendImage(sock, jid, dish.image, sMsg);
}

async function handleSizeSelection(sock, jid, user, text) {
  if (text === "0") {
    user.step = 'CATEGORY';
    return sock.sendMessage(jid, { text: "🔙 Going back. Please reply with any message to see categories." });
  }

  const idx = parseInt(text) - 1;
  const sizeData = user.sizeList[idx];
  if (!sizeData) return sock.sendMessage(jid, { text: "⚠️ Invalid size. Please reply with a number from the list." });

  const [size, p] = sizeData;
  const price = typeof p === 'object' ? (p.price || 0) : p;
  
  user.current.size = size;
  user.current.unitPrice = price;
  user.current.addons = [];

  user.step = "QUANTITY";
  let qtyMsg = `🔢 *ENTER QUANTITY*\n\n`;
  qtyMsg += `How many *${user.current.dish.name} (${size})* would you like?\n\n`;
  qtyMsg += `_Example: 1, 2, 5, etc._\n`;
  qtyMsg += `0️⃣ *Back* 🔙`;
  await sock.sendMessage(jid, { text: qtyMsg });
}

async function handleQuantitySelection(sock, jid, user, text) {
  if (text === "0") {
    user.step = "SIZE";
    return sock.sendMessage(jid, { text: "🔙 Going back. Reply with any message to see sizes." });
  }

  const qty = parseInt(text);
  if (isNaN(qty) || qty < 1 || qty > 50) return sock.sendMessage(jid, { text: "⚠️ Please enter a valid quantity (1-50)." });

  user.cart.push({
    name: user.current.dish.name,
    size: user.current.size,
    unitPrice: user.current.unitPrice,
    addons: [],
    quantity: qty,
    total: user.current.unitPrice * qty,
    outletId: user.activeOutlet // Track which outlet this item belongs to
  });

  await sendCartView(sock, jid, user, true);
}

async function sendCartView(sock, jid, user, isAdded = false) {
  if (!user.cart || user.cart.length === 0) {
    let msg = `🛒 *YOUR CART IS EMPTY*\n\n1️⃣  *Browse Menu* 🍽️\n0️⃣  *Main Menu*`;
    user.step = "CATEGORY"; // Go back to browsing the active shop
    return sock.sendMessage(jid, { text: msg });
  }

  let subtotal = 0;
  let itemsLines = "";
  user.cart.forEach((item, i) => {
    subtotal += item.total;
    itemsLines += `${i + 1}. *${item.name}* (${item.size}) x${item.quantity} = ₹${item.total}\n`;
  });

  let msg = isAdded ? `✅ *ADDED TO CART!* 🛒\n\n` : `🛒 *YOUR CART*\n\n`;
  msg += itemsLines;
  msg += `\n💰 *Subtotal: ₹${subtotal}*\n\n`;
  msg += `1️⃣  *Add More Items* 🍕\n`;
  msg += `2️⃣  *Proceed to Checkout* 🚀\n`;
  msg += `3️⃣  *Clear Cart* 🗑️\n`;
  msg += `0️⃣  *Back* 🔙`;

  user.step = "CART_VIEW";
  await sock.sendMessage(jid, { text: msg });
}

async function handleCartAction(sock, jid, user, text) {
  if (text === "1") {
    return showMenu(sock, jid, user);
  }
  if (text === "2") {
    if (user.profile && user.profile.name) {
      user.step = "REUSE_PROFILE";
      let msg = `👤 *REUSE SAVED DETAILS?*\n\n`;
      msg += `Name: ${user.profile.name}\n`;
      msg += `Phone: ${user.profile.phone}\n`;
      msg += `Address: ${user.profile.address || "N/A"}\n\n`;
      msg += `1️⃣ Yes, use these\n`;
      msg += `2️⃣ No, enter new details`;
      return sock.sendMessage(jid, { text: msg });
    }
    user.step = "COLLECT_NAME";
    return sock.sendMessage(jid, { text: "👤 *STEP 1: ENTER YOUR FULL NAME*\n\n_Example: Rajesh Kumar_" });
  }
  if (text === "3") {
    user.cart = [];
    return showMenu(sock, jid, user);
  }
  if (text === "0") {
    return showMenu(sock, jid, user);
  }
}

async function handleReuseProfile(sock, jid, user, text) {
  if (text === "1") {
    user.name = user.profile.name;
    user.phone = user.profile.phone;
    user.address = user.profile.address;
    return sendLocationRequest(sock, jid, user);
  }
  user.step = "COLLECT_NAME";
  await sock.sendMessage(jid, { text: "👤 *ENTER YOUR FULL NAME*" });
}

async function handleNameCollection(sock, jid, user, text) {
  user.name = text;
  user.step = "COLLECT_PHONE";
  await sock.sendMessage(jid, { text: "📞 *ENTER YOUR 10-DIGIT MOBILE NUMBER*" });
}

async function handlePhoneCollection(sock, jid, user, text) {
  const phone = text.replace(/[^0-9]/g, '');
  if (phone.length < 10) return sock.sendMessage(jid, { text: "⚠️ Please enter a valid 10-digit number." });
  user.phone = phone;
  user.step = "COLLECT_ADDRESS";
  await sock.sendMessage(jid, { text: "🏠 *ENTER YOUR DELIVERY ADDRESS*\n\n_Landmark, House No, etc._" });
}

async function handleAddressCollection(sock, jid, user, text) {
  user.address = text;
  return sendLocationRequest(sock, jid, user);
}

async function sendLocationRequest(sock, jid, user) {
  user.step = "LOCATION";
  let msg = `📍 *SHARE YOUR LOCATION* 🌍\n\n`;
  msg += `Please share your *Live* or *Current* location to calculate delivery fee.\n\n`;
  msg += `1️⃣ Click 📎 or +\n2️⃣ Select 'Location'\n3️⃣ 'Send Current Location'`;
  await sock.sendMessage(jid, { text: msg });
}

async function handleLocationReceived(sock, jid, user, location, text) {
  if (!location) return sock.sendMessage(jid, { text: "⚠️ Please share your location using the WhatsApp location feature." });

  const oid = user.activeOutlet;
  user.location = { lat: location.degreesLatitude, lng: location.degreesLongitude };
  
  // Calculate delivery fee
  const store = await getData('settings/Store', oid) || {};
  const delSettings = await getData('settings/Delivery', oid) || {};
  
  const outletCoords = {
    lat: parseFloat(store.lat || 0),
    lng: parseFloat(store.lng || 0)
  };

  const dist = calculateDistance(user.location.lat, user.location.lng, outletCoords.lat, outletCoords.lng);
  
  let slabs = delSettings.slabs;
  if (!slabs || slabs.length === 0) {
    const globalSlabs = await getGlobalData('system/settings/delivery/slabs');
    if (globalSlabs && globalSlabs.length > 0) {
      slabs = globalSlabs.map(s => ({ km: s.upToKm, fee: s.fee }));
    }
  }

  const fee = calculateDeliveryFee(dist, slabs || [
    { km: 2, fee: 20 },
    { km: 5, fee: 40 },
    { km: 10, fee: 60 }
  ]);
  user.deliveryFee = fee;

  let subtotal = user.cart.reduce((s, i) => s + i.total, 0);
  let total = subtotal + fee;

  let sum = `🧾 *ORDER SUMMARY*\n━━━━━━━━━━━━━━━━━━━━\n`;
  user.cart.forEach(i => sum += `• ${i.name} x${i.quantity} = ₹${i.total}\n`);
  sum += `━━━━━━━━━━━━━━━━━━━━\n`;
  sum += `💰 Subtotal: ₹${subtotal}\n`;
  sum += `🚚 Delivery (${dist.toFixed(1)}km): ₹${fee}\n`;
  sum += `💵 *TOTAL: ₹${total}*\n`;
  sum += `💳 *Payment:* Cash on Delivery\n━━━━━━━━━━━━━━━━━━━━\n`;
  sum += `1️⃣ Confirm Order ✅\n2️⃣ Cancel ❌`;

  user.step = "CONFIRM_PAY";
  await sock.sendMessage(jid, { text: sum });
}

async function handleFinalCheckout(sock, jid, user, text) {
  const oid = user.activeOutlet;
  const bid = user.activeBid || BUSINESS_ID;

  if (text === "2") {
    return showMenu(sock, jid, user);
  }

  if (text === "1") {
    const orderId = `FH-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const subtotal = user.cart.reduce((s, i) => s + i.total, 0);
    const total = subtotal + (user.deliveryFee || 0);

    const finalOrder = {
      orderId,
      customerName: user.name,
      phone: user.phone,
      whatsappNumber: jid,
      address: user.address,
      lat: user.location.lat,
      lng: user.location.lng,
      subtotal,
      deliveryFee: user.deliveryFee || 0,
      total,
      status: "Placed",
      paymentMethod: "Cash",
      paymentStatus: "Pending",
      createdAt: new Date().toISOString(),
      items: user.cart,
      businessId: bid,
      outletId: oid
    };

    // Save order to the correct business/outlet path
    const orderPath = `businesses/${bid}/outlets/${oid}/orders/${orderId}`;
    await db.ref(orderPath).set(finalOrder);
    
    // Update user profile
    await saveUserProfile(jid, {
      name: user.name,
      phone: user.phone,
      address: user.address,
      location: user.location
    }, oid);

    let successMsg = `✅ *ORDER PLACED SUCCESSFULLY!* 🎉\n━━━━━━━━━━━━━━━━━━━━\n`;
    successMsg += `🆔 *Order ID:* ${orderId}\n`;
    successMsg += `👤 *Name:* ${user.name}\n`;
    successMsg += `📍 *Address:* ${user.address}\n`;
    successMsg += `💰 *Total:* ₹${total} (incl. ₹${user.deliveryFee || 0} delivery)\n`;
    successMsg += `💳 *Payment:* Cash on Delivery\n`;
    successMsg += `━━━━━━━━━━━━━━━━━━━━\n`;
    successMsg += `You'll receive updates as your order progresses. Thank you! 🙏`;

    await sock.sendMessage(jid, { text: successMsg });
    
    // 🚀 AUDIT LOG
    await logBotAudit('BOT_ORDER_PLACED', {
      orderId,
      total,
      outletId: oid,
      itemsCount: user.cart.length
    }, jid);

    user.cart = [];
    user.step = 'CATEGORY'; // Back to shop menu
  }
}

// ─── Utility Helpers ─────────────────────────────────────────

async function sendImage(sock, jid, image, text) {
  try {
    if (!image) return sock.sendMessage(jid, { text });
    await sock.sendMessage(jid, { 
      image: { url: image }, 
      caption: text 
    });
  } catch (err) {
    await sock.sendMessage(jid, { text });
  }
}

module.exports = {
  handleIncomingMessage
};
