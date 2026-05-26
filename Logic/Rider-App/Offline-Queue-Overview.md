# Rider App — Offline Queue Overview

## Purpose
Handle temporary network interruptions by queuing write operations and replaying them when connectivity resumes.

## Queue Storage
- **Location**: `localStorage` via `JSON.parse/stringify`
- **Key**: `"offlineQueue"`
- **Format**: Array of queued actions

## Queued Action Format
```javascript
{
  id: "queue_1712345678_001",
  type: "ACCEPT_ORDER" | "UPDATE_STATUS" | "REACHED_OUTLET",
  payload: {
    orderId: "ORD123",
    bid: "business1",
    oid: "outlet1",
    timestamp: 1712345678901,
    data: { /* Firebase write data */ }
  },
  retries: 0,
  createdAt: 1712345678901
}
```

## Queue Lifecycle
```
1. Action triggers while navigator.onLine === false
   → Serialize action → push to localStorage queue
   → Show #offlineIndicator with queue count

2. Connectivity resumes (on('value') on .info/connected)
   → Read queue from localStorage
   → Process actions in FIFO order
   → For each action:
       a. Attempt Firebase write
       b. On success → remove from queue
       c. On failure → retry (max 3), keep in queue
   → Update #offlineIndicator
   → When queue empty → hide indicator, show "Synced" toast

3. App closes with pending queue
   → Queue persists in localStorage
   → On next load + connectivity → process queue
```

## Supported Actions
| Action | Firebase Write | Conflict Handling |
|---|---|---|
| `ACCEPT_ORDER` | `transaction` on order assignment | Transaction may fail (order taken) → discard from queue |
| `UPDATE_STATUS` | Direct write to `orders/{id}/status` | Client-side check if status is valid transition |
| `REACHED_OUTLET` | Write `arrivedAtRestaurantAt` | Idempotent (timestamp overwrite) |

## Visual Feedback
```html
<div id="offlineIndicator" class="hidden">
  <span class="offline-dot"></span>
  You're offline — <span id="queueCount">3</span> actions queued
</div>

<div id="syncStatus" class="hidden">
  <span class="sync-spinner"></span>
  Syncing...
</div>
```

## Edge Cases
| Scenario | Handling |
|---|---|
| Queue grows large | Show count, max 50 items warning |
| Action fails after 3 retries | Notify user "Some actions failed to sync" |
| Transaction conflict on replay | Action removed from queue (order taken by another) |
| Duplicate actions on replay | Check if order already updated before writing |
| localStorage full | Show "Storage full" error, prompt manual sync |
