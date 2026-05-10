import React from 'react';

export default function MoodGlyph({ shape, active }) {
  const color = active ? 'var(--brown-3)' : 'var(--text-muted)';
  const stroke = active ? 1.75 : 1.25;
  const size = 28;

  if (shape === 'sun') return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="14" r="5" stroke={color} strokeWidth={stroke} />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <line key={a} x1="14" y1="2" x2="14" y2="5"
          stroke={color} strokeWidth={stroke} strokeLinecap="round"
          transform={`rotate(${a} 14 14)`} />
      ))}
    </svg>
  );
  if (shape === 'moon') return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <path d="M20 14a8 8 0 1 1-8-8 6 6 0 0 0 8 8z" stroke={color} strokeWidth={stroke} strokeLinejoin="round" />
    </svg>
  );
  if (shape === 'circle') return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="14" r="9" stroke={color} strokeWidth={stroke} />
      <circle cx="14" cy="14" r="3" fill={color} />
    </svg>
  );
  if (shape === 'square') return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <rect x="5" y="5" width="18" height="18" stroke={color} strokeWidth={stroke} />
      <rect x="11" y="11" width="6" height="6" fill={color} />
    </svg>
  );
  if (shape === 'line') return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <line x1="4" y1="14" x2="24" y2="14" stroke={color} strokeWidth={stroke} strokeLinecap="round" />
      <circle cx="14" cy="14" r="2.5" fill={color} />
    </svg>
  );
  if (shape === 'triangle') return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <path d="M14 5 L23 22 L5 22 Z" stroke={color} strokeWidth={stroke} strokeLinejoin="round" />
    </svg>
  );
  return null;
}
