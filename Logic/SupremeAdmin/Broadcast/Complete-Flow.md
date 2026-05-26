# Broadcast — Complete Flow

## User Journey
1. Admin clicks Broadcast tab → initBroadcast() fires
2. Form displays: Title, Message, Audience dropdown
3. History table loads: last 50 broadcasts
4. Admin composes broadcast:
   a. Enters title and message
   b. Selects audience (All/Customers/Partners/Riders)
   c. Clicks "Send Broadcast"
5. Rate limit check:
   a. If < 5s since last: toast "Please wait 5 seconds"
   b. If >= 5/min: toast "Rate limit exceeded"
   c. Otherwise: proceed
6. Broadcast pushed to /system/broadcasts/{key}
7. Form cleared, success toast shown
8. History refreshes with new broadcast at top

## Rate Limit Flow
btnSendBroadcast() → check lastBroadcastTime (5s) → check broadcastCount (5/min) →
  pass → push to RTDB → update timers → clear form → refresh history

## History Flow
loadBroadcastHistory() → /system/broadcasts → orderByChild("timestamp") → limitToLast(50) →
  renderTable(title, message, audience, timestamp)
