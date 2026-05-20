import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import PublicNavbar from '../components/PublicNavbar.jsx';

const TEMP_LABELS = { hot: 'Hot', ice: 'Ice' };
const SUGAR_LABELS = { less: 'Less Sugar', normal: 'Normal Sugar', extra: 'Extra Sugar' };
const ICE_LABELS = { less: 'Less Ice', normal: 'Normal Ice', extra: 'Extra Ice' };

function customizationTags(c) {
  if (!c) return [];
  const tags = [TEMP_LABELS[c.temp]].filter(Boolean);
  if (c.sugar) tags.push(SUGAR_LABELS[c.sugar]);
  if (c.temp === 'ice' && c.ice) tags.push(ICE_LABELS[c.ice]);
  return tags;
}

export default function OrderSummary() {
  const nav = useNavigate();
  const { items, total } = useCart();

  const raw = localStorage.getItem('kupiku_user');
  const user = raw ? (() => { try { return JSON.parse(raw); } catch { return null; } })() : null;

  if (!user) {
    nav('/login', { state: { next: '/order' } });
    return null;
  }

  if (items.length === 0) {
    return (
      <div className="kp" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <PublicNavbar />
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 16, color: 'var(--text-muted)',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'var(--surface)', border: '1px solid var(--line)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
          }}>☕</div>
          <div style={{ fontSize: 18, fontWeight: 500, color: 'var(--text)' }}>Cart kamu kosong</div>
          <div style={{ fontSize: 14 }}>Tambahkan minuman dari menu terlebih dahulu</div>
          <button className="kp-btn" style={{ marginTop: 8 }} onClick={() => nav('/menu')}>
            Lihat Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="kp" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <PublicNavbar />

      {/* Ambient gradient */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(circle at 80% 20%, rgba(107,79,58,0.12), transparent 50%)',
      }} />

      <div style={{
        flex: 1, padding: '48px 56px', maxWidth: 760,
        margin: '0 auto', width: '100%', position: 'relative', zIndex: 1,
      }}>
        {/* Page header */}
        <div style={{ marginBottom: 36 }}>
          <div className="kp-eyebrow" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 24, height: 1, background: 'var(--brown-2)' }} />
            Detail pesanan
          </div>
          <h1 className="kp-display" style={{ fontSize: 52, lineHeight: 1, margin: '0 0 16px' }}>
            Pesanan kamu,<br />
            <span style={{ fontStyle: 'italic', color: 'var(--brown-3)' }}>sudah siap?</span>
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
            Cek kembali pesanan dan kustomisasi sebelum melanjutkan ke pembayaran.
          </p>
        </div>

        {/* Customer info strip */}
        <div style={{
          padding: '14px 18px',
          background: 'var(--surface)', border: '1px solid var(--line)',
          borderRadius: 'var(--radius-sm)',
          display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28,
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'rgba(107,79,58,0.2)', border: '1px solid rgba(107,79,58,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 600, color: 'var(--brown-3)',
            flexShrink: 0,
          }}>
            {(user.name || user.email)?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{user.name || user.email}</div>
            <div className="kp-mono" style={{
              fontSize: 10, color: 'var(--text-muted)',
              letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>
              {user.email}
            </div>
          </div>
        </div>

        {/* Order items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {items.map((item, idx) => (
            <div key={item.cartId} className="kp-card" style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  {/* Item number */}
                  <div style={{
                    width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                    background: 'rgba(107,79,58,0.15)',
                    border: '1px solid rgba(107,79,58,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-mono)', fontSize: 12,
                    color: 'var(--brown-3)',
                  }}>
                    {idx + 1}
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 10 }}>{item.name}</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {customizationTags(item.customization).map(tag => (
                        <span key={tag} className="kp-chip" style={{ fontSize: 10, padding: '3px 9px' }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="kp-mono" style={{
                  fontSize: 14, color: 'var(--text)',
                  fontWeight: 500, flexShrink: 0, paddingTop: 2,
                }}>
                  Rp {item.price.toLocaleString('id-ID')}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Total card */}
        <div style={{
          padding: '20px 24px', borderRadius: 'var(--radius)',
          background: 'var(--surface)', border: '1px solid var(--line-strong)',
          marginBottom: 28,
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-muted)' }}>
              <span>Subtotal · {items.length} item</span>
              <span className="kp-mono">Rp {total.toLocaleString('id-ID')}</span>
            </div>
            <div style={{ height: 1, background: 'var(--line)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: 15, fontWeight: 500 }}>Total Pembayaran</span>
              <span className="kp-mono" style={{
                fontSize: 22, color: 'var(--brown-3)', fontWeight: 600,
              }}>
                Rp {total.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            className="kp-btn kp-btn-ghost"
            onClick={() => nav('/menu')}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            ← Kembali ke Menu
          </button>
          <button
            className="kp-btn"
            onClick={() => nav('/order/confirm')}
            style={{ flex: 2, justifyContent: 'center' }}
          >
            Lanjutkan
            <span className="kp-mono" style={{ fontSize: 12 }}>→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
