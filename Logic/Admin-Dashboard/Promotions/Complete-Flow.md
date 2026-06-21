# Complete Flow: Admin Promotions Module

## 1. Admin opens Promotions tab
1. Tab loads, `onValue` listeners attach (campaigns, killSwitch, botStatus, enabled)
2. Bot status dot shows green (online) or red (offline)
3. Composer ready with empty message field

## 2. Admin composes campaign
1. Types message with tokens ({name}, {phone}, etc.)
2. Token preview updates live below textarea
3. Optionally attaches image
4. Selects recipient source (all customers / filtered / paste / CSV)

## 3. Admin previews & tests
1. Click "👁 Preview" → shows sample personalized message
2. Click "🧪 Send Test" → sends to admin's own number

## 4. Admin starts campaign
1. Click "🚀 START CAMPAIGN"
2. Command pushed to `bot/{outlet}/commands/`
3. Campaign doc created in `promotions/campaigns/`
4. Live progress bar appears

## 5. Bot executes
1. Bot picks up command via `initCommandListener()`
2. `runPromotionCampaign()` walks recipients with 2s delay
3. Progress updates written to `promotions/campaigns/{id}`
4. Admin sees real-time progress bar

## 6. Admin monitors
1. Progress bar: percentage, sent/failed counts, ETA
2. Live log: phone, status, timestamp
3. Can pause/stop/kill at any time

## 7. Campaign completes
1. Status → `"done"`, `completedAt` set
2. Final stats: total sent, total failed
3. "⬇ Export CSV" available for post-mortem

## 8. Cross-page flows
- **Discounts** — coupon codes generated per-recipient can be redeemed in checkout
- **Orders** — campaign sends logged in `discountsUsage`
- **Dashboard** — kill-switch widget on dashboard for emergency control
