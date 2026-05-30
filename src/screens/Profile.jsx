import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout.jsx';
import StaffLayout from './StaffLayout.jsx';
import NavIcon from '../components/NavIcon.jsx';
import api from '../lib/api.js';

const BASE = import.meta.env.VITE_API_URL || '/api';

const SUHU = { ice: 'Ice', hot: 'Hot' };
const GULA = { less_sugar: 'Less Sugar', normal: 'Normal', extra_sugar: 'Extra Sugar' };
const ES   = { less_ice: 'Less Ice', normal: 'Normal', extra_ice: 'Extra Ice' };

const STATUS_MAP = {
  menunggu_pembayaran: { label: 'Menunggu Pembayaran', accent: '#C5895A', bg: 'rgba(197,137,90,0.12)' },
  diproses:            { label: 'Diproses',             accent: '#6B8FA8', bg: 'rgba(107,143,168,0.12)' },
  siap:                { label: 'Siap Diambil',         accent: '#7A8F6A', bg: 'rgba(122,143,106,0.12)' },
  done:                { label: 'Selesai',               accent: '#888',    bg: 'rgba(255,255,255,0.04)' },
};

function fmtDate(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtTime(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}
function fmtRp(val) {
  return 'Rp ' + Number(val).toLocaleString('id-ID');
}

function Chip({ label, accent, bg }) {
  return (
    <span style={{
      fontSize: 9, padding: '2px 7px', borderRadius: 999,
      background: bg, border: `1px solid ${accent}55`,
      color: accent, fontFamily: 'var(--font-mono)',
      textTransform: 'uppercase', letterSpacing: '0.05em',
    }}>{label}</span>
  );
}

// ── Order Detail Modal ─────────────────────────────────────────────────────────

function OrderDetailModal({ order, onClose }) {
  const st = STATUS_MAP[order.status] || STATUS_MAP.done;

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const custRow = (label, val) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--line)' }}>
      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 500 }}>{val}</span>
    </div>
  );

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, backdropFilter: 'blur(2px)' }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '90%', maxWidth: 540, maxHeight: '88vh',
        background: 'var(--bg)', border: '1px solid var(--line)',
        borderRadius: 16, zIndex: 1001,
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 64px rgba(0,0,0,0.55)',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid var(--line)',
          background: st.bg, borderRadius: '16px 16px 0 0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div className="kp-mono" style={{ fontSize: 18, fontWeight: 700, color: st.accent, letterSpacing: '0.1em' }}>
                {order.kode_pesanan}
              </div>
              <span style={{
                fontSize: 9, padding: '2px 8px', borderRadius: 999,
                background: st.bg, border: `1px solid ${st.accent}66`,
                color: st.accent, textTransform: 'uppercase', letterSpacing: '0.06em',
                fontFamily: 'var(--font-mono)',
              }}>
                {st.label}
              </span>
            </div>
            <div className="kp-mono" style={{ fontSize: 11, color: 'var(--text-dim)' }}>
              {fmtDate(order.created_at)} · {fmtTime(order.created_at)}
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
            background: 'var(--surface)', border: '1px solid var(--line)',
            color: 'var(--text-muted)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontFamily: 'var(--font-sans)', lineHeight: 1,
          }}>×</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          <div style={{
            fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase',
            letterSpacing: '0.08em', marginBottom: 14, fontFamily: 'var(--font-mono)',
          }}>
            Detail Item — {order.items?.length || 0} produk
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(order.items || []).map((item, i) => {
              const suhuLabel = SUHU[item.suhu] || item.suhu || '—';
              const gulaLabel = GULA[item.tingkat_gula] || item.tingkat_gula || '—';
              const esLabel   = item.suhu === 'ice' ? (ES[item.tingkat_es] || item.tingkat_es || null) : null;
              return (
                <div key={i} style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--line)', background: 'var(--surface)' }}>
                  <div style={{
                    padding: '12px 16px', background: st.bg, borderBottom: '1px solid var(--line)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        width: 22, height: 22, borderRadius: '50%', background: st.accent, color: '#fff',
                        fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>{i + 1}</span>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{item.nama_menu}</span>
                    </div>
                    <span className="kp-mono" style={{ fontSize: 13, color: st.accent, fontWeight: 700 }}>
                      {fmtRp(item.harga_saat_pesan)}
                    </span>
                  </div>
                  <div style={{ padding: '10px 16px' }}>
                    {custRow('Suhu', suhuLabel)}
                    {custRow('Tingkat Gula', gulaLabel)}
                    {esLabel && custRow('Tingkat Es', esLabel)}
                  </div>
                  <div style={{ padding: '8px 16px 12px', display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    <Chip label={suhuLabel} accent={st.accent} bg={st.bg} />
                    <Chip label={gulaLabel} accent={st.accent} bg={st.bg} />
                    {esLabel && <Chip label={esLabel} accent={st.accent} bg={st.bg} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--line)', background: 'var(--surface)', borderRadius: '0 0 16px 16px' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '10px 14px', background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--line)',
          }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-mono)' }}>
              Total Pembayaran
            </span>
            <span className="kp-mono" style={{ fontSize: 20, fontWeight: 700 }}>{fmtRp(order.total_harga)}</span>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Order Row ──────────────────────────────────────────────────────────────────

function OrderRow({ order, onDetail }) {
  const [hovered, setHovered] = useState(false);
  const st = STATUS_MAP[order.status] || STATUS_MAP.done;
  return (
    <div
      onClick={() => onDetail(order)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '14px 18px', borderRadius: 10, cursor: 'pointer',
        background: hovered ? 'var(--surface-2)' : 'var(--surface)',
        border: `1px solid ${hovered ? st.accent + '55' : 'var(--line)'}`,
        transition: 'all 140ms ease',
        transform: hovered ? 'translateY(-1px)' : 'none',
        boxShadow: hovered ? `0 4px 16px rgba(0,0,0,0.2), 0 0 0 1px ${st.accent}33` : 'none',
      }}
    >
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: st.accent, flexShrink: 0, boxShadow: `0 0 0 3px ${st.accent}22` }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="kp-mono" style={{ fontSize: 13, fontWeight: 700, color: st.accent, letterSpacing: '0.08em' }}>
          {order.kode_pesanan}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
          {fmtDate(order.created_at)} · {fmtTime(order.created_at)}
        </div>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0, minWidth: 60, textAlign: 'right' }}>
        {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
      </div>
      <div className="kp-mono" style={{ fontSize: 13, fontWeight: 700, flexShrink: 0, minWidth: 90, textAlign: 'right' }}>
        {fmtRp(order.total_harga)}
      </div>
      <span style={{
        fontSize: 9, padding: '3px 9px', borderRadius: 999,
        background: st.bg, border: `1px solid ${st.accent}44`,
        color: st.accent, textTransform: 'uppercase', letterSpacing: '0.06em',
        fontFamily: 'var(--font-mono)', flexShrink: 0,
      }}>
        {st.label}
      </span>
      <span style={{ color: hovered ? st.accent : 'var(--text-dim)', fontSize: 14, transition: 'color 140ms', flexShrink: 0 }}>›</span>
    </div>
  );
}

// ── Riwayat Pesanan Tab ────────────────────────────────────────────────────────

function RiwayatPesanan({ token }) {
  const [orders, setOrders]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [selected, setSelected]   = useState(null);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    api.get('/pesanan/saya', { headers: { Authorization: `Bearer ${token}` } })
      .then(data => setOrders(Array.isArray(data) ? data : []))
      .catch(err => setError(err.message || 'Gagal memuat riwayat'))
      .finally(() => setLoading(false));
  }, [token]);

  const doneCount   = orders.filter(o => o.status === 'done').length;
  const activeCount = orders.filter(o => o.status !== 'done').length;

  return (
    <>
      <div style={{ marginBottom: 6 }}>
        <div className="kp-eyebrow" style={{ fontSize: 10, marginBottom: 4 }}>Akun · Riwayat</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Riwayat Pesanan</h1>
          {!loading && !error && orders.length > 0 && (
            <span className="kp-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {orders.length} total · {activeCount} aktif · {doneCount} selesai
            </span>
          )}
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)', fontSize: 13 }}>
          Memuat riwayat pesanan…
        </div>
      )}

      {!loading && error && (
        <div style={{
          padding: '12px 16px', borderRadius: 8, fontSize: 13,
          background: 'rgba(224,90,90,0.1)', border: '1px solid rgba(224,90,90,0.3)', color: '#e05a5a',
        }}>
          {error}
        </div>
      )}

      {!loading && !error && orders.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '80px 0',
          border: '1px solid var(--line)', borderRadius: 12,
          background: 'var(--surface)',
        }}>
          <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.2 }}>☕</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Belum ada pesanan</div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 6 }}>
            Pesananmu akan muncul di sini setelah transaksi pertama.
          </div>
        </div>
      )}

      {!loading && !error && orders.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {orders.map(order => (
            <OrderRow key={order.kode_pesanan} order={order} onDetail={setSelected} />
          ))}
        </div>
      )}

      {selected && <OrderDetailModal order={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

// ── Profil Tab ─────────────────────────────────────────────────────────────────

function ProfilTab({ storedUser, token, onNameUpdate }) {
  const [name, setName]           = useState(storedUser?.name || '');
  const [nameMsg, setNameMsg]     = useState(null);
  const [nameLoading, setNameLoading] = useState(false);

  const [currentPw, setCurrentPw]   = useState('');
  const [newPw, setNewPw]           = useState('');
  const [confirmPw, setConfirmPw]   = useState('');
  const [pwMsg, setPwMsg]           = useState(null);
  const [pwLoading, setPwLoading]   = useState(false);

  const initials = (storedUser?.name || 'U')
    .split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  async function handleUpdateName(e) {
    e.preventDefault();
    setNameLoading(true); setNameMsg(null);
    try {
      const res = await fetch(`${BASE}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal update profil');
      localStorage.setItem('kupiku_user', JSON.stringify({ ...storedUser, name: data.user.name }));
      onNameUpdate(data.user.name);
      setNameMsg({ type: 'success', text: 'Username berhasil diperbarui.' });
    } catch (err) {
      setNameMsg({ type: 'error', text: err.message });
    } finally {
      setNameLoading(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    if (newPw !== confirmPw) { setPwMsg({ type: 'error', text: 'Password baru tidak cocok.' }); return; }
    setPwLoading(true); setPwMsg(null);
    try {
      const res = await fetch(`${BASE}/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ current_password: currentPw, password: newPw, password_confirmation: confirmPw }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal ganti password');
      setPwMsg({ type: 'success', text: 'Password berhasil diubah.' });
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
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
  const card = {
    padding: 20, borderRadius: 12,
    background: 'var(--surface)', border: '1px solid var(--line)',
  };

  return (
    <>
      <div className="kp-eyebrow" style={{ fontSize: 10, marginBottom: 4 }}>Akun · Profil</div>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 24px' }}>Informasi Akun</h1>

      {/* Info card */}
      <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 20, marginBottom: 16 }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, #6B4F3A, #2B2010)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, fontWeight: 700, color: 'var(--text)',
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
          customer
        </span>
      </div>

      {/* Two column */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
        <div style={card}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Update Username</div>
          <form onSubmit={handleUpdateName}>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Nama / Username</label>
              <input value={name} onChange={e => setName(e.target.value)} required style={inputStyle} />
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

        <div style={card}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Ganti Password</div>
          <form onSubmit={handleChangePassword}>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Password Saat Ini</label>
              <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} required style={inputStyle} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Password Baru</label>
              <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} required minLength={8} style={inputStyle} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Konfirmasi Password Baru</label>
              <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} required style={inputStyle} />
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
    </>
  );
}

// ── Customer Profile Layout ────────────────────────────────────────────────────

function CustomerProfile({ storedUser, token, onLogout }) {
  const nav = useNavigate();
  const [activeTab, setActiveTab] = useState('profil');
  const [displayName, setDisplayName] = useState(storedUser?.name || '');
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);

  const initials = displayName
    .split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || 'U';

  const NAV_ITEMS = [
    { id: 'profil',  label: 'Profil',           icon: 'user'   },
    { id: 'riwayat', label: 'Riwayat Pesanan',  icon: 'ticket' },
  ];

  return (
    <div className="kp" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: 232, flex: 'none', background: '#0B0B0B',
        borderRight: '1px solid var(--line)', padding: '22px 14px',
        display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden',
      }}>
        {/* User card — top */}
        <div style={{ padding: '4px 8px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #6B4F3A, #2B2010)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: 'var(--text)',
            }}>
              {initials}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {displayName}
              </div>
              <div className="kp-mono" style={{ fontSize: 10, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {storedUser?.email}
              </div>
            </div>
          </div>
        </div>

        {/* Back to home */}
        <button
          onClick={() => nav('/')}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 10px', borderRadius: 8, marginBottom: 6,
            background: 'transparent', border: '1px solid var(--line)',
            color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer',
            textAlign: 'left', fontFamily: 'var(--font-sans)',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M10 13L5 8l5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Kembali ke Beranda
        </button>

        <div className="kp-eyebrow" style={{ padding: '12px 8px 6px', fontSize: 10 }}>Menu</div>

        {/* Nav */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV_ITEMS.map(item => {
            const active = activeTab === item.id;
            return (
              <div
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '9px 10px', borderRadius: 8,
                  background: active ? 'rgba(107,79,58,0.18)' : 'transparent',
                  border: active ? '1px solid rgba(107,79,58,0.3)' : '1px solid transparent',
                  color: active ? 'var(--text)' : 'var(--text-muted)',
                  fontSize: 13, cursor: 'pointer', transition: 'all 130ms ease',
                }}
              >
                <NavIcon name={item.icon} active={active} />
                <span style={{ flex: 1 }}>{item.label}</span>
              </div>
            );
          })}
        </nav>

        <div style={{ flex: 1 }} />

        {/* Logout */}
        <button
          onClick={() => setIsLogoutOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '9px 10px', borderRadius: 8,
            background: 'transparent', border: '1px solid transparent',
            color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer',
            textAlign: 'left', fontFamily: 'var(--font-sans)',
          }}
        >
          <NavIcon name="logout" />
          <span>Logout</span>
        </button>
      </aside>

      {/* ── Main content ── */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '40px 48px' }}>
        {activeTab === 'profil' && (
          <ProfilTab
            storedUser={{ ...storedUser, name: displayName }}
            token={token}
            onNameUpdate={setDisplayName}
          />
        )}
        {activeTab === 'riwayat' && (
          <RiwayatPesanan token={token} />
        )}
      </main>

      {/* ── Logout confirm dialog ── */}
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
            onClick={e => e.stopPropagation()}
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
              Kamu akan keluar dari akun dan kembali ke halaman utama.
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
              <button className="kp-btn kp-btn-ghost" onClick={() => setIsLogoutOpen(false)}>Batal</button>
              <button className="kp-btn" onClick={onLogout}>Iya, logout</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────

