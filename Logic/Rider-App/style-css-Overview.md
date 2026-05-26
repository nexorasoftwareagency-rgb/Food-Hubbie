# Rider App — Style CSS Overview

## File
- **style.css** — 3,979 lines, 84KB
- Single CSS file for entire SPA (no CSS modules, no preprocessor)
- Loaded via `<link rel="stylesheet" href="style.css?v=4.7.1">`

## Design Tokens (`:root`)
| Variable | Value | Usage |
|---|---|---|
| `--primary` | `#FF5200` | Brand orange |
| `--primary-glow` | `rgba(255, 82, 0, 0.15)` | Glow effects |
| `--primary-dark` | `#E64A00` | Hover states |
| `--primary-light` | `#FFF5F1` | Light backgrounds |
| `--bg-app` | `#F4F6F8` | Page background |
| `--bg-surface` | `#FFFFFF` | Card backgrounds |
| `--bg-glass` | `rgba(255, 255, 255, 0.9)` | Glassmorphism |
| `--text-main` | `#1E293B` | Body text |
| `--text-muted` | `#64748B` | Secondary text |
| `--success` | `#10B981` | Success green |
| `--info` | `#3B82F6` | Info blue |
| `--warning` | `#F59E0B` | Warning yellow |
| `--danger` | `#EF4444` | Danger red |
| `--shadow-pro` | `0 10px 30px rgba(0,0,0,0.05)` | Card shadows |
| `--glass-blur` | `blur(12px)` | Glassmorphism blur |
| `--radius-premium` | `24px` | Large border radius |
| `--transition` | `all 0.2s cubic-bezier(0.4, 0, 0.2, 1)` | Default transition |

## Section Catalog (~48 sections)

### 1. Seamless Loader & Skeletons
- Full-screen orange loader with ripple animation
- `skeleton-mode` class: switches to white bg with skeleton placeholders
- Keyframes: `ripple` (2s infinite scaling circle)
- Skeleton shapes: shimmer lines, circle placeholders, card outlines
- `fade-out` class: opacity 0 → visibility hidden transition

### 2. Global Utilities
- `.hidden` — `display: none !important`
- `.flex-center`, `.flex-between` — Flexbox helpers
- `.text-muted`, `.text-danger` — Typography colors
- `.animate-spin` — Spin keyframe
- `.mt-10`, `.mt-20`, `.mb-10`, `.p-10`, `.full-width` — Spacing helpers

### 3. Top Header (Fixed)
- Fixed `#topHeader` with `z-index: 900`
- Glassmorphism bg with `backdrop-filter: var(--glass-blur)`
- Status pill (online/offline dot)
- Lucide icons for menu, notification bell
- Hamburger button with CSS transform animation on open

### 4. Sticky Bottom Navigation
- 5-tab bottom nav: Home, Pickup, History, Earnings, Profile
- Active tab: primary orange with icon fill
- Badge count for notifications
- `box-shadow` top border separator
- Safe area padding for notched phones (`padding-bottom: env(safe-area-inset-bottom)`)

### 5. Premium Cards & Grids
- `.card-premium` — White bg, `--radius-premium`, `--shadow-pro`
- `.card-glass` — Glassmorphism with `--bg-glass` + `backdrop-filter`
- `.grid-2`, `.grid-3` — Responsive grid layouts
- `.stat-card` — Dashboard stat tiles with icon + value + label
- Hover: subtle `translateY(-2px)` + shadow increase

### 6. Active Delivery Card
- Prominent card with status badge, progress indicator, address
- Pulse animation for "Live" status indicator
- Tap-to-expand with smooth height transition

### 7. Buttons & Inputs
- `.btn-primary` — Orange filled, `--radius-premium`, bold text
- `.btn-outline` — Border only variant
- `.btn-danger`, `.btn-success` — Semantic colors
- `.btn-icon` — Circular icon button
- `.btn-loading` — Spinner state with disabled
- `.input-field` — Rounded borders, focus ring with primary glow

### 8. Modals & Overlays
- `.modal-overlay` — Fixed fullscreen, dark semi-transparent (rgba 0.4)
- `.modal-content` — Centered card with max-width, scrollable
- `.modal-slide-up` — Bottom sheet style with `translateY` animation
- Backdrop click to dismiss (CSS `pointer-events`)
- Keyframes: `slideUp`, `fadeIn`

### 9. New Order Ping Modal
- Full-screen overlay with 30s countdown ring (SVG circle animation)
- Pulse animation on "NEW ORDER" header
- Customer info card, items list, delivery fee
- Accept/Skip buttons with prominent styling
- Countdown number animates on change
- Audio alert indicator icon

### 10. Sidebar (Hamburger)
- Fixed left panel, `width: 280px`, `z-index: 1000`
- Slide in/out with `translateX` transition
- Profile section at top with photo + name
- Menu items with Lucide icons
- Logout button at bottom with danger styling
- Overlay backdrop when open

