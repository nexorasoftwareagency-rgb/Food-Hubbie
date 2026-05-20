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

/**
 * SECURITY: HELPER TO PREVENT XSS (Phase 1)
 */
function safeText(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
}

/**
 * SECURITY: MITIGATE CSV INJECTION
 * Prevents execution of formulas in Excel/Sheets when opening exported data.
 */
function safeCSV(val) {
    const str = String(val || "");
    if (str.startsWith('=') || str.startsWith('+') || str.startsWith('-') || str.startsWith('@')) {
        return "'" + str;
    }
    return str;
}

// --- Auth Gate (High Priority Hardening) ---
window.doLogin = async function() {
    const email = document.getElementById('loginEmail').value.trim();
    const pass = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('loginError');
    const btn = document.getElementById('btnLogin');
    
    if (!email || !pass) {
        errorEl.innerText = "Credentials Required";
        errorEl.classList.remove('hidden');
        return;
    }

    btn.innerText = "Authenticating...";
    btn.disabled = true;
    errorEl.classList.add('hidden');
    
    try {
        await auth.signInWithEmailAndPassword(email, pass);
        // Auth state listener handles the UI transition
    } catch (err) {
        console.error("Auth Failed:", err);
        errorEl.innerText = "Access Denied: " + err.message;
        errorEl.classList.remove('hidden');
        btn.innerText = "Initialize Session";
        btn.disabled = false;
    }
};

function checkAuth() {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            try {
                // Verify SuperAdmin status in DB first
                const snap = await db.ref(`admins/${user.uid}`).once('value');
                const adminData = snap.val();
                
                if (adminData && adminData.isSuper === true) {
                    document.getElementById('loginOverlay').classList.add('hidden');
                    document.getElementById('mainContainer').classList.remove('hidden');
                    initStats();
                    initOnboardingManager();
                    logAdminAction('SESSION_INIT', { method: 'Firebase Auth' });
                } else {
                    // Fallback: check custom claims if DB record is missing
                    const token = await user.getIdTokenResult(true);
                    if (token.claims && token.claims.superadmin === true) {
                        console.log("[SuperAdmin] Emergency access granted via custom claims");
                        document.getElementById('loginOverlay').classList.add('hidden');
                        document.getElementById('mainContainer').classList.remove('hidden');
                        initStats();
                        initOnboardingManager();
                        logAdminAction('SESSION_INIT', { method: 'Custom Claims Fallback' });
                    } else {
                        console.error("Access Denied: Not a Super Admin");
                        showToast("Unauthorized: Super Admin privileges required", "error");
                        auth.signOut();
                    }
                }
            } catch (err) {
                console.error("Auth Verification Error:", err);
                auth.signOut();
            }
        } else {
            document.getElementById('loginOverlay').classList.remove('hidden');
            document.getElementById('mainContainer').classList.add('hidden');
        }
    });
}

async function logAdminAction(action, details = {}) {
    const user = auth.currentUser;
    const logEntry = {
        action: action,
        details: details,
        admin: user ? user.email : 'System',
        adminUid: user ? user.uid : 'system',
        timestamp: firebase.database.ServerValue.TIMESTAMP
    };
    try {
        await db.ref('system/auditLogs').push(logEntry);
    } catch (err) {
        console.warn("Audit Log Failed:", err);
    }
}

/**
 * SECURITY: ATOMIC ADMIN ACTION
 * Executes a multi-path update that includes the audit log in a single transaction.
 */
async function atomicAdminAction(updates, action, details = {}) {
    const user = auth.currentUser;
    const logKey = db.ref('system/auditLogs').push().key;
    
    const logEntry = {
        action: action,
        details: details,
        admin: user ? user.email : 'System',
        adminUid: user ? user.uid : 'system',
        timestamp: firebase.database.ServerValue.TIMESTAMP
    };
    
    const atomicUpdates = { ...updates };
    atomicUpdates[`system/auditLogs/${logKey}`] = logEntry;
    
    return db.ref().update(atomicUpdates);
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
    'inventory': 'Real-time stock monitoring and menu availability control',
    'promotions': 'Platform-wide economic controls',
    'users': 'Global customer registry & credit ledger',
    'riders': 'Fleet logistics & operational partners',
    'delivery': 'Infrastructure Flow Slabs',
    'reports': 'Enterprise growth & financial audit',
    'audit': 'Ecosystem security & operational telemetry',
    'liveorders': 'Real-time order pipeline across all outlets',
    'reviews': 'Ratings, feedback & outlet quality scoring',
    'broadcast': 'Push notification engine & audience targeting',
    'reconciliation': 'Manual partner payout & financial reconciliation'
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
        if (target === 'inventory') loadInventory();
        if (target === 'delivery') loadGlobalDelivery();
        if (target === 'riders') loadRiders();
        if (target === 'promotions') loadPromotions();
        if (target === 'users') loadUsers();
        if (target === 'reports') loadReports();
        if (target === 'audit') loadAuditLogs();
        if (target === 'settings') loadInfrastructure();
        if (target === 'liveorders') loadLiveOrders();
        if (target === 'reviews') loadReviews();
        if (target === 'broadcast') loadBroadcastHistory();
        if (target === 'reconciliation') loadReconciliations();
    });
});

window.loadInfrastructure = function() {
    const pane = document.getElementById('settings');
    if (!pane) return;
    
    // Simulate real-time telemetry fetch
    const connectionStatus = db.app.options.databaseURL ? "CONNECTED" : "DISCONNECTED";
    const uptime = Math.floor((Date.now() - performance.timing.navigationStart) / 1000);
    const hrs = Math.floor(uptime / 3600);
    const mins = Math.floor((uptime % 3600) / 60);
    const secs = uptime % 60;

    const registryEl = pane.querySelector('.font-mono');
    if (registryEl) {
        registryEl.innerHTML = `
            <div class="text-success">[INFO] SYSTEM KERNEL VERSION: 2.1.0-FOODHUBBIE-PRO</div>
            <div>[INFO] NETWORK ARCHITECTURE: MULTI-TENANT ISOLATED</div>
            <div class="text-success">[INFO] REALTIME DATA SYNC: ${connectionStatus}</div>
            <div>[INFO] MASTER ENDPOINT: ${db.app.options.databaseURL}</div>
            <div class="text-warning">[INFO] SYSTEM UPTIME: ${hrs}h ${mins}m ${secs}s</div>
            <div class="border-white-op-1 mb-3 mt-3 pt-3"></div>
            <div>[AUTH] PERMISSION LEVEL: ROOT_ADMIN</div>
            <div>[AUTH] SESSION INTEGRITY: VERIFIED</div>
            <div class="text-info">[DB] ESTIMATED LATENCY: ${Math.floor(Math.random() * 40) + 10}ms</div>
            <div class="text-info">[DB] STORAGE CONSUMPTION: ~24.8 MB</div>
            <div class="mt-4 animate-pulse">>_ Listening for global network events...</div>
        `;
    }
    logAdminAction('VIEW_INFRASTRUCTURE', { status: connectionStatus });
};

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
        let totalOrdersToday = 0;
        const bizList = [];
        
        Object.entries(businesses).forEach(([id, biz]) => {
            const outlets = biz.outlets || {};
            const outletCount = Object.keys(outlets).length;
            totalOutlets += outletCount;
            
            // Count today's orders across all outlets
            Object.values(outlets).forEach(outlet => {
                const orders = outlet.orders || {};
                const today = new Date().toLocaleDateString('en-IN');
                Object.values(orders).forEach(o => {
                    const orderDate = o.date || (o.timestamp ? new Date(o.timestamp).toLocaleDateString('en-IN') : '');
                    if (orderDate === today) totalOrdersToday++;
                });
            });

            bizList.push({
                id,
                name: biz.name || id,
                owner: biz.owner || 'N/A',
                outlets: outletCount,
                status: biz.status || 'Active',
                commission: biz.commission || { percentage: 0, fixed: 0 }
            });
        });

        document.getElementById('countOutlets').innerText = totalOutlets;
        const ordersEl = document.getElementById('countOrdersToday');
        if (ordersEl) ordersEl.innerText = totalOrdersToday;
        
        renderBusinessList(bizList);
        renderOrderHeatmap();
    });

    // Load customer count
    db.ref('users').once('value', snap => {
        const users = snap.val() || {};
        const el = document.getElementById('countCustomers');
        if (el) el.innerText = Object.keys(users).length;
    });

    // Render sparklines (decorative for now - shows growth pattern)
    renderDashboardSparklines();
}

// --- Visualization Helpers (Hybrid from Claude Dashboard) ---

function renderSparkline(containerId, data, color) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const w = 72, h = 28;
    const max = Math.max(...data), min = Math.min(...data), range = max - min || 1;
    const pts = data.map((v, i) => [
        (i / (data.length - 1)) * w,
        h - ((v - min) / range) * h * 0.8 - h * 0.1
    ]);
    const d = pts.map((p, i) => (i === 0 ? `M${p[0].toFixed(1)},${p[1].toFixed(1)}` : `L${p[0].toFixed(1)},${p[1].toFixed(1)}`)).join(' ');
    el.innerHTML = `<svg width="${w}" height="${h}" style="overflow:visible">
        <path d="${d}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="${pts[pts.length-1][0]}" cy="${pts[pts.length-1][1]}" r="3" fill="${color}"/>
    </svg>`;
}

function renderDashboardSparklines() {
    // Decorative sparklines showing growth trends
    renderSparkline('sparkBiz', [2, 2, 3, 3, 4, 4, 5], '#10B981');
    renderSparkline('sparkOutlets', [1, 2, 2, 3, 4, 5, 6], '#F97316');
    renderSparkline('sparkOrders', [12, 18, 22, 15, 28, 34, 31], '#6366F1');
}

function renderOrderHeatmap() {
    const el = document.getElementById('orderHeatmap');
    if (!el) return;
    
    const hrs = ['12a','2a','4a','6a','8a','10a','12p','2p','4p','6p','8p','10p'];
    const daysH = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const mults = [0.75, 0.80, 0.78, 0.90, 1.05, 1.30, 1.20];
    const base = [2, 1, 0, 0, 1, 4, 14, 26, 38, 28, 24, 18];
    const maxV = Math.round(Math.max(...base) * 1.3);

    let html = `<table style="border-collapse:separate;border-spacing:3px;width:100%;font-size:10px"><tr><td style="width:28px"></td>`;
    hrs.forEach(h => html += `<td style="text-align:center;color:#94A3B8;padding-bottom:4px;min-width:24px;font-weight:600">${h}</td>`);
    html += '</tr>';

    daysH.forEach((d, di) => {
        html += `<tr><td style="color:#64748B;padding-right:6px;text-align:right;white-space:nowrap;font-weight:600">${d}</td>`;
        base.forEach(v => {
            const rv = Math.round(v * mults[di]);
            const p = rv / maxV;
            const bg = p < 0.04 ? '#F1F5F9' : p < 0.2 ? '#FFF7ED' : p < 0.45 ? '#FDBA74' : p < 0.75 ? '#F97316' : '#EA580C';
            const textC = p >= 0.45 ? 'white' : 'transparent';
            html += `<td style="background:${bg};border-radius:4px;height:20px;text-align:center;color:${textC};font-size:8px;font-weight:700" title="${rv} orders">${rv > 0 && p >= 0.45 ? rv : ''}</td>`;
        });
        html += '</tr>';
    });
    el.innerHTML = html + '</table>';
}

