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

function formatTanggalOpname(tanggal) {
  const bulanNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  const d = new Date(tanggal + 'T00:00:00');
  return `${d.getDate()} ${bulanNames[d.getMonth()]} ${d.getFullYear()}`;
}

async function downloadBlob(url, filename, token) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error('Gagal download PDF');
  const blob = await res.blob();
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(href);
}

export default function Stock({ layout = 'staff' }) {
  const isAdmin = layout === 'admin';
  const [rows, setRows] = useState(() => STOCK_ITEMS.map((s) => ({ ...s, utuh: '', sisa: '' })));
  const Layout = isAdmin ? AdminLayout : StaffLayout;
  const headerLabel = isAdmin ? 'Workspace · Stock' : 'Staff · Stock';
  const token = localStorage.getItem('kupiku_token');

  // Shared
  const [successToast, setSuccessToast] = useState({ visible: false, message: '' });

  // Admin — bahan baku
  const [bahanList, setBahanList] = useState([]);
  const [bahanLoading, setBahanLoading] = useState(false);
  const [bahanError, setBahanError] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formUnit, setFormUnit] = useState('');
  const [editId, setEditId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [stokMasukTotals, setStokMasukTotals] = useState({});
  const [searchAdmin, setSearchAdmin] = useState('');

  // Admin — riwayat stok masuk tab
  const [activeAdminTab, setActiveAdminTab] = useState('bahan');
  const [opnameHistory, setOpnameHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [historyDownloadingId, setHistoryDownloadingId] = useState(null);
  const [historyDownloadError, setHistoryDownloadError] = useState('');
  const nowDate = new Date();
  const [riwayatBulan, setRiwayatBulan] = useState(nowDate.getMonth() + 1);
  const [riwayatTahun, setRiwayatTahun] = useState(nowDate.getFullYear());
  const [riwayatTanggal, setRiwayatTanggal] = useState(0);
  const [riwayatSearch, setRiwayatSearch] = useState('');
  const [pegawaiMap, setPegawaiMap] = useState({});

  // Staff — opname form
  const [opnameLoading, setOpnameLoading] = useState(false);
  const [opnameError, setOpnameError] = useState('');
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);
  const [isSavingOpname, setIsSavingOpname] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [savedOpnameId, setSavedOpnameId] = useState(null);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [downloadError, setDownloadError] = useState('');

  // Load stok-masuk totals once (no search needed)
  useEffect(() => {
    if (!isAdmin) return undefined;
    let mounted = true;
    api.get('stok-masuk')
      .then((stokData) => {
        if (!mounted) return;
        const stokArr = Array.isArray(stokData) ? stokData : (stokData?.data ?? []);
        const totals = {};
        stokArr.forEach((e) => {
          const id = e.id_bahan;
          totals[id] = (totals[id] || 0) + Number(e.jumlah || 0);
        });
        setStokMasukTotals(totals);
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, [isAdmin]);

  // Load bahan baku — debounced, delegated to backend search endpoint
  useEffect(() => {
    if (!isAdmin) return undefined;
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
              }))
              .filter((item) => item.id && item.name)
          );
        })
        .catch((err) => {
          if (!mounted) return;
          setBahanError(err?.message || 'Gagal memuat bahan baku');
        })
        .finally(() => { if (mounted) setBahanLoading(false); });
    }, delay);
    return () => { mounted = false; clearTimeout(timer); };
  }, [isAdmin, searchAdmin]);

  // Load riwayat stok masuk (admin, only when tab is active)
  useEffect(() => {
    if (!isAdmin || activeAdminTab !== 'riwayat') return undefined;
    let mounted = true;
    async function loadHistory() {
      setHistoryLoading(true);
      setHistoryError('');
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const data = await api.get('stok-masuk', { headers });
        if (!mounted) return;
        const arr = Array.isArray(data) ? data : (data?.data ?? []);
        setOpnameHistory(arr);
      } catch (err) {
        if (!mounted) return;
        setHistoryError(err?.message || 'Gagal memuat riwayat stok masuk.');
      } finally {
        if (mounted) setHistoryLoading(false);
      }
    }
    loadHistory();
    return () => { mounted = false; };
  }, [isAdmin, activeAdminTab, token]);

  // Load pegawai list for name mapping (riwayat tab)
  useEffect(() => {
    if (!isAdmin || activeAdminTab !== 'riwayat') return undefined;
    let mounted = true;
    async function loadPegawai() {
      try {
        const data = await api.get('pegawai');
        if (!mounted) return;
        const arr = Array.isArray(data) ? data : (data?.data ?? []);
        const map = {};
        arr.forEach((p) => { map[p.id_pegawai] = p.nama_pegawai; });
        setPegawaiMap(map);
      } catch (_) { /* silently ignore */ }
    }
    loadPegawai();
    return () => { mounted = false; };
  }, [isAdmin, activeAdminTab]);

  // Load bahan for opname form (staff)
  useEffect(() => {
    if (isAdmin) return undefined;
    let mounted = true;
    async function loadOpnameBahan() {
      setOpnameLoading(true);
      setOpnameError('');
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const data = await api.get('stock-opname/bahan', { headers });
        if (!mounted) return;
        const arr = Array.isArray(data) ? data : (data?.data ?? []);
        const mapped = arr
          .map((item, idx) => ({
            id: item.id_bahan ?? item.id ?? idx,
            name: item.nama_bahan ?? item.name ?? '',
            unit: item.satuan_dasar ?? item.unit ?? '',
            bw: item.bw ?? null,
            bb: item.bb ?? null,
            utuh: '',
            sisa: '',
          }))
          .filter((item) => item.id && item.name);
        if (mapped.length) setRows(mapped);
      } catch (err) {
        if (!mounted) return;
        setOpnameError(err?.message || 'Gagal memuat bahan untuk stock opname.');
      } finally {
        if (mounted) setOpnameLoading(false);
      }
    }
    loadOpnameBahan();
    return () => { mounted = false; };
  }, [isAdmin, token]);

  // Auto-hide success toast
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
    const unitValue = (r.bb && r.bb > 1) ? r.bb : r.bw || 1;
    const total = utuh * unitValue + sisa;
    return { ...r, utuh, sisa, total };
  }), [rows]);

  // Staff: download PDF for a saved opname
  async function downloadPdf() {
    if (downloadLoading) return;
    if (!savedOpnameId) {
      setDownloadError('Simpan stock opname terlebih dahulu sebelum download PDF.');
      return;
    }
    setDownloadLoading(true);
    setDownloadError('');
    try {
      await downloadBlob(
        `${api.rawBase}/stock-opname/${savedOpnameId}/pdf`,
        `stock-opname-${savedOpnameId}.pdf`,
        token,
      );
    } catch (err) {
      setDownloadError(err?.message || 'Gagal download PDF.');
    } finally {
      setDownloadLoading(false);
    }
  }

  // Staff: save opname
  async function handleSaveOpname() {
    if (isSavingOpname) return;
    setSaveError('');
    try {
      setIsSavingOpname(true);
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      // Hanya kirim bahan yang diisi (minimal salah satu field diketik)
      const items = rows
        .filter((r) => r.utuh !== '' || r.sisa !== '')
        .map((r) => ({
          id_bahan: r.id,
          jumlah_utuh: Number(r.utuh) || 0,
          jumlah_sisa: Number(r.sisa) || 0,
        }));
      if (items.length === 0) {
        setSaveError('Isi minimal satu bahan sebelum menyimpan.');
        setIsSavingOpname(false);
        return;
      }
      const res = await api.post('stock-opname', { items }, { headers });
      setSavedOpnameId(res?.id_opname ?? null);
      setIsSaveConfirmOpen(false);
      setSuccessToast({ visible: true, message: 'Stock opname berhasil disimpan.' });
    } catch (err) {
      setSaveError(err?.message || 'Gagal menyimpan stock opname.');
    } finally {
      setIsSavingOpname(false);
    }
  }

  // Admin: download PDF from history list
  async function downloadHistoryPdf(id, tanggal) {
    if (historyDownloadingId === id) return;
    setHistoryDownloadingId(id);
    setHistoryDownloadError('');
    try {
      await downloadBlob(
        `${api.rawBase}/stock-opname/${id}/pdf`,
        `stock-opname-${tanggal}.pdf`,
        token,
      );
    } catch (err) {
      setHistoryDownloadError(err?.message || 'Gagal download PDF.');
    } finally {
      setHistoryDownloadingId(null);
    }
  }

  // Admin bahan baku CRUD
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
    if (!trimmedName) { setFormError('Nama bahan wajib diisi.'); return; }
    if (!trimmedUnit) { setFormError('Satuan wajib diisi.'); return; }
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

  // ─── ADMIN / OWNER VIEW ──────────────────────────────────────────────────────
  if (isAdmin) {
    return (
      <Layout>
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          <div style={{
            padding: '18px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: '1px solid var(--line)',
          }}>
            <div>
              <div className="kp-eyebrow" style={{ fontSize: 10 }}>{headerLabel}</div>
              <h1 style={{ fontSize: 20, margin: '4px 0 0' }}>Stock</h1>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {activeAdminTab === 'bahan' && (
                <>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8,
                    background: 'var(--surface)', border: '1px solid var(--line)', width: 260,
                  }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <circle cx="6" cy="6" r="4" stroke="var(--text-muted)" strokeWidth="1.4" />
                      <path d="M9 9l3 3" stroke="var(--text-muted)" strokeWidth="1.4" strokeLinecap="round" />
                    </svg>
                    <input
                      value={searchAdmin}
                      onChange={(e) => setSearchAdmin(e.target.value)}
                      placeholder="Cari bahan baku..."
                      style={{
                        fontSize: 13, color: 'var(--text)', flex: 1,
                        background: 'transparent', border: 'none', outline: 'none',
                        fontFamily: 'var(--font-sans)',
                      }}
                    />
                    {searchAdmin && (
                      <button onClick={() => setSearchAdmin('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16, padding: 0, lineHeight: 1 }}>×</button>
                    )}
                  </div>
                  <button className="kp-btn" onClick={openCreateModal}>+ New bahan</button>
                </>
              )}
            </div>
          </div>

          <div style={{ flex: 1, padding: '24px 32px', overflow: 'auto' }}>
          {/* Tab switcher */}
          <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--line)', marginBottom: 18 }}>
            {[['bahan', 'Bahan Baku'], ['riwayat', 'Riwayat Stok Masuk']].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveAdminTab(key)}
                style={{
                  padding: '10px 18px',
                  border: 'none',
                  borderBottom: activeAdminTab === key ? '2px solid #6B4F3A' : '2px solid transparent',
                  background: 'none',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: activeAdminTab === key ? 600 : 400,
                  color: activeAdminTab === key ? 'var(--text)' : 'var(--text-muted)',
                  marginBottom: -1,
                  transition: 'color 120ms',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ── Tab: Bahan Baku ── */}
          {activeAdminTab === 'bahan' && (
            <>
              <div className="kp-card" style={{ overflow: 'hidden' }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '100px 1.6fr 100px 1fr 180px',
                  padding: '14px 18px', borderBottom: '1px solid var(--line)',
                  fontSize: 11, fontFamily: 'var(--font-mono)',
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  color: 'var(--text-muted)', background: 'rgba(255,255,255,0.015)',
                }}>
                  <span>ID</span><span>Nama bahan</span><span>Jumlah</span><span>Satuan</span><span>Action</span>
                </div>

                {bahanLoading && (
                  <div style={{ padding: 18, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Loading bahan baku...</div>
                )}
                {!bahanLoading && bahanError && (
                  <div style={{ padding: 18, textAlign: 'center', color: 'var(--bad)', fontSize: 13 }}>{bahanError}</div>
                )}
                {!bahanLoading && !bahanError && bahanList.length === 0 && (
                  <div style={{ padding: 18, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                    {searchAdmin ? `Tidak ditemukan "${searchAdmin}"` : 'Data bahan baku kosong.'}
                  </div>
                )}

                {!bahanLoading && !bahanError && bahanList.map((item, i) => (
                  <div key={item.id} style={{
                    display: 'grid',
                    gridTemplateColumns: '100px 1.6fr 100px 1fr 180px',
                    padding: '14px 18px',
                    borderBottom: i < bahanList.length - 1 ? '1px solid var(--line)' : 'none',
                    fontSize: 13, alignItems: 'center',
                  }}>
                    <span className="kp-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.id}</span>
                    <span style={{ fontWeight: 500 }}>{item.name}</span>
                    <span style={{ fontWeight: 600, color: stokMasukTotals[item.id] ? 'var(--text)' : 'var(--text-muted)' }}>
                      {stokMasukTotals[item.id] != null ? Number(stokMasukTotals[item.id]).toLocaleString('id-ID') : '—'}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>{item.unit || '-'}</span>
                    <span>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button className="kp-btn kp-btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => openEditModal(item)}>Update</button>
                        <button className="kp-btn kp-btn-danger" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => openDeleteModal(item)}>Delete</button>
                      </div>
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── Tab: Riwayat Stok Masuk ── */}
          {activeAdminTab === 'riwayat' && (() => {
            const BULAN_NAMES = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
            const years = [];
            for (let y = 2024; y <= nowDate.getFullYear() + 1; y++) years.push(y);
            const selStyle = { padding: '7px 10px', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--line)', color: 'var(--text)', fontSize: 12, cursor: 'pointer', outline: 'none' };

            const daysInMonth = new Date(riwayatTahun, riwayatBulan, 0).getDate();

            const filtered = opnameHistory.filter((item) => {
              if (!item.created_at) return false;
              const d = new Date(item.created_at);
              if (d.getMonth() + 1 !== riwayatBulan || d.getFullYear() !== riwayatTahun) return false;
              if (riwayatTanggal !== 0 && d.getDate() !== riwayatTanggal) return false;
              if (riwayatSearch.trim()) {
                const namaBahan = item.bahan_baku?.nama_bahan ?? item.BahanBaku?.nama_bahan ?? '';
                if (!namaBahan.toLowerCase().includes(riwayatSearch.toLowerCase())) return false;
              }
              return true;
            });

            return (
              <>
                <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                  <select value={riwayatTanggal} onChange={(e) => setRiwayatTanggal(Number(e.target.value))} style={selStyle}>
                    <option value={0}>Semua Tanggal</option>
                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <select value={riwayatBulan} onChange={(e) => { setRiwayatBulan(Number(e.target.value)); setRiwayatTanggal(0); }} style={selStyle}>
                    {BULAN_NAMES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                  </select>
                  <select value={riwayatTahun} onChange={(e) => { setRiwayatTahun(Number(e.target.value)); setRiwayatTanggal(0); }} style={selStyle}>
                    {years.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>

                <div className="kp-card" style={{ overflow: 'hidden' }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '160px 1.6fr 90px 1fr',
                    padding: '12px 18px', borderBottom: '1px solid var(--line)',
                    fontSize: 11, fontFamily: 'var(--font-mono)',
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                    color: 'var(--text-muted)', background: 'rgba(255,255,255,0.015)',
                  }}>
                    <span>Tanggal &amp; Jam</span>
                    <span>Bahan</span>
                    <span>Jumlah</span>
                    <span>Dicatat Oleh</span>
                  </div>

                  {historyLoading && (
                    <div style={{ padding: 18, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Loading riwayat...</div>
                  )}
                  {!historyLoading && historyError && (
                    <div style={{ padding: 18, textAlign: 'center', color: 'var(--bad)', fontSize: 13 }}>{historyError}</div>
                  )}
                  {!historyLoading && !historyError && filtered.length === 0 && (
                    <div style={{ padding: 18, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                      Tidak ada stok masuk pada {riwayatTanggal !== 0 ? `${riwayatTanggal} ` : ''}{BULAN_NAMES[riwayatBulan - 1]} {riwayatTahun}.
                    </div>
                  )}

                  {!historyLoading && !historyError && filtered.map((item, i) => {
                    const tgl = item.created_at ? new Date(item.created_at) : null;
                    const tglLabel = tgl
                      ? `${tgl.getDate()} ${['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'][tgl.getMonth()]} ${tgl.getFullYear()}`
                      : '-';
                    const jamLabel = tgl
                      ? tgl.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                      : '';
                    const namaBahan = item.bahan_baku?.nama_bahan ?? item.BahanBaku?.nama_bahan ?? '-';
                    const satuan = item.bahan_baku?.satuan_dasar ?? item.BahanBaku?.satuan_dasar ?? '';
                    const namaPegawai = pegawaiMap[item.id_pegawai]
                      ?? item.pegawai?.nama_pegawai
                      ?? item.Pegawai?.nama_pegawai
                      ?? '-';
                    return (
                      <div key={item.id_masuk} style={{
                        display: 'grid',
                        gridTemplateColumns: '160px 1.6fr 90px 1fr',
                        padding: '12px 18px',
                        borderBottom: i < filtered.length - 1 ? '1px solid var(--line)' : 'none',
                        alignItems: 'center',
                        fontSize: 13,
                      }}>
                        <div>
                          <div className="kp-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{tglLabel}</div>
                          {jamLabel && <div className="kp-mono" style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{jamLabel}</div>}
                        </div>
                        <span style={{ fontWeight: 500 }}>{namaBahan}</span>
                        <span style={{ fontWeight: 700, color: '#4A7C59' }}>
                          {Number(item.jumlah).toLocaleString('id-ID')}
                          {satuan && <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: 4, fontSize: 11 }}>{satuan}</span>}
                        </span>
                        <span style={{ color: 'var(--text-muted)' }}>{namaPegawai}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            );
          })()}
          </div>
        </main>

        {/* Modal: form bahan baku */}
        {isFormOpen && (
          <div role="presentation" onClick={closeFormModal} style={{ position: 'fixed', inset: 0, background: 'rgba(8,10,12,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 55, padding: 16 }}>
            <div role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} style={{ width: 'min(520px, 100%)', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, padding: 22, boxShadow: '0 30px 60px rgba(0,0,0,0.4)' }}>
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

        {/* Modal: konfirmasi hapus */}
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

        {/* Toast */}
        <div style={{ position: 'fixed', top: 18, right: 18, zIndex: 60, pointerEvents: 'none', opacity: successToast.visible ? 1 : 0, transform: successToast.visible ? 'translateY(0)' : 'translateY(-10px)', transition: 'opacity 180ms ease, transform 180ms ease' }}>
          <div style={{ minWidth: 260, maxWidth: 360, padding: '12px 14px', borderRadius: 12, background: 'linear-gradient(135deg, rgba(107,79,58,0.95), rgba(43,32,16,0.96))', border: '1px solid rgba(255,255,255,0.16)', boxShadow: '0 18px 40px rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', gap: 12, color: '#F6F2EE' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>✓</div>
            <div>
              <div className="kp-mono" style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.8 }}>Success</div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{successToast.message}</div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // ─── STAFF VIEW ───────────────────────────────────────────────────────────────
  return (
    <Layout>
      <div style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div>
            <div className="kp-eyebrow" style={{ fontSize: 10 }}>{headerLabel}</div>
            <h1 style={{ fontSize: 20, margin: '4px 0 0' }}>Stock opname</h1>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="kp-btn kp-btn-ghost" onClick={() => { setRows(STOCK_ITEMS.map((s) => ({ ...s, utuh: '', sisa: '' }))); setSavedOpnameId(null); setDownloadError(''); }}>Reset</button>
            <button className="kp-btn" onClick={() => setIsSaveConfirmOpen(true)}>Save</button>
            <button
              className="kp-btn"
              onClick={downloadPdf}
              disabled={downloadLoading || !savedOpnameId}
              title={!savedOpnameId ? 'Simpan opname terlebih dahulu' : ''}
            >
              {downloadLoading ? 'Downloading...' : 'Download PDF'}
            </button>
          </div>
        </div>

        {opnameLoading && <div style={{ marginBottom: 10, color: 'var(--text-muted)', fontSize: 12 }}>Loading bahan opname...</div>}
        {opnameError && <div style={{ marginBottom: 10, color: 'var(--bad)', fontSize: 12 }}>{opnameError}</div>}
        {saveError && <div style={{ marginBottom: 10, color: 'var(--bad)', fontSize: 12 }}>{saveError}</div>}
        {downloadError && <div style={{ marginBottom: 10, color: 'var(--bad)', fontSize: 12 }}>{downloadError}</div>}
        {!savedOpnameId && (
          <div style={{ marginBottom: 10, color: 'var(--text-muted)', fontSize: 12 }}>
            Isi data opname lalu klik <strong>Save</strong>, kemudian tombol <strong>Download PDF</strong> akan aktif.
          </div>
        )}

        <div className="kp-card" style={{ padding: 12, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 980 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--text-muted)', fontSize: 12 }}>
                <th style={{ padding: '10px 12px', width: 320 }}>Bahan</th>
                <th style={{ padding: '10px 12px', width: 120 }}>Utuh</th>
                <th style={{ padding: '10px 12px', width: 120 }}>Sisa</th>
                <th style={{ padding: '10px 12px', width: 140, textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {computed.map((r) => (
                <tr key={r.id} style={{ borderTop: '1px solid var(--line)' }}>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text)' }}>{r.name}</div>
                    <div className="kp-mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.unit}</div>
                  </td>
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

        {/* Modal: konfirmasi simpan */}
        {isSaveConfirmOpen && (
          <div role="presentation" onClick={() => setIsSaveConfirmOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(8,10,12,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 55, padding: 16 }}>
            <div role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} style={{ width: 'min(520px, 100%)', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 16, padding: 22, boxShadow: '0 30px 60px rgba(0,0,0,0.45)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <div className="kp-eyebrow" style={{ fontSize: 10 }}>Konfirmasi</div>
                  <h2 style={{ margin: '6px 0 0', fontSize: 18 }}>Simpan stock opname?</h2>
                </div>
                <button className="kp-btn kp-btn-ghost" onClick={() => setIsSaveConfirmOpen(false)}>Tutup</button>
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                Pastikan Data Yang Anda Masukkan Sudah Sesuai. Anda Yakin Menyimpan Stock Opname ini?
              </div>
              {saveError && <div style={{ marginTop: 10, color: 'var(--bad)', fontSize: 12 }}>{saveError}</div>}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
                <button className="kp-btn kp-btn-ghost" onClick={() => setIsSaveConfirmOpen(false)}>Batal</button>
                <button className="kp-btn" onClick={handleSaveOpname} disabled={isSavingOpname}>
                  {isSavingOpname ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        <div style={{ position: 'fixed', top: 18, right: 18, zIndex: 60, pointerEvents: 'none', opacity: successToast.visible ? 1 : 0, transform: successToast.visible ? 'translateY(0)' : 'translateY(-10px)', transition: 'opacity 180ms ease, transform 180ms ease' }}>
          <div style={{ minWidth: 260, maxWidth: 360, padding: '12px 14px', borderRadius: 12, background: 'linear-gradient(135deg, rgba(107,79,58,0.95), rgba(43,32,16,0.96))', border: '1px solid rgba(255,255,255,0.16)', boxShadow: '0 18px 40px rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', gap: 12, color: '#F6F2EE' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>✓</div>
            <div>
              <div className="kp-mono" style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.8 }}>Success</div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{successToast.message}</div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
