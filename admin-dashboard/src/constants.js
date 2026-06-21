import {
  LayoutDashboard, ShoppingBag, Zap, ChefHat, Monitor, UtensilsCrossed, Table2,
  Tag, Package, Percent, Users, Bike, Handshake, BarChart3, TrendingDown,
  CreditCard, MessageSquare, MapPin, Settings, History, Megaphone
} from "lucide-react";
import { db, ref } from "./firebase";

export const ORANGE = "#E84908";
export const COLORS = { primary: "#E84908", success: "#22c55e", warning: "#f59e0b", info: "#3b82f6", error: "#ef4444", muted: "#64748b" };

export const ORD_ST = {
  Placed: { label: "Placed", color: "#f59e0b", bg: "#fef3c7" }, Confirmed: { label: "Confirmed", color: "#3b82f6", bg: "#dbeafe" },
  Preparing: { label: "Preparing", color: "#8b5cf6", bg: "#ede9fe" }, Cooked: { label: "Cooked", color: "#06b6d4", bg: "#cffafe" },
  Ready: { label: "Ready", color: "#0ea5e9", bg: "#e0f2fe" }, "Out for Delivery": { label: "Out for Delivery", color: "#E84908", bg: "#ffedd5" },
  "Reached Drop Location": { label: "Reached Drop", color: "#f97316", bg: "#fff7ed" }, Delivered: { label: "Delivered", color: "#22c55e", bg: "#dcfce7" },
  Cancelled: { label: "Cancelled", color: "#ef4444", bg: "#fee2e2" },
};
export const ORDER_STATUSES = {
  pending: { label: "Pending", color: "#f59e0b", bg: "#fef3c7" }, confirmed: { label: "Confirmed", color: "#3b82f6", bg: "#dbeafe" },
  preparing: { label: "Preparing", color: "#8b5cf6", bg: "#ede9fe" }, ready: { label: "Ready", color: "#06b6d4", bg: "#cffafe" },
  out_for_delivery: { label: "Out for Delivery", color: "#E84908", bg: "#ffedd5" }, delivered: { label: "Delivered", color: "#22c55e", bg: "#dcfce7" },
  cancelled: { label: "Cancelled", color: "#ef4444", bg: "#fee2e2" },
};
export const SEQ = ["Placed", "Confirmed", "Preparing", "Cooked", "Ready", "Out for Delivery", "Reached Drop Location", "Delivered"];
export const LIVE_ST = ["Placed", "Confirmed", "Preparing", "Cooked", "Ready", "Out for Delivery", "Pending", "New"];
export const KITCHEN_ST = ["Placed", "Confirmed", "Preparing", "Cooked", "Ready"];

export const TRANSLATIONS = {};

export const APP_VERSION = "5.0.0";

export const PIE_COLORS = ["#E84908", "#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899"];
export const HOURS_8_TO_23 = ["8a","9a","10a","11a","12p","1p","2p","3p","4p","5p","6p","7p","8p","9p","10p","11p"];
export const DAY_KEYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

export const stockStatus = (stock, thr) => stock === 0 ? "critical" : stock <= thr ? "low" : "ok";
export const statusColors = { ok: { color: COLORS.success, bg: "#dcfce7" }, low: { color: COLORS.warning, bg: "#fef3c7" }, critical: { color: COLORS.error, bg: "#fee2e2" } };

