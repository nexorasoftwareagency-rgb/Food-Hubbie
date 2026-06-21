/**
 * ============================================================
 * FOODHUBBIE SAAS — Multi-Tenant Print Utility (admin-dashboard v2)
 * ============================================================
 * Provides KOT / receipt / settlement printing that works for
 * ANY business by reading store settings from Firebase.
 *
 * Replaces Admin-Previous/printing.js + receipt-templates.js
 * which were hardcoded to "ROSHANI PIZZA" / "ROSHANI CAKES".
 *
 * Usage:
 *   import { printReceipt, printKOT } from "@/utils/printing";
 *   printReceipt(order, store);
 *   printKOT(order, store);
 * ============================================================
 */

/**
 * Build a self-contained HTML document for a thermal receipt
 * (76mm / 80mm) using the order + tenant-specific store data.
 */
export function buildReceiptHtml(order, store = {}, opts = {}) {
  const { isReprint = false, showGSTIN = true, showFSSAI = true, showQR = true } = opts;
  const itemsHtml = (order.items || order.cart || [])
    .map((i) => {
      const qty = i.quantity ?? i.qty ?? 1;
      const price = i.price ?? 0;
      const size = i.customization?.size?.name || i.size || "Regular";
      const name = i.name || "";
      return `
        <tr>
          <td style="padding:4px 0;">
            ${escapeHtml(name)}
            ${size !== "Regular" ? `<br><small style="font-size:0.7rem;opacity:0.8;">(${escapeHtml(size)})</small>` : ""}
          </td>
          <td style="text-align:center;">${qty}</td>
          <td style="text-align:right;">${(price * qty).toFixed(2)}</td>
        </tr>
      `;
    })
    .join("");

  const total = order.total ?? 0;
  const subtotal = order.subtotal ?? total;
  const tax = order.taxes ?? 0;
  const deliveryFee = order.deliveryFee ?? 0;
  const discount = order.discount ?? 0;
  const customerName = order.customerName || order.deliveryAddress?.name || "Guest";
  const customerPhone = order.phone || order.deliveryAddress?.phone || "";
  const address = order.address || order.deliveryAddress?.address || "";
  const orderId = order.id || order.orderId || "—";
  const storeName = store.storeName || store.name || "Foodhubbie";
  const entityName = store.entityName || "";
  const storeAddress = store.address || "";
  const gstin = store.gstin || "";
  const fssai = store.fssai || "";
  const reprintTag = isReprint
    ? `<div class="center bold" style="font-size:0.85rem;letter-spacing:2px;">** REPRINT **</div>`
    : "";

  return `<!DOCTYPE html>
<html>
<head>
  <title>Bill - ${escapeHtml(orderId)}</title>
  <style>
    @page { margin: 0; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; }
    body {
      font-family: 'Courier New', Courier, monospace;
      width: 100%;
      max-width: 80mm;
      margin: 0 auto;
      padding: 5mm 3mm;
      color: #000;
      line-height: 1.2;
      font-size: 12px;
    }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .hr { border-top: 1px dashed #000; margin: 6px 0; }
    .store-name { font-size: 1.5rem; font-weight: 900; margin: 0; letter-spacing: 1px; }
    .store-entity { font-size: 0.75rem; text-transform: uppercase; margin-bottom: 2px; }
    .address-text { font-size: 0.72rem; margin: 5px 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 5px; }
    th { border-bottom: 1px dashed #000; padding: 5px 0; border-top: 1px dashed #000; font-size: 0.7rem; text-transform: uppercase; }
  </style>
</head>
<body>
  ${reprintTag}
  <div class="center">
    <div class="store-name">${escapeHtml(storeName)}</div>
    ${entityName ? `<div class="store-entity">${escapeHtml(entityName)}</div>` : ""}
    ${storeAddress ? `<div class="address-text">${escapeHtml(storeAddress)}</div>` : ""}
    ${showGSTIN && gstin ? `<div style="font-size:0.7rem;">GSTIN: ${escapeHtml(gstin)}</div>` : ""}
    ${showFSSAI && fssai ? `<div style="font-size:0.7rem;">FSSAI: ${escapeHtml(fssai)}</div>` : ""}
  </div>

  <div class="hr"></div>
  <div>Order: <span class="bold">#${escapeHtml(orderId)}</span></div>
  <div>Date: ${new Date().toLocaleString()}</div>
  <div>Type: ${escapeHtml(order.type || "delivery")}</div>
  <div>Customer: ${escapeHtml(customerName)} ${customerPhone ? `(${escapeHtml(customerPhone)})` : ""}</div>
  ${address ? `<div style="font-size:0.7rem;">${escapeHtml(address)}</div>` : ""}
  <div class="hr"></div>

  <table>
    <thead>
      <tr>
        <th align="left">Item</th>
        <th align="center">Qty</th>
        <th align="right">₹</th>
      </tr>
    </thead>
    <tbody>${itemsHtml}</tbody>
  </table>

  <div class="hr"></div>
  <div style="display:flex;justify-content:space-between;"><span>Subtotal</span><span>₹${subtotal.toFixed(2)}</span></div>
  ${tax ? `<div style="display:flex;justify-content:space-between;"><span>GST (5%)</span><span>₹${tax.toFixed(2)}</span></div>` : ""}
  ${deliveryFee ? `<div style="display:flex;justify-content:space-between;"><span>Delivery</span><span>₹${deliveryFee.toFixed(2)}</span></div>` : ""}
  ${discount ? `<div style="display:flex;justify-content:space-between;"><span>Discount</span><span>-₹${discount.toFixed(2)}</span></div>` : ""}
  <div class="hr"></div>
  <div style="display:flex;justify-content:space-between;font-size:1.1rem;" class="bold">
    <span>TOTAL</span><span>₹${total.toFixed(2)}</span>
  </div>
  <div class="hr"></div>
  <div class="center">Thank you! Visit again.</div>
  ${showQR ? `<div class="center" style="margin-top:10px;font-size:0.7rem;">Scan to rate: ${escapeHtml(orderId)}</div>` : ""}
</body>
</html>`;
}

