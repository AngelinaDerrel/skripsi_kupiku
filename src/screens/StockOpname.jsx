import React from 'react';
import { useState, useMemo, useEffect } from 'react';
import StaffLayout from './StaffLayout.jsx';
import AdminLayout from '../components/AdminLayout.jsx';
import { STOCK_ITEMS } from '../data/stockItems.js';
import api from '../lib/api.js';

function formatNumber(n) {
  if (n == null || n === '') return '';
  return Number(n).toLocaleString();
}

export default function StockOpname({ layout = 'staff' }) {
  const isAdmin = layout === 'admin';
  const [rows, setRows] = useState(() => STOCK_ITEMS.map((s) => ({ ...s, utuh: '', sisa: '' })));
  const Layout = isAdmin ? AdminLayout : StaffLayout;
  const headerLabel = isAdmin ? 'Workspace · Stock' : 'Staff · Stock';

  const [bahanList, setBahanList] = useState([]);
  const [bahanLoading, setBahanLoading] = useState(false);
  const [bahanError, setBahanError] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formUnit, setFormUnit] = useState('');
  const [editId, setEditId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [successToast, setSuccessToast] = useState({ visible: false, message: '' });
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [stokMasukTotals, setStokMasukTotals] = useState({});
  const [searchAdmin, setSearchAdmin] = useState('');

  useEffect(() => {
    if (!isAdmin) return undefined;
    let mounted = true;
    async function loadBahan() {
      setBahanLoading(true);
      setBahanError(null);
      try {
        const [bahanData, stokData] = await Promise.all([
          api.get('bahanbaku'),
          api.get('stok-masuk'),
        ]);
        if (!mounted) return;
        const arr = Array.isArray(bahanData) ? bahanData : (bahanData?.data ?? []);
        const mapped = arr
          .map((item, idx) => ({
            id: item.id_bahan ?? item.id ?? idx,
            name: item.nama_bahan ?? item.name ?? '',
            unit: item.satuan_dasar ?? item.unit ?? '',
          }))
          .filter((item) => item.id && item.name);
        setBahanList(mapped);

        const stokArr = Array.isArray(stokData) ? stokData : (stokData?.data ?? []);
        const totals = {};
        stokArr.forEach((e) => {
          const id = e.id_bahan;
          totals[id] = (totals[id] || 0) + Number(e.jumlah || 0);
        });
        setStokMasukTotals(totals);
      } catch (err) {
        if (!mounted) return;
        setBahanError(err?.message || 'Gagal memuat bahan baku');
      } finally {
        if (mounted) setBahanLoading(false);
      }
    }

    loadBahan();
    return () => { mounted = false; };
  }, [isAdmin]);

  useEffect(() => {
    if (!successToast.visible) return undefined;
    const timer = setTimeout(() => setSuccessToast({ visible: false, message: '' }), 2200);
    return () => clearTimeout(timer);
  }, [successToast.visible]);

  function updateRow(id, field, value) {
    setRows((r) => r.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  }

  const computed = useMemo(() => rows.map((r) => {
    const utuh = Number(r.utuh) || 0;
    const sisa = Number(r.sisa) || 0;
    // compute total in base unit: if bb > 1 treat bb as unit multiplier, else use bw
    const unitValue = (r.bb && r.bb > 1) ? r.bb : r.bw || 1;
    const total = utuh * unitValue + sisa;
    return { ...r, utuh, sisa, total };
  }), [rows]);

  function exportCSV() {
    const headers = ['id','name','bw','bb','unit','utuh','sisa','total'];
    const lines = [headers.join(',')];
    computed.forEach((c) => {
      lines.push([c.id, `"${c.name}"`, c.bw, c.bb, c.unit, c.utuh, c.sisa, c.total].join(','));
    });
    const csv = lines.join('\n');
    // trigger download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'stock-opname.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  function openCreateModal() {
    setIsFormOpen(true);
    setEditId(null);
    setFormName('');
    setFormUnit('');
    setFormError('');
  }

  function openEditModal(item) {
    setIsFormOpen(true);
    setEditId(item?.id ?? null);
    setFormName(item?.name || '');
    setFormUnit(item?.unit || '');
    setFormError('');
  }

  function closeFormModal() {
    setIsFormOpen(false);
    setEditId(null);
    setFormName('');
    setFormUnit('');
    setFormError('');
  }

  async function handleSave(e) {
    e.preventDefault();
    if (isSaving) return;
    const trimmedName = formName.trim();
    const trimmedUnit = formUnit.trim();
    if (!trimmedName) {
      setFormError('Nama bahan wajib diisi.');
      return;
    }
    if (!trimmedUnit) {
      setFormError('Satuan wajib diisi.');
      return;
    }

    try {
      setIsSaving(true);
      const payload = { nama_bahan: trimmedName, satuan_dasar: trimmedUnit };
      if (editId) {
        const updated = await api.put(`bahanbaku/${editId}`, payload);
        const mapped = {
          id: updated?.id_bahan ?? editId,
          name: updated?.nama_bahan ?? trimmedName,
          unit: updated?.satuan_dasar ?? trimmedUnit,
        };
        setBahanList((current) => current.map((item) => (String(item.id) === String(editId) ? mapped : item)));
        setSuccessToast({ visible: true, message: 'Berhasil update bahan baku.' });
      } else {
        const created = await api.post('bahanbaku', payload);
        const mapped = {
          id: created?.id_bahan ?? created?.id ?? trimmedName,
          name: created?.nama_bahan ?? trimmedName,
          unit: created?.satuan_dasar ?? trimmedUnit,
        };
        setBahanList((current) => [mapped, ...current]);
        setSuccessToast({ visible: true, message: 'Berhasil menambah bahan baku.' });
      }
      closeFormModal();
    } catch (err) {
      setFormError(err?.message || 'Gagal menyimpan bahan baku.');
    } finally {
      setIsSaving(false);
    }
  }

  function openDeleteModal(item) {
    setDeleteTarget(item || null);
    setIsDeleteOpen(true);
  }

  function closeDeleteModal() {
    setDeleteTarget(null);
    setIsDeleteOpen(false);
  }

  async function handleDelete() {
    if (!deleteTarget?.id) return;
    try {
      await api.del(`bahanbaku/${deleteTarget.id}`);
      setBahanList((current) => current.filter((item) => String(item.id) !== String(deleteTarget.id)));
      setSuccessToast({ visible: true, message: 'Berhasil delete bahan baku.' });
      closeDeleteModal();
    } catch (err) {
      setBahanError(err?.message || 'Gagal menghapus bahan baku.');
    }
  }

  if (isAdmin) {
    const filteredBahan = searchAdmin.trim()
      ? bahanList.filter((b) => b.name.toLowerCase().includes(searchAdmin.toLowerCase()) || String(b.id).includes(searchAdmin))
      : bahanList;

    return (
      <Layout>
        <div style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <div className="kp-eyebrow" style={{ fontSize: 10 }}>{headerLabel}</div>
              <h1 style={{ fontSize: 20, margin: '4px 0 0' }}>Bahan baku</h1>
            </div>
            <button className="kp-btn" onClick={openCreateModal}>+ New bahan</button>
          </div>

          {/* Search */}
          <div style={{ marginBottom: 14 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '8px 12px', borderRadius: 8,
              background: 'var(--surface)', border: '1px solid var(--line)', width: 280,
            }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="6" cy="6" r="4" stroke="var(--text-muted)" strokeWidth="1.4" />
                <path d="M9 9l3 3" stroke="var(--text-muted)" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              <input
                value={searchAdmin}
                onChange={(e) => setSearchAdmin(e.target.value)}
                placeholder="Cari bahan baku..."
                style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', color: 'var(--text)', fontSize: 13 }}
              />
              {searchAdmin && (
                <button onClick={() => setSearchAdmin('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16, padding: 0, lineHeight: 1 }}>×</button>
              )}
            </div>
          </div>

          <div className="kp-card" style={{ overflow: 'hidden' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '100px 1.6fr 100px 1fr 180px',
              padding: '14px 18px', borderBottom: '1px solid var(--line)',
              fontSize: 11, fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase', letterSpacing: '0.08em',
              color: 'var(--text-muted)', background: 'rgba(255,255,255,0.015)'
            }}>
              <span>ID</span><span>Nama bahan</span><span>Jumlah</span><span>Satuan</span><span>Action</span>
            </div>

            {bahanLoading && (
              <div style={{ padding: 18, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                Loading bahan baku...
              </div>
            )}
            {!bahanLoading && bahanError && (
              <div style={{ padding: 18, textAlign: 'center', color: 'var(--bad)', fontSize: 13 }}>
                {bahanError}
              </div>
            )}
            {!bahanLoading && !bahanError && filteredBahan.length === 0 && (
              <div style={{ padding: 18, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                {searchAdmin ? `Tidak ditemukan "${searchAdmin}"` : 'Data bahan baku kosong.'}
              </div>
            )}

            {!bahanLoading && !bahanError && filteredBahan.map((item, i) => (
              <div key={item.id} style={{
                display: 'grid',
                gridTemplateColumns: '100px 1.6fr 100px 1fr 180px',
                padding: '14px 18px',
                borderBottom: i < filteredBahan.length - 1 ? '1px solid var(--line)' : 'none',
                fontSize: 13, alignItems: 'center'
              }}>
                <span className="kp-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.id}</span>
                <span style={{ fontWeight: 500 }}>{item.name}</span>
                <span style={{ fontWeight: 600, color: stokMasukTotals[item.id] ? 'var(--text)' : 'var(--text-muted)' }}>
                  {stokMasukTotals[item.id] != null ? Number(stokMasukTotals[item.id]).toLocaleString('id-ID') : '—'}
                </span>
                <span style={{ color: 'var(--text-muted)' }}>{item.unit || '-'}</span>
                <span>
                  <div style={{ display: 'inline-flex', gap: 6 }}>
                    <button
                      className="kp-btn kp-btn-ghost"
                      style={{ padding: '4px 10px', fontSize: 12 }}
                      onClick={() => openEditModal(item)}
                    >
                      Update
                    </button>
                    <button
                      className="kp-btn kp-btn-danger"
                      style={{ padding: '4px 10px', fontSize: 12 }}
                      onClick={() => openDeleteModal(item)}
                    >
                      Delete
                    </button>
                  </div>
                </span>
              </div>
            ))}
          </div>
        </div>

        {isFormOpen && (
          <div
            role="presentation"
            onClick={closeFormModal}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(8,10,12,0.55)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 55,
              padding: 16,
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
              style={{
                width: 'min(520px, 100%)',
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                borderRadius: 14,
                padding: 22,
                boxShadow: '0 30px 60px rgba(0,0,0,0.4)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
                <div>
                  <div className="kp-eyebrow" style={{ fontSize: 10 }}>Stock · {editId ? 'Update' : 'New'}</div>
                  <h2 style={{ margin: '6px 0 0', fontSize: 18 }}>{editId ? 'Perbarui bahan baku' : 'Tambah bahan baku'}</h2>
                </div>
                <button className="kp-btn kp-btn-ghost" onClick={closeFormModal}>Tutup</button>
              </div>

              <form onSubmit={handleSave}>
                <div style={{ display: 'grid', gap: 14 }}>
                  <div style={{ display: 'grid', gap: 6 }}>
                    <label className="kp-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>Nama bahan</label>
                    <input
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Contoh: Espresso Bean"
                      style={{
                        padding: '10px 12px',
                        borderRadius: 10,
                        border: '1px solid var(--line-strong)',
                        background: 'var(--surface)',
                        color: 'var(--text)',
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gap: 6 }}>
                    <label className="kp-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>Satuan dasar</label>
                    <input
                      value={formUnit}
                      onChange={(e) => setFormUnit(e.target.value)}
                      placeholder="Contoh: gram"
                      style={{
                        padding: '10px 12px',
                        borderRadius: 10,
                        border: '1px solid var(--line-strong)',
                        background: 'var(--surface)',
                        color: 'var(--text)',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                  <button type="button" className="kp-btn kp-btn-ghost" onClick={closeFormModal}>Batal</button>
                  <button type="submit" className="kp-btn" disabled={isSaving}>
                    {isSaving ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
                {formError && (
                  <div style={{ marginTop: 10, color: 'var(--bad)', fontSize: 12 }}>
                    {formError}
                  </div>
                )}
              </form>
            </div>
          </div>
        )}

        {isDeleteOpen && (
          <div
            role="presentation"
            onClick={closeDeleteModal}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(8,10,12,0.55)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 55,
              padding: 16,
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
              style={{
                width: 'min(520px, 100%)',
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                borderRadius: 16,
                padding: 22,
                boxShadow: '0 30px 60px rgba(0,0,0,0.45)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <div className="kp-eyebrow" style={{ fontSize: 10 }}>Konfirmasi</div>
                  <h2 style={{ margin: '6px 0 0', fontSize: 18 }}>Hapus bahan baku?</h2>
                </div>
                <button className="kp-btn kp-btn-ghost" onClick={closeDeleteModal}>Tutup</button>
              </div>

              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                Bahan <span style={{ color: 'var(--text)', fontWeight: 500 }}>{deleteTarget?.name || '-'}</span> akan dihapus.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
                <button className="kp-btn kp-btn-ghost" onClick={closeDeleteModal}>Batal</button>
                <button className="kp-btn kp-btn-danger" onClick={handleDelete}>Hapus bahan</button>
              </div>
            </div>
          </div>
        )}

        <div
          style={{
            position: 'fixed',
            top: 18,
            right: 18,
            zIndex: 60,
            pointerEvents: 'none',
            opacity: successToast.visible ? 1 : 0,
            transform: successToast.visible ? 'translateY(0)' : 'translateY(-10px)',
            transition: 'opacity 180ms ease, transform 180ms ease',
          }}
        >
          <div
            style={{
              minWidth: 260,
              maxWidth: 360,
              padding: '12px 14px',
              borderRadius: 12,
              background: 'linear-gradient(135deg, rgba(107,79,58,0.95), rgba(43,32,16,0.96))',
              border: '1px solid rgba(255,255,255,0.16)',
              boxShadow: '0 18px 40px rgba(0,0,0,0.35)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              color: '#F6F2EE',
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
              }}
            >
              ✓
            </div>
            <div>
              <div className="kp-mono" style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.8 }}>
                Success
              </div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{successToast.message}</div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div>
            <div className="kp-eyebrow" style={{ fontSize: 10 }}>{headerLabel}</div>
            <h1 style={{ fontSize: 20, margin: '4px 0 0' }}>Stock opname</h1>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="kp-btn kp-btn-ghost" onClick={() => setRows(STOCK_ITEMS.map((s) => ({ ...s, utuh: '', sisa: '' })))}>Reset</button>
            <button className="kp-btn" onClick={exportCSV}>Export CSV</button>
          </div>
        </div>

        <div className="kp-card" style={{ padding: 12, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 980 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--text-muted)', fontSize: 12 }}>
                <th style={{ padding: '10px 12px', width: 320 }}>Bahan</th>
                <th style={{ padding: '10px 12px', width: 80 }}>BW</th>
                <th style={{ padding: '10px 12px', width: 80 }}>BB</th>
                <th style={{ padding: '10px 12px', width: 120 }}>Utuh</th>
                <th style={{ padding: '10px 12px', width: 120 }}>Sisa</th>
                <th style={{ padding: '10px 12px', width: 140, textAlign: 'right' }}>Total ({/* unit */})</th>
              </tr>
            </thead>
            <tbody>
              {computed.map((r) => (
                <tr key={r.id} style={{ borderTop: '1px solid var(--line)' }}>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text)' }}>{r.name}</div>
                    <div className="kp-mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.unit}</div>
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{r.bw}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{r.bb > 1 ? `x${r.bb}` : ''}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <input value={r.utuh === 0 ? '' : r.utuh} onChange={(e) => updateRow(r.id, 'utuh', e.target.value)} placeholder="0" style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid var(--line-strong)', background: 'var(--surface)', color: 'var(--text)' }} />
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <input value={r.sisa === 0 ? '' : r.sisa} onChange={(e) => updateRow(r.id, 'sisa', e.target.value)} placeholder="0" style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid var(--line-strong)', background: 'var(--surface)', color: 'var(--text)' }} />
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                    <div className="kp-mono" style={{ fontSize: 13 }}>{formatNumber(r.total)} {r.unit}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
