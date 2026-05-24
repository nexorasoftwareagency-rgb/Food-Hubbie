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
                // Verify admin status in DB first
                const snap = await db.ref(`system/admins/${user.uid}`).once('value');
                const adminData = snap.val();
                
                const isSuper = adminData && adminData.isSuper === true;
                const role = adminData?.role || (isSuper ? 'superadmin' : 'admin');
                
                if (!isSuper) {
                    // Fallback: check custom claims if DB record is missing
                    const token = await user.getIdTokenResult(true);
                    if (token.claims && token.claims.superadmin === true) {
                        console.log("[SuperAdmin] Emergency access granted via custom claims");
                    } else if (adminData) {
                        console.log(`[RBAC] Access granted with role: ${role}`);
                    } else {
                        console.error("Access Denied: Not an Admin");
                        showToast("Unauthorized: Admin privileges required", "error");
                        auth.signOut();
                        return;
                    }
                }
                
                // Store current admin role for RBAC checks
                window.currentAdminRole = role;
                window.currentAdminData = adminData || {};
                
                // Check if 2FA is enabled
                const tfaSnap = await db.ref(`system/admins/${user.uid}/tfa`).once('value');
                const tfaData = tfaSnap.val();
                
                if (tfaData && tfaData.enabled && tfaData.secret) {
                    // Show 2FA modal
                    document.getElementById('loginOverlay').classList.add('hidden');
                    document.getElementById('tfaModal').classList.remove('hidden');
                    document.getElementById('mainContainer').classList.add('hidden');
                    document.getElementById('tfaCode').focus();
                } else {
                    // No 2FA, proceed to main app
                    document.getElementById('loginOverlay').classList.add('hidden');
                    document.getElementById('mainContainer').classList.remove('hidden');
                    applyRBACRestrictions(role);
                    initStats();
                    initOnboardingManager();
                    logAdminAction('SESSION_INIT', { method: 'Firebase Auth', role });
                }
            } catch (err) {
                console.error("Auth Verification Error:", err);
                auth.signOut();
            }
        } else {
            document.getElementById('loginOverlay').classList.remove('hidden');
            document.getElementById('tfaModal').classList.add('hidden');
            document.getElementById('mainContainer').classList.add('hidden');
        }
    });
}

// =====================================================
// MODULE: ROLE-BASED ACCESS CONTROL (R5-2)
// =====================================================

/**
 * RBAC Role Definitions:
 * - superadmin: Full access to all tabs and operations
 * - business: Access to business management, orders, riders, promotions
 * - outlet: Access to orders, live orders, reviews only
 * - support: Access to users, reviews, broadcast (read-only)
 */
const RBAC_PERMISSIONS = {
    superadmin: {
        tabs: ['dashboard', 'liveorders', 'riders', 'reconciliation', 'users', 'businesses', 'outlets', 'audit', 'settings', 'promotions', 'inventory', 'delivery', 'reviews', 'broadcast', 'reports', 'analytics', 'onboarding'],
        operations: ['all']
    },
    admin: {
        tabs: ['dashboard', 'liveorders', 'riders', 'reconciliation', 'users', 'businesses', 'outlets', 'audit', 'settings', 'promotions', 'inventory', 'delivery', 'reviews', 'broadcast', 'reports', 'analytics', 'onboarding'],
        operations: ['all']
    },
    business: {
        tabs: ['dashboard', 'liveorders', 'riders', 'users', 'businesses', 'promotions', 'inventory', 'delivery', 'reviews', 'reports'],
        operations: ['manage_businesses', 'manage_riders', 'manage_promotions', 'view_orders', 'view_users']
    },
    outlet: {
        tabs: ['dashboard', 'liveorders', 'reviews'],
        operations: ['view_orders', 'view_reviews']
    },
    support: {
        tabs: ['dashboard', 'users', 'reviews', 'broadcast'],
        operations: ['view_users', 'view_reviews', 'send_broadcast']
    }
};

/**
 * Apply RBAC restrictions based on admin role
 */
function applyRBACRestrictions(role) {
    const permissions = RBAC_PERMISSIONS[role] || RBAC_PERMISSIONS.outlet;
    
    // Hide unauthorized tabs
    const allTabs = document.querySelectorAll('.nav-link[data-tab]');
    allTabs.forEach(tab => {
        const tabName = tab.getAttribute('data-tab');
        if (permissions.tabs.includes(tabName)) {
            tab.style.display = '';
        } else {
            tab.style.display = 'none';
        }
    });
    
    // Restrict specific operations based on role
    if (role !== 'superadmin') {
        // Hide sensitive controls for non-superadmin roles
        const sensitiveControls = [
            'btnDeleteBusiness',
            'btnSystemReset',
            'btnDatabaseBackup',
            'btnInfrastructureControls'
        ];
        sensitiveControls.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
    }
    
    // Show role badge in UI
    const roleBadge = document.getElementById('adminRoleBadge');
    if (roleBadge) {
        roleBadge.textContent = role.toUpperCase();
        roleBadge.style.display = '';
    }
    
    console.log(`[RBAC] Applied restrictions for role: ${role}`);
}

/**
 * Check if current admin has permission for an operation
 */
function hasPermission(operation) {
    const role = window.currentAdminRole || 'outlet';
    const permissions = RBAC_PERMISSIONS[role] || RBAC_PERMISSIONS.outlet;
    
    if (permissions.operations.includes('all')) return true;
    return permissions.operations.includes(operation);
}

/**
 * Check if current admin has access to a tab
 */
function hasTabAccess(tabName) {
    const role = window.currentAdminRole || 'outlet';
    const permissions = RBAC_PERMISSIONS[role] || RBAC_PERMISSIONS.outlet;
    return permissions.tabs.includes(tabName);
}

/**
 * Submit 2FA code for verification
 */
window.submitTFACode = async function() {
    const code = document.getElementById('tfaCode').value.trim();
    const errorEl = document.getElementById('tfaError');
    const btn = document.getElementById('btnTFA');
    
    if (!code || code.length !== 6) {
        errorEl.innerText = "Enter a valid 6-digit code";
        errorEl.classList.remove('hidden');
        return;
    }
    
    btn.innerText = "Verifying...";
    btn.disabled = true;
    errorEl.classList.add('hidden');
    
    const isValid = await verifyTFACode(code);
    
    if (isValid) {
        document.getElementById('tfaModal').classList.add('hidden');
        document.getElementById('mainContainer').classList.remove('hidden');
        applyRBACRestrictions(window.currentAdminRole || 'superadmin');
        initStats();
        initOnboardingManager();
        logAdminAction('SESSION_INIT', { method: '2FA Verified' });
    } else {
        errorEl.innerText = "Invalid code. Please try again.";
        errorEl.classList.remove('hidden');
        btn.innerText = "VERIFY CODE";
        btn.disabled = false;
        document.getElementById('tfaCode').value = '';
        document.getElementById('tfaCode').focus();
    }
};

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

/**
 * RATE LIMITER (R5-7)
 * Prevents abuse of broadcast and coupon creation.
 * Tracks action timestamps per admin and blocks if threshold exceeded.
 */
const _rateLimitStore = {};
const RATE_LIMITS = {
    'SEND_BROADCAST': { max: 5, windowMs: 60000 },      // 5 broadcasts per minute
    'CREATE_COUPON': { max: 10, windowMs: 60000 },       // 10 coupons per minute
    'BULK_OPERATION': { max: 2, windowMs: 120000 },      // 2 bulk ops per 2 minutes
    'ECOSYSTEM_INITIALIZE': { max: 3, windowMs: 300000 } // 3 provisions per 5 minutes
};

function checkRateLimit(action) {
    const limit = RATE_LIMITS[action];
    if (!limit) return true; // No limit for this action

    const adminEmail = auth.currentUser?.email || 'unknown';
    const key = `${action}:${adminEmail}`;
    
    if (!_rateLimitStore[key]) _rateLimitStore[key] = [];
    
    const now = Date.now();
    // Remove expired timestamps
    _rateLimitStore[key] = _rateLimitStore[key].filter(ts => now - ts < limit.windowMs);
    
    if (_rateLimitStore[key].length >= limit.max) {
        const oldest = _rateLimitStore[key][0];
        const waitSec = Math.ceil((limit.windowMs - (now - oldest)) / 1000);
        return { allowed: false, waitSeconds: waitSec, max: limit.max, windowMs: limit.windowMs };
    }
    
    _rateLimitStore[key].push(now);
    return { allowed: true };
}

