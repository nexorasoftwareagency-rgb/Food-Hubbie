# Marketplace — utils (cn) Overview

## File
`src/lib/utils.ts` (6 lines)

## Purpose
Standard shadcn/ui `cn()` utility for merging Tailwind CSS class names.

## Implementation
```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

## How It Works
1. `clsx(...inputs)` — concatenates class strings, objects, arrays, and filters falsy values
2. `twMerge(...)` — resolves Tailwind class conflicts (e.g., `"px-4 px-6"` → `"px-6"`)

## Usage
Used in every shadcn/ui component and most custom components for className generation:
```tsx
<button className={cn("px-4 py-2", variant === "primary" && "bg-primary", className)} />
```

## Points
- Imported via `@/lib/utils` alias
- Standard shadcn/ui pattern — identical to generated boilerplate
- No custom additions beyond the standard `cn()` function
