/**
 * Menu/js/app.js
 * Wires together firebase.js, session.js, cart.js, order.js, ui.js.
 * This is the only file with top-level event listener registration.
 */
import { outletRef, get, onValue } from './firebase.js';
import { initSession, Session, requestBill, saveCheckoutContact } from './session.js';
import { Cart, addLine, setQty, clearCart, lineCount, subtotal as cartSubtotal, isEmpty as cartIsEmpty } from './cart.js';
import { placeOrder } from './order.js';
import * as UI from './ui.js';
import { haptic } from './ui.js';

// ---------------------------------------------------------------
// Module state for menu browsing
// ---------------------------------------------------------------
const M = {
    categories: [], dishes: [],
    activeCategory: 'all',
    draftDish: null, draftSize: null, draftAddons: [], draftQty: 1,
    taxPercent: 5,
    ordersCache: {},     // local cache of orders belonging to this session, for the bill summary
    currentOrderId: null,
    _orderUnsub: null,
};

// ---------------------------------------------------------------
// BOOT
// ---------------------------------------------------------------
async function boot() {
    const result = await initSession();
    if (!result.ok) {
        document.getElementById('loadingOverlay').style.display = 'none';
        UI.showScreen('screenInvalid');
        return;
    }

    const t = Session.table;
    document.getElementById('welcomeTableNum').textContent = String(t.number).padStart(2, '0');
    document.querySelectorAll('#menuTableChip').forEach(el => el.textContent = `TABLE ${String(t.number).padStart(2, '0')}`);
    document.getElementById('cartHeaderTitle').textContent = `Your Cart (Table ${String(t.number).padStart(2, '0')})`;

    // Branding + dine-in settings (tax %, etc.)
    const [brandSnap, dineSettingsSnap] = await Promise.all([
        get(outletRef('settings/storeName')),
        get(outletRef('dineinSettings'))
    ]);
    if (brandSnap.exists()) document.getElementById('welcomeBrandName').textContent = brandSnap.val();
    const dineSettings = dineSettingsSnap.val() || {};
    M.taxPercent = typeof dineSettings.taxPercent === 'number' ? dineSettings.taxPercent : 5;

    const bgSnap = await get(outletRef('settings/customerMenuBgImage'));
    if (bgSnap.exists() && bgSnap.val()) {
        const welcomeEl = document.getElementById('screenWelcome');
        const img = new Image();
        img.onload = () => {
            welcomeEl.style.backgroundImage = `url('${bgSnap.val()}')`;
            welcomeEl.classList.add('has-photo');
        };
        img.src = bgSnap.val();
    }

    // Show greeting if session already has customer name (returning customer)
    UI.updateGreeting(Session.session?.customerName || '');

    await loadMenu();

    window.addEventListener('session:updated', (e) => onSessionUpdated(e.detail));
    window.addEventListener('cart:changed', onCartChanged);

    document.getElementById('loadingOverlay').style.display = 'none';

    // If a session already exists with an active order, jump straight to
    // tracking instead of showing the welcome screen again.
    if (Session.session && (Session.session.orders || []).length > 0 && Session.session.status !== 'closed') {
        const lastOrderId = Session.session.orders[Session.session.orders.length - 1];
        watchOrder(lastOrderId);
        UI.showScreen('screenTracking');
    } else {
        UI.showScreen('screenWelcome');
    }
}

function onSessionUpdated(session) {
    UI.updateRunningBillStrip(session);
    UI.updateSessionNoteInCart(session);
    UI.updateGreeting(session?.customerName || '');
    // Keep local orders cache fresh for the bill summary
    (session.orders || []).forEach(oid => {
        if (!M.ordersCache[oid]) {
            onValue(outletRef(`orders/${oid}`), (snap) => {
                M.ordersCache[oid] = snap.val();
                UI.renderSessionBillCard(session, M.ordersCache);
            }, { onlyOnce: true });
        }
    });
    UI.renderSessionBillCard(session, M.ordersCache);
}

function onCartChanged() {
    UI.updateCartBadges(lineCount());
    UI.updateCartBar(lineCount(), cartSubtotal());
    if (document.getElementById('screenCart').classList.contains('active')) renderCartScreen();
}

// ---------------------------------------------------------------
// MENU
// ---------------------------------------------------------------
async function loadMenu() {
    const [catSnap, dishSnap] = await Promise.all([get(outletRef('categories')), get(outletRef('dishes'))]);
    M.categories = Object.entries(catSnap.val() || {}).map(([id, c]) => ({ id, ...c }));
    M.dishes = Object.entries(dishSnap.val() || {}).filter(([, d]) => d.available !== false).map(([id, d]) => ({ id, ...d }));
    renderMenuScreen();
}

