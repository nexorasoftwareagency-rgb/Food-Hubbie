# Marketplace — use-toast Hook Overview

## File
`src/hooks/use-toast.ts` (191 lines)

## Purpose
shadcn/ui-generated toast notification system. Provides both a React hook (`useToast`) and a module-level function (`toast`).

## Architecture
- Uses a module-level `reducer` + `listeners` pattern (not React Context)
- `memoryState` holds current toasts outside React
- `dispatch()` updates memory + notifies all subscribed listeners
- `TOAST_LIMIT = 1` — only 1 toast visible at a time
- `TOAST_REMOVE_DELAY = 1000000` — very long delay before removal (handled by sonner separately)

## API

### `useToast()` hook
Returns `{ toasts, toast, dismiss }`:
- `toasts` — current visible toasts array
- `toast(props)` — add a toast, returns `{ id, dismiss(), update() }`
- `dismiss(toastId?)` — dismiss specific or all toasts

### `toast(props)` standalone
Module-level function callable from anywhere:
```ts
toast({ title: "Order placed!", description: "Your order is confirmed." })
```

## Toast Object
```ts
{
  id: string,          // auto-generated
  title?: ReactNode,
  description?: ReactNode,
  action?: ToastActionElement,
  open: boolean,
  onOpenChange: (open) => void
}
```

## Points
- Side-effect queue (`addToRemoveQueue`) handles delayed removal after dismiss animation
- `genId()` uses an incrementing counter (resets at MAX_SAFE_INTEGER)
- Both shadcn Toaster and sonner toast are used in the app (dual toast systems)
- The `listeners` array is never cleaned up on unmount (but useToast's useEffect returns cleanup)
