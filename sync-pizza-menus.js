/**
 * ============================================================
 * DEPRECATED — use scripts/sync-catalog.js instead
 * ============================================================
 * Thin wrapper that forwards to the parameterized
 * scripts/sync-catalog.js with the original
 * Prashant → Roshani catalog arguments.
 * ============================================================
 */

const { spawnSync } = require('child_process');
const path = require('path');

console.warn('⚠️  sync-pizza-menus.js is deprecated. Use scripts/sync-catalog.js instead.');

const result = spawnSync(process.execPath, [
  path.join(__dirname, 'scripts', 'sync-catalog.js'),
  `--fromBiz=business_prashant`,
  `--fromOutlet=pizza-parsa`,
  `--toBiz=business_roshani`,
  `--toOutlet=outlet_pizza`,
], {
  stdio: 'inherit',
});

process.exit(result.status ?? 1);
