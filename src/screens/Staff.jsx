import React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import NavIcon from '../components/NavIcon.jsx';
import api from '../lib/api.js';

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
  const [list, setList] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [positions, setPositions] = useState([]);
  const [posLoading, setPosLoading] = useState(false);
  const [posError, setPosError] = useState(null);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const raw = localStorage.getItem('kupiku_user');
  let currentRole = null;
  try { currentRole = raw ? JSON.parse(raw).role : null; } catch { currentRole = null; }
  const canAdd = currentRole === 'admin' || currentRole === 'owner';

  async function handleAdd() {
    if (!name || !username) return;
    if (!role) { setError('Pilih role dulu'); return; }

    setLoading(true);
    setError(null);
    try {
      const base = {
        nama_pegawai: name,
        email_pegawai: username,
        id_jabatan: Number(role),
      };
      // include password only when provided (create or update)
      if (password) base.pw_pegawai = password;

      if (editingId) {
        const updated = await api.put(`pegawai/${editingId}`, base);
        const mapped = {
          id: updated?.id_pegawai || editingId,
          name: updated?.nama_pegawai || name,
          role: updated?.jabatan?.jabatan || updated?.Jabatan?.jabatan || (positions.find((p) => String(p.id_jabatan) === String(base.id_jabatan)) || {}).jabatan || '',
          username: updated?.email_pegawai || username,
        };
        setList((s) => s.map((it) => (it.id === editingId ? mapped : it)));
        setEditingId(null);
      } else {
        const created = await api.post('pegawai', base);
        const mapped = {
          id: created?.id_pegawai,
          name: created?.nama_pegawai,
          role: created?.jabatan?.jabatan || created?.Jabatan?.jabatan || (positions.find((p) => String(p.id_jabatan) === String(base.id_jabatan)) || {}).jabatan || '',
          username: created?.email_pegawai,
        };
        setList((s) => [mapped, ...s]);
      }

      setName(''); setUsername(''); setPassword('');
      setShowAdd(false);
    } catch (err) {
      const parts = [];
      if (err?.message) parts.push(err.message);
      if (err?.status) parts.push(`status:${err.status}`);
      if (err?.data) {
        try { parts.push(JSON.stringify(err.data)); } catch { parts.push(String(err.data)); }
      }
      setError(parts.length ? parts.join(' — ') : 'Failed to create staff');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;
    async function fetchStaff() {
      setStaffLoading(true);
      setStaffError(null);
      try {
        const data = await api.get('pegawai');
        if (!mounted) return;
        const arr = Array.isArray(data) ? data : (data?.data ?? []);
        const mapped = arr
          .map((it) => ({
            id: it.id_pegawai,
            name: it.nama_pegawai || '',
            role: it.Jabatan?.jabatan || it.jabatan?.jabatan || '',
            username: it.email_pegawai || '',
          }))
          .sort((a, b) => Number(a.id) - Number(b.id));
        setList(mapped);
      } catch (err) {
        if (!mounted) return;
        setStaffError(err?.message || 'Failed to load staff');
      } finally {
        if (mounted) setStaffLoading(false);
      }
    }
    fetchStaff();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    async function fetchPositions() {
      setPosLoading(true);
      setPosError(null);
      try {
        const data = await api.get('jabatan');
        if (!mounted) return;
        const arr = Array.isArray(data) ? data : (data?.data ?? []);
        setPositions(arr);
      } catch (err) {
        if (!mounted) return;
        setPosError(err?.message || 'Failed to load positions');
      } finally {
        if (mounted) setPosLoading(false);
      }
    }
    fetchPositions();
    return () => { mounted = false; };
  }, []);

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
            <button className="kp-btn" onClick={() => { setEditingId(null); setName(''); setUsername(''); setPassword(''); setShowAdd(true); }}>+ New staff</button>
          )}
        </div>

        <div className="kp-card" style={{ padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: 100 }} />
              <col />
              <col style={{ width: 100 }} />
              <col style={{ width: '50%' }} />
              <col style={{ width: 150 }} />
            </colgroup>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--line)' }}>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 400 }}>Staff ID</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 400 }}>Name</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 400 }}>Role</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 400 }}>Username</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 400 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {staffLoading && (
                <tr><td colSpan={5} style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Loading staff…</td></tr>
              )}
              {staffError && !staffLoading && (
                <tr><td colSpan={5} style={{ padding: 20, textAlign: 'center', color: 'var(--danger)', fontSize: 13 }}>{staffError}</td></tr>
              )}
              {!staffLoading && !staffError && list.length === 0 && (
                <tr><td colSpan={5} style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Belum ada staff. Klik "+ New staff" untuk menambah.</td></tr>
              )}
              {!staffLoading && list.map((s) => (
                <tr key={s.id} style={{ borderBottom: '1px solid var(--line)' }}>
                  <td className="kp-mono" style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: 12 }}>
                    {s.id ? `#${String(s.id).padStart(4, '0')}` : '—'}
                  </td>
                  <td style={{ padding: '10px 12px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name || '—'}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.role || '—'}</td>
                  <td className="kp-mono" style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.username || '—'}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                      <button className="kp-btn kp-btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => {
                        setEditingId(s.id);
                        setName(s.name || '');
                        setUsername(s.username || '');
                        const pos = positions.find((p) => p.jabatan === s.role);
                        setRole(pos ? String(pos.id_jabatan) : '');
                        setShowAdd(true);
                      }}>Edit</button>
                      <button className="kp-btn kp-btn-danger" style={{ padding: '4px 10px', fontSize: 12 }} onClick={async () => {
                        if (!confirm('Hapus staff ini?')) return;
                        try {
                          await api.del(`pegawai/${s.id}`);
                          setList((cur) => cur.filter((x) => x.id !== s.id));
                        } catch (err) {
                          alert((err && err.message) || 'Failed to delete');
                        }
                      }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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

            <form onSubmit={(e) => { e.preventDefault(); handleAdd(); }} style={{ display: 'grid', gap: 10, marginTop: 12 }}>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" style={{ padding: 10, borderRadius: 8, border: '1px solid var(--line-strong)', background: 'var(--surface)', color: 'var(--text)' }} />
              <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="email@example.com" style={{ padding: 10, borderRadius: 8, border: '1px solid var(--line-strong)', background: 'var(--surface)', color: 'var(--text)' }} />
              <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" type="password" style={{ padding: 10, borderRadius: 8, border: '1px solid var(--line-strong)', background: 'var(--surface)', color: 'var(--text)' }} />
              <select value={role ?? ''} onChange={(e) => setRole(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid var(--line-strong)', background: 'var(--surface)', color: 'var(--text)' }}>
                {posLoading && <option value="">Loading…</option>}
                {!posLoading && positions && positions.length > 0 && positions.map((p) => (
                  <option key={p.id_jabatan} value={p.id_jabatan} style={{ color: 'var(--text)' }}>{p.jabatan}</option>
                ))}
                {!posLoading && (!positions || positions.length === 0) && (
                  <>
                    <option value="1" style={{ color: 'var(--text)' }}>Barista</option>
                    <option value="2" style={{ color: 'var(--text)' }}>Cashier</option>
                    <option value="3" style={{ color: 'var(--text)' }}>Manager</option>
                  </>
                )}
              </select>
              {posError && <div style={{ color: 'var(--danger)', fontSize: 12 }}>{posError}</div>}

              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                <button className="kp-btn" type="submit" disabled={!canAdd || loading}>{editingId ? (loading ? 'Saving…' : 'Save') : (loading ? 'Creating…' : 'Create')}</button>
                {editingId && <button type="button" className="kp-btn kp-btn-ghost" onClick={() => { setEditingId(null); setName(''); setUsername(''); setPassword(''); setShowAdd(false); }}>Cancel</button>}
                {!canAdd && <div style={{ color: 'var(--text-muted)', alignSelf: 'center' }}>Only admin/owner can create staff</div>}
              </div>
              {error && <div style={{ color: 'var(--danger)', marginTop: 8 }}>{error}</div>}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}