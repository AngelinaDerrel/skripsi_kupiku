import React from 'react';
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MENU_ITEMS } from '../data/menuItems.js';
import { MOODS } from '../data/moods.js';
import MoodGlyph from '../components/MoodGlyph.jsx';
import api from '../lib/api';

const FLAVORS = [
  { id: 'manis', label: 'Manis' },
  { id: 'pahit', label: 'Pahit' },
  { id: 'asam', label: 'Asam' },

];

const TEMPS = [
  { id: 'hot', label: 'Hot' },
  { id: 'ice', label: 'Ice' },
];

const FLAVOR_KEYWORDS = {
  manis: ['honey', 'caramel', 'almond', 'sugar', 'butter'],
  pahit: ['cacao', 'tobacco', 'cocoa', 'smoke'],
  balance: [],
  strong: [],
};

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

  function applyFilters() {
    let items = MENU_ITEMS.slice();
    if (selectedMood) items = items.filter(i => i.mood && i.mood.toLowerCase() === selectedMood.toLowerCase());

    if (flavor && FLAVOR_KEYWORDS[flavor] && FLAVOR_KEYWORDS[flavor].length) {
      const keys = FLAVOR_KEYWORDS[flavor];
      items = items.filter(i => i.notes && i.notes.some(n => keys.includes(n.toLowerCase())));
    } else if (flavor === 'strong') {
      items = items.filter(i => i.cat === 'black' || /espresso|strong/i.test(i.name));
    }

    if (temp) {
      if (temp === 'hot') items = items.filter(i => /hot/i.test(i.name) || ['classic','latte'].includes(i.cat));
      if (temp === 'ice') items = items.filter(i => /cold|iced|ice|brew/i.test(i.name) || ['mocktail','signature'].includes(i.cat));
    }

    return items;
  }

  const localResults = step === 3 ? applyFilters() : [];
  const results = remoteMatches && Array.isArray(remoteMatches) ? remoteMatches : localResults;

  async function handleShowMatches() {
    // prefer server-side recommendations via POST to /rekomendasi
    setRemoteLoading(true);
    setRemoteError(null);
    try {
      const payload = { mood: selectedMood || '', flavor: flavor || '', temp: temp || '' };
      const res = await api.post('/rekomendasi', payload);
      const recs = res && Array.isArray(res.data) ? res.data : null;
      const input = res ? { mood: res.mood, flavor, temp } : null;
      const rule = res ? res.rule : null;
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
      <div style={{ padding: '24px 56px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--line)' }}>
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
        <span className="kp-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>kupiku.id/discover</span>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 380px', gap: 0 }}>
        <div style={{ padding: '56px 56px 40px', display: 'flex', flexDirection: 'column' }}>
          <div className="kp-eyebrow" style={{ marginBottom: 16 }}>Preference check-in</div>
          <h2 className="kp-display" style={{ fontSize: 56, lineHeight: 1.02, margin: 0, maxWidth: 640 }}>
            Choose your<br />flavor profile
          </h2>
          <p style={{ color: 'var(--text-muted)', marginTop: 20, maxWidth: 480, fontSize: 15, lineHeight: 1.55 }}>
            Pick a flavor direction and we'll narrow down the menu to match.
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
                    transition: 'all 220ms ease', minHeight: 120, display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ fontSize: 20, fontWeight: 600 }}>{f.label}</div>
                      <span className="kp-mono" style={{ fontSize: 10, color: isActive ? 'var(--brown-3)' : 'var(--text-dim)' }}>pick</span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>
                      {f.id === 'manis' && 'Sweet, caramel, honey notes.'}
                      {f.id === 'pahit' && 'Bitter-forward, dark chocolate and smoke.'}
                      {f.id === 'balance' && 'Even, rounded, easy to sip.'}
                      {f.id === 'strong' && 'High-caffeine, espresso-forward.'}
                    </div>
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
              <h3 className="kp-eyebrow">Serve temperature</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginTop: 12 }}>
                {TEMPS.map(t => {
                  const isActive = temp === t.id;
                  return (
                    <div key={t.id} onClick={() => setTemp(t.id)} className="kp-card" style={{
                      padding: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      border: isActive ? '1px solid rgba(168,131,95,0.55)' : '1px solid var(--line)',
                      background: isActive ? 'linear-gradient(160deg, rgba(107,79,58,0.12), rgba(107,79,58,0.02))' : 'var(--surface)'
                    }}>
                      <div style={{ fontSize: 16 }}>{t.label}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.id === 'hot' ? 'Warm & cozy' : 'Refreshing & cold'}</div>
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

        <aside style={{ background: 'var(--surface)', borderLeft: '1px solid var(--line)', padding: '56px 36px 40px', display: 'flex', flexDirection: 'column' }}>
          <div className="kp-eyebrow" style={{ marginBottom: 16 }}>Summary</div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: 12, background: 'rgba(107,79,58,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MoodGlyph shape={currentMood.shape} active />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{currentMood.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{currentMood.tagline}</div>
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
              <div style={{ fontSize: 16, marginTop: 8 }}>{flavor ? FLAVORS.find(f => f.id === flavor)?.label : '—'}</div>
            </div>
          )}

          {step >= 3 && (
            <div style={{ marginTop: 16 }}>
              <div className="kp-eyebrow" style={{ fontSize: 10 }}>Serving</div>
              <div style={{ fontSize: 16, marginTop: 8 }}>{temp ? TEMPS.find(t => t.id === temp)?.label : '—'}</div>
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
