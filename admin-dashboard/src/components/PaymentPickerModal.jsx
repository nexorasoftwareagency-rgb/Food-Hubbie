import React from "react";
import { ORANGE } from "../constants";

export default function PaymentPickerModal({ open, total, onSelect, onCancel }) {
  if (!open) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16, backdropFilter: 'blur(4px)',
    }}>
      <div onClick={onCancel} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} />
      <div style={{
        position: 'relative', maxWidth: 400, width: '100%',
        background: 'rgba(255,255,255,0.98)', borderRadius: 20, padding: 24,
        boxShadow: '0 24px 80px rgba(0,0,0,0.2)', animation: 'modalSlideIn 0.3s cubic-bezier(0.4,0,0.2,1)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Record Payment</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', fontFamily: "'Outfit', sans-serif" }}>
            ₹{Number(total).toLocaleString('en-IN')}
          </div>
        </div>
        <div className="dynamic-payment-grid">
          <button onClick={() => onSelect('Cash')} style={{ padding: '14px 0', borderRadius: 12, border: '1.5px solid #e2e8f0', background: '#f0fdf4', fontWeight: 600, fontSize: 15, cursor: 'pointer', color: '#16a34a' }}>
            💵 Cash
          </button>
          <button onClick={() => onSelect('UPI')} style={{ padding: '14px 0', borderRadius: 12, border: '1.5px solid #e2e8f0', background: '#eff6ff', fontWeight: 600, fontSize: 15, cursor: 'pointer', color: '#2563eb' }}>
            📱 UPI
          </button>
          <button onClick={() => onSelect('Card')} style={{ padding: '14px 0', borderRadius: 12, border: '1.5px solid #e2e8f0', background: '#faf5ff', fontWeight: 600, fontSize: 15, cursor: 'pointer', color: '#9333ea' }}>
            💳 Card
          </button>
          <button onClick={onCancel} className="full-width" style={{ padding: '12px 0', borderRadius: 12, border: '1.5px solid #e2e8f0', background: 'white', fontWeight: 600, fontSize: 13, cursor: 'pointer', color: '#64748b', gridColumn: '1 / -1' }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
