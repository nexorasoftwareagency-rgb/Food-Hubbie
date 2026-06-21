const $ = (id) => document.getElementById(id);

const _env = typeof window !== "undefined" && window.__FOODHUBBIE_FIREBASE_CONFIG__;
const firebaseConfig = _env || {
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

const API_KEY = firebaseConfig.apiKey;
const PAGE_SIZE = 15;
const RIDER_PAGE_SIZE = 20;
const USER_PAGE_SIZE = 20;
const AUDIT_PAGE_SIZE = 50;

let appInitialized = false;
let currentTab = 'dashboard';
let allBusinesses = {};
let allRiders = {};
let allUsers = {};
let allOrders = {};
let allReviews = {};
let broadcastCount = 0;
let broadcastResetTime = Date.now();

// ======================== AUTH ========================

$('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = $('loginEmail').value.trim();
  const password = $('loginPassword').value;
  $('loginBtn').disabled = true;
  $('loginBtn').textContent = 'Signing in...';
  $('loginError').textContent = '';
  try {
    await auth.signInWithEmailAndPassword(email, password);
  } catch (err) {
    $('loginError').textContent = err.message;
    $('loginBtn').disabled = false;
    $('loginBtn').textContent = 'Sign In';
  }
});

auth.onAuthStateChanged(async (user) => {
  if (user) {
    $('authOverlay').style.display = 'none';
    $('adminName').textContent = user.displayName || user.email;
    $('adminEmail').textContent = user.email;
    if (!appInitialized) {
      appInitialized = true;
      initApp();
    }
  } else {
    $('authOverlay').style.display = 'flex';
    $('loginBtn').disabled = false;
    $('loginBtn').textContent = 'Sign In';
  }
});

$('btnLogout').addEventListener('click', async () => {
  try {
    await auth.signOut();
  } catch (err) {
    showToast('Logout failed: ' + err.message, 'error');
  }
});

// ======================== UTILITIES ========================

function showTab(tabName) {
  currentTab = tabName;
document.querySelectorAll('.tab-content').forEach((el) => {
    el.style.display = 'none';
  });
  if (window.lucide) setTimeout(() => lucide.createIcons(), 100);
  document.querySelectorAll('.nav-link').forEach((el) => {
    el.classList.remove('active');
  });
  const tabEl = $('tab-' + tabName);
  if (tabEl) tabEl.style.display = 'block';
  const navLink = document.querySelector(`.nav-link[data-tab="${tabName}"]`);
  if (navLink) navLink.classList.add('active');
  const initMap = {
    dashboard: initDashboard,
    onboarding: initOnboarding,
    businesses: initBusinesses,
    liveorders: initLiveOrders,
    riders: initRiders,
    users: initUsers,
    promotions: initPromotions,
    settlements: initSettlements,
    delivery: initDeliverySlabs,
    inventory: initInventory,
    reviews: initReviews,
    broadcast: initBroadcast,
    audit: initAudit,
    reports: initReports,
    settings: initSettings
  };
  const initFn = initMap[tabName];
  if (initFn && typeof initFn === 'function') initFn();
}

function confirmAction(msg, callback) {
  $('confirmMessage').textContent = msg;
  $('confirmModal').style.display = 'flex';
  const yesBtn = $('confirmYes');
  const newYes = yesBtn.cloneNode(true);
  yesBtn.parentNode.replaceChild(newYes, yesBtn);
  newYes.addEventListener('click', () => {
    $('confirmModal').style.display = 'none';
    if (typeof callback === 'function') callback();
  });
}

$('confirmClose').addEventListener('click', () => {
  $('confirmModal').style.display = 'none';
});
$('confirmNo').addEventListener('click', () => {
  $('confirmModal').style.display = 'none';
});

function showToast(msg, type = 'info') {
  const container = $('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => {
    if (toast.parentNode) toast.remove();
  }, 3000);
}

function formatDate(ts) {
  if (!ts) return '-';
  const d = new Date(ts);
  return d.toLocaleDateString('en-IN', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function timeAgo(ts) {
  if (!ts) return '-';
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(ts);
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function exportCSV(headers, rows, filename) {
  const csvContent = [
    headers.join(','),
    ...rows.map((r) => r.map((c) => {
      const val = String(c == null ? '' : c);
      return val.includes(',') || val.includes('"') || val.includes('\n')
        ? `"${val.replace(/"/g, '""')}"` : val;
    }).join(','))
  ].join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

// ======================== DASHBOARD ========================

function initDashboard() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTs = today.getTime();

  db.ref('businesses').on('value', (snap) => {
    const data = snap.val() || {};
    const bizCount = Object.keys(data).length;
    let outletCount = 0;
    let ordersTodayCount = 0;
    let revenueToday = 0;
    const recentOrders = [];
    const dailyRevenue = {};
    const statusCounts = { Pending: 0, Confirmed: 0, Preparing: 0, 'Out for Delivery': 0, Delivered: 0, Cancelled: 0 };

    for (const bid of Object.keys(data)) {
      const biz = data[bid];
      if (biz.outlets) {
        for (const oid of Object.keys(biz.outlets)) {
          outletCount++;
          const outlet = biz.outlets[oid];
          if (outlet.orders) {
            for (const orderId of Object.keys(outlet.orders)) {
              const order = outlet.orders[orderId];
              const orderTs = order.createdAt || order.timestamp || 0;
              const orderDate = new Date(orderTs);
              const dayKey = orderDate.toISOString().slice(0, 10);

              if (orderTs >= todayTs) {
                ordersTodayCount++;
                revenueToday += Number(order.total || order.amount || 0);
              }

              const status = order.status || 'Pending';
              statusCounts[status] = (statusCounts[status] || 0) + 1;

              const rev = Number(order.total || order.amount || 0);
              dailyRevenue[dayKey] = (dailyRevenue[dayKey] || 0) + rev;

              recentOrders.push({
                id: orderId,
                business: biz.name || bid,
                outlet: outlet.name || oid,
                customer: order.customerName || order.userName || 'Guest',
                total: rev,
                status,
                timestamp: orderTs
              });
            }
          }
        }
      }
    }

    $('kpiBusinesses').textContent = bizCount;
    $('kpiOutlets').textContent = outletCount;
    $('kpiOrdersToday').textContent = ordersTodayCount;
    $('kpiRevenue').textContent = '\u20B9' + revenueToday.toLocaleString('en-IN');

    recentOrders.sort((a, b) => b.timestamp - a.timestamp);
    const recent = recentOrders.slice(0, 10);
    const activityList = document.getElementById('activityList') || document.querySelector('#dashboard .activity-list');
    if (activityList) {
      activityList.innerHTML = recent.map((o) =>
        `<div class="activity-item">
          <div class="activity-icon ${o.status.toLowerCase().replace(/\s+/g, '-')}"></div>
          <div class="activity-info">
            <p><strong>${escapeHtml(o.customer)}</strong> ordered from <strong>${escapeHtml(o.business)}</strong></p>
            <span class="activity-time">${timeAgo(o.timestamp)}</span>
          </div>
          <div class="activity-status status-${o.status.toLowerCase().replace(/\s+/g, '-')}">${o.status}</div>
        </div>`
      ).join('');
    }

    db.ref('users').once('value').then((uSnap) => {
      $('kpiUsers').textContent = uSnap.numChildren() || 0;
    }).catch(() => {});
    db.ref('riders').once('value').then((rSnap) => {
      $('kpiRiders').textContent = rSnap.numChildren() || 0;
    }).catch(() => {});

    buildRevenueChart(dailyRevenue, 'revenueChart');
    buildOrdersChart(statusCounts);
  }, (err) => {
    showToast('Dashboard load error: ' + err.message, 'error');
  });
}

let revenueChartInstance = null;
function buildRevenueChart(dailyRevenue, canvasId) {
  const canvas = $(canvasId || 'revenueChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const sortedDays = Object.keys(dailyRevenue).sort().slice(-14);
  const values = sortedDays.map((d) => dailyRevenue[d]);
  const labels = sortedDays.map((d) => {
    const parts = d.split('-');
    return `${parts[2]}/${parts[1]}`;
  });

  if (revenueChartInstance) revenueChartInstance.destroy();
  revenueChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels.length ? labels : ['No Data'],
      datasets: [{
        label: 'Revenue',
        data: labels.length ? values : [0],
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(79,70,229,0.1)',
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { callback: (v) => '\u20B9' + v } }
      }
    }
  });
}

let ordersChartInstance = null;
function buildOrdersChart(statusCounts) {
  const canvas = $('ordersChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const labels = Object.keys(statusCounts);
  const data = Object.values(statusCounts);
  const colors = {
    Pending: '#f59e0b',
    Confirmed: '#3b82f6',
    Preparing: '#E84908',
    'Out for Delivery': '#06b6d4',
    Delivered: '#10b981',
    Cancelled: '#ef4444'
  };

  if (ordersChartInstance) ordersChartInstance.destroy();
  ordersChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: labels.map((l) => colors[l] || '#6b7280')
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 12, padding: 8 } }
      }
    }
  });
}

$('btnRefresh').addEventListener('click', () => {
  if (currentTab === 'dashboard') initDashboard();
});

// ======================== ONBOARDING ========================

