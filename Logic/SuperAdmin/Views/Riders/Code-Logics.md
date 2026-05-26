# Riders Tab — Code Logics

## Purpose
Logistics partner fleet management — rider CRUD, KYC document upload, account lifecycle.

## Key Functions (main.js)
| Function | Trigger | Action |
|---|---|---|
| `loadRiders()` | Tab load | Real-time listener on `riders` |
| `renderRidersList(list)` | Data ready | Paginated rider table |
| `showRiderModal()` | Add Partner | Open empty rider creation form |
| `editRider(id)` | Edit button | Pre-fill rider data in form |
| `saveRider()` | Save button | Create/update rider with KYC upload |
| `deleteRider(id)` | Delete button | Atomic rider removal |
| `compressImage(file)` | Upload helper | Canvas-based image compression to ~200KB |
| `uploadRiderFile(uid, file, type)` | Upload helper | Compress + upload to Firebase Storage |

## Data Sources
| Path | Type | Purpose |
|---|---|---|
| `riders` | `on('value')` | Real-time rider list |
| `riders/{uid}` | Write | Create/update rider |
| `riders/{uid}/photoURL` | Write | Profile photo |
| `riders/{uid}/aadharImage` | Write | KYC image |

## Rider Table Columns
| Column | Source |
|---|---|
| Partner Identity | `rider.name`, `rider.phone` |
| Performance Metrics | `rider.status`, `rider.wallet.totalEarned` |
| Verification Status | `rider.photoURL` + `rider.aadharImage` presence |
| System Controls | Edit/Delete buttons |

## Rider Modal Fields
| Field | ID | Type |
|---|---|---|
| Name | `#riderName` | text |
| Phone | `#riderPhone` | tel |
| Email | `#riderEmail` | email |
| Password | `#riderPassword` | password |
| Vehicle | `#riderVehicle` | select (Bike/Car/Walk) |
| Address | `#riderAddress` | text |
| Photo | `#riderPhotoFile` | file |
| Aadhar Image | `#riderAadharFile` | file |

## Image Compression
```javascript
compressImage(file):
  1. Create canvas (max 1200px width)
  2. Draw image scaled proportionally
  3. canvas.toBlob(blob, 'image/jpeg', 0.7) → ~200KB
  4. Return compressed blob
```

## Atomic Delete
```
deleteRider(id):
  1. SweetAlert2 confirm
  2. Multi-path remove:
     ├─ riders/{uid}
     └─ system/auditLogs/{logId}
  3. Toast "Rider removed"
```

## Edge Cases
- **No riders** → "No riders registered" empty state
- **Photo upload fails** → Error toast, rider still saved without photo
- **Large image file** → compressImage() reduces to ~200KB before upload
- **Rider email already used by auth** → secondaryAuth.createUser() fails, show error
