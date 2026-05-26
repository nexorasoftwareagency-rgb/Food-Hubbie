# Bot Commands (commands.js) — Complete Flow

## Command Execution Flow

```
1. ADMIN writes to botCommands via Admin Dashboard or Firebase console
   └─ { action: "SEND_DAILY_REPORT", targetDate: "2026-05-25" }

2. Bot's child_added listener fires
   ├─ Parse command action
   ├─ Execute handler
   └─ Remove command node

3. SEND_GENERIC_MESSAGE:
   ├─ Validate phone + message present
   ├─ Format phone to JID via formatJid()
   └─ Send text message via sock.sendMessage()

4. SEND_DAILY_REPORT:
   ├─ Fetch all orders
   ├─ Filter by targetDate (IST), exclude Cancelled
   ├─ Calculate totalOrders, totalRevenue
   ├─ Aggregate top 5 items
   ├─ Format WhatsApp message
   └─ Send to settings/Store.reportPhone
```
