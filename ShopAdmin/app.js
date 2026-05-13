// =============================
// GLOBAL STATE
// =============================
let currentBusiness = "business_roshani"; // Default
let currentOutlet = null;

const db = firebase.database();
const auth = firebase.auth();

const $ = (id) => document.getElementById(id);

// =============================
// AUTH + OUTLET DETECTION
// =============================
auth.onAuthStateChanged(async (user) => {

  if (!user) {
    document.getElementById('authOverlay').style.display = 'flex';
    return;
  }

  document.getElementById('authOverlay').style.display = 'none';
  document.getElementById('userEmailDisplay').textContent = user.email;

  // =============================
  // GET ADMIN OUTLET
  // =============================
  const snap = await db.ref('admins').once('value');

  let found = false;

  snap.forEach(child => {
    const admin = child.val();

    if (admin.email === user.email) {
      currentOutlet = window.currentOutlet = admin.outlet;
      if (admin.businessId) currentBusiness = admin.businessId;
      found = true;
    }
  });

  if (!found) {
    alert("No outlet assigned to this admin");
    return;
  }

  console.log(`Logged into: ${currentBusiness} / ${currentOutlet}`);

  // =============================
  // LOAD DATA
  // =============================
  initData();
});

// =============================
// LOGIN / LOGOUT
// =============================
const loginForm = $('loginForm');
if (loginForm) {
  loginForm.onsubmit = (e) => {
    e.preventDefault();
    const emailEl = $('loginEmail');
    const passEl = $('loginPassword');
    
    auth.signInWithEmailAndPassword(
      emailEl.value,
      passEl.value
    ).catch(e => {
      const errEl = $('loginError');
      if (errEl) {
          errEl.classList.remove('hidden');
          errEl.querySelector('.error-msg').textContent = e.message;
      }
    });
  };
}

const logoutBtn = $('logoutBtn');
if (logoutBtn) {
  logoutBtn.onclick = () => {
      localStorage.removeItem('adminIsLoggedIn');
      auth.signOut();
  }
}

// =============================
// INIT
// =============================
function initData() {
  loadOrders();
  loadCategories();
  loadDishes();
  loadSettings();
}

// =============================
// ORDERS
// =============================
function loadOrders() {
  const path = `businesses/${currentBusiness}/outlets/${currentOutlet}/orders`;
  db.ref(path)
    .on('value', snap => {

      const container = $('ordersTableBody') || $('ordersTable'); // Handle multiple potential IDs
      if (!container) return;
      container.innerHTML = '';

      let revenue = 0;
      let count = 0;

      const orders = [];

      snap.forEach(child => {
        orders.push({ id: child.key, ...child.val() });
      });

      orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      orders.forEach(order => {
        revenue += parseFloat(order.total || 0);
        count++;

        const items = order.cart
          ? order.cart.map(i => `${i.qty}x ${i.name}`).join(', ')
          : '';

        const tr = document.createElement('tr');
        tr.className = 'animate-fade-in';
        
        const tdId = document.createElement('td');
        tdId.textContent = `#${order.id.slice(-6).toUpperCase()}`;
        tr.appendChild(tdId);

        const tdCust = document.createElement('td');
        tdCust.innerHTML = `<strong>${order.customerName || 'Guest'}</strong><br><small>${order.phone || ''}</small>`;
        tr.appendChild(tdCust);

        const tdItems = document.createElement('td');
        tdItems.textContent = items;
        tr.appendChild(tdItems);

        const tdTotal = document.createElement('td');
        tdTotal.className = 'font-bold text-primary';
        tdTotal.textContent = `₹${order.total || 0}`;
        tr.appendChild(tdTotal);

        const tdStatus = document.createElement('td');
        const select = document.createElement('select');
        select.className = 'status-select-premium';
        select.onchange = (e) => updateOrderStatus(order.id, e.target.value);
        select.innerHTML = statusOptions(order.status);
        tdStatus.appendChild(select);
        tr.appendChild(tdStatus);

        container.appendChild(tr);
      });

      if ($('statRevenue')) $('statRevenue').textContent = '₹' + revenue;
      if ($('statOrders')) $('statOrders').textContent = count;
    });
}

