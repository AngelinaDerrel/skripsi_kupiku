import React from 'react';
import { createContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import NavIcon from '../components/NavIcon.jsx';

const NAV = [
  { id: 'orders', label: 'Orders', icon: 'ticket' },
  { id: 'stok-masuk', label: 'Stok Masuk', icon: 'box' },
  { id: 'stock', label: 'Stock Opname', icon: 'box' },
];

export const StaffSearchContext = createContext({ search: '', setSearch: () => {} });

export default function StaffLayout({ children }) {
  const [search, setSearch] = useState('');
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
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

  function handleLogout() {
    localStorage.removeItem('kupiku_user');
    localStorage.removeItem('kupiku_token');
    nav('/');
  }

  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { setSidebarOpen(false); }, [loc]);

  return (
    <div className="kp" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <aside className={`kp-admin-sidebar${sidebarOpen ? ' is-open' : ''}`}>
        {/* Close sidebar button (mobile only) */}
        <button
          onClick={() => setSidebarOpen(false)}
          style={{
            display: 'none', position: 'absolute', top: 14, right: 12,
            width: 28, height: 28, borderRadius: 6,
            border: '1px solid var(--line)', background: 'transparent',
            color: 'var(--text-muted)', fontSize: 16, cursor: 'pointer',
            alignItems: 'center', justifyContent: 'center',
          }}
          className="kp-sidebar-close-btn"
          aria-label="Close menu"
        >×</button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 8px 22px', cursor: 'pointer' }} onClick={() => nav('/')}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Kupiku Coffee</div>
            <div className="kp-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>Staff Portal</div>
          </div>
        </div>

        <div className="kp-eyebrow" style={{ padding: '4px 8px', fontSize: 10 }}>Workspace</div>
        <nav style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV.map((item) => {
            const active = item.id === 'profile'
              ? loc.pathname === '/staff/profile'
              : loc.pathname.includes(item.id);
            return (
              <div key={item.id} onClick={() => nav(`/staff/${item.id}`)} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '9px 10px', borderRadius: 8,
                background: active ? 'rgba(107,79,58,0.18)' : 'transparent',
                border: active ? '1px solid rgba(107,79,58,0.3)' : '1px solid transparent',
                color: active ? 'var(--text)' : 'var(--text-muted)',
                fontSize: 13, cursor: 'pointer',
              }}>
                <NavIcon name={item.icon} active={active} />
                <span style={{ flex: 1 }}>{item.label}</span>
              </div>
            );
          })}
        </nav>

        <div style={{ flex: 1 }} />

        <button
          type="button"
          onClick={() => { setSidebarOpen(false); setIsLogoutOpen(true); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '9px 10px', borderRadius: 8,
            background: 'transparent', border: '1px solid transparent',
            color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer',
            textAlign: 'left', marginBottom: 10,
          }}
        >
          <NavIcon name="logout" />
          <span>Logout</span>
        </button>

        <div style={{ padding: 12, borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--good)', boxShadow: '0 0 0 3px rgba(122,143,106,0.18)' }} />
            <span className="kp-mono" style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>ON DUTY</span>
          </div>
          <div className="kp-mono" style={{ fontSize: 11, color: 'var(--text)' }}>Shift active</div>
        </div>
      </aside>

      <main className="kp-admin-main-wrap" style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Mobile top bar */}
        <div style={{
          display: 'none', padding: '12px 18px',
          borderBottom: '1px solid var(--line)',
          alignItems: 'center', gap: 12,
          background: '#0B0B0B',
        }} className="kp-admin-mobile-bar">
          <button
            onClick={() => setSidebarOpen(s => !s)}
            style={{
              width: 36, height: 36, borderRadius: 8, border: '1px solid var(--line)',
              background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
            }}
          >☰</button>
          <span style={{ fontWeight: 600, fontSize: 14 }}>Staff Portal</span>
        </div>
        <div style={{
          padding: '18px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid var(--line)',
        }}>
          <div>
            <div className="kp-eyebrow" style={{ fontSize: 10 }}>Staff Portal</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>{displayName}</div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div
              onClick={() => nav('/staff/profile')}
              style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'linear-gradient(135deg, #6B4F3A, #2B2010)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 600, color: 'var(--text)', cursor: 'pointer',
              }}
            >
              {initials}
            </div>
          </div>
        </div>

        <StaffSearchContext.Provider value={{ search, setSearch }}>
          {children}
        </StaffSearchContext.Provider>
      </main>

      {isLogoutOpen && (
        <div
          role="presentation"
          onClick={() => setIsLogoutOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(8,10,12,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 60, padding: 16,
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(480px, 100%)', background: 'var(--surface)',
              border: '1px solid var(--line)', borderRadius: 16, padding: 22,
              boxShadow: '0 30px 60px rgba(0,0,0,0.45)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <div className="kp-eyebrow" style={{ fontSize: 10 }}>Konfirmasi</div>
                <h2 style={{ margin: '6px 0 0', fontSize: 18 }}>Yakin akan logout?</h2>
              </div>
              <button className="kp-btn kp-btn-ghost" onClick={() => setIsLogoutOpen(false)}>Tutup</button>
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              Kamu akan keluar dari akun staff dan kembali ke halaman utama.
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
              <button className="kp-btn kp-btn-ghost" onClick={() => setIsLogoutOpen(false)}>Batal</button>
              <button className="kp-btn" onClick={handleLogout}>Iya, logout</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
