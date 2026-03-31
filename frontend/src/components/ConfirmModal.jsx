import React from 'react';

export default function ConfirmModal({ title, message, active, onConfirm, onCancel }) {
  if (!active) return null;

  return (
    <div className="fade-in" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
    }}>
      <div style={{
        background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '400px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
      }}>
        <h3 style={{ margin: '0 0 8px 0', color: '#fff', fontSize: '18px', fontWeight: '600' }}>{title}</h3>
        <p style={{ margin: '0 0 24px 0', color: '#888', fontSize: '14px', lineHeight: '1.5' }}>{message}</p>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button onClick={onCancel} style={{
            background: 'transparent', color: '#c0c0d8', border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '8px', padding: '8px 16px', fontSize: '14px', fontWeight: '500', cursor: 'pointer'
          }}>
            Cancel
          </button>
          <button onClick={onConfirm} style={{
            background: '#e05c5c', color: '#fff', border: 'none',
            borderRadius: '8px', padding: '8px 16px', fontSize: '14px', fontWeight: '500', cursor: 'pointer'
          }}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
