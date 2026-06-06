import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import LogoKupiku from '../assets/kupikuLogo.png';
import CartDrawer from './CartDrawer.jsx';
import { useCart } from '../context/CartContext.jsx';

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
  const { items } = useCart();
  const [cartOpen, setCartOpen] = React.useState(false);
  const [trackWarning, setTrackWarning] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const pathname = loc.pathname || '';
  let activeKey = active;
  if (!activeKey) {
    if (pathname === '/') activeKey = 'discover';
    else if (pathname.startsWith('/menu')) activeKey = 'menu';
    else if (pathname.startsWith('/mood')) activeKey = 'mood';
    else if (pathname.startsWith('/track')) activeKey = 'track';
    else activeKey = '';
  }

  const [user] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem('kupiku_user') || ''); } catch { return null; }
  });

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '';

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
    if (!user) {
      setTrackWarning(true);
      setTimeout(() => setTrackWarning(false), 3000);
      return;
    }
    nav('/track');
  }

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

  function closeMobileNav() { setMenuOpen(false); }

  function mobileNav(label, onClick, isActive) {
    return (
      <div
        className={`kp-mobile-nav-item${isActive ? ' is-active' : ''}`}
        onClick={() => { closeMobileNav(); onClick(); }}
      >
        {label}
      </div>
    );
  }

  return (
    <>
      <nav className="kp-nav">
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', height: '100%' }} onClick={handleDiscover}>
            <img
              src={LogoKupiku}
              alt="Kupiku Logo"
              style={{ width: 130, height: 130, objectFit: 'contain', margin: '-35px 0' }}
            />
          </div>
        </div>

        {/* Desktop nav links */}
        <div className="kp-nav-links">
          <NavItem active={activeKey === 'discover'} onClick={handleDiscover}>Discover</NavItem>
          <NavItem active={activeKey === 'menu'} onClick={handleMenu}>Menu</NavItem>
          <NavItem active={activeKey === 'mood'} onClick={handleMood}>Mood</NavItem>
          <NavItem active={activeKey === 'track'} onClick={handleTrack}>Track Order</NavItem>
        </div>

        {/* Right actions */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {user ? (
            <>
              <button
                className="kp-btn kp-btn-sm"
                onClick={() => setCartOpen(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
              >
                Cart
                <span style={{
                  minWidth: 18, height: 18, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
                }}>
                  {items.length}
                </span>
              </button>
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
            </>
          ) : (
            <button className="kp-btn kp-btn-sm" onClick={handleAdmin}>Sign In</button>
          )}

          {/* Hamburger — visible on mobile only */}
          <button className="kp-nav-ham" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* Mobile overlay menu */}
      <div className={`kp-mobile-nav${menuOpen ? ' is-open' : ''}`}>
        <button className="kp-mobile-nav-close" onClick={closeMobileNav} aria-label="Close menu">×</button>

        {mobileNav('Discover', handleDiscover, activeKey === 'discover')}
        {mobileNav('Menu', handleMenu, activeKey === 'menu')}
        {mobileNav('Mood', handleMood, activeKey === 'mood')}
        {mobileNav('Track Order', handleTrack, activeKey === 'track')}

        <div style={{ marginTop: 32 }}>
          {user ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button
                className="kp-btn"
                onClick={() => { closeMobileNav(); setCartOpen(true); }}
                style={{ justifyContent: 'center' }}
              >
                Cart ({items.length})
              </button>
              <button
                className="kp-btn kp-btn-ghost"
                onClick={() => { closeMobileNav(); nav('/profile'); }}
                style={{ justifyContent: 'center' }}
              >
                Profil · {user.name}
              </button>
            </div>
          ) : (
            <button
              className="kp-btn"
              onClick={() => { closeMobileNav(); handleAdmin(); }}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Sign In
            </button>
          )}
        </div>
      </div>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />

      {/* Warning: belum login saat klik Track Order */}
      <div style={{
        position: 'fixed', top: 80, left: '50%', transform: `translateX(-50%) translateY(${trackWarning ? 0 : -12}px)`,
        opacity: trackWarning ? 1 : 0, pointerEvents: 'none',
        transition: 'opacity 220ms ease, transform 220ms ease',
        zIndex: 100,
        background: 'var(--surface)', border: '1px solid var(--line)',
        borderRadius: 10, padding: '12px 20px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
        fontSize: 13, color: 'var(--text)', whiteSpace: 'nowrap',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontSize: 16 }}>🔒</span>
        <span>
          <strong>Sign In</strong> terlebih dahulu untuk melihat Orderan anda
        </span>
      </div>
    </>
  );
}
