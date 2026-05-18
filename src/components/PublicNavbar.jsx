import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import LogoKupiku from '../assets/kupikuLogo.png';

export default function PublicNavbar({
  active,
  onDiscoverClick,
  onMenuClick,
  onMoodClick,
  onLocationsClick,
  onAdminClick,
  onOrderClick,
  showAdmin = true,
  showOrder = true,
}) {
  const nav = useNavigate();
  const loc = useLocation();
  const activeKey = active || (loc.pathname === '/menu' ? 'menu' : 'discover');

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

  function handleLocations() {
    if (onLocationsClick) return onLocationsClick();
    if (loc.pathname === '/') {
      const el = document.getElementById('maps');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    nav('/#maps');
  }

  function handleAdmin() {
    if (onAdminClick) return onAdminClick();
    nav('/login', { state: { next: '/admin' } });
  }

  function handleOrder() {
    if (onOrderClick) return onOrderClick();
    nav('/login');
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
        <span
          style={{ color: activeKey === 'discover' ? 'var(--text)' : 'inherit', cursor: 'pointer' }}
          onClick={handleDiscover}
        >
          Discover
        </span>
        <span
          style={{ color: activeKey === 'menu' ? 'var(--text)' : 'inherit', cursor: 'pointer' }}
          onClick={handleMenu}
        >
          Menu
        </span>
        <span
          style={{ color: activeKey === 'mood' ? 'var(--text)' : 'inherit', cursor: 'pointer' }}
          onClick={handleMood}
        >
          Mood
        </span>
        <span style={{ cursor: 'pointer' }} onClick={handleLocations}>Locations</span>
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        {showAdmin && (
          <span style={{ fontSize: 13, color: 'var(--text-muted)', cursor: 'pointer' }} onClick={handleAdmin}>Admin</span>
        )}
        {showOrder && (
          <button className="kp-btn kp-btn-sm" onClick={handleOrder}>Order</button>
        )}
      </div>
    </nav>
  );
}
