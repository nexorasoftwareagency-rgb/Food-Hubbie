# Decisions: Admin Discounts Module

## Why three separate files?
- `discount-evaluator.js` — pure logic, testable in isolation, used by both Admin POS and Bot
- `discounts.js` — CRUD UI (Firebase reads/writes, tab rendering, modal forms)
- `discountsReports.js` — analytics (read-only, separate modal to keep CRUD clean)

## Tab-based filtering (client-side)
All discounts are fetched once via `onValue`, then filtered client-side by status. No server-side queries needed for <100 discounts.

## Feature flag `discounts/featureEnabled`
Admin UI hides the Discounts tab when flag is off. Evaluator returns `null` immediately. Allows instant rollback without code deploy.

## Manual override in POS
Cashier's manual discount always wins. This is a deliberate UX choice: the cashier is the authority at the point of sale. Auto-discount is logged but not applied when manual is present.

## 30s cache for reads
Same reasoning as bot-side: prevents 100-order rush from burning Firebase reads. Cache cleared after CRUD operations via `clearDiscountCache()`.
