import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';

const TEMP_LABELS = { hot: 'Hot', ice: 'Ice' };
const SUGAR_LABELS = { less: 'Less Sugar', normal: 'Normal Sugar', extra: 'Extra Sugar' };
const ICE_LABELS = { less: 'Less Ice', normal: 'Normal Ice', extra: 'Extra Ice' };

function customizationSummary(c) {
  if (!c) return '';
  const parts = [TEMP_LABELS[c.temp]].filter(Boolean);
  if (c.sugar) parts.push(SUGAR_LABELS[c.sugar]);
  if (c.temp === 'ice' && c.ice) parts.push(ICE_LABELS[c.ice]);
  return parts.join(' · ');
}

function DeleteBtn({ onClick }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title="Hapus item"
      style={{
        width: 28, height: 28, borderRadius: 6, flexShrink: 0,
        border: '1px solid ' + (hover ? 'rgba(197,139,90,0.4)' : 'var(--line)'),
        background: hover ? 'rgba(197,139,90,0.08)' : 'transparent',
        color: hover ? 'var(--warn)' : 'var(--text-dim)',
        cursor: 'pointer', fontSize: 13,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 150ms ease',
      }}
    >✕</button>
  );
}

export default function CartDrawer({ open, onClose }) {
  const { items, removeFromCart, total } = useCart();
  const nav = useNavigate();

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  function handleLanjutkan() {
    onClose();
    nav('/order');
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(2px)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 280ms ease',
        }}
      />

      {/* Drawer panel */}
      <div
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width: 400, zIndex: 51,
          background: 'var(--surface)',
          borderLeft: '1px solid var(--line)',
          boxShadow: open ? 'var(--shadow-lg)' : 'none',
          display: 'flex', flexDirection: 'column',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 280ms cubic-bezier(0.32, 0, 0.2, 1)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '24px 24px 20px',
          borderBottom: '1px solid var(--line)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexShrink: 0,
        }}>
          <div>
            <div className="kp-eyebrow" style={{ fontSize: 10, marginBottom: 6 }}>Pesanan kamu</div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 500, letterSpacing: '-0.01em' }}>
              {items.length} {items.length === 1 ? 'item' : 'item'}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              border: '1px solid var(--line-strong)',
              background: 'var(--surface-2)',
              color: 'var(--text-muted)',
              cursor: 'pointer', fontSize: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >×</button>
        </div>

        {/* Items list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {items.length === 0 ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', height: '100%', gap: 12,
              color: 'var(--text-muted)',
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'var(--surface-2)', border: '1px solid var(--line)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24,
              }}>☕</div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>Cart masih kosong</div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)', textAlign: 'center' }}>
                Pilih minuman dari menu<br />dan tambahkan ke cart
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {items.map((item, idx) => (
                <div
                  key={item.cartId}
                  style={{
                    padding: '14px 16px', borderRadius: 'var(--radius-sm)',
                    background: 'var(--surface-2)',
                    border: '1px solid var(--line)',
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                  }}
                >
                  {/* Index */}
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%',
                    background: 'rgba(107,79,58,0.18)',
                    border: '1px solid rgba(107,79,58,0.3)',
                    flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-mono)', fontSize: 11,
                    color: 'var(--brown-3)',
                  }}>
                    {idx + 1}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{item.name}</div>
                    <div className="kp-mono" style={{
                      fontSize: 10, color: 'var(--text-muted)',
                      textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1.5,
                    }}>
                      {customizationSummary(item.customization)}
                    </div>
                    <div className="kp-mono" style={{
                      fontSize: 12, color: 'var(--brown-3)', marginTop: 6,
                    }}>
                      Rp {item.price.toLocaleString('id-ID')}
                    </div>
                  </div>

                  <DeleteBtn onClick={() => removeFromCart(item.cartId)} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div style={{
            padding: '20px 24px',
            borderTop: '1px solid var(--line)',
            flexShrink: 0,
            background: 'var(--surface)',
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
              marginBottom: 16,
            }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Total ({items.length} item)
              </span>
              <span className="kp-mono" style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)' }}>
                Rp {total.toLocaleString('id-ID')}
              </span>
            </div>
            <button
              className="kp-btn"
              onClick={handleLanjutkan}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Lanjutkan Pesanan
              <span className="kp-mono" style={{ fontSize: 12 }}>→</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
}
