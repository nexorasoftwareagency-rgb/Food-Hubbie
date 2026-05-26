# Broadcast — Code Logics

## Initialization
- initBroadcast() renders the broadcast form
- Calls loadBroadcastHistory() for recent broadcasts

## Send Broadcast
- btnSendBroadcast():
  1. Reads title, message, audience from form
  2. Rate limiting check:
     - minimum 5 seconds between broadcasts (lastBroadcastTime)
     - maximum 5 broadcasts per minute (broadcastCount reset every 60s)
  3. Pushes to /system/broadcasts/{key}:
     {title, message, audience, timestamp: Date.now()}
  4. Clears form fields
  5. Shows success toast
  6. Calls loadBroadcastHistory()

## Rate Limiting
- lastBroadcastTime: tracks last send timestamp (5s cooldown)
- broadcastCount: counter for broadcasts in current minute
- lastMinuteReset: timestamp of last counter reset
- On each send attempt:
  - If < 5s since last: reject with "Please wait 5 seconds"
  - If >= 5/min: reject with "Rate limit exceeded (5/min)"
  - Otherwise: allow, increment count

## Audience Targeting
- Dropdown selection: All, Customers, Partners, Riders
- Stored as string in broadcast record
- No server-side filtering — audience is metadata only

## Broadcast History
- loadBroadcastHistory():
  - Query: /system/broadcasts ordered by timestamp desc, limit 50
  - Renders table: Title, Message (truncated), Audience, Timestamp
  - No delete or resend functionality
