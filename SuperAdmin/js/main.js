// Initialize Firebase (Using the production food-hubbie config)
const firebaseConfig = {
    apiKey: "AIzaSyD60fL5Q-St64KyMavdfA9to4ZyCdR-qG8",
    authDomain: "food-hubbie.firebaseapp.com",
    projectId: "food-hubbie",
    databaseURL: "https://food-hubbie-default-rtdb.firebaseio.com",
    storageBucket: "food-hubbie.firebasestorage.app",
    messagingSenderId: "952017160550",
    appId: "1:952017160550:web:80bbb75933f431ab54e0a7",
    measurementId: "G-SQK852HT4W"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const auth = firebase.auth();
const storage = firebase.storage();

// Secondary Firebase instance for account management (avoids disrupting admin session)
const secondaryApp = firebase.initializeApp(firebaseConfig, "SecondaryAuth");
const secondaryAuth = secondaryApp.auth();

// --- Auth Gate (High Priority) ---
const MASTER_PASSCODE = "123456";

window.verifyPasscode = async function() {
    const code = document.getElementById('passcode').value;
    const errorEl = document.getElementById('loginError');
    const btn = document.querySelector('#loginOverlay .btn-pro');
    
    if (code === MASTER_PASSCODE) {
        btn.innerText = "Authenticating...";
        btn.disabled = true;
        
        try {
            // Background login to satisfy Security Rules
            await auth.signInWithEmailAndPassword('system.admin@foodhubbie.com', 'password123');
            
            localStorage.setItem('fh_sa_session', Date.now());
            document.getElementById('loginOverlay').classList.add('hidden');
            document.getElementById('mainContainer').classList.remove('hidden');
            initStats();
            
            // Dispatch event for other listeners
            window.dispatchEvent(new Event('sa_authenticated'));
        } catch (err) {
            console.error("Firebase Master Auth Failed:", err);
            errorEl.innerText = "Infrastructure Link Failed: " + err.message;
            errorEl.classList.remove('hidden');
            btn.innerText = "Initialize Session";
            btn.disabled = false;
        }
    } else {
        errorEl.innerText = "Access Denied: Invalid Master Key";
        errorEl.classList.remove('hidden');
        setTimeout(() => errorEl.classList.add('hidden'), 3000);
    }
};

function checkAuth() {
    const session = localStorage.getItem('fh_sa_session');
    if (session && (Date.now() - session < 3600000)) { // 1 hour session
        // Check if already signed in to Firebase
        auth.onAuthStateChanged(user => {
            if (user && user.email === 'system.admin@foodhubbie.com') {
                document.getElementById('loginOverlay').classList.add('hidden');
                document.getElementById('mainContainer').classList.remove('hidden');
                initStats();
            } else {
                // Re-authenticate if session exists but firebase lost
                auth.signInWithEmailAndPassword('system.admin@foodhubbie.com', 'password123')
                    .then(() => {
                        document.getElementById('loginOverlay').classList.add('hidden');
                        document.getElementById('mainContainer').classList.remove('hidden');
                        initStats();
                    });
            }
        });
    } else {
        document.getElementById('loginOverlay').classList.remove('hidden');
        document.getElementById('mainContainer').classList.add('hidden');
    }
}

async function logAdminAction(action, details = {}) {
    const user = auth.currentUser;
    const logEntry = {
        action: action,
        details: details,
        admin: user ? user.email : 'System',
        timestamp: firebase.database.ServerValue.TIMESTAMP
    };
    try {
        await db.ref('system/auditLogs').push(logEntry);
    } catch (err) {
        console.warn("Audit Log Failed:", err);
    }
}

// --- UI Navigation ---
const tabs = document.querySelectorAll('.nav-item');
const panes = document.querySelectorAll('.tab-pane');
const surface = document.getElementById('mainSurface');
const tabSubtitle = document.getElementById('tabSubtitle');

const tabMap = {
    'dashboard': 'Real-time platform telemetry',
    'onboarding': 'Provision new network node',
    'businesses': 'Enterprise ecosystem partners',
    'promotions': 'Platform-wide economic controls',
    'users': 'Global customer registry & credit ledger',
    'riders': 'Fleet logistics & operational partners',
    'reports': 'Enterprise growth & financial audit'
};

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const target = tab.getAttribute('data-tab');
        
        // Update Tabs
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // Update Panes
        panes.forEach(p => p.classList.remove('active'));
        const activePane = document.getElementById(target);
        if (activePane) activePane.classList.add('active');

        // Update Header & Theme
        document.getElementById('tabTitle').innerText = tab.querySelector('span').innerText;
        if (tabSubtitle) tabSubtitle.innerText = tabMap[target] || '';
        if (surface) surface.setAttribute('data-theme', target);
        
        // Refresh Icons & Load Data
        if (typeof lucide !== 'undefined') lucide.createIcons();
        if (target === 'delivery') loadGlobalDelivery();
        if (target === 'riders') loadRiders();
        if (target === 'promotions') loadPromotions();
        if (target === 'users') loadUsers();
        if (target === 'reports') loadReports();
    });
});

window.showOnboarding = function() {
    document.querySelector('[data-tab="onboarding"]').click();
}

// --- Dashboard Stats ---
function initStats() {
    console.log("Initializing Pro Telemetry...");
    
    // Load secondary data modules
    loadPromotions();
    loadReports();

    db.ref('businesses').on('value', (snap) => {
        const businesses = snap.val() || {};
        console.log("Snapshot Received:", businesses);
        
        document.getElementById('countBusinesses').innerText = Object.keys(businesses).length;
        document.getElementById('lastSyncTime').innerText = new Date().toLocaleTimeString();
        
        let totalOutlets = 0;
        const bizList = [];
        
        Object.entries(businesses).forEach(([id, biz]) => {
            const outlets = biz.outlets || {};
            const outletCount = Object.keys(outlets).length;
            totalOutlets += outletCount;
            
            bizList.push({
                id,
                name: biz.name || id,
                owner: biz.owner || 'N/A',
                outlets: outletCount,
                status: biz.status || 'Active'
            });
        });

        document.getElementById('countOutlets').innerText = totalOutlets;
        renderBusinessList(bizList);
    });
}

