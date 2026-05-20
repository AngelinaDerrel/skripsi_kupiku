import React, { useState, useEffect, useCallback, useRef } from 'react';
import StaffLayout from './StaffLayout.jsx';
import api from '../lib/api.js';

const TABS = [
  { key: 'new',     label: 'New',        status: 'menunggu_pembayaran', accent: '#C5895A', bg: 'rgba(197,137,90,0.12)'  },
  { key: 'process', label: 'On Process', status: 'diproses',            accent: '#6B8FA8', bg: 'rgba(107,143,168,0.12)' },
  { key: 'ready',   label: 'Ready',      status: 'siap',                accent: '#7A8F6A', bg: 'rgba(122,143,106,0.12)' },
  { key: 'done',    label: 'Done',       status: 'done',                accent: '#666',    bg: 'rgba(255,255,255,0.04)' },
];

const SUHU  = { ice: 'Ice', hot: 'Hot' };
const GULA  = { less_sugar: 'Less Sugar', normal: 'Normal', extra_sugar: 'Extra Sugar' };
const ES    = { less_ice: 'Less Ice',  normal: 'Normal',  extra_ice: 'Extra Ice' };

function fmtTime(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}
function fmtDate(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
}
function fmtRp(val) {
  return 'Rp ' + Number(val).toLocaleString('id-ID');
}