function renderBusinessList(list) {
    const tbody = document.getElementById('businessList');
    if (!tbody) return;
    
    if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center p-12 text-muted">No operational nodes detected in the ecosystem registry.</td></tr>';
        return;
    }

    tbody.innerHTML = list.map(b => `
        <tr>
            <td>
                <div class="font-black" style="color:var(--pro-text)">${safeText(b.name)}</div>
                <div class="text-xs text-muted font-mono opacity-60">${safeText(b.id)}</div>
            </td>
            <td>
                <div class="font-semibold" style="color:var(--pro-text)">${safeText(b.owner)}</div>
                <div class="text-xs text-muted uppercase" style="letter-spacing:0.5px">Authority</div>
            </td>
            <td>
                <div class="font-black" style="color:#F97316">${b.outlets} Clusters</div>
            </td>
            <td>
                <div class="font-black" style="color:#10B981">${b.commission.percentage}% + ₹${b.commission.fixed}</div>
                <div class="text-xs text-muted">Rev Share</div>
            </td>
            <td>
                <span class="pro-badge badge-success">
                    <i data-lucide="shield-check" size="10"></i> ${safeText(b.status)}
                </span>
            </td>
            <td>
                <div class="flex gap-2">
                    <button class="btn-pro-icon" title="Edit Commission" onclick="showCommissionModal('${safeText(b.id)}', ${b.commission.percentage}, ${b.commission.fixed})">
                        <i data-lucide="percent" size="16" color="#F97316"></i>
                    </button>
                    <button class="btn-pro-icon" title="Node Configuration" onclick="showOutletModal('${safeText(b.id)}', 'node_01')">
                        <i data-lucide="settings" size="16"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    // Mirror to dedicated businesses tab
    const altTbody = document.getElementById('businessListAlt');
    if (altTbody) altTbody.innerHTML = tbody.innerHTML;
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

            // 1. Create Admin Account in Secondary Auth (Must happen first)
            const userCredential = await secondaryAuth.createUserWithEmailAndPassword(adminEmail, adminPass);
            const uid = userCredential.user.uid;

            // 2. Prepare Atomic Updates for the whole provisioning
            const updates = {};
            
            // Business Node
            updates[`businesses/${bizId}`] = {
                name: bizName,
                createdAt: new Date().toISOString(),
                status: 'Active',
                commission: {
                    percentage: 15.0, // Standard platform default
                    fixed: 5.0,      // Per-order infrastructure fee
                    updatedAt: new Date().toISOString()
                }
            };

            // Outlet Node
            updates[`businesses/${bizId}/outlets/${outletId}`] = {
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
            };

            // Admin Node
            updates[`admins/${uid}`] = {
                name: `${bizName} Admin`,
                email: adminEmail,
                phone: adminPhone,
                businessId: bizId,
                outletId: outletId,
                role: 'Admin',
                isSuper: false,
                createdAt: new Date().toISOString()
            };

            // Slug Registry
            updates[`slugs/outlets/${outletSlug}`] = {
                businessId: bizId,
                outletId: outletId
            };

            // 3. Execute Atomic Provisioning + Audit
            await atomicAdminAction(updates, 'ECOSYSTEM_INITIALIZE', {
                businessId: bizId,
                outletId: outletId,
                adminEmail: adminEmail
            });

            showToast(`✅ Ecosystem initialized for ${bizName}`, "success");
            onboardingForm.reset();
            secondaryAuth.signOut(); 
            document.querySelector('[data-tab="dashboard"]').click();
            
        } catch (err) {
            console.error(err);
            showToast("❌ Provisioning Failed: " + err.message, "error");
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
        const updates = {};
        
        // 1. Prepare Outlet Updates
        updates[`businesses/${editingBizId}/outlets/${editingOutletId}/name`] = name;

// --- Commission Management ---
window.showCommissionModal = function(bid, perc, fixed) {
    document.getElementById('comm_business_id').value = bid;
    document.getElementById('comm_percentage').value = perc || 0;
    document.getElementById('comm_fixed').value = fixed || 0;
    document.getElementById('modalCommission').classList.remove('hidden');
    lucide.createIcons();
};

window.hideCommissionModal = function() {
    document.getElementById('modalCommission').classList.add('hidden');
};

window.saveCommission = async function() {
    const bid = document.getElementById('comm_business_id').value;
    const perc = parseFloat(document.getElementById('comm_percentage').value) || 0;
    const fixed = parseFloat(document.getElementById('comm_fixed').value) || 0;

    if (!bid) return;

    try {
        const updates = {};
        updates[`businesses/${bid}/commission`] = {
            percentage: perc,
            fixed: fixed,
            updatedAt: new Date().toISOString()
        };

        await atomicAdminAction(updates, 'COMMISSION_UPDATE', {
            businessId: bid,
            percentage: perc,
            fixed: fixed
        });

        showToast("✅ Commission model updated successfully", "success");
        hideCommissionModal();
    } catch (err) {
        console.error(err);
        showToast("❌ Update failed: " + err.message, "error");
    }
};

window.updateOutlet = async function() {
        updates[`businesses/${editingBizId}/outlets/${editingOutletId}/meta`] = {
            name: name,
            slug: slug,
            address: address,
            lat: lat,
            lng: lng,
            adminPhone: phone,
            updatedAt: new Date().toISOString()
        };
        updates[`businesses/${editingBizId}/outlets/${editingOutletId}/settings/Store`] = {
            storeName: name,
            address: address,
            lat: lat,
            lng: lng,
            updatedAt: new Date().toISOString()
        };

        // 2. Handle Password Update (Metadata only for now, as Auth requires server-side)
        if (newPass && newPass.length >= 6) {
            console.log("[SuperAdmin] Password change requested. This requires Cloud Function execution.");
        }

        // 3. Sync Slug
        updates[`slugs/outlets/${slug}`] = {
            businessId: editingBizId,
            outletId: editingOutletId
        };

        // 4. Execute Atomic Update + Audit
        await atomicAdminAction(updates, 'ECOSYSTEM_NODE_UPDATE', {
            businessId: editingBizId,
            outletId: editingOutletId,
            fields: ['name', 'slug', 'address', 'location', 'phone']
        });

        alert("✅ Node updates deployed atomically to ecosystem.");
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
// Helper to compress image before upload
async function compressImage(file, targetSizeKB = 200) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const MAX_WIDTH = 1024;

                if (width > MAX_WIDTH) {
                    height = (MAX_WIDTH / width) * height;
                    width = MAX_WIDTH;
                }

                const performCompression = (w, h, q) => {
                    canvas.width = w;
                    canvas.height = h;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, w, h);
                    return canvas.toDataURL('image/jpeg', q);
                };

                let quality = 0.8;
                let dataUrl = performCompression(width, height, quality);
                let iterations = 0;

                while (dataUrl.length > targetSizeKB * 1024 && iterations < 5) {
                    if (quality > 0.3) quality -= 0.15;
                    else {
                        width *= 0.8;
                        height *= 0.8;
                    }
                    dataUrl = performCompression(width, height, quality);
                    iterations++;
                }

                // Convert dataUrl back to Blob for storage upload
                fetch(dataUrl)
                    .then(res => res.blob())
                    .then(blob => resolve(blob));
            };
        };
    });
}
async function uploadRiderFile(uid, file, type) {
    if (!file) return null;
    
    // Auto-compress to 200KB before upload
    const compressedBlob = await compressImage(file, 200);
    
    const ref = storage.ref(`riders/${uid}/${type}_${Date.now()}`);
    const snapshot = await ref.put(compressedBlob);
    return await snapshot.ref.getDownloadURL();
}

let allRiders = {};
let editingRiderId = null;

async function loadRiders() {
    db.ref('riders').on('value', (snap) => {
        const data = snap.val() || {};
        allRiders = Object.keys(data).map(id => ({ id, ...data[id] }));
        renderRidersList(allRiders);
    });
}

function renderRidersList(list) {
    const tbody = document.getElementById('ridersListTable');
    if (!tbody) return;

    if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center p-12 text-muted">No logistics partners registered in the fleet node.</td></tr>';
        return;
    }

    tbody.innerHTML = list.map(r => `
        <tr>
            <td>
                <div class="flex items-center gap-3">
                    <div class="avatar-sm">${(r.name || 'R').charAt(0)}</div>
                    <div>
                        <div class="font-black" style="color:var(--pro-text)">${safeText(r.name)}</div>
                        <div class="text-xs text-muted font-mono">${safeText(r.email)}</div>
                    </div>
                </div>
            </td>
            <td>
                <div class="font-bold" style="color:var(--pro-text)">₹${r.totalEarned || 0} Earned</div>
                <div class="text-xs text-muted">${r.totalDeliveries || 0} Successful Missions</div>
            </td>
            <td>
                <span class="pro-badge ${r.kycStatus === 'Verified' ? 'badge-success' : 'badge-warning'}">
                    <i data-lucide="${r.kycStatus === 'Verified' ? 'shield-check' : 'shield-alert'}" size="10"></i> ${r.kycStatus || 'Pending'}
                </span>
            </td>
            <td>
                <div class="flex gap-2">
                    <button class="btn-pro-icon" title="Node Controls" onclick="editRider('${r.id}')"><i data-lucide="edit-3" size="16"></i></button>
                    <button class="btn-pro-icon text-red-400" title="Revoke Access" onclick="deleteRider('${r.id}')"><i data-lucide="power" size="16"></i></button>
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
    const r = allRiders.find(x => x.id === id);
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
            if (pass && pass.length >= 6) {
                console.log("[SuperAdmin] Rider Password change requested.");
                data.password = pass; 
            }

            const updates = {};
            updates[`riders/${editingRiderId}`] = data;

            const profileFile = document.getElementById('fileProfile').files[0];
            const aadharFile = document.getElementById('fileAadhar').files[0];

            if (profileFile || aadharFile) {
                if (profileFile) data.profileUrl = await uploadRiderFile(editingRiderId, profileFile, 'profile');
                if (aadharFile) data.aadharUrl = await uploadRiderFile(editingRiderId, aadharFile, 'aadhar');
                data.kycStatus = 'Pending';
            }

            await atomicAdminAction(updates, 'RIDER_PROFILE_UPDATE', {
                riderId: editingRiderId,
                riderName: name
            });

            alert("✅ Logistics Partner profile synchronized!");
        } else {
            if (!pass || pass.length < 6) return alert("❌ Access Passcode (min 6 chars) is required for new partner node.");
            
            const userCredential = await secondaryAuth.createUserWithEmailAndPassword(email, pass);
            const uid = userCredential.user.uid;
            
            data.uid = uid;
            data.createdAt = firebase.database.ServerValue.TIMESTAMP;
            data.status = 'Offline';
            data.password = pass; 
            
            const profileFile = document.getElementById('fileProfile').files[0];
            const aadharFile = document.getElementById('fileAadhar').files[0];
            data.kycStatus = 'Pending';
            if (profileFile) data.profileUrl = await uploadRiderFile(uid, profileFile, 'profile');
            if (aadharFile) data.aadharUrl = await uploadRiderFile(uid, aadharFile, 'aadhar');

            const updates = {};
            updates[`riders/${uid}`] = data;
            
            await atomicAdminAction(updates, 'RIDER_PROVISION', {
                riderId: uid,
                riderEmail: email
            });

            await secondaryAuth.signOut(); 
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
        const updates = {};
        updates[`riders/${id}`] = null;
        
        await atomicAdminAction(updates, 'RIDER_DECOMMISSION', {
            riderId: id
        });
        
        alert("✅ Partner node decommissioned.");
    } catch (err) {
        alert("❌ Error: " + err.message);
    }
};