function renderBusinessList(list) {
    const tbody = document.getElementById('businessList');
    if (!tbody) return;
    
    if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 48px; color: #64748B;">No telemetry data available for the current ecosystem.</td></tr>';
        return;
    }

    tbody.innerHTML = list.map(b => `
        <tr>
            <td>
                <div style="font-weight: 700; color: #0F172A;">${b.name}</div>
                <div style="font-size: 11px; color: #64748B; font-family: monospace;">UUID: ${b.id}</div>
            </td>
            <td>
                <div style="font-weight: 600;">${b.owner}</div>
                <div style="font-size: 11px; color: #64748B;">Platform Authority</div>
            </td>
            <td>
                <div style="font-weight: 700; color: #38BDF8;">${b.outlets} Nodes</div>
            </td>
            <td>
                <span class="pro-badge badge-success">
                    <i data-lucide="check-circle" size="10"></i> ${b.status}
                </span>
            </td>
            <td>
                <div style="display: flex; gap: 8px;">
                    <button class="btn-pro-icon" title="Edit Primary Node" onclick="showOutletModal('${b.id}', 'outlet_pizza')"><i data-lucide="settings" size="16"></i></button>
                    <button class="btn-pro-icon" title="View Analytics"><i data-lucide="bar-chart-2" size="16"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
    lucide.createIcons();
}

// --- Onboarding Flow ---
const onboardingForm = document.getElementById('onboardingForm');
if (onboardingForm) {
    onboardingForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const bizName = document.getElementById('bizName').value;
        const bizId = document.getElementById('bizId').value;
        const outletName = document.getElementById('outletName').value;
        const outletId = document.getElementById('outletId').value;
        const outletSlug = document.getElementById('outletSlug').value;
        const outletAddress = document.getElementById('outletAddress').value;
        const outletLat = document.getElementById('outletLat').value;
        const outletLng = document.getElementById('outletLng').value;
        const adminEmail = document.getElementById('adminEmail').value;
        const adminPhone = document.getElementById('adminPhone').value;
        const adminPass = document.getElementById('adminPass').value;

        const submitBtn = onboardingForm.querySelector('.btn-submit') || onboardingForm.querySelector('button[type="submit"]');
        submitBtn.innerText = "Provisioning...";
        submitBtn.disabled = true;

        try {
            const slug = document.getElementById('outletSlug')?.value || outletId;

            // 1. Create Business Record
            await db.ref(`businesses/${bizId}`).set({
                name: bizName,
                createdAt: new Date().toISOString(),
                status: 'Active'
            });

            // 2. Create Initial Outlet
            await db.ref(`businesses/${bizId}/outlets/${outletId}`).set({
                name: outletName,
                status: 'Active',
                meta: {
                    name: outletName,
                    slug: outletSlug,
                    address: outletAddress,
                    lat: outletLat,
                    lng: outletLng,
                    adminPhone: adminPhone,
                    createdAt: new Date().toISOString()
                },
                settings: {
                    Store: {
                        storeName: outletName,
                        entityName: bizName,
                        address: outletAddress,
                        lat: outletLat,
                        lng: outletLng,
                        createdAt: new Date().toISOString()
                    },
                    shopOpen: true
                }
            });

            // 3. Create Admin Account in Secondary Auth
            const userCredential = await secondaryAuth.createUserWithEmailAndPassword(adminEmail, adminPass);
            const uid = userCredential.user.uid;

            // 4. Register Admin Node
            await db.ref(`admins/${uid}`).set({
                name: `${bizName} Admin`,
                email: adminEmail,
                phone: adminPhone,
                businessId: bizId,
                outletId: outletId,
                role: 'Admin',
                isSuper: false,
                createdAt: new Date().toISOString()
            });

            // 5. Register Slug for Marketplace Lookup
            await db.ref(`slugs/outlets/${outletSlug}`).set({
                businessId: bizId,
                outletId: outletId
            });

            alert(`✅ Success! Ecosystem initialized for ${bizName}.\nOutlet ${outletId} and Admin account ${adminEmail} are ready.`);
            onboardingForm.reset();
            secondaryAuth.signOut(); // Clean up secondary session
            document.querySelector('[data-tab="dashboard"]').click();
            
        } catch (err) {
            console.error(err);
            alert("❌ Error: " + err.message);
        } finally {
            submitBtn.innerText = "Initialize Ecosystem 🚀";
            submitBtn.disabled = false;
        }
    });
}

// --- Delivery Flow Management ---
let globalDeliverySlabs = [];

async function loadGlobalDelivery() {
    const snap = await db.ref('system/settings/delivery/slabs').get();
    globalDeliverySlabs = snap.val() || [
        { upToKm: 2, fee: 20 },
        { upToKm: 5, fee: 40 },
        { upToKm: 10, fee: 60 }
    ];
    renderDeliverySlabs();
}

function renderDeliverySlabs() {
    const list = document.getElementById('deliverySlabsList');
    if (!list) return;
    
    list.innerHTML = globalDeliverySlabs.map((s, idx) => `
        <tr>
            <td>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <input type="number" class="auth-input" style="width: 80px; padding: 8px; margin-bottom: 0; letter-spacing: normal;" value="${s.upToKm}" onchange="updateSlab(${idx}, 'upToKm', this.value)"> 
                    <span style="font-weight: 700; color: #696969; font-size: 11px;">KM</span>
                </div>
            </td>
            <td>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-weight: 700; color: var(--accent);">₹</span>
                    <input type="number" class="auth-input" style="width: 80px; padding: 8px; margin-bottom: 0; letter-spacing: normal;" value="${s.fee}" onchange="updateSlab(${idx}, 'fee', this.value)">
                </div>
            </td>
            <td>
                <button class="btn-icon text-danger" onclick="removeSlab(${idx})"><i data-lucide="trash-2"></i></button>
            </td>
        </tr>
    `).join('');
    lucide.createIcons();
}

window.addDeliverySlab = function() {
    globalDeliverySlabs.push({ upToKm: 0, fee: 0 });
    renderDeliverySlabs();
};

window.updateSlab = function(idx, key, val) {
    globalDeliverySlabs[idx][key] = parseFloat(val);
};

window.removeSlab = function(idx) {
    globalDeliverySlabs.splice(idx, 1);
    renderDeliverySlabs();
};

window.saveGlobalDelivery = async function() {
    try {
        await db.ref('system/settings/delivery/slabs').set(globalDeliverySlabs);
        alert("✅ Global Delivery Flow updated successfully!");
    } catch (err) {
        alert("❌ Error saving flow: " + err.message);
    }
};

// --- Outlet Management ---
let editingBizId = null;
let editingOutletId = null;

window.showOutletModal = async function(bid, oid) {
    editingBizId = bid;
    editingOutletId = oid;
    
    try {
        const snap = await db.ref(`businesses/${bid}/outlets/${oid}`).get();
        const o = snap.val();
        if (!o) return alert("Node not found!");

        document.getElementById('editOutletName').value = o.name || '';
        document.getElementById('editOutletSlug').value = o.meta?.slug || '';
        document.getElementById('editOutletAddress').value = o.meta?.address || o.settings?.Store?.address || '';
        document.getElementById('editOutletLat').value = o.meta?.lat || o.settings?.Store?.lat || '';
        document.getElementById('editOutletLng').value = o.meta?.lng || o.settings?.Store?.lng || '';
        document.getElementById('editAdminPhone').value = o.meta?.adminPhone || '';
        document.getElementById('editAdminPass').value = '';

        document.getElementById('outletModal').classList.remove('hidden');
        lucide.createIcons();
    } catch (err) {
        alert("Error loading node data: " + err.message);
    }
};

window.hideOutletModal = function() {
    document.getElementById('outletModal').classList.add('hidden');
    editingBizId = null;
    editingOutletId = null;
};

window.updateOutlet = async function() {
    if (!editingBizId || !editingOutletId) return;
    
    const name = document.getElementById('editOutletName').value;
    const slug = document.getElementById('editOutletSlug').value;
    const address = document.getElementById('editOutletAddress').value;
    const lat = document.getElementById('editOutletLat').value;
    const lng = document.getElementById('editOutletLng').value;
    const phone = document.getElementById('editAdminPhone').value;
    const newPass = document.getElementById('editAdminPass').value;

    try {
        // 1. Update Outlet Data
        await db.ref(`businesses/${editingBizId}/outlets/${editingOutletId}`).update({
            name: name,
            "meta/name": name,
            "meta/slug": slug,
            "meta/address": address,
            "meta/lat": lat,
            "meta/lng": lng,
            "meta/adminPhone": phone,
            "settings/Store/storeName": name,
            "settings/Store/address": address,
            "settings/Store/lat": lat,
            "settings/Store/lng": lng
        });

        // 2. Handle Password Update if provided
        if (newPass && newPass.length >= 6) {
            // Find Admin UID from database
            const adminsSnap = await db.ref('admins').orderByChild('outletId').equalTo(editingOutletId).get();
            const admins = adminsSnap.val();
            
            if (admins) {
                const [uid, adminData] = Object.entries(admins).find(([u, a]) => a.businessId === editingBizId) || [null, null];
                if (uid) {
                    // Update Password in Firebase Auth via Secondary Instance
                    // Note: In a real production environment, you'd use a Cloud Function or Admin SDK for this.
                    // Here we use the secondaryAuth hack to update if the SuperAdmin knows the current email.
                    alert("Note: Infrastructure updates completed. Password updates for individual nodes require Cloud Function execution in this environment.");
                }
            }
        }

        // 3. Sync Slug
        await db.ref(`slugs/outlets/${slug}`).set({
            businessId: editingBizId,
            outletId: editingOutletId
        });

        alert("✅ Node updates deployed to ecosystem.");
        hideOutletModal();
    } catch (err) {
        alert("❌ Update failed: " + err.message);
    }
};

// --- Rider Management ---
// --- Rider KYC Helpers ---
window.previewFile = function(input, boxId) {
    const box = document.getElementById(boxId);
    if (input.files && input.files[0]) {
        box.classList.add('has-file');
        const p = box.querySelector('p');
        const originalText = p.innerText;
        p.innerText = input.files[0].name;
        p.setAttribute('data-original', originalText);
    }
};

async function uploadRiderFile(uid, file, type) {
    if (!file) return null;
    const ref = storage.ref(`riders/${uid}/${type}_${Date.now()}`);
    const snapshot = await ref.put(file);
    return await snapshot.ref.getDownloadURL();
}

let allRiders = {};
let editingRiderId = null;

async function loadRiders() {
    db.ref('riders').on('value', (snap) => {
        allRiders = snap.val() || {};
        renderRiders();
    });
}

function renderRiders() {
    const tbody = document.getElementById('ridersListTable');
    if (!tbody) return;
    
    tbody.innerHTML = Object.entries(allRiders).map(([id, r]) => `
        <tr>
            <td>
                <div style="font-weight: 700; color: #1C1C1C;">${r.name || 'Unknown'}</div>
                <div style="font-size: 11px; color: #696969;">ID: ${id}</div>
            </td>
            <td>
                <div style="font-weight: 500;">${r.email || 'N/A'}</div>
                <div style="font-size: 11px; color: #696969;">${r.phone || 'N/A'}</div>
            </td>
            <td>
                <div style="display: flex; flex-direction: column; gap: 4px; align-items: flex-start;">
                    <span class="pro-badge ${r.kycStatus === 'Verified' ? 'badge-success' : (r.kycStatus === 'Rejected' ? 'badge-danger' : 'badge-warning')}">
                        ${r.kycStatus || 'Unverified'}
                    </span>
                    ${r.aadharUrl ? `<a href="${r.aadharUrl}" target="_blank" style="font-size: 10px; color: #38BDF8; font-weight: 600; text-decoration: none; display: flex; align-items: center; gap: 2px;"><i data-lucide="external-link" size="10"></i> View Docs</a>` : ''}
                </div>
            </td>
            <td>
                <div style="display: flex; gap: 8px;">
                    <button class="btn-icon" onclick="resetRiderPassword('${id}', '${r.email}')" title="Reset Password" style="color: #6366F1;"><i data-lucide="key"></i></button>
                    <button class="btn-icon" onclick="editRider('${id}')" title="Edit Profile"><i data-lucide="edit-3"></i></button>
                    <button class="btn-icon" style="color: #E23744;" onclick="deleteRider('${id}')" title="Revoke Access"><i data-lucide="trash-2"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
    lucide.createIcons();
}

