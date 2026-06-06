import React, { useState } from 'react';

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

const TEMP_OPTS = [
  { value: 'ice', label: 'Ice' },
  { value: 'hot', label: 'Hot' },
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

function TempFixed({ temperature }) {
  const label = temperature === 'ice' ? 'Ice Only' : 'Hot Only';
  return (
    <div style={{ marginBottom: 20 }}>
      <div className="kp-eyebrow" style={{ marginBottom: 10, fontSize: 10 }}>SUHU</div>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '10px 18px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid rgba(168,131,95,0.6)',
          background: 'rgba(107,79,58,0.22)',
          color: 'var(--brown-3)',
          fontSize: 13,
          fontFamily: 'var(--font-sans)',
          fontWeight: 500,
          gap: 6,
        }}
      >
        {label}
        <span style={{ fontSize: 10, opacity: 0.7, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          · tidak dapat diubah
        </span>
      </div>
    </div>
  );
}

export default function CustomizationModal({ item, onClose, onAdd }) {
  const temperature = item.temperature ?? 'both';
  const defaultTemp = temperature === 'hot' ? 'hot' : 'ice';
  const [temp, setTemp] = useState(defaultTemp);
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

        {temperature === 'both'
          ? <OptionGroup label="SUHU" options={TEMP_OPTS} value={temp} onChange={setTemp} />
          : <TempFixed temperature={temperature} />
        }
        <OptionGroup label="TINGKAT GULA" options={SUGAR_OPTS} value={sugar} onChange={setSugar} />
        {temp === 'ice' && (
          <OptionGroup label="TINGKAT ES" options={ICE_OPTS} value={ice} onChange={setIce} />
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