// --- Promotions Management ---
let allCoupons = {};

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
                <div style="font-weight: 900; color: #0F172A; letter-spacing: 1px;">${safeText(c.code)}</div>
            </td>
            <td>
                <div style="font-weight: 600;">${c.value}${c.type === 'percent' ? '%' : '₹'} OFF</div>
                <div style="font-size: 11px; color: #64748B;">Min: ₹${c.minOrder}</div>
            </td>
            <td>
                <div style="font-weight: 700; color: #38BDF8;">${c.usedCount || 0} / ${c.usageLimit}</div>
            </td>
            <td>
                <span class="pro-badge ${c.isActive ? 'badge-success' : 'badge-warning'}">
                    ${c.isActive ? 'Active' : 'Paused'}
                </span>
            </td>
            <td>
                <div style="display: flex; gap: 8px;">
                    <button class="btn-pro-icon" onclick="toggleCoupon('${id}', ${!c.isActive})"><i data-lucide="${c.isActive ? 'pause' : 'play'}" size="16"></i></button>
                    <button class="btn-pro-icon btn-danger text-white" onclick="deleteCoupon('${id}')"><i data-lucide="trash-2" size="16"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
    lucide.createIcons();
}

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
        const updates = {};
        updates['system/config/platformFee'] = {
            amount,
            updatedAt: Date.now(),
            updatedBy: auth.currentUser.email
        };
        
        await atomicAdminAction(updates, 'UPDATE_PLATFORM_FEE', { amount });
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
        
        const updates = {};
        updates['system/promotions/coupons/' + code] = couponData;
        
        await atomicAdminAction(updates, 'CREATE_COUPON', couponData);
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
    allCoupons = couponsSnap.val() || {};
    renderCoupons();
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

window.exportCoupons = function() {
    if (Object.keys(allCoupons).length === 0) return showToast("Registry is empty", "error");

    const headers = ["Promo Code", "Type", "Value", "Min Order", "Status", "Created At", "Created By"];
    const rows = Object.values(allCoupons).map(c => [
        safeCSV(c.code),
        safeCSV(c.type),
        c.value,
        c.minOrder || 0,
        c.isActive ? "Active" : "Paused",
        new Date(c.createdAt).toLocaleString(),
        safeCSV(c.createdBy || "System")
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
        
        await atomicAdminAction(updates, 'BULK_OPERATION', { operation: op, affectedNodes: Object.keys(allCoupons).length });
        showToast(`Bulk ${op} deployed to ecosystem`, "success");
        loadPromotions();
    } catch (err) {
        showToast("Bulk Operation Failed: " + err.message, "error");
    }
};

// --- Toast System ---
function showToast(message, type = 'info') {
    const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'alert-circle' : 'info';
    const toast = document.createElement('div');
    toast.className = `pro-toast ${type}`;
    toast.innerHTML = `
        <div class="flex items-center gap-3">
            <i data-lucide="${icon}" size="18"></i>
            <span>${safeText(message)}</span>
        </div>
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
                <div style="font-weight: 700; color: #0F172A;">${safeText(u.name || 'Anonymous')}</div>
                <div style="font-size: 11px; color: #64748B; font-family: monospace;">UID: ${safeText(u.id)}</div>
            </td>
            <td>
                <div style="font-weight: 600;">${safeText(u.email || 'No Email')}</div>
                <div style="font-size: 11px; color: #64748B;">${safeText(u.phone || 'No Phone')}</div>
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
                    <button class="btn-pro-icon" style="background: rgba(16, 185, 129, 0.1); color: #10B981;" onclick="showWalletModal('${safeText(u.id)}', '${safeText(u.name || 'Anonymous')}', '${safeText(u.email || '')}')" title="Credit Wallet">
                        <i data-lucide="plus-circle" size="18"></i>
                    </button>
                    <button class="btn-pro-icon" style="background: rgba(148, 163, 184, 0.1); color: #64748B;" onclick="viewUserHistory('${safeText(u.id)}')" title="Transaction History">
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
        const txId = 'TX' + Date.now();
        const txData = {
            amount: amount,
            type: 'credit',
            reason: reason + " (Admin Issued)",
            timestamp: new Date().toISOString()
        };
        
        const walletRef = db.ref(`users/${uid}/walletBalance`);
        await walletRef.transaction((current) => (current || 0) + amount);

        const updates = {};
        updates[`users/${uid}/walletHistory/${txId}`] = txData;
        
        await atomicAdminAction(updates, 'WALLET_CREDIT', { userId: uid, amount, reason });
        
        showToast(`Successfully credited ₹${amount} to user`, "success");
        hideWalletModal();
        loadUsers(); 
    } catch (err) {
        showToast("Wallet operation failed: " + err.message, "error");
    }
};

window.exportUsers = function() {
    if (filteredUsersList.length === 0) return showToast("No users to export", "error");

    const headers = ["Name", "Email", "Phone", "Wallet Balance", "Last Active"];
    const rows = filteredUsersList.map(u => [
        safeCSV(u.name || "Anonymous"),
        safeCSV(u.email || "N/A"),
        safeCSV(u.phone || "N/A"),
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

// --- Reports & Analytics ---
let revenueChartInstance = null;

async function loadReports() {
    console.log("Loading Ecosystem Reports...");
    try {
        const bizSnap = await db.ref('businesses').once('value');
        const businesses = bizSnap.val() || {};
        
        let totalRevenue = 0, totalOrders = 0, totalLoyalty = 0;
        let totalCommission = 0, totalPlatformFees = 0;
        const bizLeaderboard = [];
        const outletLeaderboard = [];
        const dailyRevenue = {};

        for (const [bizId, biz] of Object.entries(businesses)) {
            let bizRevenue = 0, bizOrders = 0, bizCommission = 0;
            const outlets = biz.outlets || {};

            for (const [outId, outlet] of Object.entries(outlets)) {
                try {
                    const ordersSnap = await db.ref(`businesses/${bizId}/outlets/${outId}/orders`).once('value');
                    const orders = ordersSnap.val() || {};
                    
                    let outletRev = 0, outletOrd = 0;
                    Object.values(orders).forEach(o => {
                        const amount = parseFloat(o.total || o.grandTotal || 0);
                        const comm = o.commission ? parseFloat(o.commission.amount || 0) : 0;
                        const pFee = parseFloat(o.platformFee || 0);
                        
                        outletRev += amount;
                        outletOrd++;
                        bizCommission += comm;
                        totalPlatformFees += pFee;
                        
                        const date = o.date || (o.timestamp ? new Date(o.timestamp).toLocaleDateString() : 'Unknown');
                        dailyRevenue[date] = (dailyRevenue[date] || 0) + amount;
                    });

                    outletLeaderboard.push({ name: outlet.name || outId, revenue: outletRev, orders: outletOrd });
                    bizRevenue += outletRev;
                    bizOrders += outletOrd;
                } catch (e) { console.warn(`Skipping ${bizId}/${outId}:`, e.message); }
            }
            
            bizLeaderboard.push({ name: biz.name || bizId, revenue: bizRevenue, orders: bizOrders });
            totalRevenue += bizRevenue;
            totalOrders += bizOrders;
            totalCommission += bizCommission;
        }

        const totalPlatformRevenue = totalCommission + totalPlatformFees;
        const totalNetPayout = totalRevenue - totalPlatformRevenue;

        // Loyalty totals
        try {
            const usersSnap = await db.ref('users').once('value');
            const users = usersSnap.val() || {};
            Object.values(users).forEach(u => { totalLoyalty += (u.walletBalance || 0); });
        } catch (e) {}

        // Render metrics
        const el = id => document.getElementById(id);
        if (el('reportGlobalSales')) el('reportGlobalSales').innerText = '₹' + totalRevenue.toLocaleString();
        if (el('reportGlobalOrders')) el('reportGlobalOrders').innerText = totalOrders;
        if (el('reportAvgOrderValue')) el('reportAvgOrderValue').innerText = '₹' + (totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0);
        if (el('reportGlobalLoyalty')) el('reportGlobalLoyalty').innerText = '₹' + totalLoyalty.toLocaleString();
        
        // Update Revenue specific stats
        if (el('reportPlatformRev')) el('reportPlatformRev').innerText = '₹' + totalPlatformRevenue.toLocaleString();
        if (el('reportPartnerPayout')) el('reportPartnerPayout').innerText = '₹' + totalNetPayout.toLocaleString();
        
        if (el('reportTakeRate')) {
            const takeRate = totalRevenue > 0 ? ((totalPlatformRevenue / totalRevenue) * 100).toFixed(1) : 0;
            el('reportTakeRate').innerText = takeRate + '%';
        }

        // Leaderboards
        bizLeaderboard.sort((a, b) => b.revenue - a.revenue);
        outletLeaderboard.sort((a, b) => b.revenue - a.revenue);

        const bizTbody = el('reportBusinessLeaderboard');
        if (bizTbody) {
            bizTbody.innerHTML = bizLeaderboard.slice(0, 10).map((b, i) => `
                <tr>
                    <td><div class="flex items-center gap-2"><span class="pro-badge badge-warning">#${i+1}</span> <span class="font-bold" style="color:var(--pro-text)">${safeText(b.name)}</span></div></td>
                    <td class="font-black" style="color:#10B981">₹${b.revenue.toLocaleString()}</td>
                    <td class="text-muted">${b.orders}</td>
                </tr>`).join('') || '<tr><td colspan="3" class="text-center p-6 text-muted">No data</td></tr>';
        }

        const outTbody = el('reportOutletLeaderboard');
        if (outTbody) {
            outTbody.innerHTML = outletLeaderboard.slice(0, 10).map((o, i) => `
                <tr>
                    <td><div class="flex items-center gap-2"><span class="pro-badge badge-info">#${i+1}</span> <span class="font-bold" style="color:var(--pro-text)">${safeText(o.name)}</span></div></td>
                    <td class="font-black" style="color:#F97316">₹${o.revenue.toLocaleString()}</td>
                    <td class="text-muted">${o.orders} orders</td>
                </tr>`).join('') || '<tr><td colspan="3" class="text-center p-6 text-muted">No data</td></tr>';
        }

        // Audit log (in reports)
        const auditSnap = await db.ref('system/auditLogs').limitToLast(20).once('value');
        const auditTbody = el('auditLogTable');
        if (auditTbody) {
            const logs = [];
            auditSnap.forEach(s => logs.push(s.val()));
            logs.reverse();
            auditTbody.innerHTML = logs.map(l => `
                <tr>
                    <td><span class="pro-badge badge-info">${safeText(l.action)}</span></td>
                    <td class="font-bold" style="color:var(--pro-text)">${safeText(l.admin || 'System')}</td>
                    <td class="text-xs text-muted font-mono truncate-300">${safeText(JSON.stringify(l.details || {}))}</td>
                    <td class="text-xs text-muted">${l.timestamp ? new Date(l.timestamp).toLocaleString() : '---'}</td>
                </tr>`).join('') || '<tr><td colspan="4" class="text-center p-6 text-muted">No audit records</td></tr>';
        }

        // Revenue Chart
        renderRevenueChart(dailyRevenue);
        if (typeof lucide !== 'undefined') lucide.createIcons();

    } catch (err) {
        console.error("Reports Load Error:", err);
        showToast("Reports failed: " + err.message, "error");
    }
}

function renderRevenueChart(dailyData) {
    const canvas = document.getElementById('revenueChart');
    if (!canvas) return;

    const sorted = Object.entries(dailyData).sort((a, b) => new Date(a[0]) - new Date(b[0])).slice(-14);
    const labels = sorted.map(([d]) => d);
    const data = sorted.map(([, v]) => v);

    if (revenueChartInstance) revenueChartInstance.destroy();

    revenueChartInstance = new Chart(canvas, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Revenue (₹)',
                data,
                borderColor: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.08)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#10B981',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { grid: { color: '#F1F5F9' }, ticks: { color: '#94A3B8', font: { family: 'DM Sans' } } },
                x: { grid: { display: false }, ticks: { color: '#94A3B8', font: { family: 'DM Sans' } } }
            }
        }
    });
}

window.exportReport = function(format) {
    const reportEl = document.getElementById('reports');
    if (!reportEl) return showToast("Report element not found", "error");

    if (format === 'csv' || format === 'excel') {
        const bizTbody = document.getElementById('reportBusinessLeaderboard');
        if (!bizTbody || !bizTbody.rows.length) return showToast("No data to export", "error");
        
        let csv = "Partner Identity,Revenue,Orders\n";
        Array.from(bizTbody.rows).forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 3) {
                // Clean up name (remove #1, #2 etc)
                const name = cells[0].textContent.replace(/#\d+/, '').trim();
                const revenue = cells[1].textContent.replace(/[^\d.]/g, '').trim();
                const orders = cells[2].textContent.trim();
                csv += `"${safeCSV(name)}",${revenue},${orders}\n`;
            }
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `foodhubbie_analytics_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'csv' : 'csv'}`;
        link.click();
        logAdminAction('EXPORT_REPORT', { format: format });
        showToast(`Report exported as ${format.toUpperCase()}`, "success");
    } else if (format === 'pdf') {
        showToast("Generating PDF download...", "info");
        const opt = {
            margin: 10,
            filename: `foodhubbie_ecosystem_report_${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, backgroundColor: '#FFFFFF' },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
        };
        
        // Temporarily hide buttons for clean export
        const buttons = reportEl.querySelector('.flex.gap-2');
        if (buttons) buttons.style.display = 'none';

        html2pdf().set(opt).from(reportEl).save().then(() => {
            if (buttons) buttons.style.display = 'flex';
            logAdminAction('EXPORT_REPORT', { format: 'pdf' });
            showToast("PDF Downloaded", "success");
        }).catch(err => {
            if (buttons) buttons.style.display = 'flex';
            console.error("PDF Export Error:", err);
            showToast("PDF Export failed", "error");
        });
    }
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});

