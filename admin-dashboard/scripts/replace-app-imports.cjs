const fs = require('fs');
const path = require('path');

let appJsx = fs.readFileSync(path.join(__dirname, '..', 'src', 'App.jsx'), 'utf8');
const lines = appJsx.split('\n');

const pageNames = [
  'DashboardPage', 'OrdersPage', 'CategoriesPage', 'MenuPage', 'POSPage',
  'CustomersPage', 'LiveTrackerPage', 'SettingsPage', 'LiveOpsPage', 'KitchenPage',
  'InventoryPage', 'RidersPage', 'PartnersPage', 'AnalyticsPage', 'LostSalesPage',
  'SettlementsPage', 'FeedbackPage', 'DiscountsPage', 'PromotionsPage',
  'RiderAnalyticsPage', 'PaymentsPage', 'ActivityLogPage'
];

// Find line numbers for each function
const funcLines = {};
for (const name of pageNames) {
  const idx = lines.findIndex(l => l.trimStart().startsWith(`function ${name}(`));
  if (idx !== -1) funcLines[name] = idx;
}

// Build ranges to remove (sorted by line number)
const ranges = Object.entries(funcLines)
  .map(([name, start]) => ({ name, start }))
  .sort((a, b) => a.start - b.start);

// Set end for each range (to next function or to "function App(")
const appLine = lines.findIndex(l => l.trimStart().startsWith('function App('));
for (let i = 0; i < ranges.length; i++) {
  if (i < ranges.length - 1) {
    ranges[i].end = ranges[i + 1].start;
  } else {
    ranges[i].end = appLine > ranges[i].start ? appLine : lines.length;
  }
}

// Build new content
const imports = pageNames.map(n => `import ${n} from "./pages/${n}";`).join('\n');

// Find insert point for imports (after existing imports and before "const t = ")
const insertPoint = lines.findIndex(l => l.trimStart().startsWith('const t = '));

// Build result: header + imports + everything from insertPoint onward minus the removed ranges
const result = [];

// Keep everything up to the insert point
for (let i = 0; i < insertPoint; i++) {
  result.push(lines[i]);
}

// Add imports
result.push(imports);
result.push('');

// Add everything from insertPoint onward, skipping removed ranges
function isInRange(lineNum) {
  for (const r of ranges) {
    if (lineNum >= r.start && lineNum < r.end) return true;
  }
  return false;
}

for (let i = insertPoint; i < lines.length; i++) {
  if (!isInRange(i)) {
    result.push(lines[i]);
  }
}

fs.writeFileSync(path.join(__dirname, '..', 'src', 'App.jsx'), result.join('\n'), 'utf8');
console.log('Updated App.jsx with imports, removed inline page definitions');
console.log(`Imports added: ${imports.split('\n').length}`);
console.log(`Ranges removed: ${ranges.length}`);
