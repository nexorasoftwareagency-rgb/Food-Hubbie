# Broadcast Tab — Code Logics

## Purpose
Notification broadcast center — send push notifications to targeted user segments, view history.

## Key Functions (main.js)
| Function | Trigger | Action |
|---|---|---|
| `sendBroadcast()` | Form submit | Rate-limited broadcast creation |
| `loadBroadcastHistory()` | Tab load | Load last 20 broadcasts with stats |

## Data Sources
| Path | Operation | Purpose |
|---|---|---|
| `system/broadcasts/{key}` | Push, Read | Broadcast storage |
| `system/auditLogs` | Push | Audit trail |

## Compose Form
| Field | ID | Type | Options |
|---|---|---|---|
| Title | `#broadcastTitle` | text | Required |
| Body | `#broadcastBody` | textarea | Required |
| Audience | `#broadcastAudience` | select | all_users, active_7d, inactive_30d, high_value, riders |
| Category | `#broadcastCategory` | select | promotion, announcement, update, alert |
| Image URL | `#broadcastImage` | url | Optional |

## Audience Targeting
| Value | Description |
|---|---|
| `all_users` | All registered customers |
| `active_7d` | Active in last 7 days |
| `inactive_30d` | No activity in 30+ days |
| `high_value` | Spent ₹1000+ total |
| `riders` | All delivery riders |

## Rate Limiting
```javascript
checkRateLimit('SEND_BROADCAST'):
  Max 1 broadcast per 60 seconds
  In-memory store, resets on page refresh
```

## Broadcast Stats
| Metric | Description |
|---|---|
| Total Sent | Count of all broadcasts |
| This Week | Count of broadcasts in current week |
| History | Last 20 broadcasts with title, audience, category, timestamp |

## Edge Cases
- **Rate limit hit** → "Please wait 60s between broadcasts" toast
- **Empty title or body** → HTML5 `required` prevents submit
- **No broadcast history** → "No broadcasts sent yet" empty state
- **Image URL invalid** → Not validated; shown if URL provided
