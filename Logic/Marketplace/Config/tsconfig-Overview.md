# Marketplace Config — tsconfig.json Overview

## File
`Marketplace/tsconfig.json`

## Compiler Options
| Option | Value | Notes |
|---|---|---|
| `target` | `ES2020` | Modern JS output |
| `module` | `ESNext` | ESM module syntax |
| `moduleResolution` | `bundler` | Vite-style resolution |
| `jsx` | `react-jsx` | Automatic JSX runtime |
| `strict` | `true` | Full strict mode |
| `noEmit` | `true` | Vite handles bundling |
| `esModuleInterop` | `true` | CJS/ESM interop |
| `skipLibCheck` | `true` | Faster compilation |
| `resolveJsonModule` | `true` | JSON imports |
| `allowImportingTsExtensions` | `true` | `.ts` imports in ESM |
| `allowJs` | `true` | Mixed JS/TS allowed |

## Path Aliases
| Alias | Resolution |
|---|---|
| `@/*` | `./src/*` |
| `@config/*` | `../config/*` |

## Included/Excluded
- Include: `src/**/*`
- Exclude: `node_modules`, `build`, `dist`, `**/*.test.ts`

## Types
- `node` — Node.js types
- `vite/client` — Vite env types (`import.meta.env`)
