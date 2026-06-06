import React, { useState, useMemo, useEffect, useContext } from 'react';
import StaffLayout, { StaffSearchContext } from './StaffLayout.jsx';
import api from '../lib/api.js';

const inputStyle = {
  padding: '8px 10px',
  borderRadius: 8,
  border: '1px solid var(--line-strong)',
  background: 'var(--surface)',
  color: 'var(--text)',
  fontSize: 13,
  width: '100%',
  boxSizing: 'border-box',
};

function formatDate(d) {
  if (!d) return '-';
  try { return new Date(d).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }); }
  catch { return new Date(d).toLocaleString(); }
}

function formatNumber(n) {
  if (n == null || n === '') return '';
  return Number(n).toLocaleString('id-ID');
}

function isToday(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
}

export default function StokMasuk() {
  const [activeTab, setActiveTab] = useState('input');

  const [bahanList, setBahanList] = useState([]);
  const [bahanLoading, setBahanLoading] = useState(false);
  const [bahanError, setBahanError] = useState(null);

  const [inputs, setInputs] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [savingAll, setSavingAll] = useState(false);

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);

  const { search, setSearch } = useContext(StaffSearchContext);
  const [toast, setToast] = useState({ visible: false, message: '', ok: true });

  // Get logged-in user info once
  const loggedUser = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('kupiku_user') || 'null'); }
    catch { return null; }
  }, []);

  const loggedIdPegawai = loggedUser?.id_pegawai ?? loggedUser?.id ?? null;
  const loggedNamaPegawai = loggedUser?.nama_pegawai ?? loggedUser?.name ?? null;

  async function fetchHistory() {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const stokData = await api.get('stok-masuk');
      const stokArr = Array.isArray(stokData) ? stokData : (stokData?.data ?? []);
      setHistory(stokArr);
    } catch (err) {
      setHistoryError(err?.message || 'Gagal memuat riwayat stok masuk.');
    } finally {
      setHistoryLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;

    async function loadBahan() {
      setBahanLoading(true);
      setBahanError(null);
      try {
        const bahanData = await api.get('bahanbaku');
        if (!mounted) return;
        const bahanArr = Array.isArray(bahanData) ? bahanData : (bahanData?.data ?? []);
        const mapped = bahanArr
          .map((item, idx) => ({
            id: item.id_bahan ?? item.id ?? idx,
            name: item.nama_bahan ?? '',
            unit: item.satuan_dasar ?? '',
          }))
          .filter((i) => i.id && i.name);
        setBahanList(mapped);
        const initInputs = {};
        mapped.forEach((b) => { initInputs[b.id] = { jumlah: '', keterangan: '' }; });
        setInputs(initInputs);
      } catch (err) {
        if (mounted) setBahanError(err?.message || 'Gagal memuat bahan baku');
      } finally {
        if (mounted) setBahanLoading(false);
      }
    }

    loadBahan();
    fetchHistory();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!toast.visible) return undefined;
    const t = setTimeout(() => setToast((p) => ({ ...p, visible: false })), 2400);
    return () => clearTimeout(t);
  }, [toast.visible]);

  function showToast(message, ok = true) {
    setToast({ visible: true, message, ok });
  }

  function updateInput(id, field, value) {
    setInputs((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || { jumlah: '', keterangan: '' }), [field]: value },
    }));
  }

  async function handleSimpan(bahan) {
    const inp = inputs[bahan.id] || {};
    const jumlah = Number(inp.jumlah);
    if (!jumlah || jumlah < 1) {
      showToast('Jumlah harus lebih dari 0.', false);
      return;
    }
    setSavingId(bahan.id);
    try {
      const payload = {
        id_bahan: bahan.id,
        jumlah,
        keterangan: inp.keterangan || '',
        ...(loggedIdPegawai ? { id_pegawai: loggedIdPegawai } : {}),
      };
      const created = await api.post('stok-masuk', payload);

      setHistory((prev) => [{
        ...created,
        bahan_baku: created.bahan_baku ?? { nama_bahan: bahan.name, satuan_dasar: bahan.unit },
        pegawai: created.pegawai ?? (loggedNamaPegawai ? { nama_pegawai: loggedNamaPegawai } : null),
      }, ...prev]);
      setInputs((prev) => ({ ...prev, [bahan.id]: { jumlah: '', keterangan: '' } }));
      showToast(`Stok ${bahan.name} berhasil disimpan.`, true);
    } catch (err) {
      showToast(err?.message || 'Gagal menyimpan stok.', false);
    } finally {
      setSavingId(null);
    }
  }

  async function handleSimpanSemua() {
    const targets = filteredBahan.filter((b) => {
      const jumlah = Number(inputs[b.id]?.jumlah);
      return jumlah && jumlah >= 1;
    });

    if (targets.length === 0) {
      showToast('Isi jumlah minimal satu bahan terlebih dahulu.', false);
      return;
    }

    setSavingAll(true);
    const results = await Promise.allSettled(
      targets.map((bahan) => {
        const inp = inputs[bahan.id] || {};
        const payload = {
          id_bahan: bahan.id,
          jumlah: Number(inp.jumlah),
          keterangan: inp.keterangan || '',
          ...(loggedIdPegawai ? { id_pegawai: loggedIdPegawai } : {}),
        };
        return api.post('stok-masuk', payload).then((created) => ({ bahan, created }));
      })
    );

    const berhasil = results.filter((r) => r.status === 'fulfilled').map((r) => r.value);
    const gagal = results.filter((r) => r.status === 'rejected');

    if (berhasil.length > 0) {
      setHistory((prev) => [
        ...berhasil.map(({ bahan, created }) => ({
          ...created,
          bahan_baku: created.bahan_baku ?? { nama_bahan: bahan.name, satuan_dasar: bahan.unit },
          pegawai: created.pegawai ?? (loggedNamaPegawai ? { nama_pegawai: loggedNamaPegawai } : null),
        })),
        ...prev,
      ]);
      setInputs((prev) => {
        const next = { ...prev };
        berhasil.forEach(({ bahan }) => { next[bahan.id] = { jumlah: '', keterangan: '' }; });
        return next;
      });
    }

    if (gagal.length === 0) {
      showToast(`${berhasil.length} bahan berhasil disimpan.`, true);
    } else if (berhasil.length === 0) {
      showToast('Semua gagal disimpan. Coba lagi.', false);
    } else {
      showToast(`${berhasil.length} berhasil, ${gagal.length} gagal disimpan.`, false);
    }

    setSavingAll(false);
  }

  const filteredBahan = useMemo(() => {
    if (!search.trim()) return bahanList;
    const q = search.toLowerCase();
    return bahanList.filter((b) => b.name.toLowerCase().includes(q));
  }, [bahanList, search]);

  const todayHistory = useMemo(() => history.filter((e) => isToday(e.created_at)), [history]);

  const colForm = '1.8fr 72px 150px 1.6fr 116px';
  const colHistory = '168px 1.6fr 90px 1.6fr 1fr';

  const tabStyle = (key) => ({
    padding: '10px 18px',
    border: 'none',
    borderBottom: activeTab === key ? '2px solid #6B4F3A' : '2px solid transparent',
    background: 'none',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: activeTab === key ? 600 : 400,
    color: activeTab === key ? 'var(--text)' : 'var(--text-muted)',
    marginBottom: -1,
    transition: 'color 120ms',
  });

  return (
    <StaffLayout>
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── HEADER ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div className="kp-eyebrow" style={{ fontSize: 10 }}>Staff · Stock</div>
            <h1 style={{ fontSize: 20, margin: '4px 0 0' }}>Stok masuk</h1>
          </div>
          {activeTab === 'input' && (
            <button
              className="kp-btn"
              style={{ padding: '8px 20px', fontSize: 13, alignSelf: 'flex-end' }}
              onClick={handleSimpanSemua}
              disabled={savingAll || savingId !== null}
            >
              {savingAll ? 'Menyimpan...' : 'Simpan Semua'}
            </button>
          )}
          {activeTab === 'riwayat' && (
            <button
              className="kp-btn kp-btn-ghost"
              style={{ padding: '6px 14px', fontSize: 12, alignSelf: 'flex-end' }}
              onClick={fetchHistory}
              disabled={historyLoading}
            >
              {historyLoading ? 'Loading...' : 'Refresh'}
            </button>
          )}
        </div>

        {/* ── TAB SWITCHER ── */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--line)' }}>
          <button style={tabStyle('input')} onClick={() => setActiveTab('input')}>
            Input Stok Masuk
          </button>
          <button style={tabStyle('riwayat')} onClick={() => setActiveTab('riwayat')}>
            Riwayat Hari Ini
            {todayHistory.length > 0 && (
              <span style={{
                marginLeft: 6,
                padding: '1px 7px',
                borderRadius: 20,
                background: activeTab === 'riwayat' ? '#6B4F3A' : 'var(--line)',
                color: activeTab === 'riwayat' ? '#fff' : 'var(--text-muted)',
                fontSize: 11,
                fontWeight: 600,
                verticalAlign: 'middle',
              }}>
                {todayHistory.length}
              </span>
            )}
          </button>
        </div>

        {/* ── TAB: INPUT STOK MASUK ── */}
        {activeTab === 'input' && (
          <section>
            <div className="kp-card" style={{ overflowX: 'auto' }}>
              {/* header */}
              <div style={{
                display: 'grid', gridTemplateColumns: colForm,
                padding: '12px 16px', borderBottom: '1px solid var(--line)',
                fontSize: 11, fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase', letterSpacing: '0.08em',
                color: 'var(--text-muted)', background: 'rgba(255,255,255,0.015)',
                minWidth: 640,
              }}>
                <span>Nama Bahan</span>
                <span>Satuan</span>
                <span>Jumlah Masuk</span>
                <span>Keterangan</span>
                <span style={{ textAlign: 'right' }}>Aksi</span>
              </div>

              {bahanLoading && (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  Loading bahan baku...
                </div>
              )}
              {!bahanLoading && bahanError && (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--bad)', fontSize: 13 }}>{bahanError}</div>
              )}
              {!bahanLoading && !bahanError && filteredBahan.length === 0 && (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  {search ? `Tidak ditemukan "${search}"` : 'Data bahan baku kosong.'}
                </div>
              )}

              {!bahanLoading && !bahanError && filteredBahan.map((bahan, i) => {
                const inp = inputs[bahan.id] || { jumlah: '', keterangan: '' };
                const isSaving = savingId === bahan.id || savingAll;
                return (
                  <div
                    key={bahan.id}
                    style={{
                      display: 'grid', gridTemplateColumns: colForm,
                      padding: '10px 16px', alignItems: 'center',
                      borderBottom: i < filteredBahan.length - 1 ? '1px solid var(--line)' : 'none',
                      minWidth: 640, gap: 8,
                    }}
                  >
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{bahan.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{bahan.unit || '-'}</div>
                    <div>
                      <input
                        type="number"
                        min="1"
                        value={inp.jumlah}
                        onChange={(e) => updateInput(bahan.id, 'jumlah', e.target.value)}
                        placeholder="0"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={inp.keterangan}
                        onChange={(e) => updateInput(bahan.id, 'keterangan', e.target.value)}
                        placeholder="Keterangan (opsional)"
                        style={inputStyle}
                      />
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <button
                        className="kp-btn"
                        style={{ padding: '6px 16px', fontSize: 12 }}
                        onClick={() => handleSimpan(bahan)}
                        disabled={isSaving}
                      >
                        {isSaving ? 'Menyimpan...' : 'Simpan'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── TAB: RIWAYAT HARI INI ── */}
        {activeTab === 'riwayat' && (
          <section>
            <div style={{ marginBottom: 10 }}>
              <div className="kp-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {todayHistory.length} entri tercatat hari ini
              </div>
            </div>

            <div className="kp-card" style={{ overflowX: 'auto' }}>
              <div style={{
                display: 'grid', gridTemplateColumns: colHistory,
                padding: '12px 16px', borderBottom: '1px solid var(--line)',
                fontSize: 11, fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase', letterSpacing: '0.08em',
                color: 'var(--text-muted)', background: 'rgba(255,255,255,0.015)',
                minWidth: 680,
              }}>
                <span>Tanggal &amp; Jam</span>
                <span>Nama Bahan</span>
                <span>Jumlah</span>
                <span>Keterangan</span>
                <span>Dicatat Oleh</span>
              </div>

              {historyLoading && (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  Loading riwayat...
                </div>
              )}
              {!historyLoading && historyError && (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--bad)', fontSize: 13 }}>{historyError}</div>
              )}
              {!historyLoading && !historyError && todayHistory.length === 0 && (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  Belum ada stok masuk yang dicatat hari ini.
                </div>
              )}

              {!historyLoading && !historyError && todayHistory.map((entry, i) => {
                const namaBahan = entry.bahan_baku?.nama_bahan ?? '-';
                const satuan = entry.bahan_baku?.satuan_dasar ?? '';
                const namaStaff = entry.pegawai?.nama_pegawai ?? entry.pegawai?.name ?? '-';
                const tgl = entry.created_at ? new Date(entry.created_at) : null;
                const tglLabel = tgl
                  ? `${tgl.getDate()} ${['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'][tgl.getMonth()]} ${tgl.getFullYear()}`
                  : '-';
                const jamLabel = tgl
                  ? tgl.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                  : '';
                return (
                  <div
                    key={entry.id_masuk ?? i}
                    style={{
                      display: 'grid', gridTemplateColumns: colHistory,
                      padding: '10px 16px', alignItems: 'center',
                      borderBottom: i < todayHistory.length - 1 ? '1px solid var(--line)' : 'none',
                      fontSize: 13, minWidth: 680,
                    }}
                  >
                    <div>
                      <div className="kp-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{tglLabel}</div>
                      <div className="kp-mono" style={{ fontSize: 12, marginTop: 1 }}>{jamLabel}</div>
                    </div>
                    <span style={{ fontWeight: 500 }}>{namaBahan}</span>
                    <span style={{ fontWeight: 600 }}>
                      {formatNumber(entry.jumlah)}{satuan ? ` ${satuan}` : ''}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{entry.keterangan || '-'}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{namaStaff}</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {/* ── TOAST ── */}
      <div style={{
        position: 'fixed', top: 18, right: 18, zIndex: 60,
        pointerEvents: 'none',
        opacity: toast.visible ? 1 : 0,
        transform: toast.visible ? 'translateY(0)' : 'translateY(-10px)',
        transition: 'opacity 180ms ease, transform 180ms ease',
      }}>
        <div style={{
          minWidth: 260, maxWidth: 360, padding: '12px 14px', borderRadius: 12,
          background: toast.ok
            ? 'linear-gradient(135deg, rgba(107,79,58,0.95), rgba(43,32,16,0.96))'
            : 'linear-gradient(135deg, rgba(160,50,40,0.95), rgba(80,20,15,0.96))',
          border: '1px solid rgba(255,255,255,0.16)',
          boxShadow: '0 18px 40px rgba(0,0,0,0.35)',
          display: 'flex', alignItems: 'center', gap: 12, color: '#F6F2EE',
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'rgba(255,255,255,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
          }}>
            {toast.ok ? '✓' : '!'}
          </div>
          <div>
            <div className="kp-mono" style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.8 }}>
              {toast.ok ? 'Berhasil' : 'Perhatian'}
            </div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{toast.message}</div>
          </div>
        </div>
      </div>
    </StaffLayout>
  );
}
