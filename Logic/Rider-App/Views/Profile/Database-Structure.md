# Profile View — Database Structure

## Rider Profile
`riders/{uid}`
| Field | Type | Display | Editable |
|---|---|---|---|
| `name` | string | Full name | Yes |
| `phone` | string | 10-digit | No |
| `email` | string | Auth email | No |
| `role` | string | "rider" | No |
| `status` | string | "online"/"offline" | Yes |
| `isActive` | boolean | Suspension flag | No (admin) |
| `lastSeen` | number | Timestamp | No |
| `photoURL` | string | Image URL | Yes |
| `address` | string | Home address | Yes |
| `vehicle` | string | Bike/Car/Walk | Yes |
| `aadhar` | string | Aadhar number | No |
| `aadharImage` | string | Aadhar image URL | Yes |
| `fatherName` | string | Father's name | Yes |
| `age` | number | Rider age | Yes |
| `qualification` | string | Education | Yes |
| `accountNumber` | string | Bank account | Yes |
| `ifsc` | string | Bank IFSC | Yes |

## Storage
- `riders/{uid}/profile.jpg` — Profile photo
- `riders/{uid}/aadhar.jpg` — Aadhar image
