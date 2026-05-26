# Bot Commands (commands.js) — Code Logics

## Overview
Listens for admin-triggered commands written to Firebase `botCommands` path and executes them.

## Dependencies
- `./firebase` — db, resolvePath, getData
- `../shared/utils` — formatJid

## Listener
- `child_added` on `businesses/{bid}/outlets/{oid}/botCommands`
- Processes each command once, then **removes the node** via `snap.ref.remove()`

## Supported Commands

### `SEND_GENERIC_MESSAGE`
- Fields: `phone`, `message`
- Sends plain text WhatsApp message to specified phone

### `SEND_DAILY_REPORT`
- Fields: `targetDate` (optional, defaults to today)
- Generates sales report for the given date
- Steps:
  1. Fetch all orders from Firebase
  2. Filter by `targetDate` (IST timezone adjusted), exclude Cancelled
  3. Compute: totalOrders, totalRevenue, top 5 items by quantity
  4. Send formatted report to `settings/Store.reportPhone`

### Helpers
- `handleDailyReport(sock, cmd)` — generates and sends report
- IST date conversion: adds 5h30m to UTC epoch before extracting YYYY-MM-DD

## Cleanup
- Every command node is deleted after processing (`snap.ref.remove()`)
- Prevents re-triggering on bot restart
