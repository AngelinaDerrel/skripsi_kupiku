import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout.jsx';
import api from '../../lib/api.js';

const BULAN_NAMES = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

export default function RiwayatStokMasuk() {
  const token = localStorage.getItem('kupiku_token');
  const nowDate = new Date();
  const [history, setHistory]         = useState([]);
  const [historyLoading, setLoading]  = useState(false);
  const [historyError, setError]      = useState('');
  const [riwayatBulan, setBulan]      = useState(nowDate.getMonth() + 1);
  const [riwayatTahun, setTahun]      = useState(nowDate.getFullYear());
  const [riwayatTanggal, setTanggal]  = useState(0);
  const [riwayatSearch, setSearch]    = useState('');
  const [pegawaiMap, setPegawaiMap]   = useState({});

  const years = [];
  for (let y = 2024; y <= nowDate.getFullYear() + 1; y++) years.push(y);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError('');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    api.get('stok-masuk', { headers })
      .then((data) => {
        if (!mounted) return;
        const arr = Array.isArray(data) ? data : (data?.data ?? []);
        setHistory(arr);
      })
      .catch((err) => { if (!mounted) return; setError(err?.message || 'Gagal memuat riwayat stok masuk.'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    api.get('pegawai')
      .then((data) => {
        if (!mounted) return;
        const arr = Array.isArray(data) ? data : (data?.data ?? []);
        const map = {};
        arr.forEach((p) => { map[p.id_pegawai] = p.nama_pegawai; });
        setPegawaiMap(map);
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  const daysInMonth = new Date(riwayatTahun, riwayatBulan, 0).getDate();

  const filtered = history.filter((item) => {
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

  const selStyle = {
    padding: '7px 10px', borderRadius: 8,
    background: 'var(--surface)', border: '1px solid var(--line)',
    color: 'var(--text)', fontSize: 12, cursor: 'pointer', outline: 'none',
  };

  return (
    <AdminLayout>
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <div style={{ padding: '18px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line)' }}>
          <div>
            <div className="kp-eyebrow" style={{ fontSize: 10 }}>Workspace · Stok</div>
            <h1 style={{ fontSize: 20, margin: '4px 0 0' }}>Riwayat Stok Masuk</h1>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--line)', width: 220 }}>
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <circle cx="6" cy="6" r="4" stroke="var(--text-muted)" strokeWidth="1.4" />
                <path d="M9 9l3 3" stroke="var(--text-muted)" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              <input
                value={riwayatSearch}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama bahan..."
                style={{ fontSize: 13, color: 'var(--text)', flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: 'var(--font-sans)' }}
              />
              {riwayatSearch && (
                <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16, padding: 0 }}>×</button>
              )}
            </div>
          </div>
        </div>

        <div style={{ flex: 1, padding: '24px 32px', overflow: 'auto' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
            <select value={riwayatTanggal} onChange={(e) => setTanggal(Number(e.target.value))} style={selStyle}>
              <option value={0}>Semua Tanggal</option>
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <select value={riwayatBulan} onChange={(e) => { setBulan(Number(e.target.value)); setTanggal(0); }} style={selStyle}>
              {BULAN_NAMES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <select value={riwayatTahun} onChange={(e) => { setTahun(Number(e.target.value)); setTanggal(0); }} style={selStyle}>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 4 }}>{filtered.length} entri</span>
          </div>

          <div className="kp-card" style={{ overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '160px 1.6fr 90px 1fr', padding: '12px 18px', borderBottom: '1px solid var(--line)', fontSize: 11, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text)', background: 'rgba(255,255,255,0.025)' }}>
              <span>Tanggal &amp; Jam</span>
              <span>Bahan</span>
              <span>Jumlah</span>
              <span>Dicatat Oleh</span>
            </div>

            {historyLoading && <div style={{ padding: 18, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Loading riwayat...</div>}
            {!historyLoading && historyError && <div style={{ padding: 18, textAlign: 'center', color: 'var(--bad)', fontSize: 13 }}>{historyError}</div>}
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
              const jamLabel = tgl ? tgl.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '';
              const namaBahan  = item.bahan_baku?.nama_bahan ?? item.BahanBaku?.nama_bahan ?? '-';
              const satuan     = item.bahan_baku?.satuan_dasar ?? item.BahanBaku?.satuan_dasar ?? '';
              const namaPegawai = pegawaiMap[item.id_pegawai] ?? item.pegawai?.nama_pegawai ?? item.Pegawai?.nama_pegawai ?? '-';

              return (
                <div key={item.id_masuk} style={{ display: 'grid', gridTemplateColumns: '160px 1.6fr 90px 1fr', padding: '12px 18px', borderBottom: i < filtered.length - 1 ? '1px solid var(--line)' : 'none', alignItems: 'center', fontSize: 13 }}>
                  <div>
                    <div className="kp-mono" style={{ fontSize: 11 }}>{tglLabel}</div>
                    {jamLabel && <div className="kp-mono" style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{jamLabel}</div>}
                  </div>
                  <span style={{ fontWeight: 500 }}>{namaBahan}</span>
                  <span style={{ fontWeight: 700, color: '#4A7C59' }}>
                    {Number(item.jumlah).toLocaleString('id-ID')}
                    {satuan && <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: 4, fontSize: 11 }}>{satuan}</span>}
                  </span>
                  <span>{namaPegawai}</span>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </AdminLayout>
  );
}
