# Marketplace Config — vite.config.ts Overview

## File
`Marketplace/vite.config.ts`

## Config
```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@config': path.resolve(__dirname, '../config'),
    },
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    strictPort: false,
  },
  root: '.',
  build: {
    outDir: 'dist',
  },
});
```

## Key Config
| Setting | Value | Notes |
|---|---|---|
| Plugins | `@vitejs/plugin-react` + `@tailwindcss/vite` | React + Tailwind v4 |
| `resolve.alias` | `@/` → `./src/`, `@config/` → `../config/` | Shared config access |
| `server.port` | 3000 | Dev server port |
| `server.host` | `0.0.0.0` | Network accessible |
| `root` | `.` | Project root = Marketplace/ |

## Points
- TypeScript config via `vite.config.ts` (not .js)
- Path alias `@/` matches tsconfig `paths`
- Tailwind v4 via Vite plugin (no PostCSS config needed)
- No proxy config — client-side Firebase SDK makes direct API calls
