import { state } from '../state.js';
import { Outlet, uploadImage } from '../firebase.js';
import { logAudit, atomicAdminAction, showToast } from '../utils.js';
import { ui } from '../ui.js';

// --- STATE & UTILS ---
const SETTINGS_PATHS = {
    STORE: "settings/Store",
    DELIVERY: "settings/Delivery",
    BOT: "settings/Bot",
    DISPLAY: "settings/Display",
    REVENUE: "settings/Revenue"
};

/**
 * Validates Latitude and Longitude
 */
function validateCoords(lat, lng) {
    const l = parseFloat(lat);
    const n = parseFloat(lng);
    if (isNaN(l) || l < -90 || l > 90) return { valid: false, msg: "Invalid Latitude (-90 to 90)" };
    if (isNaN(n) || n < -180 || n > 180) return { valid: false, msg: "Invalid Longitude (-180 to 180)" };
    return { valid: true };
}

/**
 * Validates Indian Phone Format (91XXXXXXXXXX)
 */
function validatePhone(phone, label) {
    if (!phone) return true; // Optional fields
    const clean = String(phone).replace(/\D/g, '');
    if (clean.length === 10) return { valid: true, value: "91" + clean };
    if (clean.length !== 12 || !clean.startsWith('91')) {
        return { valid: false, msg: `${label} must be 10 digits or 12 digits starting with 91` };
    }
    return { valid: true, value: clean };
}

/**
 * Validates GSTIN (15 characters)
 */
function validateGSTIN(gst) {
    if (!gst) return true;
    const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!regex.test(gst)) return { valid: false, msg: "Invalid GSTIN Format" };
    return { valid: true };
}

/**
 * Validates FSSAI (14 digits)
 */
function validateFSSAI(fssai) {
    if (!fssai) return true;
    if (!/^[0-9]{14}$/.test(fssai)) return { valid: false, msg: "FSSAI must be exactly 14 digits" };
    return { valid: true };
}

/**
 * Validates Backup/Access Code (4 digits)
 */
function validateBackupCode(code) {
    if (!/^[0-9]{4}$/.test(code)) return { valid: false, msg: "Backup Code must be 4 digits" };
    return { valid: true };
}

/**
 * Visual Shake Effect for Errors (Smooth Functioning Phase)
 */
function applyShake(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add('error-border', 'shake');
    el.focus();
    setTimeout(() => {
        el.classList.remove('shake');
    }, 500);
    
    // Clear error border on input
    el.addEventListener('input', () => {
        el.classList.remove('error-border');
    }, { once: true });
}

// --- CORE FUNCTIONS ---

