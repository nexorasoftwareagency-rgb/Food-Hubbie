/**
 * Minimal localization helper. Default language is English; pass a `STRINGS`
 * object with the same keys to override. Future languages (e.g. `hi`, `ta`)
 * can be loaded by replacing STRINGS at runtime.
 *
 * Usage:
 *   import { t, localize } from './l10n.js';
 *   t('inv.addItem', 'Add Item');          // returns 'Add Item' or override
 *   localize();                             // scan DOM for [data-i18n]
 */
let _strings = {
    // Inventory module
    'inv.addItem': 'Add Item',
    'inv.export': 'Export',
    'inv.import': 'Import',
    'inv.title': 'Inventory Management',
    'inv.subtitle': 'High-speed product stock tracking & alerts',
    'inv.features': 'Inventory Features',
    'inv.menuAvailability': 'Menu Availability',
    'inv.menuAvailabilityDesc': 'Mark dishes as Available or Out of Stock on the menu.',
    'inv.stockTracking': 'Stock Inventory Tracking',
    'inv.stockTrackingDesc': 'Track quantity in stock for each item. Auto-deducts on sales.',
    'inv.totalItems': 'Total Items',
    'inv.lowStock': 'Low Stock',
    'inv.col.product': 'Product Item',
    'inv.col.stock': 'Current Stock',
    'inv.col.threshold': 'Threshold',
    'inv.col.actions': 'Actions',
    'inv.searchPlaceholder': 'Search items by name...',
    'inv.searchAria': 'Search inventory items',
    'inv.empty': 'No items found. Click \'Add Item\' to start tracking.',
    'inv.noMatch': 'No items match "{term}"',
    'inv.reorderSoon': 'Reorder Soon',
    'inv.menuItems': 'Menu Items',
    'inv.lowStockBadge': 'Low Stock',
    'inv.notTracked': 'Not tracked',
    'inv.trackStock': '+ Track Stock',
    'inv.available': 'Available',
    'inv.modal.newTitle': 'Track New Product',
    'inv.modal.editTitle': 'Edit Product Tracking',
    'inv.modal.save': 'Start Tracking',
    'inv.modal.name': 'Product Name',
    'inv.modal.stock': 'Opening Stock',
    'inv.modal.threshold': 'Low Stock Alert at',
    'inv.modal.sku': 'SKU',
    'inv.modal.unit': 'Unit',
    'inv.modal.supplier': 'Supplier',
    'inv.modal.cost': 'Cost per Unit',
    'inv.modal.optional': 'optional',
    'inv.modal.hint': 'We\'ll alert you when this item falls below the threshold.',
    'inv.saved': '📦 Item Added',
    'inv.updated': '📦 Item Updated',
    'inv.saveFailed': '📦 Save Failed',
    'inv.syncError': '📦 Sync Error',
    'inv.dupName': '📦 Item name already tracked',
    'inv.dupSku': '📦 SKU already in use',
    'inv.removed': '📦 Tracking stopped',
    'inv.removeFailed': '📦 Failed to remove',
    'inv.exported': '📦 Exported {n} items',
    'inv.exportFailed': '📦 Export failed',
    'inv.imported': '📦 Imported {n} items',
    'inv.importSkipped': ', skipped {n} duplicate(s)',
    'inv.importError': '📦 Import error: {msg}',
    'inv.importReadError': '📦 Could not read file',
    'inv.lowStockToast': '📦 Low Stock: {name} ({stock})',
    'inv.confirmLarge': 'Confirm Large Adjustment',
    'inv.confirmLargeMsg': 'Apply {direction} of {n} to {name}? Current: {current}',
    'inv.shortcutsHelp': '📦 Shortcuts: n = Add Item, ? = Help',
    'inv.unavailable': '📦 Item is currently unavailable',
    'inv.nowTracking': 'Now tracking stock for {name}',

    // Analytics module
    'analytics.status.delivered': 'Delivered Only',
    'analytics.status.all': 'All Orders',
    'analytics.status.cancelled': 'Cancelled Only',
    'analytics.datesRequired': 'Please select both start and end dates for filtering',
    'analytics.dateRangePlaceholder': 'Please select a date range to view reports.',
    'analytics.invalidDate': 'Invalid date format selected',
    'analytics.dateOrder': 'Start date must be before end date',
    'analytics.reportError': 'Error generating report',
    'analytics.reportFailed': '⚠️ Failed to load report data.',
    'analytics.noData': 'No data to chart',
    'analytics.chart.dailyRevenue': 'Daily Revenue',
    'analytics.noDataExport': 'No data to export.',
    'analytics.generatingExcel': 'Generating Excel...',
    'analytics.excelNotLoaded': 'Excel library not loaded.',
    'analytics.noDataPdf': 'No data available to export. Generate a report first.',
    'analytics.pdfNotReady': 'PDF export library not ready. Please refresh and try again.',
    'analytics.pdfTableNotReady': 'PDF table plugin not ready. Please refresh and try again.',
    'analytics.generatingPdf': 'Generating PDF...',
    'analytics.pdf.title': 'Sales Report',
    'analytics.pdf.period': 'Period: {from} to {to}',
    'analytics.pdf.filter': 'Filter: {label}',
    'analytics.pdf.generated': 'Generated on: {date}',
    'analytics.col.date': 'Date',
    'analytics.col.customer': 'Customer',
    'analytics.col.orderType': 'Order Type',
    'analytics.col.payment': 'Payment',
    'analytics.col.total': 'Total',
    'analytics.col.items': 'Items',
    'analytics.noOrders': 'No orders found for this range',
    'analytics.noItems': 'No items',
    'analytics.fallback.guest': 'Guest',
    'analytics.fallback.online': 'Online',
    'analytics.fallback.cod': 'COD',
    'analytics.fallback.na': 'N/A',
    'analytics.sheetName': 'Sales Report',

    // Lost Sales module
    'lostSales.title': 'Lost Sales',
    'lostSales.empty': 'No lost sales found!',
    'lostSales.emptySub': 'All your customers are reaching the finish line.',
    'lostSales.loadError': 'Error loading data. Check console.',
    'lostSales.clearSuccess': 'Logs cleared successfully',
    'lostSales.clearFailed': 'Failed to clear logs',
    'lostSales.col.date': 'Date',
    'lostSales.col.customer': 'Customer',
    'lostSales.col.step': 'Step',
    'lostSales.col.items': 'Items',
    'lostSales.col.value': 'Value',
    'lostSales.fallback.guest': 'Guest',
    'lostSales.fallback.na': 'N/A',
    'lostSales.fallback.checkout': 'Checkout',

    // Customers module
    'customers.col.customer': 'Customer',
    'customers.col.whatsapp': 'WhatsApp',
    'customers.col.address': 'Address',
    'customers.col.orders': 'Orders',
    'customers.col.value': 'Value',
    'customers.joined': 'Joined: {date}',
    'customers.purchases': 'Purchases',
    'customers.ltv': 'LTV',
    'customers.viewMap': 'VIEW MAP',
    'customers.fallback.anonymous': 'Anonymous',
    'customers.fallback.na': 'N/A',
    'customers.fallback.counterSale': 'Counter Sale / Guest'
};

