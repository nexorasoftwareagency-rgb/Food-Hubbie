# Businesses Tab — Complete Flow

## Page Load Sequence
```
1. Admin navigates to "Managed Entities" tab
2. loadBusinessesTab() called:
   ├─ Show loading state
   ├─ Parallel reads:
   │   ├─ db.ref('businesses').once('value')
   │   └─ db.ref('system/admins').once('value')
   ├─ Match admins to businesses
   ├─ Build enriched list
   ├─ PAGINATION.businesses.total = list.length
   ├─ renderBusinessesAlt(page 1) → render first 10
   └─ lucide.createIcons()
```

## Pagination Flow
```
1. Admin clicks page 3
2. goToBusinessesPage(3) → PAGINATION.businesses.page = 3
3. Slice list: items[20..29]
4. Re-render #businessListAlt
5. Update pagination controls
```
