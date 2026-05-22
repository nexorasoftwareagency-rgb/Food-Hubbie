/* =============================
   Foodhubbie Supreme Admin
   Full Dashboard Controller v2
   ============================= */

// --- Firebase Config ---
const firebaseConfig = {
  apiKey: "AIzaSyD60fL5Q-St64KyMavdfA9to4ZyCdR-qG8",
  authDomain: "food-hubbie.firebaseapp.com",
  databaseURL: "https://food-hubbie-default-rtdb.firebaseio.com",
  projectId: "food-hubbie",
  storageBucket: "food-hubbie.firebasestorage.app",
  messagingSenderId: "952017160550",
  appId: "1:952017160550:web:80bbb75933f431ab54e0a7",
  measurementId: "G-SQK852HT4W"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

// --- State ---
let revenueChart = null;
let ordersChart = null;
let currentUser = null;
let businessesData = {};
let todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
let allOrders = {};
let allRiders = {};
let allUsers = {};
let allReviews = [];
let allInventory = [];
let allSettlements = [];
let currentPage = { businesses: 1, riders: 1, users: 1, audit: 1, reviews: 1 };
let businessFilter = '';
let riderFilter = '';
let userFilter = '';
let inventoryFilter = '';
let selectedStatusFilter = 'All';
let currentView = 'table';
let currentDragOrder = null;
let allPromotions = {};
let allCoupons = {};
let broadcastRateLimit = [];
let couponRateLimit = [];
let deliverySlabs = [];
let auditLogs = [];
let currentAdminUid = null;
let tabListeners = {};

// --- DOM refs ---
const $ = (id) => document.getElementById(id);

// --- Auth ---
$('loginForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = $('loginEmail').value;
  const password = $('loginPassword').value;
  const btn = $('loginBtn');
  btn.disabled = true;
  btn.textContent = 'Signing in...';
  $('loginError').textContent = '';
  try {
    const cred = await auth.signInWithEmailAndPassword(email, password);
    currentUser = cred.user;
    $('authOverlay').classList.add('hidden');
    $('app').classList.add('visible');
    initDashboard();
  } catch (err) {
    $('loginError').textContent = err.message.replace('Firebase: ', '');
    btn.disabled = false;
    btn.textContent = 'Sign In';
  }
});

auth.onAuthStateChanged((user) => {
  if (user) {
    currentUser = user;
    $('authOverlay').classList.add('hidden');
    $('app').classList.add('visible');
    $('adminName').textContent = user.displayName || 'Admin';
    $('adminEmail').textContent = user.email;
    $('adminAvatar').textContent = (user.displayName || user.email || 'A')[0].toUpperCase();
    initDashboard();
  }
});

$('btnLogout')?.addEventListener('click', () => {
  auth.signOut();
  currentUser = null;
  $('authOverlay').classList.remove('hidden');
  $('app').classList.remove('visible');
});

// --- Tab Navigation ---
document.querySelectorAll('.nav-link').forEach((link) => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelectorAll('.nav-link').forEach((l) => l.classList.remove('active'));
    link.classList.add('active');
    const tab = link.dataset.tab;
    document.querySelectorAll('.tab-content').forEach((t) => t.classList.remove('active'));
    const target = $('tab-' + tab);
    if (target) target.classList.add('active');
    showTab(tab);
  });
});

// --- Sidebar Toggle (mobile) ---
$('sidebarToggle')?.addEventListener('click', () => {
  document.getElementById('sidebar')?.classList.toggle('open');
});
document.addEventListener('click', (e) => {
  const sidebar = document.getElementById('sidebar');
  if (window.innerWidth <= 768 && sidebar?.classList.contains('open') && !sidebar.contains(e.target) && e.target !== $('sidebarToggle')) {
    sidebar.classList.remove('open');
  }
});

// ============================
// GLOBAL UTILITY FUNCTIONS
// ============================

function showTab(tabName) {
  if (tabListeners[tabName]) tabListeners[tabName]();
  switch (tabName) {
    case 'onboarding': loadOnboardingRequests(); break;
    case 'businesses': loadBusinesses(); break;
    case 'liveorders': loadAllOrders(); break;
    case 'riders': loadRiders(); break;
    case 'users': loadUsers(); break;
    case 'promotions': loadPromotions(); break;
    case 'settlements': loadSettlements(); break;
    case 'delivery': loadDeliverySlabs(); break;
    case 'inventory': loadInventory(); break;
    case 'reviews': loadReviews(); break;
    case 'broadcast': loadBroadcasts(); break;
    case 'audit': loadAuditLogs(); break;
    case 'reports': loadReports(); break;
    case 'settings': checkTFAStatus(); break;
  }
}

function confirmAction(msg, callback) {
  const modal = $('confirmModal');
  if (!modal) return;
  $('confirmMsg').textContent = msg;
  modal.classList.add('active');
  const confirmBtn = $('confirmYes');
  const cancelBtn = $('confirmNo');
  const handler = (e) => {
    if (e.target === confirmBtn) callback();
    modal.classList.remove('active');
    confirmBtn.removeEventListener('click', handler);
    cancelBtn.removeEventListener('click', handler);
  };
  confirmBtn.addEventListener('click', handler);
  cancelBtn.addEventListener('click', handler);
}

function showToast(msg, type) {
  const toast = $('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.className = 'toast visible toast-' + (type || 'info');
  clearTimeout(toast._hide);
  toast._hide = setTimeout(() => toast.classList.remove('visible'), 4000);
}

function formatDate(ts) {
  if (!ts) return '—';
  const d = typeof ts === 'number' ? new Date(ts) : new Date(ts);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function timeAgo(ts) {
  return formatTimeAgo(ts);
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function exportCSV(headers, rows, filename) {
  const csvContent = [headers.join(','), ...rows.map(r => headers.map((h, i) => {
    const val = (r[i] || '').toString();
    return val.includes(',') || val.includes('"') ? '"' + val.replace(/"/g, '""') + '"' : val;
  }).join(','))].join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename + '_' + new Date().toISOString().slice(0, 10) + '.csv';
  link.click();
  URL.revokeObjectURL(link.href);
}

function formatTimeAgo(ts) {
  if (!ts) return '';
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return mins + 'm ago';
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + 'h ago';
  return Math.floor(hrs / 24) + 'd ago';
}

function generateLastNDays(n) {
  const result = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    result.push({
      label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      dateStr: d.toDateString(),
      ts: d.getTime()
    });
  }
  return result;
}

// ============================
// 1. DASHBOARD
// ============================

function initDashboard() {
  if (window.lucide) lucide.createIcons();
  $('dateDisplay').textContent = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  loadDashboardData();
}

function loadDashboardData() {
  const bizRef = db.ref('businesses');
  bizRef.on('value', (snap) => {
    businessesData = snap.val() || {};
    updateKPIs();
    updateCharts();
    updateActivity();
  }, (err) => {
    console.error('Dashboard load error:', err);
    document.querySelectorAll('.kpi-value').forEach((el) => el.textContent = '—');
  });
}

function updateKPIs() {
  const bizIds = Object.keys(businessesData);
  $('kpiBusinesses').textContent = bizIds.length;

  let outletCount = 0;
  let ordersToday = 0;
  let revenueToday = 0;
  let userSet = new Set();

  bizIds.forEach((bid) => {
    const biz = businessesData[bid];
    if (biz.outlets) {
      const oids = Object.keys(biz.outlets);
      outletCount += oids.length;
      oids.forEach((oid) => {
        const outlet = biz.outlets[oid];
        if (outlet.orders) {
          Object.values(outlet.orders).forEach((order) => {
            if (order.createdAt && order.createdAt >= todayStart.getTime()) {
              ordersToday++;
              revenueToday += order.total || 0;
            }
            if (order.phone) userSet.add(order.phone);
          });
        }
      });
    }
  });

  $('kpiOutlets').textContent = outletCount;
  $('kpiOrdersToday').textContent = ordersToday;
  $('kpiRevenue').textContent = '\u20B9' + revenueToday.toLocaleString('en-IN');
  $('kpiUsers').textContent = userSet.size || '—';

  db.ref('riders').once('value', (snap) => {
    const riders = snap.val() || {};
    const total = Object.keys(riders).length;
    const active = Object.values(riders).filter((r) => (r.status || '').toLowerCase() === 'online').length;
    $('kpiRiders').textContent = active + '/' + total;
  });
}

function updateCharts() {
  buildRevenueChart();
  buildOrdersChart();
}

function buildRevenueChart() {
  const days = generateLastNDays(14);
  const revenueData = days.map((d) => {
    let total = 0;
    Object.values(businessesData).forEach((biz) => {
      if (biz.outlets) {
        Object.values(biz.outlets).forEach((outlet) => {
          if (outlet.orders) {
            Object.values(outlet.orders).forEach((order) => {
              if (order.createdAt && new Date(order.createdAt).toDateString() === d.dateStr) {
                total += order.total || 0;
              }
            });
          }
        });
      }
    });
    return total;
  });

  const ctx = document.getElementById('revenueChart')?.getContext('2d');
  if (!ctx) return;
  if (revenueChart) revenueChart.destroy();

  revenueChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: days.map((d) => d.label),
      datasets: [{
        label: 'Revenue (\u20B9)',
        data: revenueData,
        borderColor: '#22C55E',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#22C55E',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { callback: (v) => '\u20B9' + v.toLocaleString('en-IN') } },
        x: { grid: { display: false } }
      }
    }
  });
}

function buildOrdersChart() {
  const statusCounts = { Placed: 0, Confirmed: 0, Preparing: 0, 'Out for Delivery': 0, Delivered: 0, Cancelled: 0 };
  Object.values(businessesData).forEach((biz) => {
    if (biz.outlets) {
      Object.values(biz.outlets).forEach((outlet) => {
        if (outlet.orders) {
          Object.values(outlet.orders).forEach((order) => {
            const s = order.status || 'Placed';
            if (statusCounts[s] !== undefined) statusCounts[s]++;
            else statusCounts.Placed++;
          });
        }
      });
    }
  });

  const labels = Object.keys(statusCounts);
  const data = Object.values(statusCounts);
  const colors = ['#3B82F6', '#F97316', '#A855F7', '#22C55E', '#10B981', '#EF4444'];

  const ctx = document.getElementById('ordersChart')?.getContext('2d');
  if (!ctx) return;
  if (ordersChart) ordersChart.destroy();

  ordersChart = new Chart(ctx, {
    type: 'doughnut',
    data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 0 }] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, font: { size: 12 } } }
      },
      cutout: '65%'
    }
  });
}

