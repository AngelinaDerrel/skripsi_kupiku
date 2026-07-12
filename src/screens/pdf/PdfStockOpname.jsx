import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { downloadPdfFromElement } from '../../lib/pdf.js';

const BASE = import.meta.env.VITE_API_URL || '/api';

const BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const HARI  = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];

function fmtTgl(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return `${HARI[d.getDay()]}, ${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
}
function nowLabel() {
  const n = new Date();
  return `${HARI[n.getDay()]}, ${n.getDate()} ${BULAN[n.getMonth()]} ${n.getFullYear()}, ${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`;
}
function fmtNum(n) {
  if (n == null) return '-';
  return Number(n).toLocaleString('id-ID');
}

export default function PdfStockOpname() {
  const { id } = useParams();
  const [data, setData]             = useState(null);
  const [error, setError]           = useState(null);
  const [downloaded, setDownloaded] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('kupiku_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    fetch(`${BASE}/stock-opname/${id}`, { headers })
      .then((r) => { if (!r.ok) throw new Error('Gagal memuat data stock opname'); return r.json(); })
      .then(setData)
      .catch((e) => setError(e.message));
  }, [id]);

  useEffect(() => {
    if (data && !downloaded) {
      setDownloaded(true);
      setTimeout(async () => {
        try {
          await downloadPdfFromElement(contentRef.current, `stock-opname-${data.tanggal_opname}.pdf`);
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
  if (!data) return <div style={{ padding: 40, fontFamily: 'system-ui', textAlign: 'center' }}>Memuat data stock opname...</div>;

  const tanggalLabel = fmtTgl(data.tanggal_opname);

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .pdf-page { font-family: 'DejaVu Sans', system-ui, sans-serif; font-size: 12px; color: #111; padding: 28px 32px; background: #fff; }
        .brand { text-align: center; font-size: 17px; font-weight: bold; color: #6B4F3A; margin-bottom: 2px; }
        .brand-sub { text-align: center; font-size: 9px; color: #aaa; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 16px; }
        h1 { font-size: 16px; font-weight: bold; text-align: center; margin: 4px 0 14px; }
        .info-table { width: 100%; border-top: 2px solid #6B4F3A; border-bottom: 1px solid #ddd; margin-bottom: 18px; border-collapse: collapse; }
        .info-table td { padding: 7px 0; font-size: 11px; color: #555; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        thead tr { background: #6B4F3A; color: #fff; }
        th { padding: 8px 10px; text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: 1px; }
        td { padding: 7px 10px; border-bottom: 1px solid #eee; }
        .footer { margin-top: 18px; font-size: 9px; color: #bbb; text-align: right; border-top: 1px solid #eee; padding-top: 6px; }
      `}</style>

      <div style={{ padding: 40, fontFamily: 'system-ui', textAlign: 'center' }}>Menyiapkan &amp; mengunduh PDF...</div>

      <div ref={contentRef} className="pdf-page" style={{ position: 'fixed', top: 0, left: '-9999px', width: '780px' }}>
        <div className="brand">Kupiku Coffee</div>
        <div className="brand-sub">Yogyakarta</div>
        <h1>Laporan Stock Opname</h1>

        <table className="info-table">
          <tbody>
            <tr>
              <td>Tanggal Opname: <strong>{tanggalLabel}</strong></td>
              <td style={{ textAlign: 'right' }}>Dicetak: {nowLabel()}</td>
            </tr>
            <tr>
              <td>Petugas: <strong>{data.nama_pegawai}</strong></td>
              <td></td>
            </tr>
          </tbody>
        </table>

        <table>
          <thead>
            <tr>
              <th>Nama Bahan</th>
              <th style={{ textAlign: 'center' }}>Jumlah Utuh</th>
              <th style={{ textAlign: 'center' }}>Jumlah Sisa</th>
              <th style={{ textAlign: 'right' }}>Total</th>
              <th>Satuan</th>
            </tr>
          </thead>
          <tbody>
            {(data.rows || []).map((r, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                <td>{r.nama_bahan}</td>
                <td style={{ textAlign: 'center' }}>{fmtNum(r.jumlah_utuh)}</td>
                <td style={{ textAlign: 'center' }}>{fmtNum(r.jumlah_sisa)}</td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmtNum(r.total)}</td>
                <td style={{ color: '#777' }}>{r.satuan}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="footer">Kupiku Coffee — Stock Opname {tanggalLabel}</div>
      </div>
    </>
  );
}
