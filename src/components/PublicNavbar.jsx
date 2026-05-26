import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import LogoKupiku from '../assets/kupikuLogo.png';

const BASE = import.meta.env.VITE_API_URL || '/api';

export default function PublicNavbar({
  active,
  onDiscoverClick,
  onMenuClick,
  onMoodClick,
  onAdminClick,
  onOrderClick,
  showAdmin = true,
  showOrder = true,
}) {
  const nav = useNavigate();
  const loc = useLocation();
  const pathname = loc.pathname || '';
  let activeKey = active;
  if (!activeKey) {
    if (pathname === '/') activeKey = 'discover';
    else if (pathname.startsWith('/menu')) activeKey = 'menu';
    else if (pathname.startsWith('/mood')) activeKey = 'mood';
    else if (pathname.startsWith('/track')) activeKey = 'track';
    else activeKey = '';
  }

  const [user, setUser] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem('kupiku_user') || ''); } catch { return null; }
  });

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '';

  async function handleLogout() {
    const token = localStorage.getItem('kupiku_token');
    try {
      await fetch(`${BASE}/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
    } catch {}
    localStorage.removeItem('kupiku_user');
    localStorage.removeItem('kupiku_token');
    setUser(null);
    nav('/');
  }

  function handleDiscover() {
    if (onDiscoverClick) return onDiscoverClick();
    nav('/');
  }

  function handleMenu() {
    if (onMenuClick) return onMenuClick();
    nav('/menu');
  }

  function handleMood() {
    if (onMoodClick) return onMoodClick();
    nav('/mood');
  }

  function handleAdmin() {
    if (onAdminClick) return onAdminClick();
    nav('/login', { state: { next: '/admin' } });
  }

  function handleOrder() {
    if (onOrderClick) return onOrderClick();
    nav('/login');
  }

  function handleTrack() {
    nav('/track');
  }

  return (
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '24px 56px', borderBottom: '1px solid var(--line)',
      position: 'relative', zIndex: 2
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', height: '100%' }} onClick={handleDiscover}>
          <img
            src={LogoKupiku}
            alt="Kupiku Logo"
            style={{ width: 130, height: 130, objectFit: 'contain', margin: '-35px 0' }}
          />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 36, fontSize: 13, color: 'var(--text-muted)' }}>
        {(() => {
          function NavItem({ children, active, onClick }) {
            const [hover, setHover] = React.useState(false);
            const defaultColor = 'var(--text-muted)';
            const activeColor = 'var(--text)';
            const style = { color: active ? activeColor : (hover ? activeColor : defaultColor), cursor: 'pointer' };
            return (
              <span
                style={style}
                onClick={onClick}
                onMouseEnter={() => setHover(true)}
                onMouseLeave={() => setHover(false)}
              >
                {children}
              </span>
            );
          }

          return (
            <>
              <NavItem active={activeKey === 'discover'} onClick={handleDiscover}>Discover</NavItem>
              <NavItem active={activeKey === 'menu'} onClick={handleMenu}>Menu</NavItem>
              <NavItem active={activeKey === 'mood'} onClick={handleMood}>Mood</NavItem>
              <NavItem active={activeKey === 'track'} onClick={handleTrack}>Track Order</NavItem>
            </>
          );
        })()}
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        {user ? (
          <>
            <div
              onClick={() => nav('/profile')}
              title={user.name}
              style={{
                width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', flexShrink: 0,
                background: 'linear-gradient(135deg, #6B4F3A, #2B2010)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: 'var(--text)',
                border: '1px solid rgba(168,131,95,0.35)',
              }}
            >
              {initials}
            </div>
            <span
              style={{ fontSize: 13, color: 'var(--text-muted)', cursor: 'pointer' }}
              onClick={() => nav('/profile')}
            >
              {user.name?.split(' ')[0]}
            </span>
            <button className="kp-btn kp-btn-sm" onClick={handleLogout}>Keluar</button>
          </>
        ) : (
          <>
            {showAdmin && (
              <span style={{ fontSize: 13, color: 'var(--text-muted)', cursor: 'pointer' }} onClick={handleAdmin}>Sign in</span>
            )}
            {showOrder && (
              <button className="kp-btn kp-btn-sm" onClick={handleOrder}>Order</button>
            )}
          </>
        )}
      </div>
    </nav>
  );
}