export default function Profile() {
  const nav = useNavigate();
  const token = localStorage.getItem('kupiku_token');
  const raw = localStorage.getItem('kupiku_user');
  const storedUser = raw ? JSON.parse(raw) : {};
  const role = storedUser?.role;

  async function handleLogout() {
    try {
      await fetch(`${BASE}/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
    } catch {}
    localStorage.removeItem('kupiku_user');
    localStorage.removeItem('kupiku_token');
    nav('/');
  }

  const isCustomer = !['admin', 'owner', 'staff'].includes(role);

  if (isCustomer) {
    return <CustomerProfile storedUser={storedUser} token={token} onLogout={handleLogout} />;
  }

  // ── Staff / Admin layout (unchanged) ──
  const [name, setName]           = React.useState(storedUser?.name || '');
  const [nameMsg, setNameMsg]     = React.useState(null);
  const [nameLoading, setNameLoading] = React.useState(false);
  const [currentPw, setCurrentPw] = React.useState('');
  const [newPw, setNewPw]         = React.useState('');
  const [confirmPw, setConfirmPw] = React.useState('');
  const [pwMsg, setPwMsg]         = React.useState(null);
  const [pwLoading, setPwLoading] = React.useState(false);

  const initials = (storedUser?.name || 'U')
    .split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  async function handleUpdateName(e) {
    e.preventDefault(); setNameLoading(true); setNameMsg(null);
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
    } finally { setNameLoading(false); }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    if (newPw !== confirmPw) { setPwMsg({ type: 'error', text: 'Password baru tidak cocok.' }); return; }
    setPwLoading(true); setPwMsg(null);
    try {
      const res = await fetch(`${BASE}/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ current_password: currentPw, password: newPw, password_confirmation: confirmPw }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal ganti password');
      setPwMsg({ type: 'success', text: 'Password berhasil diubah.' });
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (err) {
      setPwMsg({ type: 'error', text: err.message });
    } finally { setPwLoading(false); }
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

  const profileCards = (
    <>
      <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20 }}>
        <div style={{
          width: 60, height: 60, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, #6B4F3A, #2B2010)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, fontWeight: 700, color: 'var(--text)',
        }}>{initials}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{storedUser?.name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{storedUser?.email}</div>
        </div>
        <span style={{
          fontSize: 10, padding: '3px 10px', borderRadius: 20,
          background: 'rgba(107,79,58,0.2)', border: '1px solid rgba(107,79,58,0.3)',
          color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em',
        }}>{role}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
        <div style={cardStyle}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Update Username</div>
          <form onSubmit={handleUpdateName}>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Nama / Username</label>
              <input value={name} onChange={e => setName(e.target.value)} required style={inputStyle} />
            </div>
            {nameMsg && <div style={{ fontSize: 12, marginBottom: 12, color: nameMsg.type === 'success' ? 'var(--good)' : '#e05252' }}>{nameMsg.text}</div>}
            <button type="submit" className="kp-btn" disabled={nameLoading} style={{ fontSize: 13 }}>
              {nameLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </form>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Ganti Password</div>
          <form onSubmit={handleChangePassword}>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Password Saat Ini</label>
              <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} required style={inputStyle} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Password Baru</label>
              <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} required minLength={8} style={inputStyle} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Konfirmasi Password Baru</label>
              <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} required style={inputStyle} />
            </div>
            {pwMsg && <div style={{ fontSize: 12, marginBottom: 12, color: pwMsg.type === 'success' ? 'var(--good)' : '#e05252' }}>{pwMsg.text}</div>}
            <button type="submit" className="kp-btn" disabled={pwLoading} style={{ fontSize: 13 }}>
              {pwLoading ? 'Menyimpan...' : 'Ganti Password'}
            </button>
          </form>
        </div>
      </div>
    </>
  );

  const isAdmin = role === 'admin' || role === 'owner';
  const content = (
    <div style={{ padding: '32px 40px', maxWidth: 960 }}>
      <div className="kp-eyebrow" style={{ fontSize: 10, marginBottom: 4 }}>Akun</div>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 24px' }}>Profil Saya</h1>
      {profileCards}
    </div>
  );

  const Layout = isAdmin ? AdminLayout : StaffLayout;
  return <Layout>{content}</Layout>;
}