### 11. Profile View
- Large centered photo with camera icon overlay
- Inline editable fields with input/textarea
- Toggle switch for online/offline (custom CSS, no library)
- Aadhar image upload with preview
- Logout button with confirmation styling

### 12. Order Cards (List View)
- Card with order ID, customer name, items summary
- Status badge (color-coded)
- Earnings badge (green ₹ amount)
- Tap ripple effect
- Empty state with illustration

### 13. Notification Sheet
- Slide-up bottom sheet
- Notification list with icon, title, body, timestamp
- Read/unread dot indicator
- Mark all read button
- Empty state: "No notifications"

### 14. Step Progress Bar
- Horizontal 4-step bar: REACH OUTLET → PICK UP → REACH DROP → COMPLETE
- Step circles with numbers, connected by lines
- Active: orange fill, Completed: green checkmark, Pending: gray outline
- Step labels below circles
- Animated line fill between steps

### 15. Slide-to-Action (Zomato-style)
- Swipeable action bar with drag handle
- Background gradient "Pull to..." text
- Thumb follows `touchmove` with `transform: translateX()`
- Snap threshold: >50% width triggers action
- CSS: `user-select: none`, `touch-action: none`, smooth spring-back
- Success: green flash, haptic feedback indicator

### 16. OTP Input
- 4 individual digit boxes side by side
- Auto-advance cursor on input
- Backspace to previous box
- Filled: orange border + filled bg
- Verified: green glow + checkmark
- Error: red shake animation (`@keyframes shake`)
- Blocked state: countdown timer display

### 17. Payment Panel
- Bottom sheet with order total
- Cash / UPI selection cards
- Amount input for cash collected
- Confirm button with processing state

### 18. Earnings & Ledger
- Hero section: large ₹ amount with soft bg
- Weekly bar chart: 7 bars with `height` set by JS, animated grow
- Shop breakdown: list with shop name, count, earnings
- Wallet balance card
- Transaction list with type icons (green/blue/yellow)

### 19. Auth Page (standalone login.html)
- Gradient orange background (`linear-gradient(135deg, #FF5200, #FF2E00)`)
- White card with `border-radius: 32px`, `box-shadow: orange glow`
- Logo box with zap icon
- Bold centered title "ROSHANI RIDER"
- Input groups with icon-left, focus ring

### 20. Pull-to-Refresh
- Pull indicator: arrow icon + "Pull to refresh" text
- `@keyframes pullPulse` for visual feedback
- `overflow-y: auto` on content area
- Distance threshold visual cue

### 21. Success Overlay / Confetti
- Full-screen overlay with success checkmark
- Confetti particles: 10+ colored squares with `@keyframes confettiFall`
- CSS-only particle animation using `animation-delay` + random positions
- Auto-fade after 4s

### 22. Settlement History Modal
- Premium modal with table layout
- Status badges: pending (yellow), approved (green), rejected (red)
- Request settlement button

### 23. Sync Status Indicator
- Small bar at top showing sync state
- Spinning sync icon during upload
- Green check when synced
- Red warning when offline with queue count

## Key Animations
| Name | Type | Duration | Purpose |
|---|---|---|---|
| `ripple` | Scale + opacity | 2s | Loader pulse |
| `spin` | Rotate | 1s | Loading spinner |
| `shimmer` | Background slide | 1.5s | Skeleton loading |
| `slideUp` | Translate Y | 0.3s | Modal entrance |
| `fadeIn` | Opacity | 0.2s | Overlay appear |
| `shake` | Translate X | 0.4s | OTP error |
| `confettiFall` | Translate + rotate | 3s | Success confetti |
| `pulse` | Scale | 2s | Live indicator |
| `pullPulse` | Opacity | 1s | Pull-to-refresh |

## Responsive Breakpoints
| Breakpoint | Media Query | Adjustments |
|---|---|---|
| Mobile (default) | — | Single column, full width |
| Tablet | `min-width: 768px` | Wider cards, 2-column grids |
| Desktop | `min-width: 1024px` | Max-width containers, centered layout |
| Notch phones | `env(safe-area-inset-*)` | Padding for header/bottom nav |

## Glassmorphism Pattern
```css
.element {
    background: var(--bg-glass);
    backdrop-filter: var(--glass-blur);
    -webkit-backdrop-filter: var(--glass-blur);
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: var(--shadow-pro);
}
```
Used on: top header, modals, sidebar, notification sheet.

## Edge Cases
| Scenario | CSS Handling |
|---|---|
| Very long text | `text-overflow: ellipsis`, `white-space: nowrap` |
| Notched phones | `env(safe-area-inset-top/bottom)` |
| Small screens (320px) | Min-width auto, reduced padding |
| Landscape orientation | `@media (orientation: landscape)` max-height adjustments |
| Reduced motion | `@media (prefers-reduced-motion)` disables animations |
| High contrast | `@media (prefers-contrast: high)` border additions |
