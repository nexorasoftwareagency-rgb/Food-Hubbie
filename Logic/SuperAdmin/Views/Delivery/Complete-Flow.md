# Delivery Tab — Complete Flow

## Page Load Sequence
```
1. Admin navigates to "Service Slabs" tab
2. loadGlobalDelivery() called:
   ├─ db.ref('system/settings/delivery').once('value')
   ├─ If data exists:
   │   ├─ Set globalDeliverySlabs = data.slabs || []
   │   ├─ Set deliveryMode = data.mode
   │   ├─ Check correct radio button
   │   ├─ Show/hide per100mSection / slabsSection
   │   ├─ Set #per100mRate.value = data.per100mRate
   │   └─ renderDeliverySlabs()
   ├─ If no data:
   │   └─ Initialize defaults (mode="slabs", one default slab)
   └─ lucide.createIcons()
```

## Edit Flow
```
1. Admin selects Per 100m mode → #per100mSection shown
   ├─ Changes #per100mRate value
   └─ Taps "Deploy Changes"

2. Admin selects Slab mode → #slabsSection shown
   ├─ Edits existing slab values inline
   ├─ Taps "+" → addDeliverySlab() → push new empty slab
   └─ Taps "Deploy Changes"
```

## Save Flow
```
1. Admin taps "Deploy Changes"
2. saveGlobalDelivery():
   ├─ Build save object based on current mode
   ├─ db.ref('system/settings/delivery').set({
   │     mode: deliveryMode,
   │     per100mRate: parseFloat(#per100mRate.value),
   │     slabs: globalDeliverySlabs
   │   })
   └─ showToast("Delivery config deployed")
```
