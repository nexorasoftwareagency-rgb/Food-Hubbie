import React, { useEffect, useState } from "react";
import { Printer } from "lucide-react";
import { ORANGE } from "../constants";

let alertIdCounter = 0;

export default function OrderAlert({ order, onDismiss, onSwitchTab, onPrint }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss?.(), 300);
    }, 10000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const items = Array.isArray(order.cart)
    ? order.cart.length
    : order.items ? (Array.isArray(order.items) ? order.items.length : Object.keys(order.items).length) : 0;

  if (!visible) return null;

  return (
    <div className="alert-box info" onClick={() => { onSwitchTab?.('liveops'); onDismiss?.(); }}>
      <div style={{ fontSize: 24, lineHeight: 1 }}>
        {order.outlet === 'cake' ? '🎂' : '🍕'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: ORANGE, marginBottom: 2 }}>
          New Order #{order.id?.slice(-5)}
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', marginBottom: 1 }}>
          {order.customerName || 'Customer'}
        </div>
        <div style={{ fontSize: 11, color: '#64748b' }}>
          ₹{Number(order.total || 0).toLocaleString('en-IN')} · {items} item{items !== 1 ? 's' : ''}
        </div>
      </div>
      <button className="btn-action-v4" title="Print"
        onClick={e => { e.stopPropagation(); onPrint?.(order); }}
        style={{ flexShrink: 0 }}>
        <Printer size={14} />
      </button>
    </div>
  );
}
