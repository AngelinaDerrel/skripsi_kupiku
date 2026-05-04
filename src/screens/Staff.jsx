import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import NavIcon from '../components/NavIcon.jsx';
import { STAFF as INITIAL } from '../data/staff.js';

const NAV = [
  { id: 'overview', label: 'Overview', icon: 'home' },
  { id: 'menu', label: 'Menu', icon: 'cup' },
  { id: 'stock', label: 'Stock', icon: 'box' },
  { id: 'staff', label: 'Staff', icon: 'people' },
  { id: 'moods', label: 'Mood insights', icon: 'pulse' },
];
const NAV_BOTTOM = [
  { id: 'settings', label: 'Settings', icon: 'gear' },
  { id: 'help', label: 'Support', icon: 'help' },
  { id: 'logout', label: 'Logout', icon: 'logout' },
];

export default function Staff() {
  const nav = useNavigate();
  const loc = useLocation();
  const [list, setList] = useState(INITIAL.slice());
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('Barista');
  const [username, setUsername] = useState('');

  const raw = localStorage.getItem('kupiku_user');
  let currentRole = null;
  try { currentRole = raw ? JSON.parse(raw).role : null; } catch { currentRole = null; }
  const canAdd = currentRole === 'admin' || currentRole === 'owner';

  function handleAdd(e) {
    e.preventDefault();
    if (!name || !username) return;
    const id = `S-${String(Math.floor(Math.random() * 900) + 100)}`;
    const next = { id, name, role, username };
    setList((s) => [next, ...s]);
    setName(''); setUsername(''); setRole('Barista');
  }

  return (
    <div className="kp" style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{
        width: 232, flex: 'none', background: '#0B0B0B',
        borderRight: '1px solid var(--line)', padding: '22px 14px',
        display: 'flex', flexDirection: 'column'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 8px 22px', cursor: 'pointer' }} onClick={() => nav('/')}> 
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Kupiku Coffee</div>
            <div className="kp-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>Yogyakarta</div>
          </div>
        </div>

        <div className="kp-eyebrow" style={{ padding: '4px 8px', fontSize: 10 }}>Workspace</div>
        <nav style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV.map((item) => {
            const active = item.id === 'staff' ? loc.pathname.startsWith('/admin/staff') : loc.pathname === '/admin';
            return (
              <div key={item.id} onClick={() => {
                if (item.id === 'staff') nav('/admin/staff');
                else nav('/admin');
              }} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '9px 10px', borderRadius: 8,
                background: active ? 'rgba(107,79,58,0.18)' : 'transparent',
                border: active ? '1px solid rgba(107,79,58,0.3)' : '1px solid transparent',
                color: active ? 'var(--text)' : 'var(--text-muted)',
                fontSize: 13, cursor: 'pointer'
              }}>
                <NavIcon name={item.icon} active={active} />
                <span style={{ flex: 1 }}>{item.label}</span>
              </div>
            );
          })}
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

      <main style={{ flex: 1, padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div>
            <div className="kp-eyebrow" style={{ fontSize: 10 }}>Workspace · Staff</div>
            <h1 style={{ fontSize: 18, fontWeight: 500, margin: '4px 0 0' }}>Staff management</h1>
          </div>
          {canAdd && (
            <button className="kp-btn" onClick={() => setShowAdd(true)}>+ New staff</button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 18 }}>
          <div className="kp-card" style={{ padding: 0 }}>
            <div style={{ padding: 14, borderBottom: '1px solid var(--line)', fontSize: 11, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 120px 120px', gap: 12 }}>
                <div>Staff ID</div><div>Name</div><div>Role</div><div>Username</div>
              </div>
            </div>

            <div style={{ maxHeight: '60vh', overflow: 'auto' }}>
              {list.map((s) => (
                <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 120px 120px', gap: 12, padding: 14, borderBottom: '1px solid var(--line)', alignItems: 'center' }}>
                  <div className="kp-mono" style={{ color: 'var(--text-muted)' }}>{s.id}</div>
                  <div style={{ fontWeight: 500 }}>{s.name}</div>
                  <div style={{ color: 'var(--text-muted)' }}>{s.role}</div>
                  <div className="kp-mono" style={{ color: 'var(--text-muted)' }}>{s.username}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      {showAdd && (
        <div onClick={() => setShowAdd(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60
        }}>
          <div onClick={(e) => e.stopPropagation()} className="kp-card" style={{ width: 420, padding: 18, borderRadius: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div>
                <div className="kp-eyebrow" style={{ fontSize: 10 }}>Add staff</div>
                <div style={{ fontSize: 14, marginTop: 8, color: 'var(--text-muted)' }}>Create a new staff account</div>
              </div>
              <button className="kp-btn kp-btn-ghost" onClick={() => setShowAdd(false)}>Close</button>
            </div>

            <form onSubmit={(e) => { handleAdd(e); setShowAdd(false); }} style={{ display: 'grid', gap: 10, marginTop: 12 }}>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" style={{ padding: 10, borderRadius: 8, border: '1px solid var(--line-strong)', background: 'var(--surface)' }} />
              <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" style={{ padding: 10, borderRadius: 8, border: '1px solid var(--line-strong)', background: 'var(--surface)' }} />
              <select value={role} onChange={(e) => setRole(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid var(--line-strong)', background: 'var(--surface)', color: 'var(--text)' }}>
                <option style={{ color: 'var(--text)' }}>Barista</option>
                <option style={{ color: 'var(--text)' }}>Cashier</option>
                <option style={{ color: 'var(--text)' }}>Manager</option>
              </select>

              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                <button className="kp-btn" type="submit" disabled={!canAdd}>Create</button>
                {!canAdd && <div style={{ color: 'var(--text-muted)', alignSelf: 'center' }}>Only admin/owner can create staff</div>}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
