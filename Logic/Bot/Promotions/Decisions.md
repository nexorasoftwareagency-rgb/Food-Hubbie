# Decisions: Bot Promotions Module

## Why bypass `appendContactInfo`?
Every bot message gets "If you have any Doubt Contact Admin: 9876543210" appended. For promotional messages, this is unprofessional and clutters the message. `sendPromotionalMessage()` omits this and instead adds "Reply STOP to unsubscribe."

## Why resume-on-startup?
The bot's in-memory counters (`reconnectAttempts`, `cryptoErrorCount`) reset to 0 on every reconnect. A campaign running in memory would be silently lost. RTDB is the source of truth; the bot re-reads `currentIndex` and resumes.

## 2-second default delay
WhatsApp (unofficial Baileys) penalizes fast sending. 2s is safe for ≤100 recipients. 30s pause every 50 sends adds human-like pacing. Configurable per campaign.

## Kill-switch design
Global boolean at `bot/{outlet}/promotions/killSwitch`. Checked before every send. Admin UI has a "🛑 KILL ALL" panic button. Setting to `false` resumes.

## Concurrency lock
One active campaign per outlet. `bot/{outlet}/promotions/lock` node with `transaction` to acquire. Prevents two parallel loops on the same Baileys socket from triggering WhatsApp anti-spam.

## Quiet hours default 10:00–21:00 IST
WhatsApp bans numbers that send messages at unusual hours. The campaign loop sleeps past the quiet window. Configurable per campaign.

## Per-send socket health
A 5-minute campaign can outlive the WhatsApp socket. Checking `sock.ws.isClosed` before every send prevents silent failures.

## Crypto-error threshold 100
`cryptoErrorCount > 100` means the session is degrading. Next send likely to fail. Pause the campaign and wait for resume-on-startup to pick it up after reconnection.