function initOnboarding() {
  db.ref('onboarding_requests').off();
  db.ref('onboarding_requests').on('value', (snap) => {
    const data = snap.val() || {};
    const tbody = $('onboardingBody');
    if (!tbody) return;
    const entries = Object.entries(data);
    if (!entries.length) {
      tbody.innerHTML = '<tr><td colspan="9" class="empty-state">No onboarding requests</td></tr>';
      return;
    }
    tbody.innerHTML = entries.map(([id, req]) =>
      `<tr>
        <td>${escapeHtml(req.businessName || '-')}</td>
        <td>${escapeHtml(req.ownerName || '-')}</td>
        <td>${escapeHtml(req.email || '-')}</td>
        <td>${escapeHtml(req.phone || '-')}</td>
        <td>${escapeHtml(req.address || '-')}</td>
        <td>${escapeHtml(req.outletName || '-')}</td>
        <td>${formatDate(req.timestamp || req.createdAt)}</td>
        <td><span class="badge badge-${req.status === 'approved' ? 'success' : req.status === 'rejected' ? 'danger' : 'warning'}">${escapeHtml(req.status || 'pending')}</span></td>
        <td class="action-cell">
          ${req.status !== 'approved' ? `<button class="btn btn-sm btn-success" onclick="approveOnboarding('${id}')">Approve</button>` : ''}
          ${req.status !== 'rejected' ? `<button class="btn btn-sm btn-danger" onclick="rejectOnboarding('${id}')">Reject</button>` : ''}
        </td>
      </tr>`
    ).join('');
  });
}

window.approveOnboarding = async (id) => {
  confirmAction('Approve this onboarding request?', async () => {
    try {
      const snap = await db.ref(`onboarding_requests/${id}`).once('value');
      const req = snap.val();
      if (!req) throw new Error('Request not found');
      const bid = req.businessId || `biz_${Date.now()}`;
      const oid = `outlet_${Date.now()}`;
      const updates = {};
      updates[`businesses/${bid}`] = {
        name: req.businessName || 'Unnamed Business',
        ownerName: req.ownerName || '',
        email: req.email || '',
        phone: req.phone || '',
        address: req.address || '',
        slug: req.slug || bid,
        status: 'active',
        createdAt: firebase.database.ServerValue.TIMESTAMP
      };
      updates[`businesses/${bid}/outlets/${oid}`] = {
        name: req.outletName || 'Main Outlet',
        address: req.address || '',
        phone: req.phone || '',
        lat: req.lat || 0,
        lng: req.lng || 0,
        status: 'active',
        createdAt: firebase.database.ServerValue.TIMESTAMP
      };
      updates[`onboarding_requests/${id}/status`] = 'approved';
      updates[`onboarding_requests/${id}/approvedAt`] = firebase.database.ServerValue.TIMESTAMP;
      await db.ref().update(updates);
      showToast('Onboarding approved successfully', 'success');
    } catch (err) {
      showToast('Approve failed: ' + err.message, 'error');
    }
  });
};

window.rejectOnboarding = async (id) => {
  confirmAction('Reject this onboarding request? It will be removed.', async () => {
    try {
      await db.ref(`onboarding_requests/${id}`).remove();
      showToast('Request rejected and removed', 'success');
    } catch (err) {
      showToast('Reject failed: ' + err.message, 'error');
    }
  });
};

$('btnProvisionNode').addEventListener('click', () => {
  $('onboardingModal').style.display = 'flex';
});
$('onboardingModalClose').addEventListener('click', () => {
  $('onboardingModal').style.display = 'none';
});
$('onboardingSave').addEventListener('click', async () => {
  const data = {
    businessName: $('onboardingBusinessName').value.trim(),
    ownerName: $('onboardingOwnerName').value.trim(),
    email: $('onboardingAdminEmail').value.trim(),
    phone: $('onboardingAdminPhone').value.trim(),
    address: $('onboardingAddress').value.trim(),
    outletName: $('onboardingOutletName').value.trim(),
    businessId: $('onboardingBusinessId').value.trim() || `biz_${Date.now()}`,
    slug: $('onboardingSlug').value.trim() || $('onboardingBusinessId').value.trim() || `biz_${Date.now()}`,
    lat: parseFloat($('onboardingLat').value) || 0,
    lng: parseFloat($('onboardingLng').value) || 0,
    timestamp: firebase.database.ServerValue.TIMESTAMP,
    status: 'approved'
  };
  if (!data.businessName || !data.email) {
    showToast('Business name and email are required', 'error');
    return;
  }
  try {
    const bid = data.businessId;
    const oid = `outlet_${Date.now()}`;
    const updates = {};
    updates[`businesses/${bid}`] = {
      name: data.businessName, ownerName: data.ownerName, email: data.email,
      phone: data.phone, address: data.address, slug: data.slug,
      status: 'active', createdAt: firebase.database.ServerValue.TIMESTAMP
    };
    updates[`businesses/${bid}/outlets/${oid}`] = {
      name: data.outletName, address: data.address, phone: data.phone,
      lat: data.lat, lng: data.lng, status: 'active',
      createdAt: firebase.database.ServerValue.TIMESTAMP
    };
    await db.ref().update(updates);
    $('onboardingModal').style.display = 'none';
    ['onboardingBusinessName', 'onboardingOwnerName', 'onboardingAdminEmail',
     'onboardingAdminPhone', 'onboardingAddress', 'onboardingOutletName',
     'onboardingBusinessId', 'onboardingSlug', 'onboardingLat', 'onboardingLng'
    ].forEach((id) => { $(id).value = ''; });
    showToast('Business provisioned successfully', 'success');
  } catch (err) {
    showToast('Provision failed: ' + err.message, 'error');
  }
});

// ======================== BUSINESSES ========================

let businessesPage = 1;
let filteredBusinesses = [];

let adminByBusiness = {};

function initBusinesses() {
  businessesPage = 1;
  db.ref('businesses').off();
  db.ref('businesses').on('value', (snap) => {
    allBusinesses = snap.val() || {};
    // Also load admin data for email/password display
    db.ref('system/admins').once('value', (adminsSnap) => {
      adminByBusiness = {};
      if (adminsSnap.exists()) {
        const admins = adminsSnap.val();
        for (const uid in admins) {
          const a = admins[uid];
          if (a.businessId) {
            adminByBusiness[a.businessId] = a;
          }
        }
      }
      filterBusinesses();
    });
  });
}

function filterBusinesses() {
  const q = ($('businessSearchInput').value || '').toLowerCase().trim();
  const entries = Object.entries(allBusinesses);
  filteredBusinesses = q
    ? entries.filter(([_, b]) =>
        (b.name || '').toLowerCase().includes(q) ||
        (b.ownerName || '').toLowerCase().includes(q) ||
        (b.email || '').toLowerCase().includes(q)
      )
    : entries;
  renderBusinessesPage(1);
}

$('businessSearchInput').addEventListener('input', () => {
  businessesPage = 1;
  filterBusinesses();
});

function renderBusinessesPage(page) {
  businessesPage = page;
  const tbody = $('businessesBody');
  if (!tbody) return;
  const totalPages = Math.ceil(filteredBusinesses.length / PAGE_SIZE) || 1;
  const start = (page - 1) * PAGE_SIZE;
  const pageEntries = filteredBusinesses.slice(start, start + PAGE_SIZE);
  if (!pageEntries.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No businesses found</td></tr>';
    $('businessesPagination').innerHTML = '';
    return;
  }
  tbody.innerHTML = pageEntries.map(([bid, biz]) => {
    const outlets = biz.outlets ? Object.keys(biz.outlets).length : 0;
    const admin = adminByBusiness[bid];
    const adminEmail = admin ? admin.email : (biz.email || '-');
    const adminPhone = admin ? admin.phone : (biz.phone || '-');
    return `<tr>
      <td>${escapeHtml(bid)}</td>
      <td>${escapeHtml(biz.name || '-')}</td>
      <td>${escapeHtml(biz.ownerName || '-')}</td>
      <td style="color:#38BDF8;font-weight:700">${escapeHtml(adminEmail)}</td>
      <td>${escapeHtml(adminPhone)}</td>
      <td>${outlets}</td>
      <td class="action-cell">
        <button class="btn btn-sm btn-primary" onclick="editOutlet('${bid}')">Edit Outlet</button>
        <button class="btn btn-sm btn-info" onclick="editCommission('${bid}')">Commission</button>
      </td>
    </tr>`;
  }).join('');
  renderPagination($('businessesPagination'), totalPages, page, renderBusinessesPage);
}

window.editOutlet = async (bid) => {
  const biz = allBusinesses[bid];
  if (!biz) return;
  const outlets = biz.outlets || {};
  const oids = Object.keys(outlets);
  if (!oids.length) {
    showToast('No outlets found for this business', 'error');
    return;
  }
  const oid = oids[0];
  const outlet = outlets[oid];
  $('editOutletName').value = outlet.name || '';
  $('editOutletAddress').value = outlet.address || '';
  $('editOutletPhone').value = outlet.phone || '';
  $('editOutletLat').value = outlet.lat || '';
  $('editOutletLng').value = outlet.lng || '';

  // Load admin credentials
  try {
    const snap = await db.ref('system/admins').orderByChild('businessId').equalTo(bid).once('value');
    if (snap.exists()) {
      const admins = snap.val();
      for (const uid in admins) {
        const a = admins[uid];
        if (a.outletId === oid || !oid) {
          $('editAdminEmail').value = a.email || '';
          $('editAdminPassDisplay').value = a.password || '';
          break;
        }
      }
    }
  } catch (e) {
    console.warn('Could not load admin credentials:', e);
  }

  $('outletEditModal').dataset.bid = bid;
  $('outletEditModal').dataset.oid = oid;
  $('outletEditModal').style.display = 'flex';
};

$('outletEditClose').addEventListener('click', () => {
  $('outletEditModal').style.display = 'none';
});

$('outletEditSave').addEventListener('click', async () => {
  const modal = $('outletEditModal');
  const bid = modal.dataset.bid;
  const oid = modal.dataset.oid;
  try {
    await db.ref(`businesses/${bid}/outlets/${oid}`).update({
      name: $('editOutletName').value.trim(),
      address: $('editOutletAddress').value.trim(),
      phone: $('editOutletPhone').value.trim(),
      lat: parseFloat($('editOutletLat').value) || 0,
      lng: parseFloat($('editOutletLng').value) || 0,
      updatedAt: firebase.database.ServerValue.TIMESTAMP
    });
    $('outletEditModal').style.display = 'none';
    showToast('Outlet updated successfully', 'success');
  } catch (err) {
    showToast('Update failed: ' + err.message, 'error');
  }
});