let _cache = new Map();

/**
 * Translate a key. Supports simple {placeholder} substitution.
 * Falls back to the provided default (or the key itself) if not found.
 */
export function t(key, fallback, vars) {
    if (!key) return fallback || '';
    if (_cache.has(key)) return interpolate(_cache.get(key), vars);
    const val = _strings[key];
    _cache.set(key, val || fallback || key);
    return interpolate(_cache.get(key), vars);
}

function interpolate(str, vars) {
    if (!vars || typeof str !== 'string') return str;
    return str.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

/**
 * Scan the document for [data-i18n] (text) and [data-i18n-placeholder] / [data-i18n-aria]
 * (attribute) elements and replace their content. Run once on init.
 */
export function localize(root) {
    const scope = root || document;
    scope.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (key) el.textContent = t(key, el.textContent);
    });
    scope.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (key) el.setAttribute('placeholder', t(key, el.getAttribute('placeholder') || ''));
    });
    scope.querySelectorAll('[data-i18n-aria]').forEach(el => {
        const key = el.getAttribute('data-i18n-aria');
        if (key) el.setAttribute('aria-label', t(key, el.getAttribute('aria-label') || ''));
    });
}

/**
 * Replace the strings table (for runtime language switching).
 * Clears the cache so new keys take effect.
 */
export function setLanguage(newStrings) {
    _strings = Object.assign({}, _strings, newStrings || {});
    _cache = new Map();
}

export function getStrings() {
    return _strings;
}
