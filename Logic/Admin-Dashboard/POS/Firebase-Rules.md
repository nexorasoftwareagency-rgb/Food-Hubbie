# POS — Firebase Security Rules

## `businesses/{b}/outlets/{o}/dishes/{dishId}`
- `.read`: admin with matching `businessId` / `outletId`
- `.write`: same admin

## `businesses/{b}/outlets/{o}/categories/{catId}`
- `.read`: same admin rule
- `.write`: same admin rule

## `businesses/{b}/outlets/{o}/orders/{orderId}`
- `.write`: same admin rule (POS creates orders under this path)

## `businesses/{b}/outlets/{o}/metadata/orderSequence`
- `.write`: same admin rule (incremented on each POS sale)

## No Server-Side Validation
- No rule preventing stock from going below 0
- No rule enforcing order status transitions
- No rule validating order data structure or required fields
- All validation is client-side only