window.editCommission = (bid) => {
  const biz = allBusinesses[bid];
  const comm = biz.commission || {};
  $('commissionPercent').value = comm.percent || comm.percentage || '';
  $('commissionFixedFee').value = comm.fixedFee || comm.fixed_fee || '';
  $('commissionModal').dataset.bid = bid;
  $('commissionModal').style.display = 'flex';
};

$('commissionClose').addEventListener('click', () => {
  $('commissionModal').style.display = 'none';
});

$('commissionSave').addEventListener('click', async () => {
  const modal = $('commissionModal');
  const bid = modal.dataset.bid;
  try {
    await db.ref(`businesses/${bid}/commission`).set({
      percent: parseFloat($('commissionPercent').value) || 0,
      fixedFee: parseFloat($('commissionFixedFee').value) || 0,
      updatedAt: firebase.database.ServerValue.TIMESTAMP
    });
    $('commissionModal').style.display = 'none';
    showToast('Commission updated', 'success');
  } catch (err) {
    showToast('Commission update failed: ' + err.message, 'error');
  }
});

// ======================== LIVE ORDERS ========================

let allOrdersData = [];
let ordersFilterStatus = 'All';

function initLiveOrders() {
  allOrdersData = [];
  const promises = [];
  const allBiz = allBusinesses;
  const bizSnap = Object.keys(allBiz).length
    ? Promise.resolve({ val: () => allBiz })
    : db.ref('businesses').once('value');

  bizSnap.then((snap) => {
    const data = snap.val ? snap.val() : snap;
    allOrdersData = [];
    for (const bid of Object.keys(data || {})) {
      const biz = data[bid];
      if (biz.outlets) {
        for (const oid of Object.keys(biz.outlets)) {
          const outlet = biz.outlets[oid];
          if (outlet.orders) {
            for (const orderId of Object.keys(outlet.orders)) {
              const order = outlet.orders[orderId];
              allOrdersData.push({
                id: orderId,
                bid,
                oid,
                businessName: biz.name || bid,
                outletName: outlet.name || oid,
                customerName: order.customerName || order.userName || 'Guest',
                items: order.items || [],
                total: order.total || order.amount || 0,
                status: order.status || 'Pending',
                paymentMethod: order.paymentMethod || order.payment_mode || '-',
                paymentStatus: order.paymentStatus || order.payment_status || '-',
                address: order.deliveryAddress || order.address || '-',
                timestamp: order.createdAt || order.timestamp || 0
              });
            }
          }
        }
      }
    }
    allOrdersData.sort((a, b) => b.timestamp - a.timestamp);
    renderLiveOrders();
  }).catch((err) => {
    showToast('Failed to load orders: ' + err.message, 'error');
  });
}

function renderLiveOrders() {
  const viewMode = document.querySelector('#ordersViewToggle .btn-view.active')?.dataset?.view || 'table';
  const filtered = ordersFilterStatus === 'All'
    ? allOrdersData : allOrdersData.filter((o) => o.status === ordersFilterStatus);

  $('liveOrdersBody').innerHTML = viewMode === 'table'
    ? filtered.map((o) =>
        `<tr draggable="true" data-order-id="${escapeHtml(o.id)}" data-bid="${escapeHtml(o.bid)}" data-oid="${escapeHtml(o.oid)}">
          <td>${escapeHtml(o.id.slice(-8))}</td>
          <td>${escapeHtml(o.businessName)}</td>
          <td>${escapeHtml(o.customerName)}</td>
          <td>\u20B9${Number(o.total).toLocaleString('en-IN')}</td>
          <td><span class="badge badge-${o.status.toLowerCase().replace(/\s+/g, '-')}">${o.status}</span></td>
          <td>${formatDate(o.timestamp)}</td>
          <td class="action-cell">
            <select class="form-select form-select-sm" onchange="updateOrderStatus('${escapeHtml(o.bid)}','${escapeHtml(o.oid)}','${escapeHtml(o.id)}',this.value)">
              <option value="Pending" ${o.status === 'Pending' ? 'selected' : ''}>Pending</option>
              <option value="Confirmed" ${o.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
              <option value="Preparing" ${o.status === 'Preparing' ? 'selected' : ''}>Preparing</option>
              <option value="Out for Delivery" ${o.status === 'Out for Delivery' ? 'selected' : ''}>Out for Delivery</option>
              <option value="Delivered" ${o.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
              <option value="Cancelled" ${o.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
          </td>
        </tr>`).join('')
    : '';

  const kanbanView = $('ordersKanbanView');
  if (kanbanView) {
    if (viewMode === 'kanban') {
      kanbanView.style.display = 'flex';
      const statuses = ['Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'];
      kanbanView.innerHTML = statuses.map((status) => {
        const cards = filtered.filter((o) => o.status === status);
        return `<div class="kanban-column" data-status="${status}">
          <div class="kanban-header">${status} <span class="kanban-count">${cards.length}</span></div>
          <div class="kanban-cards" ondragover="event.preventDefault()" ondrop="onKanbanDrop(event, '${status}')">
            ${cards.map((o) =>
              `<div class="kanban-card" draggable="true"
                    data-order-id="${escapeHtml(o.id)}"
                    data-bid="${escapeHtml(o.bid)}"
                    data-oid="${escapeHtml(o.oid)}"
                    ondragstart="onKanbanDragStart(event)">
                <div class="kanban-card-title">#${escapeHtml(o.id.slice(-8))}</div>
                <div class="kanban-card-sub">${escapeHtml(o.customerName)}</div>
                <div class="kanban-card-amount">\u20B9${Number(o.total).toLocaleString('en-IN')}</div>
              </div>`
            ).join('')}
          </div>
        </div>`;
      }).join('');
    } else {
      kanbanView.style.display = 'none';
    }
  }
}

window.updateOrderStatus = async (bid, oid, orderId, newStatus) => {
  try {
    await db.ref(`businesses/${bid}/outlets/${oid}/orders/${orderId}/status`).set(newStatus);
    showToast(`Order ${orderId.slice(-8)} updated to ${newStatus}`, 'success');
    initLiveOrders();
  } catch (err) {
    showToast('Status update failed: ' + err.message, 'error');
  }
};

window.onKanbanDragStart = (e) => {
  e.dataTransfer.setData('text/plain', JSON.stringify({
    orderId: e.target.dataset.orderId,
    bid: e.target.dataset.bid,
    oid: e.target.dataset.oid
  }));
};

window.onKanbanDrop = (e, newStatus) => {
  e.preventDefault();
  try {
    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
    updateOrderStatus(data.bid, data.oid, data.orderId, newStatus);
  } catch (err) {
    // ignore
  }
};

$('ordersViewToggle')?.addEventListener('click', (e) => {
  const btn = e.target.closest('.btn-view');
  if (!btn) return;
  document.querySelectorAll('#ordersViewToggle .btn-view').forEach((b) => b.classList.remove('active'));
  btn.classList.add('active');
  renderLiveOrders();
});

$('ordersViewToggle')?.querySelectorAll('.btn-view').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#ordersViewToggle .btn-view').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    renderLiveOrders();
  });
});

// Status filter buttons for live orders
document.querySelectorAll('.filter-bar .btn-filter').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-bar .btn-filter').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    ordersFilterStatus = btn.dataset.status || 'All';
    renderLiveOrders();
  });
});

// ======================== RIDERS ========================

let ridersPage = 1;
let filteredRiders = [];

function initRiders() {
  ridersPage = 1;
  db.ref('riders').off();
  db.ref('riders').on('value', (snap) => {
    allRiders = snap.val() || {};
    filterRiders();
  });
}

function filterRiders() {
  const q = ($('riderSearchInput').value || '').toLowerCase().trim();
  const entries = Object.entries(allRiders);
  filteredRiders = q
    ? entries.filter(([_, r]) =>
        (r.name || '').toLowerCase().includes(q) ||
        (r.email || '').toLowerCase().includes(q) ||
        (r.phone || '').toLowerCase().includes(q)
      )
    : entries;
  renderRidersPage(1);
}

$('riderSearchInput').addEventListener('input', () => {
  ridersPage = 1;
  filterRiders();
});

function renderRidersPage(page) {
  ridersPage = page;
  const tbody = $('ridersBody');
  if (!tbody) return;
  const totalPages = Math.ceil(filteredRiders.length / RIDER_PAGE_SIZE) || 1;
  const start = (page - 1) * RIDER_PAGE_SIZE;
  const pageEntries = filteredRiders.slice(start, start + RIDER_PAGE_SIZE);
  if (!pageEntries.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No riders found</td></tr>';
    $('ridersPagination').innerHTML = '';
    return;
  }
  tbody.innerHTML = pageEntries.map(([uid, rider]) =>
    `<tr>
      <td>${escapeHtml(uid.slice(-8))}</td>
      <td>${escapeHtml(rider.name || '-')}</td>
      <td>${escapeHtml(rider.email || '-')}</td>
      <td>${escapeHtml(rider.phone || '-')}</td>
      <td>${escapeHtml(rider.status || 'active')}</td>
      <td>${rider.isOnline ? '<span class="badge badge-success">Online</span>' : '<span class="badge badge-secondary">Offline</span>'}</td>
      <td>${formatDate(rider.createdAt)}</td>
      <td class="action-cell">
        <button class="btn btn-sm btn-primary" onclick="editRider('${uid}')">Edit</button>
        <button class="btn btn-sm btn-warning" onclick="resetRiderPassword('${uid}')">Reset Pwd</button>
        <button class="btn btn-sm btn-danger" onclick="deleteRider('${uid}')">Delete</button>
      </td>
    </tr>`
  ).join('');
  renderPagination($('ridersPagination'), totalPages, page, renderRidersPage);
}

