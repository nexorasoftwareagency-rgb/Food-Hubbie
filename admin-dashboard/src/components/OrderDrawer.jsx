import React from "react";
import { X, User, MapPin, ShoppingBag, Settings, Printer, MessageCircle, CheckCircle, Globe, Monitor, Utensils, MessageSquare } from "lucide-react";
import { ORANGE, ORD_ST, STATUS_SEQUENCES } from "../constants";
import { fmt } from "../utils";

function getOrderItems(order) {
  if (Array.isArray(order.cart)) return order.cart;
  if (order.items) return Array.isArray(order.items) ? order.items : Object.values(order.items);
  if (order.item) return [{ name: order.item, size: order.size || 'Regular', addon: order.addon || 'None', qty: 1, price: order.total || 0 }];
  return [];
}

function getTypeIcon(type) {
  switch ((type || '').toLowerCase()) {
    case 'online': return Globe;
    case 'whatsapp': return MessageSquare;
    case 'pos': return Monitor;
    case 'dine-in': return Utensils;
    default: return ShoppingBag;
  }
}

export default function OrderDrawer({ order, riders, onClose, onUpdateStatus, onAssignRider, onPrint, onMarkDelivered }) {
  if (!order) return null;

  const items = getOrderItems(order);
  const type = order.type || 'Online';
  const TypeIcon = getTypeIcon(type);
  const statusLower = (order.status || '').toLowerCase().replace(/\s+/g, '');
  const createdAt = order.createdAt ? new Date(order.createdAt) : new Date();
  const timeStr = createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = createdAt.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
  const isDelivery = type === 'Online' || type === 'WhatsApp';
  const seq = STATUS_SEQUENCES[type] || STATUS_SEQUENCES.Default;

  const freshRiders = riders.filter(r => {
    if (!r) return false;
    if (r.status === "On Delivery") return true;
    if (r.status !== "Online") return false;
    const ts = r.lastSeen || r.location?.ts || 0;
    return ts && (Date.now() - ts) < 300000;
  });

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <>
      <div className={`drawer-overlay ${order ? 'active' : ''}`} onClick={handleOverlayClick} />
      <div className={`drawer-content ${order ? 'active' : ''}`}>
        <div className="drawer-header-v4">
          <button className="drawer-close-btn" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            <span className="order-type-badge">
              <TypeIcon size={11} />
              &nbsp;{type}
            </span>
            <span className={`order-status-pill status-${statusLower}`}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'currentColor', display: 'inline-block', marginRight: 4 }} />
              {order.status || 'Unknown'}
            </span>
          </div>
          <div className="order-id-text">Order #{order.orderId || order.id?.slice(-5)}</div>
          <div className="order-meta-text">{dateStr} at {timeStr}</div>
        </div>

        <div className="drawer-scroll-body">
          <div className="drawer-section">
            <div className="section-label-v4"><User size={14} /> Customer</div>
            <div className="drawer-customer-card">
              <div className="customer-avatar"><User size={20} /></div>
              <div>
                <div className="customer-name">{order.customerName || 'Guest'}</div>
                <div className="customer-phone">{order.phone || 'No phone'}</div>
              </div>
            </div>
            <div className="drawer-address-block">
              <MapPin size={16} style={{ color: '#94a3b8', flexShrink: 0, marginTop: 2 }} />
              <div>
                <div className="address-text">{order.address || 'Counter Sale / Walk-in'}</div>
                {(order.locationLink || (order.lat && order.lng)) && (
                  <a href={order.locationLink || `https://www.google.com/maps?q=${order.lat},${order.lng}`}
                     target="_blank" rel="noopener noreferrer" className="map-link">
                    <MapPin size={10} /> Track on Live Map
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="drawer-section">
            <div className="section-label-v4"><ShoppingBag size={14} /> Items ({items.length})</div>
            <div className="drawer-items-list">
              {items.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>
                  <ShoppingBag size={24} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
                  <p>No items in this order</p>
                </div>
              ) : items.map((item, idx) => (
                <div key={idx} className="item-card">
                  <div className="item-qty-badge">{item.qty || 1}</div>
                  <div className="item-info">
                    <div className="item-name">{item.name || 'Item'}</div>
                    <div className="item-size">{item.size || 'Regular'}</div>
                    {((item.addon && item.addon !== 'None') || (item.addons && item.addons.length > 0)) && (
                      <div className="item-addons">
                        {item.addon && item.addon !== 'None' && <span className="item-addon-chip">{item.addon}</span>}
                        {item.addons && item.addons.map((a, j) =>
                          a.name ? <span key={j} className="item-addon-chip">{a.name}</span> : null
                        )}
                      </div>
                    )}
                  </div>
                  <div className="item-price">
                    <div className="price">₹{item.price || item.total || 0}</div>
                    {(item.qty || 1) > 1 && <div className="unit-price">₹{((item.price || item.total || 0) / (item.qty || 1)).toFixed(0)} each</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="drawer-summary-panel">
            <div className="summary-row">
              <span className="label">Subtotal</span>
              <span className="value">₹{order.subtotal || 0}</span>
            </div>
            {order.discount && Number(order.discount) > 0 && (
              <div className="summary-row discount">
                <span className="label">Discount{order.discountLabel ? ` (${order.discountLabel})` : ''}</span>
                <span className="value">-₹{order.discount}</span>
              </div>
            )}
            {order.deliveryFee && Number(order.deliveryFee) > 0 && (
              <div className="summary-row">
                <span className="label">Delivery Fee</span>
                <span className="value">₹{order.deliveryFee}</span>
              </div>
            )}
            <div className="summary-total">
              <span className="label">Grand Total</span>
              <span className="value">{fmt(order.total || 0)}</span>
            </div>
          </div>

          <div className="drawer-section" style={{ marginBottom: 0 }}>
            <div className="section-label-v4"><Settings size={14} /> Controls</div>
            <div className="drawer-ctrl-panel" style={{ border: 'none', padding: 0, margin: 0, background: 'transparent', boxShadow: 'none' }}>
              <div className="ctrl-row">
                <div className="ctrl-group">
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 6, display: 'block' }}>STATUS</label>
                  <select
                    className="form-input-v4 w-100"
                    value={order.status || "Placed"}
                    onChange={e => { if (e.target.value !== order.status) onUpdateStatus(order.id, e.target.value); }}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 12, fontWeight: 600, background: 'white', cursor: 'pointer' }}
                  >
                    <option value={order.status} disabled>{order.status}</option>
                    {(() => {
                      const currentIdx = seq.indexOf(order.status);
                      const nextStep = (currentIdx >= 0 && currentIdx < seq.length - 1) ? seq[currentIdx + 1] : null;
                      return <>
                        {nextStep && <option value={nextStep}>Move to {nextStep}</option>}
                        {order.status !== "Delivered" && order.status !== "Cancelled" && <option value="Cancelled">Cancel Order</option>}
                      </>;
                    })()}
                  </select>
                </div>
                <div className="ctrl-group">
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 6, display: 'block' }}>RIDER</label>
                  <select
                    className="form-input-v4 w-100"
                    defaultValue={order.riderId || ''}
                    onChange={e => { if (e.target.value) onAssignRider(order.id, e.target.value); }}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 12, fontWeight: 600, background: 'white', cursor: 'pointer', opacity: isDelivery ? 1 : 0.5 }}
                    disabled={!isDelivery}
                  >
                    <option value="">{order.riderId ? 'Change Rider' : 'Assign Rider'}</option>
                    {freshRiders.map(r => (
                      <option key={r.id} value={r.id} selected={order.riderId === r.id}>
                        {r.name || r.email || r.id} ({r.status})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="drawer-action-bar">
          <button className="btn-drawer-action primary" onClick={() => onPrint(order)}>
            <Printer size={15} /> Print
          </button>
          {order.phone && (
            <a className="btn-drawer-action whatsapp"
               href={`https://wa.me/${order.phone.replace(/[^0-9]/g, '')}`}
               target="_blank" rel="noopener noreferrer"
               style={{ textDecoration: 'none' }}>
              <MessageCircle size={15} /> WhatsApp
            </a>
          )}
          {isDelivery && order.status !== 'Delivered' && (
            <button className="btn-drawer-action secondary" onClick={() => onMarkDelivered(order)}>
              <CheckCircle size={15} /> Delivered
            </button>
          )}
        </div>
      </div>
    </>
  );
}