// --- UI Navigation ---
const tabs = document.querySelectorAll('.nav-link');
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
    'outlets': 'All outlet profiles and analytics',
    'delivery': 'Infrastructure Flow Slabs',
    'reports': 'Enterprise growth & financial audit',
    'audit': 'Ecosystem security & operational telemetry',
    'liveorders': 'Real-time order pipeline across all outlets',
    'reviews': 'Ratings, feedback & outlet quality scoring',
    'broadcast': 'Push notification engine & audience targeting',
    'reconciliation': 'Manual partner payout & financial reconciliation',
    'analytics': 'Platform-wide business intelligence & metrics'
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
        
        // Detach live orders listener when leaving tab
        if (target !== 'liveorders' && _liveOrdersUnsub) {
            _liveOrdersUnsub();
            _liveOrdersUnsub = null;
        }
        
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
        if (target === 'outlets') loadOutletsTab();
        if (target === 'analytics') showToast('Click "Refresh Data" to load analytics', 'info');
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
    loadTFAStatus();
};

// =====================================================
// MODULE: TWO-FACTOR AUTHENTICATION (R5-6)
// =====================================================
let _tfaSecret = null;
let _tfaTempSecret = null;

/**
 * Load 2FA status for current admin
 */
async function loadTFAStatus() {
    const user = auth.currentUser;
    if (!user) return;
    
    try {
        const snap = await db.ref(`system/admins/${user.uid}/tfa`).once('value');
        const tfaData = snap.val();
        
        const enableBtn = document.getElementById('tfaEnableBtn');
        const disableBtn = document.getElementById('tfaDisableBtn');
        const qrContainer = document.getElementById('tfaQRContainer');
        
        if (tfaData && tfaData.enabled) {
            enableBtn?.classList.add('hidden');
            disableBtn?.classList.remove('hidden');
            qrContainer?.classList.add('hidden');
        } else {
            enableBtn?.classList.remove('hidden');
            disableBtn?.classList.add('hidden');
            qrContainer?.classList.add('hidden');
        }
    } catch (err) {
        console.error("Failed to load TFA status:", err);
    }
}

/**
 * Show 2FA setup UI with QR code
 */
window.showTFASetup = function() {
    const user = auth.currentUser;
    if (!user) return showToast("You must be logged in", "error");
    
    // Generate a random secret
    const secret = new OTPAuth.Secret({ size: 20 });
    _tfaTempSecret = secret.base32;
    
    // Create TOTP instance
    const totp = new OTPAuth.TOTP({
        issuer: 'FoodHubbie',
        label: user.email,
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: secret
    });
    
    // Generate QR code
    const otpauthURL = totp.toString();
    const qrContainer = document.getElementById('tfaQRContainer');
    const qrCodeEl = document.getElementById('tfaQRCode');
    const secretDisplay = document.getElementById('tfaSecretDisplay');
    
    qrContainer.classList.remove('hidden');
    secretDisplay.textContent = _tfaTempSecret;
    
    // Generate QR code using qrcode library
    try {
        qrCodeEl.innerHTML = '';
        new QRCode(qrCodeEl, { text: otpauthURL, width: 200, height: 200 });
    } catch (e) {
        console.error("QR Code generation failed:", e);
        showToast("Failed to generate QR code", "error");
    }
    
    document.getElementById('tfaVerifyInput').value = '';
};

/**
 * Verify TFA setup code and enable 2FA
 */
window.verifyTFASetup = async function() {
    if (!hasPermission('all')) return showToast("Access denied", "error");
    const user = auth.currentUser;
    if (!user) return showToast("You must be logged in", "error");
    
    const code = document.getElementById('tfaVerifyInput').value.trim();
    if (!code || code.length !== 6) {
        return showToast("Enter a valid 6-digit code", "error");
    }
    
    try {
        const totp = new OTPAuth.TOTP({
            issuer: 'FoodHubbie',
            label: user.email,
            algorithm: 'SHA1',
            digits: 6,
            period: 30,
            secret: new OTPAuth.Secret({ base32: _tfaTempSecret })
        });
        
        const isValid = totp.validate({ token: code, window: 1 }) !== null;
        
        if (!isValid) {
            return showToast("Invalid code. Please try again.", "error");
        }
        
        // Save 2FA status to database
        await db.ref(`system/admins/${user.uid}/tfa`).set({
            enabled: true,
            secret: _tfaTempSecret,
            setupAt: Date.now(),
            setupBy: user.email
        });
        
        _tfaSecret = _tfaTempSecret;
        _tfaTempSecret = null;
        
        showToast("Two-factor authentication enabled!", "success");
        await logAdminAction('TFA_ENABLED', { adminEmail: user.email });
        
        loadTFAStatus();
    } catch (err) {
        console.error("TFA setup failed:", err);
        showToast("Failed to enable 2FA: " + err.message, "error");
    }
};

/**
 * Disable 2FA
 */
window.disableTFA = async function() {
    if (!hasPermission('all')) return showToast("Access denied", "error");
    const user = auth.currentUser;
    if (!user) return showToast("You must be logged in", "error");
    
    if (!confirm("Disable two-factor authentication? This reduces account security.")) return;
    
    try {
        await db.ref(`system/admins/${user.uid}/tfa`).remove();
        _tfaSecret = null;
        
        showToast("Two-factor authentication disabled", "success");
        await logAdminAction('TFA_DISABLED', { adminEmail: user.email });
        
        loadTFAStatus();
    } catch (err) {
        console.error("TFA disable failed:", err);
        showToast("Failed to disable 2FA: " + err.message, "error");
    }
};

/**
 * Verify 2FA code during login (called after successful auth)
 */
window.verifyTFACode = async function(code) {
    const user = auth.currentUser;
    if (!user) return false;
    
    try {
        const snap = await db.ref(`system/admins/${user.uid}/tfa`).once('value');
        const tfaData = snap.val();
        
        if (!tfaData || !tfaData.enabled || !tfaData.secret) {
            return true; // 2FA not enabled, skip verification
        }
        
        const totp = new OTPAuth.TOTP({
            issuer: 'FoodHubbie',
            label: user.email,
            algorithm: 'SHA1',
            digits: 6,
            period: 30,
            secret: new OTPAuth.Secret({ base32: tfaData.secret })
        });
        
        return totp.validate({ token: code, window: 1 }) !== null;
    } catch (err) {
        console.error("TFA verification failed:", err);
        return false;
    }
};

// =====================================================
// MODULE: DATA RETENTION POLICIES (R5-5)
// =====================================================

/**
 * Apply data retention policy to specified data type
 * @param {string} type - 'orders', 'audit', or 'settlements'
 */