/**
 * Build a smaller KOT (Kitchen Order Ticket) — printed when the
 * restaurant starts preparing, with only the items the chef needs.
 */
export function buildKotHtml(order, store = {}, opts = {}) {
  const { isReprint = false } = opts;
  const itemsHtml = (order.items || order.cart || [])
    .map((i) => {
      const qty = i.quantity ?? i.qty ?? 1;
      const size = i.customization?.size?.name || i.size || "Regular";
      const addons = i.customization?.addons?.length
        ? `+ ${i.customization.addons.map((a) => a.name).join(", ")}`
        : "";
      const notes = i.customization?.instructions || "";
      return `
        <tr>
          <td style="padding:6px 0;">
            <div class="bold" style="font-size:1rem;">${escapeHtml(i.name || "")}</div>
            <div style="font-size:0.7rem;">${escapeHtml(size)} ${addons ? `· ${escapeHtml(addons)}` : ""}</div>
            ${notes ? `<div style="font-size:0.7rem;font-style:italic;">Note: ${escapeHtml(notes)}</div>` : ""}
          </td>
          <td style="text-align:center;font-size:1.2rem;" class="bold">${qty}</td>
        </tr>
      `;
    })
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <title>KOT - ${escapeHtml(order.id || "")}</title>
  <style>
    @page { margin: 0; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; }
    body { font-family: 'Courier New', monospace; width: 80mm; margin: 0 auto; padding: 5mm; font-size: 12px; }
    .center { text-align: center; } .bold { font-weight: bold; } .hr { border-top: 1px dashed #000; margin: 6px 0; }
    .header { font-size: 1.1rem; letter-spacing: 1px; }
    table { width: 100%; border-collapse: collapse; }
  </style>
</head>
<body>
  <div class="center header bold">${isReprint ? "** KOT REPRINT **" : "KITCHEN ORDER"}</div>
  <div class="hr"></div>
  <div>Order: <span class="bold">#${escapeHtml(order.id || "")}</span></div>
  <div>${escapeHtml(store.storeName || store.name || "")}</div>
  <div>Type: ${escapeHtml(order.type || "delivery")}</div>
  <div>${new Date().toLocaleString()}</div>
  <div class="hr"></div>
  <table>
    <thead>
      <tr>
        <th align="left">Item</th>
        <th align="center">Qty</th>
      </tr>
    </thead>
    <tbody>${itemsHtml}</tbody>
  </table>
  <div class="hr"></div>
  ${order.deliveryAddress?.name || order.customerName ? `<div>Customer: ${escapeHtml(order.customerName || order.deliveryAddress.name)}</div>` : ""}
  ${order.phone || order.deliveryAddress?.phone ? `<div>Phone: ${escapeHtml(order.phone || order.deliveryAddress.phone)}</div>` : ""}
</body>
</html>`;
}

/**
 * Open a print dialog for the given HTML. Falls back to an
 * iframe if popups are blocked.
 */
export function printHtml(html) {
  const win = window.open("", "_blank", "width=450,height=800");
  if (win) {
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => {
      try {
        win.print();
        win.close();
      } catch (e) {
        console.error("Print error:", e);
      }
    }, 400);
    return;
  }
  // Popup blocked → use hidden iframe
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "-10000px";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  document.body.appendChild(iframe);
  iframe.contentDocument?.open();
  iframe.contentDocument?.write(html);
  iframe.contentDocument?.close();
  iframe.contentWindow?.focus();
  setTimeout(() => {
    try {
      iframe.contentWindow?.print();
    } catch (e) {
      console.error("Iframe print error:", e);
    }
    document.body.removeChild(iframe);
  }, 400);
}

export function printReceipt(order, store = {}, opts = {}) {
  return printHtml(buildReceiptHtml(order, store, opts));
}

export function printKOT(order, store = {}, opts = {}) {
  return printHtml(buildKotHtml(order, store, opts));
}

function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
