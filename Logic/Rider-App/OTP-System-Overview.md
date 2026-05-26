# Rider App — OTP System Overview

## Purpose
Verify delivery completion by requiring customer-provided 4-digit OTP. Ensures order reaches the correct person.

## OTP Generation
```javascript
// On order accept:
window.generateOTP():
  Math.floor(1000 + Math.random() * 9000);
  // Returns 4-digit number (1000-9999)

// Stored at:
businesses/{b}/outlets/{o}/orders/{id}/deliveryOTP

// Also accessible to admin dashboard for customer support
```

## OTP Verification Flow
```
1. Rider reaches customer location (Gate 4 passed)
2. #otpPanel opens with 4 individual digit inputs (auto-advance)
3. Customer provides 4-digit code
4. Rider enters digits
5. System validates:
   a. Read otpAttempts/{orderId} → check block + count
   b. If blocked → show "Try again in X seconds"
   c. If count >= 10 → block 60s → offer admin override
   d. Compare input with order.deliveryOTP
   e. Match → success path
   f. No match → failure path
```

## OTP Attempt Rate Limiting
```javascript
// Path: businesses/{b}/outlets/{o}/otpAttempts/{orderId}

attemptOTP(orderId, inputOtp, storedOtp):
  // 1. Read current attempt state
  const attempts = getOTPAttempts(orderId);
  
  // 2. Check block
  if (attempts.blockedUntil > Date.now()) {
    const remaining = Math.ceil((attempts.blockedUntil - Date.now()) / 1000);
    return { success: false, error: `Blocked. Try again in ${remaining}s` };
  }
  
  // 3. Check count limit
  if (attempts.count >= 10) {
    // Block for 60s
    setOTPAttempts(orderId, { blockedUntil: Date.now() + 60000 });
    return { success: false, error: "Too many attempts. Blocked for 60s." };
  }
  
  // 4. Verify
  if (inputOtp === storedOtp) {
    setOTPAttempts(orderId, { verified: true });
    return { success: true };
  }
  
  // 5. Failure
  incrementOTPAttempts(orderId);
  return { success: false, error: "Invalid OTP" };
```

## OTP Regeneration
```javascript
window.regenerateOTP(orderId):
  // Check 60s cooldown
  const lastRegen = attempts.regenerateRequestedAt;
  if (lastRegen && Date.now() - lastRegen < 60000) {
    const remaining = 60 - Math.floor((Date.now() - lastRegen) / 1000);
    return { success: false, error: `Wait ${remaining}s to regenerate` };
  }
  
  // Generate new OTP
  const newOtp = generateOTP();
  updateOrderDeliveryOTP(orderId, newOtp);
  updateOTPAttempts(orderId, { regenerateRequestedAt: Date.now() });
  return { success: true, otp: newOtp };
```

## Admin Override
```javascript
// When blocked, rider can request admin assistance
// Admin writes:
businesses/{b}/outlets/{o}/otpAttempts/{orderId}/adminOverride = true

// Rider's app detects admin override:
if (attempts.adminOverride) {
  // Allow bypassing OTP
  proceedWithoutOTP();
}
```

## UI States
| State | UI |
|---|---|
| Ready | 4 empty digit boxes, "Enter OTP" label |
| Typing | Auto-advance to next box, backspace to previous |
| Valid | Green border, "Verified!" message, auto-close |
| Invalid | Red border shake animation, "Invalid OTP" toast |
| Blocked | Countdown timer, "Admin Override" button |
| Regenerating | "New OTP sent" toast, boxes cleared |

## Security
| Concern | Mitigation |
|---|---|
| Brute force | 10 attempts then 60s block |
| OTP interception | Stored in Firebase (not shared via insecure channel) |
| Admin bypass abuse | Logged in audit trail |
| Stale OTP | Never expires (intentional for long deliveries) |
| Replay attack | OTP consumed on successful verify |
