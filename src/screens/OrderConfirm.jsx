import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import PublicNavbar from '../components/PublicNavbar.jsx';
import api from '../lib/api.js';

const SUGAR_MAP = { less: 'less_sugar', normal: 'normal', extra: 'extra_sugar' };
const ICE_MAP   = { less: 'less_ice',  normal: 'normal', extra: 'extra_ice'  };

const TEMP_LABELS  = { hot: 'Hot', ice: 'Ice' };
const SUGAR_LABELS = { less: 'Less Sugar', normal: 'Normal Sugar', extra: 'Extra Sugar' };
const ICE_LABELS   = { less: 'Less Ice',   normal: 'Normal Ice',   extra: 'Extra Ice'  };

function customLabel(c) {
  if (!c) return '';
  return [
    TEMP_LABELS[c.temp],
    c.sugar ? SUGAR_LABELS[c.sugar] : null,
    c.temp === 'ice' && c.ice ? ICE_LABELS[c.ice] : null,
  ].filter(Boolean).join(' · ');
}

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
    message: null, // personalised below
    accent: 'var(--brown-3)',
    pulse: false,
  },
};

function StatusBar({ status }) {
  const steps = [
    { key: 'menunggu_pembayaran', label: 'Menunggu Bayar' },
    { key: 'diproses',            label: 'Diproses'       },
    { key: 'siap',                label: 'Siap Diambil'   },
    { key: 'done',                label: 'Selesai'        },
  ];
  const idx = steps.findIndex(s => s.key === status);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, width: '100%', marginBottom: 28 }}>
      {steps.map((s, i) => {
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
            {i < steps.length - 1 && (
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

export default function OrderConfirm() {
  const nav = useNavigate();
  const { items, total, clearCart } = useCart();

  const raw  = localStorage.getItem('kupiku_user');
  const user = raw ? (() => { try { return JSON.parse(raw); } catch { return null; } })() : null;

  const [snapshot] = useState(() => ({ items: [...items], total }));
  const [creating, setCreating] = useState(true);
  const [createError, setCreateError] = useState(null);
  const [orderCode, setOrderCode]     = useState(null);
  const [orderStatus, setOrderStatus] = useState('menunggu_pembayaran');

  const pollRef    = useRef(null);
  const hasPosted  = useRef(false);

  // ── Create order on mount ──────────────────────────────────────────────────
  useEffect(() => {
    if (!user) {
      nav('/login', { state: { next: '/order/confirm' } });
      return;
    }
    if (hasPosted.current) return;
    hasPosted.current = true;

    const token = localStorage.getItem('kupiku_token');

    const payload = {
      items: snapshot.items.map(item => ({
        id_menu:      item.id_menu ?? item.id,
        suhu:         item.customization?.temp || 'ice',
        tingkat_gula: SUGAR_MAP[item.customization?.sugar] || 'normal',
        tingkat_es:   item.customization?.temp === 'ice'
          ? (ICE_MAP[item.customization?.ice] || 'normal')
          : null,
      })),
    };

    api.post('/pesanan', payload, { headers: { Authorization: `Bearer ${token}` } })
      .then(data => {
        if (data.kode_pesanan) {
          setOrderCode(data.kode_pesanan);
          localStorage.setItem('kupiku_last_order', data.kode_pesanan);
          clearCart();
        } else {
          setCreateError(data.message || 'Gagal membuat pesanan.');
        }
      })
      .catch(err => setCreateError(err.message || 'Koneksi ke server gagal.'))
      .finally(() => setCreating(false));
  }, []); // eslint-disable-line

  // ── Poll status after order created ───────────────────────────────────────
  useEffect(() => {
    if (!orderCode) return;

    const poll = async () => {
      try {
        const data = await api.get(`/pesanan/${orderCode}`);
        const s = data?.status;
        if (s) setOrderStatus(s);
        if (s === 'done') clearInterval(pollRef.current);
      } catch { /* silent */ }
    };

    poll();
    pollRef.current = setInterval(poll, 5000);
    return () => clearInterval(pollRef.current);
  }, [orderCode]);

  // ── Loading / error screens ────────────────────────────────────────────────
  if (creating) return (
    <div className="kp" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ color: 'var(--text-muted)', fontSize: 15 }}>Memproses pesanan…</div>
    </div>
  );

  if (createError) return (
    <div className="kp" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 16 }}>
      <div style={{ color: '#e05a5a', fontSize: 15 }}>{createError}</div>
      <button className="kp-btn kp-btn-ghost" onClick={() => nav('/order')}>← Kembali</button>
    </div>
  );

  // ── Success screen ─────────────────────────────────────────────────────────
  const firstName = user?.name ? user.name.split(' ')[0] : 'Kamu';
  const info = STATUS_INFO[orderStatus] || STATUS_INFO.menunggu_pembayaran;
  const isDone = orderStatus === 'done';

  return (
    <div className="kp" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <PublicNavbar />

      {/* Ambient */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(circle at 50% 30%, rgba(107,79,58,0.14), transparent 55%)',
      }} />

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '48px 24px', textAlign: 'center',
        position: 'relative', zIndex: 1,
      }}>

        {/* Coffee glyph */}
        <div style={{
          width: 72, height: 72, borderRadius: '50%', marginBottom: 24, flexShrink: 0,
          background: 'radial-gradient(circle at 35% 30%, #2B2010, #15100A 60%, #0A0805)',
          border: '1px solid var(--line-strong)',
          boxShadow: 'var(--shadow-lg), inset 0 4px 16px rgba(0,0,0,0.6)',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute', inset: 10, borderRadius: '50%',
            background: 'radial-gradient(ellipse at 30% 25%, rgba(168,131,95,0.45), rgba(74,53,39,0.6) 50%, rgba(20,14,9,0.9))',
          }} />
        </div>

        {/* Eyebrow */}
        <div className="kp-eyebrow" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
          <span style={{ width: 18, height: 1, background: 'var(--brown-2)' }} />
          Pesanan diterima
          <span style={{ width: 18, height: 1, background: 'var(--brown-2)' }} />
        </div>

        {/* Title */}
        {isDone ? (
          <>
            <h1 className="kp-display" style={{ fontSize: 48, lineHeight: 1.05, margin: '0 0 8px' }}>Selamat menikmati,</h1>
            <h1 className="kp-display" style={{ fontSize: 48, lineHeight: 1.05, margin: '0 0 32px', fontStyle: 'italic', color: 'var(--brown-3)' }}>
              {firstName}!
            </h1>
          </>
        ) : (
          <>
            <h1 className="kp-display" style={{ fontSize: 48, lineHeight: 1.05, margin: '0 0 8px' }}>Terima kasih,</h1>
            <h1 className="kp-display" style={{ fontSize: 48, lineHeight: 1.05, margin: '0 0 32px', fontStyle: 'italic', color: 'var(--brown-3)' }}>
              {firstName}!
            </h1>
          </>
        )}

        {/* ── Status timeline ── */}
        <div style={{ width: '100%', maxWidth: 480, marginBottom: 24 }}>
          <StatusBar status={orderStatus} />
        </div>

        {/* ── Status message card ── */}
        <div style={{
          maxWidth: 480, width: '100%', padding: '20px 24px',
          background: `rgba(${info.accent.startsWith('#') ? hexToRgb(info.accent) : '107,79,58'}, 0.1)`,
          border: `1px solid ${info.accent}44`,
          borderRadius: 'var(--radius)', marginBottom: 24,
          transition: 'all 400ms ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            {info.pulse && (
              <span style={{
                width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                background: info.accent,
                boxShadow: `0 0 0 3px ${info.accent}33`,
                animation: 'kp-pulse 1.6s ease-in-out infinite',
              }} />
            )}
            {!info.pulse && (
              <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: info.accent }} />
            )}
            <div className="kp-mono" style={{
              fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: info.accent,
            }}>
              {info.label}
            </div>
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--text-muted)' }}>
            {isDone
              ? 'Pesananmu sudah diambil. Sampai jumpa lagi di Kupiku!'
              : info.message
            }
          </div>
        </div>

        {/* ── Order code (hidden when done) ── */}
        {!isDone && (
          <div style={{
            padding: '14px 28px', marginBottom: 10,
            background: 'var(--surface)', border: '1px solid var(--line)',
            borderRadius: 'var(--radius-sm)',
          }}>
            <div className="kp-eyebrow" style={{ fontSize: 9, marginBottom: 8, textAlign: 'center' }}>
              Kode Pesanan
            </div>
            <div className="kp-mono" style={{
              fontSize: 26, letterSpacing: '0.16em', color: 'var(--brown-3)', fontWeight: 700,
            }}>
              {orderCode}
            </div>
          </div>
        )}

        {!isDone && (
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 12 }}>
            Tunjukkan kode ini ke kasir
          </div>
        )}

        {!isDone && (
          <button
            className="kp-btn kp-btn-ghost kp-btn-sm"
            style={{ marginBottom: 24, fontSize: 12 }}
            onClick={() => nav('/track')}
          >
            Lacak pesanan ini kapan saja →
          </button>
        )}

        {/* ── Order summary ── */}
        {snapshot.items.length > 0 && !isDone && (
          <div style={{
            width: '100%', maxWidth: 480, textAlign: 'left',
            background: 'var(--surface)', border: '1px solid var(--line)',
            borderRadius: 'var(--radius)', padding: '18px 22px', marginBottom: 28,
          }}>
            <div className="kp-eyebrow" style={{ fontSize: 9, marginBottom: 14 }}>Ringkasan pesanan</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {snapshot.items.map((item, idx) => (
                <div key={item.cartId} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                  padding: '10px 0',
                  borderBottom: idx < snapshot.items.length - 1 ? '1px solid var(--line)' : 'none',
                  gap: 12,
                }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{item.name}</div>
                    <div className="kp-mono" style={{
                      fontSize: 10, color: 'var(--text-muted)',
                      textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 3,
                    }}>
                      {customLabel(item.customization)}
                    </div>
                  </div>
                  <span className="kp-mono" style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>
                    Rp {item.price.toLocaleString('id-ID')}
                  </span>
                </div>
              ))}
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
              paddingTop: 14, marginTop: 2, borderTop: '1px solid var(--line-strong)',
            }}>
              <span className="kp-mono" style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total</span>
              <span className="kp-mono" style={{ fontSize: 16, color: 'var(--brown-3)', fontWeight: 700 }}>
                Rp {snapshot.total.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        )}

        <button className="kp-btn kp-btn-ghost" onClick={() => nav('/menu')}>
          ← Kembali ke Menu
        </button>
      </div>

      <style>{`
        @keyframes kp-pulse {
          0%, 100% { box-shadow: 0 0 0 3px transparent; }
          50% { box-shadow: 0 0 0 5px ${STATUS_INFO[orderStatus]?.accent || '#C5895A'}33; }
        }
      `}</style>
    </div>
  );
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}
