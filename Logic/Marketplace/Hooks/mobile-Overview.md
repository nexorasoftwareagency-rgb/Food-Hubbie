# Marketplace — use-mobile Hook Overview

## File
`src/hooks/use-mobile.tsx` (19 lines)

## Purpose
Detects mobile viewport width for responsive rendering decisions.

## Logic
- Breakpoint: `768px` (standard tablet/mobile boundary)
- Uses `window.matchMedia()` for efficient CSS-media-query-style detection
- Returns `boolean` — `true` if viewport width < 768px

## Implementation
```ts
const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return !!isMobile;
}
```

## Points
- `undefined` initial state avoids SSR mismatch (returns `false` via `!!undefined`)
- Listener cleanup on unmount prevents memory leaks
- NOT used by BottomNav visibility (that uses route-based `isCheckoutOrTracking`)
- Could be used for conditional rendering of mobile-specific layouts
