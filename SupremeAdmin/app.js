/* =============================
   Foodhubbie Supreme Admin
   Dashboard Controller v1
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

// --- DOM refs ---
const $ = (id) => document.getElementById(id);

// --- Auth ---
$('loginForm').addEventListener('submit', async (e) => {
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

$('btnLogout').addEventListener('click', () => {
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
  });
});

// --- Sidebar Toggle (mobile) ---
$('sidebarToggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});
document.addEventListener('click', (e) => {
  const sidebar = document.getElementById('sidebar');
  if (window.innerWidth <= 768 && sidebar.classList.contains('open') && !sidebar.contains(e.target) && e.target !== $('sidebarToggle')) {
    sidebar.classList.remove('open');
  }
});

// --- Dashboard ---
function initDashboard() {
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

// --- KPI Calculations ---
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
  $('kpiRevenue').textContent = '₹' + revenueToday.toLocaleString('en-IN');
  $('kpiUsers').textContent = userSet.size || '—';

  // Riders count
  db.ref('riders').once('value', (snap) => {
    const riders = snap.val() || {};
    const active = Object.values(riders).filter((r) => r.status === 'Online' || r.status === 'online').length;
    $('kpiRiders').textContent = `${active}/${Object.keys(riders).length}`;
  });
}

// --- Charts ---
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

  const ctx = document.getElementById('revenueChart').getContext('2d');
  if (revenueChart) revenueChart.destroy();

  revenueChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: days.map((d) => d.label),
      datasets: [{
        label: 'Revenue (₹)',
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
        y: { beginAtZero: true, ticks: { callback: (v) => '₹' + v.toLocaleString('en-IN') } },
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

  const ctx = document.getElementById('ordersChart').getContext('2d');
  if (ordersChart) ordersChart.destroy();

  ordersChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{ data, backgroundColor: colors, borderWidth: 0 }]
    },
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

function generateLastNDays(n) {
  const result = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    result.push({
      label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      dateStr: d.toDateString()
    });
  }
  return result;
}

// --- Activity Feed ---
function updateActivity() {
  const list = $('activityList');
  const activities = [];

  Object.entries(businessesData).forEach(([bid, biz]) => {
    if (biz.outlets) {
      Object.entries(biz.outlets).forEach(([oid, outlet]) => {
        if (outlet.orders) {
          Object.entries(outlet.orders).slice(-10).forEach(([orderId, order]) => {
            const name = outlet.name || biz.name || 'Unknown Store';
            const status = order.status || 'Placed';
            const time = order.createdAt ? formatTimeAgo(order.createdAt) : 'recently';
            activities.push({ id: orderId, store: name, status, time, total: order.total, ts: order.createdAt || 0 });
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
    return `
      <div class="activity-item">
        <span class="activity-dot ${dotClass}"></span>
        <div class="activity-text">
          <strong>#${a.id.slice(-6)}</strong> from <strong>${a.store}</strong> — ${a.status}
          ${a.total ? '<span class="activity-total">₹' + a.total.toLocaleString('en-IN') + '</span>' : ''}
        </div>
        <span class="activity-time">${a.time}</span>
      </div>
    `;
  }).join('');
}

function formatTimeAgo(ts) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return mins + 'm ago';
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + 'h ago';
  return Math.floor(hrs / 24) + 'd ago';
}

// --- Refresh ---
$('btnRefresh').addEventListener('click', () => {
  const icon = $('btnRefresh').querySelector('i');
  icon.classList.add('spin');
  loadDashboardData();
  setTimeout(() => icon.classList.remove('spin'), 600);
});

// --- Revenue Range Change ---
// Future: wire up $('revenueRange') to rebuild chart with custom range