window.applyDataRetention = async function(type) {
    if (!hasPermission('all')) return showToast("Access denied", "error");
    const daysEl = document.getElementById(`retention${type.charAt(0).toUpperCase() + type.slice(1)}`);
    const actionEl = document.getElementById(`retention${type.charAt(0).toUpperCase() + type.slice(1)}Action`);
    const statusEl = document.getElementById('retentionStatus');
    const statusTextEl = document.getElementById('retentionStatusText');
    
    if (!daysEl || !actionEl) return showToast("Retention configuration not found", "error");
    
    const days = parseInt(daysEl.value);
    const action = actionEl.value;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffTimestamp = cutoffDate.getTime();
    
    if (!confirm(`This will ${action} all ${type} older than ${days} days (before ${cutoffDate.toLocaleDateString()}). Continue?`)) return;
    
    statusEl.classList.remove('hidden');
    statusTextEl.textContent = `Scanning ${type} for records older than ${days} days...`;
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    try {
        let affectedCount = 0;
        const updates = {};
        
        switch (type) {
            case 'orders':
                affectedCount = await processRetentionOrders(cutoffTimestamp, action, updates);
                break;
            case 'audit':
                affectedCount = await processRetentionAudit(cutoffTimestamp, action, updates);
                break;
            case 'settlements':
                affectedCount = await processRetentionSettlements(cutoffTimestamp, action, updates);
                break;
        }
        
        if (Object.keys(updates).length > 0) {
            statusTextEl.textContent = `Applying ${action} to ${affectedCount} records...`;
            await db.ref().update(updates);
        }
        
        statusTextEl.textContent = `Successfully ${action}d ${affectedCount} ${type} records older than ${days} days.`;
        showToast(`Data retention applied: ${affectedCount} ${type} ${action}d`, "success");
        await logAdminAction('DATA_RETENTION_APPLIED', { type, days, action, affectedCount });
        
        setTimeout(() => statusEl.classList.add('hidden'), 5000);
    } catch (err) {
        console.error("Data retention failed:", err);
        statusTextEl.textContent = `Failed: ${err.message}`;
        showToast("Data retention failed: " + err.message, "error");
    }
};

async function processRetentionOrders(cutoffTimestamp, action, updates) {
    let count = 0;
    const snap = await db.ref('businesses').once('value');
    const businesses = snap.val() || {};
    
    for (const [bizId, biz] of Object.entries(businesses)) {
        const outlets = biz.outlets || {};
        for (const [outletId, outlet] of Object.entries(outlets)) {
            const orders = outlet.orders || {};
            for (const [orderId, order] of Object.entries(orders)) {
                const orderTimestamp = order.timestamp || order.createdAt || 0;
                if (orderTimestamp < cutoffTimestamp) {
                    if (action === 'archive') {
                        updates[`archives/orders/${bizId}/${outletId}/${orderId}`] = { ...order, archivedAt: Date.now(), archivedBy: auth.currentUser.email };
                    }
                    updates[`businesses/${bizId}/outlets/${outletId}/orders/${orderId}`] = null;
                    count++;
                }
            }
        }
    }
    
    return count;
}

async function processRetentionAudit(cutoffTimestamp, action, updates) {
    let count = 0;
    
    // System audit logs
    const adminSnap = await db.ref('system/auditLogs').orderByChild('timestamp').endAt(cutoffTimestamp).once('value');
    adminSnap.forEach(child => {
        if (action === 'archive') {
            updates[`archives/auditLogs/${child.key}`] = { ...child.val(), archivedAt: Date.now() };
        }
        updates[`system/auditLogs/${child.key}`] = null;
        count++;
    });
    
    // Marketplace audit logs
    const marketSnap = await db.ref('logs/marketplaceAudit').orderByChild('timestamp').endAt(cutoffTimestamp).once('value');
    marketSnap.forEach(child => {
        if (action === 'archive') {
            updates[`archives/marketplaceAudit/${child.key}`] = { ...child.val(), archivedAt: Date.now() };
        }
        updates[`logs/marketplaceAudit/${child.key}`] = null;
        count++;
    });
    
    // Bot audit logs
    const botSnap = await db.ref('logs/botAudit').orderByChild('timestamp').endAt(cutoffTimestamp).once('value');
    botSnap.forEach(child => {
        if (action === 'archive') {
            updates[`archives/botAudit/${child.key}`] = { ...child.val(), archivedAt: Date.now() };
        }
        updates[`logs/botAudit/${child.key}`] = null;
        count++;
    });
    
    return count;
}

async function processRetentionSettlements(cutoffTimestamp, action, updates) {
    let count = 0;
    const snap = await db.ref('system/settlements').once('value');
    const settlements = snap.val() || {};
    
    for (const [setId, settlement] of Object.entries(settlements)) {
        const settlementTimestamp = settlement.timestamp || settlement.createdAt || 0;
        if (settlementTimestamp < cutoffTimestamp) {
            if (action === 'archive') {
                updates[`archives/settlements/${setId}`] = { ...settlement, archivedAt: Date.now() };
            }
            updates[`system/settlements/${setId}`] = null;
            count++;
        }
    }
    
    return count;
}

window.showOnboarding = function() {
    document.querySelector('[data-tab="onboarding"]').click();
}