window.showRiderModal = function() {
    editingRiderId = null;
    document.getElementById('riderModalTitle').innerText = "Logistics Partner Profile";
    document.getElementById('riderForm').reset();
    document.getElementById('riderEmail').disabled = false;
    document.getElementById('riderModal').classList.remove('hidden');
    lucide.createIcons();
};

window.hideRiderModal = function() {
    document.getElementById('riderModal').classList.add('hidden');
};

window.editRider = function(id) {
    const r = allRiders[id];
    if (!r) return;
    
    editingRiderId = id;
    document.getElementById('riderModalTitle').innerText = "Update Partner Profile";
    document.getElementById('riderName').value = r.name || '';
    document.getElementById('riderEmail').value = r.email || '';
    document.getElementById('riderEmail').disabled = true;
    document.getElementById('riderPhone').value = r.phone || '';
    document.getElementById('riderFatherName').value = r.fatherName || '';
    document.getElementById('riderAge').value = r.age || '';
    document.getElementById('riderQual').value = r.qualification || '10th';
    document.getElementById('riderAadhar').value = r.aadharNo || '';
    document.getElementById('riderQual').value = r.qualification || '10th';
    document.getElementById('riderAddress').value = r.address || '';
    document.getElementById('riderPass').value = '';
    
    // Reset KYC boxes
    ['boxProfile', 'boxAadhar'].forEach(id => {
        const box = document.getElementById(id);
        box.classList.remove('has-file');
        const p = box.querySelector('p');
        p.innerText = p.getAttribute('data-original') || p.innerText;
    });

    document.getElementById('riderModal').classList.remove('hidden');
    lucide.createIcons();
};

