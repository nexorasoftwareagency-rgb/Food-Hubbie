# Riders — Firebase Rules

## Paths Accessed
| Path | Access | Purpose |
|------|--------|---------|
| /riders | Read (listener) | Rider data |
| /riders/{uid} | Write | Create/update/delete riders |

## Security Considerations
- /riders contains PII (name, phone, aadhar, fatherName, age, address, qualification)
- Any authenticated admin can read all rider PII
- No encrypted storage for sensitive fields (Aadhar number)
- Rider delete removes RTDB data but not Auth account
- API key for identitytoolkit is exposed in index.html source

## Suggested Rules
```json
{
  "riders": {
    ".read": "auth != null",
    ".write": "auth != null",
    "$uid": {
      ".validate": "newData.hasChildren(['name', 'email', 'phone'])"
    }
  }
}
```

## PII Fields (Sensitive)
- aadharNo: India's national ID number
- fatherName: Family information
- age: Personal information
- address: Physical location
- qualification: Educational background