function renderMenuScreen(searchTerm) {
    UI.renderCategoryPills(M.categories, M.activeCategory, (catId) => { M.activeCategory = catId; renderMenuScreen(); });

    let dishes = M.dishes;
    if (M.activeCategory !== 'all') dishes = dishes.filter(d => d.categoryId === M.activeCategory);
    if (searchTerm) dishes = dishes.filter(d => (d.name || '').toLowerCase().includes(searchTerm.toLowerCase()));

    const activeCategoryName = M.activeCategory === 'all' ? 'Popular Items' : (M.categories.find(c => c.id === M.activeCategory)?.name || 'Items');
    UI.renderDishList(dishes, { searchTerm, activeCategoryName }, openCustomize);
}

document.getElementById('dishSearchInput')?.addEventListener('input', (e) => renderMenuScreen(e.target.value.trim()));

// ---------------------------------------------------------------
// CUSTOMIZATION
// ---------------------------------------------------------------
function openCustomize(dishId) {
    const dish = M.dishes.find(d => d.id === dishId);
    if (!dish) return;
    M.draftDish = dish;
    M.draftSize = (dish.sizes && dish.sizes[0]) || { label: 'Regular', price: dish.price };
    M.draftAddons = [];
    M.draftQty = 1;

    document.getElementById('customHeroImg').src = dish.image || '';
    document.getElementById('customDishName').textContent = dish.name;
    document.getElementById('draftQtyVal').textContent = '1';
    renderCustomizeSections();
    document.getElementById('specialInstructions').value = '';
    UI.showScreen('screenCustomize');
}

function renderCustomizeSections() {
    const dish = M.draftDish;
    const sizes = dish.sizes && dish.sizes.length ? dish.sizes : [{ label: 'Regular', price: dish.price }];
    UI.renderSizeOptions(sizes, M.draftSize.label, (idx) => { haptic(12); M.draftSize = sizes[idx]; renderCustomizeSections(); updateCustomizePrice(); });
    UI.renderAddonRows(dish.addons || [], M.draftAddons, (idx) => {
        haptic(12);
        const pos = M.draftAddons.indexOf(idx);
        if (pos >= 0) M.draftAddons.splice(pos, 1); else M.draftAddons.push(idx);
        renderCustomizeSections();
        updateCustomizePrice();
    });
    updateCustomizePrice();
}

function draftUnitPrice() {
    const addonsTotal = M.draftAddons.reduce((sum, idx) => sum + (M.draftDish.addons[idx]?.price || 0), 0);
    return M.draftSize.price + addonsTotal;
}
function updateCustomizePrice() {
    const unit = draftUnitPrice();
    document.getElementById('customBasePrice').textContent = UI.fmtMoney(unit);
    document.getElementById('addToOrderLabel').textContent = `ADD TO ORDER ${UI.fmtMoney(unit * M.draftQty)}`;
}

document.getElementById('btnDraftQtyMinus')?.addEventListener('click', () => { haptic(10); M.draftQty = Math.max(1, M.draftQty - 1); document.getElementById('draftQtyVal').textContent = String(M.draftQty); updateCustomizePrice(); });
document.getElementById('btnDraftQtyPlus')?.addEventListener('click', () => { haptic(10); M.draftQty += 1; document.getElementById('draftQtyVal').textContent = String(M.draftQty); updateCustomizePrice(); });

document.getElementById('btnAddToOrder')?.addEventListener('click', () => {
    haptic([15, 40, 15]);
    const addonNames = M.draftAddons.map(i => M.draftDish.addons[i]?.name).filter(Boolean);
    addLine({
        dishId: M.draftDish.id, name: M.draftDish.name, img: M.draftDish.image,
        size: M.draftSize.label, addons: addonNames,
        instructions: document.getElementById('specialInstructions').value.trim(),
        qty: M.draftQty, unitPrice: draftUnitPrice()
    });
    UI.showToast(`${M.draftDish.name} added to cart`);
    UI.showScreen('screenMenu');
});

// ---------------------------------------------------------------
// CART / CHECKOUT
// ---------------------------------------------------------------
function renderCartScreen() {
    UI.renderCartList(Cart.lines, { onStep: (id, delta) => { haptic(10); setQty(id, (Cart.lines[id]?.qty || 0) + delta); } });
    UI.updateCartTotals(cartSubtotal(), M.taxPercent);
    UI.updateSessionNoteInCart(Session.session);
    UI.updateCheckoutFields(Session.session);
}

