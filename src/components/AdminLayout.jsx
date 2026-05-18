import React from 'react';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import NavIcon from './NavIcon.jsx';

const NAV = [
  { id: 'menu', label: 'Menu', icon: 'cup', path: '/admin' },
  { id: 'stock', label: 'Stock', icon: 'box', path: '/admin/stock' },
  { id: 'staff', label: 'Staff', icon: 'people', path: '/admin/staff' },
];

export default function AdminLayout({ children }) {
  const nav = useNavigate();
  const loc = useLocation();
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);

  function handleBrandClick() {
    if (loc.pathname === '/admin' && typeof window !== 'undefined') {
      const el = document.getElementById('maps');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
    nav('/admin');
  }

  function openLogoutModal() {
    setIsLogoutOpen(true);
  }

  function closeLogoutModal() {
    setIsLogoutOpen(false);
  }

  function handleLogout() {
    localStorage.removeItem('kupiku_user');
    localStorage.removeItem('kupiku_token');
    nav('/');
  }

  return (
    <div className="kp" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <aside style={{
        width: 232, flex: 'none', background: '#0B0B0B',
        borderRight: '1px solid var(--line)', padding: '22px 14px',
        display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden'
      }}>
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 8px 22px', cursor: 'pointer' }}
          onClick={handleBrandClick}
        >
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Kupiku Coffee</div>
            <div className="kp-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>Yogyakarta</div>
          </div>
        </div>

        <div className="kp-eyebrow" style={{ padding: '4px 8px', fontSize: 10 }}>Workspace</div>
        <nav style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV.map((item) => {
            const active = loc.pathname === item.path;
            return (
              <div
                key={item.id}
                onClick={() => nav(item.path)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '9px 10px', borderRadius: 8,
                  background: active ? 'rgba(107,79,58,0.18)' : 'transparent',
                  border: active ? '1px solid rgba(107,79,58,0.3)' : '1px solid transparent',
                  color: active ? 'var(--text)' : 'var(--text-muted)',
                  fontSize: 13, cursor: 'pointer'
                }}
              >
                <NavIcon name={item.icon} active={active} />
                <span style={{ flex: 1 }}>{item.label}</span>
              </div>
            );
          })}
        </nav>

        <div style={{ flex: 1 }} />

        <button
          type="button"
          onClick={openLogoutModal}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '9px 10px', borderRadius: 8,
            background: 'transparent',
            border: '1px solid transparent',
            color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer',
            textAlign: 'left'
          }}
        >
          <NavIcon name="logout" />
          <span>Logout</span>
        </button>

        <div style={{ marginTop: 14, padding: 12, borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--good)', boxShadow: '0 0 0 3px rgba(122,143,106,0.18)' }} />
            <span className="kp-mono" style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>STORE OPEN</span>
          </div>
          <div className="kp-mono" style={{ fontSize: 11, color: 'var(--text)' }}>07:00 — 22:00 WIB</div>
        </div>
      </aside>

      <div style={{ flex: 1, minWidth: 0, height: '100vh', overflow: 'auto' }}>{children}</div>

      {isLogoutOpen && (
        <div
          role="presentation"
          onClick={closeLogoutModal}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(8,10,12,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 60,
            padding: 16,
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(480px, 100%)',
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: 16,
              padding: 22,
              boxShadow: '0 30px 60px rgba(0,0,0,0.45)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <div className="kp-eyebrow" style={{ fontSize: 10 }}>Konfirmasi</div>
                <h2 style={{ margin: '6px 0 0', fontSize: 18 }}>Yakin akan logout?</h2>
              </div>
              <button className="kp-btn kp-btn-ghost" onClick={closeLogoutModal}>Tutup</button>
            </div>

            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              Kamu akan keluar dari akun admin demo dan kembali ke halaman utama.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
              <button className="kp-btn kp-btn-ghost" onClick={closeLogoutModal}>Batal</button>
              <button className="kp-btn" onClick={handleLogout}>Iya, logout</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
