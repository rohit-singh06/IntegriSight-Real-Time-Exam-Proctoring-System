import React from 'react';

export default function ViolationBadge({ type, count = null }) {
  let bg, color, label;
  
  if (type === 'gaze_away') {
    bg = 'rgba(245,158,11,0.15)'; color = '#f59e0b'; label = 'Gaze Away';
  } else if (type === 'face_not_visible') {
    bg = 'rgba(224,92,92,0.15)'; color = '#e05c5c'; label = 'Face Not Visible';
  } else if (type === 'multiple_faces') {
    bg = 'rgba(99,82,221,0.15)'; color = '#a78bfa'; label = 'Multiple Faces';
  } else {
    bg = 'rgba(255,255,255,0.1)'; color = '#fff'; label = type;
  }

  return (
    <span style={{
      background: bg, color: color,
      borderRadius: '20px', padding: '2px 8px', fontSize: '11px', fontWeight: '600',
      display: 'inline-flex', alignItems: 'center', gap: '4px', border: `0.5px solid ${color}40`
    }}>
      {label} {count !== null && <span style={{ opacity: 0.8 }}>({count})</span>}
    </span>
  );
}
