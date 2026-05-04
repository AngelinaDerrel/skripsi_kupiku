import StaffLayout from './StaffLayout.jsx';
import { MENU_ITEMS } from '../data/menuItems.js';

export default function StaffOrders() {
  return (
    <StaffLayout>
      <div style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div>
            <div className="kp-eyebrow" style={{ fontSize: 10 }}>Staff · Orders</div>
            <h1 style={{ fontSize: 20, margin: '4px 0 0' }}>Order screen</h1>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
          <div className="kp-card" style={{ padding: 16 }}>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Available menu</div>
            <div style={{ display: 'grid', gap: 10 }}>
              {MENU_ITEMS.slice(0, 8).map((m) => (
                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.01)', border: '1px solid var(--line)' }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{m.name}</div>
                    <div className="kp-mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.id}</div>
                  </div>
                  <div className="kp-mono">{typeof m.price === 'number' ? `${m.price}k` : m.price}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="kp-card" style={{ padding: 16 }}>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Active orders</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ padding: 10, borderRadius: 8, background: 'rgba(255,255,255,0.01)', border: '1px solid var(--line)' }}>
                No active orders
              </div>
            </div>
          </div>
        </div>
      </div>
    </StaffLayout>
  );
}
