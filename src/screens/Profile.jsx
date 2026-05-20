import React, { useState } from 'react';
import AdminLayout from '../components/AdminLayout.jsx';
import StaffLayout from './StaffLayout.jsx';

const BASE = import.meta.env.VITE_API_URL || '/api';

export default function Profile() {
  const token = localStorage.getItem('kupiku_token');
  const raw = localStorage.getItem('kupiku_user');
  const storedUser = raw ? JSON.parse(raw) : {};
  const role = storedUser?.role;

  const [name, setName] = useState(storedUser?.name || '');
  const [nameMsg, setNameMsg] = useState(null);
  const [nameLoading, setNameLoading] = useState(false);

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwMsg, setPwMsg] = useState(null);
  const [pwLoading, setPwLoading] = useState(false);

  const initials = (storedUser?.name || 'U')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  async function handleUpdateName(e) {
    e.preventDefault();
    setNameLoading(true);
    setNameMsg(null);
    try {
      const res = await fetch(`${BASE}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal update profil');
      localStorage.setItem('kupiku_user', JSON.stringify({ ...storedUser, name: data.user.name }));
      setNameMsg({ type: 'success', text: 'Username berhasil diperbarui.' });
    } catch (err) {
      setNameMsg({ type: 'error', text: err.message });
    } finally {
      setNameLoading(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    if (newPw !== confirmPw) {
      setPwMsg({ type: 'error', text: 'Password baru tidak cocok.' });
      return;
    }
    setPwLoading(true);
    setPwMsg(null);
    try {
      const res = await fetch(`${BASE}/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ current_password: currentPw, password: newPw, password_confirmation: confirmPw }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal ganti password');
      setPwMsg({ type: 'success', text: 'Password berhasil diubah.' });
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
    } catch (err) {
      setPwMsg({ type: 'error', text: err.message });
    } finally {
      setPwLoading(false);
    }
  }

  const inputStyle = {
    width: '100%', padding: '10px 12px', borderRadius: 8,
    background: '#0B0B0B', border: '1px solid var(--line)',
    color: 'var(--text)', fontSize: 13, boxSizing: 'border-box', outline: 'none',
  };

  const labelStyle = {
    display: 'block', fontSize: 11, color: 'var(--text-muted)',
    marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em',
  };

  const cardStyle = {
    marginBottom: 20, padding: 20, borderRadius: 12,
    background: 'var(--surface)', border: '1px solid var(--line)',
  };

  const content = (
    <div style={{ padding: '32px 40px', maxWidth: 960 }}>
      <div className="kp-eyebrow" style={{ fontSize: 10, marginBottom: 4 }}>Akun</div>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 24px' }}>Profil Saya</h1>

      {/* Info card — full width top */}
      <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20 }}>
        <div style={{
          width: 60, height: 60, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, #6B4F3A, #2B2010)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, fontWeight: 700, color: 'var(--text)',
        }}>
          {initials}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{storedUser?.name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{storedUser?.email}</div>
        </div>
        <span style={{
          fontSize: 10, padding: '3px 10px', borderRadius: 20,
          background: 'rgba(107,79,58,0.2)', border: '1px solid rgba(107,79,58,0.3)',
          color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em',
        }}>
          {role}
        </span>
      </div>

      {/* Two-column row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>

        {/* Update username */}
        <div style={cardStyle}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Update Username</div>
          <form onSubmit={handleUpdateName}>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Nama / Username</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required style={inputStyle} />
            </div>
            {nameMsg && (
              <div style={{ fontSize: 12, marginBottom: 12, color: nameMsg.type === 'success' ? 'var(--good)' : '#e05252' }}>
                {nameMsg.text}
              </div>
            )}
            <button type="submit" className="kp-btn" disabled={nameLoading} style={{ fontSize: 13 }}>
              {nameLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </form>
        </div>

        {/* Change password */}
        <div style={cardStyle}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Ganti Password</div>
          <form onSubmit={handleChangePassword}>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Password Saat Ini</label>
              <input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} required style={inputStyle} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Password Baru</label>
              <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} required minLength={8} style={inputStyle} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Konfirmasi Password Baru</label>
              <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} required style={inputStyle} />
            </div>
            {pwMsg && (
              <div style={{ fontSize: 12, marginBottom: 12, color: pwMsg.type === 'success' ? 'var(--good)' : '#e05252' }}>
                {pwMsg.text}
              </div>
            )}
            <button type="submit" className="kp-btn" disabled={pwLoading} style={{ fontSize: 13 }}>
              {pwLoading ? 'Menyimpan...' : 'Ganti Password'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );

  const isAdmin = role === 'admin' || role === 'owner';
  const Layout = isAdmin ? AdminLayout : StaffLayout;
  return <Layout>{content}</Layout>;
}
