# Login Page — Database Structure

## User Profile (created on first login)
`users/{userId}`:
```ts
{
  id: string,           // Firebase Auth UID
  name: string,         // From Google profile
  email: string,        // From Google profile
  avatar: string,       // From Google profile photo
  phone: string,        // Empty initially, user fills later
  wallet: { balance: 0, history: {} },
  loyaltyPoints: 0,
  savedAddresses: [],
  createdAt: string     // ISO timestamp
}
```
