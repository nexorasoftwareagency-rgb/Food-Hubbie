# Roshani Settings Tab Migration Prompt

## For the AI Agent Working on Roshani Settings

**CRITICAL WARNING:** The Settings system touches **5 Firebase paths**, **22+ Store fields**, **10 Display booleans**, **5 Bot images**, **Delivery slabs**, and **Dine-In charges**. Every field has consumers in the bot, rider app, customer menu, receipts, and promotions. This prompt is designed for **zero-disruption migration**. Follow EVERY instruction exactly. Do NOT take shortcuts.

---

## Overview

**Goal:** Modernize Roshani's Settings tab UI by adopting the best structural patterns from the Foodhubbie admin-dashboard SettingsPage, WITHOUT changing any Firebase data shape, HTML element IDs, or breaking any existing consumer.

### What to steal from Foodhubbie
1. **Tab navigation** — Replace the single scrollable page with sub-tabs (Store, Delivery, Inventory, Display, Notifications, Dine-In, Offers)
2. **Reusable field rendering** — Use a `renderField()` function + field definition arrays, not hand-rolled HTML per field
3. **Clean file separation** — Extract settings HTML from `index.html` into a template or separate module
4. **Per-tab save buttons** — Allow saving from any tab (but keep Roshani's atomic multi-path save)

### What to KEEP EXACTLY AS-IS
1. **All HTML element IDs** — Every `id="settingStoreName"`, `id="settingGSTIN"`, etc. must remain identical. The JS module reads them by ID.
2. **All Firebase paths** — `settings/Store`, `settings/Delivery`, `settings/Bot`, `settings/Display`, `dineinSettings` — NO changes.
3. **All field keys** — `entityName`, `storeName`, `gstin`, `checkShowStoreName`, `imgConfirmed`, `slabs`, etc. — NO renames.
4. **The save mechanism** — Keep the atomic `update(ref(db), updates)` that writes all 5 paths at once.
5. **All validation logic** — GSTIN, FSSAI, coordinates, phone, backup code — keep every check.
6. **Image upload mechanism** — Keep `previewSettingsImage()` with 500KB limit and base64 storage.
7. **Dirty-state tracking** — Keep `state.settingsDirty` and the tab-switch guard.
8. **No consumer changes** — Do NOT modify bot/, rider/, menu/, printing.js, or any other file outside the settings UI.

---

## Step-by-Step Migration Plan

### Step 0: Prerequisites — Audit & Snapshot

Before ANY code changes, run these verification commands:

```bash
# 1. Backup the current files
cp Admin/index.html Admin/index.html.bak
cp Admin/js/features/settings.js Admin/js/features/settings.js.bak

# 2. Verify the current settings tab renders correctly
# Open the admin dashboard in a browser, navigate to Settings, and screenshot it

# 3. Print a receipt to verify printing still works

# 4. Send a test WhatsApp order notification
```

**Do NOT proceed to Step 1 until all 4 verifications pass.**

---

### Step 1: Create the Tabbed Navigation Structure

#### 1A. Define the sub-tabs array

In `settings.js`, add a constant near the top (AFTER the existing `SETTINGS_PATHS` object, BEFORE any functions):

```javascript
// ===== SUB-TAB DEFINITION =====
const SETTINGS_TABS = [
  { id: "store",        label: "Store" },
  { id: "delivery",     label: "Delivery" },
  { id: "inventory",    label: "Inventory" },
  { id: "display",      label: "Display" },
  { id: "notifications", label: "Notifications" },
  { id: "dinein",       label: "Dine-In" },
  { id: "offers",       label: "Offers" },
];

/** Current active sub-tab (NOT the main sidebar tab — this is inside Settings) */
let _currentSubTab = "store";

function switchSettingsSubTab(tabId) {
  // --- Dirty check (same pattern as ui.js switchTab) ---
  if (state.settingsDirty && _currentSubTab !== tabId) {
    if (!confirm("You have unsaved changes. Discard them?")) return;
    state.settingsDirty = false;
  }

  _currentSubTab = tabId;

  // Hide all settings tab-content sections
  document.querySelectorAll("#tab-settings .settings-tab-content").forEach(el => {
    el.style.display = "none";
  });

  // Show the selected section
  const target = document.getElementById(`settings-tab-${tabId}`);
  if (target) target.style.display = "block";

  // Update tab button active state
  document.querySelectorAll(".settings-sub-tab-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.settingsTab === tabId);
  });
}
```

#### 1B. Render the sub-tab buttons

Create a function to render the tab bar:

```javascript
function renderSettingsSubTabBar() {
  const container = document.getElementById("settings-sub-tab-bar");
  if (!container) return;
  container.innerHTML = SETTINGS_TABS.map(t =>
    `<div class="settings-sub-tab-btn ${t.id === _currentSubTab ? 'active' : ''}"
          data-settings-tab="${t.id}"
          onclick="switchSettingsSubTab('${t.id}')"
          style="padding:6px 18px; border-radius:8px; cursor:pointer; font-size:12px;
                 font-weight:600; text-transform:capitalize;
                 background:${t.id === _currentSubTab ? '#f97316' : '#f1f5f9'};
                 color:${t.id === _currentSubTab ? 'white' : '#64748b'};
                 transition:all 0.2s;">${t.label}</div>`
  ).join("");
}
```

#### 1C. Add CSS for sub-tab bar

Add to `Admin/style.css`:

```css
/* Settings sub-tab navigation */
#settings-sub-tab-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.settings-sub-tab-btn {
  transition: all 0.2s;
}
.settings-sub-tab-btn:hover {
  opacity: 0.85;
}
.settings-tab-content {
  display: none;
}
.settings-tab-content.active {
  display: block;
}
```

---

### Step 2: Restructure the Settings HTML in `index.html`

**CRITICAL RULE: Do NOT change any `id` attribute. Do NOT change any `name`, `data-*`, or `onclick` attributes. Do NOT remove any HTML elements — only REORGANIZE them into tab containers.**

#### 2A. Find and modify the settings tab container

Locate `<div id="tab-settings">` in `index.html` (currently around line 1839).

**Change:** Add the sub-tab bar at the top, then wrap each logical section in a `.settings-tab-content` div.

**BEFORE:**
```html
<div id="tab-settings" class="tab-content" style="display: none;">
  <!-- Card 1: Receipt & Store Information -->
  <div class="glass-card p-4" ...>
    <!-- 200+ lines of fields -->
  </div>
  <!-- Card 2: Store Location -->
  <!-- Card 3: Order Notifications -->
  <!-- ... etc -->
