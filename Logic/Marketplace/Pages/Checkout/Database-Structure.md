# Checkout Page — Database Structure

## Order Input (PlaceOrderInput)
```ts
{
  items: OrderItem[],
  outletId: string,
  businessId: string,
  deliveryAddress: DeliveryAddress,
  paymentMethod: PaymentMethod,
  fulfillmentMethod: FulfillmentMethod,
  subtotal: number,
  deliveryFee: number,
  taxes: number,
  total: number,
  platformFee: number,
  couponCode?: string,
  couponDiscount?: number,
  globalDiscount?: number,
  surgeMultiplier?: number
}
```

## Order Output (written to Firebase)
`businesses/{bizId}/outlets/{outletId}/orders/{orderId}`:
Full order schema documented in root `04-Database-Structure.md#Orders`

## Promotions Config
`system/promotions/surge`:
```ts
{ isActive: boolean, multiplier: number, label: string }
```
`system/promotions/globalDiscount`:
```ts
{ isActive: boolean, type: "percent" | "flat", value: number }
```
