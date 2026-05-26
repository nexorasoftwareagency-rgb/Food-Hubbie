# Profile Page — Database Structure

## User Profile
`users/{userId}`:
```ts
{
  id: string,
  name: string,
  phone: string,
  email?: string,
  avatar?: string,
  loyaltyPoints: number,
  wallet: {
    balance: number,
    history: {
      [txnId]: {
        amount: number,
        type: "credit" | "debit",
        description: string,
        orderId?: string,
        createdAt: string
      }
    }
  },
  savedAddresses: UserAddress[],
  fcmToken?: string,
  createdAt: string
}
```
