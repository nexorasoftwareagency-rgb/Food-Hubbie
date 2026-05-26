# SuperAdmin — Toast Notification System

## Overview
Simple DOM-based toast notification system for success, error, and info messages.

## Implementation
```javascript
function showToast(message, type = 'success') {
  // 1. Create toast element with class 'pro-toast'
  // 2. Add type class: 'toast-success', 'toast-error', 'toast-info'
  // 3. Set icon + message
  // 4. Append to body
  // 5. Trigger slide-up animation
  // 6. Auto-remove after 3 seconds
  // 7. On click → remove immediately
}
```

## Types
| Type | Icon | Background | Use Case |
|---|---|---|---|
| `success` | ✓ | Green | Operations completed |
| `error` | ✗ | Red | Failures |
| `info` | ℹ | Blue | Information |

## CSS
```css
.pro-toast {
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 10000;
  animation: slideUp 0.3s ease;
  /* ... glassmorphism styling */
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
```

## Usage (in main.js)
```javascript
showToast('Partner approved', 'success');
showToast('Failed to save', 'error');
showToast('Loading data...', 'info');
```

## Edge Cases
- **Multiple toasts** → Stacked with increasing top-offset
- **Rapid toasts** → Each appears independently
- **Toast overflow** → Max 5 visible, oldest removed first
