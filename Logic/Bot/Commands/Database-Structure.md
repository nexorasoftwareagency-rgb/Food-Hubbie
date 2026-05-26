# Bot Commands (commands.js) — Database Structure

## `botCommands/{cmdId}`
| Field | Type | Required | Description |
|---|---|---|---|
| `action` | string | yes | `"SEND_GENERIC_MESSAGE"` or `"SEND_DAILY_REPORT"` |
| `phone` | string | for SEND_GENERIC_MESSAGE | Recipient phone number |
| `message` | string | for SEND_GENERIC_MESSAGE | Text to send |
| `targetDate` | string | no | Date in `YYYY-MM-DD` format (default: today IST) |
| `timestamp` | number | no | When command was created |

### Example — Generic Message
```json
{
  "action": "SEND_GENERIC_MESSAGE",
  "phone": "919876543210",
  "message": "Your order is ready!",
  "timestamp": 1748191200000
}
```

### Example — Daily Report
```json
{
  "action": "SEND_DAILY_REPORT",
  "targetDate": "2026-05-25",
  "timestamp": 1748191200000
}
```