export async function loadStoreSettings() {
    console.log("[Settings] Loading all store settings...");
    try {
        const [storeSnap, delSnap, botSnap, dispSnap] = await Promise.all([
            Outlet.ref(SETTINGS_PATHS.STORE).once("value"),
            Outlet.ref(SETTINGS_PATHS.DELIVERY).once("value"),
            Outlet.ref(SETTINGS_PATHS.BOT).once("value"),
            Outlet.ref(SETTINGS_PATHS.DISPLAY).once("value"),
            Outlet.ref(SETTINGS_PATHS.REVENUE).once("value")
        ]);

        const store = storeSnap.val();
        const del = delSnap.val();
        const bot = botSnap.val();
        const disp = dispSnap.val();
        const rev = revSnap.val() || {};

        // 1. Store Info
        const s = store || {};
        document.getElementById('settingEntityName').value = s.entityName || '';
        document.getElementById('settingStoreName').value = s.storeName || '';
        document.getElementById('settingStoreAddress').value = s.address || '';
        document.getElementById('settingGSTIN').value = s.gstin || '';
        document.getElementById('settingFSSAI').value = s.fssai || '';
        document.getElementById('settingTagline').value = s.tagline || '';
        document.getElementById('settingPoweredBy').value = s.poweredBy || 'Powered by Foodhubbie SaaS';
        document.getElementById('settingOpenTime').value = s.shopOpenTime || '10:00';
        document.getElementById('settingCloseTime').value = s.shopCloseTime || '23:00';
        document.getElementById('settingShopStatus').value = s.shopStatus || 'AUTO';
        
        document.getElementById('settingWifiName').value = s.wifiName || '';
        document.getElementById('settingWifiPass').value = s.wifiPass || '';
        document.getElementById('settingInstagram').value = s.instagram || '';
        document.getElementById('settingFacebook').value = s.facebook || '';
        document.getElementById('settingReviewUrl').value = s.reviewUrl || '';
        
        document.getElementById('settingLat').value = s.lat || '25.887444';
        document.getElementById('settingLng').value = s.lng || '85.026889';
        document.getElementById('displayCoords').innerText = `${s.lat || '25.887444'}, ${s.lng || '85.026889'}`;

        // 2. Delivery & Security
        const s_info = store || {};
        document.getElementById('settingDevPhone').value = s_info.devPhone || '';
        document.getElementById('settingReportPhone').value = s_info.reportPhone || '';
        
        const d = del || {};
        document.getElementById('settingAdminPhone').value = d.notifyPhone || '';
        document.getElementById('settingDeliveryBackupCode').value = d.backupCode || '';

        // 2.5 Revenue & Commission (NEW)
        document.getElementById('settingCommissionType').value = rev.commissionType || 'PERCENTAGE';
        document.getElementById('settingCommissionValue').value = rev.commissionValue || '20';
        document.getElementById('settingRiderFeeBase').value = rev.riderFeeBase || '30';
        document.getElementById('settingRiderKmIncentive').value = rev.riderKmIncentive || '5';



        // 3. Bot Aesthetics & Marketing
        const b = bot || {};
        const botPreviews = {
            'botImgConfirmedPreview': b.imgConfirmed,
            'botImgPreparingPreview': b.imgPreparing,
            'botImgCookedPreview': b.imgCooked,
            'botImgOutPreview': b.imgOut,
            'botImgDeliveredPreview': b.imgDelivered,
            'botImgFeedbackPreview': b.imgFeedback,
            'greetingImgPreview': b.greetingImage,
            'menuImgPreview': b.menuImage
        };
        for (const [id, url] of Object.entries(botPreviews)) {
            if (url) {
                const el = document.getElementById(id);
                if (el) el.src = url;
                // Also update hidden inputs for Marketing images
                if (id === 'greetingImgPreview') document.getElementById('settingGreetingUrl').value = url;
                if (id === 'menuImgPreview') document.getElementById('settingMenuUrl').value = url;
            }
        }

        // 4. Social & Promotions
        document.getElementById('botSocialInsta').value = b.socialInsta || '';
        document.getElementById('botSocialFb').value = b.socialFb || '';
        document.getElementById('botSocialReview').value = b.socialReview || '';
        document.getElementById('botSocialWebsite').value = b.socialWebsite || '';
        
        // Feedback Reasons
        document.getElementById('settingFeedbackReason1').value = b.reason1 || 'Delicious Taste';
        document.getElementById('settingFeedbackReason2').value = b.reason2 || 'Fast Delivery';
        document.getElementById('settingFeedbackReason3').value = b.reason3 || 'Premium Packaging';

        // 5. Visibility Controls
        const vi = disp || {};
        const checks = [
            'checkShowStoreName', 'checkShowAddress', 'checkShowGSTIN', 'checkShowFSSAI', 'checkShowTagline',
            'checkShowPoweredBy', 'checkShowQR', 'checkShowWifiInfo', 'checkShowSocial', 'checkShowFeedbackQR'
        ];
        checks.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.checked = vi[id] !== false; // default to true
        });

        // 6. Payment QR
        if (s.paymentQR) {
            document.getElementById('qrPreview').src = s.paymentQR;
            document.getElementById('settingQRUrl').value = s.paymentQR;
        }

        if (window.updateOutletStatusIndicator) window.updateOutletStatusIndicator(s.shopStatus || 'AUTO');
        
        state.settingsDirty = false;
        
        // 7. Update Preview & Health (Smooth Functioning)
        updateReceiptPreview();
        calculateSettingsHealth();
        
        console.log("[Settings] All data populated.");
    } catch (e) {
        console.error("[Settings] Load Error:", e);
        showToast("Failed to load settings", "error");
    }
}