['btnOpenCartFromMenu', 'btnOpenCartFromCustomize', 'btnViewCartBar'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', () => { renderCartScreen(); UI.showScreen('screenCart'); });
});
document.getElementById('btnBackFromCart')?.addEventListener('click', () => UI.showScreen('screenMenu'));
document.getElementById('btnBackFromCustomize')?.addEventListener('click', () => UI.showScreen('screenMenu'));

document.getElementById('btnPlaceOrder')?.addEventListener('click', async () => {
    if (cartIsEmpty()) { UI.showToast('Your cart is empty'); return; }
    haptic([20, 50, 20]);

    const nameEl = document.getElementById('checkoutName');
    const phoneEl = document.getElementById('checkoutPhone');
    const name = nameEl?.value?.trim();
    const phone = phoneEl?.value?.trim();

    // If session already has details, use those (fields hidden). Otherwise validate.
    const sessionName = Session.session?.customerName?.trim();
    const finalName = sessionName || name;
    const finalPhone = (Session.session?.customerPhone?.trim()) || phone;

    if (!finalName) { UI.showToast('Please enter your name'); nameEl?.focus(); return; }
    if (!finalPhone) { UI.showToast('Please enter your mobile number'); phoneEl?.focus(); return; }

    const btn = document.getElementById('btnPlaceOrder');
    btn.disabled = true;
    btn.textContent = 'Placing order…';

    try {
        if (!sessionName) await saveCheckoutContact(finalName, finalPhone);
        UI.updateGreeting(finalName);

        const { orderId } = await placeOrder({ taxPercent: M.taxPercent, customerName: finalName, customerPhone: finalPhone });
        watchOrder(orderId);
        UI.showScreen('screenTracking');
    } catch (e) {
        console.error('[PlaceOrder]', e);
        UI.showToast('Could not place order. Please try again.');
    } finally {
        btn.disabled = false;
        btn.textContent = 'PLACE ORDER';
    }
});

document.getElementById('btnEditCheckoutDetails')?.addEventListener('click', () => {
    const fieldsWrap = document.getElementById('checkoutFieldsWrap');
    const knownWrap = document.getElementById('checkoutDetailsKnown');
    if (fieldsWrap && knownWrap) {
        knownWrap.classList.add('hidden');
        fieldsWrap.classList.remove('hidden');
    }
});

// ---------------------------------------------------------------
// ORDER TRACKING
// ---------------------------------------------------------------
function watchOrder(orderId) {
    if (M._orderUnsub) M._orderUnsub();
    M.currentOrderId = orderId;
    let prevStatus = null;
    M._orderUnsub = onValue(outletRef(`orders/${orderId}`), (snap) => {
        const order = snap.val();
        if (!order) return;
        UI.renderTracking(orderId, order, Session.table.number);
        if (prevStatus && prevStatus !== order.status) {
            UI.statusChangeNotification(order.status, orderId);
        }
        prevStatus = order.status;
    });
}

document.getElementById('btnMenuFromTracking')?.addEventListener('click', () => UI.showScreen('screenMenu'));
document.getElementById('btnOrderMore')?.addEventListener('click', () => UI.showScreen('screenMenu'));
document.getElementById('btnGotoCallWaiter')?.addEventListener('click', () => UI.showScreen('screenWaiter'));
document.getElementById('btnStartOrdering')?.addEventListener('click', () => UI.showScreen('screenMenu'));

// ---------------------------------------------------------------
// CALL WAITER
// ---------------------------------------------------------------
document.getElementById('btnBackFromWaiter')?.addEventListener('click', () => UI.showScreen('screenTracking'));
document.querySelectorAll('[data-request]').forEach(btn => {
    btn.addEventListener('click', async () => {
        haptic(15);
        const type = btn.dataset.request;
        const labels = { waiter: 'Waiter called', water: 'Water requested', bill: 'Bill requested', clean: 'Table cleaning requested' };
        try {
            if (type === 'bill') {
                await requestBill();
            } else {
                const { push, set } = await import('./firebase.js');
                await set(push(outletRef('tableRequests')), {
                    tableId: Session.tableId, tableNumber: Session.table.number,
                    type, status: 'pending', createdAt: Date.now()
                });
            }
            UI.showToast(labels[type] || 'Request sent');
        } catch (e) {
            UI.showToast('Could not send request. Please try again.');
        }
    });
});

// Boot
boot();
