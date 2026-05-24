import { useState, useMemo, useCallback } from "react";
import { Plus, Minus, Trash2, ShoppingCart, User } from "lucide-react";
import GlassCard from "../components/GlassCard";
import SearchInput from "../components/SearchInput";
import BtnPrimary from "../components/BtnPrimary";
import Modal from "../components/Modal";
import { useRealtimeData } from "../hooks/useRealtimeData";
import { Outlet, push, update, get as fbGet, serverTimestamp } from "../firebase";
import { ORANGE } from "../utils/constants";
import { fmt } from "../utils/formatters";

const MOCK_MENU = [
  { id:"d1", name:"Butter Chicken",  category:"North Indian", price:280,  sizes:[{s:"Half",p:180},{s:"Full",p:280}], addons:[{n:"Extra Gravy",p:30}], stock:50 },
  { id:"d3", name:"Dal Makhani",     category:"North Indian", price:180,  sizes:[{s:"Half",p:120},{s:"Full",p:180}], addons:[], stock:40 },
  { id:"d4", name:"Chicken Biryani", category:"Biryani",      price:320,  sizes:[{s:"Regular",p:260},{s:"Large",p:320}], addons:[{n:"Raita",p:20}], stock:35 },
];

const POS = ({ showToast }) => {
  const { data: fbMenu } = useRealtimeData("dishes");
  const { data: fbCats } = useRealtimeData("categories");

  const menuItems = fbMenu || MOCK_MENU;
  const categories = useMemo(() => {
    if (fbCats && fbCats.length > 0) return fbCats.map(c => c.name);
    return [...new Set(MOCK_MENU.map(d => d.category))];
  }, [fbCats]);

  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [customer, setCustomer] = useState({ name:"Walk-in Customer", phone:"", type:"dinein" });
  const [showCustomer, setShowCustomer] = useState(false);
  const [paymentMode, setPaymentMode] = useState("cash");
  const [showModal, setShowModal] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const filtered = useMemo(() =>
    menuItems.filter(d => (category === "all" || d.category === category) && d.name?.toLowerCase().includes(search.toLowerCase())),
  [menuItems, search, category]);

  const addToCart = useCallback((item, size, addons = []) => {
    setCart(prev => {
      const key = item.id + "|" + size.s + "|" + addons.map(a => a.n).sort().join(",");
      const existing = prev.findIndex(c => c.key === key);
      if (existing >= 0) {
        const next = [...prev];
        next[existing] = { ...next[existing], qty: next[existing].qty + 1 };
        return next;
      }
      return [...prev, { key, id: item.id, name: item.name, size: size.s, price: size.p, addons, qty: 1 }];
    });
  }, []);

  const updateQty = (key, delta) => {
    setCart(prev => prev.map(c => c.key === key ? { ...c, qty: Math.max(1, c.qty + delta) } : c));
  };

  const removeItem = (key) => setCart(prev => prev.filter(c => c.key !== key));

  const subtotal = useMemo(() => cart.reduce((s, c) => s + (c.price + c.addons.reduce((a, ad) => a + ad.p, 0)) * c.qty, 0), [cart]);
  const tax = subtotal * 0.05;
  const total = subtotal + tax;
  const discount = 0;
  const grandTotal = total - discount;

  const placeOrder = useCallback(async () => {
    if (cart.length === 0) { showToast("Cart is empty!"); return; }
    setSubmitting(true);
    try {
      const [dishesSnap, catsSnap] = await Promise.all([
        fbGet(Outlet("dishes")),
        fbGet(Outlet("categories"))
      ]);
      const freshDishes = dishesSnap.val() || {};
      const freshCats = catsSnap.val() || {};
      let validatedTotal = 0;
      for (const item of cart) {
        const dish = freshDishes[item.id];
        if (!dish) throw new Error(item.name + " is no longer available.");
        let base = 0;
        if (dish.sizes && dish.sizes[item.size]) base = Number(dish.sizes[item.size]);
        else base = Number(dish.price || 0);
        let addonTotal = 0;
        if (item.addons.length > 0) {
          const cat = Object.values(freshCats).find(c => c.name === dish.category);
          for (const ad of item.addons) {
            if (cat?.addons?.[ad.n] !== undefined) addonTotal += Number(cat.addons[ad.n]);
            else addonTotal += ad.p;
          }
        }
        validatedTotal += (base + addonTotal) * item.qty;
      }

      const orderData = {
        items: cart.map(c => ({ id:c.id, name:c.name, size:c.size, price:c.price, addons:c.addons, qty:c.qty })),
        subtotal, tax, discount, total: grandTotal,
        paymentMethod: paymentMode,
        customerName: customer.name,
        phone: customer.phone || "Walk-in",
        type: customer.type,
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: Date.now()
      };
      await push(Outlet("orders"), orderData);

      for (const item of cart) {
        const dish = freshDishes[item.id];
        if (dish && dish.stock !== undefined) {
          const newStock = Math.max(0, Number(dish.stock) - item.qty);
          await update(Outlet("dishes/" + item.id), { stock: newStock });
        }
      }

      showToast("Order placed! Total: " + fmt(grandTotal));
      setCart([]);
    } catch (e) {
      showToast("Order failed: " + e.message, "error");
    } finally {
      setSubmitting(false);
    }
  }, [cart, paymentMode, customer, subtotal, tax, grandTotal, showToast]);

  return (
    <div className="flex gap-4 h-full" style={{ minHeight: "calc(100vh - 120px)" }}>
      <div className="flex-1 space-y-3 overflow-y-auto pr-2">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setCategory("all")}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
            style={category === "all" ? { backgroundColor: ORANGE, color:"#fff" } : { backgroundColor:"#f1f5f9", color:"#475569" }}>
            All
          </button>
          {categories.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
              style={category === c ? { backgroundColor: ORANGE, color:"#fff" } : { backgroundColor:"#f1f5f9", color:"#475569" }}>
              {c}
            </button>
          ))}
        </div>
        <SearchInput placeholder="Search menu items..." value={search} onChange={setSearch} />
        <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
          {filtered.map(item => (
            <GlassCard key={item.id} className="p-3 cursor-pointer hover:shadow-md transition-all"
              onClick={() => {
                const sz = item.sizes ? (Array.isArray(item.sizes) ? item.sizes : Object.entries(item.sizes).map(([k,v]) => ({s:k, p:v}))) : [{s:"Regular", p:item.price}];
                if (sz.length === 1) { addToCart(item, sz[0]); return; }
                setShowModal({ item, sizes: sz, selectedSize: sz[0], selectedAddons: [] });
              }}>
              <div className="font-bold text-slate-800 text-sm mb-1">{item.name}</div>
              <div className="text-xs text-slate-500 mb-1">from {fmt(item.sizes ? (Array.isArray(item.sizes) ? item.sizes[0]?.p : Object.values(item.sizes)[0]) : item.price)}</div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">{item.stock !== undefined ? "Stock: " + item.stock : ""}</span>
                <button onClick={e => { e.stopPropagation(); const sz = item.sizes ? (Array.isArray(item.sizes) ? item.sizes[0] : {s: Object.keys(item.sizes)[0], p: Object.values(item.sizes)[0]}) : {s:"Regular", p:item.price}; addToCart(item, sz); }}
                  className="p-1.5 rounded-lg text-white" style={{ backgroundColor: ORANGE }}>
                  <Plus size={12} />
                </button>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
      <GlassCard className="w-80 p-4 flex flex-col" style={{ minWidth: 280 }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShoppingCart size={16} style={{ color: ORANGE }} />
            <span className="font-bold text-slate-800 text-sm">Cart ({cart.length})</span>
          </div>
          <button onClick={() => setShowCustomer(true)} className="text-xs flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 text-slate-600">
            <User size={12} /> {customer.name}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-2 mb-3" style={{ maxHeight: "calc(100vh - 400px)" }}>
          {cart.map(c => (
            <div key={c.key} className="p-2 rounded-xl bg-slate-50">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-800">{c.name}</span>
                <button onClick={() => removeItem(c.key)} className="text-red-400"><Trash2 size={12} /></button>
              </div>
              <div className="text-[10px] text-slate-500 mb-1">{c.size}{c.addons.length > 0 ? ` + ${c.addons.map(a => a.n).join(", ")}` : ""}</div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button onClick={() => updateQty(c.key, -1)}
                    className="w-5 h-5 rounded flex items-center justify-center text-xs bg-slate-200 text-slate-600"><Minus size={10} /></button>
                  <span className="text-xs font-bold w-5 text-center">{c.qty}</span>
                  <button onClick={() => updateQty(c.key, 1)}
                    className="w-5 h-5 rounded flex items-center justify-center text-xs text-white" style={{ backgroundColor: ORANGE }}><Plus size={10} /></button>
                </div>
                <span className="text-xs font-bold" style={{ color: ORANGE }}>{fmt((c.price + c.addons.reduce((a, ad) => a + ad.p, 0)) * c.qty)}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-100 pt-3 space-y-2">
          <div className="flex justify-between text-xs text-slate-500"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
          <div className="flex justify-between text-xs text-slate-500"><span>Tax (5%)</span><span>{fmt(tax)}</span></div>
          <div className="flex justify-between font-bold text-slate-800"><span>Total</span><span style={{ color: ORANGE }}>{fmt(grandTotal)}</span></div>
          <select value={paymentMode} onChange={e => setPaymentMode(e.target.value)}
            className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none">
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="upi">UPI</option>
          </select>
          <button onClick={placeOrder} disabled={submitting}
            className="w-full py-2 rounded-xl text-xs font-bold text-white disabled:opacity-50"
            style={{ backgroundColor: ORANGE }}>
            {submitting ? "Processing..." : "Place Order"}
          </button>
        </div>
      </GlassCard>
      {showModal && <ItemSelectorModal item={showModal.item} sizes={showModal.sizes} onAdd={(size, addons) => { addToCart(showModal.item, size, addons); setShowModal(null); }}
        onClose={() => setShowModal(null)} />}
      {showCustomer && <Modal title="Customer Info" onClose={() => setShowCustomer(false)}>
        <div className="space-y-3">
          <input placeholder="Customer name" value={customer.name}
            onChange={e => setCustomer(p => ({ ...p, name: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none" />
          <input placeholder="Phone (optional)" value={customer.phone}
            onChange={e => setCustomer(p => ({ ...p, phone: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none" />
          <select value={customer.type} onChange={e => setCustomer(p => ({ ...p, type: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none">
            <option value="dinein">Dine In</option>
            <option value="takeaway">Takeaway</option>
            <option value="delivery">Delivery</option>
          </select>
          <button onClick={() => setShowCustomer(false)} className="w-full py-2.5 rounded-xl text-sm font-bold text-white"
            style={{ backgroundColor: ORANGE }}>Done</button>
        </div>
      </Modal>}
    </div>
  );
};

const ItemSelectorModal = ({ item, sizes, onAdd, onClose }) => {
  const [size, setSize] = useState(sizes[0]);
  const [addons, setAddons] = useState([]);
  const itemAddons = item.addons ? (Array.isArray(item.addons) ? item.addons : Object.entries(item.addons).map(([k,v]) => ({n:k, p:v}))) : [];

  return (
    <Modal title={item.name} onClose={onClose}>
      <div className="space-y-3">
        <div>
          <div className="text-xs font-semibold text-slate-500 mb-2">Select Size</div>
          <div className="flex flex-wrap gap-2">
            {sizes.map(s => (
              <button key={s.s} onClick={() => setSize(s)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                style={size.s === s.s ? { backgroundColor: ORANGE, color:"#fff" } : { backgroundColor:"#f1f5f9", color:"#475569" }}>
                {s.s} — {fmt(s.p)}
              </button>
            ))}
          </div>
        </div>
        {itemAddons.length > 0 && <div>
          <div className="text-xs font-semibold text-slate-500 mb-2">Add-ons</div>
          <div className="flex flex-wrap gap-2">
            {itemAddons.map(ad => {
              const sel = addons.find(a => a.n === ad.n);
              return (
                <button key={ad.n} onClick={() => setAddons(prev => sel ? prev.filter(a => a.n !== ad.n) : [...prev, ad])}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                  style={sel ? { backgroundColor: ORANGE, color:"#fff" } : { backgroundColor:"#f1f5f9", color:"#475569" }}>
                  {ad.n} +{fmt(ad.p)}
                </button>
              );
            })}
          </div>
        </div>}
        <button onClick={() => onAdd(size, addons)}
          className="w-full py-2.5 rounded-xl text-sm font-bold text-white"
          style={{ backgroundColor: ORANGE }}>
          Add to Cart — {fmt(size.p + addons.reduce((s, a) => s + a.p, 0))}
        </button>
      </div>
    </Modal>
  );
};

export default POS;