$('btnAddRider').addEventListener('click', () => {
  $('riderModal').dataset.mode = 'add';
  $('riderModal').dataset.uid = '';
  ['riderName', 'riderEmail', 'riderPassword', 'riderPhone',
   'riderFatherName', 'riderAge', 'riderAadharNo', 'riderQualification', 'riderAddress'
  ].forEach((id) => { $(id).value = ''; });
  $('riderPassword').style.display = 'block';
  $('riderModal').querySelector('.modal-title').textContent = 'Add Rider';
  $('riderModal').style.display = 'flex';
});

$('riderClose').addEventListener('click', () => {
  $('riderModal').style.display = 'none';
});

$('riderSave').addEventListener('click', async () => {
  const mode = $('riderModal').dataset.mode;
  const uid = $('riderModal').dataset.uid;
  const name = $('riderName').value.trim();
  const email = $('riderEmail').value.trim();
  const password = $('riderPassword').value;
  const phone = $('riderPhone').value.trim();

  if (!name || !email) {
    showToast('Name and email are required', 'error');
    return;
  }
  if (mode === 'add' && !password) {
    showToast('Password is required for new riders', 'error');
    return;
  }

  try {
    if (mode === 'add') {
      const resp = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error?.message || 'Auth creation failed');
      const riderUid = data.localId;
      await db.ref(`riders/${riderUid}`).set({
        name, email, phone,
        fatherName: $('riderFatherName').value.trim(),
        age: parseInt($('riderAge').value) || 0,
        aadharNo: $('riderAadharNo').value.trim(),
        qualification: $('riderQualification').value.trim(),
        address: $('riderAddress').value.trim(),
        status: 'active',
        isOnline: false,
        createdAt: firebase.database.ServerValue.TIMESTAMP
      });
      showToast('Rider added successfully', 'success');
    } else {
      const updates = {
        name, email, phone,
        fatherName: $('riderFatherName').value.trim(),
        age: parseInt($('riderAge').value) || 0,
        aadharNo: $('riderAadharNo').value.trim(),
        qualification: $('riderQualification').value.trim(),
        address: $('riderAddress').value.trim(),
        updatedAt: firebase.database.ServerValue.TIMESTAMP
      };
      await db.ref(`riders/${uid}`).update(updates);
      showToast('Rider updated successfully', 'success');
    }
    $('riderModal').style.display = 'none';
  } catch (err) {
    showToast('Rider save failed: ' + err.message, 'error');
  }
});

window.editRider = (uid) => {
  const rider = allRiders[uid];
  if (!rider) return;
  $('riderModal').dataset.mode = 'edit';
  $('riderModal').dataset.uid = uid;
  $('riderName').value = rider.name || '';
  $('riderEmail').value = rider.email || '';
  $('riderPassword').value = '';
  $('riderPassword').style.display = 'none';
  $('riderPhone').value = rider.phone || '';
  $('riderFatherName').value = rider.fatherName || '';
  $('riderAge').value = rider.age || '';
  $('riderAadharNo').value = rider.aadharNo || '';
  $('riderQualification').value = rider.qualification || '';
  $('riderAddress').value = rider.address || '';
  $('riderModal').querySelector('.modal-title').textContent = 'Edit Rider';
  $('riderModal').style.display = 'flex';
};

window.resetRiderPassword = (uid) => {
  const rider = allRiders[uid];
  if (!rider || !rider.email) {
    showToast('Rider email not found', 'error');
    return;
  }
  confirmAction(`Send password reset email to ${rider.email}?`, async () => {
    try {
      await auth.sendPasswordResetEmail(rider.email);
      showToast('Password reset email sent', 'success');
    } catch (err) {
      showToast('Reset failed: ' + err.message, 'error');
    }
  });
};

window.deleteRider = (uid) => {
  const rider = allRiders[uid];
  confirmAction(`Delete rider ${rider?.name || uid}? This cannot be undone.`, async () => {
    try {
      await db.ref(`riders/${uid}`).remove();
      showToast('Rider deleted', 'success');
    } catch (err) {
      showToast('Delete failed: ' + err.message, 'error');
    }
  });
};

// ======================== USERS ========================

let usersPage = 1;
let filteredUsers = [];

function initUsers() {
  usersPage = 1;
  db.ref('users').off();
  db.ref('users').on('value', (snap) => {
    allUsers = snap.val() || {};
    filterUsers();
  });
}

function filterUsers() {
  const q = ($('userSearchInput').value || '').toLowerCase().trim();
  const entries = Object.entries(allUsers);
  filteredUsers = q
    ? entries.filter(([_, u]) =>
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.phone || '').toLowerCase().includes(q)
      )
    : entries;
  renderUsersPage(1);
}

$('userSearchInput').addEventListener('input', () => {
  usersPage = 1;
  filterUsers();
});

function renderUsersPage(page) {
  usersPage = page;
  const tbody = $('usersBody');
  if (!tbody) return;
  const totalPages = Math.ceil(filteredUsers.length / USER_PAGE_SIZE) || 1;
  const start = (page - 1) * USER_PAGE_SIZE;
  const pageEntries = filteredUsers.slice(start, start + USER_PAGE_SIZE);
  if (!pageEntries.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No users found</td></tr>';
    $('usersPagination').innerHTML = '';
    return;
  }
  tbody.innerHTML = pageEntries.map(([uid, user]) => {
    const wallet = user.wallet || 0;
    return `<tr>
      <td>${escapeHtml(uid.slice(-8))}</td>
      <td>${escapeHtml(user.name || '-')}</td>
      <td>${escapeHtml(user.email || '-')}</td>
      <td>${escapeHtml(user.phone || '-')}</td>
      <td>\u20B9${Number(wallet).toLocaleString('en-IN')}</td>
      <td>${formatDate(user.createdAt)}</td>
      <td class="action-cell">
        <button class="btn btn-sm btn-success" onclick="creditWallet('${uid}')">Credit</button>
        <button class="btn btn-sm btn-info" onclick="viewWalletHistory('${uid}')">Wallet</button>
        <button class="btn btn-sm btn-warning" onclick="resetUserPassword('${uid}')">Reset Pwd</button>
      </td>
    </tr>`;
  }).join('');
  renderPagination($('usersPagination'), totalPages, page, renderUsersPage);
}

$('btnExportUsers').addEventListener('click', () => {
  const headers = ['UID', 'Name', 'Email', 'Phone', 'Wallet', 'Created At', 'Orders Count'];
  const rows = filteredUsers.map(([uid, u]) => [
    uid, u.name || '', u.email || '', u.phone || '',
    u.wallet || 0, formatDate(u.createdAt), u.orderCount || 0
  ]);
  exportCSV(headers, rows, `users_export_${Date.now()}.csv`);
  showToast('Users exported', 'success');
});

window.creditWallet = (uid) => {
  const user = allUsers[uid];
  $('walletUserName').textContent = user?.name || uid;
  $('walletUserEmail').textContent = user?.email || '';
  $('walletAmount').value = '';
  $('walletReason').value = '';
  $('walletModal').dataset.uid = uid;
  $('walletModal').style.display = 'flex';
};

$('walletClose').addEventListener('click', () => {
  $('walletModal').style.display = 'none';
});

$('walletSave').addEventListener('click', async () => {
  const uid = $('walletModal').dataset.uid;
  const amount = parseFloat($('walletAmount').value);
  const reason = $('walletReason').value.trim() || 'Admin credit';
  if (!amount || amount <= 0) {
    showToast('Enter a valid amount', 'error');
    return;
  }
  try {
    const walletRef = db.ref(`users/${uid}/wallet`);
    await walletRef.transaction((current) => (current || 0) + amount);
    await db.ref(`users/${uid}/walletHistory`).push({
      amount,
      type: 'credit',
      reason,
      timestamp: firebase.database.ServerValue.TIMESTAMP,
      adminId: auth.currentUser?.uid || 'admin'
    });
    $('walletModal').style.display = 'none';
    showToast(`\u20B9${amount} credited to wallet`, 'success');
  } catch (err) {
    showToast('Wallet credit failed: ' + err.message, 'error');
  }
});

window.viewWalletHistory = async (uid) => {
  const user = allUsers[uid];
  $('walletHistoryModal').querySelector('.modal-header h2').textContent =
    `Wallet History: ${user?.name || uid}`;
  const tbody = $('walletHistoryBody');
  tbody.innerHTML = '<tr><td colspan="4" class="text-muted">Loading...</td></tr>';
  $('walletHistoryModal').style.display = 'flex';
  try {
    const snap = await db.ref(`users/${uid}/walletHistory`).limitToLast(5).once('value');
    const data = snap.val() || {};
    const entries = Object.entries(data).reverse();
    tbody.innerHTML = entries.length
      ? entries.map(([key, e]) =>
          `<tr>
            <td>${formatDate(e.timestamp)}</td>
            <td class="${e.type === 'credit' ? 'text-success' : 'text-danger'}">${e.type === 'credit' ? '+' : '-'}\u20B9${Math.abs(e.amount).toLocaleString('en-IN')}</td>
            <td>${escapeHtml(e.type || '')}</td>
            <td>${escapeHtml(e.reason || '')}</td>
          </tr>`
        ).join('')
      : '<tr><td colspan="4" class="text-muted">No transactions</td></tr>';
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-danger">Failed to load history</td></tr>';
  }
};

$('walletHistoryClose').addEventListener('click', () => {
  $('walletHistoryModal').style.display = 'none';
});

window.resetUserPassword = (uid) => {
  const user = allUsers[uid];
  if (!user?.email) {
    showToast('User email not found', 'error');
    return;
  }
  confirmAction(`Send password reset to ${user.email}?`, async () => {
    try {
      await auth.sendPasswordResetEmail(user.email);
      showToast('Password reset email sent', 'success');
    } catch (err) {
      showToast('Reset failed: ' + err.message, 'error');
    }
  });
};

