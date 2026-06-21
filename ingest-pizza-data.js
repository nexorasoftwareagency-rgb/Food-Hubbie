/**
 * ============================================================
 * DEPRECATED — use scripts/seed-business.js instead
 * ============================================================
 * This script is kept as a thin wrapper so existing muscle-memory
 * commands and CI pipelines keep working. The canonical seeder
 * is parameterized and multi-tenant.
 *
 * Forwarding to scripts/seed-business.js with the original
 * Prashant/Pizza fixture arguments.
 * ============================================================
 */

const { spawnSync } = require('child_process');
const path = require('path');

const FIXTURE = process.env.SEED_FIXTURE || 'd:\\Foodhubbie\\extracted_pizza_data.json';
const SERVICE_ACCOUNT =
  process.env.SERVICE_ACCOUNT_PATH ||
  'C:\\Users\\DELL\\Downloads\\food-hubbie-firebase-adminsdk-fbsvc-4b2c8e7f78.json';

console.warn('⚠️  ingest-pizza-data.js is deprecated. Use scripts/seed-business.js instead.');

const result = spawnSync(process.execPath, [
  path.join(__dirname, 'scripts', 'seed-business.js'),
  `--biz=business_prashant`,
  `--outlet=pizza-parsa`,
  `--slug=pizza-parsa`,
  `--name=Prashant Pizza (Parsa)`,
  `--entity=Prashant Group`,
  `--address=Near Government Hospital Parsa, Saran - 841219`,
  `--lat=25.87143`,
  `--lng=84.9923783`,
  `--fixture=${FIXTURE}`,
], {
  stdio: 'inherit',
  env: { ...process.env, SERVICE_ACCOUNT_PATH: SERVICE_ACCOUNT },
});

process.exit(result.status ?? 1);
