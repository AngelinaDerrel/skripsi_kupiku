import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout.jsx';

const BASE = import.meta.env.VITE_API_URL || '/api';

const MONTHS = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember',
];

const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

const TABS = [
  { id: 'penjualan', label: 'Penjualan' },
  { id: 'stok',      label: 'Stok Masuk/Keluar' },
  { id: 'opname',    label: 'Stock Opname' },
];

function fmt(n) {
  return 'Rp ' + Number(n).toLocaleString('id-ID');
}

function formatTime(ts) {
  if (!ts) return '-';
  try {
    return new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  } catch { return '-'; }
}

function getDayName(tahun, bulan, hari) {
  return DAYS[new Date(tahun, bulan - 1, hari).getDay()];
}

function nowLabel() {
  const n = new Date();
  return n.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    + ', ' + n.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

async function downloadBlob(url, filename, token) {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error('Gagal generate PDF');
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

// ---- SVG Bar Chart (vertical, for daily penjualan) ----
function VertBarChart({ items, color = '#6B4F3A' }) {
  if (!items.length) return <EmptyChart />;
  const W = 620, H = 160, PAD = 24;
  const max = Math.max(...items.map((d) => d.v), 1);
  const slotW = Math.floor((W - PAD * 2) / items.length);
  const bw = Math.max(4, slotW - 3);
  return (
    <svg width={W} height={H + 28} style={{ display: 'block', overflow: 'visible' }}>
      {items.map((d, i) => {
        const bh = Math.max(2, Math.round((d.v / max) * H));
        const x = PAD + i * slotW;
        const y = H - bh;
        return (
          <g key={i}>
            <rect x={x} y={y} width={bw} height={bh} fill={color} rx={2} opacity={0.85} />
            {i % Math.ceil(items.length / 15) === 0 && (
              <text x={x + bw / 2} y={H + 18} textAnchor="middle" fontSize={9} fill="#888">{d.l}</text>
            )}
          </g>
        );
      })}
      <line x1={PAD} y1={H} x2={W - PAD} y2={H} stroke="#333" strokeWidth={1} />
    </svg>
  );
}

// ---- SVG Bar Chart (horizontal, for stok & opname) ----
function HBarChart({ items, color1 = '#6B4F3A', color2, legend }) {
  if (!items.length) return <EmptyChart />;
  const LW = 150, BW = 360, BH = 13, ROW = color2 ? 34 : 22, GAP = 3;
  const max = Math.max(...items.flatMap((d) => [d.v1, d.v2 ?? 0]), 1);
  const H = items.length * ROW + 10;
  return (
    <div>
      {legend && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 10, fontSize: 11, color: 'var(--text-muted)' }}>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: color1, marginRight: 5, verticalAlign: 'middle' }} />{legend[0]}</span>
          {color2 && <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: color2, marginRight: 5, verticalAlign: 'middle' }} />{legend[1]}</span>}
        </div>
      )}
      <div style={{ overflowX: 'auto' }}>
        <svg width={LW + BW + 80} height={H} style={{ display: 'block', overflow: 'visible' }}>
          {items.map((d, i) => {
            const y = i * ROW + 4;
            const w1 = Math.round((d.v1 / max) * BW);
            const w2 = d.v2 != null ? Math.round((d.v2 / max) * BW) : 0;
            const label = d.l.length > 18 ? d.l.slice(0, 16) + '…' : d.l;
            return (
              <g key={i}>
                <text x={LW - 6} y={y + BH - 1} textAnchor="end" fontSize={10} fill="#888">{label}</text>
                <rect x={LW} y={y} width={w1} height={BH} fill={color1} rx={2} opacity={0.85} />
                <text x={LW + w1 + 4} y={y + BH - 1} fontSize={9} fill="#aaa">{d.v1}</text>
                {color2 && d.v2 != null && (
                  <>
                    <rect x={LW} y={y + BH + GAP} width={w2} height={BH} fill={color2} rx={2} opacity={0.85} />
                    <text x={LW + w2 + 4} y={y + BH + GAP + BH - 1} fontSize={9} fill="#aaa">{d.v2}</text>
                  </>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
      Tidak ada data untuk periode ini
    </div>
  );
}

// ---- Stat card ----
function StatCard({ label, value }) {
  return (
    <div style={{ flex: 1, padding: '14px 18px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--line)' }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

// ---- Shared PDF CSS ----
const PDF_CSS = `
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:system-ui,sans-serif;color:#111;padding:32px 40px;font-size:13px}
  .brand{text-align:center;margin-bottom:20px}
  .brand-name{font-size:20px;font-weight:800;color:#6B4F3A;letter-spacing:.02em}
  .brand-sub{font-size:10px;color:#aaa;letter-spacing:.1em;text-transform:uppercase;margin-top:2px}
  h1{font-size:18px;font-weight:700;text-align:center;margin-bottom:16px}
  .info-row{display:flex;justify-content:space-between;font-size:12px;color:#555;border-top:2px solid #6B4F3A;border-bottom:1px solid #eee;padding:10px 0;margin-bottom:16px}
  .total-card{background:#f8f5f2;border-left:4px solid #6B4F3A;padding:12px 16px;border-radius:4px;margin-bottom:20px;display:inline-block;min-width:220px}
  .total-label{font-size:10px;color:#888;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px}
  .total-value{font-size:22px;font-weight:700;color:#6B4F3A}
  table{width:100%;border-collapse:collapse;font-size:12px}
  thead tr{background:#6B4F3A;color:#fff}
  th{padding:9px 10px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.05em;font-weight:600}
  td{padding:8px 10px;border-bottom:1px solid #f0f0f0;vertical-align:top}
  tr:nth-child(even) td{background:#fafafa}
  .footer{margin-top:20px;font-size:10px;color:#bbb;text-align:right;border-top:1px solid #eee;padding-top:8px}
  @media print{body{padding:16px 24px}}
`;

function generateDailyPrintHTML({ tanggal, dayName, bulanName, tahun, data }) {
  const now = nowLabel();
  const [y, , d] = tanggal.split('-');
  const reportDate = `${dayName}, ${parseInt(d, 10)} ${bulanName} ${y}`;
  const rows = (data.rows || []).map((r) => `
    <tr>
      <td>${r.kode_pesanan}</td>
      <td>${formatTime(r.waktu_pemesanan)}</td>
      <td>${r.menu}</td>
      <td style="text-align:center">${r.qty}</td>
      <td style="text-align:right">${fmt(r.total_harga)}</td>
    </tr>`).join('');

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <title>Rekap Penjualan Harian - ${reportDate}</title>
  <style>${PDF_CSS}</style>
</head><body>
  <div class="brand">
    <div class="brand-name">Kupiku Coffee</div>
    <div class="brand-sub">Yogyakarta</div>
  </div>
  <h1>Rekap Total Penjualan Harian</h1>
  <div class="info-row">
    <span><strong>${reportDate}</strong></span>
    <span>Dicetak: ${now}</span>
  </div>
  <div class="total-card">
    <div class="total-label">Total Pendapatan</div>
    <div class="total-value">${fmt(data.total_pendapatan)}</div>
  </div>
  <table>
    <thead><tr>
      <th>Kode Pesanan</th><th>Waktu</th><th>Menu</th>
      <th style="text-align:center">Qty</th><th style="text-align:right">Total</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">Kupiku Coffee — Laporan Penjualan Harian ${reportDate}</div>
</body></html>`;
}

function generateMonthlyPrintHTML({ bulan, tahun, data }) {
  const now = nowLabel();
  const periodLabel = `${MONTHS[bulan - 1]} ${tahun}`;
  const rows = (data.menus || []).map((m) => `
    <tr>
      <td>${m.id_menu}</td>
      <td>${m.nama_menu}</td>
      <td>${m.nama_kategori}</td>
      <td style="text-align:center">${m.qty_terjual}</td>
    </tr>`).join('');

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <title>Laporan Penjualan Bulanan - ${periodLabel}</title>
  <style>${PDF_CSS}</style>
</head><body>
  <div class="brand">
    <div class="brand-name">Kupiku Coffee</div>
    <div class="brand-sub">Yogyakarta</div>
  </div>
  <h1>Laporan Penjualan Bulanan</h1>
  <div class="info-row">
    <span>Periode: <strong>${periodLabel}</strong></span>
    <span>Dicetak: ${now}</span>
  </div>
  <div class="total-card">
    <div class="total-label">Total Pendapatan</div>
    <div class="total-value">${fmt(data.total_pendapatan)}</div>
  </div>
  <table>
    <thead><tr>
      <th>ID Menu</th><th>Menu</th><th>Kategori</th>
      <th style="text-align:center">Qty Terjual</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">Kupiku Coffee — Laporan Penjualan Bulanan ${periodLabel}</div>
</body></html>`;
}

// ---- PDF print HTML generator ----
function buildSVGBar(items, color, W = 580, H = 140) {
  if (!items.length) return '<p style="color:#888">Tidak ada data</p>';
  const PAD = 20;
  const max = Math.max(...items.map((d) => d.v), 1);
  const slotW = Math.floor((W - PAD * 2) / items.length);
  const bw = Math.max(4, slotW - 3);
  const bars = items.map((d, i) => {
    const bh = Math.max(2, Math.round((d.v / max) * H));
    const x = PAD + i * slotW;
    const y = H - bh;
    const tick = i % Math.ceil(items.length / 15) === 0
      ? `<text x="${x + bw / 2}" y="${H + 16}" text-anchor="middle" font-size="9" fill="#888">${d.l}</text>` : '';
    return `<rect x="${x}" y="${y}" width="${bw}" height="${bh}" fill="${color}" rx="2" opacity="0.85"/>${tick}`;
  }).join('');
  return `<svg width="${W}" height="${H + 24}" style="display:block;overflow:visible"><line x1="${PAD}" y1="${H}" x2="${W - PAD}" y2="${H}" stroke="#ddd" stroke-width="1"/>${bars}</svg>`;
}

function buildHSVGBar(items, color1, color2) {
  if (!items.length) return '<p style="color:#888">Tidak ada data</p>';
  const LW = 150, BW = 360, BH = 12, ROW = color2 ? 32 : 20, GAP = 3;
  const max = Math.max(...items.flatMap((d) => [d.v1, d.v2 ?? 0]), 1);
  const H = items.length * ROW + 10;
  const rows = items.map((d, i) => {
    const y = i * ROW + 4;
    const w1 = Math.round((d.v1 / max) * BW);
    const label = d.l.length > 18 ? d.l.slice(0, 16) + '…' : d.l;
    let html = `<text x="${LW - 6}" y="${y + BH - 1}" text-anchor="end" font-size="10" fill="#555">${label}</text>`;
    html += `<rect x="${LW}" y="${y}" width="${w1}" height="${BH}" fill="${color1}" rx="2" opacity="0.85"/>`;
    html += `<text x="${LW + w1 + 4}" y="${y + BH - 1}" font-size="9" fill="#777">${d.v1}</text>`;
    if (color2 && d.v2 != null) {
      const w2 = Math.round((d.v2 / max) * BW);
      html += `<rect x="${LW}" y="${y + BH + GAP}" width="${w2}" height="${BH}" fill="${color2}" rx="2" opacity="0.85"/>`;
      html += `<text x="${LW + w2 + 4}" y="${y + BH + GAP + BH - 1}" font-size="9" fill="#777">${d.v2}</text>`;
    }
    return html;
  }).join('');
  return `<svg width="${LW + BW + 80}" height="${H}" style="display:block;overflow:visible">${rows}</svg>`;
}

function generatePrintHTML({ tab, bulan, tahun, penjualan, stok, opname }) {
  const periodLabel = `${MONTHS[bulan - 1]} ${tahun}`;
  const titles = { penjualan: 'Laporan Penjualan', stok: 'Laporan Stok Masuk / Keluar', opname: 'Laporan Stock Opname' };

  let body = '';

  if (tab === 'penjualan' && penjualan) {
    const rataRata = penjualan.jumlah_pesanan > 0
      ? Math.round(penjualan.total / penjualan.jumlah_pesanan) : 0;
    const days = Array.from({ length: 31 }, (_, i) => {
      const d = penjualan.harian?.find((h) => h.hari === i + 1);
      return { l: String(i + 1), v: d ? Number(d.total) : 0 };
    });
    body = `
      <div class="stats">
        <div class="stat"><div class="slabel">Total Pendapatan</div><div class="sval">${fmt(penjualan.total)}</div></div>
        <div class="stat"><div class="slabel">Jumlah Pesanan</div><div class="sval">${penjualan.jumlah_pesanan}</div></div>
        <div class="stat"><div class="slabel">Rata-rata / Pesanan</div><div class="sval">${fmt(rataRata)}</div></div>
      </div>
      <div class="section-title">Grafik Penjualan Harian</div>
      ${buildSVGBar(days, '#6B4F3A')}
      <div class="section-title">Top 5 Menu Terlaris</div>
      <table><thead><tr><th>#</th><th>Menu</th><th>Terjual</th></tr></thead><tbody>
        ${(penjualan.top_menu || []).map((m, i) => `<tr><td>${i + 1}</td><td>${m.nama_menu}</td><td>${m.terjual}</td></tr>`).join('')}
      </tbody></table>
      <div class="section-title">Detail Harian</div>
      <table><thead><tr><th>Hari</th><th>Pesanan</th><th>Total</th></tr></thead><tbody>
        ${(penjualan.harian || []).map((h) => `<tr><td>Hari ${h.hari}</td><td>${h.jumlah_pesanan}</td><td>${fmt(h.total)}</td></tr>`).join('')}
      </tbody></table>`;
  }

  if (tab === 'stok' && stok) {
    const items = (stok.data || []).map((d) => ({ l: d.nama_bahan, v1: d.total_masuk, v2: d.total_keluar }));
    body = `
      <div class="stats">
        <div class="stat"><div class="slabel">Jenis Bahan Aktif</div><div class="sval">${items.length}</div></div>
        <div class="stat"><div class="slabel">Total Masuk (semua bahan)</div><div class="sval">${items.reduce((s, d) => s + d.v1, 0)} unit</div></div>
        <div class="stat"><div class="slabel">Total Keluar (semua bahan)</div><div class="sval">${items.reduce((s, d) => s + d.v2, 0)} unit</div></div>
      </div>
      <div style="display:flex;gap:12px;margin-bottom:10px;font-size:11px;color:#666">
        <span><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:#6B4F3A;margin-right:4px;vertical-align:middle"></span>Masuk</span>
        <span><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:#4A7C59;margin-right:4px;vertical-align:middle"></span>Keluar</span>
      </div>
      <div class="section-title">Grafik Stok Masuk vs Keluar</div>
      ${buildHSVGBar(items, '#6B4F3A', '#4A7C59')}
      <div class="section-title">Tabel Detail</div>
      <table><thead><tr><th>Bahan</th><th>Masuk</th><th>Keluar</th><th>Stok Saat Ini</th><th>Satuan</th></tr></thead><tbody>
        ${(stok.data || []).map((d) => `<tr><td>${d.nama_bahan}</td><td>${d.total_masuk}</td><td>${d.total_keluar}</td><td>${d.stok_saat_ini}</td><td>${d.satuan}</td></tr>`).join('')}
      </tbody></table>`;
  }

  if (tab === 'opname' && opname) {
    const items = (opname.data || []).map((d) => ({ l: d.nama_bahan, v1: d.stok_saat_ini }));
    body = `
      <div class="stats">
        <div class="stat"><div class="slabel">Total Jenis Bahan</div><div class="sval">${items.length}</div></div>
        <div class="stat"><div class="slabel">Stok 0 (Habis)</div><div class="sval">${(opname.data || []).filter((d) => d.stok_saat_ini === 0).length} item</div></div>
      </div>
      <div class="section-title">Grafik Stok Saat Ini</div>
      ${buildHSVGBar(items, '#4A7C59', null)}
      <div class="section-title">Tabel Stock Opname — ${periodLabel}</div>
      <table><thead><tr><th>Bahan</th><th>Satuan</th><th>Masuk Bulan Ini</th><th>Keluar Bulan Ini</th><th>Stok Saat Ini</th></tr></thead><tbody>
        ${(opname.data || []).map((d) => `<tr><td>${d.nama_bahan}</td><td>${d.satuan}</td><td>${d.masuk_bulan}</td><td>${d.keluar_bulan}</td><td>${d.stok_saat_ini}</td></tr>`).join('')}
      </tbody></table>`;
  }

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <title>${titles[tab]} — ${periodLabel}</title>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:system-ui,sans-serif;color:#111;padding:32px 40px}
      h1{font-size:22px;font-weight:700;margin-bottom:4px}
      .subtitle{color:#777;font-size:12px;margin-bottom:24px}
      .brand{font-size:11px;color:#aaa;letter-spacing:.08em;text-transform:uppercase;margin-bottom:4px}
      .stats{display:flex;gap:12px;margin-bottom:24px}
      .stat{flex:1;background:#f5f5f5;padding:12px 16px;border-radius:8px}
      .slabel{font-size:10px;color:#888;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px}
      .sval{font-size:18px;font-weight:700}
      .section-title{font-size:13px;font-weight:600;margin:24px 0 10px;border-bottom:1px solid #eee;padding-bottom:6px}
      table{width:100%;border-collapse:collapse;font-size:12px}
      th{text-align:left;padding:8px;border-bottom:2px solid #eee;color:#888;font-size:10px;text-transform:uppercase;letter-spacing:.06em}
      td{padding:8px;border-bottom:1px solid #f0f0f0}
      @media print{body{padding:16px 24px}}
    </style>
  </head><body>
    <div class="brand">Kupiku Coffee — Yogyakarta</div>
    <h1>${titles[tab]}</h1>
    <div class="subtitle">Periode: ${periodLabel}</div>
    ${body}
  </body></html>`;
}

// ================================================================
// Main component
// ================================================================
export default function Laporan() {
  const token = localStorage.getItem('kupiku_token');
  const now = new Date();
  const [tab, setTab]     = useState('penjualan');
  const [bulan, setBulan] = useState(now.getMonth() + 1);
  const [tahun, setTahun] = useState(now.getFullYear());

  const [penjualan, setPenjualan] = useState(null);
  const [stok, setStok]           = useState(null);
  const [opname, setOpname]       = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [loadingPdf, setLoadingPdf] = useState(null);
  const [opnameDownloadError, setOpnameDownloadError] = useState('');
  const [hoverStok, setHoverStok] = useState(null);

  useEffect(() => { fetchData(); }, [tab, bulan, tahun]);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE}/laporan/${tab}?bulan=${bulan}&tahun=${tahun}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Gagal memuat data');
      const data = await res.json();
      if (tab === 'penjualan') setPenjualan(data);
      else if (tab === 'stok') setStok(data);
      else setOpname(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function downloadDailyPDF(hari) {
    const key = `day-${hari}`;
    const tanggal = `${tahun}-${String(bulan).padStart(2, '0')}-${String(hari).padStart(2, '0')}`;
    setLoadingPdf(key);
    try {
      await downloadBlob(
        `${BASE}/laporan/pdf/harian?tanggal=${tanggal}`,
        `laporan-harian-${tanggal}.pdf`,
        token
      );
    } catch (e) {
      console.error('PDF daily error:', e);
    } finally {
      setLoadingPdf(null);
    }
  }

  async function downloadOpnamePDF(id, tanggal) {
    const key = `opname-${id}`;
    setLoadingPdf(key);
    setOpnameDownloadError('');
    try {
      await downloadBlob(
        `${BASE}/stock-opname/${id}/pdf`,
        `stock-opname-${tanggal}.pdf`,
        token,
      );
    } catch (e) {
      setOpnameDownloadError('Gagal download PDF: ' + (e.message || ''));
    } finally {
      setLoadingPdf(null);
    }
  }

  async function downloadMonthlyPDF() {
    setLoadingPdf('monthly');
    try {
      await downloadBlob(
        `${BASE}/laporan/pdf/bulanan?bulan=${bulan}&tahun=${tahun}`,
        `laporan-bulanan-${tahun}-${String(bulan).padStart(2, '0')}.pdf`,
        token
      );
    } catch (e) {
      console.error('PDF monthly error:', e);
    } finally {
      setLoadingPdf(null);
    }
  }

  async function downloadStokPDF() {
    setLoadingPdf('stok-monthly');
    try {
      await downloadBlob(
        `${BASE}/laporan/pdf/stok?bulan=${bulan}&tahun=${tahun}`,
        `laporan-stok-${tahun}-${String(bulan).padStart(2, '0')}.pdf`,
        token
      );
    } catch (e) {
      console.error('PDF stok error:', e);
    } finally {
      setLoadingPdf(null);
    }
  }

  function exportPDF() {
    const html = generatePrintHTML({ tab, bulan, tahun, penjualan, stok, opname });
    const w = window.open('', '_blank', 'width=900,height=700');
    w.document.write(html);
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 600);
  }

  const years = [];
  for (let y = 2024; y <= now.getFullYear() + 1; y++) years.push(y);

  const selStyle = {
    padding: '7px 10px', borderRadius: 8,
    background: 'var(--surface)', border: '1px solid var(--line)',
    color: 'var(--text)', fontSize: 12, cursor: 'pointer', outline: 'none',
  };

  // ---- Derived display data ----
  const pDays = tab === 'penjualan' && penjualan
    ? Array.from({ length: 31 }, (_, i) => {
        const d = penjualan.harian?.find((h) => h.hari === i + 1);
        return { l: String(i + 1), v: d ? Number(d.total) : 0 };
      })
    : [];

  const sItems = tab === 'stok' && stok
    ? (stok.data || []).map((d) => ({ l: d.nama_bahan, v1: d.total_masuk, v2: d.total_keluar }))
    : [];

  const oItems = tab === 'opname' && opname
    ? (opname.data || [])
    : [];

  const rataRata = penjualan && penjualan.jumlah_pesanan > 0
    ? Math.round(penjualan.total / penjualan.jumlah_pesanan) : 0;

  return (
    <AdminLayout>
      <div style={{ padding: '24px 32px', height: '100%', overflow: 'auto' }}>

        {/* ---- Header ---- */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
          <div>
            <div className="kp-eyebrow" style={{ fontSize: 10, marginBottom: 4 }}>Owner</div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Laporan</h1>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <select value={bulan} onChange={(e) => setBulan(Number(e.target.value))} style={selStyle}>
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <select value={tahun} onChange={(e) => setTahun(Number(e.target.value))} style={selStyle}>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            {tab === 'penjualan' && (
              <button
                className="kp-btn kp-btn-sm"
                onClick={exportPDF}
                disabled={loading || !penjualan}
                style={{ fontSize: 12 }}
              >
                ↓ Laporan Bulanan
              </button>
            )}
            {tab === 'stok' && (
              <button
                className="kp-btn kp-btn-sm"
                onClick={downloadStokPDF}
                disabled={loading || !stok || loadingPdf === 'stok-monthly'}
                style={{ fontSize: 12 }}
              >
                {loadingPdf === 'stok-monthly' ? '...' : '↓ Export Stok PDF'}
              </button>
            )}
          </div>
        </div>

        {/* ---- Tabs ---- */}
        <div style={{ display: 'flex', gap: 2, marginBottom: 24, borderBottom: '1px solid var(--line)', paddingBottom: 0 }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '9px 16px', fontSize: 13, cursor: 'pointer',
                background: 'transparent', border: 'none',
                borderBottom: tab === t.id ? '2px solid var(--brown-3, #6B4F3A)' : '2px solid transparent',
                color: tab === t.id ? 'var(--text)' : 'var(--text-muted)',
                fontWeight: tab === t.id ? 600 : 400,
                marginBottom: -1,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ---- Period label ---- */}
        <div className="kp-mono" style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 20 }}>
          PERIODE: {MONTHS[bulan - 1].toUpperCase()} {tahun}
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Memuat data...</div>
        )}
        {error && (
          <div style={{ padding: 16, borderRadius: 8, background: 'rgba(224,82,82,0.1)', border: '1px solid rgba(224,82,82,0.3)', color: '#e05252', fontSize: 13 }}>
            {error}
          </div>
        )}

        {/* ================================================================ */}
        {/* TAB: PENJUALAN                                                    */}
        {/* ================================================================ */}
        {!loading && tab === 'penjualan' && penjualan && (
          <div>
            {/* Stats */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
              <StatCard label="Total Pendapatan"  value={fmt(penjualan.total)} />
              <StatCard label="Jumlah Pesanan"    value={penjualan.jumlah_pesanan} />
              <StatCard label="Rata-rata / Pesanan" value={fmt(rataRata)} />
            </div>

            {/* ---- PDF Download Section ---- */}
            <div style={{ marginTop: 28 }}>
              {/* <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--text)' }}>Laporan Penjualan Harian</div> */}

              {/* Laporan Harian list */}
              {(penjualan.harian || []).length === 0 ? (
                <EmptyChart />
              ) : (
                <div style={{ borderRadius: 10, border: '1px solid var(--line)', overflow: 'hidden' }}>
                  <div style={{ padding: '9px 18px', background: 'var(--surface)', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 600 }}>
                      Laporan Penjualan Harian
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 600 }}>Aksi</span>
                  </div>
                  {(penjualan.harian || []).map((h) => {
                    const dayName = getDayName(tahun, bulan, h.hari);
                    const key = `day-${h.hari}`;
                    return (
                      <div
                        key={h.hari}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 18px', borderBottom: '1px solid var(--line)', gap: 12 }}
                      >
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>
                            {dayName}, {h.hari} {MONTHS[bulan - 1]} {tahun}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                            {h.jumlah_pesanan} pesanan&nbsp;&nbsp;·&nbsp;&nbsp;{fmt(h.total)}
                          </div>
                        </div>
                        <button
                          className="kp-btn kp-btn-sm"
                          style={{ fontSize: 11, minWidth: 95, flexShrink: 0 }}
                          disabled={loadingPdf === key}
                          onClick={() => downloadDailyPDF(h.hari)}
                        >
                          {loadingPdf === key ? '...' : '↓ Download'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* TAB: STOK                                                         */}
        {/* ================================================================ */}
        {!loading && tab === 'stok' && stok && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
              <StatCard label="Jenis Bahan Aktif"        value={sItems.length} />
              <StatCard label="Total Masuk (semua bahan)" value={`${sItems.reduce((s, d) => s + d.v1, 0)} unit`} />
              <StatCard label="Total Keluar (semua bahan)" value={`${sItems.reduce((s, d) => s + d.v2, 0)} unit`} />
            </div>

            <div style={{ padding: 20, borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--line)' }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Tabel Detail</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>
                {hoverStok ? `Sedang disorot: ${hoverStok}` : 'Arahkan kursor ke baris untuk melihat bahan yang disorot.'}
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ color: 'var(--text-muted)' }}>
                      {['Bahan','Masuk','Keluar','Stok Saat Ini','Satuan'].map((h) => (
                        <th key={h} style={{ textAlign: 'left', padding: '10px 14px', borderBottom: '1px solid var(--line)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(stok.data || []).map((d, i) => (
                      <tr
                        key={i}
                        onMouseEnter={() => setHoverStok(d.nama_bahan)}
                        onMouseLeave={() => setHoverStok(null)}
                        style={{
                          background: hoverStok === d.nama_bahan ? 'rgba(107,79,58,0.16)' : 'transparent',
                          transition: 'background 160ms ease',
                          cursor: 'pointer',
                        }}
                      >
                        <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--line)', fontWeight: 600 }}>{d.nama_bahan}</td>
                        <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--line)', color: '#4A7C59' }}>{d.total_masuk}</td>
                        <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--line)', color: '#B05A5A' }}>{d.total_keluar}</td>
                        <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--line)', fontWeight: 700 }}>{d.stok_saat_ini}</td>
                        <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--line)', color: 'var(--text-muted)' }}>{d.satuan}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* TAB: OPNAME                                                       */}
        {/* ================================================================ */}
        {!loading && tab === 'opname' && (
          <div>
            {opnameDownloadError && (
              <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 8, background: 'rgba(224,82,82,0.1)', border: '1px solid rgba(224,82,82,0.3)', color: '#e05252', fontSize: 13 }}>
                {opnameDownloadError}
              </div>
            )}

            {/* List header */}
            <div style={{ borderRadius: 12, border: '1px solid var(--line)', overflow: 'hidden' }}>
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr auto',
                padding: '9px 18px', background: 'var(--surface)', borderBottom: '1px solid var(--line)',
              }}>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 600 }}>
                  Stock Opname — {MONTHS[bulan - 1]} {tahun}
                </span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 600 }}>Aksi</span>
              </div>

              {(!opname || oItems.length === 0) && (
                <div style={{ padding: '32px 18px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  Tidak ada stock opname pada {MONTHS[bulan - 1]} {tahun}
                </div>
              )}

              {oItems.map((item, i) => {
                const key = `opname-${item.id_opname}`;
                const tgl = new Date(item.tanggal_opname + 'T00:00:00');
                const tglLabel = `${tgl.getDate()} ${MONTHS[tgl.getMonth()]} ${tgl.getFullYear()}`;
                return (
                  <div
                    key={item.id_opname}
                    style={{
                      display: 'grid', gridTemplateColumns: '1fr auto',
                      alignItems: 'center', padding: '13px 18px',
                      borderBottom: i < oItems.length - 1 ? '1px solid var(--line)' : 'none',
                      gap: 12,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 14 }}>
                        Stock Opname Tanggal ({tglLabel})
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
                        {item.nama_pegawai && <span>Petugas: {item.nama_pegawai}</span>}
                        {item.keterangan && <span style={{ marginLeft: 10 }}>· {item.keterangan}</span>}
                      </div>
                    </div>
                    <button
                      className="kp-btn kp-btn-sm"
                      style={{ fontSize: 11, minWidth: 105, flexShrink: 0 }}
                      disabled={loadingPdf === key}
                      onClick={() => downloadOpnamePDF(item.id_opname, item.tanggal_opname)}
                    >
                      {loadingPdf === key ? '...' : '↓ Download PDF'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}
