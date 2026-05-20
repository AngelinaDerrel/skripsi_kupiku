import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PublicNavbar from '../components/PublicNavbar.jsx';
import api from '../lib/api.js';

const STATUS_INFO = {
  menunggu_pembayaran: {
    label: 'Menunggu Pembayaran',
    message: 'Tunjukkan kode pesanan di bawah ke kasir dan lakukan pembayaran.',
    accent: '#C5895A',
    pulse: true,
  },
  diproses: {
    label: 'Pesanan Diproses',
    message: 'Pembayaran dikonfirmasi! Barista kami sedang menyiapkan pesananmu.',
    accent: '#6B8FA8',
    pulse: true,
  },
  siap: {
    label: 'Pesanan Siap Diambil',
    message: 'Pesananmu sudah siap! Silakan ambil di meja pengambilan.',
    accent: '#7A8F6A',
    pulse: false,
  },
  done: {
    label: 'Selesai',
    message: 'Pesananmu sudah diambil. Sampai jumpa lagi di Kupiku!',
    accent: 'var(--brown-3)',
    pulse: false,
  },
};

const STEPS = [
  { key: 'menunggu_pembayaran', label: 'Menunggu Bayar' },
  { key: 'diproses',            label: 'Diproses'       },
  { key: 'siap',                label: 'Siap Diambil'   },
  { key: 'done',                label: 'Selesai'        },
];

const STATUS_ORDER = ['menunggu_pembayaran', 'diproses', 'siap', 'done'];

