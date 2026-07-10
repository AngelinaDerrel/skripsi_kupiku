import React from 'react';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MOODS } from '../data/moods.js';
import api from '../lib/api';

const FLAVORS = [
  { id: 'sweet',   label: 'Sweet',  emoji: '🍯' },
  { id: 'bitter',  label: 'Bitter', emoji: '☕' },
  { id: 'sour',    label: 'Sour',   emoji: '🍋' },
];

const TEMPS = [
  { id: 'hot', label: 'Hot', emoji: '🔥' },
  { id: 'ice', label: 'Ice', emoji: '🧊' },
];

export default function PreferenceFlow() {
  const nav = useNavigate();
  const { state } = useLocation();
  const selectedMood = state?.mood || null;

  const currentMood = MOODS.find(m => m.name === selectedMood) || MOODS[2];

  const [step, setStep] = useState(2);
  const [flavor, setFlavor] = useState(null);
  const [temp, setTemp] = useState(null);
  const [remoteMatches, setRemoteMatches] = useState(null);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [remoteError, setRemoteError] = useState(null);
  const [serverInput, setServerInput] = useState(null);
  const [serverRule, setServerRule] = useState(null);

  async function handleShowMatches() {
    // prefer server-side recommendations via POST to /rekomendasi
    setRemoteLoading(true);
    setRemoteError(null);
    try {
      const payload = { mood: selectedMood || '', flavor: flavor || '', temp: temp || '' };
      const res = await api.post('/rekomendasi', payload);
      const recs = res && Array.isArray(res.recommendations) ? res.recommendations : null;
      const input = res?.input ? { mood: res.input.mood, flavor: res.input.flavor, temp: res.input.temp } : null;
      const rule = res?.rule ?? null;
      if (input) setServerInput(input);
      if (rule) setServerRule(rule);
      if (Array.isArray(recs) && recs.length) {
        setRemoteMatches(recs);
        nav('/results', { state: { mood: selectedMood, flavor, temp, recommendations: recs, serverInput: input, serverRule: rule } });
        return;
      }
      // fallback to local results
      nav('/results', { state: { mood: selectedMood, flavor, temp, serverInput: input, serverRule: rule } });
    } catch (err) {
      setRemoteError(err?.message || 'Failed to get recommendations');
      // still navigate with local fallback
      nav('/results', { state: { mood: selectedMood, flavor, temp, serverInput: serverInput, serverRule } });
    } finally {
      setRemoteLoading(false);
    }
  }

  return (
    <div className="kp" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <div className="kp-step-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span className="kp-mono" style={{ fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => nav('/')}>← Back</span>
          <span style={{ width: 1, height: 16, background: 'var(--line-strong)' }} />
          <div className="kp-eyebrow">Step {step} / 03</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 80, height: 2, background: step >= 1 ? 'var(--brown)' : 'var(--surface-3)' }} />
          <div style={{ width: 80, height: 2, background: step >= 2 ? 'var(--brown)' : 'var(--surface-3)' }} />
          <div style={{ width: 80, height: 2, background: step >= 3 ? 'var(--brown)' : 'var(--surface-3)' }} />
        </div>
        <span className="kp-mono kp-step-hint" style={{ fontSize: 11, color: 'var(--text-muted)' }}>kupiku.id/discover</span>
      </div>

      <div className="kp-mood-layout">
        <div className="kp-mood-main">
          <div className="kp-eyebrow" style={{ marginBottom: 16 }}>
            {step === 2 ? 'Preference check-in' : 'Last step'}
          </div>
          <h2 className="kp-display kp-h2-mood" style={{ maxWidth: 640 }}>
            {step === 2 ? <>Choose your<br />flavor profile</> : <>Choose your<br />serving temperature</>}
          </h2>
          <p style={{ color: 'var(--text-muted)', marginTop: 20, maxWidth: 480, fontSize: 15, lineHeight: 1.55 }}>
            {step === 2
              ? "Pick a flavor direction and we'll narrow down the menu to match."
              : "Pick how you'd like your drink served."}
          </p>

          {step === 2 && (
            <div style={{ marginTop: 36, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                {FLAVORS.map((f) => {
                const isActive = flavor === f.id;
                return (
                  <div key={f.id} onClick={() => setFlavor(f.id)} className="kp-card" style={{
                    padding: 22, cursor: 'pointer',
                    background: isActive ? 'linear-gradient(160deg, rgba(107,79,58,0.22), rgba(107,79,58,0.05))' : 'var(--surface)',
                    border: isActive ? '1px solid rgba(168,131,95,0.55)' : '1px solid var(--line)',
                    boxShadow: isActive ? 'var(--shadow), 0 0 0 4px rgba(107,79,58,0.08)' : 'var(--shadow-sm)',
                    transition: 'all 220ms ease', minHeight: 140, display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{
                        fontSize: 32, lineHeight: 1,
                        filter: isActive ? 'drop-shadow(0 0 8px rgba(168,131,95,0.5))' : 'none',
                        transition: 'filter 220ms ease',
                      }}>{f.emoji}</span>
                      <span className="kp-mono" style={{ fontSize: 10, color: isActive ? 'var(--brown-3)' : 'var(--text-dim)' }}>pick</span>
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 600 }}>{f.label}</div>
                  </div>
                );
              })}
            </div>
          )}

          {step === 2 && flavor && (
              <div style={{ marginTop: 28 }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="kp-btn kp-btn-ghost" onClick={() => nav('/mood')}>Back</button>
                <button className="kp-btn" onClick={() => setStep(3)}>Continue with {FLAVORS.find(x => x.id === flavor)?.label}</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ marginTop: 36 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginTop: 0 }}>
                {TEMPS.map(t => {
                  const isActive = temp === t.id;
                  return (
                    <div key={t.id} onClick={() => setTemp(t.id)} className="kp-card" style={{
                      padding: '20px 24px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16,
                      border: isActive ? '1px solid rgba(168,131,95,0.55)' : '1px solid var(--line)',
                      background: isActive ? 'linear-gradient(160deg, rgba(107,79,58,0.18), rgba(107,79,58,0.04))' : 'var(--surface)',
                      boxShadow: isActive ? 'var(--shadow), 0 0 0 4px rgba(107,79,58,0.08)' : 'var(--shadow-sm)',
                      transition: 'all 220ms ease',
                    }}>
                      <span style={{
                        fontSize: 36, lineHeight: 1,
                        filter: isActive ? 'drop-shadow(0 0 10px rgba(168,131,95,0.5))' : 'none',
                        transition: 'filter 220ms ease',
                      }}>{t.emoji}</span>
                      <div style={{ fontSize: 18, fontWeight: 500 }}>{t.label}</div>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: 28, display: 'flex', gap: 12 }}>
                <button className="kp-btn kp-btn-ghost" onClick={() => setStep(2)}>Back</button>
                <button className="kp-btn" onClick={handleShowMatches} disabled={!temp || remoteLoading}>{remoteLoading ? 'Finding...' : 'Show Matches'}</button>
              </div>
            </div>
          )}
        </div>

        <aside className="kp-mood-aside">
          <div className="kp-eyebrow" style={{ marginBottom: 16 }}>Summary</div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: 12, background: 'rgba(107,79,58,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 28, lineHeight: 1 }}>{currentMood.emoji}</span>
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{currentMood.name}</div>
            </div>
          </div>

          {/* Step-aware summary: only show fields that have been selected */}
          <div style={{ marginTop: 20 }}>
            <div className="kp-eyebrow" style={{ fontSize: 10 }}>Selected mood</div>
            <div style={{ fontSize: 16, marginTop: 8 }}>{serverInput?.mood ? serverInput.mood : currentMood.name}</div>
          </div>

          {step >= 2 && (
            <div style={{ marginTop: 16 }}>
              <div className="kp-eyebrow" style={{ fontSize: 10 }}>Selected flavor</div>
              <div style={{ fontSize: 16, marginTop: 8 }}>
                {flavor ? `${FLAVORS.find(f => f.id === flavor)?.emoji} ${FLAVORS.find(f => f.id === flavor)?.label}` : '—'}
              </div>
            </div>
          )}

          {step >= 3 && (
            <div style={{ marginTop: 16 }}>
              <div className="kp-eyebrow" style={{ fontSize: 10 }}>Serving</div>
              <div style={{ fontSize: 16, marginTop: 8 }}>
                {temp ? `${TEMPS.find(t => t.id === temp)?.emoji} ${TEMPS.find(t => t.id === temp)?.label}` : '—'}
              </div>
            </div>
          )}

          <div style={{ marginTop: 20 }}>
            <div className="kp-eyebrow" style={{ fontSize: 10 }}>Tips</div>
            <div style={{ marginTop: 8, color: 'var(--text-muted)' }}>Summary updates as you move through steps. Results appear at the end.</div>
          </div>

          <div style={{ marginTop: 12 }}>
            {remoteLoading && <div className="kp-mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>Loading recommendations...</div>}
            {!remoteLoading && remoteError && <div style={{ fontSize: 13, color: 'red' }}>Error: {remoteError}</div>}
            {!remoteLoading && !remoteError && remoteMatches && (
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{remoteMatches.length} recommendations from server</div>
            )}
          </div>

          <div style={{ flex: 1 }} />

          <div style={{ display: 'flex', gap: 12 }}>
            <button className="kp-btn" style={{ flex: 1 }} onClick={() => nav('/mood')}>Change Mood</button>
            <button className="kp-btn kp-btn-ghost" style={{ flex: 1 }} onClick={() => nav('/menu')}>Open Menu</button>
          </div>
        </aside>
      </div>
    </div>
  );
}
