# Complete Flow: Page Guide Module

## 1. User clicks help icon
1. ❓ icon in header clicked
2. `openPageGuide(currentPageId)` called
3. Looks up `GUIDES[currentPageId]`

## 2. Modal opens
1. Guide modal element found by ID
2. `classList.add('show')` + `aria-hidden='false'`
3. Lucide icons re-rendered inside modal
4. Steps displayed as vertical list

## 3. User reads steps
1. Each step has icon + title + body
2. Steps are numbered sequentially
3. User scrolls through guide

## 4. User closes modal
1. Click × button or press Escape
2. `classList.remove('show')` + `aria-hidden='true'`
3. Focus returns to main content

## 5. Cross-page flows
- **Every page** — guide content specific to current page
- **Dashboard** — includes promo kill-switch guidance
- **Orders** — includes status tabs, order drawer, rider assignment
- **Discounts** — includes CRUD, reports, POS integration
- **Promotions** — includes composer, recipients, campaign lifecycle