/**
 * CALCULATE SETTINGS HEALTH (Smooth Functioning Phase)
 * Analyzes how complete the store profile is and updates the progress bar.
 */
export function calculateSettingsHealth() {
    const fields = [
        'settingStoreName', 'settingStoreAddress', 'settingGSTIN', 'settingFSSAI',
        'settingTagline', 'settingLat', 'settingLng', 'settingQRUrl',
        'settingGreetingUrl', 'settingMenuUrl'
    ];
    
    let completed = 0;
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el && (el.value || '').trim().length > 3) completed++;
    });

    const percent = Math.round((completed / fields.length) * 100);
    const fill = document.getElementById('settingsHealthFill');
    const txt = document.getElementById('settingsHealthTxt');
    
    if (fill) {
        fill.style.width = percent + '%';
        // Update color based on health
        if (percent < 40) fill.style.background = 'var(--danger)';
        else if (percent < 80) fill.style.background = 'var(--primary)';
        else fill.style.background = 'var(--action-green)';
    }
    if (txt) txt.innerText = percent + '% Complete';
}

/**
 * UPDATE RECEIPT PREVIEW (Smooth Functioning Phase)
 * Renders a virtual thermal receipt in real-time as the admin types.
 */
export function updateReceiptPreview() {
    const getVal = (id) => document.getElementById(id)?.value || '';
    const isChecked = (id) => document.getElementById(id)?.checked;

    // Header Info
    const storeName = document.getElementById('previewStoreName');
    const tagline = document.getElementById('previewTagline');
    const address = document.getElementById('previewAddress');

    if (storeName) {
        storeName.innerText = getVal('settingStoreName').toUpperCase() || 'STORE NAME';
        storeName.parentElement.style.display = isChecked('checkShowStoreName') ? 'block' : 'none';
    }
    if (tagline) {
        tagline.innerText = getVal('settingTagline') || 'Your Tagline Here';
        tagline.style.display = isChecked('checkShowTagline') ? 'block' : 'none';
    }
    if (address) {
        address.innerText = getVal('settingStoreAddress') || 'Store Address...';
        address.style.display = isChecked('checkShowAddress') ? 'block' : 'none';
    }

    // Footer Info
    const gstin = document.getElementById('previewGSTIN');
    const fssai = document.getElementById('previewFSSAI');
    const powered = document.getElementById('previewPoweredBy');
    const wifiContainer = document.getElementById('previewWifiContainer');

    if (gstin) {
        gstin.innerText = 'GST: ' + (getVal('settingGSTIN') || '10XXXXXXXXXXXX');
        gstin.style.display = isChecked('checkShowGSTIN') ? 'block' : 'none';
    }
    if (fssai) {
        fssai.innerText = 'FSSAI: ' + (getVal('settingFSSAI') || '1XXXXXXXXXXXXX');
        fssai.style.display = isChecked('checkShowFSSAI') ? 'block' : 'none';
    }
    if (powered) {
        powered.innerText = getVal('settingPoweredBy') || 'Powered by Foodhubbie';
        powered.style.display = isChecked('checkShowPoweredBy') ? 'block' : 'none';
    }

    if (wifiContainer) {
        document.getElementById('previewWifiSSID').innerText = getVal('settingWifiName') || 'SSID';
        document.getElementById('previewWifiPass').innerText = getVal('settingWifiPass') || '****';
        wifiContainer.style.display = isChecked('checkShowWifiInfo') ? 'block' : 'none';
    }

    // Lucide Icons update for info box if needed
    if (window.lucide) window.lucide.createIcons({ root: document.getElementById('thermalReceiptPreview') });
}