// ======================== PROMOTIONS ========================

function initPromotions() {
  // Surge
  db.ref('system/promotions/surge').once('value').then((snap) => {
    const data = snap.val() || {};
    $('surgeMultiplier').value = data.multiplier || 1;
    $('surgeThreshold').value = data.threshold || 0;
    $('surgeStartTime').value = data.startTime || '';
    $('surgeEndTime').value = data.endTime || '';
  }).catch(() => {});
  // Discount
  db.ref('system/promotions/globalDiscount').once('value').then((snap) => {
    const data = snap.val() || {};
    $('discountPercent').value = data.percent || 0;
    $('discountMaxAmount').value = data.maxAmount || 0;
    $('discountMinOrder').value = data.minOrder || 0;
    $('discountActive').checked = data.active !== false;
  }).catch(() => {});
  // Platform Fee
  db.ref('system/config/platformFee').once('value').then((snap) => {
    const data = snap.val() || {};
    $('platformFee').value = data.amount || 0;
    $('platformFeeActive').checked = data.active !== false;
  }).catch(() => {});
  // Coupons
  loadCoupons();
}

$('btnApplySurge').addEventListener('click', async () => {
  try {
    await db.ref('system/promotions/surge').set({
      multiplier: parseFloat($('surgeMultiplier').value) || 1,
      threshold: parseInt($('surgeThreshold').value) || 0,
      startTime: $('surgeStartTime').value || '',
      endTime: $('surgeEndTime').value || '',
      updatedAt: firebase.database.ServerValue.TIMESTAMP
    });
    showToast('Surge pricing updated', 'success');
  } catch (err) {
    showToast('Failed: ' + err.message, 'error');
  }
});

$('btnApplyDiscount').addEventListener('click', async () => {
  try {
    await db.ref('system/promotions/globalDiscount').set({
      percent: parseFloat($('discountPercent').value) || 0,
      maxAmount: parseFloat($('discountMaxAmount').value) || 0,
      minOrder: parseFloat($('discountMinOrder').value) || 0,
      active: $('discountActive').checked,
      updatedAt: firebase.database.ServerValue.TIMESTAMP
    });
    showToast('Global discount updated', 'success');
  } catch (err) {
    showToast('Failed: ' + err.message, 'error');
  }
});

$('btnSetPlatformFee').addEventListener('click', async () => {
  try {
    await db.ref('system/config/platformFee').set({
      amount: parseFloat($('platformFee').value) || 0,
      active: $('platformFeeActive').checked,
      updatedAt: firebase.database.ServerValue.TIMESTAMP
    });
    showToast('Platform fee updated', 'success');
  } catch (err) {
    showToast('Failed: ' + err.message, 'error');
  }
});

function loadCoupons() {
  db.ref('system/promotions/coupons').off();
  db.ref('system/promotions/coupons').on('value', (snap) => {
    const data = snap.val() || {};
    const tbody = $('promotionsBody');
    if (!tbody) return;
    const entries = Object.entries(data);
    if (!entries.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No coupons</td></tr>';
      return;
    }
    tbody.innerHTML = entries.map(([cid, cp]) =>
      `<tr>
        <td>${escapeHtml(cp.code || cid)}</td>
        <td>${escapeHtml(cp.type || 'flat')}</td>
        <td>${cp.type === 'percent' ? cp.value + '%' : '\u20B9' + (cp.value || 0)}</td>
        <td>\u20B9${(cp.minOrder || 0)}</td>
        <td>${cp.usageLimit || 'Unlimited'}</td>
        <td><span class="badge badge-${cp.active !== false ? 'success' : 'secondary'}">${cp.active !== false ? 'Active' : 'Inactive'}</span></td>
        <td class="action-cell">
          <button class="btn btn-sm btn-${cp.active !== false ? 'warning' : 'success'}" onclick="toggleCoupon('${cid}', ${cp.active !== false})">${cp.active !== false ? 'Disable' : 'Enable'}</button>
          <button class="btn btn-sm btn-danger" onclick="deleteCoupon('${cid}')">Delete</button>
        </td>
      </tr>`
    ).join('');
  });
}

$('btnAddCoupon').addEventListener('click', () => {
  $('couponCode').value = '';
  $('couponType').value = 'flat';
  $('couponValue').value = '';
  $('couponMinOrder').value = '';
  $('couponUsageLimit').value = '';
  $('couponModal').style.display = 'flex';
});

$('couponModalClose').addEventListener('click', () => {
  $('couponModal').style.display = 'none';
});

$('couponSave').addEventListener('click', async () => {
  const code = $('couponCode').value.trim().toUpperCase();
  if (!code) { showToast('Coupon code required', 'error'); return; }
  try {
    await db.ref('system/promotions/coupons').push({
      code,
      type: $('couponType').value,
      value: parseFloat($('couponValue').value) || 0,
      minOrder: parseFloat($('couponMinOrder').value) || 0,
      usageLimit: parseInt($('couponUsageLimit').value) || 0,
      active: true,
      createdAt: firebase.database.ServerValue.TIMESTAMP
    });
    $('couponModal').style.display = 'none';
    showToast('Coupon added', 'success');
  } catch (err) {
    showToast('Failed: ' + err.message, 'error');
  }
});

window.toggleCoupon = async (cid, current) => {
  try {
    await db.ref(`system/promotions/coupons/${cid}/active`).set(!current);
    showToast(`Coupon ${current ? 'disabled' : 'enabled'}`, 'success');
  } catch (err) {
    showToast('Failed: ' + err.message, 'error');
  }
};

window.deleteCoupon = (cid) => {
  confirmAction('Delete this coupon?', async () => {
    try {
      await db.ref(`system/promotions/coupons/${cid}`).remove();
      showToast('Coupon deleted', 'success');
    } catch (err) {
      showToast('Failed: ' + err.message, 'error');
    }
  });
};

$('btnPauseAllCoupons').addEventListener('click', () => {
  confirmAction('Pause ALL active coupons?', async () => {
    try {
      const snap = await db.ref('system/promotions/coupons').once('value');
      const data = snap.val() || {};
      const updates = {};
      for (const cid of Object.keys(data)) {
        if (data[cid].active !== false) updates[`system/promotions/coupons/${cid}/active`] = false;
      }
      if (Object.keys(updates).length) {
        await db.ref().update(updates);
        showToast('All coupons paused', 'success');
      } else {
        showToast('No active coupons to pause', 'info');
      }
    } catch (err) {
      showToast('Failed: ' + err.message, 'error');
    }
  });
});

$('btnExportCoupons').addEventListener('click', async () => {
  try {
    const snap = await db.ref('system/promotions/coupons').once('value');
    const data = snap.val() || {};
    const headers = ['Code', 'Type', 'Value', 'Min Order', 'Usage Limit', 'Active', 'Created At'];
    const rows = Object.entries(data).map(([cid, cp]) => [
      cp.code || cid, cp.type || 'flat', cp.value || 0,
      cp.minOrder || 0, cp.usageLimit || 'Unlimited',
      cp.active !== false ? 'Yes' : 'No', formatDate(cp.createdAt)
    ]);
    exportCSV(headers, rows, `coupons_${Date.now()}.csv`);
    showToast('Coupons exported', 'success');
  } catch (err) {
    showToast('Export failed: ' + err.message, 'error');
  }
});

// ======================== SETTLEMENTS ========================

function initSettlements() {
  const allOrdersForSettlement = [];
  const bizData = Object.keys(allBusinesses).length ? allBusinesses : {};

  const loadFn = Object.keys(bizData).length
    ? Promise.resolve(bizData)
    : db.ref('businesses').once('value').then((s) => s.val() || {});

  loadFn.then((data) => {
    let settledCount = 0;
    let pendingCount = 0;
    let settledVolume = 0;
    let pendingVolume = 0;

    for (const bid of Object.keys(data)) {
      const biz = data[bid];
      if (biz.outlets) {
        for (const oid of Object.keys(biz.outlets)) {
          const outlet = biz.outlets[oid];
          if (outlet.orders) {
            for (const orderId of Object.keys(outlet.orders)) {
              const order = outlet.orders[orderId];
              const total = Number(order.total || order.amount || 0);
              const settlementStatus = order.settlementStatus || order.paymentStatus || 'pending';
              allOrdersForSettlement.push({
                id: orderId, bid, oid,
                businessName: biz.name || bid,
                outletName: outlet.name || oid,
                total,
                commission: order.commission || 0,
                netAmount: total - (order.commission || 0),
                status: settlementStatus,
                timestamp: order.createdAt || order.timestamp || 0,
                settledAt: order.settledAt || null
              });
              if (settlementStatus === 'settled') {
                settledCount++;
                settledVolume += total;
              } else {
                pendingCount++;
                pendingVolume += total;
              }
            }
          }
        }
      }
    }

    $('kpiSettlementVolume').textContent = '\u20B9' + settledVolume.toLocaleString('en-IN');
    $('kpiPlatformCommission').textContent = '\u20B9' + allOrdersForSettlement.reduce((s, o) => s + o.commission, 0).toLocaleString('en-IN');
    $('kpiPendingSettlements').textContent = '\u20B9' + pendingVolume.toLocaleString('en-IN');
    $('kpiTotalSettled').textContent = settledCount;

    const dateFrom = $('settlementDateFrom')?.value;
    const dateTo = $('settlementDateTo')?.value;
    const statusFilter = $('settlementStatusFilter')?.value || 'all';

    let filtered = allOrdersForSettlement;
    if (dateFrom) {
      const fromTs = new Date(dateFrom).getTime();
      filtered = filtered.filter((o) => o.timestamp >= fromTs);
    }
    if (dateTo) {
      const toTs = new Date(dateTo).getTime() + 86400000;
      filtered = filtered.filter((o) => o.timestamp < toTs);
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter((o) => o.status === statusFilter);
    }
    filtered.sort((a, b) => b.timestamp - a.timestamp);

    const tbody = $('settlementsBody');
    if (!tbody) return;
    if (!filtered.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No settlements found</td></tr>';
      return;
    }
    tbody.innerHTML = filtered.map((o) =>
      `<tr>
        <td>#${escapeHtml(o.id.slice(-8))}</td>
        <td>${escapeHtml(o.businessName)}</td>
        <td>${escapeHtml(o.outletName)}</td>
        <td>\u20B9${o.total.toLocaleString('en-IN')}</td>
        <td>\u20B9${o.commission.toLocaleString('en-IN')}</td>
        <td>\u20B9${o.netAmount.toLocaleString('en-IN')}</td>
        <td><span class="badge badge-${o.status === 'settled' ? 'success' : 'warning'}">${escapeHtml(o.status)}</span></td>
        <td>${o.status === 'settled' ? formatDate(o.settledAt) : formatDate(o.timestamp)}</td>
        <td class="action-cell">
          ${o.status !== 'settled' ? `<button class="btn btn-sm btn-success" onclick="settleOrder('${escapeHtml(o.bid)}','${escapeHtml(o.oid)}','${escapeHtml(o.id)}',${o.netAmount})">Settle</button>` : ''}
        </td>
      </tr>`
    ).join('');
  }).catch((err) => {
    showToast('Settlements load error: ' + err.message, 'error');
  });
}

