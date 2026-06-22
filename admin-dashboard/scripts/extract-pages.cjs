const fs = require('fs');
const path = require('path');

const appJsx = fs.readFileSync(path.join(__dirname, '..', 'src', 'App.jsx'), 'utf8');
const lines = appJsx.split('\n');

// Page metadata: [functionName, startLine (0-indexed), endLine (exclusive)]
const pageMeta = [
  // [name, startPattern, isLast]
  ['DashboardPage', 'function DashboardPage'],
  ['OrdersPage', 'function OrdersPage'],
  ['CategoriesPage', 'function CategoriesPage'],
  ['MenuPage', 'function MenuPage'],
  ['POSPage', 'function POSPage'],
  ['CustomersPage', 'function CustomersPage'],
  ['LiveTrackerPage', 'function LiveTrackerPage'],
  ['SettingsPage', 'function SettingsPage'],
  ['LiveOpsPage', 'function LiveOpsPage'],
  ['KitchenPage', 'function KitchenPage'],
  ['InventoryPage', 'function InventoryPage'],
  ['RidersPage', 'function RidersPage'],
  ['PartnersPage', 'function PartnersPage'],
  ['AnalyticsPage', 'function AnalyticsPage'],
  ['LostSalesPage', 'function LostSalesPage'],
  ['SettlementsPage', 'function SettlementsPage'],
  ['FeedbackPage', 'function FeedbackPage'],
  ['DiscountsPage', 'function DiscountsPage'],
  ['PromotionsPage', 'function PromotionsPage'],
  ['RiderAnalyticsPage', 'function RiderAnalyticsPage'],
  ['PaymentsPage', 'function PaymentsPage'],
  ['ActivityLogPage', 'function ActivityLogPage'],
];

const PAGES_DIR = path.join(__dirname, '..', 'src', 'pages');

// Known exports from each module
const FIREBASE_EXPORTS = `getAuthInstance db onAuthStateChanged signInWithEmailAndPassword signOut setOutletContext get ref update push set remove serverTimestamp onValue off query orderByChild equalTo uploadImage deleteImage runTransaction logAudit getCurrentAdminActor createRiderAuthAccount deleteRiderAuthAccount resetRiderPassword EmailAuthProvider reauthenticateWithCredential getMessaging getToken onMessage as onFcmMessage isMessagingSupported isConnected onConnectionChange startBotStatusWatcher Outlet getBizId getOutletId getCurrentOutletContext`.split(' ');

const UTILS_EXPORTS = `fmt esc csvValue downloadCSV orderItemsCount orderItemsText validateGSTIN validateFSSAI validateCoords handleImageError buildTodayRevenue buildWeekRevenue normalizeRider aggregateByDay aggregateByHour aggregateByCategory aggregateByDish aggregateByCustomer relTime fmtDate toLocalInput toMs discTypeStyle`.split(' ');

const CONSTANTS_EXPORTS = `ORANGE COLORS ORD_ST ORDER_STATUSES SEQ LIVE_ST KITCHEN_ST PIE_COLORS HOURS_8_TO_23 DAY_KEYS TRANSLATIONS APP_VERSION NAV_GROUPS MOBILE_NAV PAGE_TITLES DISC_TYPES DISC_STATUS DISC_CHANNELS PAYMENT_PAGE_SIZE PAGE_GUIDES STORAGE_KEYS PARTNERS_REF statusColors stockStatus`.split(' ');

const COMPONENTS_EXPORTS = `KPICard StarRating Pill ToggleSwitch EmptyState SectionHeader StatusBadge GlassCard BtnPrimary BtnSecondary Modal Toast Avatar Skeleton SkeletonCircle SkeletonKPI SkeletonCard SkeletonText SkeletonTable SkeletonGrid SkeletonPage Loading Input Select StatCard SectionLabel Pagination ReauthModal PageGuideModal`.split(' ');

function findPageBoundaries(lines, meta) {
  const boundaries = [];
  for (const [name, pattern] of meta) {
    const idx = lines.findIndex(l => l.includes(`function ${name}`));
    if (idx === -1) { console.warn(`WARN: ${name} not found`); continue; }
    boundaries.push({ name, start: idx, pattern });
  }
  // Sort by start position
  boundaries.sort((a, b) => a.start - b.start);
  // Set end boundaries
  for (let i = 0; i < boundaries.length; i++) {
    if (i < boundaries.length - 1) {
      boundaries[i].end = boundaries[i + 1].start;
    } else {
      // Use "function App" or EOF
      const appIdx = lines.findIndex(l => l.includes('function App('));
      boundaries[i].end = appIdx > boundaries[i].start ? appIdx : lines.length;
    }
  }
  return boundaries;
}

function scanImports(code, allExports) {
  const used = allExports.filter(exp => {
    // Handle aliased imports like "onMessage as onFcmMessage"
    const baseName = exp.split(' ')[0]; // Take first part before ' as '
    const aliasName = exp.includes(' as ') ? exp.split(' as ')[1] : baseName;
    const regex = new RegExp(`\\b${aliasName}\\b`);
    return regex.test(code);
  });
  return used;
}

