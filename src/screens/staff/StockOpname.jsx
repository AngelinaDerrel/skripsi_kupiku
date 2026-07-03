import React, { useState, useMemo, useEffect } from 'react';
import StaffLayout from '../StaffLayout.jsx';
import { STOCK_ITEMS } from '../../data/stockItems.js';
import api from '../../lib/api.js';
import { useToast } from '../../components/Toast.jsx';

function formatNumber(n) {
  if (n == null || n === '') return '';
  return Number(n).toLocaleString();
}

export default function StockOpname() {
  const toast = useToast();
  const token = localStorage.getItem('kupiku_token');

  const [rows, setRows] = useState(() => STOCK_ITEMS.map((s) => ({ ...s, utuh: '', sisa: '' })));
  const [opnameSearch, setOpnameSearch]     = useState('');
  const [opnameLoading, setOpnameLoading]   = useState(false);
  const [opnameError, setOpnameError]       = useState('');
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);
  const [isSavingOpname, setIsSavingOpname] = useState(false);
  const [saveError, setSaveError]           = useState('');
  const [savedOpnameId, setSavedOpnameId]   = useState(null);
  const [successToast, setSuccessToast]     = useState({ visible: false, message: '' });

  useEffect(() => {
    let mounted = true;
    setOpnameLoading(true);
    setOpnameError('');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    api.get('stock-opname/bahan', { headers })
      .then((data) => {
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
      })
      .catch((err) => { if (!mounted) return; setOpnameError(err?.message || 'Gagal memuat bahan untuk stock opname.'); })
      .finally(() => { if (mounted) setOpnameLoading(false); });
    return () => { mounted = false; };
  }, []);

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

  const filteredComputed = useMemo(() => {
    const q = opnameSearch.trim().toLowerCase();
    if (!q) return computed;
    return computed.filter((r) => r.name.toLowerCase().includes(q));
  }, [computed, opnameSearch]);

  async function handleSaveOpname() {
    if (isSavingOpname) return;
    setSaveError('');
    try {
      setIsSavingOpname(true);
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const items = rows
        .filter((r) => r.utuh !== '' || r.sisa !== '')
        .map((r) => ({ id_bahan: r.id, jumlah_utuh: Number(r.utuh) || 0, jumlah_sisa: Number(r.sisa) || 0 }));
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

  function handleOpenPdf() {
    if (!savedOpnameId) return;
    window.open(`/pdf/stock-opname/${savedOpnameId}`, '_blank');
  }

  function handleReset() {
    setRows(STOCK_ITEMS.map((s) => ({ ...s, utuh: '', sisa: '' })));
    setSavedOpnameId(null);
    setSaveError('');
  }

  return (
    <StaffLayout>
      <div style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div>
            <div className="kp-eyebrow" style={{ fontSize: 10 }}>Staff · Stock</div>
            <h1 style={{ fontSize: 20, margin: '4px 0 0' }}>Stock opname</h1>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.14)', width: 220 }}>
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <circle cx="6" cy="6" r="4" stroke="var(--text-muted)" strokeWidth="1.4" />
                <path d="M9 9l3 3" stroke="var(--text-muted)" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              <input
                value={opnameSearch}
                onChange={(e) => setOpnameSearch(e.target.value)}
                placeholder="Cari bahan baku..."
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: 'var(--text)', fontFamily: 'var(--font-sans)' }}
              />
              {opnameSearch && (
                <button onClick={() => setOpnameSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16, padding: 0, lineHeight: 1 }}>×</button>
              )}
            </div>
            <button className="kp-btn kp-btn-ghost" onClick={handleReset}>Reset</button>
            <button className="kp-btn" onClick={() => setIsSaveConfirmOpen(true)}>Save</button>
            <button
              className="kp-btn"
              onClick={handleOpenPdf}
              disabled={!savedOpnameId}
              title={!savedOpnameId ? 'Simpan opname terlebih dahulu' : ''}
            >
              Cetak PDF
            </button>
          </div>
        </div>

        {opnameLoading && <div style={{ marginBottom: 10, color: 'var(--text-muted)', fontSize: 12 }}>Loading bahan opname...</div>}
        {opnameError  && <div style={{ marginBottom: 10, color: 'var(--bad)', fontSize: 12 }}>{opnameError}</div>}
        {saveError    && <div style={{ marginBottom: 10, color: 'var(--bad)', fontSize: 12 }}>{saveError}</div>}
        {!savedOpnameId && (
          <div style={{ marginBottom: 10, fontSize: 12 }}>
            Isi data opname lalu klik <strong>Save</strong>, kemudian tombol <strong>Cetak PDF</strong> akan aktif.
          </div>
        )}

        <div className="kp-card" style={{ padding: 12, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 980 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--text)', fontSize: 12 }}>
                <th style={{ padding: '10px 12px', width: 320 }}>Bahan</th>
                <th style={{ padding: '10px 12px', width: 120 }}>Utuh</th>
                <th style={{ padding: '10px 12px', width: 120 }}>Sisa</th>
                <th style={{ padding: '10px 12px', width: 140, textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {filteredComputed.length === 0 && (
                <tr><td colSpan={4} style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  Tidak ditemukan &ldquo;{opnameSearch}&rdquo;
                </td></tr>
              )}
              {filteredComputed.map((r) => (
                <tr key={r.id} style={{ borderTop: '1px solid var(--line)' }}>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ fontWeight: 600 }}>{r.name}</div>
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
              <div style={{ fontSize: 13 }}>
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
    </StaffLayout>
  );
}
