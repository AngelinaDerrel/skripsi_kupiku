import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const BASE = import.meta.env.VITE_API_URL || '/api';

const BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const HARI  = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];

function fmtRp(n) { return 'Rp ' + Number(n).toLocaleString('id-ID'); }
function nowLabel() {
  const n = new Date();
  return `${HARI[n.getDay()]}, ${n.getDate()} ${BULAN[n.getMonth()]} ${n.getFullYear()}, ${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`;
}

export default function PdfPenjualanBulanan() {
  const [searchParams] = useSearchParams();
  const bulan = Number(searchParams.get('bulan')) || new Date().getMonth() + 1;
  const tahun = Number(searchParams.get('tahun')) || new Date().getFullYear();
  const [data, setData]       = useState(null);
  const [error, setError]     = useState(null);
  const [printed, setPrinted] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('kupiku_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    fetch(`${BASE}/laporan/penjualan/menu-bulanan?bulan=${bulan}&tahun=${tahun}`, { headers })
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
  if (!data) return <div style={{ padding: 40, fontFamily: 'system-ui', textAlign: 'center' }}>Memuat data laporan bulanan...</div>;

  const periodLabel = `${BULAN[bulan - 1]} ${tahun}`;

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
        .total-box { background: #f8f5f2; border-left: 4px solid #6B4F3A; padding: 10px 14px; margin-bottom: 16px; display: inline-block; }
        .total-label { font-size: 9px; color: #888; text-transform: uppercase; letter-spacing: 1px; }
        .total-value { font-size: 19px; font-weight: bold; color: #6B4F3A; }
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
      <h1>Laporan Penjualan Bulanan</h1>

      <table className="info-table">
        <tbody>
          <tr>
            <td>Periode: <strong>{periodLabel}</strong></td>
            <td style={{ textAlign: 'right' }}>Dicetak: {nowLabel()}</td>
          </tr>
        </tbody>
      </table>

      <div className="total-box">
        <div className="total-label">Total Pendapatan</div>
        <div className="total-value">{fmtRp(data.total_pendapatan)}</div>
      </div>

      <table>
        <thead>
          <tr>
            <th>ID Menu</th>
            <th>Menu</th>
            <th>Kategori</th>
            <th style={{ textAlign: 'center' }}>Qty Terjual</th>
          </tr>
        </thead>
        <tbody>
          {(data.menus || []).map((m, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
              <td>{m.id_menu}</td>
              <td>{m.nama_menu}</td>
              <td>{m.nama_kategori}</td>
              <td style={{ textAlign: 'center' }}>{m.qty_terjual}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="footer">Kupiku Coffee — Laporan Penjualan Bulanan {periodLabel}</div>
    </>
  );
}
