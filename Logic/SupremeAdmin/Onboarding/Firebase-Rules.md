# Onboarding — Firebase Rules

## Paths Accessed
| Path | Access | Purpose |
|------|--------|---------|
| /onboarding_requests | Read/Write | List requests, delete after approve/reject |
| /businesses/{bid} | Write | Create new business |
| /businesses/{bid}/outlets/{oid} | Write | Create new outlet |
| /system/admins/{adminId} | Write | Create admin mapping |

## Security Considerations
- Approval writes to /businesses, /businesses/{bid}/outlets, /system/admins
- These writes bypass whatever validation the marketplace would normally enforce
- No validation rules on the database side for business creation
- AdminEmail field is user-provided and not verified against Firebase Auth

## Suggested Rules Enhancement
```json
{
  "onboarding_requests": {
    ".read": "auth != null",
    ".write": "auth != null",
    "$id": {
      ".validate": "newData.hasChildren(['businessName', 'email'])"
    }
  }
}
```