</div>
```

**AFTER:**
```html
<div id="tab-settings" class="tab-content" style="display: none;">
  <!-- Sub-tab bar -->
  <div id="settings-sub-tab-bar"></div>

  <!-- TAB: Store (card 1 sections that relate to store info) -->
  <div id="settings-tab-store" class="settings-tab-content" style="display: block;">
    <div class="glass-card p-4" id="settings-card-business">
      <!-- Move ONLY the store-related fields here:
           - Business Details (entityName, storeName, address, gstin, fssai)
           - Outlet Status (shopStatus)
           - Marketing & Connectivity (wifiName, wifiPass, instagram, facebook, reviewUrl, whatsappNumber, customerMenuBgImage)
           - Feedback Bot Options (reason1, reason2, reason3)
           - Developer Settings (devPhone, reportPhone)
           - Payment QR upload (settingQRFile, qrPreview, btnChangeQR)
           - Store Location (lat, lng)
      -->
    </div>
    <!-- Save button for Store tab -->
    <button id="btnSaveSettings" class="btn-primary" style="width:100%;">
      Save Store Settings
    </button>
  </div>

  <!-- TAB: Delivery -->
  <div id="settings-tab-delivery" class="settings-tab-content" style="display: none;">
    <!-- Move delivery-related fields here:
         - developerPhone, reportPhone, notifyPhone, backupCode (Order Notifications card)
         - Delivery Fee Tiers (fee slabs)
    -->
    <!-- KEEP: Existing delivery fee add/remove HTML structure -->
    <!-- KEEP: btnAddFeeSlab button -->
    <button id="btnSaveSettings" class="btn-primary" style="width:100%;">
      Save Delivery Settings
    </button>
  </div>

  <!-- TAB: Inventory -->
  <div id="settings-tab-inventory" class="settings-tab-content" style="display: none;">
    <!-- Move inventory toggles here (currently in Admin/js/features/inventory.js) -->
    <!-- IMPORTANT: inventory.js has its own save. Do NOT duplicate it here.
         Instead, iframe or link to the inventory tab. OR add the toggles here
         and have them saved via the main settings save. -->
    <p style="font-size:13px; color:#64748b;">
      Inventory settings managed in the Inventory tab.
    </p>
  </div>

  <!-- TAB: Display -->
  <div id="settings-tab-display" class="settings-tab-content" style="display: none;">
    <!-- Move visibility control checkboxes here (currently in card 1 right column) -->
    <!-- KEEP: All 10 checkboxes with their exact IDs -->
    <button id="btnSaveSettings" class="btn-primary" style="width:100%;">
      Save Display Settings
    </button>
  </div>

  <!-- TAB: Notifications -->
  <div id="settings-tab-notifications" class="settings-tab-content" style="display: none;">
    <!-- Move notification settings here:
         - Browser push notification section
         - FCM token display
         - WhatsApp alert settings
    -->
    <button id="btnSaveSettings" class="btn-primary" style="width:100%;">
      Save Notification Settings
    </button>
  </div>

  <!-- TAB: Dine-In -->
  <div id="settings-tab-dinein" class="settings-tab-content" style="display: none;">
    <!-- Move Dine-In charges card here (tax + service charge) -->
    <button id="btnSaveSettings" class="btn-primary" style="width:100%;">
      Save Dine-In Settings
    </button>
  </div>

  <!-- TAB: Offers -->
  <div id="settings-tab-offers" class="settings-tab-content" style="display: none;">
    <!-- Move Today's Offers card here -->
    <button id="btnSaveSettings" class="btn-primary" style="width:100%;">
      Save Offers
    </button>
  </div>
