import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { downloadPdfFromElement } from '../../lib/pdf.js';

const BASE = import.meta.env.VITE_API_URL || '/api';

const BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const HARI  = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];

function fmtRp(n) { return 'Rp ' + Number(n).toLocaleString('id-ID'); }
function fmtTglStr(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return `${HARI[d.getDay()]}, ${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
}
function fmtWaktu(ts) {
  if (!ts) return '-';
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}
function nowLabel() {
  const n = new Date();
  return `${HARI[n.getDay()]}, ${n.getDate()} ${BULAN[n.getMonth()]} ${n.getFullYear()}, ${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`;
}

export default function PdfPenjualanHarian() {
  const [searchParams] = useSearchParams();
  const tanggal = searchParams.get('tanggal');
  const [data, setData]             = useState(null);
  const [error, setError]           = useState(null);
  const [downloaded, setDownloaded] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    if (!tanggal) { setError('Parameter tanggal tidak ditemukan'); return; }
    const token = localStorage.getItem('kupiku_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    fetch(`${BASE}/laporan/penjualan/detail-harian?tanggal=${tanggal}`, { headers })
      .then((r) => { if (!r.ok) throw new Error('Gagal memuat data'); return r.json(); })
      .then(setData)
      .catch((e) => setError(e.message));
  }, [tanggal]);

  useEffect(() => {
    if (data && !downloaded) {
      setDownloaded(true);
      setTimeout(async () => {
        try {
          await downloadPdfFromElement(contentRef.current, `penjualan-harian-${tanggal}.pdf`);
        } finally {
          window.close();
        }
      }, 300);
    }
  }, [data, downloaded]);

  if (error) return (
    <div style={{ padding: 40, fontFamily: 'system-ui', color: '#c00', textAlign: 'center' }}>
      <p>{error}</p>
      <button onClick={() => window.close()} style={{ marginTop: 12, padding: '8px 20px', cursor: 'pointer' }}>Tutup</button>
    </div>
  );
  if (!data) return <div style={{ padding: 40, fontFamily: 'system-ui', textAlign: 'center' }}>Memuat data laporan harian...</div>;

  const reportDate = fmtTglStr(tanggal);

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .pdf-page { font-family: system-ui, sans-serif; font-size: 12px; color: #111; padding: 28px 32px; background: #fff; }
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
      `}</style>

      <div style={{
        position: 'fixed', inset: 0, zIndex: 10, background: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'system-ui', textAlign: 'center',
      }}>Menyiapkan &amp; mengunduh PDF...</div>

      <div ref={contentRef} className="pdf-page" style={{ width: '780px' }}>
        <div className="brand">Kupiku Coffee</div>
        <div className="brand-sub">Yogyakarta</div>
        <h1>Rekap Total Penjualan Harian</h1>

        <table className="info-table">
          <tbody>
            <tr>
              <td><strong>{reportDate}</strong></td>
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
              <th>Kode Pesanan</th>
              <th>Waktu</th>
              <th>Menu</th>
              <th style={{ textAlign: 'center' }}>Qty</th>
              <th style={{ textAlign: 'right' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {(data.rows || []).map((r, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                <td>{r.kode_pesanan}</td>
                <td>{fmtWaktu(r.waktu_pemesanan)}</td>
                <td>{r.menu}</td>
                <td style={{ textAlign: 'center' }}>{r.qty}</td>
                <td style={{ textAlign: 'right' }}>{fmtRp(r.total_harga)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="footer">Kupiku Coffee — Laporan Penjualan Harian {reportDate}</div>
      </div>
    </>
  );
}