function statusOptions(current) {
  const list = [
    "Placed",
    "Confirmed",
    "Preparing",
    "Packed",
    "Out for Delivery",
    "Delivered",
    "Cancelled"
  ];

  return list.map(s =>
    `<option ${s === current ? 'selected' : ''}>${s}</option>`
  ).join('');
}

window.updateOrderStatus = async (id, status) => {
  const path = `businesses/${currentBusiness}/outlets/${currentOutlet}/orders/${id}`;
  const now = new Date().toISOString();
  
  // Get current order to append to history
  const snap = await db.ref(path).once('value');
  const order = snap.val();
  
  const history = order.statusHistory || [];
  history.push({ status, timestamp: now });

  db.ref(path).update({ 
    status, 
    updatedAt: now,
    statusHistory: history
  });
};

// =============================
// CATEGORIES
// =============================
function loadCategories() {
  db.ref(`categories/${currentOutlet}`).on('value', snap => {

    const container = $('categoryList');
    container.innerHTML = '';

    snap.forEach(child => {
      const c = child.val();

      const card = document.createElement('div');
      card.className = 'admin-card';

      const delBtn = document.createElement('button');
      delBtn.textContent = 'X';
      delBtn.onclick = () => deleteItem('categories', child.key);
      card.appendChild(delBtn);

      const img = document.createElement('img');
      img.src = c.image || '';
      card.appendChild(img);

      const h4 = document.createElement('h4');
      h4.textContent = c.name || '';
      card.appendChild(h4);

      container.appendChild(card);
    });
  });
}

$('saveCategoryBtn').onclick = () => {
  const name = $('categoryName').value;
  const image = $('categoryImage').value;

  if (!name) return alert("Enter category");

  db.ref(`categories/${currentOutlet}`).push({ name, image });

  $('categoryName').value = '';
  $('categoryImage').value = '';
};

// =============================
// DISHES
// =============================
function loadDishes() {
  db.ref(`dishes/${currentOutlet}`).on('value', snap => {

    const grid = $('dishesGrid');
    grid.innerHTML = '';

    snap.forEach(child => {
      const d = child.val();

      const card = document.createElement('div');
      card.className = 'admin-card';

      const delBtn = document.createElement('button');
      delBtn.textContent = 'X';
      delBtn.onclick = () => deleteItem('dishes', child.key);
      card.appendChild(delBtn);

      const img = document.createElement('img');
      img.src = d.imageUrl || '';
      card.appendChild(img);

      const h4 = document.createElement('h4');
      h4.textContent = d.name || '';
      card.appendChild(h4);

      const p = document.createElement('p');
      p.textContent = `₹${d.price || '-'}`;
      card.appendChild(p);

      const sizeBtn = document.createElement('button');
      sizeBtn.textContent = 'Sizes';
      sizeBtn.onclick = () => openSize(child.key);
      card.appendChild(sizeBtn);

      const addonBtn = document.createElement('button');
      addonBtn.textContent = 'Addons';
      addonBtn.onclick = () => openAddon(child.key);
      card.appendChild(addonBtn);

      grid.appendChild(card);
    });
  });
}

$('saveDishBtn').onclick = () => {
  const name = $('dishName').value;
  const price = $('dishPrice').value;
  const imageUrl = $('dishImage').value;
  const categoryId = $('dishCategory').value;

  if (!name || !categoryId) return alert("Fill all");

  db.ref(`dishes/${currentOutlet}`).push({
    name,
    price,
    imageUrl,
    categoryId
  });

  $('dishName').value = '';
  $('dishPrice').value = '';
  $('dishImage').value = '';
};

// =============================
// SIZES SYSTEM
// =============================
window.openSize = (dishId) => {
  const size = prompt("Enter sizes JSON\nExample:\n{\"Small\":250,\"Medium\":300}");

  if (!size) return;

  try {
    const parsed = JSON.parse(size);

    db.ref(`sizes/${currentOutlet}/${dishId}`).set(parsed);
    alert("Saved");
  } catch {
    alert("Invalid JSON");
  }
};

