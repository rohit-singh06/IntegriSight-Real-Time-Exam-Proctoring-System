// StatCard.jsx
// simple reusable card for dashboard numbers

import React from 'react';

const StatCard = ({ title, value, accentColor }) => {
  // sometimes we just need a default color if accent is missing
  const color = accentColor || '#fff';

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '12px',
      padding: '20px',
      display: 'flex', flexDirection: 'column', flex: 1
    }}>
      <div style={{ fontSize: '12px', fontWeight: '500', color: '#888899', textTransform: 'uppercase', marginBottom: '8px' }}>
        {title}
      </div>
      <div style={{ fontSize: '28px', fontWeight: '700', color: color }}>
        {value}
      </div>
    </div>
  );
};

export default StatCard;
