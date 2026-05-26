# Search Page — Overview

## Decisions
| Decision | Rationale |
|---|---|
| **Client-side filtering** | All outlets/dishes already fetched on Home; avoids additional Firebase reads |
| **Debounced input** | Prevents UI jank during rapid typing |
| **URL-driven query** | Shareable search results via query param |
| **Tabbed results** | Separates outlet vs dish results for clarity |

## Points
- Only searches loaded data — outlets/dishes not yet fetched won't appear
- No server-side search (Firebase RTDB lacks full-text search)
- Tab switching does not re-fetch — instant since data is in memory