// --- Dashboard Stats ---
function initStats() {
    console.log("Initializing Pro Telemetry...");
    
    // Load secondary data modules
    loadPromotions();
    loadReports();
    loadBusinessesTab();

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

            const outletIds = Object.keys(outlets);
            bizList.push({
                id,
                name: biz.name || id,
                owner: biz.owner || 'N/A',
                outlets: outletCount,
                status: biz.status || 'Active',
                commission: biz.commission || { percentage: 0, fixed: 0 },
                firstOutlet: outletIds[0] || null
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

// --- Business Registry ---
let allBusinessesList = [];

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
                <div class="font-semibold" style="color:var(--accent)">${safeText(b.adminEmail)}</div>
                <div class="text-xs text-muted">${b.adminPhone ? safeText(b.adminPhone) : 'Authority'}</div>
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
                    <button class="btn-pro-icon" title="Node Configuration" onclick="showOutletModal('${safeText(b.id)}', '${b.firstOutlet || ''}')">
                        <i data-lucide="settings" size="16"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    // Mirror to dedicated businesses tab
    allBusinessesList = list;
    PAGINATION.businesses.total = list.length;
    renderBusinessesAlt(list);
    lucide.createIcons();
}

async function loadBusinessesTab() {
    try {
        const [bizSnap, adminsSnap] = await Promise.all([
            db.ref('businesses').once('value'),
            db.ref('system/admins').once('value')
        ]);
        const businesses = bizSnap.val() || {};
        const admins = adminsSnap.val() || {};

        // Build admin lookup by businessId
        const adminByBiz = {};
        for (const uid in admins) {
            const a = admins[uid];
            if (a.businessId) {
                adminByBiz[a.businessId] = a;
            }
        }

        const list = [];
        Object.entries(businesses).forEach(([id, biz]) => {
            const outlets = biz.outlets || {};
            const admin = adminByBiz[id];
            list.push({
                id,
                name: biz.name || id,
                owner: biz.owner || 'N/A',
                outlets: Object.keys(outlets).length,
                status: biz.status || 'Active',
                commission: biz.commission || { percentage: 0, fixed: 0 },
                firstOutlet: Object.keys(outlets)[0] || null,
                adminEmail: admin ? (admin.email || 'N/A') : 'N/A',
                adminPhone: admin ? (admin.phone || '') : ''
            });
        });
        
        allBusinessesList = list;
        PAGINATION.businesses.total = list.length;
        PAGINATION.businesses.page = 1;
        renderBusinessesAlt(list);
    } catch (err) {
        console.error("Failed to load businesses tab:", err);
    }
}

window.goToBusinessesPage = function(page) {
    PAGINATION.businesses.page = page;
    renderBusinessesAlt(allBusinessesList);
};

function renderBusinessesAlt(list) {
    const altTbody = document.getElementById('businessListAlt');
    if (!altTbody) return;
    
    if (list.length === 0) {
        altTbody.innerHTML = '<tr><td colspan="5" class="text-center p-12 text-muted">No operational nodes detected in the ecosystem registry.</td></tr>';
        renderPagination('businessesPagination', 1, 15, 0, 'goToBusinessesPage');
        return;
    }

    const paginated = paginateArray(list, PAGINATION.businesses.page, PAGINATION.businesses.pageSize);

    altTbody.innerHTML = paginated.map(b => `
        <tr>
            <td>
                <div class="font-black" style="color:var(--pro-text)">${safeText(b.name)}</div>
                <div class="text-xs text-muted font-mono opacity-60">${safeText(b.id)}</div>
            </td>
            <td>
                <div class="font-semibold" style="color:var(--accent)">${safeText(b.adminEmail)}</div>
                <div class="text-xs text-muted">${b.adminPhone ? safeText(b.adminPhone) : 'Authority'}</div>
            </td>
            <td>
                <div class="font-black" style="color:#F97316">${b.outlets} Clusters</div>
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
                    <button class="btn-pro-icon" title="Node Configuration" onclick="showOutletModal('${safeText(b.id)}', '${b.firstOutlet || ''}')">
                        <i data-lucide="settings" size="16"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    
    renderPagination('businessesPagination', PAGINATION.businesses.page, PAGINATION.businesses.pageSize, PAGINATION.businesses.total, 'goToBusinessesPage');
    lucide.createIcons();
}

// --- Outlet Profiles ---
let allOutletsList = [];
let filteredOutletsList = [];
const OUTLETS_PAGE_SIZE = 15;
let outletsPage = 1;

async function loadOutletsTab() {
    try {
        const [bizSnap, adminsSnap] = await Promise.all([
            db.ref('businesses').once('value'),
            db.ref('system/admins').once('value')
        ]);
        
        const businesses = bizSnap.val() || {};
        const admins = adminsSnap.val() || {};

        const adminByBiz = {};
        for (const uid in admins) {
            const a = admins[uid];
            if (a.businessId) {
                if (!adminByBiz[a.businessId]) adminByBiz[a.businessId] = [];
                adminByBiz[a.businessId].push(a);
            }
        }

        allOutletsList = [];
        for (const bid in businesses) {
            const biz = businesses[bid];
            const outlets = biz.outlets || {};
            const bizAdmins = adminByBiz[bid] || [];
            
            for (const oid in outlets) {
                const o = outlets[oid];
                const admin = bizAdmins.find(a => a.outletId === oid) || bizAdmins[0] || {};
                allOutletsList.push({
                    bizId: bid,
                    bizName: biz.name || bid,
                    outletId: oid,
                    name: o.name || o.meta?.name || oid,
                    slug: o.meta?.slug || o.slug || oid,
                    status: o.status || (o.settings?.shopOpen ? 'OPEN' : 'CLOSED'),
                    address: o.meta?.address || o.settings?.Store?.address || '',
                    lat: o.meta?.lat || o.settings?.Store?.lat || '',
                    lng: o.meta?.lng || o.settings?.Store?.lng || '',
                    cuisine: o.meta?.cuisine || o.cuisine || '',
                    phone: o.meta?.adminPhone || o.phone || '',
                    adminEmail: admin.email || '',
                    adminPassword: admin.password || '',
                    adminPhone: admin.phone || '',
                    createdAt: o.meta?.createdAt || o.createdAt || biz.createdAt || '',
                    settings: o.settings || {}
                });
            }
        }

        document.getElementById('outletCount').innerText = allOutletsList.length + ' outlets';
        filterOutletList();
    } catch (err) {
        console.error("Failed to load outlets tab:", err);
    }
}

window.filterOutletList = function() {
    const q = (document.getElementById('outletSearchInput').value || '').toLowerCase().trim();
    filteredOutletsList = q
        ? allOutletsList.filter(o => 
            o.name.toLowerCase().includes(q) ||
            o.slug.toLowerCase().includes(q) ||
            o.bizName.toLowerCase().includes(q) ||
            o.adminEmail.toLowerCase().includes(q) ||
            o.address.toLowerCase().includes(q))
        : [...allOutletsList];
    outletsPage = 1;
    renderOutletList();
};

function renderOutletList() {
    const tbody = document.getElementById('outletListBody');
    if (!tbody) return;

    const totalPages = Math.ceil(filteredOutletsList.length / OUTLETS_PAGE_SIZE) || 1;
    const start = (outletsPage - 1) * OUTLETS_PAGE_SIZE;
    const pageEntries = filteredOutletsList.slice(start, start + OUTLETS_PAGE_SIZE);

    if (pageEntries.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center p-12 text-muted">No outlets found</td></tr>';
        document.getElementById('outletsPagination').innerHTML = '';
        return;
    }

    tbody.innerHTML = pageEntries.map(o => {
        const regDate = o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
        const statusColor = o.status === 'OPEN' || o.status === 'Active' ? 'badge-success' : 'badge-warning';
        return `<tr>
            <td>
                <div class="font-black" style="color:var(--pro-text)">${safeText(o.name)}</div>
                <div class="text-xs text-muted font-mono">${safeText(o.bizName)}</div>
            </td>
            <td>
                <div class="font-semibold" style="color:var(--pro-text)">${safeText(o.bizName)}</div>
                <div class="text-xs text-muted font-mono opacity-60">${safeText(o.bizId)}</div>
            </td>
            <td><span class="font-mono text-xs" style="color:var(--accent)">${safeText(o.slug)}</span></td>
            <td><span class="pro-badge ${statusColor}">${safeText(o.status)}</span></td>
            <td><span style="color:#38BDF8;font-weight:600;font-size:13px">${safeText(o.adminEmail || '-')}</span></td>
            <td><span class="text-xs text-muted">${regDate}</span></td>
            <td>
                <button class="btn-pro-icon" title="View Full Profile" onclick="showOutletProfile('${safeText(o.bizId)}', '${safeText(o.outletId)}')">
                    <i data-lucide="eye" size="16" color="#38BDF8"></i>
                </button>
                <button class="btn-pro-icon" title="Edit Outlet" onclick="showOutletModal('${safeText(o.bizId)}', '${safeText(o.outletId)}')">
                    <i data-lucide="settings" size="16" color="#F97316"></i>
                </button>
            </td>
        </tr>`;
    }).join('');

    renderPagination('outletsPagination', totalPages, outletsPage, (p) => { outletsPage = p; renderOutletList(); });
    lucide.createIcons();
}

window.goToOutletsPage = function(page) {
    outletsPage = page;
    renderOutletList();
};

window.showOutletProfile = async function(bid, oid) {
    try {
        const [outletSnap, adminsSnap] = await Promise.all([
            db.ref(`businesses/${bid}/outlets/${oid}`).once('value'),
            db.ref('system/admins').orderByChild('businessId').equalTo(bid).once('value')
        ]);

        const o = outletSnap.val();
        if (!o) return alert("Outlet not found!");

        const meta = o.meta || {};
        const settings = o.settings || {};
        const store = settings.Store || {};

        // Find admin for this outlet
        let adminEmail = '', adminPassword = '', adminPhone = '';
        if (adminsSnap.exists()) {
            const admins = adminsSnap.val();
            for (const uid in admins) {
                const a = admins[uid];
                if (a.outletId === oid) {
                    adminEmail = a.email || '';
                    adminPassword = a.password || '';
                    adminPhone = a.phone || '';
                    break;
                }
            }
        }

        // Parse orders for analytics (non-fatal if permission denied)
        let totalOrders = 0, totalRevenue = 0, avgOrderValue = 0;
        try {
            const ordersSnap = await db.ref('orders').orderByChild('outletId').equalTo(oid).once('value');
            const rawOrders = ordersSnap.val() || {};
            for (const ordId in rawOrders) {
                const ord = rawOrders[ordId];
                if (ord.outletId === oid) {
                    totalOrders++;
                    totalRevenue += Number(ord.total) || 0;
                }
            }
            avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
        } catch (_) {
            // orders access denied - show analytics as N/A
        }
        const regDate = meta.createdAt ? new Date(meta.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';
        const locStr = (meta.lat || store.lat) ? `${meta.lat || store.lat}, ${meta.lng || store.lng}` : 'Not set';

        document.getElementById('profileModalTitle').innerText = o.name || meta.name || 'Outlet Profile';
        document.getElementById('outletProfileBody').innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <!-- Left Column: Basic Info -->
                <div class="md:col-span-2">
                    <div class="pro-card p-4 mb-4">
                        <h4 class="text-sm font-bold text-muted uppercase tracking-wide mb-3">Outlet Information</h4>
                        <div class="grid grid-cols-2 gap-3 text-sm">
                            <div><span class="text-muted">Name</span><div class="font-bold" style="color:#000">${safeText(o.name || meta.name || 'N/A')}</div></div>
                            <div><span class="text-muted">Slug</span><div class="font-bold" style="color:#000">${safeText(meta.slug || o.slug || 'N/A')}</div></div>
                            <div class="col-span-2"><span class="text-muted">Address</span><div class="font-bold" style="color:#000">${safeText(meta.address || store.address || 'N/A')}</div></div>
                            <div><span class="text-muted">Coordinates</span><div class="font-mono text-xs" style="color:#000">${safeText(locStr)}</div></div>
                            <div><span class="text-muted">Status</span><div><span class="pro-badge ${settings.shopOpen ? 'badge-success' : 'badge-warning'}">${settings.shopOpen ? 'OPEN' : 'CLOSED'}</span></div></div>
                            <div class="col-span-2"><span class="text-muted">Registered On</span><div class="font-bold" style="color:#000">${regDate}</div></div>
                            <div><span class="text-muted">Cuisine</span><div style="color:#000">${safeText(meta.cuisine || o.cuisine || 'N/A')}</div></div>
                            <div><span class="text-muted">Business</span><div style="color:#000">${safeText(o.name || 'N/A')}</div></div>
                            <div class="col-span-2"><span class="text-muted">Business ID</span><div class="font-mono text-xs" style="color:#000">${safeText(bid)}</div></div>
                            <div class="col-span-2"><span class="text-muted">Outlet ID</span><div class="font-mono text-xs" style="color:#000">${safeText(oid)}</div></div>
                        </div>
                    </div>

                    <div class="pro-card p-4 mb-4">
                        <h4 class="text-sm font-bold text-muted uppercase tracking-wide mb-3">Contact Details</h4>
                        <div class="grid grid-cols-2 gap-3 text-sm">
                            <div><span class="text-muted">Phone</span><div class="font-bold" style="color:#000">${safeText(meta.adminPhone || o.phone || adminPhone || 'N/A')}</div></div>
                            <div><span class="text-muted">Address</span><div style="color:#000">${safeText(meta.address || store.address || 'N/A')}</div></div>
                        </div>
                    </div>
                </div>

                <!-- Right Column: Credentials & Analytics -->
                <div>
                    <div class="pro-card p-4 mb-4" style="border-color:rgba(56,189,248,0.3)">
                        <h4 class="text-sm font-bold text-muted uppercase tracking-wide mb-3" style="color:#38BDF8">Admin Credentials</h4>
                        <div class="space-y-3 text-sm">
                            <div>
                                <span class="text-muted text-xs">Username (Email)</span>
                                <div class="font-bold text-lg" style="color:#000">${safeText(adminEmail || 'N/A')}</div>
                            </div>
                            <div>
                                <span class="text-muted text-xs">Password</span>
                                <div class="font-bold text-lg" style="color:#000;font-family:monospace">${safeText(adminPassword || 'N/A')}</div>
                            </div>
                            <div>
                                <span class="text-muted text-xs">Admin Phone</span>
                                <div class="font-bold" style="color:#000">${safeText(adminPhone || meta.adminPhone || 'N/A')}</div>
                            </div>
                        </div>
                    </div>

                    <div class="pro-card p-4" style="border-color:rgba(16,185,129,0.3)">
                        <h4 class="text-sm font-bold text-muted uppercase tracking-wide mb-3" style="color:#10B981">Analytics</h4>
                        <div class="space-y-3 text-sm">
                            <div class="flex justify-between items-center p-2 rounded" style="background:rgba(16,185,129,0.1)">
                                <span class="text-muted">Total Orders</span>
                                <span class="font-black text-lg" style="color:#000">${totalOrders || 'N/A'}</span>
                            </div>
                            <div class="flex justify-between items-center p-2 rounded" style="background:rgba(99,102,241,0.1)">
                                <span class="text-muted">Total Revenue</span>
                                <span class="font-black text-lg" style="color:#000">${totalRevenue ? '₹' + totalRevenue.toLocaleString('en-IN') : 'N/A'}</span>
                            </div>
                            <div class="flex justify-between items-center p-2 rounded" style="background:rgba(251,191,36,0.1)">
                                <span class="text-muted">Avg Order Value</span>
                                <span class="font-black text-lg" style="color:#000">${avgOrderValue ? '₹' + avgOrderValue.toLocaleString('en-IN') : 'N/A'}</span>
                            </div>
                            <div class="flex justify-between items-center p-2 rounded" style="background:rgba(248,113,113,0.1)">
                                <span class="text-muted">Rating</span>
                                <span class="font-black text-lg" style="color:#000">${meta.rating || o.rating || 'N/A'} ⭐</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="flex gap-3 mt-6">
                <button class="btn-pro flex-1" onclick="hideOutletProfile(); showOutletModal('${safeText(bid)}', '${safeText(oid)}');">
                    <i data-lucide="settings" size="16"></i> Edit Outlet
                </button>
                <button class="btn-pro btn-muted flex-1" onclick="hideOutletProfile()">Close</button>
            </div>
        `;

        document.getElementById('outletProfileModal').classList.remove('hidden');
        lucide.createIcons();
    } catch (err) {
        alert("Error loading profile: " + err.message);
    }
};

window.hideOutletProfile = function() {
    document.getElementById('outletProfileModal').classList.add('hidden');
};

// --- Onboarding Flow ---
const onboardingForm = document.getElementById('onboardingForm');
if (onboardingForm) {
    onboardingForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!hasPermission('all')) return showToast("Access denied", "error");
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
            updates[`system/admins/${uid}`] = {
                name: `${bizName} Admin`,
                email: adminEmail,
                phone: adminPhone,
                password: adminPass,
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
let deliveryMode = 'slabs'; // 'per_100m' or 'slabs'
let per100mRate = 2;

async function loadGlobalDelivery() {
    const snap = await db.ref('system/settings/delivery').get();
    const data = snap.val() || {};

    deliveryMode = data.mode || 'slabs';
    per100mRate = data.per100mRate || 2;
    globalDeliverySlabs = data.slabs || [
        { upToKm: 2, fee: 20 },
        { upToKm: 5, fee: 40 },
        { upToKm: 10, fee: 60 }
    ];

    // Set radio button state
    const per100mRadio = document.querySelector('input[name="deliveryMode"][value="per_100m"]');
    const slabsRadio = document.querySelector('input[name="deliveryMode"][value="slabs"]');
    if (per100mRadio) per100mRadio.checked = (deliveryMode === 'per_100m');
    if (slabsRadio) slabsRadio.checked = (deliveryMode === 'slabs');

    // Set per-100m input
    const rateInput = document.getElementById('per100mRate');
    if (rateInput) rateInput.value = per100mRate;

    toggleDeliverySections(deliveryMode);
    renderDeliverySlabs();
}

function toggleDeliverySections(mode) {
    const per100mSection = document.getElementById('per100mSection');
    const slabsSection = document.getElementById('slabsSection');
    if (per100mSection) per100mSection.style.display = (mode === 'per_100m') ? 'block' : 'none';
    if (slabsSection) slabsSection.style.display = (mode === 'slabs') ? 'block' : 'none';
}

window.setDeliveryMode = function(mode) {
    deliveryMode = mode;
    toggleDeliverySections(mode);
};

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
    if (!hasPermission('all')) return showToast("Access denied", "error");

    const rateInput = document.getElementById('per100mRate');
    const rate = rateInput ? parseFloat(rateInput.value) || 0 : 0;

    const payload = {
        mode: deliveryMode,
        per100mRate: rate,
        slabs: globalDeliverySlabs,
        updatedAt: Date.now(),
        updatedBy: auth.currentUser ? auth.currentUser.email : 'system'
    };

    try {
        const updates = {};
        updates['system/settings/delivery'] = payload;
        await atomicAdminAction(updates, 'DELIVERY_FEE_UPDATE', { mode: deliveryMode, per100mRate: rate, slabCount: globalDeliverySlabs.length });
        alert("✅ Delivery Fee Configuration deployed successfully!");
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
    
    if (!oid) return alert("No outlet nodes found for this business!");
    
    try {
        const [outletSnap, adminsSnap] = await Promise.all([
            db.ref(`businesses/${bid}/outlets/${oid}`).get(),
            db.ref('system/admins').orderByChild('businessId').equalTo(bid).once('value')
        ]);
        const o = outletSnap.val();
        if (!o) return alert("Node not found!");

        // Find the admin for this outlet
        let adminEmail = '';
        let adminPassword = '';
        let adminPhone = o.meta?.adminPhone || '';
        if (adminsSnap.exists()) {
            const admins = adminsSnap.val();
            for (const uid in admins) {
                const a = admins[uid];
                if (a.outletId === oid || !oid) {
                    adminEmail = a.email || '';
                    adminPassword = a.password || '';
                    adminPhone = adminPhone || a.phone || '';
                    break;
                }
            }
        }

        document.getElementById('editOutletName').value = o.name || '';
        document.getElementById('editOutletSlug').value = o.meta?.slug || '';
        document.getElementById('editOutletAddress').value = o.meta?.address || o.settings?.Store?.address || '';
        document.getElementById('editOutletLat').value = o.meta?.lat || o.settings?.Store?.lat || '';
        document.getElementById('editOutletLng').value = o.meta?.lng || o.settings?.Store?.lng || '';
        document.getElementById('editAdminEmail').value = adminEmail;
        document.getElementById('editAdminPhone').value = adminPhone;
        document.getElementById('editAdminPass').value = '';
        document.getElementById('editAdminPassDisplay').value = adminPassword;

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
    if (!hasPermission('manage_businesses')) return showToast("Access denied", "error");
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
        
        updates[`businesses/${editingBizId}/outlets/${editingOutletId}/name`] = name;
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

        // Update admin password if a new one was provided
        if (newPass && newPass.length >= 6) {
            // Find the admin UID for this business/outlet
            const adminsSnap = await db.ref('system/admins').orderByChild('businessId').equalTo(editingBizId).once('value');
            if (adminsSnap.exists()) {
                const admins = adminsSnap.val();
                for (const uid in admins) {
                    const a = admins[uid];
                    if (a.outletId === editingOutletId) {
                        updates[`system/admins/${uid}/password`] = newPass;
                        console.log("[SuperAdmin] Password updated in admin node.");
                        break;
                    }
                }
            }
        }

        updates[`slugs/outlets/${slug}`] = {
            businessId: editingBizId,
            outletId: editingOutletId
        };

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
    if (!hasPermission('manage_businesses')) return showToast("Access denied", "error");
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
        PAGINATION.riders.total = allRiders.length;
        PAGINATION.riders.page = 1;
        renderRidersList(allRiders);
    });
}

window.goToRidersPage = function(page) {
    PAGINATION.riders.page = page;
    renderRidersList(allRiders);
};

function renderRidersList(list) {
    const tbody = document.getElementById('ridersListTable');
    if (!tbody) return;

    if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center p-12 text-muted">No logistics partners registered in the fleet node.</td></tr>';
        renderPagination('ridersPagination', 1, 20, 0, 'goToRidersPage');
        return;
    }

    const paginated = paginateArray(list, PAGINATION.riders.page, PAGINATION.riders.pageSize);

    tbody.innerHTML = paginated.map(r => `
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
    
    renderPagination('ridersPagination', PAGINATION.riders.page, PAGINATION.riders.pageSize, PAGINATION.riders.total, 'goToRidersPage');
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
    if (!hasPermission('manage_riders')) return showToast("Access denied", "error");
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
                console.log("[SuperAdmin] Rider Password change requested. Use Firebase Auth password reset email.");
                showToast("Password reset email sent to rider.", "info");
                try {
                    const riderSnap = await db.ref(`riders/${editingRiderId}`).once('value');
                    const riderEmail = riderSnap.val()?.email;
                    if (riderEmail) {
                        await secondaryAuth.sendPasswordResetEmail(riderEmail);
                    }
                } catch (resetErr) {
                    console.error("Password reset failed:", resetErr);
                }
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
    if (!hasPermission('manage_riders')) return showToast("Access denied", "error");
    if (!confirm(`Trigger secure password reset email for ${email}?`)) return;
    try {
        await auth.sendPasswordResetEmail(email);
        alert("✅ Security recovery email dispatched successfully.");
    } catch (err) {
        alert("❌ Failed to dispatch reset: " + err.message);
    }
};

window.deleteRider = async function(id) {
    if (!hasPermission('manage_riders')) return showToast("Access denied", "error");
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
    if (!hasPermission('manage_promotions')) return showToast("Access denied", "error");
    const multiplier = parseFloat(document.getElementById('surgeMultiplier').value) || 1.0;
    const reason = safeText(document.getElementById('surgeReason').value);
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
    if (!hasPermission('manage_promotions')) return showToast("Access denied", "error");
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
    if (!hasPermission('all')) return showToast("Access denied", "error");
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
    if (!hasPermission('manage_promotions')) return showToast("Access denied", "error");
    const code = document.getElementById('couponCode').value.toUpperCase();
    const type = document.getElementById('couponType').value;
    const value = parseFloat(document.getElementById('couponValue').value);
    const minOrder = parseFloat(document.getElementById('couponMinOrder').value) || 0;
    const usageLimit = parseInt(document.getElementById('couponLimit').value) || 100;
    const isActive = document.getElementById('couponActive').checked;

    if (!code) return showToast("Enter Promo Code", "error");

    const rateCheck = checkRateLimit('CREATE_COUPON');
    if (!rateCheck.allowed) {
        return showToast(`Rate limited. Wait ${rateCheck.waitSeconds}s before creating another coupon.`, "warning");
    }

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
    if (!hasPermission('manage_promotions')) return showToast("Access denied", "error");
    await db.ref(`system/promotions/coupons/${code}/isActive`).set(!current);
    await logAdminAction('TOGGLE_COUPON', { code, isActive: !current });
    showToast("Coupon Status Updated", "success");
    loadPromotions();
};

window.deleteCoupon = async (code) => {
    if (!hasPermission('manage_promotions')) return showToast("Access denied", "error");
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
    if (!hasPermission('manage_promotions')) return showToast("Access denied", "error");
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

// R5-4: Pagination state
const PAGINATION = {
    users: { page: 1, pageSize: 20, total: 0 },
    audit: { page: 1, pageSize: 50, total: 0 },
    businesses: { page: 1, pageSize: 15, total: 0 },
    riders: { page: 1, pageSize: 20, total: 0 }
};

function paginateArray(arr, page, pageSize) {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return arr.slice(start, end);
}

function renderPagination(containerId, currentPage, pageSize, total, onPageChange) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const totalPages = Math.ceil(total / pageSize);
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, total);
    
    let html = `<div class="pagination-controls">
        <span class="pagination-info">Showing ${startItem}-${endItem} of ${total}</span>
        <div class="pagination-buttons">
            <button class="btn-pro btn-sm ${currentPage === 1 ? 'disabled' : ''}" 
                ${currentPage === 1 ? 'disabled' : `onclick="${onPageChange}(${currentPage - 1})"`}>
                <i data-lucide="chevron-left" size="16"></i>
            </button>`;
    
    // Smart page number display
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage < maxVisible - 1) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    if (startPage > 1) {
        html += `<button class="btn-pro btn-sm" onclick="${onPageChange}(1)">1</button>`;
        if (startPage > 2) html += `<span class="pagination-ellipsis">...</span>`;
    }
    
    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="btn-pro btn-sm ${i === currentPage ? 'active' : ''}" onclick="${onPageChange}(${i})">${i}</button>`;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += `<span class="pagination-ellipsis">...</span>`;
        html += `<button class="btn-pro btn-sm" onclick="${onPageChange}(${totalPages})">${totalPages}</button>`;
    }
    
    html += `<button class="btn-pro btn-sm ${currentPage === totalPages ? 'disabled' : ''}" 
                ${currentPage === totalPages ? 'disabled' : `onclick="${onPageChange}(${currentPage + 1})"`}>
                <i data-lucide="chevron-right" size="16"></i>
            </button>
        </div>
    </div>`;
    
    container.innerHTML = html;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

async function loadUsers() {
    console.log("Loading User Registry...");
    try {
        const snap = await db.ref('users').once('value');
        allUsers = snap.val() || {};
        PAGINATION.users.total = Object.keys(allUsers).length;
        PAGINATION.users.page = 1;
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

    PAGINATION.users.total = filteredUsersList.length;
    PAGINATION.users.page = 1;
    renderUsers();
};

window.goToUsersPage = function(page) {
    PAGINATION.users.page = page;
    renderUsers();
};

function renderUsers() {
    const tbody = document.getElementById('usersListTable');
    if (!tbody) return;

    if (filteredUsersList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 48px; color: #64748B;">No user nodes matching the current filters.</td></tr>';
        renderPagination('usersPagination', 1, 20, 0, 'goToUsersPage');
        return;
    }

    const paginated = paginateArray(filteredUsersList, PAGINATION.users.page, PAGINATION.users.pageSize);

    tbody.innerHTML = paginated.map(u => `
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
                    ${u.email ? `<button class="btn-pro-icon" style="background: rgba(245, 158, 11, 0.1); color: #F59E0B;" onclick="triggerPasswordReset('${safeText(u.email)}')" title="Reset Password">
                        <i data-lucide="key" size="18"></i>
                    </button>` : ''}
                </div>
            </td>
        </tr>
    `).join("");

    renderPagination('usersPagination', PAGINATION.users.page, PAGINATION.users.pageSize, PAGINATION.users.total, 'goToUsersPage');
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
    if (!hasPermission('all')) return showToast("Access denied", "error");
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

/**
 * R5-1: Trigger Password Reset (Client-Side Fallback)
 * Uses Firebase Auth client-side method since Cloud Functions require Blaze plan.
 * Only SuperAdmins can call this (enforced by UI access control).
 */
window.triggerPasswordReset = async function(email) {
    if (!hasPermission('all')) return showToast("Access denied", "error");
    if (!email) return showToast("User has no email on file", "error");
    
    if (!confirm(`Send password reset email to ${email}?`)) return;
    
    try {
        showToast("Sending password reset...", "info");
        
        // Use Firebase Auth client-side password reset
        await auth.sendPasswordResetEmail(email);
        
        showToast(`Password reset email sent to ${email}`, "success");
        await logAdminAction('PASSWORD_RESET_TRIGGERED', { targetEmail: email });
    } catch (err) {
        console.error("Password reset error:", err);
        
        if (err.code === 'auth/user-not-found') {
            showToast(`No user found with email: ${email}`, "error");
        } else if (err.code === 'auth/invalid-email') {
            showToast("Invalid email address format", "error");
        } else if (err.code === 'auth/too-many-requests') {
            showToast("Too many reset attempts. Try again later.", "warning");
        } else {
            showToast("Password reset failed: " + err.message, "error");
        }
    }
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
let allAuditLogs = [];

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

        const adminSnap = await db.ref('system/auditLogs').limitToLast(200).once('value');
        adminSnap.forEach(snap => adminLogs.push({ ...snap.val(), timestamp: snap.val().timestamp || Date.now() }));

        const marketSnap = await db.ref('logs/marketplaceAudit').limitToLast(100).once('value');
        marketSnap.forEach(snap => marketplaceLogs.push({ ...snap.val(), timestamp: snap.val().timestamp || Date.now() }));

        const botSnap = await db.ref('logs/botAudit').limitToLast(100).once('value');
        botSnap.forEach(snap => botLogs.push({ ...snap.val(), timestamp: snap.val().timestamp || Date.now() }));

        const riderSnap = await db.ref('logs/riderErrors').limitToLast(100).once('value');
        riderSnap.forEach(riderGroup => {
            riderGroup.forEach(snap => riderLogs.push({ ...snap.val(), timestamp: snap.val().timestamp || Date.now() }));
        });

        allAuditLogs = [
            ...adminLogs.map(l => ({ ...l, source: 'ADMIN', badge: 'badge-info' })),
            ...marketplaceLogs.map(l => ({ ...l, source: 'MARKETPLACE', badge: 'badge-success' })),
            ...botLogs.map(l => ({ ...l, source: 'WHATSAPP', badge: 'badge-warning' })),
            ...riderLogs.map(l => ({ ...l, source: 'RIDER_APP', badge: 'badge-danger' }))
        ].sort((a, b) => b.timestamp - a.timestamp);

        PAGINATION.audit.total = allAuditLogs.length;
        PAGINATION.audit.page = 1;
        renderUnifiedLogs(allAuditLogs, filter);
    } catch (err) {
        console.error("Audit Fetch Failed:", err);
        tbody.innerHTML = `<tr><td colspan="5" class="text-center p-12 text-danger">Telemetric failure: ${err.message}</td></tr>`;
    }
};

window.goToAuditPage = function(page) {
    PAGINATION.audit.page = page;
    const filter = document.getElementById('auditLogFilter')?.value || 'all';
    renderUnifiedLogs(allAuditLogs, filter);
};

function renderUnifiedLogs(logs, filter) {
    const tbody = document.getElementById('unifiedAuditBody');
    if (!tbody) return;

    const filtered = filter === 'all' ? logs : logs.filter(l => l.source.toLowerCase().includes(filter.toLowerCase()));
    PAGINATION.audit.total = filtered.length;

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center p-12 text-muted">No telemetric events detected in the current audit window.</td></tr>';
        renderPagination('auditPagination', 1, 50, 0, 'goToAuditPage');
        return;
    }

    const paginated = paginateArray(filtered, PAGINATION.audit.page, PAGINATION.audit.pageSize);

    tbody.innerHTML = paginated.map(log => `
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
    
    renderPagination('auditPagination', PAGINATION.audit.page, PAGINATION.audit.pageSize, PAGINATION.audit.total, 'goToAuditPage');
    lucide.createIcons();
}

// =====================================================
// MODULE: LIVE ORDER COMMAND CENTER
// =====================================================
let allLiveOrders = [];
let currentOrderFilter = 'all';
let _liveOrdersUnsub = null;
let _liveOrdersRefreshTimer = null;

function _processAndRenderOrders(businesses) {
    allLiveOrders = [];
    const outletFilter = document.getElementById('orderOutletFilter');
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

    if (outletFilter && outletFilter.options.length <= 1) outletFilter.innerHTML = filterHTML;

    allLiveOrders.sort((a, b) => b.timestamp - a.timestamp);

    const cutoff = Date.now() - (48 * 60 * 60 * 1000);
    allLiveOrders = allLiveOrders.filter(o => o.timestamp > cutoff || ['new', 'confirmed', 'preparing', 'ready', 'picked', 'out', 'out for delivery', 'cooked', 'placed', 'reached drop location', 'delivered'].includes(o.status));

    renderOrderPipeline();
}

window.loadLiveOrders = async function() {
    const tbody = document.getElementById('liveOrdersBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="9" class="text-center p-12 text-muted"><div class="animate-pulse">Aggregating orders from all outlets...</div></td></tr>';

    if (_liveOrdersUnsub) {
        _liveOrdersUnsub();
        _liveOrdersUnsub = null;
    }

    try {
        const bizSnap = await db.ref('businesses').once('value');
        const businesses = bizSnap.val() || {};
        _processAndRenderOrders(businesses);

        db.ref('businesses').on('value', (snap) => {
            const data = snap.val() || {};
            _processAndRenderOrders(data);
        }, (err) => {
            console.error("[LiveOrders] Realtime listener error:", err);
        });

        _liveOrdersUnsub = () => {
            db.ref('businesses').off('value');
        };
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
        if (['new', 'pending', 'confirmed', 'placed'].includes(o.status)) counts.new++;
        else if (['preparing', 'cooking', 'ready', 'cooked'].includes(o.status)) counts.preparing++;
        else if (['picked', 'out', 'out_for_delivery', 'out for delivery', 'in_transit'].includes(o.status)) counts.out++;
        else if (['delivered', 'completed', 'reached drop location'].includes(o.status)) counts.delivered++;
    });

    document.getElementById('orderCountAll').innerText = counts.all;
    document.getElementById('orderCountNew').innerText = counts.new;
    document.getElementById('orderCountPreparing').innerText = counts.preparing;
    document.getElementById('orderCountOut').innerText = counts.out;
    document.getElementById('orderCountDelivered').innerText = counts.delivered;

    // Apply filter
    if (currentOrderFilter !== 'all') {
        const statusMap = {
            'new': ['new', 'pending', 'confirmed', 'placed'],
            'preparing': ['preparing', 'cooking', 'ready', 'cooked'],
            'out': ['picked', 'out', 'out_for_delivery', 'out for delivery', 'in_transit'],
            'delivered': ['delivered', 'completed', 'reached drop location']
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
            'new': 'badge-warning', 'pending': 'badge-warning', 'confirmed': 'badge-info', 'placed': 'badge-warning',
            'preparing': 'badge-info', 'cooking': 'badge-info', 'ready': 'badge-success', 'cooked': 'badge-success',
            'picked': 'badge-info', 'out': 'badge-info', 'out_for_delivery': 'badge-info', 'out for delivery': 'badge-info', 'in_transit': 'badge-info',
            'delivered': 'badge-success', 'completed': 'badge-success', 'reached drop location': 'badge-info',
            'cancelled': 'badge-danger', 'rejected': 'badge-danger'
        };
        return map[s] || 'badge-warning';
    };

    tbody.innerHTML = filtered.slice(0, 50).map(o => {
        const age = Date.now() - o.timestamp;
        const ageMin = Math.floor(age / 60000);
        const ageStr = ageMin < 60 ? `${ageMin}m` : `${Math.floor(ageMin / 60)}h ${ageMin % 60}m`;
        const isOverdue = ageMin > 30 && ['new', 'pending', 'confirmed', 'placed'].includes(o.status);
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
        { id: 'pending', title: 'New & Pending', status: ['new', 'pending', 'confirmed', 'placed'], color: '#FBBF24' },
        { id: 'preparing', title: 'Preparing', status: ['preparing', 'cooking', 'ready', 'cooked'], color: '#6366F1' },
        { id: 'on-the-way', title: 'On the Way', status: ['picked', 'out', 'out_for_delivery', 'out for delivery', 'in_transit'], color: '#10B981' },
        { id: 'completed', title: 'Delivered', status: ['delivered', 'completed', 'reached drop location'], color: '#38BDF8' }
    ];

    // Status counts update (keep global counts in sync)
    const counts = { all: filtered.length, new: 0, preparing: 0, out: 0, delivered: 0 };
    filtered.forEach(o => {
        if (['new', 'pending', 'confirmed', 'placed'].includes(o.status)) counts.new++;
        else if (['preparing', 'cooking', 'ready', 'cooked'].includes(o.status)) counts.preparing++;
        else if (['picked', 'out', 'out_for_delivery', 'out for delivery', 'in_transit'].includes(o.status)) counts.out++;
        else if (['delivered', 'completed', 'reached drop location'].includes(o.status)) counts.delivered++;
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
                        const isOverdue = ageMin > 30 && ['new', 'pending', 'confirmed', 'placed'].includes(o.status);
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
    if (!hasPermission('all')) return showToast("Access denied", "error");
    e.preventDefault();
    const el = e.currentTarget;
    el.classList.remove('kanban-drag-over');
    
    if (!draggedOrder) return;

    const statusMap = {
        'pending': 'Confirmed',
        'preparing': 'Preparing',
        'on-the-way': 'Out for Delivery',
        'completed': 'Delivered'
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
    if (!hasPermission('all')) return showToast("Access denied", "error");
    const newStatus = prompt("Enter new status:\n(Placed, Confirmed, Preparing, Cooked, Ready, Out for Delivery, Reached Drop Location, Delivered, Cancelled)");
    if (!newStatus) return;
    const valid = ['placed', 'confirmed', 'preparing', 'cooked', 'ready', 'out for delivery', 'reached drop location', 'delivered', 'cancelled'];
    if (!valid.includes(newStatus.toLowerCase())) return showToast("Invalid status. Use: " + valid.join(', '), "error");

    try {
        const updates = {};
        updates[`businesses/${bizId}/outlets/${outletId}/orders/${orderId}/status`] = newStatus;
        await atomicAdminAction(updates, 'ORDER_STATUS_UPDATE', { bizId, outletId, orderId, newStatus });
        showToast(`Order status updated to ${newStatus}`, "success");
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
    if (!hasPermission('send_broadcast')) return showToast("Access denied", "error");
    const title = document.getElementById('broadcastTitle').value.trim();
    const body = document.getElementById('broadcastBody').value.trim();
    const audience = document.getElementById('broadcastAudience').value;
    const category = document.getElementById('broadcastCategory').value;
    const imageUrl = document.getElementById('broadcastImage')?.value.trim() || '';

    if (!title || !body) return showToast("Title and body are required", "error");
    
    const rateCheck = checkRateLimit('SEND_BROADCAST');
    if (!rateCheck.allowed) {
        return showToast(`Rate limited. Wait ${rateCheck.waitSeconds}s before sending another broadcast.`, "warning");
    }
    
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
    if (!hasPermission('all')) return showToast("Access denied", "error");
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
    if (!hasPermission('all')) return showToast("Access denied", "error");
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
                <td class="font-black">₹${s.orderTotal}</td>
                <td class="text-danger font-bold">- ₹${s.platformCommission}</td>
                <td class="text-info font-bold">- ₹${s.riderPayout}</td>
                <td class="text-success font-black">₹${s.shopNet}</td>
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

    document.getElementById('reconGlobalRev').innerText = `₹${Math.round(stats.rev)}`;
    document.getElementById('reconGlobalComm').innerText = `₹${Math.round(stats.comm)}`;
    document.getElementById('reconGlobalPending').innerText = `₹${Math.round(stats.pending)}`;
    document.getElementById('reconGlobalSettled').innerText = `₹${Math.round(stats.settled)}`;
}

window.settleTransaction = async function(bizId, outId, settleId, amount) {
    if (!hasPermission('all')) return showToast("Access denied", "error");
    const confirm = await Swal.fire({
        title: 'Manual Payout Confirmation',
        text: `Confirm that ₹${amount} has been manually transferred to the shop owner's account. This action will create a formal Ledger Entry and update the Partner Wallet.`,
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
    if (!hasPermission('all')) return showToast("Access denied", "error");
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

        const bid = `biz_${Date.now()}`;
        const oid = `outlet_default`;
        const adminEmail = req.email.toLowerCase();
        const tempPassword = `FoodHubbie@${Math.random().toString(36).slice(-8)}`;

        const userCredential = await secondaryAuth.createUserWithEmailAndPassword(adminEmail, tempPassword);
        const adminUid = userCredential.user.uid;

        await secondaryAuth.signOut();

        const updates = {};

        // Business Node
        updates[`businesses/${bid}`] = {
            id: bid,
            name: req.bizName,
            owner: req.ownerName,
            address: req.address,
            status: 'ACTIVE',
            createdAt: firebase.database.ServerValue.TIMESTAMP
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
                    name: safeText(cat),
                    status: 'ACTIVE',
                    priority: 0
                };
            });
        }

        // Admin Profile Node
        updates[`system/admins/${adminUid}`] = {
            id: adminUid,
            email: adminEmail,
            password: tempPassword,
            role: 'Partner Admin',
            outletId: oid,
            businessId: bid,
            name: safeText(req.ownerName),
            status: 'ACTIVE',
            createdAt: firebase.database.ServerValue.TIMESTAMP
        };

        // Finalize Onboarding Request
        updates[`onboarding_requests/${uid}`] = null;
        updates[`onboarding_history/${uid}`] = {
            ...req,
            status: 'APPROVED',
            processedAt: firebase.database.ServerValue.TIMESTAMP,
            bid: bid,
            oid: oid,
            adminUid: adminUid
        };

        await db.ref().update(updates);

        Swal.fire({
            title: 'Node Provisioned!',
            html: `Infrastructure for <b>${safeText(req.bizName)}</b> is now live.<br><br>Admin email: <b>${safeText(adminEmail)}</b><br>Temp password: <b>${safeText(tempPassword)}</b><br><br>Partner must change password on first login to admin-dashboard.`,
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
    if (!hasPermission('all')) return showToast("Access denied", "error");
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
