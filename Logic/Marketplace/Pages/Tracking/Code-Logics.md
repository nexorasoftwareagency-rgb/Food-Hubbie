# Tracking Page — Code Logics

## Overview
Real-time order tracking with visual status pipeline, ETA, and review prompt after delivery.

## State
| Variable | Type | Description |
|---|---|---|
| `currentIdx` | number | Index in STATUS_PIPELINE |
| `eta` | number | Estimated minutes remaining |
| `isReviewModalOpen` | boolean | Review modal visibility |

## Key Logic
- **Status pipeline**: `STATUS_PIPELINE` from orderService — ordered list of all statuses
- **`statusIndex(status)`**: Maps status string to pipeline index
- **Stage icons**: Each status has a `lucide-react` icon (CheckCircle2, Clock, ChefHat, Flame, etc.)
- **Stage messages**: Human-readable description per status (e.g., "Your order has been received.")
- **Demo mode**: Simulates order advancing every 6 seconds (disabled in production with comment)
- **Review**: Shows "Rate your order" button after delivery; opens `ReviewModal`

## UI Sections
1. Order header (outlet name, order ID)
2. Status pipeline with animated step indicators (completed / current / upcoming)
3. Current status card with ETA
4. Rider info card (name, phone, vehicle — if assigned)
5. Order summary (items list, total)
6. Review prompt (after delivery)

## Decisions
- Visual pipeline shows all 9 statuses with icon + label
- ETA is hardcoded at 35 min (no real-time API)
- Demo auto-advance for development only
- Review modal opens inline (not a separate page)
