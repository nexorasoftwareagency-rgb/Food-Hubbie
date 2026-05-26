# Bot Entry (index.js) — Complete Flow

## Bot Lifecycle

```
1. PM2 starts index.js with env BUSINESS_ID + OUTLET_ID
2. startBot() called
3. Session dir created: sessions/{bid}_{oid}/
4. Auth state loaded from disk (or fresh if first time)
5. Baileys version fetched from WhatsApp servers
6. WASocket created →
   ├─ QR shown in terminal (if no saved session)
   ├─ User scans QR with WhatsApp
   └─ Connection opens
7. On 'open':
   ├─ initStatusMonitor(sock) — order listener starts
   ├─ initCommandListener(sock) — admin commands listener starts
   └─ Heartbeat interval (60s) — writes botStatus to Firebase
8. On 'messages.upsert':
   └─ handleIncomingMessage(sock, msg) — processes user messages
9. On 'close':
   └─ Reconnect (unless logged out) → restart from step 2
```

## Multi-Instance
Each EC2 instance runs one outlet. PM2 manages both:
```
app "foodhubbie-bot-roshani-pizza" → BUSINESS_ID=business_roshani, OUTLET_ID=outlet_pizza
app "foodhubbie-bot-roshani-cake"  → BUSINESS_ID=business_roshani, OUTLET_ID=outlet_cake
```