window.saveRider = async function() {
    const name = document.getElementById('riderName').value;
    const email = document.getElementById('riderEmail').value;
    const phone = document.getElementById('riderPhone').value;
    const fatherName = document.getElementById('riderFatherName').value;
    const age = document.getElementById('riderAge').value;
    const aadharNo = document.getElementById('riderAadhar').value;
    const qualification = document.getElementById('riderQual').value;
    const address = document.getElementById('riderAddress').value;
    const pass = document.getElementById('riderPass').value;

    const data = {
        name, email, phone, fatherName, age, aadharNo, qualification, address,
        updatedAt: firebase.database.ServerValue.TIMESTAMP
    };

    try {
        if (editingRiderId) {
            // Check if password update is requested
            if (pass && pass.length >= 6) {
                const oldPass = allRiders[editingRiderId].password;
                if (oldPass) {
                    try {
                        // Securely update Firebase Auth password
                        await secondaryAuth.signInWithEmailAndPassword(email, oldPass);
                        await secondaryAuth.currentUser.updatePassword(pass);
                        await secondaryAuth.signOut();
                        data.password = pass; // Update stored reference
                    } catch (authErr) {
                        console.warn("Auth password update failed (likely recently changed or session expired):", authErr);
                        alert("⚠️ Profile updated, but Auth Passcode could not be synchronized. Please use 'Reset Password' for security.");
                    }
                }
            }
            await db.ref(`riders/${editingRiderId}`).update(data);

            // Handle KYC Uploads post-update if files selected
            const profileFile = document.getElementById('fileProfile').files[0];
            const aadharFile = document.getElementById('fileAadhar').files[0];

            if (profileFile || aadharFile) {
                const updates = {};
                if (profileFile) updates.profileUrl = await uploadRiderFile(editingRiderId, profileFile, 'profile');
                if (aadharFile) updates.aadharUrl = await uploadRiderFile(editingRiderId, aadharFile, 'aadhar');
                updates.kycStatus = 'Pending';
                await db.ref(`riders/${editingRiderId}`).update(updates);
            }

            alert("✅ Logistics Partner profile synchronized!");
        } else {
            if (!pass || pass.length < 6) return alert("❌ Access Passcode (min 6 chars) is required for new partner node.");
            
            // 1. Create real Firebase Auth user for the Rider App
            const userCredential = await secondaryAuth.createUserWithEmailAndPassword(email, pass);
            const uid = userCredential.user.uid;
            
            // 2. Save detailed profile to database
            data.uid = uid;
            data.createdAt = firebase.database.ServerValue.TIMESTAMP;
            data.status = 'Offline';
            data.password = pass; // Store as reference for admin visibility
            
            await db.ref(`riders/${uid}`).set(data);
            
            // Handle KYC Uploads for new rider
            const profileFile = document.getElementById('fileProfile').files[0];
            const aadharFile = document.getElementById('fileAadhar').files[0];

            const kycUpdates = { kycStatus: 'Pending' };
            if (profileFile) kycUpdates.profileUrl = await uploadRiderFile(uid, profileFile, 'profile');
            if (aadharFile) kycUpdates.aadharUrl = await uploadRiderFile(uid, aadharFile, 'aadhar');
            
            await db.ref(`riders/${uid}`).update(kycUpdates);

            await secondaryAuth.signOut(); // Clean up session
            
            alert("✅ Enterprise Node Provisioned: Rider Account & Profile Active!");
        }
        hideRiderModal();
    } catch (err) {
        alert("❌ Integration Error: " + err.message);
    }
};

window.resetRiderPassword = async function(id, email) {
    if (!confirm(`Trigger secure password reset email for ${email}?`)) return;
    try {
        await auth.sendPasswordResetEmail(email);
        alert("✅ Security recovery email dispatched successfully.");
    } catch (err) {
        alert("❌ Failed to dispatch reset: " + err.message);
    }
};

window.deleteRider = async function(id) {
    if (!confirm("Are you sure you want to revoke access and delete this partner node? This cannot be undone.")) return;
    try {
        await db.ref(`riders/${id}`).remove();
        alert("✅ Partner node decommissioned.");
    } catch (err) {
        alert("❌ Error: " + err.message);
    }
};

// --- Promotions Management ---
let allCoupons = {};

async function loadPromotions() {
    // 1. Load Surge
    db.ref('system/promotions/surge').on('value', (snap) => {
        const surge = snap.val() || { multiplier: 1.0, isActive: false, reason: '' };
        document.getElementById('surgeMultiplier').value = surge.multiplier;
        document.getElementById('surgeReason').value = surge.reason;
        const statusEl = document.getElementById('surgeStatus');
        if (surge.isActive && surge.multiplier > 1) {
            statusEl.innerText = "Active";
            statusEl.className = "pro-badge badge-warning";
        } else {
            statusEl.innerText = "Inactive";
            statusEl.className = "pro-badge badge-info";
        }
    });

    // 2. Load Global Discount
    db.ref('system/promotions/globalDiscount').on('value', (snap) => {
        const discount = snap.val() || { type: 'percent', value: 0, isActive: false };
        document.getElementById('globalDiscountValue').value = discount.value;
        document.getElementById('globalDiscountType').value = discount.type;
        const statusEl = document.getElementById('discountStatus');
        if (discount.isActive && discount.value > 0) {
            statusEl.innerText = "Active";
            statusEl.className = "pro-badge badge-success";
        } else {
            statusEl.innerText = "Inactive";
            statusEl.className = "pro-badge badge-info";
        }
    });

    // 3. Load Coupons
    db.ref('system/promotions/coupons').on('value', (snap) => {
        allCoupons = snap.val() || {};
        renderCoupons();
    });
}

