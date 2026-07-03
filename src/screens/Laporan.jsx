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
  const [opnameDownloadError] = useState('');
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

    function downloadDailyPDF(hari) {
    const tanggal = `${tahun}-${String(bulan).padStart(2, '0')}-${String(hari).padStart(2, '0')}`;
    window.open(`/pdf/penjualan-harian?tanggal=${tanggal}`, '_blank');
  }

  function downloadOpnamePDF(id) {
    window.open(`/pdf/stock-opname/${id}`, '_blank');
  }

  function downloadStokPDF() {
    window.open(`/pdf/stok-masuk-keluar?bulan=${bulan}&tahun=${tahun}`, '_blank');
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
                onClick={() => window.open(`/pdf/penjualan-bulanan?bulan=${bulan}&tahun=${tahun}`, '_blank')}
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
                disabled={loading || !stok}
                style={{ fontSize: 12 }}
              >
                ↓ Export Stok PDF
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
                          onClick={() => downloadDailyPDF(h.hari)}
                        >
                          ↓ Download
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
                      onClick={() => downloadOpnamePDF(item.id_opname)}
                    >
                      ↓ Cetak PDF
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
