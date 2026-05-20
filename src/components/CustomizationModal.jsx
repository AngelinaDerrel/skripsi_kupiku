import React, { useState } from 'react';

const TEMP_OPTS = [
  { value: 'ice', label: 'Ice' },
  { value: 'hot', label: 'Hot' },
];

const SUGAR_OPTS = [
  { value: 'less', label: 'Less Sugar' },
  { value: 'normal', label: 'Normal' },
  { value: 'extra', label: 'Extra Sugar' },
];

const ICE_OPTS = [
  { value: 'less', label: 'Less Ice' },
  { value: 'normal', label: 'Normal' },
  { value: 'extra', label: 'Extra Ice' },
];

function OptionGroup({ label, options, value, onChange }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div className="kp-eyebrow" style={{ marginBottom: 10, fontSize: 10 }}>{label}</div>
      <div style={{ display: 'flex', gap: 8 }}>
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid ' + (value === opt.value ? 'rgba(168,131,95,0.6)' : 'var(--line-strong)'),
              background: value === opt.value ? 'rgba(107,79,58,0.22)' : 'var(--surface-2)',
              color: value === opt.value ? 'var(--brown-3)' : 'var(--text-muted)',
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all 160ms ease',
              fontFamily: 'var(--font-sans)',
              fontWeight: value === opt.value ? 500 : 400,
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function CustomizationModal({ item, onClose, onAdd }) {
  const [temp, setTemp] = useState('ice');
  const [sugar, setSugar] = useState('normal');
  const [ice, setIce] = useState('normal');

  function handleAdd() {
    onAdd(item, {
      temp,
      sugar,
      ice: temp === 'ice' ? ice : null,
    });
    onClose();
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.72)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(4px)',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="kp-card"
        style={{
          width: '100%', maxWidth: 460,
          padding: '32px 28px',
          boxShadow: 'var(--shadow-lg)',
          position: 'relative',
          margin: '0 16px',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 16, right: 16,
            width: 28, height: 28, borderRadius: '50%',
            border: '1px solid var(--line-strong)',
            background: 'var(--surface-2)',
            color: 'var(--text-muted)',
            cursor: 'pointer', fontSize: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >×</button>

        {/* Item header */}
        <div className="kp-eyebrow" style={{ marginBottom: 8, fontSize: 10 }}>Kustomisasi pesanan</div>
        <h3 style={{ fontSize: 22, margin: '0 0 4px', fontWeight: 500, letterSpacing: '-0.01em' }}>
          {item.name}
        </h3>
        <div className="kp-mono" style={{ fontSize: 13, color: 'var(--brown-3)', marginBottom: 24 }}>
          Rp {Number(item.price).toLocaleString('id-ID')}
        </div>

        <div style={{ height: 1, background: 'var(--line)', marginBottom: 24 }} />

        <OptionGroup label="Suhu" options={TEMP_OPTS} value={temp} onChange={setTemp} />
        <OptionGroup label="Tingkat Gula" options={SUGAR_OPTS} value={sugar} onChange={setSugar} />
        {temp === 'ice' && (
          <OptionGroup label="Tingkat Es" options={ICE_OPTS} value={ice} onChange={setIce} />
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button className="kp-btn kp-btn-ghost kp-btn-sm" onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>
            Batal
          </button>
          <button className="kp-btn kp-btn-sm" onClick={handleAdd} style={{ flex: 2, justifyContent: 'center' }}>
            Tambah ke Cart
            <span className="kp-mono" style={{ fontSize: 12 }}>+</span>
          </button>
        </div>
      </div>
    </div>
  );
}
