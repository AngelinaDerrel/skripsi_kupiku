import { useNavigate } from 'react-router-dom';
import { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import NavIcon from '../components/NavIcon.jsx';
import { MENU_ITEMS, MENU_CATEGORIES } from '../data/menuItems.js';

const NAV = [
  { id: 'overview', label: 'Overview', icon: 'home' },
  { id: 'menu', label: 'Menu', icon: 'cup', active: true },
  { id: 'stock', label: 'Stock', icon: 'box' },
  { id: 'staff', label: 'Staff', icon: 'people' },
//   { id: 'orders', label: 'Orders', icon: 'ticket', badge: 12 },
  { id: 'moods', label: 'Mood insights', icon: 'pulse' },
];
const NAV_BOTTOM = [
  { id: 'settings', label: 'Settings', icon: 'gear' },
  { id: 'help', label: 'Support', icon: 'help' },
  { id: 'logout', label: 'Logout', icon: 'logout' },
];

const stockDot = (s) => {
  if (s === 'High') return 'var(--good)';
  if (s === 'Medium') return 'var(--warn)';
  if (s === 'Low') return 'var(--warn)';
  return 'var(--text-dim)';
};

function CategoryFilter({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      {MENU_CATEGORIES.map((c) => {
        const active = c.id === value;
        return (
          <button key={c.id} onClick={() => onChange(c.id)} style={{
            padding: '6px 12px', borderRadius: 999, border: 'none',
            background: active ? 'rgba(107,79,58,0.12)' : 'transparent',
            boxShadow: active ? 'inset 0 0 0 1px rgba(107,79,58,0.12)' : 'none',
            fontSize: 12, color: active ? 'var(--brown-3)' : 'var(--text-muted)', cursor: 'pointer'
          }}>{c.label}</button>
        );
      })}
    </div>
  );
}

export default function Dashboard() {
  const nav = useNavigate();
  const loc = useLocation();
  const [category, setCategory] = useState('all');
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    // auto-scroll to maps when URL contains #maps
    if (typeof window !== 'undefined' && loc.hash === '#maps') {
      const el = document.getElementById('maps');
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    }
  }, [loc.hash]);

  const filtered = useMemo(() => {
    if (category === 'all') return MENU_ITEMS;
    return MENU_ITEMS.filter((m) => m.cat === category);
  }, [category]);

  const displayed = filtered.slice(0, showAll ? filtered.length : 10);

  return (
    <div className="kp" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <aside style={{
        width: 232, flex: 'none', background: '#0B0B0B',
        borderRight: '1px solid var(--line)', padding: '22px 14px',
        display: 'flex', flexDirection: 'column'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 8px 22px', cursor: 'pointer' }} onClick={() => {
          if (loc.pathname === '/admin') {
            const el = document.getElementById('maps');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            else nav('/admin');
          } else {
            nav('/admin#maps');
          }
        }}> 
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Kupiku Coffee</div>
            <div className="kp-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>Yogyakarta</div>
          </div>
        </div>

        <div className="kp-eyebrow" style={{ padding: '4px 8px', fontSize: 10 }}>Workspace</div>
        <nav style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV.map((item) => (
            <div key={item.id} onClick={() => {
              if (item.id === 'staff') nav('/admin/staff');
              else nav('/admin');
            }} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '9px 10px', borderRadius: 8,
              background: item.active ? 'rgba(107,79,58,0.18)' : 'transparent',
              border: item.active ? '1px solid rgba(107,79,58,0.3)' : '1px solid transparent',
              color: item.active ? 'var(--text)' : 'var(--text-muted)',
              fontSize: 13, cursor: 'pointer'
            }}>
              <NavIcon name={item.icon} active={item.active} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge && (
                <span className="kp-mono" style={{
                  fontSize: 10, color: 'var(--brown-3)',
                  background: 'rgba(107,79,58,0.18)',
                  padding: '2px 6px', borderRadius: 4,
                }}>{item.badge}</span>
              )}
            </div>
          ))}
        </nav>

        <div style={{ flex: 1 }} />

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV_BOTTOM.map((item) => (
            <div key={item.id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '9px 10px', borderRadius: 8,
              color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer'
            }}>
              <NavIcon name={item.icon} />
              <span>{item.label}</span>
            </div>
          ))}
        </nav>

        <div style={{ marginTop: 14, padding: 12, borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--good)', boxShadow: '0 0 0 3px rgba(122,143,106,0.18)' }} />
            <span className="kp-mono" style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>STORE OPEN</span>
          </div>
          <div className="kp-mono" style={{ fontSize: 11, color: 'var(--text)' }}>07:00 — 22:00 WIB</div>
        </div>
      </aside>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <div style={{
          padding: '18px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid var(--line)'
        }}>
          <div>
            <div className="kp-eyebrow" style={{ fontSize: 10 }}>Workspace · Menu</div>
            <h1 style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.015em', margin: '4px 0 0' }}>Menu management</h1>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8,
              background: 'var(--surface)', border: '1px solid var(--line)', width: 260
            }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="6" cy="6" r="4" stroke="var(--text-muted)" strokeWidth="1.4" />
                <path d="M9 9l3 3" stroke="var(--text-muted)" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', flex: 1 }}>Search here...</span>
              <span className="kp-mono" style={{ fontSize: 10, color: 'var(--text-dim)', border: '1px solid var(--line-strong)', padding: '1px 5px', borderRadius: 4 }}>⌘K</span>
            </div>
            {/* <button className="kp-btn kp-btn-sm kp-btn-ghost">Export CSV</button> */}
            <button className="kp-btn kp-btn-sm">+ New drink</button>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg, #6B4F3A, #2B2010)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 600, marginLeft: 8
            }}>RA</div>
          </div>
        </div>

        <div style={{ flex: 1, padding: '24px 32px', overflow: 'auto' }}>
          {/* <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
            {[
              { l: 'ACTIVE DRINKS', v: '24', d: '+2 this week', tone: 'good' },
              { l: 'ORDERS TODAY', v: '186', d: '+12% vs yest.', tone: 'good' },
              { l: 'LOW STOCK', v: '3', d: 'needs attention', tone: 'warn' },
              { l: 'TOP MOOD', v: 'Calm', d: '34% of orders', tone: 'neutral' },
            ].map((k) => (
              <div key={k.l} className="kp-card" style={{ padding: 18 }}>
                <div className="kp-eyebrow" style={{ fontSize: 10 }}>{k.l}</div>
                <div className="kp-display" style={{ fontSize: 28, marginTop: 12, lineHeight: 1 }}>{k.v}</div>
                <div style={{
                  fontSize: 11, marginTop: 10,
                  color: k.tone === 'good' ? 'var(--good)' : k.tone === 'warn' ? 'var(--warn)' : 'var(--text-muted)'
                }}>{k.d}</div>
              </div>
            ))}
          </div> */}

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span className="kp-eyebrow" style={{ fontSize: 10, marginRight: 4 }}>FILTER</span>
            <CategoryFilter value={category} onChange={setCategory} />
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{MENU_ITEMS.length} drinks · sorted by menu order</span>
          </div>

          <div className="kp-card" style={{ overflow: 'hidden' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '90px 1.4fr 0.8fr 0.9fr 0.7fr 0.9fr 0.8fr 0.7fr 50px',
              padding: '14px 18px', borderBottom: '1px solid var(--line)',
              fontSize: 11, fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase', letterSpacing: '0.08em',
              color: 'var(--text-muted)', background: 'rgba(255,255,255,0.015)'
            }}>
              <span>SKU</span><span>Drink</span><span>Category</span><span>Mood tag</span>
              <span>Price</span><span>Stock</span><span>Status</span>
              <span style={{ textAlign: 'right' }}>Orders</span><span></span>
            </div>

            {displayed.map((item, i) => {
              const catLabel = MENU_CATEGORIES.find((c) => c.id === item.cat)?.label || item.cat;
              const priceLabel = typeof item.price === 'number' ? `${item.price}k` : item.price;
              const stock = item.stock || 'High';
              const status = item.status || 'Active';
              const orders = item.orders || 0;
              return (
                <div key={item.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '90px 1.4fr 0.8fr 0.9fr 0.7fr 0.9fr 0.8fr 0.7fr 50px',
                  padding: '14px 18px',
                  borderBottom: i < displayed.length - 1 ? '1px solid var(--line)' : 'none',
                  fontSize: 13, alignItems: 'center'
                }}>
                  <span className="kp-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.id}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 6,
                      background: 'linear-gradient(135deg, rgba(107,79,58,0.4), rgba(20,14,9,0.8))',
                      border: '1px solid var(--line)'
                    }} />
                    <span style={{ fontWeight: 500 }}>{item.name}</span>
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>{catLabel}</span>
                  <span><span className="kp-chip" style={{ fontSize: 10, padding: '3px 8px' }}>{(item.mood || '').toUpperCase()}</span></span>
                  <span className="kp-mono" style={{ fontSize: 12 }}>IDR {priceLabel}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: stockDot(stock) }} />
                    <span style={{ color: stock === 'Out' ? 'var(--text-dim)' : 'var(--text)' }}>{stock}</span>
                  </span>
                  <span style={{
                    fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', textTransform: 'uppercase',
                    color: status === 'Active' ? 'var(--good)' : status === 'Draft' ? 'var(--text-muted)' : 'var(--warn)'
                  }}>● {status}</span>
                  <span className="kp-mono" style={{ fontSize: 12, textAlign: 'right' }}>{orders}</span>
                  <span style={{ textAlign: 'right', color: 'var(--text-muted)', cursor: 'pointer' }}>···</span>
                </div>
              );
            })}

            {filtered.length > 10 && (
              <div style={{ padding: 14, display: 'flex', justifyContent: 'center' }}>
                <button className="kp-btn kp-btn-ghost kp-btn-sm" onClick={() => setShowAll((s) => !s)}>{showAll ? 'Show less' : `Show ${filtered.length - 10} more`}</button>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 22 }}>
            <div className="kp-card" style={{ padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div>
                  <div className="kp-eyebrow" style={{ fontSize: 10 }}>Mood mix · last 7 days</div>
                  <div style={{ fontSize: 14, marginTop: 6, color: 'var(--text-muted)' }}>What customers asked for</div>
                </div>
                <span className="kp-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>1,284 orders</span>
              </div>
              <div style={{ display: 'flex', height: 10, borderRadius: 4, overflow: 'hidden', marginBottom: 14 }}>
                {[
                  { l: 'Calm', v: 34, c: '#A8835F' },
                  { l: 'Happy', v: 22, c: '#8A6647' },
                  { l: 'Stressed', v: 18, c: '#6B4F3A' },
                  { l: 'Neutral', v: 14, c: '#4A3527' },
                  { l: 'Sad', v: 8, c: '#383838' },
                  { l: 'Angry', v: 4, c: '#2B2B2B' },
                ].map((s) => (
                  <div key={s.l} style={{ flex: s.v, background: s.c }} />
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, fontSize: 12 }}>
                {[
                  { l: 'Calm', v: '34%' }, { l: 'Happy', v: '22%' }, { l: 'Stressed', v: '18%' },
                  { l: 'Neutral', v: '14%' }, { l: 'Sad', v: '8%' }, { l: 'Angry', v: '4%' },
                ].map((s) => (
                  <div key={s.l} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--line)', padding: '6px 0' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{s.l}</span>
                    <span className="kp-mono">{s.v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="kp-card" style={{ padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div>
                  <div className="kp-eyebrow" style={{ fontSize: 10 }}>Restock alerts</div>
                  <div style={{ fontSize: 14, marginTop: 6, color: 'var(--text-muted)' }}>3 items need a top-up</div>
                </div>
                <button className="kp-btn kp-btn-sm kp-btn-ghost">Open stock</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { n: 'Aceh Gayo beans', s: '1.2 / 8 kg', urgency: 'high' },
                  { n: 'Oat milk (Oatside)', s: '6 / 24 ctn', urgency: 'med' },
                  { n: 'Lavender syrup', s: '0 / 6 btl', urgency: 'high' },
                ].map((x) => (
                  <div key={x.n} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 12px', borderRadius: 8,
                    background: 'rgba(255,255,255,0.02)', border: '1px solid var(--line)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: x.urgency === 'high' ? 'var(--warn)' : 'var(--text-muted)'
                      }} />
                      <span style={{ fontSize: 13 }}>{x.n}</span>
                    </div>
                    <span className="kp-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{x.s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Maps section */}
          <div id="maps" className="kp-card" style={{ marginTop: 22, padding: 18 }}>
            <div className="kp-eyebrow" style={{ fontSize: 10 }}>Maps</div>
            <div style={{ marginTop: 8, color: 'var(--text-muted)' }}>Map preview and store locations (coming soon).</div>
            <div style={{ height: 220, marginTop: 12, borderRadius: 8, background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))', border: '1px solid var(--line)' }} />
          </div>
        </div>
      </main>
    </div>
  );
}