$('settlementDateFrom')?.addEventListener('change', initSettlements);
$('settlementDateTo')?.addEventListener('change', initSettlements);
$('settlementStatusFilter')?.addEventListener('change', initSettlements);
$('btnFilterSettlements')?.addEventListener('click', initSettlements);

window.settleOrder = async (bid, oid, orderId, netAmount) => {
  confirmAction(`Settle this order for \u20B9${netAmount.toLocaleString('en-IN')}?`, async () => {
    try {
      const now = firebase.database.ServerValue.TIMESTAMP;
      await db.ref(`businesses/${bid}/outlets/${oid}/orders/${orderId}`).update({
        settlementStatus: 'settled',
        settledAt: now
      });
      await db.ref(`businesses/${bid}/outlets/${oid}/settlements`).push({
        orderId,
        amount: netAmount,
        type: 'settlement',
        timestamp: now
      });
      await db.ref('system/auditLogs').push({
        action: 'settlement',
        orderId,
        amount: netAmount,
        businessId: bid,
        outletId: oid,
        adminId: auth.currentUser?.uid || 'admin',
        timestamp: now
      });
      showToast('Order settled successfully', 'success');
      initSettlements();
    } catch (err) {
      showToast('Settlement failed: ' + err.message, 'error');
    }
  });
};

// ======================== DELIVERY SLABS ========================

let slabsData = [];

function initDeliverySlabs() {
  db.ref('system/settings/delivery/slabs').off();
  db.ref('system/settings/delivery/slabs').on('value', (snap) => {
    slabsData = snap.val() || [];
    renderSlabs();
  });
}

function renderSlabs() {
  const tbody = $('slabsBody');
  if (!tbody) return;
  if (!Array.isArray(slabsData) || !slabsData.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No delivery slabs configured</td></tr>';
    return;
  }
  tbody.innerHTML = slabsData.map((slab, idx) =>
    `<tr>
      <td>${escapeHtml(slab.name || `Slab ${idx + 1}`)}</td>
      <td>${slab.minDistance || 0} km</td>
      <td>${slab.maxDistance || 0} km</td>
      <td>\u20B9${(slab.charge || 0).toLocaleString('en-IN')}</td>
      <td class="action-cell">
        <button class="btn btn-sm btn-primary" onclick="editSlab(${idx})">Edit</button>
        <button class="btn btn-sm btn-danger" onclick="removeSlab(${idx})">Remove</button>
      </td>
    </tr>`
  ).join('');
}

$('btnAddSlab').addEventListener('click', () => {
  showSlabEditor(null);
});

$('btnSaveDeliveryFlow')?.addEventListener('click', () => {
  saveSlabs();
});

function showSlabEditor(idx) {
  const isEdit = idx !== null && idx !== undefined;
  const slab = isEdit ? slabsData[idx] : {};
  const name = prompt('Slab name:', slab?.name || '');
  if (name === null) return;
  const minD = parseFloat(prompt('Min distance (km):', slab?.minDistance || '')) || 0;
  const maxD = parseFloat(prompt('Max distance (km):', slab?.maxDistance || '')) || 0;
  const charge = parseFloat(prompt('Delivery charge (\u20B9):', slab?.charge || '')) || 0;

  const newSlab = { name, minDistance: minD, maxDistance: maxD, charge };
  if (isEdit) {
    slabsData[idx] = newSlab;
  } else {
    slabsData.push(newSlab);
  }
  saveSlabs();
}

window.editSlab = showSlabEditor;

window.removeSlab = (idx) => {
  confirmAction('Remove this slab?', () => {
    slabsData.splice(idx, 1);
    saveSlabs();
  });
};

function saveSlabs() {
  db.ref('system/settings/delivery/slabs').set(slabsData)
    .then(() => showToast('Slabs saved', 'success'))
    .catch((err) => showToast('Save failed: ' + err.message, 'error'));
}

// ======================== INVENTORY ========================

