# Broadcast Tab — Complete Flow

## Page Load Sequence
```
1. Admin navigates to "Broadcast Center" tab
2. loadBroadcastHistory() called:
   ├─ db.ref('system/broadcasts').limitToLast(20).once('value')
   ├─ Update #broadcastSentCount, #broadcastThisWeek
   ├─ Render broadcast history list
   └─ lucide.createIcons()
```

## Send Broadcast Flow
```
1. Admin fills: title, body, audience, category, optional image URL
2. Taps "Send Broadcast"
3. sendBroadcast():
   ├─ Validate required fields
   ├─ checkRateLimit('SEND_BROADCAST')
   ├─ If rate limited → showToast("Please wait 60s"), return
   ├─ Build broadcast object
   ├─ db.ref('system/broadcasts').push({ title, body, audience, category, image, sentBy, sentAt, stats: {sent:0} })
   ├─ logAdminAction('BROADCAST_SENT', { title, audience, category })
   ├─ showToast("Broadcast sent")
   ├─ Reset form
   └─ Reload history
```
