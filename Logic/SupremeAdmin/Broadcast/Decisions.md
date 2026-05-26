# Broadcast — Decisions

1. **Client-side rate limiting**: Rate limiting (5s cooldown, 5/min) is implemented in JavaScript. This is trivially bypassable — a determined user can send unlimited broadcasts by modifying client code.

2. **Audience as metadata only**: The audience field is stored as a string with no server-side routing. The actual audience filtering would need to happen in a Cloud Function or elsewhere.

3. **Push to /system/broadcasts**: Broadcasts stored under /system/broadcasts as push keys. Makes them accessible to all apps with read access to /system.

4. **Form fields cleared after send**: Title, message, and audience reset after successful broadcast. Prevents accidental double-send of same message.

5. **No broadcast scheduling**: All broadcasts are sent immediately. No option to schedule for later delivery.

6. **No broadcast templates**: Each broadcast is composed from scratch. No saved templates for common message types.
