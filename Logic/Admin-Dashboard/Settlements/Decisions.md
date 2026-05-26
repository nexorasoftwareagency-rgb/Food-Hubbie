# Decisions: SettlementsPage

## Why mock data
Simple financial overview with no backend dependency — mock transactions for UI demo.

## Design choices
- **"PDF" export button also generates CSV** — no actual PDF generation; labeled PDF but calls same CSV function
- **Amount sign indicates direction** — positive = credit (green), negative = debit (red)
- **View-only** — no real settlement processing
