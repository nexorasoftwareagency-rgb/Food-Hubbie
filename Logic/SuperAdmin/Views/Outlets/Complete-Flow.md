# Outlets Tab — Complete Flow

## Page Load Sequence
```
1. Admin navigates to "Outlet Profiles" tab
2. loadOutletsTab() called:
   ├─ db.ref('businesses').once('value')
   ├─ db.ref('system/admins').once('value')
   ├─ Build outlet list: for each business → outlets
   ├─ Enrich with admin email from system/admins
   ├─ Update #outletCount badge
   ├─ renderOutletList(page 1)
   └─ lucide.createIcons()
```

## Profile View Flow
```
1. Admin taps "Profile" on outlet row
2. showOutletProfile(bid, oid):
   ├─ Read businesses/{bid}/outlets/{oid} (once)
   ├─ Read orders (limited, e.g. last 50)
   ├─ Compute analytics
   ├─ Render profile HTML into #outletProfileBody
   ├─ Show #outletProfileModal
   └─ lucide.createIcons()
3. Admin views outlet info + performance analytics
4. Admin taps "X" → hideOutletProfile
```

## Edit Flow
```
1. Admin taps "Edit" on outlet row
2. showOutletModal(bid, oid): pre-fills form with current data
3. Admin modifies fields (name, address, admin password, etc.)
4. Admin clicks "Save"
5. updateOutlet():
   ├─ Read form values
   ├─ Build update object: businesses/{bid}/outlets/{oid}
   ├─ If password changed: system/admins/{adminUid}.update({ password })
   ├─ db.ref().update(updates)
   ├─ logAdminAction('OUTLET_UPDATED', { bid, oid })
   └─ showToast("Outlet updated")
```

## Search Flow
```
1. Admin types in #outletSearchInput
2. filterOutletList() on every keyup:
   ├─ Read #outletSearchInput.value
   ├─ Filter filteredOutletsList by name.toLowerCase().includes(term)
   ├─ renderOutletList() with filtered subset
```
