# Broadcast Tab — Important Points

1. **Rate limiter**: In-memory `_rateLimitStore` — 60s cooldown, resets on page refresh
2. **No actual FCM push**: Broadcast data stored in Firebase but actual FCM delivery requires integration with Cloud Functions or client app logic
3. **Audience segment stored as label**: No actual user filtering at broadcast time — stored for record; actual targeting assumed handled elsewhere
4. **Broadcast history limit**: Last 20 broadcasts only (via `limitToLast(20)` query)
5. **Image URL**: Not validated — broken images displayed client-side
6. **Stats tracking**: `stats/sent` stored but not incremented by any process (placeholder)
7. **Category emoji prefix**: Stored as part of the category label (e.g., "🎉 Promotion")