export const NAV_GROUPS = [
  { label:"Main", items:[{ id:"dashboard",label:"Dashboard",icon:LayoutDashboard },{ id:"orders",label:"Orders",icon:ShoppingBag },{ id:"liveops",label:"Live Ops",icon:Zap },{ id:"kitchen",label:"Kitchen",icon:ChefHat },{ id:"tables",label:"Tables",icon:Table2 }]},
  { label:"Sales", items:[{ id:"pos",label:"POS",icon:Monitor },{ id:"menu",label:"Menu",icon:UtensilsCrossed },{ id:"categories",label:"Categories",icon:Tag },{ id:"discounts",label:"Discounts",icon:Percent }]},
  { label:"Data", items:[{ id:"inventory",label:"Inventory",icon:Package },{ id:"customers",label:"Customers",icon:Users },{ id:"riders",label:"Riders",icon:Bike },{ id:"riderAnalytics",label:"Rider Analytics",icon:BarChart3 },{ id:"partners",label:"Partners",icon:Handshake }]},
  { label:"Insights", items:[{ id:"analytics",label:"Analytics",icon:BarChart3 },{ id:"lostsales",label:"Lost Sales",icon:TrendingDown },{ id:"settlements",label:"Settlements",icon:CreditCard },{ id:"payments",label:"Payments",icon:CreditCard }]},
  { label:"Marketing", items:[{ id:"promotions",label:"Promotions",icon:Megaphone }]},
  { label:"Tools", items:[{ id:"activitylog",label:"Activity Log",icon:History },{ id:"feedback",label:"Feedback",icon:MessageSquare },{ id:"livetracker",label:"Live Tracker",icon:MapPin },{ id:"settings",label:"Settings",icon:Settings }]},
];
export const MOBILE_NAV = [{ id:"dashboard",label:"Home",icon:LayoutDashboard },{ id:"orders",label:"Orders",icon:ShoppingBag },{ id:"tables",label:"Tables",icon:Table2 },{ id:"pos",label:"POS",icon:Monitor },{ id:"menu",label:"Menu",icon:UtensilsCrossed },{ id:"settings",label:"Settings",icon:Settings }];
export const PAGE_TITLES = { dashboard:"Dashboard", orders:"Orders", liveops:"Live Operations", kitchen:"Kitchen", tables:"Tables", pos:"Point of Sale", menu:"Menu Management", categories:"Categories", discounts:"Discounts", inventory:"Inventory", customers:"Customers", riders:"Riders", riderAnalytics:"Rider Analytics", partners:"Partners", analytics:"Analytics", lostsales:"Lost Sales", settlements:"Settlements", payments:"Payments", promotions:"Promotions", activitylog:"Activity Log", feedback:"Customer Feedback", livetracker:"Live Rider Tracker", settings:"Settings" };

export const PARTNERS_REF = ref(db, "system/partners");

export const DISC_TYPES = [
  { value: "percentage", label: "% Off", color: "#3b82f6", bg: "#dbeafe" },
  { value: "flat", label: "Flat ₹ Off", color: "#22c55e", bg: "#dcfce7" },
  { value: "bogo", label: "Buy 1 Get 1", color: "#8b5cf6", bg: "#ede9fe" },
  { value: "coupon", label: "Coupon", color: "#f59e0b", bg: "#fef3c7" },
];
export const DISC_STATUS = {
  active: { label: "Active", color: COLORS.success, bg: "#dcfce7" },
  scheduled: { label: "Scheduled", color: COLORS.info, bg: "#dbeafe" },
  expired: { label: "Expired", color: COLORS.error, bg: "#fee2e2" },
  disabled: { label: "Disabled", color: COLORS.muted, bg: "#f1f5f9" },
};
export const DISC_CHANNELS = [{ value: "all", label: "All Orders" }, { value: "dinein", label: "Dine-in Only" }, { value: "delivery", label: "Delivery Only" }];

export const PAYMENT_PAGE_SIZE = 25;

