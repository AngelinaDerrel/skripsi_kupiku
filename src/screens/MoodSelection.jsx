import React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MOODS } from '../data/moods.js';

export default function MoodSelection() {
  const nav = useNavigate();


  const [moodsList] = useState(MOODS);
  const [active, setActive] = useState(MOODS[0]?.id || null);

  const current =
    moodsList.find((m) => m.id === active) || MOODS[0];

  return (
    <div className="kp" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <div className="kp-step-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
          <span className="kp-mono" style={{ fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => nav('/')}>← Back</span>
          <span style={{ width: 1, height: 16, background: 'var(--line-strong)' }} />
          <div className="kp-eyebrow">Step 01 / 03</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 80, height: 2, background: 'var(--brown)' }} />
          <div style={{ width: 80, height: 2, background: 'var(--surface-3)' }} />
          <div style={{ width: 80, height: 2, background: 'var(--surface-3)' }} />
        </div>
        <div style={{ flex: 1 }} />
      </div>

      <div className="kp-mood-layout">
        <div className="kp-mood-main">
          <div className="kp-eyebrow" style={{ marginBottom: 16 }}>The mood check-in</div>
          <h2 className="kp-display kp-h2-mood" style={{ maxWidth: 640 }}>
            How are you<br />
            <span style={{ fontStyle: 'italic', color: 'var(--brown-3)' }}>actually</span> feeling right now?
          </h2>
          <p style={{ color: 'var(--text-muted)', marginTop: 20, maxWidth: 480, fontSize: 15, lineHeight: 1.55 }}>
            Pick the closest match. There's no wrong answer — we'll calibrate from there.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginTop: 40 }}>
            {moodsList.map((m, idx) => {
              const isActive = m.id === active || m.name === active;
              const idKey = m.id || m.name;
              return (
                <div key={idKey} onClick={() => setActive(idKey)} className="kp-card" style={{
                  padding: 22, cursor: 'pointer',
                  background: isActive ? 'linear-gradient(160deg, rgba(107,79,58,0.22), rgba(107,79,58,0.05))' : 'var(--surface)',
                  border: isActive ? '1px solid rgba(168,131,95,0.55)' : '1px solid var(--line)',
                  boxShadow: isActive ? 'var(--shadow), 0 0 0 4px rgba(107,79,58,0.08)' : 'var(--shadow-sm)',
                  transition: 'all 220ms ease', position: 'relative', minHeight: 152,
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{
                      fontSize: 32, lineHeight: 1,
                      filter: isActive ? 'drop-shadow(0 0 8px rgba(168,131,95,0.5))' : 'none',
                      transition: 'filter 220ms ease',
                    }}>{m.emoji}</span>
                    <span className="kp-mono" style={{ fontSize: 10, color: isActive ? 'var(--brown-3)' : 'var(--text-dim)', letterSpacing: '0.08em' }}>
                      0{idx + 1}
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 500, letterSpacing: '-0.01em' }}>{m.name}</div>
                  </div>
                  {isActive && (
                    <div style={{ position: 'absolute', top: 14, right: 14, width: 8, height: 8, borderRadius: '50%', background: 'var(--brown-3)', boxShadow: '0 0 0 4px rgba(168,131,95,0.2)' }} />
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 28 }}>
            <button className="kp-btn" style={{ width: '100%', justifyContent: 'center' }} onClick={() => nav('/preferences', { state: { mood: current.name } })}>
              Continue with {current.name}
              <span className="kp-mono" style={{ fontSize: 12 }}>→</span>
            </button>
            <button style={{
              background: 'transparent', border: 'none', color: 'var(--text-muted)',
              fontSize: 12, marginTop: 12, cursor: 'pointer', fontFamily: 'var(--font-sans)'
            }} onClick={() => nav('/preferences')}>Skip — show me everything</button>
          </div>
        </div>

        <aside className="kp-mood-aside">
          <div className="kp-eyebrow" style={{ marginBottom: 16 }}>Summary</div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: 12, background: 'rgba(107,79,58,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 28, lineHeight: 1 }}>{current.emoji}</span>
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{current.name}</div>
            </div>
          </div>

          <div style={{ marginTop: 20 }}>
            <div className="kp-eyebrow" style={{ fontSize: 10 }}>Selected mood</div>
            <div style={{ fontSize: 16, marginTop: 8 }}>{current.name}</div>
          </div>

          <div style={{ marginTop: 16 }}>
            <div className="kp-eyebrow" style={{ fontSize: 10 }}>Tips</div>
            <div style={{ marginTop: 8, color: 'var(--text-muted)' }}>Pick a mood, then continue to choose flavor preferences and serving temperature.</div>
          </div>

          <div style={{ flex: 1 }} />
        </aside>
      </div>
    </div>
  );
}
