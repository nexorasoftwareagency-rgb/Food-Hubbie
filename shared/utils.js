/**
 * ============================================================
 * FOODHUBBIE SAAS — Shared Utilities
 * ============================================================
 * Consolidates utility functions from legacy Pizza-bot, Admin,
 * and Rider modules into a single shared module.
 * 
 * PRESERVED SOUL:
 * - calculateDistance (Haversine) from bot
 * - formatJid phone sanitization from bot
 * - isShopOpen timezone-aware check from bot
 * - OTP generation from admin order flow
 * - IST date formatting from admin analytics
 * ============================================================
 */

// ─── Distance Calculation (Haversine Formula) ──────────────

/**
 * Calculates the distance between two coordinates using the Haversine formula.
 * Preserved from legacy bot: used for delivery fee calculation.
 * 
 * @param {number} lat1 - Latitude of point A
 * @param {number} lon1 - Longitude of point A
 * @param {number} lat2 - Latitude of point B
 * @param {number} lon2 - Longitude of point B
 * @returns {number} Distance in kilometers (rounded to 1 decimal)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = _toRad(lat2 - lat1);
  const dLon = _toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(_toRad(lat1)) * Math.cos(_toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function _toRad(deg) {
  return deg * (Math.PI / 180);
}


// ─── Delivery Fee Calculation ──────────────────────────────

/**
 * Calculates the delivery fee based on distance and fee structure.
 * Preserved from legacy bot distance-based pricing.
 * 
 * @param {number} distanceKm - Distance to customer in km
 * @param {Array<{upToKm: number, fee: number}>} feeStructure - Tiered fee slabs
 * @returns {number} Delivery fee in currency units
 */
function calculateDeliveryFee(distanceKm, feeStructure) {
  if (!feeStructure || !feeStructure.length) return 0;

  // Normalise slabs — accept both `upToKm` and `km`
  const normalised = feeStructure.map(s => ({
    upToKm: s.upToKm ?? s.km ?? 0,
    fee: s.fee ?? 0
  }));

  // Sort slabs by distance ascending
  const sorted = [...normalised].sort((a, b) => a.upToKm - b.upToKm);

  for (const slab of sorted) {
    if (distanceKm <= slab.upToKm) {
      return slab.fee;
    }
  }

  // Beyond max slab — return highest fee
  return sorted[sorted.length - 1].fee;
}


// ─── Phone Number Formatting ───────────────────────────────

/**
 * Sanitizes a phone number to standard WhatsApp JID format.
 * Preserved from legacy bot: formatJid(phone).
 * 
 * @param {string} phone - Raw phone input
 * @returns {string} Formatted as 91xxxxxxxxxx@s.whatsapp.net
 */
function formatJid(phone) {
  let cleaned = String(phone).replace(/[^0-9]/g, '');

  // Remove leading 0 or country code prefix
  if (cleaned.startsWith('0')) cleaned = cleaned.substring(1);
  if (cleaned.length === 10) cleaned = '91' + cleaned;
  if (cleaned.startsWith('+')) cleaned = cleaned.substring(1);

  return cleaned + '@s.whatsapp.net';
}

/**
 * Extracts a clean 10-digit phone number for display.
 * @param {string} jidOrPhone - WhatsApp JID or phone string
 * @returns {string} 10-digit phone number
 */
function cleanPhone(jidOrPhone) {
  const digits = String(jidOrPhone).replace(/[^0-9]/g, '');
  if (digits.length >= 12 && digits.startsWith('91')) {
    return digits.substring(2);
  }
  return digits.slice(-10);
}


// ─── Shop Open/Close Check ────────────────────────────────

/**
 * Checks if a shop is currently open based on IST timezone.
 * Preserved from legacy bot: isShopOpen(open, close).
 * 
 * @param {string} openTime - Opening time in HH:MM format (e.g., "11:00")
 * @param {string} closeTime - Closing time in HH:MM format (e.g., "23:00")
 * @returns {boolean} True if shop is currently open in IST
 */
function isShopOpen(openTime, closeTime) {
  if (!openTime || !closeTime) return true; // Default to open if not configured

  const now = new Date();
  const istFormatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const parts = istFormatter.formatToParts(now);
  const currentHour = parseInt(parts.find(p => p.type === 'hour').value);
  const currentMin = parseInt(parts.find(p => p.type === 'minute').value);
  const currentMinutes = currentHour * 60 + currentMin;

  const [openH, openM] = openTime.split(':').map(Number);
  const [closeH, closeM] = closeTime.split(':').map(Number);
  const openMinutes = openH * 60 + openM;
  let closeMinutes = closeH * 60 + closeM;

  // Handle overnight closing (e.g., closes at 01:00)
  if (closeMinutes < openMinutes) {
    closeMinutes += 1440; // Add 24 hours
    const adjustedCurrent = currentMinutes < openMinutes
      ? currentMinutes + 1440
      : currentMinutes;
    return adjustedCurrent >= openMinutes && adjustedCurrent <= closeMinutes;
  }

  return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
}


// ─── OTP Generation ────────────────────────────────────────

/**
 * Generates a random numeric OTP for delivery verification.
 * Preserved from legacy admin "Out for Delivery" flow.
 * 
 * @param {number} [length=4] - Number of digits
 * @returns {string} OTP string (e.g., "4829")
 */
function generateOTP(length = 4) {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return String(Math.floor(min + Math.random() * (max - min + 1)));
}


// ─── Date/Time Utilities (IST) ─────────────────────────────

/**
 * Returns current date in IST as YYYY-MM-DD string.
 * Standardized implementation replacing inconsistent legacy versions.
 */
function getISTDateString(date) {
  const d = date || new Date();
  const ist = new Date(d.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const year = ist.getFullYear();
  const month = String(ist.getMonth() + 1).padStart(2, '0');
  const day = String(ist.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns current IST time as HH:MM string.
 */
function getISTTimeString(date) {
  const d = date || new Date();
  const ist = new Date(d.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const hour = String(ist.getHours()).padStart(2, '0');
  const min = String(ist.getMinutes()).padStart(2, '0');
  return `${hour}:${min}`;
}

/**
 * Returns a human-readable relative time string.
 * @param {string|Date} timestamp
 * @returns {string} e.g., "2 mins ago", "1 hour ago"
 */
function timeAgo(timestamp) {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;
  return `${Math.floor(seconds / 86400)} day${seconds >= 172800 ? 's' : ''} ago`;
}


// ─── Currency Formatting ───────────────────────────────────

/**
 * Formats a number as Indian Rupee currency string.
 * @param {number} amount
 * @returns {string} e.g., "₹349"
 */
function formatCurrency(amount) {
  return `₹${Number(amount).toLocaleString('en-IN')}`;
}


// ─── Unique ID Generation ──────────────────────────────────

/**
 * Generates a unique ID with optional prefix.
 * @param {string} [prefix=''] - Prefix like 'order', 'outlet'
 * @returns {string} e.g., "order_a1b2c3d4"
 */
function generateId(prefix = '') {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 8; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return prefix ? `${prefix}_${id}` : id;
}


// ─── Exports ───────────────────────────────────────────────

const SharedUtils = {
  calculateDistance,
  calculateDeliveryFee,
  formatJid,
  cleanPhone,
  isShopOpen,
  generateOTP,
  getISTDateString,
  getISTTimeString,
  timeAgo,
  formatCurrency,
  generateId
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SharedUtils;
}

if (typeof window !== 'undefined') {
  window.SharedUtils = SharedUtils;
}
