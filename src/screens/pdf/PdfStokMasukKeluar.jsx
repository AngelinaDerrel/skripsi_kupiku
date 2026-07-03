import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const BASE = import.meta.env.VITE_API_URL || '/api';

const BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const HARI  = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];

function nowLabel() {
  const n = new Date();
  return `${HARI[n.getDay()]}, ${n.getDate()} ${BULAN[n.getMonth()]} ${n.getFullYear()}, ${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`;
}

export default function PdfStokMasukKeluar() {
  const [searchParams] = useSearchParams();
  const bulan = Number(searchParams.get('bulan')) || new Date().getMonth() + 1;
  const tahun = Number(searchParams.get('tahun')) || new Date().getFullYear();
  const [data, setData]       = useState(null);
  const [error, setError]     = useState(null);
  const [printed, setPrinted] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('kupiku_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    fetch(`${BASE}/laporan/stok?bulan=${bulan}&tahun=${tahun}`, { headers })
      .then((r) => { if (!r.ok) throw new Error('Gagal memuat data'); return r.json(); })
      .then(setData)
      .catch((e) => setError(e.message));
  }, [bulan, tahun]);

  useEffect(() => {
    if (data && !printed) {
      setPrinted(true);
      setTimeout(() => window.print(), 500);
    }
  }, [data, printed]);

  if (error) return (
    <div style={{ padding: 40, fontFamily: 'system-ui', color: '#c00', textAlign: 'center' }}>
      <p>{error}</p>
      <button onClick={() => window.close()} style={{ marginTop: 12, padding: '8px 20px', cursor: 'pointer' }}>Tutup</button>
    </div>
  );
  if (!data) return <div style={{ padding: 40, fontFamily: 'system-ui', textAlign: 'center' }}>Memuat data laporan stok...</div>;

  const rows        = data.data || [];
  const periodLabel = `${BULAN[bulan - 1]} ${tahun}`;
  const totalMasuk  = rows.reduce((s, d) => s + d.total_masuk, 0);
  const totalKeluar = rows.reduce((s, d) => s + d.total_keluar, 0);

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: system-ui, sans-serif; font-size: 12px; color: #111; padding: 28px 32px; }
        .brand { text-align: center; font-size: 17px; font-weight: bold; color: #6B4F3A; margin-bottom: 2px; }
        .brand-sub { text-align: center; font-size: 9px; color: #aaa; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 16px; }
        h1 { font-size: 16px; font-weight: bold; text-align: center; margin: 4px 0 14px; }
        .info-table { width: 100%; border-top: 2px solid #6B4F3A; border-bottom: 1px solid #ddd; margin-bottom: 14px; border-collapse: collapse; }
        .info-table td { padding: 7px 0; font-size: 11px; color: #555; }
        .summary { display: flex; gap: 16px; margin-bottom: 16px; }
        .summary-card { flex: 1; padding: 10px 14px; border-left: 4px solid; }
        .summary-card.masuk { border-color: #4A7C59; background: #f0faf4; }
        .summary-card.keluar { border-color: #B05A5A; background: #fdf0f0; }
        .summary-label { font-size: 9px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px; }
        .summary-value-masuk { font-size: 18px; font-weight: bold; color: #4A7C59; }
        .summary-value-keluar { font-size: 18px; font-weight: bold; color: #B05A5A; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        thead tr { background: #6B4F3A; color: #fff; }
        th { padding: 8px 10px; text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: 1px; }
        td { padding: 7px 10px; border-bottom: 1px solid #eee; }
        .footer { margin-top: 18px; font-size: 9px; color: #bbb; text-align: right; border-top: 1px solid #eee; padding-top: 6px; }
        .no-print { text-align: center; margin-bottom: 14px; }
        @media print { .no-print { display: none !important; } }
      `}</style>

      <div className="no-print">
        <button onClick={() => window.print()} style={{ padding: '8px 20px', background: '#6B4F3A', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', marginRight: 8 }}>Print / Simpan PDF</button>
        <button onClick={() => window.close()} style={{ padding: '8px 16px', border: '1px solid #ccc', borderRadius: 6, cursor: 'pointer' }}>Tutup</button>
      </div>

      <div className="brand">Kupiku Coffee</div>
      <div className="brand-sub">Yogyakarta</div>
      <h1>Laporan Stok Masuk / Keluar</h1>

      <table className="info-table">
        <tbody>
          <tr>
            <td>Periode: <strong>{periodLabel}</strong></td>
            <td style={{ textAlign: 'right' }}>Dicetak: {nowLabel()}</td>
          </tr>
        </tbody>
      </table>

      <div className="summary">
        <div className="summary-card masuk">
          <div className="summary-label">Total Masuk (semua bahan)</div>
          <div className="summary-value-masuk">{totalMasuk} unit</div>
        </div>
        <div className="summary-card keluar">
          <div className="summary-label">Total Keluar (semua bahan)</div>
          <div className="summary-value-keluar">{totalKeluar} unit</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Bahan</th>
            <th style={{ textAlign: 'center' }}>Masuk</th>
            <th style={{ textAlign: 'center' }}>Keluar</th>
            <th style={{ textAlign: 'center' }}>Stok Saat Ini</th>
            <th>Satuan</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((d, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
              <td>{d.nama_bahan}</td>
              <td style={{ textAlign: 'center', color: '#4A7C59', fontWeight: 600 }}>{d.total_masuk}</td>
              <td style={{ textAlign: 'center', color: '#B05A5A', fontWeight: 600 }}>{d.total_keluar}</td>
              <td style={{ textAlign: 'center', fontWeight: 700 }}>{d.stok_saat_ini}</td>
              <td style={{ color: '#888' }}>{d.satuan}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="footer">Kupiku Coffee — Laporan Stok Masuk/Keluar {periodLabel}</div>
    </>
  );
}