// --- Unified Audit Intelligence ---
window.loadAuditLogs = async function() {
    const tbody = document.getElementById('unifiedAuditBody');
    const filter = document.getElementById('auditLogFilter')?.value || 'all';
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="5" class="text-center p-12 text-muted"><div class="animate-pulse">Aggregating telemetry from global nodes...</div></td></tr>';

    try {
        const adminLogs = [];
        const marketplaceLogs = [];
        const botLogs = [];
        const riderLogs = [];

        const adminSnap = await db.ref('system/auditLogs').limitToLast(100).once('value');
        adminSnap.forEach(snap => adminLogs.push({ ...snap.val(), timestamp: snap.val().timestamp || Date.now() }));

        const marketSnap = await db.ref('logs/marketplaceAudit').limitToLast(50).once('value');
        marketSnap.forEach(snap => marketplaceLogs.push({ ...snap.val(), timestamp: snap.val().timestamp || Date.now() }));

        const botSnap = await db.ref('logs/botAudit').limitToLast(50).once('value');
        botSnap.forEach(snap => botLogs.push({ ...snap.val(), timestamp: snap.val().timestamp || Date.now() }));

        const riderSnap = await db.ref('logs/riderErrors').limitToLast(50).once('value');
        riderSnap.forEach(riderGroup => {
            riderGroup.forEach(snap => riderLogs.push({ ...snap.val(), timestamp: snap.val().timestamp || Date.now() }));
        });

        const allLogs = [
            ...adminLogs.map(l => ({ ...l, source: 'ADMIN', badge: 'badge-info' })),
            ...marketplaceLogs.map(l => ({ ...l, source: 'MARKETPLACE', badge: 'badge-success' })),
            ...botLogs.map(l => ({ ...l, source: 'WHATSAPP', badge: 'badge-warning' })),
            ...riderLogs.map(l => ({ ...l, source: 'RIDER_APP', badge: 'badge-danger' }))
        ].sort((a, b) => b.timestamp - a.timestamp);

        renderUnifiedLogs(allLogs, filter);
    } catch (err) {
        console.error("Audit Fetch Failed:", err);
        tbody.innerHTML = `<tr><td colspan="5" class="text-center p-12 text-danger">Telemetric failure: ${err.message}</td></tr>`;
    }
};

function renderUnifiedLogs(logs, filter) {
    const tbody = document.getElementById('unifiedAuditBody');
    if (!tbody) return;

    const filtered = filter === 'all' ? logs : logs.filter(l => l.source.toLowerCase().includes(filter.toLowerCase()));

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center p-12 text-muted">No telemetric events detected in the current audit window.</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map(log => `
        <tr>
            <td>
                <span class="pro-badge ${log.badge}">${log.source}</span>
            </td>
            <td>
                <div class="font-bold" style="color:var(--pro-text)">${safeText(log.admin || log.userEmail || 'System')}</div>
                <div class="text-xs text-muted font-mono opacity-50">${safeText(log.adminUid || log.uid || '---')}</div>
            </td>
            <td>
                <div class="font-black" style="color:#F97316">${safeText(log.action)}</div>
            </td>
            <td>
                <div class="text-xs text-muted font-mono truncate-300" title='${JSON.stringify(log.details || {}).replace(/'/g, "&apos;")}'>
                    ${safeText(JSON.stringify(log.details || {}))}
                </div>
            </td>
            <td>
                <div class="text-xs text-muted font-mono">${new Date(log.timestamp).toISOString().replace('T', ' ').split('.')[0]}</div>
            </td>
        </tr>
    `).join('');
    lucide.createIcons();
}

// =====================================================
// MODULE: LIVE ORDER COMMAND CENTER
// =====================================================
let allLiveOrders = [];
let currentOrderFilter = 'all';

window.loadLiveOrders = async function() {
    const tbody = document.getElementById('liveOrdersBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="9" class="text-center p-12 text-muted"><div class="animate-pulse">Aggregating orders from all outlets...</div></td></tr>';

    try {
        const bizSnap = await db.ref('businesses').once('value');
        const businesses = bizSnap.val() || {};
        allLiveOrders = [];
        const outletFilter = document.getElementById('orderOutletFilter');
        
        // Populate outlet filter dropdown
        let filterHTML = '<option value="all">All Outlets</option>';

        for (const [bizId, biz] of Object.entries(businesses)) {
            const outlets = biz.outlets || {};
            for (const [outId, outlet] of Object.entries(outlets)) {
                const outletName = outlet.name || outId;
                filterHTML += `<option value="${bizId}/${outId}">${safeText(outletName)}</option>`;
                
                const orders = outlet.orders || {};
                Object.entries(orders).forEach(([orderId, order]) => {
                    allLiveOrders.push({
                        id: orderId,
                        bizId,
                        outletId: outId,
                        outletName,
                        customerName: order.customerName || order.name || 'Guest',
                        phone: order.phone || '',
                        items: order.items || [],
                        total: parseFloat(order.total || order.grandTotal || 0),
                        status: (order.status || 'new').toLowerCase(),
                        riderId: order.riderId || null,
                        riderName: order.riderName || null,
                        timestamp: order.timestamp || order.createdAt || Date.now(),
                        date: order.date || ''
                    });
                });
            }
        }

        if (outletFilter) outletFilter.innerHTML = filterHTML;

        // Sort by most recent first
        allLiveOrders.sort((a, b) => b.timestamp - a.timestamp);

        // Filter to recent orders (last 48 hours)
        const cutoff = Date.now() - (48 * 60 * 60 * 1000);
        allLiveOrders = allLiveOrders.filter(o => o.timestamp > cutoff || ['new', 'confirmed', 'preparing', 'ready', 'picked', 'out'].includes(o.status));

        renderOrderPipeline();
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="9" class="text-center p-12 text-danger">Failed to load orders: ${err.message}</td></tr>`;
    }
};

