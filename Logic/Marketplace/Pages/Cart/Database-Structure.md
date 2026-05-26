# Cart Page — Database Structure

## Cart State (in memory via CartContext)
Items structure:
```ts
{
  id: string,         // deterministic buildCartItemId()
  menuItemId: string,
  outletId: string,
  name: string,
  image: string,
  basePrice: number,
  price: number,      // after customization
  quantity: number,
  customization: {
    size?: MenuItemSize,
    crust?: MenuItemCrust,
    addons: MenuItemAddon[],
    extraCheese: boolean,
    instructions: string
  }
}
```

## Persisted Cart (Firebase)
`customers/{userId}/cart`:
```ts
{
  items: CartItem[],
  outletId: string,
  appliedCoupon: Coupon | null,
  updatedAt: number
}
```

## Promotions
`system/promotions/coupons/{code}`:
```ts
{
  code: string,
  type: "percent" | "freeship",
  discount: number,
  minOrder: number,
  maxDiscount: number,
  description: string
}
```
