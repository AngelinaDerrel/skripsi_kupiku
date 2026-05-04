export default function NavIcon({ name, active }) {
  const c = active ? 'var(--text)' : 'var(--text-muted)';
  const sw = 1.5;
  if (name === 'home') return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 7l6-4.5L14 7v6.5a.5.5 0 0 1-.5.5h-3v-4h-5v4h-3a.5.5 0 0 1-.5-.5V7z" stroke={c} strokeWidth={sw} strokeLinejoin="round" />
    </svg>
  );
  if (name === 'cup') return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 5h8v5a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V5z" stroke={c} strokeWidth={sw} />
      <path d="M11 7h2a1.5 1.5 0 0 1 0 3h-2" stroke={c} strokeWidth={sw} />
      <path d="M5 2.5c0 1 1 1 1 2M8 2.5c0 1 1 1 1 2" stroke={c} strokeWidth={sw} strokeLinecap="round" />
    </svg>
  );
  if (name === 'box') return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2.5" y="4" width="11" height="9" stroke={c} strokeWidth={sw} />
      <path d="M2.5 7h11M8 4v9" stroke={c} strokeWidth={sw} />
    </svg>
  );
  if (name === 'ticket') return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="4" width="12" height="8" rx="1" stroke={c} strokeWidth={sw} />
      <path d="M6 4v8" stroke={c} strokeWidth={sw} strokeDasharray="1.5 1.5" />
    </svg>
  );
  if (name === 'pulse') return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 8h3l1.5-4 3 8L11 8h3" stroke={c} strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
  if (name === 'people') return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="6" cy="6" r="2.5" stroke={c} strokeWidth={sw} />
      <path d="M2 13c0-2 1.8-3.5 4-3.5s4 1.5 4 3.5" stroke={c} strokeWidth={sw} strokeLinecap="round" />
      <circle cx="11" cy="6" r="1.8" stroke={c} strokeWidth={sw} />
      <path d="M11 9.5c1.5 0 3 1 3 2.5" stroke={c} strokeWidth={sw} strokeLinecap="round" />
    </svg>
  );
  if (name === 'gear') return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="2" stroke={c} strokeWidth={sw} />
      <path d="M8 1.5v2M8 12.5v2M14.5 8h-2M3.5 8h-2M12.6 3.4l-1.4 1.4M4.8 11.2l-1.4 1.4M12.6 12.6l-1.4-1.4M4.8 4.8 3.4 3.4" stroke={c} strokeWidth={sw} strokeLinecap="round" />
    </svg>
  );
  if (name === 'help') return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke={c} strokeWidth={sw} />
      <path d="M6.5 6.5a1.5 1.5 0 1 1 2 1.4c-.5.2-.5.6-.5 1.1" stroke={c} strokeWidth={sw} strokeLinecap="round" />
      <circle cx="8" cy="11.5" r="0.6" fill={c} />
    </svg>
  );
  return null;
}
