import React from 'react';
import { useState, useMemo } from 'react';
import StaffLayout from './StaffLayout.jsx';
import { STOCK_ITEMS } from '../data/stockItems.js';

function formatNumber(n) {
  if (n == null || n === '') return '';
  return Number(n).toLocaleString();
}

export default function StockOpname() {
  const [rows, setRows] = useState(() => STOCK_ITEMS.map((s) => ({ ...s, utuh: '', sisa: '' })));

  function updateRow(id, field, value) {
    setRows((r) => r.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  }

  const computed = useMemo(() => rows.map((r) => {
    const utuh = Number(r.utuh) || 0;
    const sisa = Number(r.sisa) || 0;
    // compute total in base unit: if bb > 1 treat bb as unit multiplier, else use bw
    const unitValue = (r.bb && r.bb > 1) ? r.bb : r.bw || 1;
    const total = utuh * unitValue + sisa;
    return { ...r, utuh, sisa, total };
  }), [rows]);

  function exportCSV() {
    const headers = ['id','name','bw','bb','unit','utuh','sisa','total'];
    const lines = [headers.join(',')];
    computed.forEach((c) => {
      lines.push([c.id, `"${c.name}"`, c.bw, c.bb, c.unit, c.utuh, c.sisa, c.total].join(','));
    });
    const csv = lines.join('\n');
    // trigger download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'stock-opname.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <StaffLayout>
      <div style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div>
            <div className="kp-eyebrow" style={{ fontSize: 10 }}>Staff · Stock</div>
            <h1 style={{ fontSize: 20, margin: '4px 0 0' }}>Stock opname</h1>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="kp-btn kp-btn-ghost" onClick={() => setRows(STOCK_ITEMS.map((s) => ({ ...s, utuh: '', sisa: '' })))}>Reset</button>
            <button className="kp-btn" onClick={exportCSV}>Export CSV</button>
          </div>
        </div>

        <div className="kp-card" style={{ padding: 12, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 980 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--text-muted)', fontSize: 12 }}>
                <th style={{ padding: '10px 12px', width: 320 }}>Bahan</th>
                <th style={{ padding: '10px 12px', width: 80 }}>BW</th>
                <th style={{ padding: '10px 12px', width: 80 }}>BB</th>
                <th style={{ padding: '10px 12px', width: 120 }}>Utuh</th>
                <th style={{ padding: '10px 12px', width: 120 }}>Sisa</th>
                <th style={{ padding: '10px 12px', width: 140, textAlign: 'right' }}>Total ({/* unit */})</th>
              </tr>
            </thead>
            <tbody>
              {computed.map((r) => (
                <tr key={r.id} style={{ borderTop: '1px solid var(--line)' }}>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text)' }}>{r.name}</div>
                    <div className="kp-mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.unit}</div>
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{r.bw}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{r.bb > 1 ? `x${r.bb}` : ''}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <input value={r.utuh === 0 ? '' : r.utuh} onChange={(e) => updateRow(r.id, 'utuh', e.target.value)} placeholder="0" style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid var(--line-strong)', background: 'var(--surface)', color: 'var(--text)' }} />
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <input value={r.sisa === 0 ? '' : r.sisa} onChange={(e) => updateRow(r.id, 'sisa', e.target.value)} placeholder="0" style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid var(--line-strong)', background: 'var(--surface)', color: 'var(--text)' }} />
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                    <div className="kp-mono" style={{ fontSize: 13 }}>{formatNumber(r.total)} {r.unit}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </StaffLayout>
  );
}