export async function saveStoreSettings() {
    console.log("[Settings] Preparing to save...");
    
    // 1. Validation
    const latInput = document.getElementById('settingLat');
    const lngInput = document.getElementById('settingLng');
    const vCoord = validateCoords(latInput.value, lngInput.value);
    if (!vCoord.valid) {
        applyShake('settingLat');
        return showToast(vCoord.msg, "error");
    }

    const gstinInput = document.getElementById('settingGSTIN');
    const vGst = validateGSTIN(gstinInput.value.trim());
    if (vGst !== true && !vGst.valid) {
        applyShake('settingGSTIN');
        return showToast(vGst.msg, "error");
    }

    const fssaiInput = document.getElementById('settingFSSAI');
    const vFssai = validateFSSAI(fssaiInput.value.trim());
    if (vFssai !== true && !vFssai.valid) {
        applyShake('settingFSSAI');
        return showToast(vFssai.msg, "error");
    }

    const backupInput = document.getElementById('settingDeliveryBackupCode');
    const vBackup = validateBackupCode(backupInput.value.trim());
    if (vBackup !== true && !vBackup.valid) {
        applyShake('settingDeliveryBackupCode');
        return showToast(vBackup.msg, "error");
    }

    const phones = [
        { id: 'settingDevPhone', label: "Developer Phone" },
        { id: 'settingReportPhone', label: "Report Phone" },
        { id: 'settingAdminPhone', label: "Admin Notification Phone" }
    ];

    for (const p of phones) {
        const input = document.getElementById(p.id);
        const v = validatePhone(input.value, p.label);
        if (v !== true && !v.valid) {
            applyShake(p.id);
            return showToast(v.msg, "error");
        }
        if (v.value) input.value = v.value; // Auto-prefix 91
    }

    if (ui.setLoading) ui.setLoading('btnSaveSettings', true);

    try {
        // 2. Collect Data
        const updates = {};
        const lat = document.getElementById('settingLat').value;
        const lng = document.getElementById('settingLng').value;

        const storeData = {
            entityName: document.getElementById('settingEntityName').value,
            storeName: document.getElementById('settingStoreName').value,
            address: document.getElementById('settingStoreAddress').value,
            gstin: document.getElementById('settingGSTIN').value,
            fssai: document.getElementById('settingFSSAI').value,
            tagline: document.getElementById('settingTagline').value,
            poweredBy: document.getElementById('settingPoweredBy').value,
            shopOpenTime: document.getElementById('settingOpenTime').value,
            shopCloseTime: document.getElementById('settingCloseTime').value,
            shopStatus: document.getElementById('settingShopStatus').value,
            wifiName: document.getElementById('settingWifiName').value,
            wifiPass: document.getElementById('settingWifiPass').value,
            instagram: document.getElementById('settingInstagram').value,
            facebook: document.getElementById('settingFacebook').value,
            reviewUrl: document.getElementById('settingReviewUrl').value,
            devPhone: document.getElementById('settingDevPhone').value,
            reportPhone: document.getElementById('settingReportPhone').value,
            lat, 
            lng,
            paymentQR: document.getElementById('settingQRUrl').value || null,
            updatedAt: ServerValue.TIMESTAMP
        };

        const delData = {
            notifyPhone: document.getElementById('settingAdminPhone').value,
            backupCode: document.getElementById('settingDeliveryBackupCode').value,
            updatedAt: ServerValue.TIMESTAMP
        };

        const revData = {
            commissionType: document.getElementById('settingCommissionType').value,
            commissionValue: parseFloat(document.getElementById('settingCommissionValue').value) || 0,
            riderFeeBase: parseFloat(document.getElementById('settingRiderFeeBase').value) || 0,
            riderKmIncentive: parseFloat(document.getElementById('settingRiderKmIncentive').value) || 0,
            updatedAt: ServerValue.TIMESTAMP
        };

        const botData = {
            imgConfirmed: document.getElementById('botImgConfirmedPreview').src,
            imgPreparing: document.getElementById('botImgPreparingPreview').src,
            imgCooked: document.getElementById('botImgCookedPreview').src,
            imgOut: document.getElementById('botImgOutPreview').src,
            imgDelivered: document.getElementById('botImgDeliveredPreview').src,
            imgFeedback: document.getElementById('botImgFeedbackPreview').src,
            greetingImage: document.getElementById('settingGreetingUrl').value || null,
            menuImage: document.getElementById('settingMenuUrl').value || null,
            socialInsta: document.getElementById('botSocialInsta').value,
            socialFb: document.getElementById('botSocialFb').value,
            socialReview: document.getElementById('botSocialReview').value,
            socialWebsite: document.getElementById('botSocialWebsite').value,
            reason1: document.getElementById('settingFeedbackReason1').value,
            reason2: document.getElementById('settingFeedbackReason2').value,
            reason3: document.getElementById('settingFeedbackReason3').value,
            updatedAt: ServerValue.TIMESTAMP
        };

        const dispData = {};
        [
            'checkShowStoreName', 'checkShowAddress', 'checkShowGSTIN', 'checkShowFSSAI', 'checkShowTagline',
            'checkShowPoweredBy', 'checkShowQR', 'checkShowWifiInfo', 'checkShowSocial', 'checkShowFeedbackQR'
        ].forEach(id => {
            const el = document.getElementById(id);
            if (el) dispData[id] = el.checked;
        });

        // Collect fee slabs from table
        const slabs = [];
        document.querySelectorAll('#deliverySlabsTable tbody tr').forEach(row => {
            const inputs = row.querySelectorAll('input');
            if (inputs.length >= 2) {
                slabs.push({
                    km: parseFloat(inputs[0].value) || 0,
                    fee: parseFloat(inputs[1].value) || 0
                });
            }
        });
        if (slabs.length > 0) delData.slabs = slabs;

        // Populate update object
        updates[SETTINGS_PATHS.STORE] = storeData;
        updates[SETTINGS_PATHS.DELIVERY] = delData;
        updates[SETTINGS_PATHS.BOT] = botData;
        updates[SETTINGS_PATHS.DISPLAY] = dispData;
        updates[SETTINGS_PATHS.REVENUE] = revData;

        // 3. Execute Atomic Action
        await atomicAdminAction(updates, 'STORE_SETTINGS_UPDATE', {
            storeName: storeData.storeName,
            entityName: storeData.entityName
        });

        showToast("All settings saved successfully! 🚀", "success");
        state.settingsDirty = false;
        
        // Check if store name changed to sync dishes
        const oldStoreSnap = await Outlet.ref(SETTINGS_PATHS.STORE).once('value');
        const oldStore = oldStoreSnap.val() || {};
        if (oldStore.storeName !== storeData.storeName) {
            await syncOutletName(storeData.storeName);
        }

        document.getElementById('displayCoords').innerText = `${lat}, ${lng}`;
        if (window.updateOutletStatusIndicator) window.updateOutletStatusIndicator(storeData.shopStatus);

    } catch (e) {
        console.error("[Settings] Save Error:", e);
        showToast("Critical failure while saving settings", "error");
    } finally {
        if (ui.setLoading) ui.setLoading('btnSaveSettings', false);
    }
}