function hexToRgb(hex) {
  if (!hex.startsWith('#')) return '107,79,58';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

function StatusBar({ status }) {
  const idx = STEPS.findIndex(s => s.key === status);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, width: '100%', marginBottom: 28 }}>
      {STEPS.map((s, i) => {
        const done    = i <= idx;
        const current = i === idx;
        const info    = STATUS_INFO[s.key] || {};
        return (
          <React.Fragment key={s.key}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: '0 0 auto' }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: done ? (current ? info.accent : 'rgba(168,131,95,0.35)') : 'var(--surface-3)',
                border: `2px solid ${done ? (current ? info.accent : 'rgba(168,131,95,0.5)') : 'var(--line-strong)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 400ms ease',
              }}>
                {done && !current && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="var(--brown-3)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                {current && (
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />
                )}
              </div>
              <div className="kp-mono" style={{
                fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.07em',
                color: current ? info.accent : (done ? 'var(--text-muted)' : 'var(--text-dim)'),
                whiteSpace: 'nowrap',
              }}>
                {s.label}
              </div>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{
                flex: 1, height: 2, margin: '0 6px', marginBottom: 22,
                background: i < idx ? 'rgba(168,131,95,0.4)' : 'var(--line)',
                transition: 'background 400ms ease',
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function OrderTracking() {
  const nav = useNavigate();

  const raw  = localStorage.getItem('kupiku_user');
  const user = raw ? (() => { try { return JSON.parse(raw); } catch { return null; } })() : null;
  const token = localStorage.getItem('kupiku_token');

  // Redirect if not logged in
  useEffect(() => {
    if (!user || !token) {
      nav('/login', { state: { next: '/track' }, replace: true });
    }
  }, []); // eslint-disable-line

  const [orders, setOrders]           = useState([]);
  const [selectedCode, setSelectedCode] = useState(null);
  const [liveStatus, setLiveStatus]   = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  const [errorList, setErrorList]     = useState(null);

  const pollRef = useRef(null);

  // ── Fetch customer's own orders ───────────────────────────────────────────
  useEffect(() => {
    if (!user || !token) return;

    api.get('/pesanan/saya', { headers: { Authorization: `Bearer ${token}` } })
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setOrders(list);

        // Auto-select: first non-done order, otherwise first order
        const active = list.find(o => o.status !== 'done');
        const pick   = active ?? list[0] ?? null;
        if (pick) {
          setSelectedCode(pick.kode_pesanan);
          setLiveStatus(pick.status);
        }
      })
      .catch(() => setErrorList('Gagal memuat pesanan. Coba muat ulang halaman.'))
      .finally(() => setLoadingList(false));
  }, []); // eslint-disable-line

  // ── Poll selected order's status ─────────────────────────────────────────
  useEffect(() => {
    clearInterval(pollRef.current);
    if (!selectedCode || liveStatus === 'done') return;

    const poll = async () => {
      try {
        const data = await api.get(`/pesanan/${selectedCode}`);
        if (data?.status) {
          setLiveStatus(data.status);
          // Update status in orders list too
          setOrders(prev => prev.map(o =>
            o.kode_pesanan === selectedCode ? { ...o, status: data.status } : o
          ));
          if (data.status === 'done') clearInterval(pollRef.current);
        }
      } catch { /* silent */ }
    };

    poll();
    pollRef.current = setInterval(poll, 5000);
    return () => clearInterval(pollRef.current);
  }, [selectedCode]); // eslint-disable-line

  const handleSelectOrder = (code) => {
    clearInterval(pollRef.current);
    const order = orders.find(o => o.kode_pesanan === code);
    setSelectedCode(code);
    setLiveStatus(order?.status ?? null);
  };

  // ── Guards ────────────────────────────────────────────────────────────────
  if (!user || !token) return null;

  const firstName = user?.name ? user.name.split(' ')[0] : 'Kamu';
  const selectedOrder = orders.find(o => o.kode_pesanan === selectedCode);
  const effectiveStatus = liveStatus ?? selectedOrder?.status ?? 'menunggu_pembayaran';
  const info   = STATUS_INFO[effectiveStatus] || STATUS_INFO.menunggu_pembayaran;
  const isDone = effectiveStatus === 'done';

  // Other orders (not currently selected)
  const otherOrders = orders.filter(o => o.kode_pesanan !== selectedCode);

  return (
    <div className="kp" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <PublicNavbar active="track" />

      {/* Ambient */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(circle at 50% 30%, rgba(107,79,58,0.12), transparent 55%)',
      }} />

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '48px 24px', textAlign: 'center',
        position: 'relative', zIndex: 1,
      }}>

        {/* Coffee glyph */}
        <div style={{
          width: 60, height: 60, borderRadius: '50%', marginBottom: 20, flexShrink: 0,
          background: 'radial-gradient(circle at 35% 30%, #2B2010, #15100A 60%, #0A0805)',
          border: '1px solid var(--line-strong)',
          boxShadow: 'var(--shadow-lg), inset 0 4px 16px rgba(0,0,0,0.6)',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute', inset: 8, borderRadius: '50%',
            background: 'radial-gradient(ellipse at 30% 25%, rgba(168,131,95,0.45), rgba(74,53,39,0.6) 50%, rgba(20,14,9,0.9))',
          }} />
        </div>

        {/* Eyebrow */}
        <div className="kp-eyebrow" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
          <span style={{ width: 18, height: 1, background: 'var(--brown-2)' }} />
          Pesanan {firstName}
          <span style={{ width: 18, height: 1, background: 'var(--brown-2)' }} />
        </div>

        {/* ── Loading ── */}
        {loadingList && (
          <div style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 8 }}>Memuat pesanan…</div>
        )}

        {/* ── Error ── */}
        {errorList && (
          <div style={{ color: '#e05a5a', fontSize: 14, marginTop: 8 }}>{errorList}</div>
        )}

        {/* ── No orders ── */}
        {!loadingList && !errorList && orders.length === 0 && (
          <div style={{ maxWidth: 360, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, marginTop: 8 }}>
            <h1 className="kp-display" style={{ fontSize: 36, lineHeight: 1.1, margin: 0 }}>Belum ada</h1>
            <h1 className="kp-display" style={{ fontSize: 36, lineHeight: 1.1, margin: '0 0 8px', fontStyle: 'italic', color: 'var(--brown-3)' }}>
              pesanan aktif
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.65, margin: 0 }}>
              Kamu belum memiliki pesanan. Yuk pesan kopi favoritmu sekarang!
            </p>
            <button className="kp-btn" onClick={() => nav('/menu')}>
              Pesan Sekarang
            </button>
          </div>
        )}

        {/* ── Order tracking view ── */}
        {!loadingList && selectedOrder && (
          <div style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

            {/* Title */}
            {isDone ? (
              <>
                <h1 className="kp-display" style={{ fontSize: 40, lineHeight: 1.1, margin: '0 0 4px' }}>Selamat menikmati,</h1>
                <h1 className="kp-display" style={{ fontSize: 40, lineHeight: 1.1, margin: '0 0 28px', fontStyle: 'italic', color: 'var(--brown-3)' }}>
                  {firstName}!
                </h1>
              </>
            ) : (
              <>
                <h1 className="kp-display" style={{ fontSize: 40, lineHeight: 1.1, margin: '0 0 4px' }}>Status</h1>
                <h1 className="kp-display" style={{ fontSize: 40, lineHeight: 1.1, margin: '0 0 28px', fontStyle: 'italic', color: 'var(--brown-3)' }}>
                  Pesananmu
                </h1>
              </>
            )}

            {/* Order selector — shown when customer has multiple orders */}
            {orders.length > 1 && (
              <div style={{
                width: '100%', marginBottom: 24,
                display: 'flex', flexDirection: 'column', gap: 6,
              }}>
                <div className="kp-eyebrow" style={{ fontSize: 9, textAlign: 'left', marginBottom: 4 }}>
                  Pilih Pesanan
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {orders.map(o => {
                    const isActive = o.kode_pesanan === selectedCode;
                    const statusIdx = STATUS_ORDER.indexOf(o.status);
                    const accent = STATUS_INFO[o.status]?.accent || 'var(--brown-3)';
                    return (
                      <button
                        key={o.kode_pesanan}
                        onClick={() => handleSelectOrder(o.kode_pesanan)}
                        style={{
                          padding: '7px 14px',
                          borderRadius: 999,
                          border: `1px solid ${isActive ? accent : 'var(--line-strong)'}`,
                          background: isActive ? `rgba(${accent.startsWith('#') ? hexToRgb(accent) : '107,79,58'}, 0.15)` : 'var(--surface)',
                          color: isActive ? (accent.startsWith('#') ? accent : 'var(--brown-3)') : 'var(--text-muted)',
                          fontSize: 11,
                          fontFamily: 'var(--font-mono)',
                          letterSpacing: '0.08em',
                          cursor: 'pointer',
                          transition: 'all 180ms ease',
                        }}
                      >
                        {o.kode_pesanan}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Order code — show prominently when payment pending */}
            {effectiveStatus === 'menunggu_pembayaran' && (
              <div style={{
                padding: '12px 24px', marginBottom: 24,
                background: 'var(--surface)', border: '1px solid var(--line)',
                borderRadius: 'var(--radius-sm)', textAlign: 'center',
              }}>
                <div className="kp-eyebrow" style={{ fontSize: 9, marginBottom: 8 }}>Kode Pesanan — Tunjukkan ke Kasir</div>
                <div className="kp-mono" style={{ fontSize: 26, letterSpacing: '0.16em', color: 'var(--brown-3)', fontWeight: 700 }}>
                  {selectedCode}
                </div>
              </div>
            )}

            {/* Status timeline */}
            <StatusBar status={effectiveStatus} />

            {/* Status message card */}
            <div style={{
              width: '100%', padding: '20px 24px',
              background: `rgba(${info.accent.startsWith('#') ? hexToRgb(info.accent) : '107,79,58'}, 0.1)`,
              border: `1px solid ${info.accent.startsWith('#') ? info.accent : 'var(--brown)'}44`,
              borderRadius: 'var(--radius)', marginBottom: 20,
              transition: 'all 400ms ease',
              textAlign: 'left',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  background: info.accent.startsWith('#') ? info.accent : 'var(--brown-3)',
                  ...(info.pulse ? {
                    animation: 'kp-pulse 1.6s ease-in-out infinite',
                    boxShadow: `0 0 0 3px ${info.accent.startsWith('#') ? info.accent : '#A8835F'}33`,
                  } : {}),
                }} />
                <div className="kp-mono" style={{
                  fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em',
                  color: info.accent.startsWith('#') ? info.accent : 'var(--brown-3)',
                }}>
                  {info.label}
                </div>
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--text-muted)' }}>
                {info.message}
              </div>
            </div>

            {/* Order meta: total + date */}
            <div style={{
              width: '100%',
              background: 'var(--surface)', border: '1px solid var(--line)',
              borderRadius: 'var(--radius-sm)', marginBottom: 28,
              overflow: 'hidden',
            }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                padding: '13px 18px',
                borderBottom: selectedOrder.created_at ? '1px solid var(--line)' : 'none',
              }}>
                <span className="kp-mono" style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Total Pesanan
                </span>
                <span className="kp-mono" style={{ fontSize: 16, color: 'var(--brown-3)', fontWeight: 700 }}>
                  Rp {Number(selectedOrder.total_harga).toLocaleString('id-ID')}
                </span>
              </div>
              {selectedOrder.created_at && (
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                  padding: '10px 18px',
                }}>
                  <span className="kp-mono" style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Dipesan
                  </span>
                  <span className="kp-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {formatDate(selectedOrder.created_at)}
                  </span>
                </div>
              )}
            </div>

            {/* Auto-refresh notice */}
            {!isDone && (
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--text-dim)', display: 'inline-block' }} />
                Status diperbarui otomatis setiap 5 detik
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
              {isDone && (
                <button className="kp-btn" onClick={() => nav('/menu')}>
                  Pesan Lagi
                </button>
              )}
              <button className="kp-btn kp-btn-ghost" onClick={() => nav('/menu')}>
                ← Kembali ke Menu
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes kp-pulse {
          0%, 100% { box-shadow: 0 0 0 3px transparent; }
          50% { box-shadow: 0 0 0 5px rgba(197,137,90,0.25); }
        }
      `}</style>
    </div>
  );
}