function initInventory() {
  const q = ($('inventorySearchInput').value || '').toLowerCase().trim();
  const tbody = $('inventoryBody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Loading inventory...</td></tr>';

  db.ref('businesses').once('value').then((snap) => {
    const data = snap.val() || {};
    let dishes = [];
    for (const bid of Object.keys(data)) {
      const biz = data[bid];
      if (biz.outlets) {
        for (const oid of Object.keys(biz.outlets)) {
          const outlet = biz.outlets[oid];
          if (outlet.menu || outlet.dishes) {
            const menu = outlet.menu || outlet.dishes || {};
            for (const dishId of Object.keys(menu)) {
              const dish = menu[dishId];
              dishes.push({
                id: dishId,
                bid, oid,
                businessName: biz.name || bid,
                outletName: outlet.name || oid,
                name: dish.name || dish.title || 'Unnamed',
                price: dish.price || 0,
                stock: dish.stock ?? dish.quantity ?? 0,
                available: dish.available !== false
              });
            }
          }
        }
      }
    }
    if (q) {
      dishes = dishes.filter((d) =>
        d.name.toLowerCase().includes(q) ||
        d.businessName.toLowerCase().includes(q) ||
        d.outletName.toLowerCase().includes(q)
      );
    }
    if (!dishes.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No inventory items found</td></tr>';
      return;
    }
    tbody.innerHTML = dishes.map((d) =>
      `<tr>
        <td>${escapeHtml(d.businessName)}</td>
        <td>${escapeHtml(d.outletName)}</td>
        <td>${escapeHtml(d.name)}</td>
        <td>\u20B9${d.price.toLocaleString('en-IN')}</td>
        <td><span class="stock-value">${d.stock}</span></td>
        <td><span class="badge badge-${d.available ? 'success' : 'secondary'}">${d.available ? 'In Stock' : 'Out of Stock'}</span></td>
        <td class="action-cell">
          <button class="btn btn-sm btn-success" onclick="adjustStock('${escapeHtml(d.bid)}','${escapeHtml(d.oid)}','${escapeHtml(d.id)}',1)">+</button>
          <button class="btn btn-sm btn-danger" onclick="adjustStock('${escapeHtml(d.bid)}','${escapeHtml(d.oid)}','${escapeHtml(d.id)}',-1)">-</button>
          <button class="btn btn-sm btn-${d.available ? 'warning' : 'success'}" onclick="toggleAvailability('${escapeHtml(d.bid)}','${escapeHtml(d.oid)}','${escapeHtml(d.id)}',${d.available})">
            ${d.available ? 'Disable' : 'Enable'}
          </button>
        </td>
      </tr>`
    ).join('');
  }).catch((err) => {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Error: ' + escapeHtml(err.message) + '</td></tr>';
  });
}

$('inventorySearchInput').addEventListener('input', initInventory);

window.adjustStock = async (bid, oid, dishId, delta) => {
  try {
    const ref = db.ref(`businesses/${bid}/outlets/${oid}/menu/${dishId}/stock`);
    await ref.transaction((current) => Math.max(0, (current || 0) + delta));
    showToast('Stock updated', 'success');
  } catch (err) {
    showToast('Stock update failed: ' + err.message, 'error');
  }
};

window.toggleAvailability = async (bid, oid, dishId, current) => {
  try {
    await db.ref(`businesses/${bid}/outlets/${oid}/menu/${dishId}/available`).set(!current);
    showToast(`Item ${current ? 'disabled' : 'enabled'}`, 'success');
  } catch (err) {
    showToast('Toggle failed: ' + err.message, 'error');
  }
};

// ======================== REVIEWS ========================

function initReviews() {
  const tbody = $('reviewsBody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Loading reviews...</td></tr>';

  db.ref('businesses').once('value').then((snap) => {
    const data = snap.val() || {};
    let reviews = [];
    for (const bid of Object.keys(data)) {
      const biz = data[bid];
      if (biz.outlets) {
        for (const oid of Object.keys(biz.outlets)) {
          const outlet = biz.outlets[oid];
          if (outlet.reviews) {
            for (const revId of Object.keys(outlet.reviews)) {
              const rev = outlet.reviews[revId];
              reviews.push({
                id: revId, bid, oid,
                businessName: biz.name || bid,
                outletName: outlet.name || oid,
                userName: rev.userName || rev.name || 'Anonymous',
                rating: rev.rating || 0,
                comment: rev.comment || rev.text || '',
                timestamp: rev.createdAt || rev.timestamp || 0
              });
            }
          }
        }
      }
    }
    reviews.sort((a, b) => b.timestamp - a.timestamp);
    if (!reviews.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No reviews found</td></tr>';
      return;
    }
    tbody.innerHTML = reviews.map((r) =>
      `<tr>
        <td>${escapeHtml(r.businessName)}</td>
        <td>${escapeHtml(r.outletName)}</td>
        <td>${escapeHtml(r.userName)}</td>
        <td>${'★'.repeat(Math.round(r.rating))}${'☆'.repeat(5 - Math.round(r.rating))} (${r.rating})</td>
        <td>${escapeHtml(r.comment.slice(0, 100))}${r.comment.length > 100 ? '...' : ''}</td>
        <td>${formatDate(r.timestamp)}</td>
      </tr>`
    ).join('');
  }).catch((err) => {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Error: ' + escapeHtml(err.message) + '</td></tr>';
  });
}

// ======================== BROADCAST ========================

function initBroadcast() {
  loadBroadcastHistory();
}

$('btnSendBroadcast').addEventListener('click', async () => {
  const now = Date.now();
  if (now - broadcastResetTime > 60000) {
    broadcastCount = 0;
    broadcastResetTime = now;
  }
  if (broadcastCount >= 5) {
    showToast('Rate limit: max 5 broadcasts per minute', 'error');
    return;
  }

  const title = $('broadcastTitle')?.value.trim();
  const message = $('broadcastMessage')?.value.trim();
  const audience = $('broadcastTarget')?.value || 'all';
  if (!message) {
    showToast('Message is required', 'error');
    return;
  }
  try {
    await db.ref('system/broadcasts').push({
      title: title || '',
      message,
      audience,
      sentBy: auth.currentUser?.email || 'admin',
      sentAt: firebase.database.ServerValue.TIMESTAMP
    });
    if ($('broadcastTitle')) $('broadcastTitle').value = '';
    if ($('broadcastMessage')) $('broadcastMessage').value = '';
    broadcastCount++;
    showToast('Broadcast sent', 'success');
    loadBroadcastHistory();
  } catch (err) {
    showToast('Broadcast failed: ' + err.message, 'error');
  }
});

function loadBroadcastHistory() {
  db.ref('system/broadcasts').orderByChild('sentAt').limitToLast(50).once('value').then((snap) => {
    const data = snap.val() || {};
    const tbody = $('broadcastHistoryBody');
    if (!tbody) return;
    const entries = Object.values(data).reverse();
    if (!entries.length) {
      tbody.innerHTML = '<tr><td colspan="4" class="empty-state">No broadcasts sent</td></tr>';
      return;
    }
    tbody.innerHTML = entries.map((b) =>
      `<tr>
        <td>${escapeHtml(b.title || '-')}</td>
        <td>${escapeHtml(b.message.slice(0, 80))}${b.message.length > 80 ? '...' : ''}</td>
        <td>${escapeHtml(b.audience || 'all')}</td>
        <td>${formatDate(b.sentAt)}</td>
      </tr>`
    ).join('');
  }).catch(() => {});
}

// ======================== AUDIT ========================

let auditPage = 1;
let allAuditEntries = [];

function initAudit() {
  auditPage = 1;
  allAuditEntries = [];
  const tbody = $('auditBody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="4" class="empty-state">Loading audit logs...</td></tr>';

  const paths = ['system/auditLogs', 'logs/marketplaceAudit', 'logs/botAudit', 'logs/riderErrors'];
  const promises = paths.map((p) =>
    db.ref(p).once('value').then((snap) => {
      const data = snap.val() || {};
      for (const [key, entry] of Object.entries(data)) {
        allAuditEntries.push({
          id: key,
          source: p,
          action: entry.action || entry.type || 'unknown',
          details: entry.details || entry.message || entry.error || '',
          admin: entry.adminId || entry.admin || entry.userId || '-',
          timestamp: entry.timestamp || entry.createdAt || 0
        });
      }
    })
  );

  Promise.all(promises).then(() => {
    allAuditEntries.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    renderAuditPage(1);
  }).catch((err) => {
    tbody.innerHTML = '<tr><td colspan="4" class="empty-state">Error loading audit: ' + escapeHtml(err.message) + '</td></tr>';
  });
}

function renderAuditPage(page) {
  auditPage = page;
  const tbody = $('auditBody');
  if (!tbody) return;
  const totalPages = Math.ceil(allAuditEntries.length / AUDIT_PAGE_SIZE) || 1;
  const start = (page - 1) * AUDIT_PAGE_SIZE;
  const pageEntries = allAuditEntries.slice(start, start + AUDIT_PAGE_SIZE);
  if (!pageEntries.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty-state">No audit entries</td></tr>';
    $('auditPagination').innerHTML = '';
    return;
  }
  tbody.innerHTML = pageEntries.map((e) =>
    `<tr>
      <td>${escapeHtml(e.action)}</td>
      <td>${escapeHtml(e.details.slice(0, 120))}${e.details.length > 120 ? '...' : ''}</td>
      <td>${escapeHtml(e.admin)}</td>
      <td>${formatDate(e.timestamp)}</td>
    </tr>`
  ).join('');
  renderPagination($('auditPagination'), totalPages, page, renderAuditPage);
}

// ======================== REPORTS ========================

function initReports() {
  const allOrdersForReport = [];
  db.ref('businesses').once('value').then((snap) => {
    const data = snap.val() || {};
    let totalRevenue = 0;
    let totalOrders = 0;
    let totalCommission = 0;
    const outletRevenue = {};
    const dailyRev = {};

    for (const bid of Object.keys(data)) {
      const biz = data[bid];
      if (biz.outlets) {
        for (const oid of Object.keys(biz.outlets)) {
          const outlet = biz.outlets[oid];
          if (outlet.orders) {
            for (const orderId of Object.keys(outlet.orders)) {
              const order = outlet.orders[orderId];
              const total = Number(order.total || order.amount || 0);
              const commission = Number(order.commission || 0);
              totalRevenue += total;
              totalOrders++;
              totalCommission += commission;

              const key = biz.name || bid;
              if (!outletRevenue[key]) outletRevenue[key] = { revenue: 0, orders: 0, commission: 0 };
              outletRevenue[key].revenue += total;
              outletRevenue[key].orders++;
              outletRevenue[key].commission += commission;

              const dayKey = new Date(order.createdAt || order.timestamp || 0).toISOString().slice(0, 10);
              dailyRev[dayKey] = (dailyRev[dayKey] || 0) + total;
            }
          }
        }
      }
    }

    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const netPlatformRevenue = totalCommission;
    const partnerPayouts = totalRevenue - totalCommission;
    const takeRate = totalRevenue > 0 ? (totalCommission / totalRevenue) * 100 : 0;

    $('kpiTotalRevenue').textContent = '\u20B9' + totalRevenue.toLocaleString('en-IN');
    $('kpiTotalOrders').textContent = totalOrders;
    $('kpiAvgOrderValue').textContent = '\u20B9' + avgOrderValue.toLocaleString('en-IN', { maximumFractionDigits: 2 });
    $('kpiNetPlatformRevenue').textContent = '\u20B9' + netPlatformRevenue.toLocaleString('en-IN');
    $('kpiPartnerPayouts').textContent = '\u20B9' + partnerPayouts.toLocaleString('en-IN');
    $('kpiTakeRate').textContent = takeRate.toFixed(2) + '%';

    // Top outlets
    const topOutlets = Object.entries(outletRevenue)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 10);
    const topBody = $('topOutletsBody');
    if (topBody) {
      topBody.innerHTML = topOutlets.map(([name, data], i) =>
        `<tr>
          <td>${i + 1}</td>
          <td>${escapeHtml(name)}</td>
          <td>\u20B9${data.revenue.toLocaleString('en-IN')}</td>
          <td>${data.orders}</td>
          <td>\u20B9${data.commission.toLocaleString('en-IN')}</td>
        </tr>`
      ).join('');
    }

    buildRevenueChart(dailyRev, 'reportsChart');
  }).catch((err) => {
    showToast('Reports load error: ' + err.message, 'error');
  });
}

$('btnExportCSV')?.addEventListener('click', () => {
  const tbody = $('topOutletsBody');
  if (!tbody) return;
  const rows = [];
  tbody.querySelectorAll('tr').forEach((tr) => {
    const cells = tr.querySelectorAll('td');
    if (cells.length) {
      rows.push([...cells].map((c) => c.textContent.trim()));
    }
  });
  if (!rows.length) {
    showToast('No data to export', 'error');
    return;
  }
  exportCSV(['#', 'Outlet', 'Revenue', 'Orders', 'Commission'], rows, `reports_${Date.now()}.csv`);
  showToast('CSV exported', 'success');
});

$('btnExportPDF')?.addEventListener('click', () => {
  const content = $('reportsContent');
  if (!content) return;
  if (typeof html2pdf !== 'undefined') {
    html2pdf().set({ margin: 10, filename: `report_${Date.now()}.pdf`, html2canvas: { scale: 2 } }).from(content).save();
    showToast('PDF generated', 'success');
  } else {
    showToast('html2pdf library not loaded. Please refresh.', 'error');
  }
});

// ======================== SETTINGS ========================

function initSettings() {
  loadTFAStatus();
}

async function loadTFAStatus() {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  try {
    const snap = await db.ref(`system/admins/${uid}/tfaSecret`).once('value');
    const secret = snap.val();
    if (secret) {
      $('btnSetupTFA').style.display = 'none';
      $('btnDisableTFA').style.display = 'inline-block';
      $('tfaStatus').textContent = '2FA is enabled';
      $('tfaStatus').className = 'text-success';
    } else {
      $('btnSetupTFA').style.display = 'inline-block';
      $('btnDisableTFA').style.display = 'none';
      $('tfaStatus').textContent = '2FA is not configured';
      $('tfaStatus').className = 'text-muted';
    }
  } catch (err) {
    // ignore
  }
}

$('btnSetupTFA')?.addEventListener('click', async () => {
  const uid = auth.currentUser?.uid;
  const email = auth.currentUser?.email || 'admin@foodhubbie.com';
  if (!uid) return;
  try {
    const secret = generateTFASecret();
    await db.ref(`system/admins/${uid}/tfaSecret`).set(secret);
    $('tfaSecretDisplay').textContent = secret;
    $('tfaSecretInput').value = secret;

    const otpauth = `otpauth://totp/FoodHubbie:${email}?secret=${secret}&issuer=FoodHubbie`;
    $('tfaQrContainer').innerHTML = '';
    if (typeof QRCode !== 'undefined') {
      new QRCode($('tfaQrContainer'), { text: otpauth, width: 200, height: 200 });
    } else {
      $('tfaQrContainer').innerHTML = `<p>Scan this in authenticator app: <code>${escapeHtml(otpauth)}</code></p>`;
    }
    $('tfaSetupModal').style.display = 'flex';
  } catch (err) {
    showToast('TFA setup failed: ' + err.message, 'error');
  }
});

$('tfaSetupClose')?.addEventListener('click', () => {
  $('tfaSetupModal').style.display = 'none';
});

$('btnVerifyTFA')?.addEventListener('click', async () => {
  const code = $('tfaVerifyCode')?.value.trim();
  if (!code) { showToast('Enter verification code', 'error'); return; }
  const secret = $('tfaSecretInput')?.value;
  if (!secret) { showToast('Secret not found', 'error'); return; }
  const expected = await generateTOTP(secret);
  if (code === expected) {
    $('tfaSetupModal').style.display = 'none';
    $('tfaVerifyCode').value = '';
    showToast('2FA verified and enabled', 'success');
    loadTFAStatus();
  } else {
    showToast('Invalid code. Try again.', 'error');
  }
});

$('btnDisableTFA')?.addEventListener('click', () => {
  confirmAction('Disable 2FA?', async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    try {
      await db.ref(`system/admins/${uid}/tfaSecret`).remove();
      showToast('2FA disabled', 'success');
      loadTFAStatus();
    } catch (err) {
      showToast('Failed: ' + err.message, 'error');
    }
  });
});

function generateTFASecret() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';
  for (let i = 0; i < 16; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return secret;
}

function generateTOTP(secret) {
  const epoch = Math.floor(Date.now() / 30000);
  const counter = new ArrayBuffer(8);
  const view = new DataView(counter);
  view.setBigUint64(0, BigInt(epoch), false);
  const key = base32Decode(secret);
  const cryptoObj = window.crypto || window.msCrypto;
  if (!cryptoObj?.subtle) {
    return String(epoch).slice(-6).padStart(6, '0');
  }
  return cryptoObj.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign'])
    .then((cryptoKey) => cryptoObj.subtle.sign('HMAC', cryptoKey, counter))
    .then((sig) => {
      const hash = new Uint8Array(sig);
      const offset = hash[hash.length - 1] & 0xf;
      const binary = ((hash[offset] & 0x7f) << 24) | ((hash[offset + 1] & 0xff) << 16) |
                     ((hash[offset + 2] & 0xff) << 8) | (hash[offset + 3] & 0xff);
      return String(binary % 1000000).padStart(6, '0');
    })
    .catch(() => String(epoch).slice(-6).padStart(6, '0'));
}

function base32Decode(s) {
  const b32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  s = s.toUpperCase().replace(/[^A-Z2-7]/g, '');
  const bytes = [];
  let buffer = 0;
  let bitsLeft = 0;
  for (const ch of s) {
    const val = b32.indexOf(ch);
    if (val === -1) continue;
    buffer = (buffer << 5) | val;
    bitsLeft += 5;
    if (bitsLeft >= 8) {
      bytes.push((buffer >> (bitsLeft - 8)) & 0xFF);
      bitsLeft -= 8;
    }
  }
  return new Uint8Array(bytes);
}

// Data Retention
$('btnRunRetentionOrders')?.addEventListener('click', () => runRetention('orders'));
$('btnRunRetentionAudit')?.addEventListener('click', () => runRetention('audit'));
$('btnRunRetentionSettlements')?.addEventListener('click', () => runRetention('settlements'));

async function runRetention(type) {
  const daysMap = { orders: 'retentionOrdersDays', audit: 'retentionAuditDays', settlements: 'retentionSettlementsDays' };
  const actionMap = { orders: 'retentionOrdersAction', audit: 'retentionAuditAction', settlements: 'retentionSettlementsAction' };

  const days = parseInt($(daysMap[type])?.value) || 30;
  const action = $(actionMap[type])?.value || 'archive';
  const cutoff = Date.now() - days * 86400000;

  confirmAction(`Run ${action} on ${type} older than ${days} days?`, async () => {
    const statusEl = $('retentionStatus');
    if (statusEl) statusEl.textContent = `Running ${type} retention...`;

    try {
      let processed = 0;

      if (type === 'orders') {
        const snap = await db.ref('businesses').once('value');
        const data = snap.val() || {};
        for (const bid of Object.keys(data)) {
          const biz = data[bid];
          if (biz.outlets) {
            for (const oid of Object.keys(biz.outlets)) {
              const orders = biz.outlets[oid]?.orders || {};
              for (const orderId of Object.keys(orders)) {
                const order = orders[orderId];
                const ts = order.createdAt || order.timestamp || 0;
                if (ts > 0 && ts < cutoff) {
                  if (action === 'archive') {
                    await db.ref(`archives/orders/${bid}/${oid}/${orderId}`).set(order);
                  }
                  await db.ref(`businesses/${bid}/outlets/${oid}/orders/${orderId}`).remove();
                  processed++;
                }
              }
            }
          }
        }
      } else if (type === 'audit') {
        const paths = ['system/auditLogs', 'logs/marketplaceAudit', 'logs/botAudit', 'logs/riderErrors'];
        for (const path of paths) {
          const snap = await db.ref(path).once('value');
          const data = snap.val() || {};
          for (const key of Object.keys(data)) {
            const entry = data[key];
            const ts = entry.timestamp || entry.createdAt || 0;
            if (ts > 0 && ts < cutoff) {
              if (action === 'archive') {
                await db.ref(`archives/audit/${path.replace(/\//g, '_')}/${key}`).set(entry);
              }
              await db.ref(`${path}/${key}`).remove();
              processed++;
            }
          }
        }
      } else if (type === 'settlements') {
        const snap = await db.ref('businesses').once('value');
        const data = snap.val() || {};
        for (const bid of Object.keys(data)) {
          const biz = data[bid];
          if (biz.outlets) {
            for (const oid of Object.keys(biz.outlets)) {
              const settlements = biz.outlets[oid]?.settlements || {};
              for (const sId of Object.keys(settlements)) {
                const s = settlements[sId];
                const ts = s.timestamp || 0;
                if (ts > 0 && ts < cutoff) {
                  if (action === 'archive') {
                    await db.ref(`archives/settlements/${bid}/${oid}/${sId}`).set(s);
                  }
                  await db.ref(`businesses/${bid}/outlets/${oid}/settlements/${sId}`).remove();
                  processed++;
                }
              }
            }
          }
        }
      }

      if (statusEl) statusEl.textContent = `Retention complete: ${processed} ${type} ${action === 'archive' ? 'archived' : 'purged'}`;
      showToast(`Retention: ${processed} ${type} ${action === 'archive' ? 'archived' : 'purged'}`, 'success');
    } catch (err) {
      if (statusEl) statusEl.textContent = `Retention failed: ${err.message}`;
      showToast('Retention failed: ' + err.message, 'error');
    }
  });
}

// ======================== TAB NAVIGATION ========================

document.querySelectorAll('.nav-link').forEach((link) => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const tab = link.dataset.tab;
    if (tab) showTab(tab);
  });
});

