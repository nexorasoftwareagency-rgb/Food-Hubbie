// --- Auth Gate (High Priority) ---
const MASTER_PASSCODE = "123456";

window.verifyPasscode = function() {
    const code = document.getElementById('passcode').value;
    const errorEl = document.getElementById('loginError');
    
    if (code === MASTER_PASSCODE) {
        localStorage.setItem('fh_sa_session', Date.now());
        document.getElementById('loginOverlay').classList.add('hidden');
        document.getElementById('mainContainer').classList.remove('hidden');
        initStats();
    } else {
        errorEl.classList.remove('hidden');
        setTimeout(() => errorEl.classList.add('hidden'), 3000);
    }
};

function checkAuth() {
    const session = localStorage.getItem('fh_sa_session');
    if (session && (Date.now() - session < 3600000)) { // 1 hour session
        document.getElementById('loginOverlay').classList.add('hidden');
        document.getElementById('mainContainer').classList.remove('hidden');
        initStats();
    } else {
        document.getElementById('loginOverlay').classList.remove('hidden');
        document.getElementById('mainContainer').classList.add('hidden');
    }
}

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

// Secondary Firebase instance for account management (avoids disrupting admin session)
const secondaryApp = firebase.initializeApp(firebaseConfig, "SecondaryAuth");
const secondaryAuth = secondaryApp.auth();

let auth, storage;
try {
    auth = firebase.auth();
    storage = firebase.storage();
} catch (e) {
    console.error("Firebase Service Init Error:", e);
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
    'riders': 'Fleet logistics & operational partners',
    'delivery': 'Infrastructure flow configuration',
    'settings': 'System kernel parameters'
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
    });
});

window.showOnboarding = function() {
    document.querySelector('[data-tab="onboarding"]').click();
}

// --- Dashboard Stats ---
function initStats() {
    console.log("Initializing Pro Telemetry...");
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

// Initialize
checkAuth();