function renderCoupons() {
    const tbody = document.getElementById('couponsListTable');
    if (!tbody) return;

    if (Object.keys(allCoupons).length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 48px; color: #64748B;">No promo codes currently in registry.</td></tr>';
        return;
    }

    tbody.innerHTML = Object.entries(allCoupons).map(([id, c]) => `
        <tr>
            <td>
                <div style="font-weight: 800; color: #0F172A; letter-spacing: 1px;">${c.code}</div>
            </td>
            <td>
                <div style="font-weight: 700; color: #10B981;">
                    ${c.type === 'percent' ? `${c.value}% Off` : `₹${c.value} Flat Off`}
                </div>
            </td>
            <td>
                <div style="font-size: 11px; color: #64748B;">Min Order: ₹${c.minOrder || 0}</div>
            </td>
            <td>
                <span class="pro-badge ${c.active ? 'badge-success' : 'badge-warning'}">
                    ${c.active ? 'Active' : 'Paused'}
                </span>
            </td>
            <td>
                <div style="display: flex; gap: 8px;">
                    <button class="btn-pro-icon" title="Toggle Status" onclick="toggleCoupon('${id}')">
                        <i data-lucide="${c.active ? 'pause' : 'play'}" size="16"></i>
                    </button>
                    <button class="btn-pro-icon text-danger" title="Delete" onclick="deleteCoupon('${id}')">
                        <i data-lucide="trash-2" size="16"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    lucide.createIcons();
}

window.saveSurge = async function() {
    const multiplier = parseFloat(document.getElementById('surgeMultiplier').value);
    const reason = document.getElementById('surgeReason').value;
    const isActive = multiplier > 1;

    try {
        await db.ref('system/promotions/surge').set({ multiplier, reason, isActive });
        alert("✅ Surge configuration deployed.");
    } catch (err) {
        alert("❌ Error: " + err.message);
    }
};

window.saveGlobalDiscount = async function() {
    const value = parseFloat(document.getElementById('globalDiscountValue').value);
    const type = document.getElementById('globalDiscountType').value;
    const isActive = value > 0;

    try {
        await db.ref('system/promotions/globalDiscount').set({ value, type, isActive });
        alert("✅ Ecosystem discount synchronized.");
    } catch (err) {
        alert("❌ Error: " + err.message);
    }
};

window.showCouponModal = function() {
    document.getElementById('couponForm').reset();
    document.getElementById('couponModal').classList.remove('hidden');
    lucide.createIcons();
};

window.hideCouponModal = function() {
    document.getElementById('couponModal').classList.add('hidden');
};

window.saveCoupon = async function() {
    const code = document.getElementById('couponCode').value.toUpperCase();
    const type = document.getElementById('couponType').value;
    const value = parseFloat(document.getElementById('couponValue').value);
    const minOrder = parseFloat(document.getElementById('couponMinOrder').value);
    const active = document.getElementById('couponActive').checked;

    try {
        const newRef = db.ref('system/promotions/coupons').push();
        await newRef.set({ code, type, value, minOrder, active, createdAt: firebase.database.ServerValue.TIMESTAMP });
        alert(`✅ Promo Code ${code} is now live!`);
        hideCouponModal();
    } catch (err) {
        alert("❌ Failed to save coupon: " + err.message);
    }
};

window.toggleCoupon = async function(id) {
    const current = allCoupons[id];
    if (!current) return;
    try {
        await db.ref(`system/promotions/coupons/${id}/active`).set(!current.active);
    } catch (err) {
        alert("❌ Status sync failed.");
    }
};

window.deleteCoupon = async function(id) {
    if (!confirm("Are you sure you want to permanently delete this promo code?")) return;
    try {
        await db.ref(`system/promotions/coupons/${id}`).remove();
    } catch (err) {
        alert("❌ Deletion failed.");
    }
};

let revenueChartInstance = null;
let dailyRevenueSnapshot = {};
let businessStatsSnapshot = [];

async function loadReports() {
    console.log("Loading Ecosystem Intelligence...");
    const snap = await db.ref('businesses').get();
    const businesses = snap.val() || {};

    let globalRevenue = 0;
    let globalOrdersCount = 0;
    let globalLoyaltyDisbursed = 0;
    const businessStats = [];
    const outletStats = [];
    
    // For Charting
    const dailyRevenue = {};

    for (const bid in businesses) {
        const biz = businesses[bid];
        let bizRevenue = 0;
        let bizOrders = 0;

        if (biz.outlets) {
            for (const oid in biz.outlets) {
                const outlet = biz.outlets[oid];
                let outletRevenue = 0;
                let outletOrders = 0;

                if (outlet.orders) {
                    Object.values(outlet.orders).forEach(order => {
                        const total = parseFloat(order.total || 0);
                        outletRevenue += total;
                        outletOrders += 1;
                        globalLoyaltyDisbursed += parseFloat(order.cashbackBonus || 0);

                        // Chart Data Collection
                        const date = order.createdAt ? order.createdAt.split('T')[0] : 'Unknown';
                        dailyRevenue[date] = (dailyRevenue[date] || 0) + total;
                    });
                }

                bizRevenue += outletRevenue;
                bizOrders += outletOrders;

                outletStats.push({
                    name: outlet.name || oid,
                    revenue: outletRevenue,
                    orders: outletOrders,
                    rating: outlet.rating || 5.0
                });
            }
        }

        globalRevenue += bizRevenue;
        globalOrdersCount += bizOrders;

        businessStats.push({
            name: biz.name || bid,
            revenue: bizRevenue,
            orders: bizOrders
        });
    }

    dailyRevenueSnapshot = dailyRevenue;
    businessStatsSnapshot = businessStats;

    // Update Global Metrics
    document.getElementById('reportGlobalSales').innerText = `₹${globalRevenue.toLocaleString()}`;
    document.getElementById('reportGlobalOrders').innerText = globalOrdersCount.toLocaleString();
    const aov = globalOrdersCount > 0 ? (globalRevenue / globalOrdersCount).toFixed(2) : 0;
    document.getElementById('reportAvgOrderValue').innerText = `₹${aov}`;
    document.getElementById('reportGlobalLoyalty').innerText = `₹${globalLoyaltyDisbursed.toLocaleString()}`;

    // Render Charts
    renderRevenueChart(dailyRevenue);

    // Render Business Leaderboard
    const bizBody = document.getElementById('reportBusinessLeaderboard');
    if (bizBody) {
        businessStats.sort((a, b) => b.revenue - a.revenue);
        bizBody.innerHTML = businessStats.map(b => `
            <tr>
                <td><div style="font-weight: 700;">${b.name}</div></td>
                <td><div style="font-weight: 700; color: #10B981;">₹${b.revenue.toLocaleString()}</div></td>
                <td><div style="font-size: 11px; color: #64748B;">${b.orders} Orders</div></td>
            </tr>
        `).join('');
    }

    // Render Outlet Rankings
    const outletBody = document.getElementById('reportOutletLeaderboard');
    if (outletBody) {
        outletStats.sort((a, b) => b.revenue - a.revenue);
        outletBody.innerHTML = outletStats.slice(0, 10).map(o => `
            <tr>
                <td>
                    <div style="font-weight: 700;">${o.name}</div>
                    <div style="display: flex; align-items: center; gap: 4px; font-size: 10px; color: #FACC15;">
                        <i data-lucide="star" size="10" fill="currentColor"></i> ${o.rating}
                    </div>
                </td>
                <td><div style="font-weight: 700; color: #38BDF8;">₹${o.revenue.toLocaleString()}</div></td>
                <td><div style="font-size: 11px; color: #64748B;">${o.orders} Sales</div></td>
            </tr>
        `).join('');
    }

    loadAuditLogs();
    lucide.createIcons();
}

async function loadAuditLogs() {
    const tbody = document.getElementById('auditLogTable');
    if (!tbody) return;

    try {
        const snap = await db.ref('system/auditLogs').limitToLast(50).get();
        const logs = snap.val() || {};
        const logArray = Object.values(logs).reverse();

        if (logArray.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 24px; color: #64748B;">No recent administrative activity detected.</td></tr>';
            return;
        }

        tbody.innerHTML = logArray.map(l => `
            <tr>
                <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span class="pro-badge ${l.action.includes('DELETE') ? 'badge-danger' : 'badge-info'}" style="font-size: 10px;">
                            ${l.action}
                        </span>
                    </div>
                </td>
                <td>
                    <div style="font-weight: 600;">${l.admin}</div>
                    <div style="font-size: 10px; color: #64748B;">Network Administrator</div>
                </td>
                <td>
                    <div style="font-size: 11px; max-width: 300px; white-space: pre-wrap; color: #475569;">${JSON.stringify(l.details, null, 2)}</div>
                </td>
                <td>
                    <div style="font-size: 11px; color: #64748B;">${new Date(l.timestamp).toLocaleString()}</div>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        console.error("Audit Fetch Error:", err);
    }
}

