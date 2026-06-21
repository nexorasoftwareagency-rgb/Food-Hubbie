# Admin Promotions Module (promotions.js + promotions-templates.js + promotions-guide.js) — Code Logics

## Overview
Three-file Admin-side promotions system:
1. `promotions.js` (972L) — composer, recipient builder, campaign launcher, live progress, kill switch, clone, CSV export
2. `promotions-templates.js` (216L) — template CRUD (save/load/delete)
3. `promotions-guide.js` (60L) — 6-step guide modal content

## promotions.js — Main Module

### State
```js
_campaignListener, _killSwitchListener, _botStatusListener, _enabledListener
_recipientsCache, _uploadFile, _mediaDataUrl, _mediaFile
_menuImageDataUrl, _menuImageFile, _activeMode, _killSwitchLocal
_promoEnabledLocal, _botOnline, _allCampaignsSnap
```

### Composer
- Campaign name (auto-generated if empty)
- Message template with token preview ({name}, {phone}, {lastOrderDate}, {storeName}, {couponCode})
- Optional image attachment (client-side preview)
- Optional menu image footer
- Greeting prefix toggle

### Recipient Sources
1. **All Customers** — reads `Outlet.ref('customers')`, extracts phone numbers
2. **Filtered** — customers with orders in last N days, inactive > N days
3. **Custom paste** — one number per line, auto-deduped
4. **CSV/Excel upload** — auto-detects phone column via `PHONE_HINTS` regex

### Campaign Launcher
1. Validate: at least 1 recipient, message not empty
2. Push command to `bot/{outlet}/commands/` with action `"SEND_PROMOTION"`
3. Create campaign doc in `bot/{outlet}/promotions/campaigns/`
4. Set status to `"running"` (or `"scheduled"` for future)

### Live Progress
- `onValue(campaigns/{activeId})` — updates progress bar, sent/failed counts
- Detach listener on tab switch (Spark plan safety)
- Shows: progress bar %, sent count, failed count, ETA

### Kill Switch
- Reads `bot/{outlet}/promotions/killSwitch`
- "🛑 KILL ALL" button → `set(killSwitchRef, true)`
- "Resume" button → `set(killSwitchRef, false)`

### Bot Status
- Listens to `bot/{outlet}/status` for online/offline
- Shows green/red dot in header
- Disables Start button when bot is offline

### Campaign History
- Lists all campaigns with status, dates, recipient count
- "📋 Duplicate" button → clone with new ID, status="draft"
- "⬇ Export CSV" → per-recipient log export

### Dashboard-Level Enable Toggle
- `bot/{outlet}/promotions/enabled` — master toggle
- When off: UI hides Promotions tab, bot ignores commands

## promotions-templates.js
- Save template: `push()` to `Outlet.ref('promotions/templates')`
- Load templates: `onValue` listener on `promotions/templates`
- Delete template: `remove()` from `promotions/templates/{id}`
- Apply template: fills composer message field

## promotions-guide.js
- 6-step content rendered into `promotionsGuideModal`
- Steps: Compose → Pick recipients → Preview → Send/Schedule → Monitor → Stay safe

## Dependencies
- `firebase.js` — Outlet, ref, get, onValue, set, update, remove, push, runTransaction, query, orderByChild, equalTo, limitToLast
- `state.js`, `ui-utils.js`, `utils.js`
- `promotions-guide.js` — guide content
