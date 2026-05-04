import { useNavigate, useLocation } from 'react-router-dom';
import NavIcon from '../components/NavIcon.jsx';

const NAV = [
  { id: 'orders', label: 'Orders', icon: 'ticket' },
  { id: 'stock', label: 'Stock Opname', icon: 'box' },
];

export default function StaffLayout({ children }) {
  const nav = useNavigate();
  const loc = useLocation();

  const raw = typeof window !== 'undefined' ? localStorage.getItem('kupiku_user') : null;
  let initials = 'RA';
  let displayName = 'Staff';
  try {
    const u = raw ? JSON.parse(raw) : null;
    if (u && u.name) {
      displayName = u.name;
      initials = u.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
    }
  } catch {}

  return (
    <div className="kp" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <aside style={{
        width: 232, flex: 'none', background: '#0B0B0B',
        borderRight: '1px solid var(--line)', padding: '22px 14px',
        display: 'flex', flexDirection: 'column'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 8px 22px', cursor: 'pointer' }} onClick={() => nav('/')}> 
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Kupiku Coffee</div>
            <div className="kp-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>Staff Portal</div>
          </div>
        </div>

        <div className="kp-eyebrow" style={{ padding: '4px 8px', fontSize: 10 }}>Workspace</div>
        <nav style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV.map((item) => {
            const active = loc.pathname.includes(item.id);
            return (
              <div key={item.id} onClick={() => nav(`/staff/${item.id}`)} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '9px 10px', borderRadius: 8,
                background: active ? 'rgba(107,79,58,0.18)' : 'transparent',
                border: active ? '1px solid rgba(107,79,58,0.3)' : '1px solid transparent',
                color: active ? 'var(--text)' : 'var(--text-muted)',
                fontSize: 13, cursor: 'pointer'
              }}>
                <NavIcon name={item.icon} active={active} />
                <span style={{ flex: 1 }}>{item.label}</span>
              </div>
            );
          })}
        </nav>

        <div style={{ flex: 1 }} />

        <div style={{ marginTop: 14, padding: 12, borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--good)', boxShadow: '0 0 0 3px rgba(122,143,106,0.18)' }} />
            <span className="kp-mono" style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>ON DUTY</span>
          </div>
          <div className="kp-mono" style={{ fontSize: 11, color: 'var(--text)' }}>Shift active</div>
        </div>
      </aside>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
        <div style={{
          padding: '18px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid var(--line)'
        }}>
          <div>
            <div className="kp-eyebrow" style={{ fontSize: 10 }}>Staff Portal</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>{displayName}</div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8,
              background: 'var(--surface)', border: '1px solid var(--line)', width: 260
            }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="6" cy="6" r="4" stroke="var(--text-muted)" strokeWidth="1.4" />
                <path d="M9 9l3 3" stroke="var(--text-muted)" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              <input placeholder="Search here..." style={{
                flex: 1, border: 'none', outline: 'none', background: 'transparent', color: 'var(--text-muted)', fontSize: 13
              }} />
              <span className="kp-mono" style={{ fontSize: 10, color: 'var(--text-dim)', border: '1px solid var(--line-strong)', padding: '1px 5px', borderRadius: 4 }}>⌘K</span>
            </div>

            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg, #6B4F3A, #2B2010)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 600, color: 'var(--text)'
            }}>{initials}</div>
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}