export const PAGE_GUIDES = {
  dashboard: [
    { icon: "LayoutDashboard", title: "Dashboard Overview", body: "View today's revenue, pending orders, active riders, and key metrics at a glance." },
    { icon: "TrendingUp", title: "Revenue Trend", body: "Toggle between Today (hourly) and Week (daily) views. The area chart shows your revenue over time." },
    { icon: "AlertTriangle", title: "Priority Orders", body: "Orders needing immediate attention are shown here, sorted by urgency (Placed > Confirmed > Preparing)." },
    { icon: "Crown", title: "Top Items & Customers", body: "See your best-selling items and highest-spending customers to inform business decisions." },
  ],
  orders: [
    { icon: "Search", title: "Search & Filter", body: "Search by customer name, phone, or order ID. Use the date range filter and tab pills (All / Live / History) to narrow results." },
    { icon: "ShoppingBag", title: "Order List", body: "Each row shows order ID, customer, items, total, status, and rider. Click the drawer icon for full details." },
    { icon: "Eye", title: "Order Drawer", body: "View full order details — customer info, delivery address with Google Maps link, items breakdown, and pricing." },
    { icon: "Truck", title: "Status & Rider", body: "Update order status inline via dropdown. Assign riders from the active rider list. CSV export available." },
  ],
  liveops: [
    { icon: "Activity", title: "Live Order Board", body: "All active orders stream in real time. Search and filter by status to focus on what needs attention." },
    { icon: "ArrowUp", title: "One-Click Advance", body: "Each order has an Advance button that shows the next status. Click to progress the order through the workflow." },
    { icon: "Navigation", title: "Status Progress Bar", body: "An 8-step visual bar shows the current position in the order lifecycle from Placed to Delivered." },
    { icon: "Truck", title: "Rider Assignment", body: "Riders must be assigned before marking 'Out for Delivery'. View active riders in the sidebar card." },
  ],
  kitchen: [
    { icon: "ChefHat", title: "Kitchen Display", body: "All orders grouped by status with color-coded cards. Filter by status using the pill tabs with counts." },
    { icon: "Clock", title: "Status Timers", body: "Each card shows minutes-in-status. Orders held >10min get a HOLD badge; >15min turns red for attention." },
    { icon: "ArrowUp", title: "Advance All", body: "Batch-advance all eligible orders at once. Useful when a batch of items is ready simultaneously." },
    { icon: "AlertTriangle", title: "Special Instructions", body: "Customer special instructions are highlighted in amber on the order detail modal." },
  ],
  pos: [
    { icon: "Monitor", title: "Menu Grid", body: "Browse dishes by category. Search by name. Cards show image, name, price, and stock badge." },
    { icon: "ShoppingCart", title: "Cart Panel", body: "Selected items appear in the right panel. Adjust quantities, remove items, or tap to edit addons/size." },
    { icon: "Plus", title: "Sizes & Addons", body: "Click a dish to open the selection modal. Choose size, toggle addons, set quantity, then add to cart." },
    { icon: "DollarSign", title: "Checkout", body: "Enter customer details, apply discount %, select payment method (Cash/UPI/Card), then Record Sale. Auto-discounts apply." },
  ],
  menu: [
    { icon: "UtensilsCrossed", title: "Dish List", body: "Card grid showing all dishes with image, stock status (OUT OF STOCK / Low / OK), and category overlay." },
    { icon: "Plus", title: "Add / Edit Dish", body: "Click the New Dish button or the edit icon on any card. Set name, category, base price, image, stock, sizes, and addons." },
    { icon: "Tag", title: "Sizes & Pricing", body: "Add size variants (e.g., Regular, Large) with different prices. Each size appears in the POS for customer selection." },
    { icon: "Trash2", title: "Delete Dish", body: "Click the delete icon to remove a dish. This action is audited in the activity log." },
  ],
  categories: [
    { icon: "FolderTree", title: "Category List", body: "All menu categories shown with image, name, serial order, and addon count." },
    { icon: "Plus", title: "Add Category", body: "Click Add Category. Enter name, image URL, and display order to organize your menu." },
    { icon: "Trash2", title: "Delete Category", body: "Click delete to remove a category. Deleting a category does not delete dishes within it." },
  ],
  discounts: [
    { icon: "Percent", title: "Discount List", body: "All discounts shown as cards grouped by Active / Scheduled / Expired tabs. Each card shows type, value, usage progress, and status." },
    { icon: "Plus", title: "Create Discount", body: "Click New Discount to open the editor. Choose type (% Off / Flat / BOGO / Coupon), set value, schedule, and limits." },
    { icon: "BarChart3", title: "Reports", body: "Click Reports to see redemptions, total savings, and average savings per discount over 7/30/90 days or all time." },
    { icon: "ToggleSwitch", title: "Quick Toggle", body: "Use the toggle switch to enable/disable any discount instantly without opening the editor." },
  ],
  inventory: [
    { icon: "Package", title: "Stock Overview", body: "View all inventory items with stock levels, status badges (ok/low/critical), and progress bars." },
    { icon: "Plus", title: "Add / Adjust Stock", body: "Click New Item to add raw materials. Use -1, +5, +10 buttons for quick stock adjustments." },
    { icon: "AlertTriangle", title: "Low Stock Alerts", body: "Items below threshold are highlighted with KPI cards and a dismissable banner at the top of the dashboard." },
    { icon: "Download", title: "Import/Export", body: "Export inventory as CSV for offline analysis or bulk updates." },
  ],
  customers: [
    { icon: "Users", title: "Customer List", body: "All customers sorted by lifetime value (LTV). Search by name or phone to find specific customers." },
    { icon: "Phone", title: "Contact Customer", body: "Click the WhatsApp icon to open a chat with the customer via wa.me link (India +91 prefix)." },
    { icon: "Download", title: "Export", body: "Export customer data as CSV for CRM or marketing analysis." },
  ],
  riders: [
    { icon: "Bike", title: "Rider List", body: "View all riders in table or grid view. Filter by status: All / Online / Busy / Offline with counts." },
    { icon: "Plus", title: "Add Rider", body: "Click Add Rider to create a new delivery person. Requires name, email, phone, vehicle, zone, and initial password." },
    { icon: "Wallet", title: "Wallet & Settlement", body: "Open a rider's detail modal to view weekly earnings, settle wallet balance, or reset their password." },
    { icon: "Trash2", title: "Delete Rider", body: "Deleting a rider requires reauthentication for security. Rider auth account can optionally be cleaned up." },
  ],
  riderAnalytics: [
    { icon: "BarChart3", title: "Performance Report", body: "Select a rider and date range, then click Generate Report to view detailed performance metrics." },
    { icon: "TrendingUp", title: "KPIs & Charts", body: "View total earnings, deliveries, average delivery time, rating, and pending cash. Daily earnings bar chart." },
    { icon: "Table", title: "Deliveries Table", body: "Paginated table of all deliveries for the period with duration, earnings, and status per order." },
    { icon: "Download", title: "Export", body: "Export the report as Excel (CSV) or PDF with jsPDF auto-table formatting." },
  ],
  partners: [
    { icon: "Handshake", title: "Partner List", body: "All supply partners shown in a table with type, since date, contact, and status." },
    { icon: "Plus", title: "Add Partner", body: "Click Add to register a new supply partner. Select type from Raw Materials, Vegetables, Spices, etc." },
    { icon: "CheckCircle", title: "Approve / Reject", body: "Pending partners can be approved or rejected. Approved partners appear in active supply chain views." },
  ],
  analytics: [
    { icon: "BarChart3", title: "Analytics Dashboard", body: "Period-over-period metrics. Toggle between Week, Month, and Quarter views to track performance." },
    { icon: "TrendingUp", title: "Revenue & Orders", body: "Dual-axis bar chart showing revenue and order counts. Period comparison card shows % change vs previous period." },
    { icon: "PieChart", title: "Sales Breakdown", body: "Donut pie chart shows sales by category. Area chart shows orders by hour (8 AM - 11 PM)." },
    { icon: "Trophy", title: "Top Performers", body: "Ranked lists of top dishes (by quantity), top customers (by revenue), and top riders (by deliveries/rating)." },
  ],
  lostsales: [
    { icon: "TrendingDown", title: "Lost Sales Overview", body: "View all cancelled orders with total loss amount, count, and average loss per cancellation." },
    { icon: "ShoppingBag", title: "Cancelled Orders", body: "Each row shows order ID, customer, phone, cancellation time, and the lost amount." },
    { icon: "Download", title: "Export", body: "Export lost sales data as CSV for further analysis." },
  ],
  settlements: [
    { icon: "CreditCard", title: "Settlements Overview", body: "Track all financial settlements with net balance, total credits, and total debits." },
    { icon: "ArrowUp", title: "Credits & Debits", body: "Each transaction is color-coded green (credit) or red (debit) with method and status." },
    { icon: "Download", title: "Export", body: "Export settlement history as CSV for accounting." },
  ],
  payments: [
    { icon: "Wallet", title: "Payments Dashboard", body: "View all delivered orders grouped by payment method. KPIs show total collected per method (Cash/Card/UPI)." },
    { icon: "Filter", title: "Filter & Search", body: "Filter by payment method pills or date range. Search through delivered orders by customer or amount." },
    { icon: "Download", title: "Export", body: "Export payment data as CSV for reconciliation." },
  ],
  promotions: [
    { icon: "Megaphone", title: "Campaign Composer", body: "Write promotional messages with template variables ({name}, {phone}, {storeName}). Preview before sending." },
    { icon: "Users", title: "Recipients", body: "Choose audience: all consenting customers, last 30 days active, or upload a custom CSV/XLSX list." },
    { icon: "Send", title: "Send or Schedule", body: "Launch immediately or schedule for later. Set delay between messages (1-30s). Toggle coupon generation." },
    { icon: "Activity", title: "Active Campaigns", body: "Monitor running campaigns with progress bars. Use Kill Switch to emergency-stop all campaigns." },
  ],
  notifications: [
    { icon: "Bell", title: "Compose Broadcast", body: "Write a title and message for your broadcast. Choose target audience: All, New, VIP, or Inactive (7+ days)." },
    { icon: "Send", title: "Send Broadcast", body: "Click Send to push the notification to the selected audience. Written to Firebase and delivered via bot." },
    { icon: "History", title: "Broadcast History", body: "View previously sent broadcasts with audience badge, source (SuperAdmin/Admin), and recipient count." },
  ],
  feedback: [
    { icon: "Star", title: "Rating Distribution", body: "Visual breakdown of 5-star to 1-star ratings with percentage bars and average rating." },
    { icon: "MessageSquare", title: "Review List", body: "Paginated review cards showing customer avatar, name, time, rating, comment, and dish name badge." },
    { icon: "Filter", title: "Filter by Rating", body: "Reviews are sorted by newest first. Each card shows the full customer feedback for quality monitoring." },
  ],
  livetracker: [
    { icon: "MapPin", title: "Live Map", body: "Real-time rider tracking on OpenStreetMap. Each rider appears as a marker with name, phone, and status in popup." },
    { icon: "Navigation", title: "Rider Positions", body: "Rider locations update in real time from their mobile app GPS. Auto-fit bounds on all online riders." },
    { icon: "Users", title: "Online Riders", body: "Online rider count shown at the top. Sidebar lists all riders with online/offline status." },
  ],
  settings: [
    { icon: "Store", title: "Store Settings", body: "Configure entity name, store name, address, GSTIN, FSSAI, social links, location coordinates, and operating hours." },
    { icon: "Truck", title: "Delivery Settings", body: "Set developer/report/notification phone numbers, backup code, and configure delivery fee slabs by kilometer range." },
    { icon: "Sun", title: "Display Settings", body: "Customize branding elements and display preferences for your store." },
  ],
};

export const STORAGE_KEYS = {
  page: "foodhubbie-admin-page",
  theme: "foodhubbie-admin-theme",
  sidebar: "foodhubbie-admin-sidebar-collapsed",
};

// VALID_PAGE_IDS requires PAGES (defined in App.jsx with component references).
// Uncomment and use when PAGES is available:
// export const VALID_PAGE_IDS = new Set(Object.keys(PAGES));
