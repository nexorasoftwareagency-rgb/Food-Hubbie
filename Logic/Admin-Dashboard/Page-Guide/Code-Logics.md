# Page Guide Module (page-guide.js) — Code Logics

## Overview
Contextual help system for every Admin Dashboard page. Shows a modal with step-by-step guidance when the user clicks the help icon (❓) in the header.

## File
`Admin/js/features/page-guide.js` (541 lines)

## Structure
```js
const GUIDES = {
  dashboard: [ { icon, title, body }, ... ],
  orders: [ ... ],
  menu: [ ... ],
  pos: [ ... ],
  inventory: [ ... ],
  riders: [ ... ],
  analytics: [ ... ],
  liveTracker: [ ... ],
  // ... all pages covered
};
```

## Each guide entry
```js
{
  icon: 'layout-dashboard',  // Lucide icon name
  title: 'Dashboard Overview',
  body: 'The dashboard shows real-time business metrics...'
}
```

## How it works
1. User clicks ❓ icon in header
2. `openPageGuide()` called with current page ID
3. Guide modal opens with numbered steps
4. Each step has an icon, title, and body text
5. Steps rendered as a vertical list with icons

## Pages covered
- Dashboard, Orders, Menu, POS, Inventory, Riders, Analytics
- Live Tracker, Rider Analytics, Customers, Settlements
- Lost Sales, Notifications, Feedback, Settings
- Discounts, Promotions, Kitchen, LiveOps

## Dependencies
- `state.js` — current page ID
- `ui-utils.js` — modal open/close
- Lucide icons (rendered via `lucide.createIcons()`)
