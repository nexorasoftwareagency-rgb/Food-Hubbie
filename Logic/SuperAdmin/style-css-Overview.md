# SuperAdmin — Style CSS Overview

## File
- **style.css** — 674 lines
- Single CSS file for entire CRM dashboard
- Green theme (`--pro-primary: #10B981`)

## Design Tokens (`:root`)
| Variable | Value | Usage |
|---|---|---|
| `--pro-primary` | `#10B981` | Primary green |
| `--pro-primary-glow` | `rgba(16,185,129,0.12)` | Glow effects |
| `--pro-accent` | `#F97316` | Accent orange |
| `--pro-accent-glow` | `rgba(249,115,22,0.10)` | Accent glow |
| `--pro-bg` | `#F6F8FA` | Page background |
| `--pro-sidebar` | `#FFFFFF` | Sidebar background |
| `--pro-card` | `#FFFFFF` | Card background |
| `--pro-border` | `#E2E8F0` | Border color |
| `--pro-text` | `#1E293B` | Text color |
| `--pro-muted` | `#64748B` | Muted text |
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,0.1)` | Small shadow |
| `--shadow-md` | `0 4px 12px rgba(0,0,0,0.08)` | Medium shadow |
| `--shadow-lg` | `0 10px 30px rgba(0,0,0,0.08)` | Large shadow |
| `--pro-gradient` | `135deg, #10B981, #059669` | Primary gradient |
| `--accent-gradient` | `135deg, #F97316, #EA580C` | Accent gradient |
| `--hero-gradient` | `135deg, #10B981, #34D399, #F97316` | Hero banner |

## Keyframe Animations (5)
| Name | Duration | Purpose |
|---|---|---|
| `fadeIn` | 0.3s | Tab pane entrance |
| `pulse` | 2s | Live status indicator |
| `slideUp` | 0.3s | Modal entrance |
| `shimmer` | 1.5s | Loading skeleton |
| `blink` | 1s | Attention indicator |

## Section Catalog

### Auth Layer (56-72)
- Full-screen overlay with `--pro-gradient` background
- `.auth-card` — Dark semi-transparent card, centered, rounded
- Login form + 2FA modal share `.auth-overlay` and `.auth-card` classes

### Form Inputs (74-111)
- `.pro-input` — Standard input with dark bg, border, focus ring
- `.auth-input` — Auth-specific input variant
- `.input-pro` — Lighter variant for inline forms
- Consistent: border-radius, padding, font-size, focus styles

### Master Layout (113-174)
- Flexbox layout: sidebar (250px) + main
- `.pro-sidebar` — White fixed sidebar with logo on top, nav in middle, profile at bottom
- `.pro-main` — Scrollable main content area
- `.nav-link` — Sidebar links with `gap: 12px`, hover/focus transitions
- `.nav-group-label` — Section headers in sidebar

### Metrics (175-230)
- `.metric-grid` — CSS grid for KPI cards (responsive columns)
- `.metric-card` — White card with metric-icon, value, label
- `.metric-value` — Large bold number
- `.metric-label` — Small muted label
- `.kpi-sparkline` — SVG sparkline container
- `.stat-pill` — Onboarding tab stats (pending count, approved count)

### Cards & Tables (232-258)
- `.pro-card` — White card with padding, shadow, border-radius
- `.pro-table` — Full-width table with header styling, row hover, alternating rows
- `.table-header` — Flex row with title + actions

### Badges (260-281)
- `.badge-success/warning/info/danger` — Colored pills
- `.badge-live` — Green badge with pulse animation
- `.pro-badge` — Base badge class

### Buttons (283-309)
- `.btn-pro` — Primary button with `--pro-gradient`, uppercase, bold
- `.btn-pro-icon` — Icon-only variant
- `.btn-muted` — Secondary/subtle button
- `.btn-danger` — Red button
- `.btn-success` — Green button
- `.btn-accent` — Orange accent button
- `.btn-sm` — Small variant

### Modals (311-327)
- `.modal-overlay` — Fixed fullscreen, dark backdrop
- `.modal-content` — Centered card with `backdrop-filter: blur(12px)`
- Slide-up entrance animation

### Toast (329-343)
- `.pro-toast` — Fixed bottom-right, glassmorphism
- `.toast-success` — Green left border
- `.toast-error` — Red left border
- `.toast-info` — Blue left border
- Slide-up + fade-out animation

### KYC Upload (344-353)
- Dashed border upload boxes for rider photo + aadhar

### Tab System (355-357)
- `.tab-pane` — Default `display: none`
- `.tab-pane.active` — `display: block` with `fadeIn`

### Visualizations (359-400)
- `.viz-heatmap` — Order heatmap table
- `.kpi-sparkline` — SVG container
- `.donut-legend` — Legend for chart
- Status dots for online/offline

### Audit Console (401-403)
- `.font-mono` — Monospace for audit log display
- `.line-height-1-6` — Readable log formatting

### Hero Banner (414-430)
- `.overview-hero` — Gradient banner with decorative circles
- Used on Dashboard and Reconciliation tabs

### Kanban Board (552-612)
- `.kanban-board` — Flex container for columns
- `.kanban-column` — Individual column with header + cards
- `.kanban-card` — Draggable order card
- `.overdue` — Red left border for SLA-breached orders
- Drag-over highlight states

### Pagination (614-674)
- `.pagination-container` — Flexbox row
- `.pagination-btn` — Numbered page buttons
- `.pagination-btn.active` — Highlighted current page
- `.pagination-ellipsis` — "..." separator
- Previous/Next arrow buttons

### Utility Classes (435-534)
- Spacing: `.mt-*`, `.mb-*`, `.p-*`, `.gap-*`
- Flex: `.flex`, `.flex-col`, `.flex-1`, `.items-center`, `.justify-center`
- Grid: `.grid`, `.grid-cols-2`, `.grid-cols-3`
- Typography: `.text-xs`, `.text-sm`, `.font-bold`, `.font-black`, `.text-muted`
- Border: `.border-dashed`, `.rounded-lg`, `.rounded-xl`
- Misc: `.hidden`, `.w-full`, `.cursor-pointer`, `.animate-spin`, `.animate-pulse`

### Responsive (542-550)
- Breakpoint: 1024px
- Sidebar collapses to icon-only
- Grids reduce columns

### Custom Scrollbar (535-539)
```css
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-thumb {
  background: var(--pro-border);
  border-radius: 3px;
}
```

## Theme Comparison
| Token | SuperAdmin (green) | Rider App (orange) |
|---|---|---|
| Primary | `#10B981` | `#FF5200` |
| Background | `#F6F8FA` | `#F4F6F8` |
| Gradient | Green → Dark Green | Orange → Dark Orange |
| Accent | Orange | — |
| Sidebar | 250px fixed | Slide-in overlay |