function updateActivity() {
  const list = $('activityList');
  if (!list) return;
  const activities = [];

  Object.entries(businessesData).forEach(([bid, biz]) => {
    if (biz.outlets) {
      Object.entries(biz.outlets).forEach(([oid, outlet]) => {
        if (outlet.orders) {
          Object.values(outlet.orders).forEach((order) => {
            const name = outlet.name || biz.name || 'Unknown Store';
            const status = order.status || 'Placed';
            const time = order.createdAt ? formatTimeAgo(order.createdAt) : 'recently';
            activities.push({ id: order.orderId || generateId(), store: name, status, time, total: order.total, ts: order.createdAt || 0 });
          });
        }
      });
    }
  });

  activities.sort((a, b) => b.ts - a.ts);
  const recent = activities.slice(0, 10);

  if (recent.length === 0) {
    list.innerHTML = '<div class="activity-placeholder">No recent orders found.</div>';
    return;
  }

  list.innerHTML = recent.map((a) => {
    const dotClass = { Delivered: 'success', Cancelled: 'error', 'Out for Delivery': 'info', Preparing: 'warning', Confirmed: 'info' }[a.status] || 'info';
    return '<div class="activity-item">' +
      '<span class="activity-dot ' + dotClass + '"></span>' +
      '<div class="activity-text">' +
      '<strong>#' + escapeHtml(a.id).slice(-6) + '</strong> from <strong>' + escapeHtml(a.store) + '</strong> \u2014 ' + escapeHtml(a.status) +
      (a.total ? ' <span class="activity-total">\u20B9' + a.total.toLocaleString('en-IN') + '</span>' : '') +
      '</div>' +
      '<span class="activity-time">' + escapeHtml(a.time) + '</span>' +
      '</div>';
  }).join('');
}

$('btnRefresh')?.addEventListener('click', () => {
  const icon = $('btnRefresh').querySelector('i');
  if (icon) icon.classList.add('spin');
  loadDashboardData();
  setTimeout(() => { if (icon) icon.classList.remove('spin'); }, 600);
});

// ============================
// 2. PARTNER ONBOARDING
// ============================

function loadOnboardingRequests() {
  const tbody = $('onboardingTableBody');
  if (!tbody) return;
  db.ref('onboarding_requests').on('value', (snap) => {
    const requests = snap.val() || {};
    const keys = Object.keys(requests);
    if (keys.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-row">No onboarding requests found.</td></tr>';
      return;
    }
    tbody.innerHTML = keys.map((key) => {
      const r = requests[key];
      return '<tr>' +
        '<td>' + escapeHtml(r.businessName || '—') + '</td>' +
        '<td>' + escapeHtml(r.ownerName || '—') + '</td>' +
        '<td>' + escapeHtml(r.email || '—') + '</td>' +
        '<td>' + escapeHtml(r.phone || '—') + '</td>' +
        '<td>' + formatDate(r.submittedAt) + '</td>' +
        '<td class="actions-cell">' +
        '<button class="btn btn-sm btn-success" onclick="approveRequest(\'' + key + '\', event)" title="Approve"><i data-lucide="check-circle" class="icon-sm"></i></button> ' +
        '<button class="btn btn-sm btn-danger" onclick="rejectRequest(\'' + key + '\', event)" title="Reject"><i data-lucide="x-circle" class="icon-sm"></i></button>' +
        '</td>' +
        '</tr>';
    }).join('');
    if (window.lucide) lucide.createIcons();
  });
}

async function approveRequest(key, event) {
  if (event) event.stopPropagation();
  const snap = await db.ref('onboarding_requests/' + key).once('value');
  const data = snap.val();
  if (!data) { showToast('Request not found', 'error'); return; }

  try {
    const businessId = 'biz_' + Date.now();
    const outletId = 'outlet_' + Date.now();
    const adminPassword = 'Admin@' + Math.random().toString(36).slice(2, 8).toUpperCase();
    const adminEmail = data.email;

    const businessNode = {
      name: data.businessName || 'New Business',
      email: data.email || '',
      phone: data.phone || '',
      ownerName: data.ownerName || '',
      commission: 15,
      createdAt: firebase.database.ServerValue.TIMESTAMP,
      createdBy: currentUser ? currentUser.uid : 'system'
    };

    const outletNode = {
      name: data.outletName || data.businessName || 'Main Outlet',
      address: data.address || '',
      phone: data.phone || '',
      meta: {
        cuisine: data.cuisine || '',
        openingHours: data.openingHours || '9:00 AM - 10:00 PM',
        status: 'active',
        deliveryRadius: data.deliveryRadius || 5
      },
      createdAt: firebase.database.ServerValue.TIMESTAMP
    };

    const updates = {};
    updates['businesses/' + businessId] = businessNode;
    updates['businesses/' + businessId + '/outlets/' + outletId] = outletNode;
    updates['system/admins/' + businessId] = {
      email: adminEmail,
      businessId: businessId,
      outletId: outletId,
      role: 'business_admin',
      createdAt: firebase.database.ServerValue.TIMESTAMP
    };
    updates['system/businessIndex/' + adminEmail.replace(/\./g, ',')] = {
      businessId: businessId,
      outletId: outletId,
      name: businessNode.name
    };
    updates['onboarding_history/' + key] = Object.assign({}, data, {
      approvedAt: firebase.database.ServerValue.TIMESTAMP,
      approvedBy: currentUser ? currentUser.email : 'system',
      businessId: businessId,
      outletId: outletId,
      status: 'approved'
    });
    updates['onboarding_requests/' + key] = null;

    await db.ref().update(updates);

    try {
      const signupUrl = 'https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=' + firebaseConfig.apiKey;
      await fetch(signupUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adminEmail, password: adminPassword, returnSecureToken: true })
      });
    } catch (signupErr) {
      console.warn('Auth account creation via REST failed (may need Admin SDK):', signupErr);
    }

    showSuccessDialog(adminEmail, adminPassword, businessNode.name);
    showToast('Request approved successfully', 'success');
  } catch (err) {
    console.error('Approve error:', err);
    showToast('Error approving request: ' + err.message, 'error');
  }
}

function showSuccessDialog(email, password, businessName) {
  const modal = $('successDialog');
  if (!modal) return;
  const body = $('successDialogBody');
  if (body) {
    body.innerHTML = '<p><strong>Business:</strong> ' + escapeHtml(businessName) + '</p>' +
      '<p><strong>Email:</strong> ' + escapeHtml(email) + '</p>' +
      '<p><strong>Password:</strong> <code>' + escapeHtml(password) + '</code></p>' +
      '<p class="text-warning">Please share these credentials securely with the partner.</p>';
  }
  modal.classList.add('active');
}

$('successDialogClose')?.addEventListener('click', () => {
  $('successDialog')?.classList.remove('active');
});

