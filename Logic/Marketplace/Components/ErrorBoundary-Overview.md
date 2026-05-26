# Marketplace — ErrorBoundary Overview

## File
`src/components/ErrorBoundary.tsx` (43 lines)

## Purpose
Class-based React error boundary that catches render-phase errors in the component tree below it.

## Implementation
```tsx
class ErrorBoundary extends Component<Props, State> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="...">
          <h1>Something went wrong</h1>
          <p>Please try refreshing the page.</p>
          <button onClick={() => window.location.reload()}>
            Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

## Props
| Prop | Type | Description |
|---|---|---|
| `children` | `ReactNode` | Child component tree |
| `fallback?` | `ReactNode` | Custom error UI (optional) |

## Placement in App.tsx
Wraps the entire provider tree — catches errors from any page/context/component.

## Points
- Default fallback shows "Refresh Page" button (full page reload)
- Custom `fallback` prop allows page-specific error UIs
- Logs error + component stack to console only (no remote logging)
- Does NOT catch async errors, event handler errors, or SSR errors
