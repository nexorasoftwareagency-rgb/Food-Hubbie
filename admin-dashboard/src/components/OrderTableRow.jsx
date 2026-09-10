import React from "react";
import { Printer, MessageSquare, MapPin, Eye, Trash2, Bike } from "lucide-react";
import { ORD_ST, STATUS_SEQUENCES } from "../constants";
import { fmt } from "../utils";

function normalizeItems(order) {
  if (Array.isArray(order.cart)) return order.cart;
  if (order.items) return Array.isArray(order.items) ? order.items : Object.values(order.items);
  if (order.item) return [{ name: order.item, size: order.size || 'Regular', qty: 1, price: order.total || 0 }];
  return [];
}

function itemSummary(order) {
  const items = normalizeItems(order);
  return items.length > 0 ? `${items.length} Items` : "No Items";
}

function isRiderFresh(r) {
  if (!r) return false;
  if (r.status === "On Delivery") return true;
  if (r.status !== "Online") return false;
  const ts = r.lastSeen || r.location?.ts || 0;
  return ts && (Date.now() - ts) < 300000;
}

export default function OrderTableRow({
  order, index, tab, riders, onOpenDrawer, onUpdateStatus, onAssignRider, onDelete, onPrint
}) {
  const items = normalizeItems(order);
  const safeStatus = (order.status || "Unknown").replace(/ /g, '');
  const truncatedAddress = order.address
    ? (order.address.length > 30 ? order.address.substring(0, 30) + "..." : order.address)
    : "Counter Sale";
  const type = order.type || 'Online';
  const isDelivery = type === 'Online' || type === 'WhatsApp';
  const seq = STATUS_SEQUENCES[type] || STATUS_SEQUENCES.Default;

  const statusIdx = seq.indexOf(order.status);
  const nextStep = (statusIdx >= 0 && statusIdx < seq.length - 1) ? seq[statusIdx + 1] : null;

  const freshRiders = riders.filter(r => isRiderFresh(r));

  const handleRowClick = (e) => {
    if (!e.target.closest('button, select, a, [data-action]')) {
      onOpenDrawer(order);
    }
  };

  const renderStatusSelect = () => (
    <select
      className="status-select-mini"
      value={order.status || "Placed"}
      onClick={e => e.stopPropagation()}
      onChange={e => { if (e.target.value !== order.status) onUpdateStatus(order.id, e.target.value); }}>
      <option value={order.status} disabled>{order.status}</option>
      {nextStep && <option value={nextStep}>→ {nextStep}</option>}
      {order.status !== "Delivered" && order.status !== "Cancelled" && <option value="Cancelled">Cancel</option>}
    </select>
  );

  const renderRiderSelect = () => (
    <select
      className="status-select-mini"
      value={order.riderId || ''}
      onClick={e => e.stopPropagation()}
      onChange={e => { if (e.target.value) onAssignRider(order.id, e.target.value); }}
      disabled={!isDelivery}
      style={{ opacity: isDelivery ? 1 : 0.5 }}>
      <option value="">{order.riderName || "Assign"}</option>
      {freshRiders.map(r => (
        <option key={r.id} value={r.id} selected={order.riderId === r.id}>
          {r.name || r.email || r.id}
        </option>
      ))}
    </select>
  );

  if (tab === 'dashboard') {
    return (
      <tr className="premium-row-v4" onClick={handleRowClick} id={`row-${order.id}`}>
        <td data-label="Order">
          <div className="identity-chip-v4">
            <div className={`kpi-icon-box ${type === 'Online' ? 'blue' : 'orange'}`} style={{ width: 32, height: 32, fontSize: 13 }}>
              <span>{type === 'Online' ? '🌐' : '🏪'}</span>
            </div>
            <div className="identity-info-v4">
              <span className="name">#{order.orderId || order.id?.slice(-5)}</span>
              <span className="sub">{type}</span>
            </div>
          </div>
        </td>
        <td data-label="Customer">
          <div className="identity-info-v4">
            <span className="name">{order.customerName || 'Customer'}</span>
            <span className="sub">{order.phone || 'Guest'}</span>
          </div>
        </td>
        <td data-label="Details">
          <div className="flex-col">
            <span className="font-600 fs-13">{itemSummary(order)}</span>
            <span className="text-muted-small">{truncatedAddress}</span>
          </div>
        </td>
        <td data-label="Total">
          <span className="font-bold color-primary fs-15">{fmt(order.total || 0)}</span>
        </td>
        <td data-label="Payment">
          <div className={`badge-payment-v4`} data-method={(order.paymentMethod || '---').toLowerCase()}>
            <span>{order.paymentMethod || '---'}</span>
          </div>
        </td>
        <td data-label="Status">
          <span className={`status ${safeStatus}`}>{order.status || "Unknown"}</span>
        </td>
        <td data-label="Rider">
          <div className="flex-row flex-center flex-gap-8">
            <Bike size={14} className="text-muted" />
            {renderRiderSelect()}
          </div>
        </td>
        <td data-label="Actions">
          <div className="action-group-v4">
            {renderStatusSelect()}
            <button className="btn-action-v4" title="Print" onClick={e => { e.stopPropagation(); onPrint(order); }}>
              <Printer size={13} />
            </button>
            <button className="btn-action-v4" title="View" onClick={e => { e.stopPropagation(); onOpenDrawer(order); }}>
              <Eye size={13} />
            </button>
          </div>
        </td>
      </tr>
    );
  }

  if (tab === 'live') {
    return (
      <tr className="premium-row-v4" onClick={handleRowClick} id={`row-${order.id}`}>
        <td data-label="Order">
          <div className="identity-chip-v4">
            <div className="kpi-icon-box" style={{ width: 32, height: 32, fontSize: 13 }}>
              <span>⚡</span>
            </div>
            <div className="identity-info-v4">
              <span className="name">#{order.orderId || order.id?.slice(-5)}</span>
              <span className="sub">{(order.outlet || 'pizza').toUpperCase()}</span>
            </div>
          </div>
        </td>
        <td data-label="Customer">
          <div className="identity-info-v4">
            <span className="name">{order.customerName || 'Customer'}</span>
            <span className="sub">{order.phone || 'Guest'}</span>
          </div>
        </td>
        <td data-label="Kitchen">
          <div className="flex-col">
            <span className="font-600 fs-13">{itemSummary(order)}</span>
            <span className="text-muted-small">{type}</span>
          </div>
        </td>
        <td data-label="Total">
          <span className="font-bold color-primary">{fmt(order.total || 0)}</span>
        </td>
        <td data-label="Status">
          <span className={`status ${safeStatus}`}>{order.status || "Unknown"}</span>
        </td>
        <td data-label="Rider">{renderRiderSelect()}</td>
        <td data-label="Actions">
          <div className="action-group-v4">
            {renderStatusSelect()}
            <button className="btn-action-v4" title="Print" onClick={e => { e.stopPropagation(); onPrint(order); }}>
              <Printer size={13} />
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="premium-row-v4" onClick={handleRowClick} id={`row-${order.id}`}>
      <td data-label="Order">
        <div className="identity-chip-v4">
          <div className="kpi-icon-box" style={{ width: 32, height: 32, fontSize: 13 }}>
            <span>📦</span>
          </div>
          <div className="identity-info-v4">
            <span className="name">#{order.orderId || order.id?.slice(-5)}</span>
            <span className="sub">{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ''}</span>
          </div>
        </div>
      </td>
      <td data-label="Customer">
        <div className="identity-info-v4">
          <span className="name">{order.customerName || 'Customer'}</span>
          <div className="action-group-v4 mt-5">
            <span className="sub">{order.phone || 'Guest'}</span>
            {order.phone && (
              <button className="btn-action-v4 success" title="WhatsApp"
                onClick={e => { e.stopPropagation(); window.open(`https://wa.me/${order.phone.replace(/[^0-9]/g, '')}`, '_blank'); }}
                style={{ width: 20, height: 20, fontSize: 10 }}>
                <MessageSquare size={10} />
              </button>
            )}
          </div>
        </div>
      </td>
      <td data-label="Address">
        <div className="identity-info-v4">
          <span className="sub" title={order.address || ''}>{truncatedAddress}</span>
          {(order.locationLink || (order.lat && order.lng)) && (
            <a href={order.locationLink || `https://www.google.com/maps?q=${order.lat},${order.lng}`}
               target="_blank" rel="noopener noreferrer" className="map-link" style={{ fontSize: 10 }}
               onClick={e => e.stopPropagation()}>
              📍 VIEW MAP
            </a>
          )}
        </div>
      </td>
      <td data-label="Total">
        <span className="font-bold color-primary">{fmt(order.total || 0)}</span>
      </td>
      <td data-label="Payment">
        <div className="badge-payment-v4" data-method={(order.paymentMethod || '---').toLowerCase()}>
          <span>{order.paymentMethod || '---'}</span>
        </div>
      </td>
      <td data-label="Status">
        <span className={`status ${safeStatus}`}>{order.status || "Unknown"}</span>
      </td>
      <td data-label="Actions">
        <div className="action-group-v4">
          {renderStatusSelect()}
          <button className="btn-action-v4" title="Print" onClick={e => { e.stopPropagation(); onPrint(order); }}>
            <Printer size={13} />
          </button>
          <button className="btn-action-v4" title="View" onClick={e => { e.stopPropagation(); onOpenDrawer(order); }}>
            <Eye size={13} />
          </button>
          <button className="btn-action-v4" style={{ color: '#ef4444' }} title="Delete"
            onClick={e => { e.stopPropagation(); onDelete(order.id); }}>
            <Trash2 size={13} />
          </button>
        </div>
      </td>
    </tr>
  );
}
