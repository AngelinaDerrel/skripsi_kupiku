import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const BASE = import.meta.env.VITE_API_URL || '/api';

const BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const HARI  = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];

function fmtRp(n) { return 'Rp ' + Number(n).toLocaleString('id-ID'); }
function fmtTgl(ts) {
  const d = new Date(ts);
  return `${HARI[d.getDay()]}, ${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')} WIB`;
}

const SUHU = { ice: 'Es', hot: 'Panas' };
const GULA = { less_sugar: 'Gula Sedikit', normal: 'Normal', extra_sugar: 'Extra Gula' };
const ES   = { less_ice: 'Es Sedikit', normal: 'Normal', extra_ice: 'Extra Es' };

export default function PdfNota() {
  const { kode } = useParams();
  const [data, setData]       = useState(null);
  const [error, setError]     = useState(null);
  const [printed, setPrinted] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('kupiku_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    fetch(`${BASE}/pesanan/${kode}/detail`, { headers })
      .then((r) => { if (!r.ok) throw new Error('Gagal memuat data nota'); return r.json(); })
      .then(setData)
      .catch((e) => setError(e.message));
  }, [kode]);

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
  if (!data) return <div style={{ padding: 40, fontFamily: 'system-ui', textAlign: 'center' }}>Memuat nota...</div>;

  const statusLabel = data.status === 'menunggu_pembayaran' ? 'Menunggu Pembayaran' : 'Pembayaran Berhasil';
  const statusColor = data.status === 'menunggu_pembayaran' ? '#D97706' : '#059669';
  const now = fmtTgl(new Date());

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DejaVu Sans', system-ui, sans-serif; font-size: 12px; color: #111; padding: 24px 28px; }
        .brand { text-align: center; font-size: 16px; font-weight: bold; color: #6B4F3A; margin-bottom: 2px; }
        .brand-sub { text-align: center; font-size: 9px; color: #aaa; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 14px; }
        h1 { font-size: 14px; font-weight: bold; text-align: center; margin: 4px 0 14px; }
        .info-table { width: 100%; border-top: 2px solid #6B4F3A; border-bottom: 1px solid #ddd; margin-bottom: 12px; border-collapse: collapse; }
        .info-table td { padding: 5px 0; font-size: 11px; color: #555; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        thead tr { background: #6B4F3A; color: #fff; }
        th { padding: 7px 10px; text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: 1px; }
        td { padding: 7px 10px; border-bottom: 1px solid #eee; }
        .total-row td { background: #fdf8f5; border-top: 2px solid #6B4F3A; font-weight: bold; }
        .footer { margin-top: 16px; font-size: 9px; color: #bbb; text-align: right; border-top: 1px solid #eee; padding-top: 5px; }
        .no-print { text-align: center; margin-bottom: 14px; }
        @media print { .no-print { display: none !important; } }
      `}</style>

      <div className="no-print">
        <button onClick={() => window.print()} style={{ padding: '8px 20px', background: '#6B4F3A', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', marginRight: 8 }}>Print / Simpan PDF</button>
        <button onClick={() => window.close()} style={{ padding: '8px 16px', border: '1px solid #ccc', borderRadius: 6, cursor: 'pointer' }}>Tutup</button>
      </div>

      <div className="brand">Kupiku Coffee</div>
      <div className="brand-sub">Yogyakarta</div>
      <h1>Nota Konfirmasi Pesanan</h1>

      <table className="info-table">
        <tbody>
          <tr>
            <td>Kode Pesanan: <strong>{data.kode_pesanan}</strong></td>
            <td style={{ textAlign: 'right' }}>Tanggal: {fmtTgl(data.created_at)}</td>
          </tr>
          <tr>
            <td>Pelanggan: <strong>{data.user?.name ?? 'Tamu'}</strong></td>
            <td style={{ textAlign: 'right' }}>
              Status: <span style={{ color: statusColor, fontWeight: 'bold' }}>{statusLabel}</span>
            </td>
          </tr>
        </tbody>
      </table>

      <table>
        <thead>
          <tr>
            <th>Menu</th>
            <th style={{ textAlign: 'center' }}>Suhu</th>
            <th style={{ textAlign: 'center' }}>Gula</th>
            <th style={{ textAlign: 'center' }}>Es</th>
            <th style={{ textAlign: 'right' }}>Harga</th>
          </tr>
        </thead>
        <tbody>
          {(data.items || []).map((item, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
              <td>{item.nama_menu}</td>
              <td style={{ textAlign: 'center' }}>{SUHU[item.suhu] ?? item.suhu}</td>
              <td style={{ textAlign: 'center' }}>{GULA[item.tingkat_gula] ?? item.tingkat_gula}</td>
              <td style={{ textAlign: 'center' }}>{item.tingkat_es ? (ES[item.tingkat_es] ?? item.tingkat_es) : '-'}</td>
              <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmtRp(item.harga_saat_pesan)}</td>
            </tr>
          ))}
          <tr className="total-row">
            <td colSpan={4} style={{ fontSize: 12 }}>Total</td>
            <td style={{ textAlign: 'right', fontSize: 13, color: '#6B4F3A' }}>{fmtRp(data.total_harga)}</td>
          </tr>
        </tbody>
      </table>

      <div className="footer">Dicetak: {now} — Kupiku Coffee</div>
    </>
  );
}
