# Decisions: RidersPage

## Why mock data
Real rider data should come from `riders/` Firebase node. Mock data enables UI development and demo without backend.

## Design choices
- **Dual view (table/grid)** — table for data density, grid for visual overview
- **RIDER_CHART per-rider data** — each rider has hardcoded weekly earnings data for chart demonstration
- **Toggle status only affects local state** — no Firebase write, simulates activation/deactivation
- **Completion rate computed** as `(completed / totalOrders) * 100` from mock data