// =============================
// ADDONS SYSTEM
// =============================
window.openAddon = (dishId) => {
  const name = prompt("Addon Name (Extra Cheese)");

  if (!name) return;

  const price = prompt("Enter price JSON\nExample:\n{\"Small\":30,\"Medium\":40}");

  if (!price) return;

  try {
    const parsed = JSON.parse(price);

    const { name: _ignored, ...sanitizedParsed } = parsed;

    db.ref(`addons/${currentOutlet}/${dishId}`).push({
      name,
      ...sanitizedParsed
    });

    alert("Addon Added");
  } catch {
    alert("Invalid format");
  }
};

// =============================
// DELETE
// =============================
window.deleteItem = (type, id) => {
  if (!confirm("Delete?")) return;

  db.ref(`${type}/${currentOutlet}/${id}`).remove();
};

// =============================
// SETTINGS
// =============================
function loadSettings() {
    const path = `businesses/${currentBusiness}/outlets/${currentOutlet}/settings/Store`;
    db.ref(path).on('value', snap => {
        const s = snap.val() || {};
        if ($('settingEntityName')) $('settingEntityName').value = s.entityName || '';
        if ($('settingStoreName')) $('settingStoreName').value = s.storeName || '';
        if ($('settingStoreAddress')) $('settingStoreAddress').value = s.address || '';
        if ($('settingGSTIN')) $('settingGSTIN').value = s.gstin || '';
        if ($('settingFSSAI')) $('settingFSSAI').value = s.fssai || '';
        if ($('settingTagline')) $('settingTagline').value = s.tagline || '';
        if ($('settingPoweredBy')) $('settingPoweredBy').value = s.poweredBy || '';
        if ($('settingDevPhone')) $('settingDevPhone').value = s.devPhone || '';
        if ($('settingReportPhone')) $('settingReportPhone').value = s.reportPhone || '';
        
        // Update dashboard badge
        if ($('outletBadge')) $('outletBadge').textContent = s.storeName || currentOutlet.toUpperCase();
        if ($('mobileOutletBadge')) $('mobileOutletBadge').textContent = s.storeName || currentOutlet.toUpperCase();
    });
}

if ($('btnSaveSettings')) {
    $('btnSaveSettings').onclick = () => {
        const path = `businesses/${currentBusiness}/outlets/${currentOutlet}/settings/Store`;
        const data = {
            entityName: $('settingEntityName').value,
            storeName: $('settingStoreName').value,
            address: $('settingStoreAddress').value,
            gstin: $('settingGSTIN').value,
            fssai: $('settingFSSAI').value,
            tagline: $('settingTagline').value,
            poweredBy: $('settingPoweredBy').value,
            devPhone: $('settingDevPhone').value,
            reportPhone: $('settingReportPhone').value,
            updatedAt: new Date().toISOString()
        };

        db.ref(path).update(data)
            .then(() => alert("Settings saved successfully!"))
            .catch(e => alert("Error: " + e.message));
    };
}

// =============================
// NAVIGATION
// =============================
document.querySelectorAll('[data-action="switchTab"]').forEach(item => {
  item.addEventListener('click', () => {
    const tabId = item.dataset.tab;
    
    // Update sidebar active state
    document.querySelectorAll('.nav-list li').forEach(li => li.classList.remove('active'));
    const li = item.closest('li');
    if (li) li.classList.add('active');

    // Show tab content
    document.querySelectorAll('.tab-content').forEach(s => s.classList.add('hidden'));
    const tab = document.getElementById('tab-' + tabId);
    if (tab) tab.classList.remove('hidden');
    
    // Update header title
    if ($('currentTabTitle')) {
        $('currentTabTitle').textContent = tabId.charAt(0).toUpperCase() + tabId.slice(1);
    }
    if ($('mobileTabTitle')) {
        $('mobileTabTitle').textContent = tabId.charAt(0).toUpperCase() + tabId.slice(1);
    }
  });
});

// Mobile Sidebar Toggle
document.querySelectorAll('[data-action="toggleSidebar"]').forEach(btn => {
    btn.onclick = () => {
        const sidebar = $('sidebarNav');
        const overlay = $('sidebarOverlay');
        if (sidebar) sidebar.classList.toggle('open');
        if (overlay) overlay.classList.toggle('active');
    };
});