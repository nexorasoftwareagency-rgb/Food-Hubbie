# Profile View — Firebase Rules

## Paths Accessed
| Path | Access |
|---|---|
| `riders/{uid}` | Read/Write (rider's own profile) |
| `riders/{uid}/status` | Write (online/offline toggle) |
| `riders/{uid}/photoURL` | Write (photo upload URL) |
| `riders/{uid}/aadharImage` | Write (aadhar upload URL) |

## Firebase Storage Rules
```javascript
// Storage: riders/{uid}/profile.jpg
// Storage: riders/{uid}/aadhar.jpg
match /riders/{uid}/{fileName} {
  allow read: if request.auth != null;
  allow write: if request.auth.uid == uid
              && request.resource.size < 5 * 1024 * 1024
              && request.resource.contentType.matches('image/.*');
}
```

## Rules
```json
{
  "rules": {
    "riders": {
      "$uid": {
        ".read": "auth.uid === $uid",
        ".write": "auth.uid === $uid"
      }
    }
  }
}
```

## Security Notes
- Full read/write on own profile
- Storage upload gated by UID match, file size (5MB), and MIME type
- Status updates also gated by auth.uid
