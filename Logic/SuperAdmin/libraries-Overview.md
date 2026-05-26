# SuperAdmin — Library Integration Patterns

## 1. Lucide Icons
**CDN**: `https://unpkg.com/lucide@latest`

### Usage
```html
<i data-lucide="shield-check" color="#6366F1" size="40"></i>
```
Icons rendered by calling `lucide.createIcons()` after every HTML injection. If not called, icons appear as blank `<i>` tags.

### Integration Pattern
```javascript
// After every innerHTML assignment:
container.innerHTML = templateString;
lucide.createIcons(); // Renders all <i data-lucide> elements
```

### Icons Used (~30+)
`shield-check`, `layout-dashboard`, `user-plus`, `banknote`, `building-2`, `store`, `bar-chart-3`, `bike`, `map`, `package`, `ticket`, `users`, `clock`, `star`, `bell-ring`, `terminal`, `cpu`, `plus`, `refresh-cw`, `arrow-right`, `check-circle`, `x`, `zap`, `trending-up`, `percent`, `activity`, `flame`, `database`, `list`, `search`, `download`, `pause-circle`, `save`, `trash-2`, `edit`, `loader-2`, `info`, `history`, `send`, `trophy`, `alert-triangle`, `shopping-cart`, `shield`

---

## 2. Firebase Compat SDK 9.6.1
**CDN** (load order matters):
```html
firebase-app-compat.js → firebase-database-compat.js → firebase-auth-compat.js → firebase-storage-compat.js
```

### Usage
Namespaced (not modular) API:
```javascript
firebase.initializeApp(config);
firebase.database().ref('path');
firebase.auth().signInWithEmailAndPassword(email, password);
firebase.storage().ref('path');
```

### Dual Instance Pattern
```javascript
// Primary
const app = firebase.initializeApp(firebaseConfig);

// Secondary (for account creation — prevents session disruption)
const secondaryApp = firebase.initializeApp(firebaseConfig, "SecondaryAuth");
const secondaryAuth = secondaryApp.auth();
```

### Key API Calls
| API Call | Purpose |
|---|---|
| `ref(path).on('value', cb)` | Real-time listener |
| `ref(path).once('value')` | One-time read |
| `ref(path).set(data)` | Write/replace |
| `ref(path).update(data)` | Multi-path update |
| `ref(path).push(data)` | Generate push ID |
| `ref(path).remove()` | Delete |
| `ref(path).transaction(cb)` | Atomic update |
| `auth.signInWithEmailAndPassword()` | Login |
| `auth.sendPasswordResetEmail()` | Password reset |
| `secondaryAuth.createUserWithEmailAndPassword()` | Account creation |
| `storage.ref(path).put(file)` | File upload |

---

## 3. OTPAuth 9.2.2
**CDN**: `https://cdn.jsdelivr.net/npm/otpauth@9.2.2/dist/otpauth.umd.min.js`

### Usage
```javascript
// Generate secret
const secret = new OTPAuth.Secret({ size: 20 });

// Create TOTP
const totp = new OTPAuth.TOTP({
  issuer: "Foodhubbie Pro",
  label: adminEmail,
  secret: secret,
  algorithm: "SHA1",
  digits: 6,
  period: 30
});

// Generate otpauth URL (for QR code)
const url = totp.toString();

// Validate code
const delta = totp.validate({ token: code, window: 1 });
// delta !== null → valid (±1 window = 30s tolerance)
// delta === null → invalid
```

### Key Parameters
| Parameter | Value |
|---|---|
| Algorithm | SHA1 |
| Digits | 6 |
| Period | 30 seconds |
| Window | 1 (±30s clock drift) |

---

## 4. QRCode.js 1.0.0
**CDN**: `https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js`

### Usage
```javascript
// Clear previous QR
document.getElementById('tfaQRCode').innerHTML = '';

// Create new QR
new QRCode(document.getElementById('tfaQRCode'), {
  text: otpauthUrl,
  width: 200,
  height: 200,
  colorDark: '#1E293B',
  colorLight: '#FFFFFF',
  correctLevel: QRCode.CorrectLevel.H
});
```

### Pattern
1. Clear container `innerHTML` before creating new QR
2. Pass the `otpauth://` URL from OTPAuth
3. QR renders as `<canvas>` or `<img>` depending on browser support
4. Manual secret text shown as fallback below QR

---

## 5. Chart.js
**CDN**: `https://cdn.jsdelivr.net/npm/chart.js`

### Usage
```javascript
// Destroy previous instance to prevent canvas memory leak
if (revenueChartInstance) {
  revenueChartInstance.destroy();
}

// Create new chart
const ctx = document.getElementById('revenueChart').getContext('2d');
revenueChartInstance = new Chart(ctx, {
  type: 'line',
  data: {
    labels: dates,      // Last 14 days
    datasets: [{
      label: 'Revenue (₹)',
      data: revenues,   // Daily revenue values
      borderColor: '#10B981',
      backgroundColor: 'rgba(16,185,129,0.1)',
      fill: true,
      tension: 0.4
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true }
    }
  }
});
```

### Key Patterns
- Store instance in global variable for cleanup
- `destroy()` before re-creating to prevent canvas memory leaks
- Canvas element defined in HTML (`<canvas id="revenueChart">`)
- Chart re-created on every data refresh

---

## 6. SweetAlert2 11
**CDN**: `https://cdn.jsdelivr.net/npm/sweetalert2@11`

### Usage Patterns

**Confirm dialog**:
```javascript
Swal.fire({
  title: 'Confirm Settlement?',
  text: `Net Payout: ₹${amount}`,
  icon: 'question',
  showCancelButton: true,
  confirmButtonText: 'Confirm',
  cancelButtonText: 'Cancel'
}).then((result) => {
  if (result.isConfirmed) {
    // Proceed with action
  }
});
```

**Delete confirmation**:
```javascript
Swal.fire({
  title: 'Remove Rider?',
  text: `Delete ${name} permanently?`,
  icon: 'warning',
  showCancelButton: true,
  confirmButtonColor: '#EF4444',
  confirmButtonText: 'Delete'
}).then(...)
```

### Used In
| Action | SweetAlert2 Role |
|---|---|
| Approve partner | Confirmation + details |
| Reject partner | Confirmation |
| Settle transaction | Confirmation + payout display |
| Delete rider | Warning confirmation |
| Delete coupon | Confirmation |
| Disable 2FA | Confirmation |
| Wallet credit | Confirmation (manual) |
| Password reset | Confirmation |

---

## 7. html2pdf.js (on-demand)
**CDN**: `https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js`
Loaded only in Reports tab export function (not in `<head>`).

### Usage
```javascript
function exportReportPDF() {
  const element = document.getElementById('reportContent');
  html2pdf()
    .from(element)
    .set({
      margin: [10, 10],
      filename: `report_${date}.pdf`,
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    })
    .save();
}
```
