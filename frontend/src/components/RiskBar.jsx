import React from 'react';

export default function RiskBar({ score }) {
  let color = '#10b981'; // Green
  if (score > 30) color = '#f59e0b'; // Yellow
  if (score > 60) color = '#e05c5c'; // Red

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
      <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
        <div style={{
          width: `${score}%`,
          height: '100%',
          background: color,
          transition: 'width 0.5s ease-out, background 0.5s ease'
        }}></div>
      </div>
      <div style={{ fontSize: '12px', fontWeight: '600', color: color, minWidth: '24px', textAlign: 'right' }}>
        {score}
      </div>
    </div>
  );
}
