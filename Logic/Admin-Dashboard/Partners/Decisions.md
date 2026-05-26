# Decisions: PartnersPage

## Why mock data
No Firebase connection — mock data enables UI demo of partner management.

## Design choices
- **Simple approve/reject workflow** — binary action for supplier partner management
- **Status badge color derived from status string** — yellow for pending, green for approved, red for rejected
- **No add-partner form** — partners must be added via Firebase directly in production