</div>
```

**WARNING:** The `btnSaveSettings` button now appears MULTIPLE times (once per tab). This is OK because JavaScript listeners use `document.getElementById('btnSaveSettings')` which returns the FIRST match, or you can change the JS listener to use a class selector instead:

```javascript
// REPLACE the old single listener in main.js:
document.getElementById('btnSaveSettings').addEventListener('click', ...);

// WITH a delegated listener:
document.querySelectorAll('#tab-settings [data-save-settings]').forEach(btn => {
  btn.addEventListener('click', saveStoreSettings);
});
```

And add `data-save-settings` attribute to each save button.

---

### Step 3: Refactor Field Rendering (settings.js)

**Goal:** Create reusable field rendering similar to FoodHubbie's pattern, but OUTPUT HTML strings instead of JSX.

**IMPORTANT:** This is OPTIONAL and can be skipped if it introduces too much risk. The tab restructure alone is the main improvement.

#### 3A. Define field definition arrays

```javascript
const STORE_FIELDS = [
  { key: "entityName",    label: "Legal Entity Name",  type: "text" },
  { key: "storeName",     label: "Store Name (Display)", type: "text" },
  { key: "address",       label: "Store Address",      type: "textarea" },
  { key: "gstin",         label: "GSTIN Number",       type: "text" },
  { key: "fssai",         label: "FSSAI Number",        type: "text" },
  { key: "tagline",       label: "Header Tagline",      type: "text" },
  { key: "poweredBy",     label: "Powered By Tagline",  type: "text" },
  // ... etc
];