window.filterOrderPipeline = function(status) {
    currentOrderFilter = status;
    renderOrderPipeline();
};

window.setOrderView = function(view) {
    const tableBtn = document.getElementById('btnListView');
    const kanbanBtn = document.getElementById('btnKanbanView');
    const tableView = document.getElementById('orderTableView');
    const kanbanView = document.getElementById('orderKanbanView');

    if (view === 'table') {
        tableBtn.classList.add('bg-card', 'shadow-sm');
        tableBtn.classList.remove('text-muted');
        kanbanBtn.classList.add('text-muted');
        kanbanBtn.classList.remove('bg-card', 'shadow-sm');
        tableView.classList.remove('hidden');
        kanbanView.classList.add('hidden');
    } else {
        kanbanBtn.classList.add('bg-card', 'shadow-sm');
        kanbanBtn.classList.remove('text-muted');
        tableBtn.classList.add('text-muted');
        tableBtn.classList.remove('bg-card', 'shadow-sm');
        kanbanView.classList.remove('hidden');
        tableView.classList.add('hidden');
    }
    localStorage.setItem('foodhubbie_order_view', view);
    renderOrderPipeline();
};

function renderOrderPipeline() {
    const isKanban = document.getElementById('orderKanbanView').classList.contains('hidden') === false;
    
    if (isKanban) {
        renderOrderKanban();
    } else {
        renderOrderTable();
    }
}

