# Riders — Database Structure

## Paths Used
| Path | Access | Purpose |
|------|--------|---------|
| /riders/{uid} | Read/Write | Rider records |

## Data Shape
```json
{
  "riders": {
    "{uid}": {
      "name": "Rider Name",
      "email": "rider@email.com",
      "phone": "9876543210",
      "fatherName": "Father's Name",
      "age": 25,
      "aadharNo": "1234-5678-9012",
      "qualification": "12th Pass",
      "address": "Rider Address",
      "status": "active",
      "createdAt": 1717000000000
    }
  }
}
```

## Key Fields
- uid: From identitytoolkit API response (localId)
- status: "active" (set by default, no UI to change)
- createdAt: Set client-side at creation time

## No Additional Paths
- No rider assignments to orders
- No rider location data
- No rider earnings or trip history
- No rider document uploads (DL, RC, etc.)
