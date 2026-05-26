# Decisions: LostSalesPage

## Why mock data
Static display of lost sales data — informational dashboard component with no backend dependency.

## Design choices
- **KPIs summarize revenue lost** to cancellations and unavailability
- **No action items** — purely analytical view with no remediation features
- **Cancelled count uses string matching** — checks if reason contains "cancel" (case-insensitive)