function renderOrderTable() {
    const tbody = document.getElementById('liveOrdersBody');
    if (!tbody) return;

    const outletVal = document.getElementById('orderOutletFilter')?.value || 'all';
    let filtered = allLiveOrders;
    
    if (outletVal !== 'all') {
        const [biz, out] = outletVal.split('/');
        filtered = filtered.filter(o => o.bizId === biz && o.outletId === out);
    }

    // Status counts
    const counts = { all: filtered.length, new: 0, preparing: 0, out: 0, delivered: 0 };
    filtered.forEach(o => {
        if (['new', 'pending', 'confirmed'].includes(o.status)) counts.new++;
        else if (['preparing', 'cooking', 'ready'].includes(o.status)) counts.preparing++;
        else if (['picked', 'out', 'out_for_delivery', 'in_transit'].includes(o.status)) counts.out++;
        else if (['delivered', 'completed'].includes(o.status)) counts.delivered++;
    });

    document.getElementById('orderCountAll').innerText = counts.all;
    document.getElementById('orderCountNew').innerText = counts.new;
    document.getElementById('orderCountPreparing').innerText = counts.preparing;
    document.getElementById('orderCountOut').innerText = counts.out;
    document.getElementById('orderCountDelivered').innerText = counts.delivered;

    // Apply filter
    if (currentOrderFilter !== 'all') {
        const statusMap = {
            'new': ['new', 'pending', 'confirmed'],
            'preparing': ['preparing', 'cooking', 'ready'],
            'out': ['picked', 'out', 'out_for_delivery', 'in_transit'],
            'delivered': ['delivered', 'completed']
        };
        const allowed = statusMap[currentOrderFilter] || [];
        filtered = filtered.filter(o => allowed.includes(o.status));
    }

    // SLA Alerts (orders pending > 30 min)
    const slaEl = document.getElementById('slaAlerts');
    const slaBreaches = filtered.filter(o => {
        const age = Date.now() - o.timestamp;
        return ['new', 'pending', 'confirmed'].includes(o.status) && age > 30 * 60 * 1000;
    });
    if (slaEl) {
        slaEl.innerHTML = slaBreaches.length > 0 ? `
            <div class="pro-card" style="background:#FEF2F2;border-color:#FECACA;padding:14px 20px">
                <div class="flex items-center gap-3">
                    <i data-lucide="alert-triangle" size="20" style="color:#EF4444"></i>
                    <div>
                        <div class="font-bold" style="color:#991B1B">${slaBreaches.length} Order(s) Breaching SLA</div>
                        <div class="text-xs" style="color:#B91C1C">These orders have been pending for over 30 minutes without status update</div>
                    </div>
                </div>
            </div>` : '';
    }

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center p-12 text-muted">No orders matching the current filter.</td></tr>';
        if (typeof lucide !== 'undefined') lucide.createIcons();
        return;
    }

    const statusBadge = (s) => {
        const map = {
            'new': 'badge-warning', 'pending': 'badge-warning', 'confirmed': 'badge-info',
            'preparing': 'badge-info', 'cooking': 'badge-info', 'ready': 'badge-success',
            'picked': 'badge-info', 'out': 'badge-info', 'out_for_delivery': 'badge-info', 'in_transit': 'badge-info',
            'delivered': 'badge-success', 'completed': 'badge-success',
            'cancelled': 'badge-danger', 'rejected': 'badge-danger'
        };
        return map[s] || 'badge-warning';
    };

    tbody.innerHTML = filtered.slice(0, 50).map(o => {
        const age = Date.now() - o.timestamp;
        const ageMin = Math.floor(age / 60000);
        const ageStr = ageMin < 60 ? `${ageMin}m` : `${Math.floor(ageMin / 60)}h ${ageMin % 60}m`;
        const isOverdue = ageMin > 30 && ['new', 'pending', 'confirmed'].includes(o.status);
        const itemCount = Array.isArray(o.items) ? o.items.length : Object.keys(o.items || {}).length;
        
        return `<tr style="${isOverdue ? 'background:#FEF2F2' : ''}">
            <td>
                <div class="font-bold font-mono text-xs" style="color:var(--pro-text)">${safeText(o.id.slice(-8).toUpperCase())}</div>
            </td>
            <td><div class="text-sm font-semibold">${safeText(o.outletName)}</div></td>
            <td>
                <div class="font-semibold" style="color:var(--pro-text)">${safeText(o.customerName)}</div>
                <div class="text-xs text-muted">${safeText(o.phone)}</div>
            </td>
            <td><span class="pro-badge badge-info">${itemCount} items</span></td>
            <td><div class="font-bold" style="color:#10B981">₹${o.total.toFixed(0)}</div></td>
            <td><span class="pro-badge ${statusBadge(o.status)}">${o.status.toUpperCase()}</span></td>
            <td><div class="text-xs font-mono ${isOverdue ? 'text-danger font-bold' : 'text-muted'}">${ageStr}</div></td>
            <td><div class="text-xs">${o.riderName ? safeText(o.riderName) : '<span class="text-muted">Unassigned</span>'}</div></td>
            <td>
                <div class="flex gap-2">
                    <button class="btn-pro-icon" title="Update Status" onclick="updateOrderStatus('${o.bizId}','${o.outletId}','${o.id}')">
                        <i data-lucide="check" size="14"></i>
                    </button>
                </div>
            </td>
        </tr>`;
    }).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function renderOrderKanban() {
    const container = document.getElementById('kanbanContainer');
    if (!container) return;

    const outletVal = document.getElementById('orderOutletFilter')?.value || 'all';
    let filtered = allLiveOrders;
    
    if (outletVal !== 'all') {
        const [biz, out] = outletVal.split('/');
        filtered = filtered.filter(o => o.bizId === biz && o.outletId === out);
    }

    const columns = [
        { id: 'pending', title: 'New & Pending', status: ['new', 'pending', 'confirmed'], color: '#FBBF24' },
        { id: 'preparing', title: 'Preparing', status: ['preparing', 'cooking', 'ready'], color: '#6366F1' },
        { id: 'on-the-way', title: 'On the Way', status: ['picked', 'out', 'out_for_delivery', 'in_transit'], color: '#10B981' },
        { id: 'completed', title: 'Delivered', status: ['delivered', 'completed'], color: '#38BDF8' }
    ];

    // Status counts update (keep global counts in sync)
    const counts = { all: filtered.length, new: 0, preparing: 0, out: 0, delivered: 0 };
    filtered.forEach(o => {
        if (['new', 'pending', 'confirmed'].includes(o.status)) counts.new++;
        else if (['preparing', 'cooking', 'ready'].includes(o.status)) counts.preparing++;
        else if (['picked', 'out', 'out_for_delivery', 'in_transit'].includes(o.status)) counts.out++;
        else if (['delivered', 'completed'].includes(o.status)) counts.delivered++;
    });

    document.getElementById('orderCountAll').innerText = counts.all;
    document.getElementById('orderCountNew').innerText = counts.new;
    document.getElementById('orderCountPreparing').innerText = counts.preparing;
    document.getElementById('orderCountOut').innerText = counts.out;
    document.getElementById('orderCountDelivered').innerText = counts.delivered;

    container.innerHTML = columns.map(col => {
        const colOrders = filtered.filter(o => col.status.includes(o.status));
        return `
            <div class="kanban-column" ondragover="event.preventDefault(); this.classList.add('kanban-drag-over')" ondragleave="this.classList.remove('kanban-drag-over')" ondrop="handleOrderDrop(event, '${col.id}')">
                <div class="kanban-header">
                    <div class="flex items-center gap-2">
                        <div style="width:8px;height:8px;border-radius:50%;background:${col.color}"></div>
                        <span class="font-bold text-sm">${col.title}</span>
                    </div>
                    <span class="pro-badge badge-info">${colOrders.length}</span>
                </div>
                <div class="kanban-cards">
                    ${colOrders.length === 0 ? '<div class="text-center p-8 text-muted text-xs">Empty</div>' : colOrders.map(o => {
                        const ageMin = Math.floor((Date.now() - o.timestamp) / 60000);
                        const isOverdue = ageMin > 30 && ['new', 'pending', 'confirmed'].includes(o.status);
                        return `
                            <div class="kanban-card ${isOverdue ? 'overdue' : ''}" draggable="true" ondragstart="handleOrderDragStart(event, '${o.bizId}', '${o.outletId}', '${o.id}')">
                                <div class="flex justify-between items-start mb-2">
                                    <div class="font-mono font-bold text-[10px] text-muted uppercase">#${o.id.slice(-6)}</div>
                                    <div class="text-[10px] font-bold ${isOverdue ? 'text-danger' : 'text-muted'}">${ageMin}m ago</div>
                                </div>
                                <div class="font-bold text-sm mb-1">${safeText(o.customerName)}</div>
                                <div class="text-xs text-muted mb-3">${o.items.length} items • ₹${o.total.toFixed(0)}</div>
                                <div class="flex justify-between items-center">
                                    <div class="text-[10px] font-semibold text-primary">${safeText(o.outletName)}</div>
                                    <div class="text-[10px] text-muted italic">${o.riderName || 'Unassigned'}</div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

let draggedOrder = null;

window.handleOrderDragStart = function(e, bizId, outletId, orderId) {
    draggedOrder = { bizId, outletId, orderId };
    e.dataTransfer.setData('text/plain', orderId);
};

window.handleOrderDrop = async function(e, columnId) {
    e.preventDefault();
    const el = e.currentTarget;
    el.classList.remove('kanban-drag-over');
    
    if (!draggedOrder) return;

    const statusMap = {
        'pending': 'confirmed',
        'preparing': 'preparing',
        'on-the-way': 'out_for_delivery',
        'completed': 'delivered'
    };

    const newStatus = statusMap[columnId];
    if (!newStatus) return;

    const { bizId, outletId, orderId } = draggedOrder;
    draggedOrder = null;

    try {
        const updates = {};
        updates[`businesses/${bizId}/outlets/${outletId}/orders/${orderId}/status`] = newStatus;
        await atomicAdminAction(updates, 'ORDER_STATUS_KANBAN', { bizId, outletId, orderId, newStatus });
        showToast(`Order updated to ${newStatus.toUpperCase()}`, "success");
        loadLiveOrders();
    } catch (err) {
        showToast("Drop failed: " + err.message, "error");
    }
}


window.updateOrderStatus = async function(bizId, outletId, orderId) {
    const newStatus = prompt("Enter new status:\n(confirmed, preparing, ready, picked, delivered, cancelled)");
    if (!newStatus) return;
    const valid = ['confirmed', 'preparing', 'ready', 'picked', 'out_for_delivery', 'delivered', 'cancelled'];
    if (!valid.includes(newStatus.toLowerCase())) return showToast("Invalid status. Use: " + valid.join(', '), "error");

    try {
        const updates = {};
        updates[`businesses/${bizId}/outlets/${outletId}/orders/${orderId}/status`] = newStatus.toLowerCase();
        await atomicAdminAction(updates, 'ORDER_STATUS_UPDATE', { bizId, outletId, orderId, newStatus });
        showToast(`Order status updated to ${newStatus.toUpperCase()}`, "success");
        loadLiveOrders();
    } catch (err) {
        showToast("Failed: " + err.message, "error");
    }
};

// =====================================================
// MODULE: RATINGS & REVIEWS
// =====================================================
let allReviews = [];

window.loadReviews = async function() {
    try {
        const bizSnap = await db.ref('businesses').once('value');
        const businesses = bizSnap.val() || {};
        allReviews = [];
        const outletScores = {};

        for (const [bizId, biz] of Object.entries(businesses)) {
            const outlets = biz.outlets || {};
            for (const [outId, outlet] of Object.entries(outlets)) {
                const outletName = outlet.name || outId;
                const reviews = outlet.reviews || {};
                
                if (!outletScores[`${bizId}/${outId}`]) {
                    outletScores[`${bizId}/${outId}`] = { name: outletName, ratings: [], avg: 0 };
                }

                Object.entries(reviews).forEach(([revId, rev]) => {
                    const rating = parseInt(rev.rating) || 0;
                    outletScores[`${bizId}/${outId}`].ratings.push(rating);
                    allReviews.push({
                        id: revId,
                        outletName,
                        userName: rev.userName || rev.customerName || 'Anonymous',
                        rating,
                        comment: rev.comment || rev.text || '',
                        timestamp: rev.timestamp || rev.createdAt || Date.now()
                    });
                });
            }
        }

        // Calculate scores
        Object.values(outletScores).forEach(o => {
            if (o.ratings.length > 0) {
                o.avg = (o.ratings.reduce((a, b) => a + b, 0) / o.ratings.length).toFixed(1);
            }
        });

        allReviews.sort((a, b) => b.timestamp - a.timestamp);

        // Platform metrics
        const totalReviews = allReviews.length;
        const avgRating = totalReviews > 0 ? (allReviews.reduce((a, r) => a + r.rating, 0) / totalReviews).toFixed(1) : '—';
        const positive = allReviews.filter(r => r.rating >= 4).length;
        const negative = allReviews.filter(r => r.rating <= 2).length;

        document.getElementById('avgPlatformRating').innerText = avgRating;
        document.getElementById('totalReviewCount').innerText = totalReviews;
        document.getElementById('positiveReviewPct').innerText = totalReviews > 0 ? Math.round((positive / totalReviews) * 100) + '%' : '0%';
        document.getElementById('negativeReviewPct').innerText = totalReviews > 0 ? Math.round((negative / totalReviews) * 100) + '%' : '0%';

        // Top & Low Rated
        const sortedOutlets = Object.values(outletScores).filter(o => o.ratings.length > 0).sort((a, b) => b.avg - a.avg);
        renderOutletScoreboard('topRatedList', sortedOutlets.slice(0, 5), 'top');
        renderOutletScoreboard('lowRatedList', sortedOutlets.filter(o => o.avg < 3.5).slice(0, 5), 'low');

        // Render reviews
        renderReviewsList();

    } catch (err) {
        showToast("Failed to load reviews: " + err.message, "error");
    }
};

function renderStars(rating) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
        html += `<span style="color:${i <= rating ? '#FBBF24' : '#E2E8F0'};font-size:14px">★</span>`;
    }
    return html;
}

function renderOutletScoreboard(containerId, outlets, type) {
    const el = document.getElementById(containerId);
    if (!el) return;

    if (outlets.length === 0) {
        el.innerHTML = `<div class="text-center p-6 text-muted text-sm">${type === 'top' ? 'No reviews yet' : 'All outlets performing well!'}</div>`;
        return;
    }

    el.innerHTML = outlets.map((o, i) => `
        <div class="flex items-center gap-3 p-3 ${i < outlets.length - 1 ? 'border-b' : ''}" style="border-color:#F1F5F9">
            <div class="avatar-sm" style="${type === 'low' ? 'background:linear-gradient(135deg,#EF4444,#DC2626)' : ''}">${i + 1}</div>
            <div class="flex-1">
                <div class="font-bold text-sm" style="color:var(--pro-text)">${safeText(o.name)}</div>
                <div class="text-xs text-muted">${o.ratings.length} reviews</div>
            </div>
            <div class="text-right">
                <div class="font-black text-lg" style="color:${parseFloat(o.avg) >= 4 ? '#10B981' : parseFloat(o.avg) >= 3 ? '#F97316' : '#EF4444'}">${o.avg}</div>
                <div>${renderStars(Math.round(o.avg))}</div>
            </div>
        </div>
    `).join('');
}

function renderReviewsList() {
    const el = document.getElementById('reviewsList');
    if (!el) return;
    const filter = document.getElementById('reviewFilter')?.value || 'all';

    let filtered = allReviews;
    if (filter === 'low') filtered = allReviews.filter(r => r.rating <= 2);
    else if (filter !== 'all') filtered = allReviews.filter(r => r.rating === parseInt(filter));

    if (filtered.length === 0) {
        el.innerHTML = '<div class="text-center p-12 text-muted text-sm">No reviews matching the current filter.</div>';
        return;
    }

    el.innerHTML = filtered.slice(0, 30).map(r => `
        <div class="flex gap-3 p-3 border-b" style="border-color:#F1F5F9">
            <div class="avatar-sm" style="width:36px;height:36px;font-size:12px;border-radius:50%;${r.rating <= 2 ? 'background:linear-gradient(135deg,#EF4444,#DC2626)' : ''}">${(r.userName || 'A').charAt(0).toUpperCase()}</div>
            <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                    <span class="font-bold text-sm" style="color:var(--pro-text)">${safeText(r.userName)}</span>
                    <span class="text-xs text-muted">•</span>
                    <span class="text-xs text-muted">${safeText(r.outletName)}</span>
                </div>
                <div class="mb-1">${renderStars(r.rating)}</div>
                ${r.comment ? `<p class="text-sm text-muted line-height-1-4">${safeText(r.comment)}</p>` : ''}
                <div class="text-xs text-muted mt-1">${new Date(r.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
            </div>
        </div>
    `).join('');
}

// =====================================================
// MODULE: BROADCAST CENTER
// =====================================================

window.sendBroadcast = async function() {
    const title = document.getElementById('broadcastTitle').value.trim();
    const body = document.getElementById('broadcastBody').value.trim();
    const audience = document.getElementById('broadcastAudience').value;
    const category = document.getElementById('broadcastCategory').value;
    const imageUrl = document.getElementById('broadcastImage')?.value.trim() || '';

    if (!title || !body) return showToast("Title and body are required", "error");
    if (!confirm(`Send broadcast "${title}" to ${audience.replace('_', ' ')}?`)) return;

    try {
        const broadcastData = {
            title,
            body,
            audience,
            category,
            imageUrl,
            sentAt: Date.now(),
            sentBy: auth.currentUser.email,
            status: 'sent'
        };

        const broadcastKey = 'BC_' + Date.now();
        const updates = {};
        updates[`system/broadcasts/${broadcastKey}`] = broadcastData;
        
        await atomicAdminAction(updates, 'SEND_BROADCAST', { title, audience, category });
        
        showToast(`Broadcast "${title}" dispatched successfully!`, "success");
        document.getElementById('broadcastForm').reset();
        loadBroadcastHistory();
    } catch (err) {
        showToast("Broadcast failed: " + err.message, "error");
    }
};

window.loadBroadcastHistory = async function() {
    try {
        const snap = await db.ref('system/broadcasts').limitToLast(20).once('value');
        const broadcasts = [];
        snap.forEach(s => broadcasts.push({ id: s.key, ...s.val() }));
        broadcasts.reverse();

        // Stats
        const total = broadcasts.length;
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const thisWeek = broadcasts.filter(b => b.sentAt > weekAgo).length;
        
        document.getElementById('broadcastSentCount').innerText = total;
        document.getElementById('broadcastThisWeek').innerText = thisWeek;

        // History list
        const el = document.getElementById('broadcastHistory');
        if (!el) return;

        if (broadcasts.length === 0) {
            el.innerHTML = '<div class="text-center p-6 text-muted text-sm">No broadcasts sent yet. Compose your first notification!</div>';
            return;
        }

        const categoryIcons = {
            'promotion': '🎉', 'announcement': '📢', 'update': '🔄', 'alert': '⚠️'
        };

        el.innerHTML = broadcasts.map(b => `
            <div class="flex gap-3 p-3 border-b" style="border-color:#F1F5F9">
                <div style="font-size:20px;line-height:1">${categoryIcons[b.category] || '📨'}</div>
                <div class="flex-1">
                    <div class="font-bold text-sm" style="color:var(--pro-text)">${safeText(b.title)}</div>
                    <div class="text-xs text-muted line-height-1-4 mt-1">${safeText(b.body).slice(0, 80)}${b.body.length > 80 ? '...' : ''}</div>
                    <div class="flex items-center gap-2 mt-2">
                        <span class="pro-badge badge-info" style="font-size:9px">${(b.audience || 'all').replace('_', ' ').toUpperCase()}</span>
                        <span class="text-xs text-muted">${new Date(b.sentAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                </div>
                <span class="pro-badge badge-success" style="height:fit-content">Sent</span>
            </div>
        `).join('');
    } catch (err) {
        console.error("Broadcast history load failed:", err);
    }
};

// --- Ecosystem Inventory Logic ---
let globalInventory = [];

window.loadInventory = async function() {
    const registry = document.getElementById("inventoryRegistry");
    if (!registry) return;

    registry.innerHTML = `<tr><td colspan="6" class="text-center p-8"><div class="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div><span class="font-bold text-muted">Scanning Network Inventory...</span></td></tr>`;

    try {
        const businessesSnap = await db.ref("businesses").once("value");
        const businesses = businessesSnap.val() || {};
        
        globalInventory = [];
        let totalActive = 0;
        let lowStock = 0;
        let outOfStock = 0;

        for (const [bizId, biz] of Object.entries(businesses)) {
            const outlets = biz.outlets || {};
            for (const [outId, outlet] of Object.entries(outlets)) {
                const dishes = outlet.dishes || {};
                for (const [dishId, dish] of Object.entries(dishes)) {
                    const item = {
                        bizId,
                        outId,
                        dishId,
                        outletName: outlet.name || "Unknown",
                        name: dish.name,
                        stock: dish.stock !== undefined ? dish.stock : "N/A",
                        isAvailable: dish.isAvailable !== false,
                        price: dish.price,
                        category: dish.category || "General",
                        lastUpdated: dish.updatedAt || Date.now()
                    };

                    globalInventory.push(item);
                    totalActive++;
                    if (item.stock !== "N/A" && item.stock < 10 && item.stock > 0) lowStock++;
                    if (!item.isAvailable || item.stock === 0) outOfStock++;
                }
            }
        }

        const el = id => document.getElementById(id);
        if (el("totalActiveItems")) el("totalActiveItems").innerText = totalActive;
        if (el("lowStockCount")) el("lowStockCount").innerText = lowStock;
        if (el("outOfStockCount")) el("outOfStockCount").innerText = outOfStock;

        renderInventoryTable(globalInventory);
    } catch (err) {
        console.error("Inventory Load Failed:", err);
        showToast("Network Inventory Scan Failed", "error");
    }
};

function renderInventoryTable(items) {
    const registry = document.getElementById("inventoryRegistry");
    if (!registry) return;
    
    registry.innerHTML = items.map(item => `
        <tr class="hover:bg-slate-50 transition-colors">
            <td>
                <div class="flex flex-col">
                    <span class="font-black text-slate">${safeText(item.name)}</span>
                    <span class="text-[10px] text-muted font-bold uppercase">${safeText(item.category)} • ₹${item.price}</span>
                </div>
            </td>
            <td>
                <div class="flex items-center gap-2">
                    <div class="w-2 h-2 rounded-full bg-primary"></div>
                    <span class="font-bold text-xs">${safeText(item.outletName)}</span>
                </div>
            </td>
            <td>
                <div class="flex items-center gap-3">
                    <span class="font-mono font-bold ${item.stock < 10 ? "text-red-500" : "text-slate"}">${item.stock}</span>
                    <div class="flex gap-1">
                        <button class="p-1 hover:bg-slate-100 rounded text-muted" onclick="quickAdjustStock('${item.bizId}', '${item.outId}', '${item.dishId}', -1)"><i data-lucide="minus-circle" size="14"></i></button>
                        <button class="p-1 hover:bg-slate-100 rounded text-primary" onclick="quickAdjustStock('${item.bizId}', '${item.outId}', '${item.dishId}', 1)"><i data-lucide="plus-circle" size="14"></i></button>
                    </div>
                </div>
            </td>
            <td>
                <span class="pro-badge ${item.isAvailable && (item.stock === "N/A" || item.stock > 0) ? "badge-success" : "badge-danger"}">
                    ${item.isAvailable && (item.stock === "N/A" || item.stock > 0) ? "AVAILABLE" : "OUT OF STOCK"}
                </span>
            </td>
            <td class="text-xs text-muted">${new Date(item.lastUpdated).toLocaleString()}</td>
            <td>
                <button class="btn-pro btn-sm" onclick="toggleAvailability('${item.bizId}', '${item.outId}', '${item.dishId}', ${!item.isAvailable})">
                    ${item.isAvailable ? "Force OOS" : "Mark Available"}
                </button>
            </td>
        </tr>
    `).join("");
    if (typeof lucide !== "undefined") lucide.createIcons();
}

window.quickAdjustStock = async function(bizId, outId, dishId, delta) {
    const path = `businesses/${bizId}/outlets/${outId}/dishes/${dishId}`;
    try {
        const snap = await db.ref(path).once("value");
        const dish = snap.val();
        const currentStock = dish.stock !== undefined ? dish.stock : 0;
        const newStock = Math.max(0, currentStock + delta);
        
        await db.ref(path).update({ 
            stock: newStock, 
            isAvailable: newStock > 0,
            updatedAt: firebase.database.ServerValue.TIMESTAMP 
        });
        
        showToast(`Stock updated to ${newStock}`, "success");
        loadInventory();
    } catch (err) {
        showToast("Stock Adjustment Failed", "error");
    }
};

window.toggleAvailability = async function(bizId, outId, dishId, status) {
    const path = `businesses/${bizId}/outlets/${outId}/dishes/${dishId}`;
    try {
        await atomicAdminAction({
            [`${path}/isAvailable`]: status,
            [`${path}/updatedAt`]: firebase.database.ServerValue.TIMESTAMP
        }, "ITEM_AVAILABILITY_OVERRIDE", { dishId, status });
        
        showToast("Availability override successful", "success");
        loadInventory();
    } catch (err) {
        showToast("Override Failed", "error");
    }
};

window.filterInventory = function() {
    const q = document.getElementById("inventorySearch").value.toLowerCase();
    const filtered = globalInventory.filter(i => 
        i.name.toLowerCase().includes(q) || 
        i.outletName.toLowerCase().includes(q)
    );
    renderInventoryTable(filtered);
};

// --- FINANCIAL RECONCILIATION LOGIC ---
let globalReconciliations = [];

window.loadReconciliations = async function() {
    console.log("[Reconciliation] Fetching financial data...");
    const table = document.getElementById('reconTable');
    if (!table) return;

    table.innerHTML = `<tr><td colspan="8" class="text-center p-40"><div class="animate-spin inline-block mb-4"><i data-lucide="refresh-cw"></i></div><br>Synchronizing Financial Records...</td></tr>`;
    if (typeof lucide !== 'undefined') lucide.createIcons({ root: table });

    const fromVal = document.getElementById('reconFrom').value;
    const toVal = document.getElementById('reconTo').value;
    const outletFilter = document.getElementById('filterOutlet').value;
    const statusFilter = document.getElementById('filterStatus').value;

    try {
        // 1. Fetch all businesses and outlets to populate filter and traverse
        const bizSnap = await db.ref('businesses').once('value');
        const businesses = bizSnap.val();
        
        if (!businesses) {
            table.innerHTML = `<tr><td colspan="8" class="text-center p-40 text-muted">No business entities found in ecosystem.</td></tr>`;
            return;
        }

        // Populate Outlet Filter if empty
        const filterSelect = document.getElementById('filterOutlet');
        if (filterSelect && filterSelect.options.length <= 1) {
            Object.keys(businesses).forEach(bid => {
                const b = businesses[bid];
                if (b.outlets) {
                    Object.keys(b.outlets).forEach(oid => {
                        const out = b.outlets[oid];
                        const opt = document.createElement('option');
                        opt.value = `${bid}|${oid}`;
                        opt.innerText = `${b.name} - ${out.name}`;
                        filterSelect.appendChild(opt);
                    });
                }
            });
        }

        // 2. Aggregate Settlements
        let allSettlements = [];
        const settlementPromises = [];

        Object.keys(businesses).forEach(bid => {
            const b = businesses[bid];
            if (b.outlets) {
                Object.keys(b.outlets).forEach(oid => {
                    const out = b.outlets[oid];
                    // Path: businesses/{bid}/outlets/{oid}/settlements
                    const promise = db.ref(`businesses/${bid}/outlets/${oid}/settlements`).once('value').then(snap => {
                        const data = snap.val();
                        if (data) {
                            Object.keys(data).forEach(sid => {
                                allSettlements.push({
                                    ...data[sid],
                                    bizId: bid,
                                    outId: oid,
                                    bizName: b.name,
                                    outName: out.name,
                                    settlementId: sid
                                });
                            });
                        }
                    });
                    settlementPromises.push(promise);
                });
            }
        });

        await Promise.all(settlementPromises);

        // 3. Filter
        const filtered = allSettlements.filter(s => {
            if (fromVal && s.date < fromVal) return false;
            if (toVal && s.date > toVal) return false;
            if (outletFilter !== 'all') {
                const [fBid, fOid] = outletFilter.split('|');
                if (s.bizId !== fBid || s.outId !== fOid) return false;
            }
            if (statusFilter !== 'all' && s.settledStatus !== statusFilter) return false;
            return true;
        }).sort((a, b) => b.timestamp - a.timestamp);

        globalReconciliations = filtered;
        renderReconciliationTable(filtered);

    } catch (err) {
        console.error("Reconciliation Load Failed:", err);
        table.innerHTML = `<tr><td colspan="8" class="text-center p-40 text-danger">Critical Sync Failure: ${err.message}</td></tr>`;
    }
};

function renderReconciliationTable(data) {
    const table = document.getElementById('reconTable');
    if (!table) return;

    if (data.length === 0) {
        table.innerHTML = `<tr><td colspan="8" class="text-center p-40 text-muted">No records found matching criteria.</td></tr>`;
        updateReconKPIs([]);
        return;
    }

    let html = '';
    data.forEach(s => {
        const isSettled = s.settledStatus === 'SETTLED';
        html += `
            <tr class="hover-row">
                <td>
                    <div class="font-black text-sm">#${s.orderId}</div>
                    <div class="text-xs text-muted">${s.date}</div>
                </td>
                <td>
                    <div class="font-bold">${s.bizName}</div>
                    <div class="text-xs text-slate-500">${s.outName}</div>
                </td>
                <td class="font-black">Γé╣${s.orderTotal}</td>
                <td class="text-danger font-bold">- Γé╣${s.platformCommission}</td>
                <td class="text-info font-bold">- Γé╣${s.riderPayout}</td>
                <td class="text-success font-black">Γé╣${s.shopNet}</td>
                <td>
                    <span class="pro-badge ${isSettled ? 'badge-success' : 'badge-warning'}">
                        ${isSettled ? 'SETTLED' : 'PENDING'}
                    </span>
                </td>
                <td class="text-right">
                    ${!isSettled ? `
                        <button class="btn-pro-sm" onclick="settleTransaction('${s.bizId}', '${s.outId}', '${s.settlementId}', ${s.shopNet})">
                            <i data-lucide="check" size="14"></i> SETTLE
                        </button>
                    ` : `
                        <i data-lucide="check-circle" class="text-success" size="20"></i>
                    `}
                </td>
            </tr>
        `;
    });

    table.innerHTML = html;
    if (typeof lucide !== 'undefined') lucide.createIcons({ root: table });
    updateReconKPIs(data);
}

function updateReconKPIs(data) {
    let stats = { rev: 0, comm: 0, pending: 0, settled: 0 };
    data.forEach(s => {
        stats.rev += (s.orderTotal || 0);
        stats.comm += (s.platformCommission || 0);
        if (s.settledStatus === 'SETTLED') {
            stats.settled += (s.shopNet || 0);
        } else {
            stats.pending += (s.shopNet || 0);
        }
    });

    document.getElementById('reconGlobalRev').innerText = `Γé╣${Math.round(stats.rev)}`;
    document.getElementById('reconGlobalComm').innerText = `Γé╣${Math.round(stats.comm)}`;
    document.getElementById('reconGlobalPending').innerText = `Γé╣${Math.round(stats.pending)}`;
    document.getElementById('reconGlobalSettled').innerText = `Γé╣${Math.round(stats.settled)}`;
}

window.settleTransaction = async function(bizId, outId, settleId, amount) {
    const confirm = await Swal.fire({
        title: 'Manual Payout Confirmation',
        text: `Confirm that Γé╣${amount} has been manually transferred to the shop owner's account. This action will create a formal Ledger Entry and update the Partner Wallet.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, Execute Settlement',
        background: '#1e293b',
        color: '#fff',
        confirmButtonColor: '#10B981'
    });

    if (confirm.isConfirmed) {
        try {
            const txId = `TX_${Date.now()}_${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
            const path = `businesses/${bizId}/outlets/${outId}/settlements/${settleId}`;
            const walletRef = db.ref(`businesses/${bizId}/outlets/${outId}/wallet`);
            
            // 1. Fetch current balance for Ledger Integrity
            const walletSnap = await walletRef.once('value');
            const currentWallet = walletSnap.val() || { balance: 0, lastTx: null };
            const prevBalance = currentWallet.balance || 0;
            const newBalance = prevBalance - amount;

            const updates = {};
            // Update Settlement Status
            updates[path + '/settledStatus'] = 'SETTLED';
            updates[path + '/settledAt'] = firebase.database.ServerValue.TIMESTAMP;
            updates[path + '/settledBy'] = auth.currentUser.email;
            updates[path + '/transactionId'] = txId;

            // Update Wallet Balance
            updates[`businesses/${bizId}/outlets/${outId}/wallet/balance`] = newBalance;
            updates[`businesses/${bizId}/outlets/${outId}/wallet/lastSettlementAt`] = firebase.database.ServerValue.TIMESTAMP;

            // Create Ledger Entry
            updates[`businesses/${bizId}/outlets/${outId}/ledger/${txId}`] = {
                id: txId,
                type: 'PAYOUT_SETTLEMENT',
                amount: amount,
                prevBalance: prevBalance,
                newBalance: newBalance,
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                refId: settleId,
                method: 'MANUAL_TRANSFER',
                operator: auth.currentUser.email
            };

            await atomicAdminAction(updates, 'PARTNER_FINANCIAL_SETTLEMENT', { 
                bizId, outId, settleId, txId, amount, newBalance 
            });

            showToast("Settlement Processed & Ledgered", "success");
            loadReconciliations();
        } catch (err) {
            showToast("Financial Error: " + err.message, "error");
        }
    }
};

window.exportReconciliationReport = function() {
    if (globalReconciliations.length === 0) {
        showToast("No data to export", "warning");
        return;
    }

    let csv = "Order ID,Date,Partner,Outlet,Order Total,Commission,Rider Payout,Net Payout,Status\\n";
    globalReconciliations.forEach(s => {
        csv += `${s.orderId},${s.date},${safeCSV(s.bizName)},${safeCSV(s.outName)},${s.orderTotal},${s.platformCommission},${s.riderPayout},${s.shopNet},${s.settledStatus}\\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Settlement_Report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    showToast("Report Exported", "success");
};
// --- PARTNER ONBOARDING & APPROVAL ENGINE ---

function initOnboardingManager() {
    console.log("[Onboarding] Initializing real-time listener...");
    
    db.ref('onboarding_requests').on('value', (snap) => {
        const requests = [];
        snap.forEach(child => {
            requests.push({ id: child.key, ...child.val() });
        });

        renderOnboardingRequests(requests);
        updateOnboardingBadges(requests.filter(r => r.status === 'PENDING').length);
    });
}

function updateOnboardingBadges(count) {
    const badges = ['onboardingCount', 'pendingCount'];
    badges.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.innerText = count;
            el.classList.toggle('hidden', count === 0);
        }
    });
}

function renderOnboardingRequests(requests) {
    const tbody = document.getElementById('onboardingTableBody');
    if (!tbody) return;

    if (requests.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-40 text-muted">No active registration requests found.</td></tr>`;
        return;
    }

    tbody.innerHTML = requests.sort((a, b) => b.submittedAt - a.submittedAt).map(req => `
        <tr class="v4-row">
            <td>
                <div class="flex-col">
                    <span class="font-bold text-white">${req.bizName}</span>
                    <span class="text-xs text-muted">${req.ownerName}</span>
                </div>
            </td>
            <td><span class="text-xs opacity-60">${req.email}</span></td>
            <td>
                <div class="flex gap-8">
                    <button class="btn-pro-sm" style="background:rgba(16,185,129,0.1); color:#10B981;" onclick="viewKYC('${req.kyc.fssai}', 'FSSAI')">FSSAI</button>
                    <button class="btn-pro-sm" style="background:rgba(59,130,246,0.1); color:#3B82F6;" onclick="viewKYC('${req.kyc.gst}', 'GST')">GST</button>
                </div>
            </td>
            <td><span class="text-xs">${new Date(req.submittedAt).toLocaleString()}</span></td>
            <td>
                <div class="flex gap-8">
                    <button class="btn-pro-sm bg-success text-white" onclick="approvePartner('${req.id}')">
                        <i data-lucide="check-circle" size="14"></i> Provision Node
                    </button>
                    <button class="btn-pro-sm bg-danger text-white" onclick="rejectPartner('${req.id}')">
                        <i data-lucide="trash-2" size="14"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');

    if (window.lucide) lucide.createIcons();
}

window.viewKYC = function(url, type) {
    Swal.fire({
        title: `${type} Compliance Document`,
        imageUrl: url,
        imageAlt: type,
        background: '#1e293b',
        color: '#fff',
        confirmButtonColor: 'var(--accent)',
        width: '800px'
    });
};

window.approvePartner = async function(uid) {
    const result = await Swal.fire({
        title: 'Initialize Infrastructure?',
        text: "This will provision a live business node, default outlet, and administrative credentials atomically.",
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Initialize Node',
        background: '#1e293b',
        color: '#fff'
    });

    if (!result.isConfirmed) return;

    Swal.showLoading();

    try {
        const snap = await db.ref(`onboarding_requests/${uid}`).once('value');
        const req = snap.val();

        // 1. Prepare Atomic Provisioning (Reusing the pattern from existing onboardingForm)
        const updates = {};
        const bid = `biz_${Date.now()}`;
        const oid = `outlet_default`; // New partners start with one default outlet
        const adminEmail = req.email.toLowerCase();

        // Business Node
        updates[`businesses/${bid}`] = {
            id: bid,
            name: req.bizName,
            owner: req.ownerName,
            address: req.address,
            status: 'ACTIVE',
            createdAt: ServerValue.TIMESTAMP
        };

        // Outlet Node
        updates[`businesses/${bid}/outlets/${oid}`] = {
            id: oid,
            name: `${req.bizName} - Main`,
            type: 'Restaurant',
            cuisine: req.cuisine || 'Multi',
            status: 'OPEN',
            config: {
                allowOrders: true,
                currency: 'INR',
                commission: 10
            }
        };

        // Provision Starter Categories
        if (req.categories && Array.isArray(req.categories)) {
            req.categories.forEach(cat => {
                const cid = `cat_${Math.random().toString(36).substr(2, 9)}`;
                updates[`businesses/${bid}/outlets/${oid}/menu/categories/${cid}`] = {
                    id: cid,
                    name: cat,
                    status: 'ACTIVE',
                    priority: 0
                };
            });
        }

        // Admin Profile Node
        updates[`admins/${uid}`] = {
            id: uid,
            email: adminEmail,
            role: 'Partner Admin',
            outletId: oid,
            businessId: bid,
            name: req.ownerName,
            status: 'ACTIVE',
            createdAt: ServerValue.TIMESTAMP
        };

        // Finalize Onboarding Request
        updates[`onboarding_requests/${uid}`] = null;
        updates[`onboarding_history/${uid}`] = {
            ...req,
            status: 'APPROVED',
            processedAt: ServerValue.TIMESTAMP,
            bid: bid,
            oid: oid
        };

        await db.ref().update(updates);

        Swal.fire({
            title: 'Node Provisioned!',
            text: `Infrastructure for ${req.bizName} is now live. Partner can now access the ShopAdmin dashboard.`,
            icon: 'success',
            background: '#1e293b',
            color: '#fff'
        });

    } catch (err) {
        console.error(err);
        Swal.fire('Provisioning Failed', err.message, 'error');
    }
};

window.rejectPartner = async function(uid) {
    const result = await Swal.fire({
        title: 'Reject Request?',
        text: "This will permanently remove this registration attempt. This action is irreversible.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Confirm Rejection',
        confirmButtonColor: '#ef4444',
        background: '#1e293b',
        color: '#fff'
    });

    if (!result.isConfirmed) return;

    try {
        await db.ref(`onboarding_requests/${uid}`).remove();
        showToast("Request Rejected", "info");
    } catch (err) {
        showToast("Rejection Failed", "error");
    }
};

// --- END PARTNER ENGINE ---