async function syncOutletName(newName) {
    console.log(`[Sync] Propagating new outlet name: ${newName}`);
    try {
        const dishesRef = Outlet.ref('dishes');
        const snap = await dishesRef.once('value');
        const dishes = snap.val();
        if (!dishes) return;

        const updates = {};
        Object.keys(dishes).forEach(id => {
            updates[`${id}/outletName`] = newName;
            updates[`${id}/outletId`] = Outlet.current;
            updates[`${id}/businessId`] = Outlet.businessId;
        });

        await dishesRef.update(updates);
        console.log(`[Sync] Successfully updated ${Object.keys(dishes).length} dishes.`);
    } catch (err) {
        console.error("[Sync] Failed to update dishes:", err);
        showToast("Dish sync partially failed", "warning");
    }
}



// --- IMAGE PREVIEWS ---

export async function previewSettingsImage(inputId, previewId, hiddenId) {
    const file = document.getElementById(inputId).files[0];
    if (!file) return;

    try {
        const compressedBase64 = await uploadImage(file, `settings/${inputId}`);
        const previewEl = document.getElementById(previewId);
        if (previewEl) previewEl.src = compressedBase64;
        if (hiddenId) {
            const hiddenEl = document.getElementById(hiddenId);
            if (hiddenEl) hiddenEl.value = compressedBase64;
        }
    } catch (err) {
        console.error("Settings Image Processing Failed:", err);
        showToast("Image processing failed", "error");
    }
}

// --- QUICK ACTIONS ---