function renderField(fieldDef, value) {
  const tag = fieldDef.type === "textarea" ? "textarea" : "input";
  const extra = fieldDef.type === "textarea"
    ? `>${esc(value || "")}</textarea>`
    : ` value="${esc(value || "")}" />`;
  return `
    <div style="margin-bottom:10px">
      <label style="font-size:11px;font-weight:600;color:#64748b;display:block;margin-bottom:3px">
        ${fieldDef.label}
      </label>
      <${tag} id="setting${fieldDef.key.charAt(0).toUpperCase() + fieldDef.key.slice(1)}"
             type="${fieldDef.type || 'text'}"
             data-settings-field="${fieldDef.key}"
             style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:8px;
                    font-size:13px;outline:none;box-sizing:border-box;"
             ${extra}
    </div>
  `;
}
```

**WARNING:** `esc()` must escape HTML entities (`&`, `<`, `>`, `"`, `'`) to prevent XSS when rendering field values.

---

### Step 4: Update saveStoreSettings() for Multi-Tab

**CRITICAL:** The core save mechanism must remain identical. Only the button interaction pattern changes.

```javascript
async function saveStoreSettings() {
  const btn = document.querySelector('[data-save-settings]:focus') ||
              document.querySelector('[data-save-settings]');
  if (btn) {
    btn.disabled = true;
    btn.textContent = "⏳ Saving...";
  }

  try {
    // --- EXISTING validation code — DO NOT MODIFY ---
    // (validateCoords, validateGSTIN, validateFSSAI, validateBackupCode, validatePhone)

    // --- EXISTING data gathering — DO NOT MODIFY ---
    const storeData = { /* read from DOM */ };
    const deliveryData = { /* read from DOM */ };
    const botData = { /* read from DOM */ };
    const displayData = { /* read from DOM */ };
    const dineData = { /* read from DOM */ };

    // --- EXISTING atomic save — DO NOT MODIFY ---
    const updates = {};
    updates[`${Outlet.current}/settings/Store`] = storeData;
    updates[`${Outlet.current}/settings/Delivery`] = deliveryData;
    updates[`${Outlet.current}/settings/Bot`] = botData;
    updates[`${Outlet.current}/settings/Display`] = displayData;
    updates[`${Outlet.current}/dineinSettings`] = dineData;
    await update(ref(db), updates);

    showToast("Settings saved successfully", "success");
    state.settingsDirty = false;
  } catch(e) {
    showToast("Save failed: " + e.message, "error");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = "Save Settings";
    }
  }
}
```

**Why keep atomic save?** Changing to per-tab saves would mean:
- Tab A saves → `settings/Store` written, `settings/Delivery` stays stale
- Bot picks up delivery data from previous save → inconsistent state
- Race conditions if two tabs are saved simultaneously

Atomic save avoids all of this. The user gets the convenience of per-tab save buttons, but the data integrity of a single atomic write.

---

### Step 5: Move Bot Images & Marketing to Store Tab

**RATIONAL:** In Foodhubbie, all store-related fields (including images and marketing) are in one "Store" tab. Roshani scatters them across multiple cards.

