# Live Orders Tab — Decisions

## Design Decisions
1. **Dual view (Table + Kanban)** — Table for detailed data review, Kanban for visual pipeline management
2. **Persisted view preference** — Admin's chosen view saved to localStorage
3. **Pipeline metric cards** — Quick status breakdown with click-to-filter
4. **SLA breach detection** — 30-minute threshold with visual alerts prevents stale orders
5. **Drag-and-drop Kanban** — HTML5 Drag and Drop API — intuitive status updates without dropdowns
6. **Real-time listener** — `on('value')` on businesses for live order updates
7. **Status update via SweetAlert2** — Confirmation before status change prevents mistakes
8. **Outlet filter** — Scope orders to specific partner for focused management