window.exportReport = function(type) {
    if (type === 'pdf') {
        window.print();
        logAdminAction('EXPORT_REPORT_PDF', { timestamp: Date.now() });
        return;
    }

    // CSV Export
    const headers = ["Date", "Total Revenue (₹)", "Orders"];
    const dailyData = Object.entries(dailyRevenueSnapshot || {}).sort().map(([date, data]) => [
        date,
        data.revenue,
        data.count
    ]);

    let csvContent = "data:text/csv;charset=utf-8," 
        + "FoodHubbie Ecosystem Analytics - Daily Revenue Summary\n"
        + headers.join(",") + "\n"
        + dailyData.map(e => e.join(",")).join("\n")
        + "\n\nBusiness Rankings\nEntity,Revenue,Orders\n"
        + businessStatsSnapshot.map(b => `${b.name},${b.revenue},${b.orders}`).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ecosystem_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    logAdminAction('EXPORT_REPORT_CSV', { dataPoints: dailyData.length });
    showToast("Analytics Data Exported", "success");
};

function renderRevenueChart(data) {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;

    const labels = Object.keys(data).sort();
    const values = labels.map(l => data[l]);

    if (revenueChartInstance) {
        revenueChartInstance.destroy();
    }

    revenueChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Gross Ecosystem Revenue (₹)',
                data: values,
                borderColor: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#10B981',
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: '#F1F5F9' },
                    ticks: { color: '#64748B', font: { weight: '600' } }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#64748B', font: { weight: '600' } }
                }
            }
        }
    });
}

// --- Promotions & Economy Controls ---
window.saveSurge = async function() {
    const multiplier = parseFloat(document.getElementById('surgeMultiplier').value) || 1.0;
    const reason = document.getElementById('surgeReason').value;
    const isActive = multiplier > 1.0;

    try {
        await db.ref('system/promotions/surge').set({
            multiplier,
            reason,
            isActive,
            updatedAt: Date.now(),
            updatedBy: auth.currentUser.email
        });
        await logAdminAction('UPDATE_SURGE', { multiplier, reason, isActive });
        showToast("Surge Pricing Deployed", "success");
        loadPromotions();
    } catch (err) {
        showToast("Surge Update Failed: " + err.message, "error");
    }
};

window.saveGlobalDiscount = async function() {
    const value = parseFloat(document.getElementById('globalDiscountValue').value) || 0;
    const type = document.getElementById('globalDiscountType').value;
    const isActive = value > 0;

    try {
        await db.ref('system/promotions/globalDiscount').set({
            value,
            type,
            isActive,
            updatedAt: Date.now(),
            updatedBy: auth.currentUser.email
        });
        await logAdminAction('UPDATE_GLOBAL_DISCOUNT', { value, type, isActive });
        showToast("Global Discount Updated", "success");
        loadPromotions();
    } catch (err) {
        showToast("Discount Update Failed: " + err.message, "error");
    }
};

window.savePlatformFee = async function() {
    const amount = parseFloat(document.getElementById('platformFee').value) || 0;
    
    try {
        await db.ref('system/config/platformFee').set({
            amount,
            updatedAt: Date.now(),
            updatedBy: auth.currentUser.email
        });
        await logAdminAction('UPDATE_PLATFORM_FEE', { amount });
        showToast("Platform Fee Updated", "success");
        loadPromotions();
    } catch (err) {
        showToast("Fee Update Failed: " + err.message, "error");
    }
};