// ======================== SIDEBAR TOGGLE ========================

$('sidebarToggle')?.addEventListener('click', () => {
  document.querySelector('.sidebar')?.classList.toggle('open');
});

// ======================== PAGINATION HELPER ========================

function renderPagination(container, totalPages, currentPage, callback) {
  if (!container) return;
  if (totalPages <= 1) { container.innerHTML = ''; return; }
  let html = '<nav><ul class="pagination">';
  html += `<li class="page-item ${currentPage <= 1 ? 'disabled' : ''}">
    <a class="page-link" href="#" data-page="${currentPage - 1}">&laquo;</a></li>`;
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
      html += `<li class="page-item ${i === currentPage ? 'active' : ''}">
        <a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
    } else if (i === currentPage - 3 || i === currentPage + 3) {
      html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
    }
  }
  html += `<li class="page-item ${currentPage >= totalPages ? 'disabled' : ''}">
    <a class="page-link" href="#" data-page="${currentPage + 1}">&raquo;</a></li>`;
  html += '</ul></nav>';
  container.innerHTML = html;

  container.querySelectorAll('.page-link').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const page = parseInt(a.dataset.page);
      if (page >= 1 && page <= totalPages && page !== currentPage) {
        callback(page);
      }
    });
  });
}

// ======================== DATE DISPLAY ========================

function updateDateDisplay() {
  const el = $('dateDisplay');
  if (el) {
    el.textContent = new Date().toLocaleDateString('en-IN', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  }
}

// ======================== APP INIT ========================

function initApp() {
  updateDateDisplay();
  setInterval(updateDateDisplay, 60000);
  showTab('dashboard');
}

// Auto-render lucide icons whenever new DOM is injected
const lucideObserver = new MutationObserver(() => {
  if (window.lucide) lucide.createIcons();
});
lucideObserver.observe(document.getElementById('app'), { childList: true, subtree: true });

// Init date display before auth
updateDateDisplay();

// ======================== MODAL CLOSE ON OVERLAY CLICK ========================

document.querySelectorAll('.modal-overlay').forEach((modal) => {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
  });
});

// ======================== SUCCESS DIALOG ========================

$('successDialogClose')?.addEventListener('click', () => {
  $('successDialog').style.display = 'none';
});