function printNota(order) {
  const timeStr = new Date(order.created_at).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  const rows = (order.items || []).map((item, i) => {
    const tags = [
      SUHU[item.suhu] || item.suhu,
      GULA[item.tingkat_gula] || item.tingkat_gula,
      item.suhu === 'ice' ? (ES[item.tingkat_es] || item.tingkat_es) : null,
    ].filter(Boolean).join(' · ');

    return `<tr>
      <td style="padding:6px 2px;vertical-align:top;width:14px;">${i + 1}.</td>
      <td style="padding:6px 4px;vertical-align:top;">
        <div style="font-weight:600;">${item.nama_menu}</div>
        <div style="font-size:10px;color:#666;">${tags}</div>
      </td>
      <td style="padding:6px 2px;text-align:right;white-space:nowrap;vertical-align:top;">
        Rp ${Number(item.harga_saat_pesan).toLocaleString('id-ID')}
      </td>
    </tr>`;
  }).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Nota · ${order.kode_pesanan}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'Courier New',monospace;font-size:12px;padding:24px 20px;max-width:320px;margin:0 auto;}
  h1{font-size:20px;text-align:center;letter-spacing:3px;margin-bottom:3px;}
  .sub{text-align:center;font-size:10px;color:#666;margin-bottom:16px;}
  .sep{border:none;border-top:1px dashed #bbb;margin:12px 0;}
  table{width:100%;border-collapse:collapse;}
  .tot td{font-size:14px;font-weight:700;padding:8px 2px;border-top:1px dashed #bbb;}
  .foot{text-align:center;font-size:10px;color:#666;margin-top:20px;line-height:2;}
  @media print{body{padding:0;}}
</style></head><body>
<h1>KUPIKU</h1>
<p class="sub">Nota Pembayaran</p>
<hr class="sep">
<table>
  <tr><td>Kode Pesanan</td><td style="text-align:right;font-weight:700;">${order.kode_pesanan}</td></tr>
  <tr><td>Waktu</td><td style="text-align:right;">${timeStr}</td></tr>
  <tr><td>Pelanggan</td><td style="text-align:right;">${order.user?.name || '—'}</td></tr>
</table>
<hr class="sep">
<table>${rows}</table>
<table class="tot">
  <tr class="tot"><td colspan="2">TOTAL PEMBAYARAN</td>
  <td style="text-align:right;">Rp ${Number(order.total_harga).toLocaleString('id-ID')}</td></tr>
</table>
<p class="foot">Terima kasih sudah berkunjung!<br>Selamat menikmati ☕<br><br>kupiku.coffee</p>
</body></html>`;

  const w = window.open('', '_blank', 'width=360,height=640,scrollbars=yes');
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 300);
}

function Chip({ label, accent, bg }) {
  return (
    <span style={{
      fontSize: 9, padding: '2px 7px', borderRadius: 999,
      background: bg, border: `1px solid ${accent}55`,
      color: accent, fontFamily: 'var(--font-mono)',
      textTransform: 'uppercase', letterSpacing: '0.05em',
    }}>{label}</span>
  );
}

function OrderCard({ order, tabKey, busy, onAction }) {
  const tab = TABS.find(t => t.key === tabKey);

  const handleClick = () => {
    if (tabKey === 'new') {
      onAction(order.kode_pesanan, 'diproses');
      printNota(order);
    } else if (tabKey === 'process') {
      onAction(order.kode_pesanan, 'siap');
    } else if (tabKey === 'ready') {
      onAction(order.kode_pesanan, 'done');
    }
  };

  const btnLabel =
    tabKey === 'new'     ? 'Konfirmasi & Cetak Nota' :
    tabKey === 'process' ? 'Tandai Siap' :
    tabKey === 'ready'   ? 'Sudah Diambil' : null;

  return (
    <div className="kp-card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* colour stripe */}
      <div style={{ height: 3, background: tab.accent }} />

      <div style={{ padding: '16px 18px' }}>
        {/* header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div>
            <div className="kp-mono" style={{ fontSize: 15, fontWeight: 700, color: tab.accent, letterSpacing: '0.1em' }}>
              {order.kode_pesanan}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
              {order.user?.name || 'Pelanggan'}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="kp-mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {fmtTime(order.created_at)}
            </div>
            <div className="kp-mono" style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>
              {fmtDate(order.created_at)}
            </div>
          </div>
        </div>

        <div style={{ height: 1, background: 'var(--line)', marginBottom: 14 }} />

        {/* items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
          {(order.items || []).map((item, i) => {
            const tags = [
              SUHU[item.suhu],
              GULA[item.tingkat_gula],
              item.suhu === 'ice' ? ES[item.tingkat_es] : null,
            ].filter(Boolean);

            return (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 5 }}>{item.nama_menu}</div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {tags.map(tag => <Chip key={tag} label={tag} accent={tab.accent} bg={tab.bg} />)}
                  </div>
                </div>
                <span className="kp-mono" style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0, paddingTop: 2 }}>
                  {Number(item.harga_saat_pesan).toLocaleString('id-ID')}
                </span>
              </div>
            );
          })}
        </div>

        <div style={{ height: 1, background: 'var(--line)', marginBottom: 14 }} />

        {/* footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="kp-mono" style={{ fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Total
            </div>
            <div className="kp-mono" style={{ fontSize: 17, fontWeight: 700, marginTop: 2 }}>
              {fmtRp(order.total_harga)}
            </div>
          </div>

          {btnLabel ? (
            <button
              onClick={handleClick}
              disabled={busy}
              style={{
                padding: '9px 16px', borderRadius: 999,
                background: tab.accent, border: 'none', color: '#fff',
                fontSize: 12, fontWeight: 500, fontFamily: 'var(--font-sans)',
                cursor: busy ? 'wait' : 'pointer',
                opacity: busy ? 0.55 : 1,
                transition: 'opacity 150ms ease',
              }}
            >
              {busy ? '...' : btnLabel}
            </button>
          ) : (
            <span className="kp-mono" style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Selesai
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function StaffOrders() {
  const [activeTab, setActiveTab]   = useState('new');
  const [orders, setOrders]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [busy, setBusy]             = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const timerRef = useRef(null);

  const token = localStorage.getItem('kupiku_token');
  const hdrs  = token ? { Authorization: `Bearer ${token}` } : {};

  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await api.get('/pesanan', { headers: hdrs });
      setOrders(Array.isArray(data) ? data : (data?.data ?? []));
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      if (!silent) setError(err.message || 'Gagal memuat pesanan');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []); // eslint-disable-line

  useEffect(() => {
    fetchOrders();
    timerRef.current = setInterval(() => fetchOrders(true), 15000);
    return () => clearInterval(timerRef.current);
  }, [fetchOrders]);

  async function handleAction(kode_pesanan, newStatus) {
    setBusy(kode_pesanan);
    try {
      await api.patch(`/pesanan/${kode_pesanan}/status`, { status: newStatus }, { headers: hdrs });
      setOrders(prev => prev.map(o =>
        o.kode_pesanan === kode_pesanan ? { ...o, status: newStatus } : o
      ));
    } catch (err) {
      setError('Gagal update status: ' + err.message);
    } finally {
      setBusy(null);
    }
  }

  const counts = {};
  TABS.forEach(t => { counts[t.key] = orders.filter(o => o.status === t.status).length; });

  const tab      = TABS.find(t => t.key === activeTab);
  const filtered = orders.filter(o => o.status === tab.status);

  return (
    <StaffLayout>
      <div style={{ padding: '28px 32px', overflowY: 'auto', flex: 1 }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
          <div>
            <div className="kp-eyebrow" style={{ fontSize: 10, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 18, height: 1, background: 'var(--brown-2)' }} />
              Staff · Orders
            </div>
            <h1 className="kp-display" style={{ fontSize: 30, margin: 0, lineHeight: 1.05 }}>
              Manajemen <span style={{ fontStyle: 'italic', color: 'var(--brown-3)' }}>Pesanan</span>
            </h1>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            <button
              className="kp-btn kp-btn-ghost kp-btn-sm"
              onClick={() => fetchOrders(false)}
              disabled={loading}
            >
              {loading ? 'Memuat…' : '↻ Refresh'}
            </button>
            {lastUpdated && (
              <div className="kp-mono" style={{ fontSize: 10, color: 'var(--text-dim)' }}>
                Updated {lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                {' · '}auto 15s
              </div>
            )}
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
          {TABS.map(t => (
            <div
              key={t.key}
              className="kp-card"
              onClick={() => setActiveTab(t.key)}
              style={{
                padding: '14px 18px', cursor: 'pointer',
                borderColor: activeTab === t.key ? t.accent + '88' : undefined,
                background: activeTab === t.key ? t.bg : undefined,
                transition: 'all 150ms ease',
              }}
            >
              <div className="kp-mono" style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
                {t.label}
              </div>
              <div className="kp-display" style={{ fontSize: 38, lineHeight: 1, color: counts[t.key] > 0 ? t.accent : 'var(--text-dim)' }}>
                {loading && orders.length === 0 ? '—' : counts[t.key]}
              </div>
            </div>
          ))}
        </div>

        {/* ── Tab bar ── */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--line)', marginBottom: 24 }}>
          {TABS.map(t => {
            const active = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 20px',
                  background: 'transparent', border: 'none',
                  borderBottom: `2px solid ${active ? t.accent : 'transparent'}`,
                  color: active ? 'var(--text)' : 'var(--text-muted)',
                  fontSize: 13, fontWeight: active ? 500 : 400,
                  cursor: 'pointer', fontFamily: 'var(--font-sans)',
                  marginBottom: -1, transition: 'all 140ms ease',
                }}
              >
                {t.label}
                <span style={{
                  minWidth: 20, height: 20, borderRadius: 999,
                  background: active ? t.accent : 'var(--surface-3)', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
                }}>
                  {counts[t.key]}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Error ── */}
        {error && (
          <div style={{
            padding: '12px 16px', marginBottom: 20, borderRadius: 8, fontSize: 13,
            background: 'rgba(224,90,90,0.1)', border: '1px solid rgba(224,90,90,0.3)', color: '#e05a5a',
          }}>
            {error}
          </div>
        )}

        {/* ── Content ── */}
        {loading && orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)', fontSize: 13 }}>
            Memuat pesanan…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 32, marginBottom: 14, opacity: 0.25 }}>☕</div>
            <div style={{ fontSize: 13 }}>Tidak ada pesanan {tab.label.toLowerCase()}</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {filtered.map(order => (
              <OrderCard
                key={order.kode_pesanan}
                order={order}
                tabKey={activeTab}
                busy={busy === order.kode_pesanan}
                onAction={handleAction}
              />
            ))}
          </div>
        )}
      </div>
    </StaffLayout>
  );
}