export function quickUpdateOutletStatus() {
    const statusEl = document.getElementById('settingShopStatus');
    if (!statusEl) return;
    const newStatus = statusEl.value;

    Outlet.ref(SETTINGS_PATHS.STORE).update({ shopStatus: newStatus })
        .then(() => {
            logAudit("Settings", `Quick Status Update: ${newStatus}`, "Global");
            if (window.updateOutletStatusIndicator) window.updateOutletStatusIndicator(newStatus);
            showStatusAlert(newStatus);
        })
        .catch(e => {
            console.error("Failed to update outlet status:", e);
            showToast("Failed to update status", "error");
        });
}

function showStatusAlert(newStatus) {
    const alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) return;

    const div = document.createElement('div');
    div.className = 'alert-box info';
    
    const labelMap = { 
        'FORCE_OPEN': '✅ Outlet is now FORCE OPEN', 
        'FORCE_CLOSED': '🌙 Outlet is now FORCE CLOSED', 
        'AUTO': '⏰ Outlet set to AUTO' 
    };
    
    div.innerHTML = `
        <div class="alert-title">
            <i data-lucide="zap" style="width:18px;"></i>
            <span>${labelMap[newStatus] || 'Status Updated'}</span>
        </div>
        <div class="alert-sub">The WhatsApp bot and ordering system will respect this status immediately.</div>
    `;
    alertContainer.appendChild(div);
    if (window.lucide) window.lucide.createIcons({ root: div });
    
    setTimeout(() => {
        div.style.animation = 'slideOutPremium 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards';
        setTimeout(() => div.remove(), 500);
    }, 4000);
}

// --- INITIALIZATION ---
// Bind image uploads for Settings
document.addEventListener('change', (e) => {
    if (e.target.id === 'settingQRFile') previewSettingsImage('settingQRFile', 'qrPreview', 'settingQRUrl');
    if (e.target.id === 'settingGreetingFile') previewSettingsImage('settingGreetingFile', 'greetingImgPreview', 'settingGreetingUrl');
    if (e.target.id === 'settingMenuFile') previewSettingsImage('settingMenuFile', 'menuImgPreview', 'settingMenuUrl');
    
    if (e.target.id.startsWith('botImg')) {
        const id = e.target.id;
        const previewId = id.replace('File', 'Preview');
        previewSettingsImage(id, previewId);
    }
});

document.addEventListener('click', (e) => {
    if (e.target.id === 'btnChangeQR') document.getElementById('settingQRFile').click();
    if (e.target.id === 'btnChangeGreetingImg') document.getElementById('settingGreetingFile').click();
    if (e.target.id === 'btnChangeMenuImg') document.getElementById('settingMenuFile').click();
    
    if (e.target.classList.contains('btn-upload-bot-img')) {
        const targetId = e.target.getAttribute('data-target');
        const input = document.getElementById(targetId);
        if (input) input.click();
    }
    if (e.target.getAttribute('data-action') === 'removeFeeSlab') {
        const row = e.target.closest('tr');
        if (row) {
            row.remove();
            state.settingsDirty = true;
        }
    }
});

// Mark settings as dirty on ANY input change within the settings container
document.addEventListener('input', (e) => {
    const settingsTab = document.getElementById('tab-settings');
    if (settingsTab && settingsTab.contains(e.target)) {
        if (!state.settingsDirty) {
            console.log("[Settings] State is now DIRTY");
            state.settingsDirty = true;
        }

        // Smart Logic for Specific Fields (Smooth Functioning Phase)
        const id = e.target.id;
        
        // Auto-Capitalize Store Name & Tagline
        if (id === 'settingStoreName' || id === 'settingTagline') {
            e.target.value = e.target.value.toUpperCase();
        }

        // Auto-Format GSTIN (Uppercase)
        if (id === 'settingGSTIN') {
            e.target.value = e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 15);
        }

        // Auto-Format FSSAI (Numeric only)
        if (id === 'settingFSSAI') {
            e.target.value = e.target.value.replace(/\D/g, '').slice(0, 14);
        }
        
        // Update Smooth Functioning Features
        updateReceiptPreview();
        calculateSettingsHealth();
    }
});

document.addEventListener('change', (e) => {
    const settingsTab = document.getElementById('tab-settings');
    if (settingsTab && settingsTab.contains(e.target)) {
        // Toggle switches also update the preview
        updateReceiptPreview();
        calculateSettingsHealth();
    }
});
