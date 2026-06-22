import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Search, Menu, ShoppingCart, Plus, Trash2, Minus, WifiOff } from "lucide-react";
import { get, update, set, onValue, off, runTransaction, logAudit, getCurrentAdminActor, isConnected, onConnectionChange, Outlet, getBizId, getOutletId } from "../firebase";
import { fmt, esc } from "../utils";
import { GlassCard, BtnPrimary, Modal, SkeletonGrid, Input, Select, SectionLabel } from "../components";
import { ORANGE } from "../constants";
import "../App.css";

function POSPage({ showToast, outletInfo }) {
  const [dishes, setDishes] = useState([]);
  const [cats, setCats] = useState([]);
  const [catFilter, setCatFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState({});
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [discount, setDiscount] = useState(0);
  const [discFlat, setDiscFlat] = useState(0);
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(null);
  const [tableNo, setTableNo] = useState("");
  const [payMethod, setPayMethod] = useState("Cash");
  const [orderType, setOrderType] = useState("Dine-in");
  const [orderNotes, setOrderNotes] = useState("");
  const [selModal, setSelModal] = useState(null);
  const [selSize, setSelSize] = useState("");
  const [selAddons, setSelAddons] = useState({});
  const [selQty, setSelQty] = useState(1);
  const [editKey, setEditKey] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [posDiscounts, setPosDiscounts] = useState(null);
  const [posAllOrders, setPosAllOrders] = useState([]);
  const [posLoaded, setPosLoaded] = useState(false);
  const [posOffline, setPosOffline] = useState(false);
  const [deliverySettings, setDeliverySettings] = useState(null);
  const [deliveryDist, setDeliveryDist] = useState("");
  const [deliveryFee, setDeliveryFee] = useState(0);

  useEffect(() => {
    const r = Outlet("dishes"); const r2 = Outlet("categories"); const r3 = Outlet("discounts"); const r4 = Outlet("orders");
    if (!r||!r2) return;
    if (!isConnected()) { setPosOffline(true); return; }
    const u1 = onValue(r, snap => { const v=snap.val(); setDishes(v?Object.keys(v).map(k=>({id:k,...v[k]})):[]); setPosLoaded(true); });
    const u2 = onValue(r2, snap => { const v=snap.val(); setCats(v?Object.keys(v).map(k=>({id:k,...v[k]})):[]); });
    const u3 = r3 ? onValue(r3, snap => setPosDiscounts(snap.val() || {})) : null;
    const u4 = r4 ? onValue(r4, snap => { const v=snap.val(); setPosAllOrders(v?Object.keys(v).map(k=>({id:k,...v[k]})):[]); }) : null;
    return () => { off(r,"value",u1); off(r2,"value",u2); if (u3) off(r3,"value",u3); if (u4) off(r4,"value",u4); };
  }, []);

  // Load delivery settings for fee calculation
  useEffect(() => {
    const r = Outlet("settings/Delivery");
    if (!r) return;
    const u = onValue(r, snap => setDeliverySettings(snap.val() || {}));
    return () => off(r, "value", u);
  }, []);

  // Recalculate delivery fee when distance or slabs change
  useEffect(() => {
    const dist = Number(deliveryDist);
    if (orderType !== "Delivery" || !dist || dist <= 0 || !deliverySettings?.slabs) {
      setDeliveryFee(0);
      return;
    }
    const slabs = deliverySettings.slabs;
    // Find the highest slab where distance >= km threshold
    let fee = 0;
    for (const s of slabs) {
      if (dist >= Number(s.km)) fee = Number(s.fee) || 0;
    }
    setDeliveryFee(fee);
  }, [deliveryDist, deliverySettings, orderType]);

  // Auto-retry POS load on connection restore
  useEffect(() => {
    if (!posOffline) return;
    const unsub = onConnectionChange((online) => {
      if (!online) return;
      setPosOffline(false);
      setPosLoaded(false);
      const r = Outlet("dishes"); const r2 = Outlet("categories"); const r3 = Outlet("discounts"); const r4 = Outlet("orders");
      if (!r||!r2) return;
      const u1 = onValue(r, snap => { const v=snap.val(); setDishes(v?Object.keys(v).map(k=>({id:k,...v[k]})):[]); setPosLoaded(true); });
      const u2 = onValue(r2, snap => { const v=snap.val(); setCats(v?Object.keys(v).map(k=>({id:k,...v[k]})):[]); });
      const u3 = r3 ? onValue(r3, snap => setPosDiscounts(snap.val() || {})) : null;
      const u4 = r4 ? onValue(r4, snap => { const v=snap.val(); setPosAllOrders(v?Object.keys(v).map(k=>({id:k,...v[k]})):[]); }) : null;
      unsub();
    });
    return unsub;
  }, [posOffline]);

  // Reactive auto-discount evaluation on cart/customer/coupon change
  useEffect(() => {
    const hasManual = Number(discFlat) > 0 || discount > 0 || couponApplied;
    if (!posDiscounts || !cartItems.length || hasManual) { setAutoDisc(null); return; }
    const cleanPhone = custPhone ? custPhone.replace(/\D/g, "") : "";
    const hasPrevOrder = cleanPhone && cleanPhone !== "Walk-in" && posAllOrders.some(o => o.phone && o.phone.replace(/\D/g, "") === cleanPhone);
    const customer = cleanPhone && cleanPhone !== "Walk-in" ? { firstOrderDiscountUsed: hasPrevOrder } : null;
    const result = evaluateDiscounts(posDiscounts, {
      subtotal: cartItems.reduce((s,[_,i])=>s+i.price*i.qty,0), cart: cartItems,
      customer, couponCode: couponCode || null, orderType, now: Date.now(),
    });
    setAutoDisc(result);
  }, [cartItems, custPhone, couponCode, orderType, posDiscounts, discFlat, discount, couponApplied]);

  const addToCart = () => {
    if (!selModal||!selSize) return showToast("Select a size first","warning");
    const sizes = selModal.sizes||{};
    const basePrice = sizes[selSize] ?? selModal.price ?? 0;
    const addonTotal = Object.values(selAddons).reduce((a,b)=>a+Number(b),0);
    const pricePerItem = Number(basePrice) + addonTotal;
    const key = `${selModal.id}::${selSize}::${Object.keys(selAddons).sort().join("|")}`;
    setCart(prev => {
      let next = {...prev};
      if (editKey) delete next[editKey];
      if (next[key]) next[key] = {...next[key], qty: next[key].qty + selQty};
      else next[key] = { id:selModal.id, name:selModal.name, category:selModal.category, size:selSize, price:pricePerItem, qty:selQty, addons:Object.entries(selAddons).map(([n,p])=>({name:n,price:Number(p)})) };
      return next;
    });
    setEditKey(null);
    setSelModal(null);
    showToast(`${selQty}x ${selModal.name} ${editKey?"updated":"added"}`,"success");
  };

  const addToCartRef = useRef(addToCart);
  addToCartRef.current = addToCart;

  useEffect(() => {
    const handler = (e) => {
      if (!selModal) return;
      if (e.key === "Escape") { setSelModal(null); setEditKey(null); }
      if (e.key === "Enter") { e.preventDefault(); addToCartRef.current(); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [selModal]);

  const filtered = useMemo(() => {
    let list = dishes;
    if (catFilter !== "All") list = list.filter(d => d.category === catFilter);
    if (search) { const s=search.toLowerCase(); list = list.filter(d => d.name.toLowerCase().includes(s)); }
    return list;
  }, [dishes, catFilter, search]);

  const openSelection = (dish) => {
    setEditKey(null);
    setSelModal(dish);
    const sizes = dish.sizes ? Object.keys(dish.sizes) : ["Standard"];
    setSelSize(sizes[0]);
    setSelAddons({});
    setSelQty(1);
  };

  const openEditCartItem = (key, item) => {
    const dish = dishes.find(d => d.id === item.id);
    if (!dish) return showToast("Original dish no longer available","error");
    setEditKey(key);
    setSelModal(dish);
    setSelSize(item.size);
    const addonsMap = {};
    (item.addons||[]).forEach(a => { addonsMap[a.name] = a.price; });
    setSelAddons(addonsMap);
    setSelQty(item.qty);
  };

  const updateCartQty = (key, delta) => {
    setCart(prev => {
      const next = {...prev};
      if (next[key]) { next[key] = {...next[key], qty: Math.max(1, next[key].qty + delta)}; if (next[key].qty <= 0) delete next[key]; }
      return next;
    });
  };

  const removeFromCart = (key) => {
    setCart(prev => { const next = {...prev}; delete next[key]; return next; });
  };

  const clearCart = () => {
    setCart({}); setDiscount(0); setDiscFlat(0); setCouponCode(""); setCouponApplied(null); setCustName(""); setCustPhone(""); setOrderNotes(""); setOrderType("Dine-in"); setTableNo("");
  };

  const [autoDisc, setAutoDisc] = useState(null);
  const cartItems = Object.entries(cart);
  const subtotal = cartItems.reduce((s,[_,i])=>s+i.price*i.qty,0);
  const manualDiscVal = Number(discFlat) > 0 ? Number(discFlat) : (discount > 0 ? subtotal * discount / 100 : 0);
  const discVal = autoDisc?.amount || manualDiscVal;
  const couponDiscVal = couponApplied ? (couponApplied.type === "flat" ? couponApplied.value : Math.min(subtotal * Number(couponApplied.value) / 100, Number(couponApplied.maxCap) || Infinity)) : 0;
  const totalDisc = discVal + couponDiscVal;
  const taxVal = (subtotal - totalDisc) * 0.05;
  const total = Math.max(0, subtotal - totalDisc + taxVal + (orderType === "Delivery" ? deliveryFee : 0));

  const printReceiptHtml = useCallback((orderData, discLabel) => {
    const itemsHtml = Object.values(orderData.cart).map(i =>
      `<tr><td style="padding:4px 8px;border-bottom:1px dashed #ddd">${i.qty}x ${i.name}${i.size ? ` (${i.size})` : ""}</td><td style="padding:4px 8px;border-bottom:1px dashed #ddd;text-align:right">₹${(i.price * i.qty).toLocaleString("en-IN")}</td></tr>`
    ).join("");
    const taxLine = orderData.tax > 0 ? `<tr><td style="padding:4px 8px">Tax (5%)</td><td style="padding:4px 8px;text-align:right">₹${Number(orderData.tax).toLocaleString("en-IN")}</td></tr>` : "";
    const discLine = orderData.discount > 0 ? `<tr><td style="padding:4px 8px">Discount${discLabel ? ` (${discLabel})` : ""}</td><td style="padding:4px 8px;text-align:right;color:#ef4444">-₹${Number(orderData.discount).toLocaleString("en-IN")}</td></tr>` : "";
    const tableLine = orderData.tableNo ? `<div style="text-align:center;font-size:11px;color:#64748b;margin-bottom:4px">Table ${orderData.tableNo}</div>` : "";
    const storeLine = outletInfo?.name ? `<h2>${esc(outletInfo.name)}</h2>` : `<h2>FoodHubbie</h2>`;
    const addrLine = outletInfo?.address ? `<div class="addr">${esc(outletInfo.address)}</div>` : "";
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Receipt</title><style>body{font-family:monospace;font-size:12px;width:280px;margin:0 auto;padding:16px;color:#1e293b}h2{font-size:16px;text-align:center;margin:0 0 4px}.addr{font-size:10px;text-align:center;color:#64748b;margin-bottom:12px}hr{border:none;border-top:1px dashed #94a3b8;margin:8px 0}table{width:100%;border-collapse:collapse}.total td{padding:6px 8px;font-weight:700;font-size:14px}.footer{text-align:center;font-size:10px;color:#94a3b8;margin-top:12px}</style></head><body>
      ${storeLine}${addrLine}
      <div style="text-align:center;font-size:11px;color:#64748b;margin-bottom:2px">#${orderData.orderId}</div>
      ${tableLine}
      <div style="text-align:center;font-size:11px;color:#64748b;margin-bottom:8px">${esc(orderData.customerName)}${orderData.phone !== "Walk-in" ? ` · ${orderData.phone}` : ""}</div>
      <hr>${itemsHtml}<hr>
      <tr><td style="padding:4px 8px">Subtotal</td><td style="padding:4px 8px;text-align:right">₹${Number(orderData.subtotal).toLocaleString("en-IN")}</td></tr>
      ${discLine}${taxLine}
      <tr class="total"><td style="padding:6px 8px">TOTAL</td><td style="padding:6px 8px;text-align:right;font-size:16px">₹${Number(orderData.total).toLocaleString("en-IN")}</td></tr>
      <hr><div style="text-align:center;font-size:11px;color:#64748b">${orderData.paymentMethod} · ${orderData.paymentStatus}</div>
      <div class="footer">Thank you for your order!</div></body></html>`;
  }, [outletInfo]);

  const printReceipt = useCallback((html) => {
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:0";
    document.body.appendChild(iframe);
    const iframeDoc = iframe.contentWindow.document;
    iframeDoc.open(); iframeDoc.write(html); iframeDoc.close();
    setTimeout(() => {
      try { iframe.contentWindow.focus(); iframe.contentWindow.print(); } catch (_) {}
      setTimeout(() => document.body.removeChild(iframe), 1000);
    }, 300);
  }, []);

  const handleCheckout = async () => {
    if (cartItems.length === 0) return showToast("Cart is empty","error");
    if (custPhone && !/^[0-9]{10}$/.test(custPhone.replace(/\D/g, ""))) {
      return showToast("Valid phone required (10 digits)","error");
    }
    if (!getOutletId()) return showToast("Outlet not configured - refresh or re-login","error");
    setLoading(true);
    try {
      const [dishesSnap, catsSnap, discountsSnap, ordersSnap] = await Promise.all([
        get(Outlet("dishes")),
        get(Outlet("categories")),
        get(Outlet("discounts")),
        get(Outlet("orders"))
      ]);
      const freshDishes = dishesSnap.val() || {};
      const freshCats = catsSnap.val() || {};
      const discounts = discountsSnap.val() || {};
      const allOrders = ordersSnap.val() || {};

      for (const [key, item] of cartItems) {
        const dish = freshDishes[item.id];
        if (!dish) throw new Error(item.name + " no longer available");
        const availStock = Number(dish.stock) || 0;
        if (availStock < item.qty) throw new Error(`${item.name}: only ${availStock} in stock, you ordered ${item.qty}`);
        const sizes = dish.sizes || {};
        const basePrice = Number(sizes[item.size] ?? dish.price ?? 0);
        const cat = freshCats[dish.category] || {};
        const catAddons = cat.addons || {};
        const dishAddons = dish.addons || {};
        let addonTotal = 0;
        for (const a of (item.addons || [])) {
          const serverPrice = Number(catAddons[a.name] ?? dishAddons[a.name] ?? -1);
          if (serverPrice < 0) throw new Error(`${item.name}: addon "${a.name}" no longer available`);
          addonTotal += serverPrice;
        }
        const expectedPrice = basePrice + addonTotal;
        if (Math.abs(expectedPrice - Number(item.price)) > 0.01) {
          throw new Error(`${item.name} (${item.size}) price changed — expected ₹${expectedPrice.toFixed(2)}, cart shows ₹${Number(item.price).toFixed(2)}. Re-add the item.`);
        }
      }

      const cleanPhone = custPhone ? custPhone.replace(/\D/g, "") : "";

      // Resolve final discount: manual overrides auto
      const hasManualFlat = Number(discFlat) > 0;
      const hasManualPct = !hasManualFlat && discount > 0;
      let finalDiscVal, discLabel, finalDiscId, discSource;

      if (hasManualFlat) {
        finalDiscVal = Number(discFlat);
        discLabel = `Flat ₹${discFlat}`;
        finalDiscId = null; discSource = "manual:flat";
      } else if (hasManualPct) {
        finalDiscVal = subtotal * discount / 100;
        discLabel = `${discount}%`;
        finalDiscId = null; discSource = "manual:percent";
      } else {
        // Use shared evaluator
        const hasPrevOrder = cleanPhone && cleanPhone !== "Walk-in" && Object.values(allOrders).some(o => o.phone && o.phone.replace(/\D/g, "") === cleanPhone);
        const evalResult = evaluateDiscounts(discounts, {
          subtotal, cart: cartItems,
          customer: cleanPhone ? { firstOrderDiscountUsed: hasPrevOrder } : null,
          couponCode: couponCode || null, orderType, now: Date.now(),
        });

        // Also check BOGO
        let bogoVal = 0;
        const bogoDisc = Object.values(discounts).find(d => d.enabled && d.type === "bogo" && (!d.startsAt || Date.now() >= d.startsAt) && (!d.endsAt || Date.now() <= d.endsAt));
        if (bogoDisc) {
          const cheapest = cartItems.reduce((min, [, item]) => Math.min(min, item.price), Infinity);
          bogoVal = cheapest * Math.floor(cartItems.reduce((s, [, item]) => s + item.qty, 0) / 2);
        }

        const evalAmt = evalResult?.amount || 0;
        if (bogoVal > evalAmt) {
          finalDiscVal = bogoVal;
          discLabel = bogoDisc?.name || "BOGO";
          finalDiscId = bogoDisc?.id || null;
          discSource = "auto:bogo";
        } else if (evalResult) {
          finalDiscVal = evalAmt;
          discLabel = evalResult.label;
          finalDiscId = evalResult.discount?.id || null;
          discSource = evalResult.source;
        } else {
          finalDiscVal = 0;
          discLabel = "";
          finalDiscId = null;
          discSource = "none";
        }
      }

      const finalTotal = Math.max(0, subtotal - finalDiscVal + taxVal + (orderType === "Delivery" ? deliveryFee : 0));

      // Atomic order ID via runTransaction
      const today = new Date();
      const dateStr = `${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2,"0")}${today.getDate().toString().padStart(2,"0")}`;
      const seqRef = Outlet(`metadata/orderSequence/${dateStr}`);
      const { committed, snapshot } = await runTransaction(seqRef, (cur) => (cur || 0) + 1);
      if (!committed) throw new Error("Order ID collision — please retry");
      const orderId = `${dateStr}-${String(snapshot.val()).padStart(4, "0")}`;

      const orderData = {
        orderId, cart:Object.values(cart), subtotal, discount:finalDiscVal, tax:taxVal, total:finalTotal,
        paymentMethod:payMethod, paymentStatus:"Paid", customerName:custName||"Walk-in", phone:custPhone||"Walk-in",
        status: orderType === "Dine-in" ? "Confirmed" : "Placed", type:orderType, notes:orderNotes,
        discountId: finalDiscId, discountName: discLabel || null, discountSource: discSource || null,
        couponCode: couponCode || null, tableNo: tableNo || null, stockDeducted: true,
        outletAddress: outletInfo?.address || "", createdAt:new Date().toISOString(), outlet:getOutletId(),
        createdBy: getCurrentAdminActor()?.email || null,
        deliveryFee: orderType === "Delivery" ? deliveryFee : 0,
        deliveryDistance: orderType === "Delivery" ? Number(deliveryDist) || 0 : 0
      };

      await set(Outlet(`orders/${orderId}`), orderData);

      for (const [key, item] of cartItems) {
        const newStock = Math.max(0, (Number(freshDishes[item.id].stock) || 0) - item.qty);
        await update(Outlet(`dishes/${item.id}`), { stock: newStock });
      }

      // Auto-deduct from inventory (by dishId match, then name fallback)
      try {
        const invSnap = await get(Outlet("inventory"));
        const inventory = invSnap.val() || {};
        for (const [, item] of cartItems) {
          const itemName = (item.name || "").toLowerCase();
          let invEntry = Object.entries(inventory).find(([, data]) => data.dishId === item.id);
          if (!invEntry) invEntry = Object.entries(inventory).find(([, data]) => (data.name || "").toLowerCase() === itemName);
          if (invEntry) {
            const [invId, invData] = invEntry;
            const prevStock = Number(invData.stock) || 0;
            const nextStock = Math.max(0, prevStock - (item.qty || 1));
            await update(Outlet(`inventory/${invId}`), { stock: nextStock });
            if (!invData.dishId && item.id) {
              await update(Outlet(`inventory/${invId}`), { dishId: item.id });
            }
          }
        }
      } catch (e) { console.warn("[Inventory] Auto-deduct error:", e); }

      if (finalDiscId && finalDiscVal > 0) {
        const usageRef = Outlet(`discountsUsage/${orderId}`);
        await set(usageRef, { discountId: finalDiscId, discountLabel: discLabel, orderId, customerPhone: custPhone || "Walk-in", customerName: custName || "", amountGiven: Math.round(finalDiscVal), channel: "pos", source: discSource || "", appliedAt: Date.now() });
        try {
          await runTransaction(Outlet(`discounts/${finalDiscId}/stats`), (cur) => {
            cur = cur || {};
            return { usedCount: (cur.usedCount || 0) + 1, totalDiscountGiven: (cur.totalDiscountGiven || 0) + Math.round(finalDiscVal), lastUsedAt: Date.now() };
          });
        } catch (_) {}
      }

      // Customer LTV tracking
      if (cleanPhone && cleanPhone !== "Walk-in") {
        try {
          const custRef = Outlet(`customers/${cleanPhone}`);
          await runTransaction(custRef, (cur) => {
            const data = cur || { phone: cleanPhone, orderCount: 0, totalSpent: 0, firstOrder: cleanPhone };
            return { ...data, name: custName || data.name || "", phone: cleanPhone, orderCount: (data.orderCount || 0) + 1, totalSpent: (data.totalSpent || 0) + finalTotal, lastSeen: new Date().toISOString(), lastOrderId: orderId, lastOrderTotal: finalTotal };
          });
        } catch (_) {}
      }

      logAudit(getBizId(), getOutletId(), "pos_checkout", {
        orderId, total: finalTotal, paymentMethod: payMethod, type: orderType, autoDisc: discLabel,
        items: Object.values(cart).map(i => ({ id: i.id, name: i.name, size: i.size, qty: i.qty, price: i.price }))
      }, getCurrentAdminActor());

      showToast(`Sale #${orderId} completed!${discLabel ? ` (${discLabel})` : ""}`,"success");
      printReceipt(printReceiptHtml(orderData, discLabel));
      clearCart();
      setAutoDisc(null);
      setCouponApplied(null);
    } catch(e) { showToast("Checkout failed: "+e.message,"error"); }
    finally { setLoading(false); }
  };

  const catAddons = selModal ? (cats.find(c=>c.name===selModal.category)?.addons||{}) : {};

  if (posOffline) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"calc(100vh - 140px)", gap:16, color:"#64748b" }}>
      <div style={{ width:64, height:64, borderRadius:16, background:"#f1f5f9", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <WifiOff size={28} color="#94a3b8" />
      </div>
      <div style={{ fontSize:16, fontWeight:700, color:"#0f172a" }}>Waiting for connection</div>
      <div style={{ fontSize:13, textAlign:"center", maxWidth:300 }}>The POS menu will load automatically when the connection is restored.</div>
      <button type="button" onClick={() => { setPosOffline(false); setPosLoaded(false); window.location.reload(); }} style={{ padding:"10px 24px", borderRadius:10, background:ORANGE, color:"white", border:"none", cursor:"pointer", fontSize:13, fontWeight:600, marginTop:8 }}>Retry Now</button>
    </div>
  );

  if (!posLoaded) return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 360px", gap:16, height:"calc(100vh - 140px)" }}>
      <SkeletonGrid cards={8} />
      <div />
    </div>
  );

  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 360px", gap:16, height:"calc(100vh - 140px)" }}>
      {/* Left: Menu Grid */}
      <div style={{ display:"flex", flexDirection:"column", overflow:"hidden", minHeight:0 }}>
        <div className="flex gap-2 mb-3" style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap" }}>
          <div style={{ position:"relative", flex:1, minWidth:150 }}>
            <Search size={14} style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"#94a3b8" }} />
            <input placeholder="Search dishes..." value={search} onChange={e=>setSearch(e.target.value)} style={{ padding:"8px 10px 8px 32px", borderRadius:10, border:"1.5px solid #e2e8f0", fontSize:13, width:"100%", background:"#f8fafc", outline:"none" }} />
          </div>
        </div>
        <div className="flex gap-2 mb-3" style={{ display:"flex", gap:6, marginBottom:12, flexWrap:"wrap", overflowX:"auto" }}>
          {["All", ...new Set(cats.map(c=>c.name))].map(c => (
            <div key={c} onClick={()=>setCatFilter(c)} style={{ padding:"5px 14px", borderRadius:8, cursor:"pointer", fontSize:12, fontWeight:600, whiteSpace:"nowrap", color:catFilter===c?"white":"#64748b", background:catFilter===c?ORANGE:"#f1f5f9" }}>{c}</div>
          ))}
        </div>
        <div style={{ flex:1, overflow:"auto", display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(140px,1fr))", gap:12, alignContent:"start", minHeight:0 }}>
           {filtered.map(d => {
              const price = d.sizes ? Object.values(d.sizes)[0] : (d.price||0);
              const isOos = (d.stock||0) === 0;
              const isLow = !isOos && d.stock <= (d.threshold || 5);
              return <div key={d.id} onClick={()=>!isOos && openSelection(d)} style={{ background:"white", borderRadius:12, cursor:isOos?"not-allowed":"pointer", border:"1px solid #f1f5f9", transition:"transform 0.15s", display:"flex", flexDirection:"column", minHeight:260, position:"relative", opacity:isOos?0.5:1 }}>
                {isOos && <div style={{ position:"absolute", inset:0, zIndex:5, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(255,255,255,0.3)", borderRadius:12 }}><div style={{ padding:"4px 12px", borderRadius:6, background:"rgba(100,116,139,0.85)", color:"white", fontSize:11, fontWeight:700, letterSpacing:0.5 }}>Currently Unavailable</div></div>}
                {isLow && <div style={{ position:"absolute", top:8, right:8, padding:"2px 8px", borderRadius:6, fontSize:9, fontWeight:700, background:"rgba(251,146,60,0.9)", color:"white", zIndex:10 }}>⚠ {d.stock}</div>}
                <img src={d.image||"https://placehold.co/300/fff7ed/ccc?text=🍽️"} alt="" style={{ width:"100%", height:160, objectFit:"cover", flexShrink:0 }} />
                <div style={{ flex:1, padding:"14px 14px 18px", minHeight:90, display:"flex", flexDirection:"column", justifyContent:"center" }}>
                  <div style={{ fontSize:14, fontWeight:600, color:"#0f172a", lineHeight:1.4, wordBreak:"break-word" }}>{d.name||"(no name)"}</div>
                  <div style={{ fontSize:13, color:ORANGE, fontWeight:700, marginTop:4 }}>₹{price}</div>
                </div>
              </div>;
            })}
        </div>
      </div>

      {/* Right: Cart */}
      <GlassCard style={{ display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <div style={{ padding:12, borderBottom:"1px solid #f1f5f9" }}>
          <div style={{ fontSize:14, fontWeight:700, color:"#0f172a", marginBottom:8 }}>Walk-in Cart ({cartItems.length})</div>
          <Input placeholder="Customer phone" value={custPhone} onChange={e=>setCustPhone(e.target.value)} style={{ marginBottom:6, fontSize:12, padding:"6px 10px" }} />
          <Input placeholder="Customer name" value={custName} onChange={e=>setCustName(e.target.value)} style={{ fontSize:12, padding:"6px 10px", marginBottom:4 }} />
          <Input placeholder="Table number (optional)" value={tableNo} onChange={e=>setTableNo(e.target.value)} style={{ fontSize:12, padding:"6px 10px", marginBottom:8 }} />
          <div style={{ fontSize:12, fontWeight:600, color:"#64748b", marginBottom:6 }}>Order Type</div>
          <div style={{ display:"flex", gap:8, marginBottom:12 }}>
            {["Dine-in", "Takeaway", "Delivery"].map(t => (
              <div key={t} onClick={()=>setOrderType(t)} style={{ flex:1, padding:"8px 0", borderRadius:8, textAlign:"center", fontSize:12, fontWeight:600, cursor:"pointer", color:orderType===t?"white":"#64748b", background:orderType===t?ORANGE:"#f1f5f9" }}>{t}</div>
            ))}
          </div>
          {orderType === "Delivery" && (
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:12, fontWeight:600, color:"#64748b", marginBottom:6 }}>Delivery Distance (km)</div>
              <input type="number" min="0" step="0.1" value={deliveryDist} onChange={e => setDeliveryDist(e.target.value)} placeholder="e.g. 5" style={{ width:"100%", padding:"6px 10px", borderRadius:6, border:"1px solid #e2e8f0", fontSize:12, fontFamily:"inherit", outline:"none", boxSizing:"border-box" }} />
              {deliveryFee > 0 && <div style={{ fontSize:11, color:"#64748b", marginTop:4 }}>Delivery fee: {fmt(deliveryFee)}</div>}
            </div>
          )}
          <textarea placeholder="Order notes (kitchen instructions)" value={orderNotes} onChange={e=>setOrderNotes(e.target.value)} style={{ width:"100%", minHeight:50, padding:"6px 10px", borderRadius:6, border:"1px solid #e2e8f0", fontSize:12, fontFamily:"inherit", outline:"none", resize:"none" }} />
        </div>
        <div style={{ flex:1, overflow:"auto", padding:12 }}>
          {cartItems.map(([key, item]) => (
            <div key={key} onClick={() => openEditCartItem(key, item)} style={{ padding:"8px 0", borderBottom:"1px solid #f8fafc", cursor:"pointer", borderRadius:6, transition:"background 0.15s" }}
                 onMouseEnter={e=>e.currentTarget.style.background="#fff7ed"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:"#0f172a" }}>{item.name} <span style={{ fontWeight:400, color:"#94a3b8" }}>({item.size})</span> <span style={{ fontSize:9, color:ORANGE, fontWeight:500 }}>(tap edit)</span></div>
                  {item.addons?.map((a,i)=><div key={i} style={{ fontSize:10, color:"#64748b" }}>+ {a.name}</div>)}
                </div>
                <div style={{ textAlign:"right" }}>
                  <div className="flex items-center gap-1" style={{ display:"flex", alignItems:"center", gap:4, justifyContent:"flex-end" }}>
                    <Minus size={12} style={{ cursor:"pointer", color:"#ef4444" }} onClick={()=>updateCartQty(key,-1)} />
                    <span style={{ fontSize:13, fontWeight:700, minWidth:16, textAlign:"center" }}>{item.qty}</span>
                    <Plus size={12} style={{ cursor:"pointer", color:ORANGE }} onClick={()=>updateCartQty(key,1)} />
                  </div>
                  <div style={{ fontSize:12, fontWeight:700, color:ORANGE }}>₹{(item.price*item.qty).toLocaleString()}</div>
                </div>
              </div>
              <Trash2 size={11} color="#ef4444" style={{ cursor:"pointer", marginTop:4 }} onClick={()=>removeFromCart(key)} />
            </div>
          ))}
          {cartItems.length===0&&<div style={{ textAlign:"center", padding:20, color:"#94a3b8", fontSize:12 }}>Tap dishes to add</div>}
        </div>
        <div style={{ padding:12, borderTop:"1px solid #f1f5f9" }}>
          <div className="flex justify-between mb-2" style={{ display:"flex", justifyContent:"space-between", marginBottom:4, fontSize:12 }}>
            <span style={{ color:"#64748b" }}>Subtotal</span><span style={{ fontWeight:600 }}>₹{subtotal.toLocaleString()}</span>
          </div>
          {autoDisc && <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6, padding:"4px 8px", borderRadius:6, background:"#fef3c7" }}>
            <span style={{ fontSize:11, fontWeight:600, color:"#92400e" }}>🎉 {autoDisc.name} applied</span>
            <span style={{ fontSize:11, fontWeight:700, color:"#ef4444" }}>-₹{totalDisc.toLocaleString()}</span>
          </div>}
          {couponApplied && <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6, padding:"4px 8px", borderRadius:6, background:"#dbeafe" }}>
            <span style={{ fontSize:11, fontWeight:600, color:"#1e40af" }}>🎫 Coupon "{couponCode}"</span>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ fontSize:11, fontWeight:700, color:"#ef4444" }}>-₹{couponDiscVal.toLocaleString()}</span>
              <span onClick={() => { setCouponApplied(null); setCouponCode(""); }} style={{ fontSize:13, cursor:"pointer", color:"#ef4444", fontWeight:700 }}>×</span>
            </div>
          </div>}
          <div style={{ display:"flex", gap:4, marginBottom:6, flexWrap:"wrap" }}>
            <span style={{ fontSize:11, color:"#64748b", alignSelf:"center" }}>Flat:</span>
            {[50, 100, 200].map(amt => (
              <div key={amt} onClick={() => { setDiscFlat(discFlat === amt ? 0 : amt); setDiscount(0); setAutoDisc(null); }} style={{ padding:"3px 10px", borderRadius:6, cursor:"pointer", fontSize:11, fontWeight:600, color:discFlat === amt ? "white" : "#64748b", background:discFlat === amt ? ORANGE : "#f1f5f9", border:"none" }}>₹{amt}</div>
            ))}
            <span style={{ fontSize:11, color:"#64748b", alignSelf:"center" }}>%:</span>
            {[5, 10, 20].map(pct => (
              <div key={pct} onClick={() => { setDiscount(discount === pct ? 0 : pct); setDiscFlat(0); setAutoDisc(null); }} style={{ padding:"3px 10px", borderRadius:6, cursor:"pointer", fontSize:11, fontWeight:600, color:discount === pct && !discFlat ? "white" : "#64748b", background:discount === pct && !discFlat ? ORANGE : "#f1f5f9", border:"none" }}>{pct}%</div>
            ))}
            <input type="number" placeholder="₹" value={discFlat > 0 && ![50,100,200].includes(discFlat) ? discFlat : ""} onChange={e => { const v = Number(e.target.value); setDiscFlat(v > 0 ? v : 0); setDiscount(0); setAutoDisc(null); }} min="0" style={{ width:50, padding:"3px 6px", borderRadius:6, border:"1px solid #e2e8f0", fontSize:11, textAlign:"center" }} />
          </div>
          {!discFlat && discount === 0 && (
            <div style={{ display:"flex", gap:4, marginBottom:6 }}>
              <input placeholder="Coupon code" value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} style={{ flex:1, padding:"4px 8px", borderRadius:6, border:"1px solid #e2e8f0", fontSize:11, textTransform:"uppercase" }} />
              <button type="button" onClick={async () => { if (!couponCode.trim()) return; setLoading(true); try { const snap = await get(Outlet("discounts")); const ds = snap.val() || {}; const found = Object.values(ds).find(d => d.enabled && d.type === "coupon" && d.couponCode && d.couponCode.toLowerCase() === couponCode.toLowerCase()); if (found) { setCouponApplied(found); showToast(`Coupon ${couponCode} applied!`,"success"); } else showToast("Invalid or expired coupon","error"); } catch(e) { showToast("Coupon check failed","error"); } finally { setLoading(false); } }} disabled={loading} style={{ padding:"4px 10px", borderRadius:6, border:"none", background:"#3b82f6", color:"white", fontSize:11, fontWeight:600, cursor:"pointer" }}>Apply</button>
            </div>
          )}
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
            {!autoDisc && totalDisc > 0 && !couponApplied && <span style={{ fontSize:11, color:"#ef4444", fontWeight:500 }}>-₹{totalDisc.toLocaleString()}</span>}
          </div>
          {taxVal>0&&<div className="flex justify-between mb-2" style={{ display:"flex", justifyContent:"space-between", marginBottom:8, fontSize:12 }}>
            <span style={{ color:"#64748b" }}>Tax (5%)</span><span style={{ fontWeight:600 }}>₹{taxVal.toLocaleString()}</span>
          </div>}
          {orderType === "Delivery" && deliveryFee > 0 && <div className="flex justify-between mb-2" style={{ display:"flex", justifyContent:"space-between", marginBottom:8, fontSize:12 }}>
            <span style={{ color:"#64748b" }}>Delivery Fee</span><span style={{ fontWeight:600 }}>₹{deliveryFee.toLocaleString()}</span>
          </div>}
          <div className="flex gap-2 mb-3" style={{ display:"flex", gap:6, marginBottom:12 }}>
            {["Cash","UPI","Card"].map(m => (
              <div key={m} onClick={()=>setPayMethod(m)} style={{ flex:1, padding:"6px 0", borderRadius:8, textAlign:"center", fontSize:11, fontWeight:600, cursor:"pointer", color:payMethod===m?"white":"#64748b", background:payMethod===m?ORANGE:"#f1f5f9" }}>{m}</div>
            ))}
          </div>
          <div className="flex justify-between mb-3" style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
            <span style={{ fontSize:16, fontWeight:700, color:"#0f172a" }}>Total</span>
            <span style={{ fontSize:18, fontWeight:800, color:ORANGE }}>₹{total.toLocaleString()}</span>
          </div>
          <BtnPrimary onClick={handleCheckout} disabled={loading} style={{ width:"100%" }}>
            {loading?"Processing...":"Record Sale"}
          </BtnPrimary>
          {cartItems.length>0&&<div onClick={clearCart} style={{ textAlign:"center", fontSize:11, color:"#ef4444", cursor:"pointer", marginTop:8, fontWeight:500 }}>Clear cart</div>}
        </div>
      </GlassCard>

      {/* Mobile cart summary bottom bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-3 z-40" style={{ boxShadow:"0 -4px 12px rgba(0,0,0,0.08)" }}>
        <button onClick={() => setShowMobileCart(!showMobileCart)} className="w-full flex items-center justify-between bg-orange-50 hover:bg-orange-100 transition-colors p-3 rounded-xl">
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:"#ea580c" }}>Walk-in Cart</div>
            <div style={{ fontSize:11, color:"#ea580c" }}>{cartItems.length} items • Total: ₹{total.toLocaleString()}</div>
          </div>
          <div style={{ width:32, height:32, borderRadius:8, background:"#fed7aa", display:"flex", alignItems:"center", justifyContent:"center", color:"#ea580c", fontSize:16 }}>
            <ShoppingCart size={16} />
          </div>
        </button>
      </div>

      {/* Mobile cart bottom sheet */}
      {showMobileCart && (
        <div style={{ position:"fixed", inset:0, zIndex:50, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"flex-end" }} onClick={() => setShowMobileCart(false)}>
          <div style={{ width:"100%", maxHeight:"90vh", background:"white", borderRadius:"20px 20px 0 0", boxShadow:"0 -8px 32px rgba(0,0,0,0.12)", animation:"slideSheetUp 0.3s ease-out", display:"flex", flexDirection:"column" }} onClick={e => e.stopPropagation()}>
            <div style={{ padding:"12px 16px", borderBottom:"1px solid #f1f5f9", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div style={{ fontSize:16, fontWeight:700, color:"#0f172a" }}>Walk-in Cart</div>
              <button onClick={() => setShowMobileCart(false)} style={{ background:"none", border:"none", cursor:"pointer", color:"#94a3b8", fontSize:20 }}>×</button>
            </div>
            <div style={{ flex:1, overflow:"auto", padding:16 }}>
              {cartItems.map(([key, item]) => (
                <div key={key} onClick={() => openEditCartItem(key, item)} style={{ padding:"8px 0", borderBottom:"1px solid #f8fafc", cursor:"pointer" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, fontWeight:600, color:"#0f172a" }}>{item.name} <span style={{ fontWeight:400, color:"#94a3b8" }}>({item.size})</span> <span style={{ fontSize:9, color:ORANGE, fontWeight:500 }}>(tap edit)</span></div>
                      {item.addons?.map((a,i)=><div key={i} style={{ fontSize:10, color:"#64748b" }}>+ {a.name}</div>)}
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:12, fontWeight:700, color:ORANGE }}>₹{(item.price*item.qty).toLocaleString()}</div>
                      <div className="flex items-center gap-1" style={{ display:"flex", alignItems:"center", gap:4, justifyContent:"flex-end", marginTop:4 }}>
                        <Minus size={12} style={{ cursor:"pointer", color:"#ef4444" }} onClick={(e) => { e.stopPropagation(); updateCartQty(key,-1); }} />
                        <span style={{ fontSize:13, fontWeight:700, minWidth:16, textAlign:"center" }}>{item.qty}</span>
                        <Plus size={12} style={{ cursor:"pointer", color:ORANGE }} onClick={(e) => { e.stopPropagation(); updateCartQty(key,1); }} />
                      </div>
                    </div>
                  </div>
                  <Trash2 size={11} color="#ef4444" style={{ cursor:"pointer", marginTop:4 }} onClick={(e) => { e.stopPropagation(); removeFromCart(key); }} />
                </div>
              ))}
              {cartItems.length===0&&<div style={{ textAlign:"center", padding:40, color:"#94a3b8", fontSize:12 }}>Tap dishes to add</div>}
            </div>
            <div style={{ padding:16, borderTop:"1px solid #f1f5f9", background:"white" }}>
              <div className="flex justify-between mb-2" style={{ display:"flex", justifyContent:"space-between", marginBottom:4, fontSize:12 }}>
                <span style={{ color:"#64748b" }}>Subtotal</span><span style={{ fontWeight:600 }}>₹{subtotal.toLocaleString()}</span>
              </div>
              {autoDisc && <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6, padding:"4px 8px", borderRadius:6, background:"#fef3c7" }}>
                <span style={{ fontSize:11, fontWeight:600, color:"#92400e" }}>🎉 {autoDisc.name} applied</span>
                <span style={{ fontSize:11, fontWeight:700, color:"#ef4444" }}>-₹{discVal.toLocaleString()}</span>
              </div>}
              {taxVal>0&&<div className="flex justify-between mb-2" style={{ display:"flex", justifyContent:"space-between", marginBottom:8, fontSize:12 }}>
                <span style={{ color:"#64748b" }}>Tax (5%)</span><span style={{ fontWeight:600 }}>₹{taxVal.toLocaleString()}</span>
              </div>}
              {orderType === "Delivery" && deliveryFee > 0 && <div className="flex justify-between mb-2" style={{ display:"flex", justifyContent:"space-between", marginBottom:8, fontSize:12 }}>
                <span style={{ color:"#64748b" }}>Delivery Fee</span><span style={{ fontWeight:600 }}>₹{deliveryFee.toLocaleString()}</span>
              </div>}
              <div className="flex gap-2 mb-3" style={{ display:"flex", gap:6, marginBottom:12 }}>
                {["Cash","UPI","Card"].map(m => (
                  <div key={m} onClick={()=>setPayMethod(m)} style={{ flex:1, padding:"6px 0", borderRadius:8, textAlign:"center", fontSize:11, fontWeight:600, cursor:"pointer", color:payMethod===m?"white":"#64748b", background:payMethod===m?ORANGE:"#f1f5f9" }}>{m}</div>
                ))}
              </div>
              <div className="flex justify-between mb-3" style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
                <span style={{ fontSize:16, fontWeight:700, color:"#0f172a" }}>Total</span>
                <span style={{ fontSize:18, fontWeight:800, color:ORANGE }}>₹{total.toLocaleString()}</span>
              </div>
              <BtnPrimary onClick={handleCheckout} disabled={loading} style={{ width:"100%" }}>{loading?"Processing...":"Record Sale"}</BtnPrimary>
              {cartItems.length>0&&<div onClick={clearCart} style={{ textAlign:"center", fontSize:11, color:"#ef4444", cursor:"pointer", marginTop:8, fontWeight:500 }}>Clear cart</div>}
            </div>
          </div>
        </div>
      )}

      {/* Selection Modal */}
      <Modal open={!!selModal} onClose={()=>{setSelModal(null);setEditKey(null);}}>
        {selModal&&(()=>{
          const sizes = selModal.sizes||{Standard:selModal.price||0};
          const catA = cats.find(c=>c.name===selModal.category)?.addons||{};
          return <div>
            <div style={{ fontSize:18, fontWeight:700, color:"#0f172a", marginBottom:4 }}>{selModal.name} {editKey&&<span style={{ fontSize:10, fontWeight:600, color:"white", background:ORANGE, padding:"2px 8px", borderRadius:6, verticalAlign:"middle", marginLeft:6 }}>Editing</span>}</div>
            <div style={{ fontSize:12, color:"#64748b", marginBottom:16 }}>{selModal.category}</div>
            <SectionLabel>Size</SectionLabel>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:16 }}>
              {Object.entries(sizes).map(([sz,pr])=>(
                <div key={sz} onClick={()=>setSelSize(sz)} style={{ padding:"10px", borderRadius:10, textAlign:"center", cursor:"pointer", border:selSize===sz?`2px solid ${ORANGE}`:"1.5px solid #e2e8f0", background:selSize===sz?"#fff7ed":"white" }}>
                  <div style={{ fontSize:13, fontWeight:600, color:"#0f172a" }}>{sz}</div>
                  <div style={{ fontSize:12, fontWeight:700, color:ORANGE }}>₹{pr}</div>
                </div>
              ))}
            </div>
            {Object.keys(catA).length>0&&<><SectionLabel>Addons</SectionLabel>
            <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:16 }}>
              {Object.entries(catA).map(([n,pr])=>(
                <div key={n} onClick={()=>setSelAddons(prev=>prev[n]?(()=>{const c={...prev};delete c[n];return c;})():{...prev,[n]:pr})} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 12px", borderRadius:10, cursor:"pointer", background:selAddons[n]?"#fff7ed":"#f8fafc", border:`1px solid ${selAddons[n]?ORANGE:"#e2e8f0"}` }}>
                  <span style={{ fontSize:13, fontWeight:500, color:"#0f172a" }}>+ {n}</span>
                  <span style={{ fontSize:12, fontWeight:600, color:ORANGE }}>₹{pr}</span>
                </div>
              ))}
            </div></>}
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
              <span style={{ fontSize:13, fontWeight:500 }}>Qty:</span>
              <Minus size={16} style={{ cursor:"pointer", color:"#ef4444" }} onClick={()=>setSelQty(Math.max(1,selQty-1))} />
              <span style={{ fontSize:16, fontWeight:700, minWidth:20, textAlign:"center" }}>{selQty}</span>
              <Plus size={16} style={{ cursor:"pointer", color:ORANGE }} onClick={()=>setSelQty(selQty+1)} />
            </div>
            <BtnPrimary onClick={addToCart} style={{ width:"100%" }}>Add to Cart • ₹{((Number(sizes[selSize]??selModal.price??0)+Object.values(selAddons).reduce((a,b)=>a+Number(b),0))*selQty).toLocaleString()}</BtnPrimary>
          </div>;
        })()}
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CUSTOMERS PAGE
// ═══════════════════════════════════════════════════════════════════════════

export default POSPage;