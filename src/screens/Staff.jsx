import React from 'react';
import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout.jsx';
import api from '../lib/api.js';

export default function Staff() {
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
  const [searchStaff, setSearchStaff] = useState('');

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

  // Load staff — debounced, delegated to backend search endpoint
  useEffect(() => {
    let mounted = true;
    setStaffLoading(true);
    setStaffError(null);
    const delay = searchStaff.trim() ? 350 : 0;
    const timer = setTimeout(() => {
      const endpoint = searchStaff.trim()
        ? `pegawai/search?search=${encodeURIComponent(searchStaff.trim())}`
        : 'pegawai';
      api.get(endpoint)
        .then((data) => {
          if (!mounted) return;
          const arr = Array.isArray(data) ? data : (data?.data ?? []);
          setList(
            arr
              .map((it) => ({
                id: it.id_pegawai,
                name: it.nama_pegawai || '',
                role: it.Jabatan?.jabatan || it.jabatan?.jabatan || '',
                username: it.email_pegawai || '',
              }))
              .sort((a, b) => Number(a.id) - Number(b.id))
          );
        })
        .catch((err) => {
          if (!mounted) return;
          setStaffError(err?.message || 'Failed to load staff');
        })
        .finally(() => { if (mounted) setStaffLoading(false); });
    }, delay);
    return () => { mounted = false; clearTimeout(timer); };
  }, [searchStaff]);

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
    <AdminLayout>
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <div style={{
          padding: '18px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid var(--line)',
        }}>
          <div>
            <div className="kp-eyebrow" style={{ fontSize: 10 }}>Workspace · Staff</div>
            <h1 style={{ fontSize: 18, fontWeight: 500, margin: '4px 0 0' }}>Staff management</h1>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8,
              background: 'var(--surface)', border: '1px solid var(--line)', width: 260,
            }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="6" cy="6" r="4" stroke="var(--text-muted)" strokeWidth="1.4" />
                <path d="M9 9l3 3" stroke="var(--text-muted)" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              <input
                value={searchStaff}
                onChange={(e) => setSearchStaff(e.target.value)}
                placeholder="Search staff..."
                style={{
                  fontSize: 13, color: 'var(--text)', flex: 1,
                  background: 'transparent', border: 'none', outline: 'none',
                  fontFamily: 'var(--font-sans)',
                }}
              />
              {searchStaff && (
                <button onClick={() => setSearchStaff('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16, padding: 0, lineHeight: 1 }}>×</button>
              )}
            </div>
            {canAdd && (
              <button className="kp-btn" onClick={() => { setEditingId(null); setName(''); setUsername(''); setPassword(''); setShowAdd(true); }}>+ New staff</button>
            )}
          </div>
        </div>

        <div style={{ flex: 1, padding: '24px 32px', overflow: 'auto' }}>
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
                <tr><td colSpan={5} style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  {searchStaff ? `Tidak ditemukan "${searchStaff}"` : 'Belum ada staff. Klik "+ New staff" untuk menambah.'}
                </td></tr>
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
    </AdminLayout>
  );
}