**DO:**
- Move `settingQRFile` / `qrPreview` / `btnChangeQR` / `settingQRUrl` → Store tab
- Move `settingGreetingFile` / `greetingImgPreview` / `btnChangeGreetingImg` / `settingGreetingUrl` → Store tab
- Move `settingMenuFile` / `menuImgPreview` / `btnChangeMenuImg` / `settingMenuUrl` → Store tab
- Move 5 bot image uploaders → Dine-In or Offers tab (since they're bot-related)

**DON'T:**
- Change any HTML `id` or input `name` attributes
- Change the preview image element `id` values
- Change the `onclick` or `data-action` attributes

---

### Step 6: Add Save Button to loadStoreSettings()

**Problem:** Currently `loadStoreSettings()` reads from Firebase and populates the DOM. After restructuring into tabs, some elements may not be rendered yet (hidden tabs).

**Solution:** Ensure `loadStoreSettings()` populates ALL fields regardless of which tab is visible:

```javascript
async function loadStoreSettings() {
  showLoader(true);
  try {
    const outlet = Outlet.current;
    const snap = await get(ref(db, `${outlet}/settings`));
    const data = snap.val() || {};
    const storeData = data.Store || {};
    const deliveryData = data.Delivery || {};
    const botData = data.Bot || {};
    const displayData = data.Display || {};

    // Populate STORE fields (all tabs)
    Object.entries(storeData).forEach(([key, val]) => {
      const el = document.getElementById(`setting${key.charAt(0).toUpperCase() + key.slice(1)}`);
      if (el) el.value = val || '';
    });

    // Special handling for elements that don't follow the naming pattern:
    if (document.getElementById('settingShopStatus')) {
      document.getElementById('settingShopStatus').value = storeData.shopStatus || 'AUTO';
    }

    // Populate DISPLAY checkboxes
    Object.entries(displayData).forEach(([key, val]) => {
      const el = document.getElementById(key);
      if (el && el.type === 'checkbox') el.checked = val !== false;
    });

    // Populate DELIVERY fields
    if (document.getElementById('settingDevPhone'))
      document.getElementById('settingDevPhone').value = deliveryData.developerPhone || '';
    if (document.getElementById('settingReportPhone'))
      document.getElementById('settingReportPhone').value = deliveryData.reportPhone || '';
    if (document.getElementById('settingAdminPhone'))
      document.getElementById('settingAdminPhone').value = deliveryData.notifyPhone || '';
    if (document.getElementById('settingDeliveryBackupCode'))
      document.getElementById('settingDeliveryBackupCode').value = deliveryData.backupCode || '';

    // Render delivery fee slabs
    renderFeeSlabs(deliveryData.slabs || []);

    // Populate BOT image previews
    if (document.getElementById('botImgConfirmedPreview'))
      document.getElementById('botImgConfirmedPreview').src = botData.imgConfirmed || '';
    // ... same for ready, out, delivered, feedback

    // Populate greeting/menu images
    if (document.getElementById('greetingImgPreview'))
      document.getElementById('greetingImgPreview').src = botData.greetingImage || '';
    if (document.getElementById('menuImgPreview'))
      document.getElementById('menuImgPreview').src = botData.menuImage || '';

    // Load dine-in settings
    await loadDineInSettings();

    // Render offers
    _renderOffers(dineData.offers || []);

    state.settingsDirty = false;
  } catch(e) {
    console.error("Failed to load settings:", e);
    showToast("Failed to load settings", "error");
  } finally {
    showLoader(false);
  }
}
```

**Key principle:** `document.getElementById('xxx')` returns `null` if the element doesn't exist. Use `if (el)` checks to avoid errors on elements in hidden tabs. This is already safe.

---

### Step 7: Update the Dirty-Change Listener

Change the existing delegated 'input' listener (settings.js lines 518-526) to use a more specific selector. Currently it checks `e.target.closest('#tab-settings')`. This still works after the restructure since all settings fields remain inside `#tab-settings`.

**No change needed** — the existing dirty listener will automatically work with the new structure.

```javascript
// EXISTING CODE — WORKS AS-IS:
document.addEventListener('input', function(e) {
  if (e.target.closest('#tab-settings') && !state.settingsDirty) {
    state.settingsDirty = true;
  }
});
```

---

### Step 8: Test Every Single Path (Regression Checklist)

After making changes, verify ALL of these. Do NOT ship until every item passes.

#### 8A. Tab Navigation
- [ ] All 7 sub-tab buttons render at the top of Settings
- [ ] Clicking a tab hides the previous tab content
- [ ] Clicking a tab highlights the new tab button
- [ ] Order of tabs matches: Store → Delivery → Inventory → Display → Notifications → Dine-In → Offers
- [ ] Dirty-unsaved-changes dialog appears when switching tabs with unsaved changes

#### 8B. Store Tab
- [ ] All 16+ store fields populate correctly from Firebase
- [ ] entityName, storeName, address, gstin, fssai, tagline, poweredBy show saved values
- [ ] shopOpenTime, shopCloseTime show as time inputs
- [ ] shopStatus dropdown shows correct value
- [ ] WiFi name/pass, Instagram, Facebook, reviewUrl, whatsappNumber populate
- [ ] lat/lng populate
- [ ] customerMenuBgImage field populates
- [ ] Payment QR preview shows saved image
- [ ] Greeting image preview shows saved image
- [ ] Menu image preview shows saved image
- [ ] File uploads work (select file, preview updates, save persists)
- [ ] GSTIN validation: invalid format shows error toast, save aborted
- [ ] FSSAI validation: invalid format shows error toast, save aborted
- [ ] Coordinates validation: out-of-range shows error toast, save aborted
- [ ] Save button persists to Firebase, toast shows "Settings saved successfully"

#### 8C. Delivery Tab
- [ ] developerPhone, reportPhone, notifyPhone, backupCode populate
- [ ] Phone validation: 10-digit auto-prefixes "91", 12-digit starting "91" passes
- [ ] Backup code validation: non-4-digit shows error
- [ ] Fee slab table renders with saved slabs
- [ ] "Add Slab" button adds a new row
- [ ] Remove slab button works
- [ ] Save persists all delivery fields + fee slabs

#### 8D. Display Tab
- [ ] All 10 checkboxes render with correct checked state
- [ ] Toggling a checkbox changes the value
- [ ] Save persists display settings
- [ ] After save, print a receipt → visibility toggles are respected

#### 8E. Notifications Tab
- [ ] Browser notification status displays correctly
- [ ] "Enable Notifications" toggle works
- [ ] "Test Notification" button sends notification
- [ ] FCM token displays (if available)

#### 8F. Dine-In Tab
- [ ] Tax enabled/disabled toggle renders correctly
- [ ] Tax name input populates
- [ ] Tax rate input populates
- [ ] Service charge enabled/disabled toggle renders correctly
- [ ] Service charge name input populates
- [ ] Service charge rate input populates
- [ ] Save persists dineinSettings

#### 8G. Offers Tab
- [ ] Existing offers render with title, description, code fields
- [ ] "Add Offer" button adds a new blank offer row
- [ ] Remove offer button removes the row
- [ ] Save persists offers to dineinSettings.offers

#### 8H. Integration Tests (CRITICAL — test on STAGING Firebase first)
- [ ] Bot sends order notification with correct store name
- [ ] Bot sends order status update with correct status image
- [ ] Bot sends greeting image on START
- [ ] Delivery fee calculation uses correct slabs
- [ ] Rider OTP verification uses correct backup code
- [ ] Customer menu shows correct store name, background image, social links
- [ ] Customer menu uses correct tax/service charge rates
- [ ] Customer menu shows correct "Today's Offers"
- [ ] QR menu welcome screen shows offers correctly
- [ ] Printed receipt respects visibility toggles
- [ ] Printed receipt shows correct store info, QR code

#### 8I. Edge Cases
- [ ] Set all settings to empty → save → reload → all fields show blank/empty
- [ ] Upload > 500KB image → error toast "Image too large"
- [ ] Change values on one tab → switch to another → "Discard changes?" dialog
- [ ] Click "Cancel" on discard dialog → stays on current tab
- [ ] Click "OK" on discard dialog → switches tab, values revert to saved
- [ ] Save with invalid data → error toast → dirty state preserved (user can fix + re-save)
- [ ] Rapid double-click save → only one save triggers
- [ ] Network disconnected during save → error toast → data not corrupted

---

## Anti-Patterns to Avoid

### ❌ DO NOT rename HTML element IDs
Every `id="settingStoreName"`, `id="checkShowGSTIN"`, `id="btnSaveSettings"`, etc. is read by JavaScript. Renaming breaks the feature.

### ❌ DO NOT change Firebase field keys
The bot, rider app, menu, and printing all read `storeData.storeName`, `deliveryData.slabs`, etc. Any rename breaks consumers silently (they have fallbacks, but the real values are lost).

### ❌ DO NOT change the save to per-path
Keep the atomic `update(ref(db), updates)` that writes all 5 paths. Per-path saves create inconsistency windows.

### ❌ DO NOT remove `btnSaveSettings` from index.html
The `main.js` listener binds to `document.getElementById('btnSaveSettings')`. You can ADD `data-save-settings` attributes to multiple buttons, but `btnSaveSettings` must still exist OR the listener must be updated.

### ❌ DO NOT use `innerHTML` with unsanitized values
When rendering field values into HTML (e.g., `renderField()`), use an `esc()` function to escape HTML entities:
```javascript
function esc(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str || ''));
  return div.innerHTML;
}
```

### ❌ DO NOT remove the `style="display: none;"` from `#tab-settings`
The main tab system controls visibility via inline `display: none`. If you remove it, the settings tab will be visible on page load.

### ❌ DO NOT convert to a SPA-like router
Keep the existing tab system (`switchTab()` in ui.js). Only add the sub-tab layer inside `#tab-settings`. Don't change how `mod('settings')` lazy-loads the module.

### ❌ DO NOT touch inventory.js or discounts.js
These are separate feature modules with their own save mechanisms. The Inventory tab in settings should point to the existing inventory UI or just show the two toggles (availability + stock tracking) that already exist.

---

## File Change Summary

| File | Change Type | Risk Level |
|------|-------------|------------|
| `Admin/index.html` | **MODIFY** — restructure settings HTML into tab containers | **HIGH** — most complex change |
| `Admin/js/features/settings.js` | **MODIFY** — add tab functions, sub-tab bar render, update loadStoreSettings | **MEDIUM** — new code, existing logic preserved |
| `Admin/style.css` | **MODIFY** — add sub-tab styles | **LOW** — additive CSS only |
| `Admin/js/main.js` | **MODIFY** — update save button listener to use class selector | **LOW** — single listener change |
| `Admin/js/ui.js` | **NO CHANGE** | **NONE** |
| `Admin/js/features/inventory.js` | **NO CHANGE** | **NONE** |
| `Admin/receipt-templates.js` | **NO CHANGE** | **NONE** |
| `Admin/js/features/printing.js` | **NO CHANGE** | **NONE** |
| `bot/index.js` | **NO CHANGE** | **NONE** |
| `bot/utils.js` | **NO CHANGE** | **NONE** |
| `rider/app.js` | **NO CHANGE** | **NONE** |
| `menu/js/app.js` | **NO CHANGE** | **NONE** |
| `database.rules.json` | **NO CHANGE** | **NONE** |

---

## Rollback Plan

If any regression is found after deployment:

```bash
# 1. Restore backups immediately
cp Admin/index.html.bak Admin/index.html
cp Admin/js/features/settings.js.bak Admin/js/features/settings.js

# 2. Clear browser cache and reload
# Settings will be exactly as before — no data migration was run,
# so there is nothing to "undo" at the Firebase level.

# 3. File a bug report with the exact step that failed
```

**There is NO data migration** in this plan — Firebase schema stays identical. Rollback is instant and safe.

---

## Success Criteria

The migration is successful when:
1. The Settings page loads with sub-tabs at the top
2. Each tab shows its relevant fields only
3. All fields populate correctly from Firebase
4. All validations work identically to before
5. Save writes all 5 Firebase paths atomically
6. Dirty-state tracking works across tabs
7. Every consumer (bot, rider, menu, receipts, promotions) behaves identically to before
8. No new console errors
9. No new Firebase reads/writes (same pattern, same paths)

---

*Prompt generated July 2, 2026 — based on deep audit of roshani-pizza-bot settings system and comparison with Foodhubbie admin-dashboard SettingsPage.*
