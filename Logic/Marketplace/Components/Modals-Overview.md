# Modal Components — Overview

## ProductCustomizationModal
- Triggered by "Add" button on FoodCard
- Full-screen bottom sheet on mobile, centered dialog on desktop
- Sections:
  - Size selector (if multiple sizes available)
  - Addon checkboxes (with prices)
  - Crust selector (if pizza-type item)
  - Extra cheese toggle
  - Special instructions textarea
  - Quantity selector (+/- buttons, 1-50 range)
  - "Add to Cart" button with computed price
- Computes final price: basePrice + size diff + addons + crust + extraCheese
- Dispatches `ADD_ITEM` to CartContext on submit
- Handles outlet conflict via CartContext's `pendingItem` mechanism

## ReviewModal
- Triggered from Tracking page (after delivery) or Orders page
- Sections:
  - Rating stars (1-5) for food
  - Rating stars (1-5) for rider (if applicable)
  - Comment textarea
  - Submit button → calls `reviewService.submitReview()`
  - Calls `markOrderAsReviewed()` on success

## Points
- ProductCustomizationModal uses `buildCartItemId()` for deterministic cart IDs
- Addons displayed as checkboxes with individual prices
- Quantity clamped to 1-50 (matching WhatsApp engine behavior)
- ReviewModal handles both food and rider ratings
- No image upload in reviews (text + rating only)
