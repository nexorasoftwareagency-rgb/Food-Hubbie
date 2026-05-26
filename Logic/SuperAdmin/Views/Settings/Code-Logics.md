# Settings Tab — Code Logics

## Purpose
Infrastructure settings — 2FA management, system telemetry display, and data retention policies.

## Key Functions (main.js)
| Function | Trigger | Action |
|---|---|---|
| `loadInfrastructure()` | Tab load | Show system telemetry |
| `loadTFAStatus()` | Tab load | Read current 2FA status |
| `showTFASetup()` | Enable 2FA | Generate TOTP secret + QR code |
| `verifyTFASetup()` | Verify button | Validate TOTP code and enable 2FA |
| `disableTFA()` | Disable 2FA | Remove TFA data from DB |
| `applyDataRetention(type)` | Apply Policy | Archive/purge old data |
| `processRetentionOrders()` | Internal | Archive/purge old orders |
| `processRetentionAudit()` | Internal | Archive/purge audit logs |
| `processRetentionSettlements()` | Internal | Archive/purge settlements |

## Data Sources
| Path | Operation | Purpose |
|---|---|---|
| `system/admins/{uid}/tfa` | Read, Write, Remove | 2FA configuration |
| `businesses/{bid}/outlets/{oid}/orders` | Read, Write | Order retention |
| `system/auditLogs` | Read, Write | Audit retention |
| `logs/marketplaceAudit` | Read, Write | Marketplace audit retention |
| `logs/botAudit` | Read, Write | Bot audit retention |
| `businesses/{bid}/outlets/{oid}/settlements` | Read, Write | Settlement retention |
| `archives/*` | Write | Archival storage |
| `system/settlements` | Read | Settlements data retention |

## 2FA Sections
```
loadTFAStatus():
  ├─ Read system/admins/{uid}/tfa
  ├─ If tfa.enabled → show Disable button, hide Enable button
  └─ If !tfa.enabled → show Enable button, hide Disable button

showTFASetup():
  ├─ Generate OTPAuth secret (SHA1, 6-digit, 30s)
  ├─ Create QR code via QRCode.js
  ├─ Display QR in #tfaQRCode
  ├─ Display manual secret in #tfaSecretDisplay
  └─ Show verify input

verifyTFASetup():
  ├─ Read 6-digit code from input
  ├─ Validate using OTPAuth
  ├─ If valid → save { enabled: true, secret } to DB
  └─ Show success toast
```

## Data Retention Policies (3)
| Policy | Config Fields | Action |
|---|---|---|
| Orders | `#retentionOrders` (30-365 days), `#retentionOrdersAction` (archive/purge) | Per-outlet order archival |
| Audit Logs | `#retentionAudit` (30-180 days), `#retentionAuditAction` | 3-source audit archival |
| Settlements | `#retentionSettlements` (60-365 days), `#retentionSettlementsAction` | Settlement archival |

## System Telemetry
```
loadInfrastructure():
  ├─ Display static system info:
  │   ├─ System Kernel Version: 2.1.0-FOODHUBBIE-PRO
  │   ├─ Network: MULTI-TENANT ISOLATED
  │   ├─ Sync: ACTIVE
  │   ├─ Endpoint: Firebase RTDB URL
  │   ├─ Auth: ROOT_ADMIN
  │   └─ Encryption: TLS 1.3
  └─ Pulsing "Waiting for next telemetry packet" indicator
```

## Edge Cases
- **2FA already enabled** → showTFASetup() should not be callable (button hidden)
- **Invalid TOTP code** → verifyTFASetup() shows error toast
- **QR code generation fails** → QRCode.js CDN may not load; manual secret fallback shown
- **Data retention with no old data** → Toast "No data to retain"
- **Archive path collision** → Overwrites existing archive (acceptable for retention)
