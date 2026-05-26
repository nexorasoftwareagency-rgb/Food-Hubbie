# Code-Logics: PartnersPage

**Location**: App.jsx lines 2117-2196

## Props
- `{ showToast }`

## State
- `partners` — from `MOCK_PARTNERS`

## Handlers
- `update(id, status)` — updates partner status locally (values: `"pending"`, `"approved"`, `"rejected"`)

## Renders
- **Table**: Avatar initials, partner name, type, since date, contact phone, status badge (colored by status), Approve / Reject buttons
- **Status colors**: pending = `"#f59e0b"` (yellow), approved = `"#22c55e"` (green), rejected = `"#ef4444"` (red)