window.showCouponModal = () => document.getElementById('couponModal').classList.remove('hidden');
window.hideCouponModal = () => document.getElementById('couponModal').classList.add('hidden');

window.saveCoupon = async function() {
    const code = document.getElementById('couponCode').value.toUpperCase();
    const type = document.getElementById('couponType').value;
    const value = parseFloat(document.getElementById('couponValue').value);
    const minOrder = parseFloat(document.getElementById('couponMinOrder').value) || 0;
    const usageLimit = parseInt(document.getElementById('couponLimit').value) || 100;
    const isActive = document.getElementById('couponActive').checked;

    if (!code) return showToast("Enter Promo Code", "error");

    try {
        const couponData = {
            code,
            type,
            value,
            minOrder,
            usageLimit,
            usedCount: 0,
            isActive,
            createdAt: Date.now(),
            createdBy: auth.currentUser.email
        };
        await db.ref('system/promotions/coupons/' + code).set(couponData);
        await logAdminAction('CREATE_COUPON', couponData);
        showToast(`Coupon ${code} Deployed`, "success");
        hideCouponModal();
        loadPromotions();
    } catch (err) {
        showToast("Coupon Creation Failed: " + err.message, "error");
    }
};

async function loadPromotions() {
    // Load Surge
    const surgeSnap = await db.ref('system/promotions/surge').once('value');
    const surge = surgeSnap.val() || { multiplier: 1, reason: '', isActive: false };
    document.getElementById('surgeMultiplier').value = surge.multiplier;
    document.getElementById('surgeReason').value = surge.reason;
    const surgeBadge = document.getElementById('surgeStatus');
    surgeBadge.innerText = surge.isActive ? 'Active' : 'Inactive';
    surgeBadge.className = `pro-badge ${surge.isActive ? 'badge-success' : 'badge-warning'}`;

    // Load Global Discount
    const discSnap = await db.ref('system/promotions/globalDiscount').once('value');
    const disc = discSnap.val() || { value: 0, type: 'percent', isActive: false };
    document.getElementById('globalDiscountValue').value = disc.value;
    document.getElementById('globalDiscountType').value = disc.type;
    const discBadge = document.getElementById('discountStatus');
    discBadge.innerText = disc.isActive ? 'Active' : 'Inactive';
    discBadge.className = `pro-badge ${disc.isActive ? 'badge-success' : 'badge-warning'}`;

    // Load Platform Fee
    const feeSnap = await db.ref('system/config/platformFee').once('value');
    const fee = feeSnap.val() || { amount: 5 };
    document.getElementById('platformFee').value = fee.amount;
    const feeBadge = document.getElementById('feeStatus');
    feeBadge.innerText = fee.amount > 0 ? 'Active' : 'Disabled';
    feeBadge.className = `pro-badge ${fee.amount > 0 ? 'badge-success' : 'badge-warning'}`;

    // Load Coupons
    const couponsSnap = await db.ref('system/promotions/coupons').once('value');
    const coupons = couponsSnap.val() || {};
    const tableBody = document.getElementById('couponsListTable');
    
    tableBody.innerHTML = Object.values(coupons).map(c => `
        <tr>
            <td>
                <div style="font-family: 'JetBrains Mono', monospace; font-weight: 800; color: #1E293B;">${c.code}</div>
            </td>
            <td>
                <div style="font-weight: 600;">${c.type === 'percent' ? c.value + '%' : '₹' + c.value} OFF</div>
                <div style="font-size: 0.75rem; color: #64748B;">Applied on order total</div>
            </td>
            <td>
                <div style="font-size: 0.85rem; font-weight: 600;">Min Order: ₹${c.minOrder || 0}</div>
                <div style="font-size: 0.75rem; color: #64748B; margin-top: 4px;">Redemptions: ${c.usedCount || 0} / ${c.usageLimit || '∞'}</div>
            </td>
            <td>
                <div class="pro-badge ${c.isActive ? 'badge-success' : 'badge-warning'}">
                    ${c.isActive ? 'Deployable' : 'Suspended'}
                </div>
            </td>
            <td>
                <div class="table-actions">
                    <button class="btn-pro-icon" onclick="toggleCoupon('${c.code}', ${c.isActive})" title="Toggle Status">
                        <i data-lucide="${c.isActive ? 'pause' : 'play'}" size="14"></i>
                    </button>
                    <button class="btn-pro-icon" onclick="deleteCoupon('${c.code}')" style="color: #EF4444;" title="Delete">
                        <i data-lucide="trash-2" size="14"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    
    lucide.createIcons();
}

window.toggleCoupon = async (code, current) => {
    await db.ref(`system/promotions/coupons/${code}/isActive`).set(!current);
    await logAdminAction('TOGGLE_COUPON', { code, isActive: !current });
    showToast("Coupon Status Updated", "success");
    loadPromotions();
};

window.deleteCoupon = async (code) => {
    if (confirm(`Decommission coupon ${code}?`)) {
        await db.ref(`system/promotions/coupons/${code}`).remove();
        await logAdminAction('DELETE_COUPON', { code });
        showToast("Coupon Removed", "info");
        loadPromotions();
    }
};

// Initialize
checkAuth();

window.exportCoupons = function() {
    if (Object.keys(allCoupons).length === 0) return showToast("Registry is empty", "error");

    const headers = ["Promo Code", "Type", "Value", "Min Order", "Status", "Created At", "Created By"];
    const rows = Object.values(allCoupons).map(c => [
        c.code,
        c.type,
        c.value,
        c.minOrder || 0,
        c.isActive ? "Active" : "Paused",
        new Date(c.createdAt).toLocaleString(),
        c.createdBy || "System"
    ]);

    let csvContent = "data:text/csv;charset=utf-8," 
        + headers.join(",") + "\n"
        + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `foodhubbie_coupons_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    logAdminAction('EXPORT_COUPONS', { count: rows.length });
    showToast("Registry Exported Successfully", "success");
};

window.bulkOperation = async function(op) {
    if (Object.keys(allCoupons).length === 0) return showToast("No targets for operation", "error");
    
    if (!confirm(`Are you sure you want to execute bulk ${op} on all registry nodes?`)) return;

    try {
        const updates = {};
        if (op === 'pause') {
            Object.keys(allCoupons).forEach(code => {
                updates[`system/promotions/coupons/${code}/isActive`] = false;
            });
        }
        
        await db.ref().update(updates);
        await logAdminAction('BULK_OPERATION', { operation: op, affectedNodes: Object.keys(allCoupons).length });
        showToast(`Bulk ${op} deployed to ecosystem`, "success");
        loadPromotions();
    } catch (err) {
        showToast("Bulk Operation Failed: " + err.message, "error");
    }
};

// --- Toast System ---
function showToast(msg, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `pro-toast ${type}`;
    toast.innerHTML = `
        <i data-lucide="${type === 'success' ? 'check-circle' : type === 'error' ? 'alert-circle' : 'info'}" size="18"></i>
        <span>${msg}</span>
    `;
    document.body.appendChild(toast);
    lucide.createIcons();
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
// --- User Registry & Wallet Management ---
let allUsers = {};
let filteredUsersList = [];

async function loadUsers() {
    console.log("Loading User Registry...");
    try {
        const snap = await db.ref('users').once('value');
        allUsers = snap.val() || {};
        filterUsers(); // Initial render
    } catch (err) {
        showToast("Failed to sync users: " + err.message, "error");
    }
}

window.filterUsers = function() {
    const query = document.getElementById('userSearch')?.value.toLowerCase() || "";
    
    filteredUsersList = Object.entries(allUsers).map(([id, u]) => ({
        id,
        ...u
    })).filter(u => {
        const name = (u.name || "").toLowerCase();
        const email = (u.email || "").toLowerCase();
        const phone = (u.phone || "").toLowerCase();
        return name.includes(query) || email.includes(query) || phone.includes(query);
    });

    renderUsers();
};

function renderUsers() {
    const tbody = document.getElementById('usersListTable');
    if (!tbody) return;

    if (filteredUsersList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 48px; color: #64748B;">No user nodes matching the current filters.</td></tr>';
        return;
    }

    tbody.innerHTML = filteredUsersList.map(u => `
        <tr>
            <td>
                <div style="font-weight: 700; color: #0F172A;">${u.name || 'Anonymous'}</div>
                <div style="font-size: 11px; color: #64748B; font-family: monospace;">UID: ${u.id}</div>
            </td>
            <td>
                <div style="font-weight: 600;">${u.email || 'No Email'}</div>
                <div style="font-size: 11px; color: #64748B;">${u.phone || 'No Phone'}</div>
            </td>
            <td>
                <div style="font-weight: 800; color: #10B981; font-size: 1rem;">₹${(u.walletBalance || 0).toFixed(2)}</div>
                <div style="font-size: 10px; color: #64748B; text-transform: uppercase;">Current Credits</div>
            </td>
            <td>
                <div style="font-size: 0.85rem;">${u.lastActive ? new Date(u.lastActive).toLocaleDateString() : 'Inactive'}</div>
                <div style="font-size: 10px; color: #64748B;">Last Lifecycle Signal</div>
            </td>
            <td>
                <div style="display: flex; gap: 8px;">
                    <button class="btn-pro-icon" style="background: rgba(16, 185, 129, 0.1); color: #10B981;" onclick="showWalletModal('${u.id}', '${u.name || 'Anonymous'}', '${u.email || ''}')" title="Credit Wallet">
                        <i data-lucide="plus-circle" size="18"></i>
                    </button>
                    <button class="btn-pro-icon" style="background: rgba(148, 163, 184, 0.1); color: #64748B;" onclick="viewUserHistory('${u.id}')" title="Transaction History">
                        <i data-lucide="history" size="18"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join("");

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

window.showWalletModal = function(uid, name, email) {
    document.getElementById('walletUserId').value = uid;
    document.getElementById('walletTargetName').innerText = name;
    document.getElementById('walletTargetEmail').innerText = email;
    document.getElementById('walletAmount').value = "";
    document.getElementById('walletReason').value = "";
    document.getElementById('walletModal').classList.remove('hidden');
};

window.hideWalletModal = function() {
    document.getElementById('walletModal').classList.add('hidden');
};

window.processWalletCredit = async function() {
    const uid = document.getElementById('walletUserId').value;
    const amount = parseFloat(document.getElementById('walletAmount').value);
    const reason = document.getElementById('walletReason').value;

    if (isNaN(amount) || amount <= 0) return showToast("Invalid credit amount", "error");
    if (!reason) return showToast("Transaction reason required", "error");

    try {
        const walletRef = db.ref(`users/${uid}/walletBalance`);
        const historyRef = db.ref(`users/${uid}/walletHistory`);

        // Atomic Credit
        await walletRef.transaction((current) => (current || 0) + amount);

        // Record History
        const txId = 'TX' + Date.now();
        await historyRef.child(txId).set({
            amount: amount,
            type: 'credit',
            reason: reason + " (Admin Issued)",
            timestamp: new Date().toISOString()
        });

        await logAdminAction('WALLET_CREDIT', { userId: uid, amount, reason });
        
        showToast(`Successfully credited ₹${amount} to user`, "success");
        hideWalletModal();
        loadUsers(); // Refresh list
    } catch (err) {
        showToast("Wallet operation failed: " + err.message, "error");
    }
};

window.exportUsers = function() {
    if (filteredUsersList.length === 0) return showToast("No users to export", "error");

    const headers = ["Name", "Email", "Phone", "Wallet Balance", "Last Active"];
    const rows = filteredUsersList.map(u => [
        u.name || "Anonymous",
        u.email || "N/A",
        u.phone || "N/A",
        u.walletBalance || 0,
        u.lastActive ? new Date(u.lastActive).toISOString() : "Never"
    ]);

    let csvContent = "data:text/csv;charset=utf-8," 
        + headers.join(",") + "\n"
        + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `foodhubbie_users_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    logAdminAction('EXPORT_USERS', { count: rows.length });
    showToast("Registry Exported Successfully", "success");
};

window.viewUserHistory = function(uid) {
    // Basic alert for now, could be a full modal
    const user = allUsers[uid];
    const history = user.walletHistory || {};
    const items = Object.values(history).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    if (items.length === 0) return showToast("No transaction history found for this user", "info");

    let msg = `Recent Transactions for ${user.name || 'User'}:\n\n`;
    items.slice(0, 5).forEach(item => {
        msg += `[${item.type.toUpperCase()}] ₹${item.amount} - ${item.reason} (${new Date(item.timestamp).toLocaleDateString()})\n`;
    });

    alert(msg);
};