function extractLucideIcons(code) {
  const iconNames = [];
  // Parse the current import line from App.jsx
  const importMatch = appJsx.match(/import\s+\{\s*([^}]+)\s*\}\s+from\s+["']lucide-react["']/);
  if (!importMatch) return [];
  const allImports = importMatch[1].split(',').map(s => s.trim());
  for (const icon of allImports) {
    // Check if the icon is used in this page code
    const regex = new RegExp(`\\b<${icon}\\b|\\b${icon}\\b`);
    if (regex.test(code)) {
      iconNames.push(icon);
    }
  }
  return iconNames;
}

function buildPageFile(pageName, code, pageIdx) {
  const icons = extractLucideIcons(code);
  const fbUsed = scanImports(code, FIREBASE_EXPORTS);
  const utilsUsed = scanImports(code, UTILS_EXPORTS);
  const constUsed = scanImports(code, CONSTANTS_EXPORTS);
  const compUsed = scanImports(code, COMPONENTS_EXPORTS);

  // Always include React hooks if function uses them
  const hasHooks = /\buseState\b|\buseEffect\b|\buseCallback\b|\buseMemo\b|\buseRef\b/.test(code);
  
  const parts = [];
  // React import
  if (hasHooks) {
    const hooks = [];
    if (/\buseState\b/.test(code)) hooks.push('useState');
    if (/\buseEffect\b/.test(code)) hooks.push('useEffect');
    if (/\buseCallback\b/.test(code)) hooks.push('useCallback');
    if (/\buseMemo\b/.test(code)) hooks.push('useMemo');
    if (/\buseRef\b/.test(code)) hooks.push('useRef');
    if (/\blazy\b/.test(code)) hooks.push('lazy');
    if (/\bSuspense\b/.test(code)) hooks.push('Suspense');
    parts.push(`import React, { ${hooks.join(', ')} } from "react";`);
  } else {
    parts.push(`import React from "react";`);
  }

  // Lucide icons
  if (icons.length > 0) {
    parts.push(`import { ${icons.join(', ')} } from "lucide-react";`);
  }

  // Recharts
  if (/\bAreaChart\b|\bArea\b|\bBarChart\b|\bBar\b|\bPieChart\b|\bPie\b|\bCell\b|\bXAxis\b|\bYAxis\b|\bCartesianGrid\b|\bTooltip\b|\bResponsiveContainer\b|\bLegend\b/.test(code)) {
    parts.push(`import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";`);
  }

  // Firebase
  if (fbUsed.length > 0) {
    // Handle special aliases
    const aliased = fbUsed.map(e => {
      if (e === 'onFcmMessage') return 'onMessage as onFcmMessage';
      if (e === 'onMessage') return null; // skip bc it's aliased
      return e;
    }).filter(Boolean);
    if (aliased.length > 0) {
      parts.push(`import { ${aliased.join(', ')} } from "../firebase";`);
    }
  }

  // Utils
  if (utilsUsed.length > 0) {
    parts.push(`import { ${utilsUsed.join(', ')} } from "../utils";`);
  }

  // Components
  if (compUsed.length > 0) {
    parts.push(`import { ${compUsed.join(', ')} } from "../components";`);
  }

  // Constants  
  if (constUsed.length > 0) {
    parts.push(`import { ${constUsed.join(', ')} } from "../constants";`);
  }

  // CSS
  parts.push(`import "../App.css";`);

  const fileContent = parts.join('\n') + '\n\n' + code + '\n\nexport default ' + pageName + ';';
  return fileContent;
}

// Main
const boundaries = findPageBoundaries(lines, pageMeta);
console.log(`Found ${boundaries.length} page boundaries`);

for (const b of boundaries) {
  const codeBlock = lines.slice(b.start, b.end).join('\n');
  // Ensure we have the complete function
  const fnContent = '  ' + codeBlock.split('\n').slice(0, -1).join('\n');
  // Try to find where this function ends - find the next top-level function
  let endLine = b.end;
  for (let i = b.start + 1; i < Math.min(b.start + 1000, lines.length); i++) {
    // Check for top-level function definition
    if (/^function\s+\w/.test(lines[i]) && !/^function\s+(DashboardPage|OrdersPage|CategoriesPage|MenuPage|POSPage|CustomersPage|LiveTrackerPage|SettingsPage|LiveOpsPage|KitchenPage|InventoryPage|RidersPage|PartnersPage|AnalyticsPage|LostSalesPage|SettlementsPage|FeedbackPage|DiscountsPage|PromotionsPage|RiderAnalyticsPage|PaymentsPage|ActivityLogPage|App)\b/.test(lines[i])) {
      // This is a helper function used by a page - keep going
      continue;
    }
    if (/^function\s+(DashboardPage|OrdersPage|CategoriesPage|MenuPage|POSPage|CustomersPage|LiveTrackerPage|SettingsPage|LiveOpsPage|KitchenPage|InventoryPage|RidersPage|PartnersPage|AnalyticsPage|LostSalesPage|SettlementsPage|FeedbackPage|DiscountsPage|PromotionsPage|RiderAnalyticsPage|PaymentsPage|ActivityLogPage|App)\b/.test(lines[i]) && i !== b.start) {
      endLine = i;
      break;
    }
  }

  const pageCode = lines.slice(b.start, endLine).join('\n');
  
  // Determine what exports this page needs
  const fileContent = buildPageFile(b.name, pageCode, boundaries.indexOf(b));
  const filePath = path.join(PAGES_DIR, `${b.name}.jsx`);
  fs.writeFileSync(filePath, fileContent, 'utf8');
  console.log(`Created ${b.name}.jsx (${pageCode.split('\n').length} lines)`);
}

// Now generate a report of what to change in App.jsx
console.log('\n=== REPLACEMENT SUMMARY ===');
for (const b of boundaries) {
  console.log(`Replace in App.jsx: lines ${b.start+1}-${b.end} with "import ${b.name} from './pages/${b.name}';"`);
}
