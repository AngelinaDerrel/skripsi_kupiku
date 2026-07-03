import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout.jsx';
import api from '../../lib/api.js';
import { useToast } from '../../components/Toast.jsx';
import { useNavigate } from 'react-router-dom';

export default function StokManajemen() {
  const nav = useNavigate();
  const toast = useToast();

  const [bahanList, setBahanList]   = useState([]);
  const [bahanLoading, setBahanLoading] = useState(false);
  const [bahanError, setBahanError] = useState(null);
  const [searchAdmin, setSearchAdmin] = useState('');
  const [stokMasukTotals, setStokMasukTotals] = useState({});

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formName, setFormName]     = useState('');
  const [formUnit, setFormUnit]     = useState('');
  const [editId, setEditId]         = useState(null);
  const [isSaving, setIsSaving]     = useState(false);
  const [formError, setFormError]   = useState('');

  const [isDeleteOpen, setIsDeleteOpen]   = useState(false);
  const [deleteTarget, setDeleteTarget]   = useState(null);
  const [successToast, setSuccessToast]   = useState({ visible: false, message: '' });

  useEffect(() => {
    let mounted = true;
    api.get('stok-masuk')
      .then((stokData) => {
        if (!mounted) return;
        const arr = Array.isArray(stokData) ? stokData : (stokData?.data ?? []);
        const totals = {};
        arr.forEach((e) => { totals[e.id_bahan] = (totals[e.id_bahan] || 0) + Number(e.jumlah || 0); });
        setStokMasukTotals(totals);
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    setBahanLoading(true);
    setBahanError(null);
    const delay = searchAdmin.trim() ? 350 : 0;
    const timer = setTimeout(() => {
      const endpoint = searchAdmin.trim()
        ? `bahanbaku/search?search=${encodeURIComponent(searchAdmin.trim())}`
        : 'bahanbaku';
      api.get(endpoint)
        .then((bahanData) => {
          if (!mounted) return;
          const arr = Array.isArray(bahanData) ? bahanData : (bahanData?.data ?? []);
          setBahanList(
            arr
              .map((item, idx) => ({
                id: item.id_bahan ?? item.id ?? idx,
                name: item.nama_bahan ?? item.name ?? '',
                unit: item.satuan_dasar ?? item.unit ?? '',
                stok_saat_ini: item.stok_saat_ini ?? null,
              }))
              .filter((item) => item.id && item.name)
          );
        })
        .catch((err) => { if (!mounted) return; setBahanError(err?.message || 'Gagal memuat bahan baku'); })
        .finally(() => { if (mounted) setBahanLoading(false); });
    }, delay);
    return () => { mounted = false; clearTimeout(timer); };
  }, [searchAdmin]);

  useEffect(() => {
    if (!successToast.visible) return undefined;
    const timer = setTimeout(() => setSuccessToast({ visible: false, message: '' }), 2200);
    return () => clearTimeout(timer);
  }, [successToast.visible]);

  function openCreateModal() {
    setIsFormOpen(true); setEditId(null);
    setFormName(''); setFormUnit(''); setFormError('');
  }

  function openEditModal(item) {
    setIsFormOpen(true); setEditId(item?.id ?? null);
    setFormName(item?.name || ''); setFormUnit(item?.unit || ''); setFormError('');
  }

  function closeFormModal() {
    setIsFormOpen(false); setEditId(null);
    setFormName(''); setFormUnit(''); setFormError('');
  }

  async function handleSave(e) {
    e.preventDefault();
    if (isSaving) return;
    const trimmedName = formName.trim();
    const trimmedUnit = formUnit.trim();
    if (!trimmedName) { setFormError('Nama bahan wajib diisi.'); return; }
    if (!trimmedUnit) { setFormError('Satuan wajib diisi.'); return; }
    try {
      setIsSaving(true);
      const payload = { nama_bahan: trimmedName, satuan_dasar: trimmedUnit };
      if (editId) {
        const updated = await api.put(`bahanbaku/${editId}`, payload);
        const mapped = { id: updated?.id_bahan ?? editId, name: updated?.nama_bahan ?? trimmedName, unit: updated?.satuan_dasar ?? trimmedUnit };
        setBahanList((current) => current.map((item) => (String(item.id) === String(editId) ? mapped : item)));
        setSuccessToast({ visible: true, message: 'Berhasil update bahan baku.' });
      } else {
        const created = await api.post('bahanbaku', payload);
        const mapped = { id: created?.id_bahan ?? created?.id ?? trimmedName, name: created?.nama_bahan ?? trimmedName, unit: created?.satuan_dasar ?? trimmedUnit };
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

  function openDeleteModal(item) { setDeleteTarget(item || null); setIsDeleteOpen(true); }
  function closeDeleteModal() { setDeleteTarget(null); setIsDeleteOpen(false); }

  async function handleDelete() {
    if (!deleteTarget?.id) return;
    try {
      await api.del(`bahanbaku/${deleteTarget.id}`);
      setBahanList((current) => current.filter((item) => String(item.id) !== String(deleteTarget.id)));
      closeDeleteModal();
      setSuccessToast({ visible: true, message: 'Berhasil menghapus bahan baku.' });
    } catch (err) {
      closeDeleteModal();
      toast(err?.message || 'Gagal menghapus bahan baku.', 'error');
    }
  }

  return (
    <AdminLayout>
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <div style={{ padding: '18px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line)' }}>
          <div>
            <div className="kp-eyebrow" style={{ fontSize: 10 }}>Workspace · Stok</div>
            <h1 style={{ fontSize: 20, margin: '4px 0 0' }}>Manajemen Bahan Baku</h1>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--line)', width: 260 }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="6" cy="6" r="4" stroke="var(--text-muted)" strokeWidth="1.4" />
                <path d="M9 9l3 3" stroke="var(--text-muted)" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              <input
                value={searchAdmin}
                onChange={(e) => setSearchAdmin(e.target.value)}
                placeholder="Cari bahan baku..."
                style={{ fontSize: 13, color: 'var(--text)', flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: 'var(--font-sans)' }}
              />
              {searchAdmin && (
                <button onClick={() => setSearchAdmin('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16, padding: 0, lineHeight: 1 }}>×</button>
              )}
            </div>
            <button className="kp-btn kp-btn-ghost kp-btn-sm" onClick={() => nav('/admin/riwayat-stok')}>Riwayat Stok Masuk →</button>
            <button className="kp-btn" onClick={openCreateModal}>+ New bahan</button>
          </div>
        </div>

        <div style={{ flex: 1, padding: '24px 32px', overflow: 'auto' }}>
          <div className="kp-card" style={{ overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '100px 1.6fr 100px 1fr 180px', padding: '14px 18px', borderBottom: '1px solid var(--line)', fontSize: 11, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text)', background: 'rgba(255,255,255,0.025)' }}>
              <span>ID</span><span>Nama bahan</span><span>Jumlah</span><span>Satuan</span><span>Action</span>
            </div>

            {bahanLoading && <div style={{ padding: 18, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Loading bahan baku...</div>}
            {!bahanLoading && bahanError && <div style={{ padding: 18, textAlign: 'center', color: 'var(--bad)', fontSize: 13 }}>{bahanError}</div>}
            {!bahanLoading && !bahanError && bahanList.length === 0 && (
              <div style={{ padding: 18, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                {searchAdmin ? `Tidak ditemukan "${searchAdmin}"` : 'Data bahan baku kosong.'}
              </div>
            )}

            {!bahanLoading && !bahanError && bahanList.map((item, i) => (
              <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '100px 1.6fr 100px 1fr 180px', padding: '14px 18px', borderBottom: i < bahanList.length - 1 ? '1px solid var(--line)' : 'none', fontSize: 13, alignItems: 'center' }}>
                <span className="kp-mono" style={{ fontSize: 11 }}>{item.id}</span>
                <span style={{ fontWeight: 500 }}>{item.name}</span>
                <span style={{ fontWeight: 600 }}>{item.stok_saat_ini != null ? Number(item.stok_saat_ini).toLocaleString('id-ID') : '—'}</span>
                <span>{item.unit || '-'}</span>
                <span>
                  <div style={{ display: 'inline-flex', gap: 6 }}>
                    <button className="kp-btn kp-btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => openEditModal(item)}>Update</button>
                    <button className="kp-btn kp-btn-danger" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => openDeleteModal(item)}>Delete</button>
                  </div>
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>

      {isFormOpen && (
        <div role="presentation" onClick={closeFormModal} style={{ position: 'fixed', inset: 0, background: 'rgba(8,10,12,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 55, padding: 16 }}>
          <div role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} style={{ width: 'min(520px, 100%)', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, padding: 22, boxShadow: '0 30px 60px rgba(0,0,0,0.4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
              <div>
                <div className="kp-eyebrow" style={{ fontSize: 10 }}>Stok · {editId ? 'Update' : 'New'}</div>
                <h2 style={{ margin: '6px 0 0', fontSize: 18 }}>{editId ? 'Perbarui bahan baku' : 'Tambah bahan baku'}</h2>
              </div>
              <button className="kp-btn kp-btn-ghost" onClick={closeFormModal}>Tutup</button>
            </div>
            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gap: 14 }}>
                <div style={{ display: 'grid', gap: 6 }}>
                  <label className="kp-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>Nama bahan</label>
                  <input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Contoh: Espresso Bean" style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid var(--line-strong)', background: 'var(--surface)', color: 'var(--text)' }} />
                </div>
                <div style={{ display: 'grid', gap: 6 }}>
                  <label className="kp-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>Satuan dasar</label>
                  <input value={formUnit} onChange={(e) => setFormUnit(e.target.value)} placeholder="Contoh: gram" style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid var(--line-strong)', background: 'var(--surface)', color: 'var(--text)' }} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button type="button" className="kp-btn kp-btn-ghost" onClick={closeFormModal}>Batal</button>
                <button type="submit" className="kp-btn" disabled={isSaving}>{isSaving ? 'Menyimpan...' : 'Simpan'}</button>
              </div>
              {formError && <div style={{ marginTop: 10, color: 'var(--bad)', fontSize: 12 }}>{formError}</div>}
            </form>
          </div>
        </div>
      )}

      {isDeleteOpen && (
        <div role="presentation" onClick={closeDeleteModal} style={{ position: 'fixed', inset: 0, background: 'rgba(8,10,12,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 55, padding: 16 }}>
          <div role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} style={{ width: 'min(520px, 100%)', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 16, padding: 22, boxShadow: '0 30px 60px rgba(0,0,0,0.45)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <div className="kp-eyebrow" style={{ fontSize: 10 }}>Konfirmasi</div>
                <h2 style={{ margin: '6px 0 0', fontSize: 18 }}>Hapus bahan baku?</h2>
              </div>
              <button className="kp-btn kp-btn-ghost" onClick={closeDeleteModal}>Tutup</button>
            </div>
            <div style={{ fontSize: 13 }}>
              Bahan <span style={{ fontWeight: 500 }}>{deleteTarget?.name || '-'}</span> akan dihapus.
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
              <button className="kp-btn kp-btn-ghost" onClick={closeDeleteModal}>Batal</button>
              <button className="kp-btn kp-btn-danger" onClick={handleDelete}>Hapus bahan</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ position: 'fixed', top: 18, right: 18, zIndex: 60, pointerEvents: 'none', opacity: successToast.visible ? 1 : 0, transform: successToast.visible ? 'translateY(0)' : 'translateY(-10px)', transition: 'opacity 180ms ease, transform 180ms ease' }}>
        <div style={{ minWidth: 260, maxWidth: 360, padding: '12px 14px', borderRadius: 12, background: 'linear-gradient(135deg, rgba(107,79,58,0.95), rgba(43,32,16,0.96))', border: '1px solid rgba(255,255,255,0.16)', boxShadow: '0 18px 40px rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', gap: 12, color: '#F6F2EE' }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>✓</div>
          <div>
            <div className="kp-mono" style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.8 }}>Success</div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{successToast.message}</div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