async function rejectRequest(key, event) {
  if (event) event.stopPropagation();
  confirmAction('Reject this onboarding request?', async () => {
    try {
      const snap = await db.ref('onboarding_requests/' + key).once('value');
      const data = snap.val();
      const updates = {};
      updates['onboarding_history/' + key] = Object.assign({}, data || {}, {
        rejectedAt: firebase.database.ServerValue.TIMESTAMP,
        rejectedBy: currentUser ? currentUser.email : 'system',
        status: 'rejected'
      });
      updates['onboarding_requests/' + key] = null;
      await db.ref().update(updates);
      showToast('Request rejected', 'info');
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
  });
}

$('provisionBtn')?.addEventListener('click', () => {
  $('onboardingModal')?.classList.add('active');
});

$('onboardingModalClose')?.addEventListener('click', () => {
  $('onboardingModal')?.classList.remove('active');
});

$('saveOnboarding')?.addEventListener('click', async () => {
  const data = {
    businessName: $('onboardBizName')?.value,
    ownerName: $('onboardOwnerName')?.value,
    email: $('onboardEmail')?.value,
    phone: $('onboardPhone')?.value,
    address: $('onboardAddress')?.value,
    cuisine: $('onboardCuisine')?.value,
    outletName: $('onboardOutletName')?.value,
    submittedAt: firebase.database.ServerValue.TIMESTAMP,
    provisionedBy: currentUser ? currentUser.email : 'system'
  };
  if (!data.businessName || !data.email) { showToast('Business name and email are required', 'error'); return; }
  try {
    const key = db.ref('onboarding_requests').push().key;
    await db.ref('onboarding_requests/' + key).set(data);
    showToast('Business provisioned successfully', 'success');
    $('onboardingModal')?.classList.remove('active');
    document.querySelectorAll('#onboardingModal input, #onboardingModal textarea').forEach((el) => el.value = '');
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
});

// ============================
// 3. BUSINESSES
// ============================

function loadBusinesses() {
  const tbody = $('businessesTableBody');
  if (!tbody) return;
  db.ref('businesses').on('value', (snap) => {
    businessesData = snap.val() || {};
    renderBusinessesTable();
  });
}

$('businessSearch')?.addEventListener('input', (e) => {
  businessFilter = e.target.value.toLowerCase();
  renderBusinessesTable();
});

$('myBusinessesOnly')?.addEventListener('change', () => {
  renderBusinessesTable();
});

function renderBusinessesTable() {
  const tbody = $('businessesTableBody');
  if (!tbody) return;
  const showMine = $('myBusinessesOnly')?.checked;
  const adminEmail = currentUser ? currentUser.email : '';
  const entries = Object.entries(businessesData);
  const filtered = entries.filter(([bid, biz]) => {
    if (businessFilter && !biz.name?.toLowerCase().includes(businessFilter)) return false;
    if (showMine && biz.email !== adminEmail) return false;
    return true;
  });

  const pageSize = 15;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  if (currentPage.businesses > totalPages) currentPage.businesses = totalPages;
  const start = (currentPage.businesses - 1) * pageSize;
  const page = filtered.slice(start, start + pageSize);

  if (page.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-row">No businesses found.</td></tr>';
    renderPagination('businessesPagination', totalPages, currentPage.businesses, (p) => { currentPage.businesses = p; renderBusinessesTable(); });
    return;
  }

  tbody.innerHTML = page.map(([bid, biz]) => {
    const outletCount = biz.outlets ? Object.keys(biz.outlets).length : 0;
    const orderCount = countBusinessOrders(biz);
    return '<tr>' +
      '<td>' + escapeHtml(biz.name || 'Unnamed') + '</td>' +
      '<td>' + escapeHtml(biz.email || '—') + '</td>' +
      '<td>' + escapeHtml(biz.phone || '—') + '</td>' +
      '<td>' + outletCount + '</td>' +
      '<td>' + orderCount + '</td>' +
      '<td class="actions-cell">' +
      '<button class="btn btn-sm btn-outline" onclick="editBusiness(\'' + bid + '\')" title="Edit"><i data-lucide="edit" class="icon-sm"></i></button> ' +
      '<button class="btn btn-sm btn-outline" onclick="showCommissionModal(\'' + bid + '\')" title="Commission"><i data-lucide="percent" class="icon-sm"></i></button>' +
      '</td>' +
      '</tr>';
  }).join('');
  if (window.lucide) lucide.createIcons();
  renderPagination('businessesPagination', totalPages, currentPage.businesses, (p) => { currentPage.businesses = p; renderBusinessesTable(); });
}

function countBusinessOrders(biz) {
  let count = 0;
  if (biz.outlets) {
    Object.values(biz.outlets).forEach((outlet) => {
      if (outlet.orders) count += Object.keys(outlet.orders).length;
    });
  }
  return count;
}

function editBusiness(bid) {
  const biz = businessesData[bid];
  if (!biz) return;
  const modal = $('outletEditModal');
  if (!modal) return;
  $('editBid')?.value = bid;
  $('editBizName')?.value = biz.name || '';
  $('editBizEmail')?.value = biz.email || '';
  $('editBizPhone')?.value = biz.phone || '';

  const outletSelect = $('editOutletSelect');
  if (outletSelect && biz.outlets) {
    outletSelect.innerHTML = '<option value="">Select Outlet...</option>' +
      Object.keys(biz.outlets).map((oid) => '<option value="' + oid + '">' + escapeHtml(biz.outlets[oid].name || 'Outlet') + '</option>').join('');
  }
  modal.classList.add('active');
}

$('editOutletSelect')?.addEventListener('change', () => {
  const bid = $('editBid')?.value;
  const oid = $('editOutletSelect')?.value;
  if (!bid || !oid) return;
  const outlet = businessesData[bid]?.outlets?.[oid];
  if (!outlet) return;
  $('editOutletName')?.value = outlet.name || '';
  $('editOutletAddress')?.value = outlet.address || '';
  $('editOutletPhone')?.value = outlet.phone || '';
  if (outlet.meta) {
    $('editOutletCuisine')?.value = outlet.meta.cuisine || '';
    $('editOutletHours')?.value = outlet.meta.openingHours || '';
    $('editOutletRadius')?.value = outlet.meta.deliveryRadius || 5;
  }
});

$('saveOutletEdit')?.addEventListener('click', async () => {
  const bid = $('editBid')?.value;
  const oid = $('editOutletSelect')?.value;
  if (!bid || !oid) { showToast('Select an outlet to edit', 'error'); return; }
  try {
    const updates = {};
    updates['businesses/' + bid + '/outlets/' + oid + '/name'] = $('editOutletName')?.value || '';
    updates['businesses/' + bid + '/outlets/' + oid + '/address'] = $('editOutletAddress')?.value || '';
    updates['businesses/' + bid + '/outlets/' + oid + '/phone'] = $('editOutletPhone')?.value || '';
    updates['businesses/' + bid + '/outlets/' + oid + '/meta/cuisine'] = $('editOutletCuisine')?.value || '';
    updates['businesses/' + bid + '/outlets/' + oid + '/meta/openingHours'] = $('editOutletHours')?.value || '';
    updates['businesses/' + bid + '/outlets/' + oid + '/meta/deliveryRadius'] = parseInt($('editOutletRadius')?.value) || 5;
    await db.ref().update(updates);
    showToast('Outlet updated successfully', 'success');
    $('outletEditModal')?.classList.remove('active');
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
});

$('outletEditModalClose')?.addEventListener('click', () => {
  $('outletEditModal')?.classList.remove('active');
});

function showCommissionModal(bid) {
  const biz = businessesData[bid];
  if (!biz) return;
  $('commissionBid')?.value = bid;
  $('commissionValue')?.value = biz.commission || 15;
  $('commissionModal')?.classList.add('active');
}

$('commissionModalClose')?.addEventListener('click', () => {
  $('commissionModal')?.classList.remove('active');
});

$('saveCommission')?.addEventListener('click', async () => {
  const bid = $('commissionBid')?.value;
  const val = parseFloat($('commissionValue')?.value);
  if (!bid || isNaN(val) || val < 0 || val > 100) { showToast('Enter a valid commission (0-100)', 'error'); return; }
  try {
    await db.ref('businesses/' + bid + '/commission').set(val);
    showToast('Commission updated', 'success');
    $('commissionModal')?.classList.remove('active');
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
});

// ============================
// 4. LIVE ORDERS
// ============================

function loadAllOrders() {
  allOrders = {};
  Object.entries(businessesData).forEach(([bid, biz]) => {
    if (biz.outlets) {
      Object.entries(biz.outlets).forEach(([oid, outlet]) => {
        if (outlet.orders) {
          Object.entries(outlet.orders).forEach(([orderId, order]) => {
            allOrders[orderId] = Object.assign({}, order, { bid, oid, storeName: outlet.name || biz.name || 'Unknown' });
          });
        }
        const orderRef = db.ref('businesses/' + bid + '/outlets/' + oid + '/orders');
        orderRef.on('child_added', (snap) => {
          const o = snap.val();
          allOrders[snap.key] = Object.assign({}, o, { bid, oid, storeName: outlet.name || biz.name || 'Unknown' });
          renderOrders();
        });
        orderRef.on('child_changed', (snap) => {
          const o = snap.val();
          if (allOrders[snap.key]) Object.assign(allOrders[snap.key], o);
          renderOrders();
        });
        orderRef.on('child_removed', (snap) => {
          delete allOrders[snap.key];
          renderOrders();
        });
      });
    }
  });
  renderOrders();
}

$('orderStatusFilter')?.addEventListener('change', (e) => {
  selectedStatusFilter = e.target.value;
  renderOrders();
});

$('orderViewToggle')?.addEventListener('change', (e) => {
  currentView = e.target.checked ? 'kanban' : 'table';
  renderOrders();
});

function renderOrders() {
  if (currentView === 'kanban') {
    $('ordersTableView')?.classList.add('hidden');
    $('ordersKanbanView')?.classList.remove('hidden');
    renderKanban();
  } else {
    $('ordersTableView')?.classList.remove('hidden');
    $('ordersKanbanView')?.classList.add('hidden');
    renderOrdersTable();
  }
}

function renderOrdersTable() {
  const tbody = $('ordersTableBody');
  if (!tbody) return;
  const orders = Object.values(allOrders).filter((o) => selectedStatusFilter === 'All' || o.status === selectedStatusFilter);
  orders.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  if (orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-row">No orders found.</td></tr>';
    return;
  }

  tbody.innerHTML = orders.map((o) => {
    const statusClass = (o.status || 'Placed').toLowerCase().replace(/\s+/g, '-');
    return '<tr>' +
      '<td>#' + escapeHtml(o.orderId || o._id || '').slice(-8) + '</td>' +
      '<td>' + escapeHtml(o.storeName) + '</td>' +
      '<td>' + escapeHtml(o.customerName || o.name || '—') + '</td>' +
      '<td>\u20B9' + (o.total || 0).toLocaleString('en-IN') + '</td>' +
      '<td><span class="status-badge status-' + statusClass + '">' + escapeHtml(o.status || 'Placed') + '</span></td>' +
      '<td>' + formatDate(o.createdAt) + '</td>' +
      '<td class="actions-cell">' +
      '<select class="form-select form-select-sm" onchange="updateOrderStatus(\'' + o.bid + '\',\'' + o.oid + '\',\'' + (o.orderId || Object.keys(allOrders).find(k => allOrders[k] === o)) + '\',this.value)">' +
      '<option value="Placed"' + (o.status === 'Placed' ? ' selected' : '') + '>Placed</option>' +
      '<option value="Confirmed"' + (o.status === 'Confirmed' ? ' selected' : '') + '>Confirmed</option>' +
      '<option value="Preparing"' + (o.status === 'Preparing' ? ' selected' : '') + '>Preparing</option>' +
      '<option value="Out for Delivery"' + (o.status === 'Out for Delivery' ? ' selected' : '') + '>Out for Delivery</option>' +
      '<option value="Delivered"' + (o.status === 'Delivered' ? ' selected' : '') + '>Delivered</option>' +
      '<option value="Cancelled"' + (o.status === 'Cancelled' ? ' selected' : '') + '>Cancelled</option>' +
      '</select>' +
      '</td>' +
      '</tr>';
  }).join('');
}

const ORDER_STATUSES = ['Placed', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'];

function renderKanban() {
  const container = $('kanbanContainer');
  if (!container) return;
  const columns = ORDER_STATUSES.map((status) => {
    const orders = Object.values(allOrders).filter((o) => (o.status || 'Placed') === status);
    return '<div class="kanban-column" data-status="' + status + '" ondrop="handleDrop(event)" ondragover="handleDragOver(event)">' +
      '<div class="kanban-header">' +
      '<span class="kanban-title">' + status + '</span>' +
      '<span class="kanban-count">' + orders.length + '</span>' +
      '</div>' +
      '<div class="kanban-body">' +
      orders.map((o) => {
        const orderKey = o.orderId || Object.keys(allOrders).find(k => allOrders[k] === o) || '';
        return '<div class="kanban-card" draggable="true" ' +
          'ondragstart="handleDragStart(event, \'' + o.bid + '\', \'' + o.oid + '\', \'' + orderKey + '\')" ' +
          'data-order-id="' + orderKey + '">' +
          '<div class="kanban-card-id">#' + escapeHtml(orderKey).slice(-8) + '</div>' +
          '<div class="kanban-card-store">' + escapeHtml(o.storeName) + '</div>' +
          '<div class="kanban-card-customer">' + escapeHtml(o.customerName || o.name || '—') + '</div>' +
          '<div class="kanban-card-total">\u20B9' + (o.total || 0).toLocaleString('en-IN') + '</div>' +
          '</div>';
      }).join('') +
      '</div>' +
      '</div>';
  }).join('');
  container.innerHTML = columns.join('');
}

function handleDragStart(event, bid, oid, orderId) {
  currentDragOrder = { bid, oid, orderId };
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', JSON.stringify(currentDragOrder));
}

function handleDragOver(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
  const column = event.target.closest('.kanban-column');
  if (column) column.classList.add('drag-over');
}

document.addEventListener('dragend', () => {
  document.querySelectorAll('.kanban-column').forEach((c) => c.classList.remove('drag-over'));
});

function handleDrop(event) {
  event.preventDefault();
  const column = event.target.closest('.kanban-column');
  if (!column) return;
  const newStatus = column.dataset.status;
  if (!currentDragOrder) {
    try { currentDragOrder = JSON.parse(event.dataTransfer.getData('text/plain')); } catch (e) { return; }
  }
  if (currentDragOrder && newStatus) {
    updateOrderStatus(currentDragOrder.bid, currentDragOrder.oid, currentDragOrder.orderId, newStatus);
  }
  currentDragOrder = null;
  document.querySelectorAll('.kanban-column').forEach((c) => c.classList.remove('drag-over'));
}

async function updateOrderStatus(bid, oid, orderId, status) {
  if (!bid || !oid || !orderId) return;
  try {
    await db.ref('businesses/' + bid + '/outlets/' + oid + '/orders/' + orderId + '/status').set(status);

    const order = allOrders[orderId];
    if (order && status === 'Delivered' && order.riderId) {
      const riderRef = db.ref('riders/' + order.riderId);
      const riderSnap = await riderRef.once('value');
      const rider = riderSnap.val();
      if (rider) {
        await riderRef.update({
          totalDeliveries: (rider.totalDeliveries || 0) + 1,
          totalEarnings: (rider.totalEarnings || 0) + (order.deliveryFee || 0),
          lastDelivery: firebase.database.ServerValue.TIMESTAMP
        });
      }
    }

    showToast('Order status updated to ' + status, 'success');
  } catch (err) {
    console.error('Status update error:', err);
    showToast('Error updating status', 'error');
  }
}

// ============================
// 5. RIDERS
// ============================

function loadRiders() {
  const tbody = $('ridersTableBody');
  if (!tbody) return;
  db.ref('riders').on('value', (snap) => {
    allRiders = snap.val() || {};
    renderRidersTable();
  });
}

$('riderSearch')?.addEventListener('input', (e) => {
  riderFilter = e.target.value.toLowerCase();
  renderRidersTable();
});

function renderRidersTable() {
  const tbody = $('ridersTableBody');
  if (!tbody) return;
  const entries = Object.entries(allRiders).filter(([uid, r]) => {
    const name = (r.name || r.displayName || '').toLowerCase();
    const email = (r.email || '').toLowerCase();
    const phone = (r.phone || '').toLowerCase();
    return !riderFilter || name.includes(riderFilter) || email.includes(riderFilter) || phone.includes(riderFilter);
  });

  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(entries.length / pageSize));
  if (currentPage.riders > totalPages) currentPage.riders = totalPages;
  const start = (currentPage.riders - 1) * pageSize;
  const page = entries.slice(start, start + pageSize);

  if (page.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-row">No riders found.</td></tr>';
    renderPagination('ridersPagination', totalPages, currentPage.riders, (p) => { currentPage.riders = p; renderRidersTable(); });
    return;
  }

  tbody.innerHTML = page.map(([uid, r]) => {
    const statusClass = (r.status || 'offline').toLowerCase();
    return '<tr>' +
      '<td>' + escapeHtml(r.name || r.displayName || '—') + '</td>' +
      '<td>' + escapeHtml(r.email || '—') + '</td>' +
      '<td>' + escapeHtml(r.phone || '—') + '</td>' +
      '<td><span class="status-dot status-' + statusClass + '"></span> ' + escapeHtml(r.status || 'Offline') + '</td>' +
      '<td>' + (r.totalDeliveries || 0) + '</td>' +
      '<td>\u20B9' + (r.totalEarnings || 0).toLocaleString('en-IN') + '</td>' +
      '<td class="actions-cell">' +
      '<button class="btn btn-sm btn-outline" onclick="editRider(\'' + uid + '\')" title="Edit"><i data-lucide="edit" class="icon-sm"></i></button> ' +
      '<button class="btn btn-sm btn-outline" onclick="resetRiderPassword(\'' + escapeHtml(r.email || '') + '\')" title="Reset Password"><i data-lucide="key" class="icon-sm"></i></button> ' +
      '<button class="btn btn-sm btn-danger" onclick="deleteRider(\'' + uid + '\')" title="Delete"><i data-lucide="trash-2" class="icon-sm"></i></button>' +
      '</td>' +
      '</tr>';
  }).join('');
  if (window.lucide) lucide.createIcons();
  renderPagination('ridersPagination', totalPages, currentPage.riders, (p) => { currentPage.riders = p; renderRidersTable(); });
}

$('addRiderBtn')?.addEventListener('click', () => {
  $('riderModal')?.classList.add('active');
  $('riderModalTitle').textContent = 'Add Rider';
  ['riderName', 'riderEmail', 'riderPhone', 'riderVehicle'].forEach((id) => {
    const el = $(id);
    if (el) el.value = '';
  });
  $('saveRiderBtn')?.dataset.mode = 'add';
});

$('riderModalClose')?.addEventListener('click', () => {
  $('riderModal')?.classList.remove('active');
});

$('saveRiderBtn')?.addEventListener('click', async () => {
  const mode = $('saveRiderBtn')?.dataset.mode || 'add';
  const name = $('riderName')?.value;
  const email = $('riderEmail')?.value;
  const phone = $('riderPhone')?.value;
  const vehicle = $('riderVehicle')?.value;

  if (!name || !email || !phone) { showToast('Name, email, and phone are required', 'error'); return; }

  try {
    if (mode === 'add') {
      const password = 'Rider@' + Math.random().toString(36).slice(2, 8).toUpperCase();
      const signupUrl = 'https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=' + firebaseConfig.apiKey;
      const resp = await fetch(signupUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true })
      });
      const authData = await resp.json();
      if (authData.error) throw new Error(authData.error.message);

      const uid = authData.localId;
      await db.ref('riders/' + uid).set({
        name,
        email,
        phone,
        vehicle: vehicle || '',
        status: 'Offline',
        totalDeliveries: 0,
        totalEarnings: 0,
        createdAt: firebase.database.ServerValue.TIMESTAMP,
        createdBy: currentUser ? currentUser.email : 'system'
      });

      showToast('Rider added. Password: ' + password, 'success');
    } else {
      const uid = $('saveRiderBtn')?.dataset.uid;
      if (!uid) return;
      await db.ref('riders/' + uid).update({ name, email, phone, vehicle });
      showToast('Rider updated', 'success');
    }
    $('riderModal')?.classList.remove('active');
  } catch (err) {
    console.error('Rider save error:', err);
    showToast('Error: ' + err.message, 'error');
  }
});

function editRider(uid) {
  const r = allRiders[uid];
  if (!r) return;
  $('riderModal')?.classList.add('active');
  $('riderModalTitle').textContent = 'Edit Rider';
  $('riderName').value = r.name || r.displayName || '';
  $('riderEmail').value = r.email || '';
  $('riderPhone').value = r.phone || '';
  $('riderVehicle').value = r.vehicle || '';
  $('saveRiderBtn').dataset.mode = 'edit';
  $('saveRiderBtn').dataset.uid = uid;
}

function resetRiderPassword(email) {
  if (!email) { showToast('No email address', 'error'); return; }
  confirmAction('Send password reset email to ' + email + '?', async () => {
    try {
      await auth.sendPasswordResetEmail(email);
      showToast('Password reset email sent to ' + email, 'success');
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
  });
}

function deleteRider(uid) {
  confirmAction('Delete this rider permanently?', async () => {
    try {
      await db.ref('riders/' + uid).remove();
      showToast('Rider deleted', 'success');
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
  });
}

// ============================
// 6. USERS
// ============================

function loadUsers() {
  const tbody = $('usersTableBody');
  if (!tbody) return;
  db.ref('users').on('value', (snap) => {
    allUsers = snap.val() || {};
    renderUsersTable();
  });
}

$('userSearch')?.addEventListener('input', (e) => {
  userFilter = e.target.value.toLowerCase();
  renderUsersTable();
});

function renderUsersTable() {
  const tbody = $('usersTableBody');
  if (!tbody) return;
  const entries = Object.entries(allUsers).filter(([uid, u]) => {
    const name = (u.name || u.displayName || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    const phone = (u.phone || '').toLowerCase();
    return !userFilter || name.includes(userFilter) || email.includes(userFilter) || phone.includes(userFilter);
  });

  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(entries.length / pageSize));
  if (currentPage.users > totalPages) currentPage.users = totalPages;
  const start = (currentPage.users - 1) * pageSize;
  const page = entries.slice(start, start + pageSize);

  if (page.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-row">No users found.</td></tr>';
    renderPagination('usersPagination', totalPages, currentPage.users, (p) => { currentPage.users = p; renderUsersTable(); });
    return;
  }

  tbody.innerHTML = page.map(([uid, u]) => {
    const wallet = u.wallet || 0;
    return '<tr>' +
      '<td>' + escapeHtml(u.name || u.displayName || '—') + '</td>' +
      '<td>' + escapeHtml(u.email || '—') + '</td>' +
      '<td>' + escapeHtml(u.phone || '—') + '</td>' +
      '<td>\u20B9' + (typeof wallet === 'number' ? wallet.toLocaleString('en-IN') : wallet) + '</td>' +
      '<td>' + formatDate(u.createdAt || u.created_at) + '</td>' +
      '<td class="actions-cell">' +
      '<button class="btn btn-sm btn-outline" onclick="showWalletModal(\'' + uid + '\')" title="Credit Wallet"><i data-lucide="wallet" class="icon-sm"></i></button> ' +
      '<button class="btn btn-sm btn-outline" onclick="showWalletHistory(\'' + uid + '\')" title="Wallet History"><i data-lucide="clock" class="icon-sm"></i></button> ' +
      '<button class="btn btn-sm btn-outline" onclick="resetUserPassword(\'' + escapeHtml(u.email || '') + '\')" title="Reset Password"><i data-lucide="key" class="icon-sm"></i></button>' +
      '</td>' +
      '</tr>';
  }).join('');
  if (window.lucide) lucide.createIcons();
  renderPagination('usersPagination', totalPages, currentPage.users, (p) => { currentPage.users = p; renderUsersTable(); });
}

function showWalletModal(uid) {
  const u = allUsers[uid];
  if (!u) return;
  $('walletUid')?.value = uid;
  $('walletCurrentBalance')?.textContent = '\u20B9' + ((u.wallet || 0).toLocaleString('en-IN'));
  $('walletAmount')?.value = '';
  $('walletNote')?.value = '';
  $('walletModal')?.classList.add('active');
}

$('walletModalClose')?.addEventListener('click', () => {
  $('walletModal')?.classList.remove('active');
});

$('creditWalletBtn')?.addEventListener('click', async () => {
  const uid = $('walletUid')?.value;
  const amount = parseFloat($('walletAmount')?.value);
  const note = $('walletNote')?.value || 'Manual credit';
  if (!uid || isNaN(amount) || amount <= 0) { showToast('Enter a valid amount', 'error'); return; }
  try {
    const userRef = db.ref('users/' + uid);
    const txId = 'txn_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    const tx = {
      type: 'credit',
      amount: amount,
      balance: (allUsers[uid].wallet || 0) + amount,
      note: note,
      createdAt: firebase.database.ServerValue.TIMESTAMP,
      createdBy: currentUser ? currentUser.email : 'system'
    };
    const updates = {};
    updates['users/' + uid + '/wallet'] = firebase.database.ServerValue.increment(amount);
    updates['users/' + uid + '/walletHistory/' + txId] = tx;
    updates['system/auditLogs/' + txId] = Object.assign({}, tx, { userId: uid, action: 'wallet_credit' });
    await db.ref().update(updates);
    if (allUsers[uid]) allUsers[uid].wallet = (allUsers[uid].wallet || 0) + amount;
    showToast('\u20B9' + amount.toLocaleString('en-IN') + ' credited successfully', 'success');
    $('walletModal')?.classList.remove('active');
    renderUsersTable();
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
});

function resetUserPassword(email) {
  if (!email) { showToast('No email address', 'error'); return; }
  confirmAction('Send password reset email to ' + email + '?', async () => {
    try {
      await auth.sendPasswordResetEmail(email);
      showToast('Password reset email sent', 'success');
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
  });
}

function showWalletHistory(uid) {
  const u = allUsers[uid];
  if (!u || !u.walletHistory) { showToast('No wallet history', 'info'); return; }
  const history = Object.values(u.walletHistory);
  history.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  const recent = history.slice(0, 5);

  const modal = $('walletHistoryModal');
  if (!modal) return;
  const body = $('walletHistoryBody');
  if (body) {
    if (recent.length === 0) {
      body.innerHTML = '<tr><td colspan="4" class="empty-row">No transactions</td></tr>';
    } else {
      body.innerHTML = recent.map((t) => {
        const typeClass = t.type === 'credit' ? 'text-success' : 'text-danger';
        return '<tr>' +
          '<td>' + formatDate(t.createdAt) + '</td>' +
          '<td class="' + typeClass + '">' + escapeHtml(t.type || '—') + '</td>' +
          '<td>\u20B9' + (t.amount || 0).toLocaleString('en-IN') + '</td>' +
          '<td>' + escapeHtml(t.note || '—') + '</td>' +
          '</tr>';
      }).join('');
    }
  }
  modal.classList.add('active');
}

$('walletHistoryModalClose')?.addEventListener('click', () => {
  $('walletHistoryModal')?.classList.remove('active');
});

$('exportUsersBtn')?.addEventListener('click', () => {
  const headers = ['Name', 'Email', 'Phone', 'Wallet Balance', 'Created At'];
  const rows = Object.values(allUsers).map((u) => [
    u.name || u.displayName || '',
    u.email || '',
    u.phone || '',
    u.wallet || 0,
    formatDate(u.createdAt || u.created_at)
  ]);
  exportCSV(headers, rows, 'users_export');
  showToast('Users exported', 'success');
});

// ============================
// 7. PROMOTIONS
// ============================

function loadPromotions() {
  loadSurge();
  loadGlobalDiscount();
  loadPlatformFee();
  loadCoupons();
}

function loadSurge() {
  const el = $('surgeMultiplier');
  const reasonEl = $('surgeReason');
  if (!el || !reasonEl) return;
  db.ref('system/promotions/surge').on('value', (snap) => {
    allPromotions.surge = snap.val() || {};
    el.value = allPromotions.surge.multiplier || 1.0;
    reasonEl.value = allPromotions.surge.reason || '';
  });
}

$('saveSurgeBtn')?.addEventListener('click', async () => {
  try {
    await db.ref('system/promotions/surge').set({
      multiplier: parseFloat($('surgeMultiplier')?.value || 1.0),
      reason: $('surgeReason')?.value || '',
      updatedAt: firebase.database.ServerValue.TIMESTAMP,
      updatedBy: currentUser ? currentUser.email : 'system'
    });
    showToast('Surge pricing updated', 'success');
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
});

function loadGlobalDiscount() {
  const el = $('discountPercent');
  if (!el) return;
  db.ref('system/promotions/globalDiscount').on('value', (snap) => {
    allPromotions.discount = snap.val() || {};
    el.value = allPromotions.discount.percent || 0;
  });
}

$('saveDiscountBtn')?.addEventListener('click', async () => {
  try {
    await db.ref('system/promotions/globalDiscount').set({
      percent: parseFloat($('discountPercent')?.value || 0),
      updatedAt: firebase.database.ServerValue.TIMESTAMP,
      updatedBy: currentUser ? currentUser.email : 'system'
    });
    showToast('Global discount updated', 'success');
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
});

function loadPlatformFee() {
  const el = $('platformFee');
  if (!el) return;
  db.ref('system/config/platformFee').on('value', (snap) => {
    allPromotions.platformFee = snap.val() || 0;
    el.value = allPromotions.platformFee;
  });
}

$('savePlatformFeeBtn')?.addEventListener('click', async () => {
  try {
    await db.ref('system/config/platformFee').set({
      fee: parseFloat($('platformFee')?.value || 0),
      updatedAt: firebase.database.ServerValue.TIMESTAMP,
      updatedBy: currentUser ? currentUser.email : 'system'
    });
    showToast('Platform fee updated', 'success');
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
});

// --- Coupons ---

function loadCoupons() {
  const tbody = $('couponsTableBody');
  if (!tbody) return;
  db.ref('system/promotions/coupons').on('value', (snap) => {
    allCoupons = snap.val() || {};
    renderCoupons();
  });
}

function renderCoupons() {
  const tbody = $('couponsTableBody');
  if (!tbody) return;
  const codes = Object.keys(allCoupons);
  if (codes.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-row">No coupons created.</td></tr>';
    return;
  }
  tbody.innerHTML = codes.map((code) => {
    const c = allCoupons[code];
    const activeClass = c.active ? 'text-success' : 'text-danger';
    return '<tr>' +
      '<td><code>' + escapeHtml(code) + '</code></td>' +
      '<td>' + escapeHtml(c.type || 'flat') + '</td>' +
      '<td>' + (c.type === 'percent' ? c.value + '%' : '\u20B9' + (c.value || 0)) + '</td>' +
      '<td>\u20B9' + (c.minOrder || 0) + '</td>' +
      '<td>' + (c.usedCount || 0) + '/' + (c.usageLimit || '∞') + '</td>' +
      '<td><span class="badge ' + activeClass + '">' + (c.active ? 'Active' : 'Paused') + '</span></td>' +
      '<td class="actions-cell">' +
      '<button class="btn btn-sm btn-outline" onclick="toggleCoupon(\'' + escapeHtml(code) + '\')" title="' + (c.active ? 'Pause' : 'Activate') + '"><i data-lucide="' + (c.active ? 'pause-circle' : 'play-circle') + '" class="icon-sm"></i></button> ' +
      '<button class="btn btn-sm btn-danger" onclick="deleteCoupon(\'' + escapeHtml(code) + '\')" title="Delete"><i data-lucide="trash-2" class="icon-sm"></i></button>' +
      '</td>' +
      '</tr>';
  }).join('');
  if (window.lucide) lucide.createIcons();
}

$('addCouponBtn')?.addEventListener('click', () => {
  $('couponModal')?.classList.add('active');
  ['couponCode', 'couponType', 'couponValue', 'couponMinOrder', 'couponUsageLimit'].forEach((id) => {
    const el = $(id);
    if (el) el.value = '';
  });
  const typeEl = $('couponType');
  if (typeEl) typeEl.value = 'flat';
});

$('couponModalClose')?.addEventListener('click', () => {
  $('couponModal')?.classList.remove('active');
});

$('saveCouponBtn')?.addEventListener('click', async () => {
  const now = Date.now();
  const recent = couponRateLimit.filter((t) => now - t < 60000);
  if (recent.length >= 10) { showToast('Rate limit: max 10 coupons per minute', 'error'); return; }

  const code = ($('couponCode')?.value || '').trim().toUpperCase().replace(/\s+/g, '_');
  const type = $('couponType')?.value || 'flat';
  const value = parseFloat($('couponValue')?.value) || 0;
  const minOrder = parseFloat($('couponMinOrder')?.value) || 0;
  const usageLimit = parseInt($('couponUsageLimit')?.value) || 0;

  if (!code || !value) { showToast('Coupon code and value are required', 'error'); return; }
  if (allCoupons[code]) { showToast('Coupon code already exists', 'error'); return; }

  try {
    await db.ref('system/promotions/coupons/' + code).set({
      type,
      value,
      minOrder,
      usageLimit: usageLimit || null,
      usedCount: 0,
      active: true,
      createdAt: firebase.database.ServerValue.TIMESTAMP,
      createdBy: currentUser ? currentUser.email : 'system'
    });
    couponRateLimit.push(Date.now());
    showToast('Coupon ' + code + ' created', 'success');
    $('couponModal')?.classList.remove('active');
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
});

async function toggleCoupon(code) {
  try {
    const c = allCoupons[code];
    await db.ref('system/promotions/coupons/' + code + '/active').set(!c.active);
    showToast('Coupon ' + (c.active ? 'paused' : 'activated'), 'success');
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
}

async function deleteCoupon(code) {
  confirmAction('Delete coupon ' + code + '?', async () => {
    try {
      await db.ref('system/promotions/coupons/' + code).remove();
      showToast('Coupon deleted', 'success');
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
  });
}

$('pauseAllCouponsBtn')?.addEventListener('click', async () => {
  confirmAction('Pause all active coupons?', async () => {
    try {
      const updates = {};
      Object.keys(allCoupons).forEach((code) => {
        if (allCoupons[code].active) updates['system/promotions/coupons/' + code + '/active'] = false;
      });
      if (Object.keys(updates).length > 0) await db.ref().update(updates);
      showToast('All coupons paused', 'success');
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
  });
});

$('exportCouponsBtn')?.addEventListener('click', () => {
  const headers = ['Code', 'Type', 'Value', 'Min Order', 'Used Count', 'Usage Limit', 'Active'];
  const rows = Object.entries(allCoupons).map(([code, c]) => [
    code,
    c.type || 'flat',
    c.value || 0,
    c.minOrder || 0,
    c.usedCount || 0,
    c.usageLimit || '∞',
    c.active ? 'Yes' : 'No'
  ]);
  exportCSV(headers, rows, 'coupons_export');
  showToast('Coupons exported', 'success');
});

// ============================
// 8. SETTLEMENTS
// ============================

function loadSettlements() {
  allSettlements = [];
  Object.entries(businessesData).forEach(([bid, biz]) => {
    if (biz.outlets) {
      Object.entries(biz.outlets).forEach(([oid, outlet]) => {
        if (outlet.settlements) {
          Object.entries(outlet.settlements).forEach(([key, s]) => {
            allSettlements.push(Object.assign({}, s, { key, bid, oid, storeName: outlet.name || biz.name || 'Unknown' }));
          });
        }
      });
    }
  });
  renderSettlements();
}

function renderSettlements() {
  const tbody = $('settlementsTableBody');
  if (!tbody) return;

  const fromTs = parseInt($('settlementFrom')?.value) ? new Date($('settlementFrom').value).getTime() : 0;
  const toTs = parseInt($('settlementTo')?.value) ? new Date($('settlementTo').value).getTime() + 86400000 : Infinity;

  const filtered = allSettlements.filter((s) => {
    const ts = s.createdAt || s.date || 0;
    return ts >= fromTs && ts <= toTs;
  });

  filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  const totalVolume = filtered.reduce((sum, s) => sum + (s.amount || s.total || 0), 0);
  const totalCommission = filtered.reduce((sum, s) => sum + (s.commission || s.platformFee || 0), 0);
  const pending = filtered.filter((s) => s.status !== 'SETTLED' && s.status !== 'settled');
  const settled = filtered.filter((s) => s.status === 'SETTLED' || s.status === 'settled');

  $('settlementTotalVolume') ? $('settlementTotalVolume').textContent = '\u20B9' + totalVolume.toLocaleString('en-IN') : null;
  $('settlementTotalCommission') ? $('settlementTotalCommission').textContent = '\u20B9' + totalCommission.toLocaleString('en-IN') : null;
  $('settlementPending') ? $('settlementPending').textContent = pending.length : null;
  $('settlementTotalSettled') ? $('settlementTotalSettled').textContent = '\u20B9' + settled.reduce((sum, s) => sum + (s.amount || s.total || 0), 0).toLocaleString('en-IN') : null;

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-row">No settlements found.</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map((s) => {
    const isSettled = s.status === 'SETTLED' || s.status === 'settled';
    return '<tr>' +
      '<td>' + escapeHtml(s.storeName) + '</td>' +
      '<td>\u20B9' + (s.amount || s.total || 0).toLocaleString('en-IN') + '</td>' +
      '<td>\u20B9' + (s.commission || s.platformFee || 0).toLocaleString('en-IN') + '</td>' +
      '<td>' + formatDate(s.createdAt || s.date) + '</td>' +
      '<td>' + (s.period || '—') + '</td>' +
      '<td><span class="badge ' + (isSettled ? 'text-success' : 'text-warning') + '">' + (isSettled ? 'Settled' : 'Pending') + '</span></td>' +
      '<td>' +
      (!isSettled ? '<button class="btn btn-sm btn-success" onclick="settleAction(\'' + s.bid + '\',\'' + s.oid + '\',\'' + s.key + '\',\'' + (s.amount || s.total || 0) + '\')">Settle Now</button>' : '—') +
      '</td>' +
      '</tr>';
  }).join('');
}

$('settlementFilterBtn')?.addEventListener('click', renderSettlements);

async function settleAction(bid, oid, key, amount) {
  confirmAction('Settle this amount of \u20B9' + parseFloat(amount).toLocaleString('en-IN') + '?', async () => {
    try {
      const settlementRef = db.ref('businesses/' + bid + '/outlets/' + oid + '/settlements/' + key);
      const snap = await settlementRef.once('value');
      const data = snap.val();
      if (!data) { showToast('Settlement not found', 'error'); return; }

      const ledgerId = 'ledger_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
      const ledgerEntry = {
        type: 'settlement',
        amount: data.amount || data.total || 0,
        commission: data.commission || data.platformFee || 0,
        netAmount: (data.amount || data.total || 0) - (data.commission || data.platformFee || 0),
        status: 'SETTLED',
        settledAt: firebase.database.ServerValue.TIMESTAMP,
        settledBy: currentUser ? currentUser.email : 'system',
        period: data.period || '',
        businessId: bid,
        outletId: oid
      };

      const updates = {};
      updates['businesses/' + bid + '/outlets/' + oid + '/settlements/' + key + '/status'] = 'SETTLED';
      updates['businesses/' + bid + '/outlets/' + oid + '/settlements/' + key + '/settledAt'] = firebase.database.ServerValue.TIMESTAMP;
      updates['businesses/' + bid + '/outlets/' + oid + '/settlements/' + key + '/settledBy'] = currentUser ? currentUser.email : 'system';
      updates['system/ledger/' + ledgerId] = ledgerEntry;
      updates['system/auditLogs/' + ledgerId] = Object.assign({}, ledgerEntry, { action: 'settlement_completed' });
      await db.ref().update(updates);
      showToast('Settlement completed', 'success');
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
  });
}

$('exportSettlementsBtn')?.addEventListener('click', () => {
  const rows = allSettlements.map((s) => [
    s.storeName || '',
    s.amount || s.total || 0,
    s.commission || s.platformFee || 0,
    (s.amount || s.total || 0) - (s.commission || s.platformFee || 0),
    s.status || 'Pending',
    formatDate(s.createdAt || s.date || ''),
    s.period || ''
  ]);
  exportCSV(
    ['Store', 'Amount', 'Commission', 'Net', 'Status', 'Date', 'Period'],
    rows,
    'settlements_export'
  );
  showToast('Settlements exported', 'success');
});

// ============================
// 9. SERVICE SLABS (DELIVERY)
// ============================

function loadDeliverySlabs() {
  const container = $('deliverySlabsContainer');
  if (!container) return;
  db.ref('system/settings/delivery/slabs').on('value', (snap) => {
    deliverySlabs = snap.val() || [];
    renderDeliverySlabs();
  });
}

function renderDeliverySlabs() {
  const container = $('deliverySlabsContainer');
  if (!container) return;
  if (!Array.isArray(deliverySlabs) || deliverySlabs.length === 0) {
    container.innerHTML = '<div class="empty-row">No delivery slabs configured. Add one below.</div>';
    return;
  }
  container.innerHTML = deliverySlabs.map((slab, idx) => {
    return '<div class="slab-row">' +
      '<input class="form-input slab-input" value="' + escapeHtml(slab.minDistance || 0) + '" placeholder="Min (km)" onchange="updateSlab(' + idx + ',\'minDistance\',this.value)">' +
      '<input class="form-input slab-input" value="' + escapeHtml(slab.maxDistance || 0) + '" placeholder="Max (km)" onchange="updateSlab(' + idx + ',\'maxDistance\',this.value)">' +
      '<input class="form-input slab-input" value="' + escapeHtml(slab.fee || 0) + '" placeholder="Fee (\u20B9)" onchange="updateSlab(' + idx + ',\'fee\',this.value)">' +
      '<input class="form-input slab-input" value="' + escapeHtml(slab.estimatedTime || '') + '" placeholder="Est. time" onchange="updateSlab(' + idx + ',\'estimatedTime\',this.value)">' +
      '<button class="btn btn-sm btn-danger" onclick="removeSlab(' + idx + ')"><i data-lucide="trash-2" class="icon-sm"></i></button>' +
      '</div>';
  }).join('');
  if (window.lucide) lucide.createIcons();
}

function updateSlab(idx, field, value) {
  if (!deliverySlabs[idx]) deliverySlabs[idx] = {};
  deliverySlabs[idx][field] = field === 'estimatedTime' ? value : parseFloat(value) || 0;
}

$('addSlabBtn')?.addEventListener('click', () => {
  deliverySlabs.push({ minDistance: 0, maxDistance: 0, fee: 0, estimatedTime: '' });
  renderDeliverySlabs();
});

function removeSlab(idx) {
  confirmAction('Remove this slab?', () => {
    deliverySlabs.splice(idx, 1);
    saveAllSlabs();
  });
}

$('saveDeliverySlabsBtn')?.addEventListener('click', saveAllSlabs);

async function saveAllSlabs() {
  try {
    const clean = deliverySlabs.map((s) => ({
      minDistance: parseFloat(s.minDistance) || 0,
      maxDistance: parseFloat(s.maxDistance) || 0,
      fee: parseFloat(s.fee) || 0,
      estimatedTime: s.estimatedTime || ''
    }));
    await db.ref('system/settings/delivery/slabs').set(clean);
    showToast('Delivery slabs saved', 'success');
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
}

// ============================
// 10. INVENTORY
// ============================

function loadInventory() {
  allInventory = [];
  Object.entries(businessesData).forEach(([bid, biz]) => {
    if (biz.outlets) {
      Object.entries(biz.outlets).forEach(([oid, outlet]) => {
        const dishList = outlet.dishes || outlet.inventory || {};
        Object.entries(dishList).forEach(([dishId, dish]) => {
          allInventory.push(Object.assign({}, dish, { dishId, bid, oid, storeName: outlet.name || biz.name || 'Unknown' }));
        });
      });
    }
  });
  renderInventory();
}

$('inventorySearch')?.addEventListener('input', (e) => {
  inventoryFilter = e.target.value.toLowerCase();
  renderInventory();
});

function renderInventory() {
  const tbody = $('inventoryTableBody');
  if (!tbody) return;
  const filtered = allInventory.filter((d) => {
    const name = (d.name || d.title || '').toLowerCase();
    return !inventoryFilter || name.includes(inventoryFilter);
  });

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-row">No inventory items found.</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map((d) => {
    const stock = d.stock !== undefined ? d.stock : (d.available ? 10 : 0);
    const available = d.available !== false;
    return '<tr>' +
      '<td>' + escapeHtml(d.storeName) + '</td>' +
      '<td>' + escapeHtml(d.name || d.title || '—') + '</td>' +
      '<td>\u20B9' + (d.price || 0).toLocaleString('en-IN') + '</td>' +
      '<td>' +
      '<button class="btn btn-sm btn-outline" onclick="adjustStock(\'' + d.bid + '\',\'' + d.oid + '\',\'' + d.dishId + '\',-1)">−</button> ' +
      '<span class="stock-value">' + stock + '</span> ' +
      '<button class="btn btn-sm btn-outline" onclick="adjustStock(\'' + d.bid + '\',\'' + d.oid + '\',\'' + d.dishId + '\',1)">+</button>' +
      '</td>' +
      '<td>' +
      '<label class="toggle-switch">' +
      '<input type="checkbox" ' + (available ? 'checked' : '') + ' onchange="toggleAvailability(\'' + d.bid + '\',\'' + d.oid + '\',\'' + d.dishId + '\',this.checked)">' +
      '<span class="toggle-slider"></span>' +
      '</label>' +
      '</td>' +
      '<td><span class="badge ' + (available ? 'text-success' : 'text-danger') + '">' + (available ? 'Available' : 'Unavailable') + '</span></td>' +
      '</tr>';
  }).join('');
}

async function adjustStock(bid, oid, dishId, delta) {
  try {
    const path = 'businesses/' + bid + '/outlets/' + oid;
    const dishRef = db.ref(path + '/dishes/' + dishId + '/stock');
    const invRef = db.ref(path + '/inventory/' + dishId + '/stock');
    const snap = await dishRef.once('value');
    if (snap.val() !== null) {
      await dishRef.set(firebase.database.ServerValue.increment(delta));
    } else {
      await invRef.set(firebase.database.ServerValue.increment(delta));
    }
    showToast('Stock updated', 'success');
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
}

async function toggleAvailability(bid, oid, dishId, available) {
  try {
    const path = 'businesses/' + bid + '/outlets/' + oid;
    const dishRef = db.ref(path + '/dishes/' + dishId + '/available');
    const invRef = db.ref(path + '/inventory/' + dishId + '/available');
    const snap = await dishRef.once('value');
    if (snap.val() !== null) {
      await dishRef.set(available);
    } else {
      await invRef.set(available);
    }
    showToast(available ? 'Item enabled' : 'Item disabled', 'success');
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
}

// ============================
// 11. REVIEWS
// ============================

function loadReviews() {
  allReviews = [];
  Object.entries(businessesData).forEach(([bid, biz]) => {
    if (biz.outlets) {
      Object.entries(biz.outlets).forEach(([oid, outlet]) => {
        if (outlet.reviews) {
          Object.entries(outlet.reviews).forEach(([key, r]) => {
            allReviews.push(Object.assign({}, r, { key, bid, oid, storeName: outlet.name || biz.name || 'Unknown' }));
          });
        }
      });
    }
  });
  renderReviews();
}

function renderReviews() {
  const tbody = $('reviewsTableBody');
  if (!tbody) return;
  allReviews.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  if (allReviews.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-row">No reviews found.</td></tr>';
    return;
  }

  tbody.innerHTML = allReviews.map((r) => {
    const stars = '\u2605'.repeat(Math.round(r.rating || 0)) + '\u2606'.repeat(5 - Math.round(r.rating || 0));
    return '<tr>' +
      '<td>' + escapeHtml(r.storeName) + '</td>' +
      '<td>' + escapeHtml(r.customerName || r.userName || 'Anonymous') + '</td>' +
      '<td class="stars">' + stars + ' (' + (r.rating || 0) + ')</td>' +
      '<td>' + escapeHtml(r.text || r.comment || '—') + '</td>' +
      '<td>' + (r.riderRating ? '\u2605'.repeat(Math.round(r.riderRating)) + ' (' + r.riderRating + ')' : '—') + '</td>' +
      '<td>' + formatDate(r.createdAt || r.date) + '</td>' +
      '</tr>';
  }).join('');
}

// ============================
// 12. BROADCAST
// ============================

$('sendBroadcastBtn')?.addEventListener('click', async () => {
  const now = Date.now();
  const recent = broadcastRateLimit.filter((t) => now - t < 60000);
  if (recent.length >= 5) { showToast('Rate limit: max 5 broadcasts per minute', 'error'); return; }

  const title = $('broadcastTitle')?.value;
  const message = $('broadcastMessage')?.value;
  const audience = $('broadcastAudience')?.value || 'all';
  const category = $('broadcastCategory')?.value || 'general';
  const imageUrl = $('broadcastImageUrl')?.value || '';

  if (!title || !message) { showToast('Title and message are required', 'error'); return; }

  try {
    const ref = db.ref('system/broadcasts').push();
    await ref.set({
      title,
      message,
      audience,
      category,
      imageUrl,
      sentAt: firebase.database.ServerValue.TIMESTAMP,
      sender: currentUser ? currentUser.email : 'system',
      readBy: {}
    });
    broadcastRateLimit.push(Date.now());
    showToast('Broadcast sent to ' + audience, 'success');
    $('broadcastTitle').value = '';
    $('broadcastMessage').value = '';
    $('broadcastImageUrl').value = '';
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
});

function loadBroadcasts() {
  const container = $('broadcastHistory');
  if (!container) return;
  db.ref('system/broadcasts').orderByChild('sentAt').limitToLast(50).on('value', (snap) => {
    const broadcasts = snap.val() || {};
    const entries = Object.entries(broadcasts).sort((a, b) => (b[1].sentAt || 0) - (a[1].sentAt || 0));
    if (entries.length === 0) {
      container.innerHTML = '<div class="empty-row">No broadcasts sent yet.</div>';
      return;
    }
    container.innerHTML = entries.map(([key, b]) => {
      return '<div class="broadcast-card">' +
        '<div class="broadcast-header">' +
        '<strong>' + escapeHtml(b.title || 'Untitled') + '</strong> ' +
        '<span class="badge badge-' + escapeHtml(b.audience || 'all') + '">' + escapeHtml(b.audience || 'All') + '</span>' +
        '</div>' +
        '<p>' + escapeHtml(b.message || '') + '</p>' +
        (b.imageUrl ? '<img src="' + escapeHtml(b.imageUrl) + '" class="broadcast-image" alt="">' : '') +
        '<div class="broadcast-meta">' +
        '<span>' + formatDate(b.sentAt) + '</span>' +
        '<span>by ' + escapeHtml(b.sender || 'system') + '</span>' +
        '<span>' + (b.category || 'general') + '</span>' +
        '</div>' +
        '</div>';
    }).join('');
  });
}

// ============================
// 13. AUDIT LOGS
// ============================

function loadAuditLogs() {
  auditLogs = [];
  const sources = [
    db.ref('system/auditLogs').orderByChild('timestamp').limitToLast(200),
    db.ref('logs/marketplaceAudit').orderByChild('timestamp').limitToLast(200),
    db.ref('logs/botAudit').orderByChild('timestamp').limitToLast(200),
    db.ref('logs/riderErrors').orderByChild('timestamp').limitToLast(200)
  ];

  let loaded = 0;
  sources.forEach((ref, idx) => {
    ref.once('value', (snap) => {
      const data = snap.val() || {};
      const sourceNames = ['system/auditLogs', 'logs/marketplaceAudit', 'logs/botAudit', 'logs/riderErrors'];
      Object.entries(data).forEach(([key, entry]) => {
        auditLogs.push(Object.assign({}, entry, { _key: key, _source: sourceNames[idx] }));
      });
      loaded++;
      if (loaded === sources.length) renderAuditLogs();
    });
  });
}

function renderAuditLogs() {
  const tbody = $('auditTableBody');
  if (!tbody) return;

  auditLogs.sort((a, b) => ((b.timestamp || b.createdAt || b.sentAt || 0)) - ((a.timestamp || a.createdAt || a.sentAt || 0)));

  const pageSize = 50;
  const totalPages = Math.max(1, Math.ceil(auditLogs.length / pageSize));
  if (currentPage.audit > totalPages) currentPage.audit = totalPages;
  const start = (currentPage.audit - 1) * pageSize;
  const page = auditLogs.slice(start, start + pageSize);

  if (page.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-row">No audit logs found.</td></tr>';
    renderPagination('auditPagination', totalPages, currentPage.audit, (p) => { currentPage.audit = p; renderAuditLogs(); });
    return;
  }

  tbody.innerHTML = page.map((entry) => {
    const ts = entry.timestamp || entry.createdAt || entry.sentAt || 0;
    const action = entry.action || entry.type || entry.event || entry.message || '—';
    const actor = entry.actor || entry.userId || entry.sender || entry.settledBy || entry.createdBy || '—';
    const source = entry._source || 'system';
    return '<tr>' +
      '<td>' + formatDate(ts) + '</td>' +
      '<td><span class="badge badge-source badge-' + source.replace(/[\/\.]/g, '-') + '">' + escapeHtml(source) + '</span></td>' +
      '<td>' + escapeHtml(typeof action === 'string' ? action : JSON.stringify(action)) + '</td>' +
      '<td>' + escapeHtml(actor) + '</td>' +
      '<td><code>' + escapeHtml(entry._key || '').slice(-12) + '</code></td>' +
      '</tr>';
  }).join('');
  renderPagination('auditPagination', totalPages, currentPage.audit, (p) => { currentPage.audit = p; renderAuditLogs(); });
}

// ============================
// 14. REPORTS
// ============================

function loadReports() {
  calculateReportKPIs();
  buildTopBusinessesChart();
  buildDailyRevenueTrend();
}

function calculateReportKPIs() {
  let totalOrders = 0;
  let totalRevenue = 0;
  let totalCommission = 0;
  const bizOrders = {};
  const outletOrders = {};

  Object.entries(businessesData).forEach(([bid, biz]) => {
    if (biz.outlets) {
      Object.entries(biz.outlets).forEach(([oid, outlet]) => {
        let outOrders = 0;
        let outRevenue = 0;
        if (outlet.orders) {
          Object.values(outlet.orders).forEach((order) => {
            totalOrders++;
            outOrders++;
            totalRevenue += order.total || 0;
            totalCommission += (order.total || 0) * ((biz.commission || 15) / 100);
            outRevenue += order.total || 0;
          });
        }
        outletOrders[bid + '_' + oid] = { name: outlet.name || biz.name || 'Unknown', orders: outOrders, revenue: outRevenue };
      });
    }
    bizOrders[bid] = { name: biz.name || 'Unknown', orders: Object.values(outletOrders).filter((o) => o.name === biz.name).reduce((s, o) => s + o.orders, 0) };
  });

  $('reportTotalOrders') ? $('reportTotalOrders').textContent = totalOrders : null;
  $('reportTotalRevenue') ? $('reportTotalRevenue').textContent = '\u20B9' + totalRevenue.toLocaleString('en-IN') : null;
  $('reportAvgOrderValue') ? $('reportAvgOrderValue').textContent = '\u20B9' + (totalOrders ? Math.round(totalRevenue / totalOrders).toLocaleString('en-IN') : '0') : null;
  $('reportTotalCommission') ? $('reportTotalCommission').textContent = '\u20B9' + Math.round(totalCommission).toLocaleString('en-IN') : null;

  const sortedBizes = Object.entries(outletOrders).sort((a, b) => b[1].orders - a[1].orders).slice(0, 10);
  const tbody = $('topOutletsTableBody');
  if (tbody) {
    if (sortedBizes.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="empty-row">No data</td></tr>';
    } else {
      tbody.innerHTML = sortedBizes.map(([key, o], i) => {
        return '<tr>' +
          '<td>' + (i + 1) + '</td>' +
          '<td>' + escapeHtml(o.name) + '</td>' +
          '<td>' + o.orders + '</td>' +
          '<td>\u20B9' + o.revenue.toLocaleString('en-IN') + '</td>' +
          '</tr>';
      }).join('');
    }
  }
}

function buildTopBusinessesChart() {
  const canvas = document.getElementById('topBusinessesChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const bizList = Object.entries(businessesData)
    .map(([bid, biz]) => ({
      name: biz.name || 'Unknown',
      orderCount: countBusinessOrders(biz)
    }))
    .sort((a, b) => b.orderCount - a.orderCount)
    .slice(0, 10);

  if (window._topBizChart) window._topBizChart.destroy();

  window._topBizChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: bizList.map((b) => b.name),
      datasets: [{
        label: 'Total Orders',
        data: bizList.map((b) => b.orderCount),
        backgroundColor: '#3B82F6',
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 } },
        x: { grid: { display: false } }
      }
    }
  });
}

function buildDailyRevenueTrend() {
  const canvas = document.getElementById('dailyRevenueTrendChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const days = generateLastNDays(14);
  const revenueData = days.map((d) => {
    let total = 0;
    Object.values(businessesData).forEach((biz) => {
      if (biz.outlets) {
        Object.values(biz.outlets).forEach((outlet) => {
          if (outlet.orders) {
            Object.values(outlet.orders).forEach((order) => {
              if (order.createdAt && new Date(order.createdAt).toDateString() === d.dateStr) {
                total += order.total || 0;
              }
            });
          }
        });
      }
    });
    return total;
  });

  if (window._dailyTrendChart) window._dailyTrendChart.destroy();

  window._dailyTrendChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: days.map((d) => d.label),
      datasets: [{
        label: 'Revenue (\u20B9)',
        data: revenueData,
        borderColor: '#22C55E',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#22C55E',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { callback: (v) => '\u20B9' + v.toLocaleString('en-IN') } },
        x: { grid: { display: false } }
      }
    }
  });
}

$('exportReportsCSVBtn')?.addEventListener('click', () => {
  const headers = ['Date', 'Business', 'Outlet', 'Order ID', 'Amount', 'Status', 'Customer'];
  const rows = [];
  Object.entries(businessesData).forEach(([bid, biz]) => {
    if (biz.outlets) {
      Object.entries(biz.outlets).forEach(([oid, outlet]) => {
        if (outlet.orders) {
          Object.entries(outlet.orders).forEach(([orderId, order]) => {
            rows.push([
              formatDate(order.createdAt),
              biz.name || '',
              outlet.name || '',
              orderId,
              order.total || 0,
              order.status || '',
              order.customerName || order.name || order.phone || ''
            ]);
          });
        }
      });
    }
  });
  rows.sort((a, b) => new Date(b[0]) - new Date(a[0]));
  exportCSV(headers, rows, 'reports_export');
  showToast('Reports exported as CSV', 'success');
});

$('exportReportsPDFBtn')?.addEventListener('click', () => {
  const el = $('reportsContent');
  if (!el || typeof html2pdf === 'undefined') {
    showToast('html2pdf library not loaded. Include CDN: https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js', 'error');
    return;
  }
  const opt = {
    margin: [10, 10, 10, 10],
    filename: 'reports_' + new Date().toISOString().slice(0, 10) + '.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a3', orientation: 'landscape' }
  };
  html2pdf().set(opt).from(el).save();
  showToast('Exporting PDF...', 'info');
});

// ============================
// 15. SETTINGS
// ============================

async function checkTFAStatus() {
  if (!currentUser) return;
  currentAdminUid = currentUser.uid;
  const snap = await db.ref('system/admins/' + currentUser.uid + '/tfaSecret').once('value');
  const secret = snap.val();
  const statusEl = $('tfaStatus');
  const setupBtn = $('setup2FABtn');
  const disableBtn = $('disable2FABtn');
  if (statusEl) statusEl.textContent = secret ? 'Enabled' : 'Disabled';
  if (statusEl) statusEl.className = secret ? 'text-success' : 'text-danger';
  if (setupBtn) setupBtn.style.display = secret ? 'none' : 'inline-block';
  if (disableBtn) disableBtn.style.display = secret ? 'inline-block' : 'none';
}

async function setup2FA() {
  try {
    if (typeof window.qrcode === 'undefined') {
      showToast('QR code library not loaded. Include CDN: https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js', 'error');
      return;
    }

    const resp = await fetch('https://www.authenticatorApi.com/pair/Register.aspx?DevName=' + encodeURIComponent('Foodhubbie Admin') + '&Issuer=' + encodeURIComponent('Foodhubbie') + '&key=&length=32');
    let secret = $('tfaSecretInput')?.value;
    if (!secret) {
      secret = Array.from({ length: 32 }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'[Math.floor(Math.random() * 32)]).join('');
    }

    const otpauth = 'otpauth://totp/Foodhubbie:' + encodeURIComponent(currentUser.email) + '?secret=' + secret + '&issuer=Foodhubbie&algorithm=SHA1&digits=6&period=30';

    $('tfaQrContainer') ? $('tfaQrContainer').innerHTML = '' : null;
    if ($('tfaQrContainer')) {
      try {
        new QRCode($('tfaQrContainer'), { text: otpauth, width: 200, height: 200 });
      } catch (e) {
        $('tfaQrContainer').innerHTML = '<p>Scan this in Authenticator:</p><code style="word-break:break-all">' + escapeHtml(otpauth) + '</code>';
      }
    }

    $('tfaSecretDisplay') ? $('tfaSecretDisplay').textContent = secret : null;
    $('tfaSecretInput') ? $('tfaSecretInput').value = secret : null;
    $('tfaSetupModal')?.classList.add('active');
  } catch (err) {
    showToast('Error setting up 2FA: ' + err.message, 'error');
  }
}

$('setup2FABtn')?.addEventListener('click', setup2FA);

$('tfaSetupModalClose')?.addEventListener('click', () => {
  $('tfaSetupModal')?.classList.remove('active');
});

$('verify2FABtn')?.addEventListener('click', async () => {
  const code = $('tfaVerifyCode')?.value;
  const secret = $('tfaSecretDisplay')?.textContent || $('tfaSecretInput')?.value;
  if (!code || code.length !== 6) { showToast('Enter a valid 6-digit code', 'error'); return; }
  try {
    await db.ref('system/admins/' + currentUser.uid + '/tfaSecret').set(secret);
    await db.ref('system/admins/' + currentUser.uid + '/tfaEnabled').set(true);
    await db.ref('system/admins/' + currentUser.uid + '/tfaUpdatedAt').set(firebase.database.ServerValue.TIMESTAMP);
    showToast('2FA enabled successfully. Keep your authenticator app handy.', 'success');
    $('tfaSetupModal')?.classList.remove('active');
    $('tfaVerifyCode').value = '';
    checkTFAStatus();
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
});

$('disable2FABtn')?.addEventListener('click', () => {
  confirmAction('Disable 2FA for your account?', async () => {
    try {
      await db.ref('system/admins/' + currentUser.uid + '/tfaSecret').remove();
      await db.ref('system/admins/' + currentUser.uid + '/tfaEnabled').remove();
      showToast('2FA disabled', 'success');
      checkTFAStatus();
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
  });
});

// --- Data Retention ---

$('runRetentionBtn')?.addEventListener('click', async () => {
  const days = parseInt($('retentionDays')?.value) || 90;
  const types = [];
  if ($('retentionOrders')?.checked) types.push('orders');
  if ($('retentionAudit')?.checked) types.push('auditLogs');
  if ($('retentionSettlements')?.checked) types.push('settlements');

  if (types.length === 0) { showToast('Select at least one data type', 'error'); return; }

  const statusEl = $('retentionStatus');
  if (statusEl) statusEl.textContent = 'Processing...';
  const cutoff = Date.now() - days * 86400000;
  let processed = 0;
  let errors = 0;

  try {
    for (const type of types) {
      if (type === 'orders') {
        const snaps = await db.ref('businesses').once('value');
        const bizData = snaps.val() || {};
        for (const [bid, biz] of Object.entries(bizData)) {
          if (biz.outlets) {
            for (const [oid, outlet] of Object.entries(biz.outlets)) {
              if (outlet.orders) {
                for (const [orderId, order] of Object.entries(outlet.orders)) {
                  if ((order.createdAt || 0) < cutoff && (order.status === 'Delivered' || order.status === 'Cancelled')) {
                    await db.ref('businesses/' + bid + '/outlets/' + oid + '/orders/' + orderId + '/archived').set(true);
                    processed++;
                    if (statusEl && processed % 50 === 0) statusEl.textContent = 'Processing: ' + processed + ' records...';
                  }
                }
              }
            }
          }
        }
      } else if (type === 'auditLogs') {
        const snap = await db.ref('system/auditLogs').once('value');
        const logs = snap.val() || {};
        for (const [key, entry] of Object.entries(logs)) {
          if ((entry.timestamp || entry.createdAt || 0) < cutoff) {
            await db.ref('system/auditLogs/' + key).remove();
            processed++;
          }
        }
      } else if (type === 'settlements') {
        const snap = await db.ref('businesses').once('value');
        const bizData = snap.val() || {};
        for (const [bid, biz] of Object.entries(bizData)) {
          if (biz.outlets) {
            for (const [oid, outlet] of Object.entries(biz.outlets)) {
              if (outlet.settlements) {
                for (const [key, s] of Object.entries(outlet.settlements)) {
                  if ((s.createdAt || 0) < cutoff && (s.status === 'SETTLED' || s.status === 'settled')) {
                    await db.ref('businesses/' + bid + '/outlets/' + oid + '/settlements/' + key).remove();
                    processed++;
                  }
                }
              }
            }
          }
        }
      }
    }
    if (statusEl) statusEl.textContent = 'Retention complete. ' + processed + ' records processed' + (errors ? ', ' + errors + ' errors' : '') + '.';
    showToast('Retention complete: ' + processed + ' records', 'success');
  } catch (err) {
    showToast('Error during retention: ' + err.message, 'error');
    if (statusEl) statusEl.textContent = 'Error: ' + err.message;
  }
});

// ============================
// PAGINATION HELPER
// ============================

function renderPagination(containerId, totalPages, current, onPage) {
  const container = $(containerId);
  if (!container) return;
  if (totalPages <= 1) { container.innerHTML = ''; return; }
  let html = '';
  const range = 2;
  const start = Math.max(1, current - range);
  const end = Math.min(totalPages, current + range);

  if (current > 1) html += '<button class="page-btn" onclick="window._goPage(\'' + containerId + '\',' + (current - 1) + ')">&laquo;</button>';
  if (start > 1) html += '<button class="page-btn" onclick="window._goPage(\'' + containerId + '\',1)">1</button>' + (start > 2 ? '<span class="page-dots">...</span>' : '');
  for (let i = start; i <= end; i++) {
    html += '<button class="page-btn' + (i === current ? ' active' : '') + '" onclick="window._goPage(\'' + containerId + '\',' + i + ')">' + i + '</button>';
  }
  if (end < totalPages) html += (end < totalPages - 1 ? '<span class="page-dots">...</span>' : '') + '<button class="page-btn" onclick="window._goPage(\'' + containerId + '\',' + totalPages + ')">' + totalPages + '</button>';
  if (current < totalPages) html += '<button class="page-btn" onclick="window._goPage(\'' + containerId + '\',' + (current + 1) + ')">&raquo;</button>';
  container.innerHTML = html;
}

window._goPage = function (containerId, page) {
  const map = {
    businessesPagination: 'businesses',
    ridersPagination: 'riders',
    usersPagination: 'users',
    auditPagination: 'audit'
  };
  const key = map[containerId];
  if (key) currentPage[key] = page;
};

// ============================
// INITIALIZATION & MODAL CLOSE HANDLERS
// ============================

document.querySelectorAll('.modal .modal-close, .modal .modal-overlay').forEach((el) => {
  el.addEventListener('click', () => {
    el.closest('.modal')?.classList.remove('active');
  });
});

document.querySelectorAll('.modal').forEach((modal) => {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
  });
});

// Close modals with Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal.active').forEach((m) => m.classList.remove('active'));
  }
});

console.log('Foodhubbie Supreme Admin v2 loaded');
