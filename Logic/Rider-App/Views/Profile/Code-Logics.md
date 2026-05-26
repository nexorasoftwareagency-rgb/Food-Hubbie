# Profile View — Code Logics

## Purpose
Rider profile management — view and edit personal details, upload photo, aadhar image.

## Key Functions (app.js)
| Function | Trigger | Action |
|---|---|---|
| `window.showProfile()` | View init | Load and display rider profile |
| `window.editProfileField(field)` | Tap edit | Inline editing of field |
| `window.saveProfile()` | Save button | Write updated profile to Firebase |
| `window.uploadPhoto(file)` | Photo input | Upload to Firebase Storage |
| `window.uploadAadhar(file)` | Aadhar input | Upload aadhar image |
| `window.toggleAvailability()` | Toggle | Switch online/offline status |

## Profile Fields
| Field | Type | Editable | Validation |
|---|---|---|---|
| `name` | text | Yes | Non-empty |
| `phone` | text | No | Display only |
| `email` | text | No | Display only |
| `photoURL` | image | Yes | File upload |
| `address` | textarea | Yes | Max 200 chars |
| `vehicle` | select | Yes | Bike/Car/Walk |
| `aadhar` | text | No | Display only (masked) |
| `aadharImage` | image | Yes | File upload |
| `fatherName` | text | Yes | Non-empty |
| `age` | number | Yes | 18-65 |
| `qualification` | text | Yes | Optional |
| `accountNumber` | text | Yes | Bank account |
| `ifsc` | text | Yes | IFSC code |
| `status` | toggle | Yes | Online/Offline |

## Photo Upload
```
uploadPhoto(file):
  1. Validate: max 5MB, JPEG/PNG
  2. Create storage ref: riders/{uid}/profile.jpg
  3. uploadBytesResumable(ref, file)
  4. On complete: getDownloadURL(ref)
  5. Update riders/{uid}/photoURL = downloadURL
  6. Update img element src
```

## Edge Cases
- **No photo uploaded** → Initials fallback (first letter of name)
- **Upload failure** → Error toast, revert to previous photo
- **Large file** → Reject with "Max 5MB" warning
- **Offline** → Show "Can't edit while offline" banner, disable save
- **Suspended account** → Show "Account suspended" message, hide toggle
