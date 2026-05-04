import { useNavigate, useLocation } from 'react-router-dom';
import { DRINKS } from '../data/drinks.js';
import { MENU_ITEMS } from '../data/menuItems.js';

const FLAVOR_KEYWORDS = {
  manis: ['honey', 'caramel', 'almond', 'sugar', 'butter'],
  pahit: ['cacao', 'tobacco', 'cocoa', 'smoke'],
  balance: [],
  strong: [],
};

export default function Results() {
  const nav = useNavigate();
  const { state } = useLocation();
  const mood = state?.mood || null;
  const flavor = state?.flavor || null;
  const temp = state?.temp || null;

  function applyFilters() {
    let items = MENU_ITEMS.slice();
    if (mood) items = items.filter(i => i.mood && i.mood.toLowerCase() === mood.toLowerCase());

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

  const matches = (mood || flavor || temp) ? applyFilters() : null;
  return (
    <div className="kp" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <div style={{
        padding: '24px 56px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '1px solid var(--line)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span className="kp-mono" style={{ fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => nav('/mood')}>← Back</span>
          <span style={{ width: 1, height: 16, background: 'var(--line-strong)' }} />
          <div className="kp-eyebrow">Step 03 / 03 · Results</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 80, height: 2, background: 'var(--brown)' }} />
          <div style={{ width: 80, height: 2, background: 'var(--brown)' }} />
          <div style={{ width: 80, height: 2, background: 'var(--brown)' }} />
        </div>
        <span className="kp-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{(matches || DRINKS).length} matches found</span>
      </div>

        <div style={{ padding: '52px 56px 32px', display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 60, alignItems: 'end' }}>
        <div>
          <div className="kp-eyebrow" style={{ marginBottom: 14 }}>{mood ? `Reading: ${mood.toLowerCase()} · preference: ${flavor || 'any'} · ${temp || ''}` : 'Reading: curated picks'}</div>
          <h2 className="kp-display" style={{ fontSize: 52, lineHeight: 1.02, margin: 0 }}>
            {mood ? `Matches for ${mood}` : 'Top picks for you'}
          </h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 8 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <span className="kp-chip">CALM</span>
            <span className="kp-chip" style={{ background: 'transparent', color: 'var(--text-muted)', borderColor: 'var(--line-strong)' }}>+ EARTHY</span>
            <span className="kp-chip" style={{ background: 'transparent', color: 'var(--text-muted)', borderColor: 'var(--line-strong)' }}>+ SLOW</span>
          </div>
          <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-muted)' }}>
            <span>Sort: <span style={{ color: 'var(--text)' }}>Best match</span></span>
            <span style={{ color: 'var(--text-dim)' }}>·</span>
            <span>Body</span>
            <span style={{ color: 'var(--text-dim)' }}>·</span>
            <span>Price</span>
          </div>
        </div>
      </div>

        <div style={{ padding: '0 56px 56px' }}>
        {(matches && matches.length > 0) ? (
          <>
            <div className="kp-card" style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 0, overflow: 'hidden', boxShadow: 'var(--shadow)', marginBottom: 24 }}>
              <div className="kp-img-placeholder" data-label={`DRINK · ${matches[0].name.toUpperCase()}`} style={{ borderRadius: 0, height: 320 }} />
              <div style={{ padding: 36, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                        <span className="kp-chip">{(matches[0].mood || '').toUpperCase()}</span>
                        <span className="kp-mono" style={{ fontSize: 11, color: 'var(--brown-3)' }}>Top pick</span>
                      </div>
                      <h3 className="kp-display" style={{ fontSize: 38, margin: 0, lineHeight: 1 }}>{matches[0].name}</h3>
                    </div>
                    <div className="kp-mono" style={{ fontSize: 13, color: 'var(--text)' }}>{matches[0].price}</div>
                  </div>
                  <p style={{ color: 'var(--text-muted)', marginTop: 18, fontSize: 14, lineHeight: 1.6, maxWidth: 520 }}>
                    {matches[0].desc}
                  </p>
                  <div style={{ display: 'flex', gap: 28, marginTop: 22 }}>
                    {[{ l: 'BODY', v: '4 / 10' }, { l: 'CAFFEINE', v: 'MEDIUM' }, { l: 'TEMP', v: temp ? temp.toUpperCase() : 'HOT' }].map(s => (
                      <div key={s.l}>
                        <div className="kp-eyebrow" style={{ fontSize: 9 }}>{s.l}</div>
                        <div className="kp-mono" style={{ fontSize: 13, marginTop: 4 }}>{s.v}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 28, alignItems: 'center' }}>
                  <button className="kp-btn">Add to order</button>
                  <button className="kp-btn kp-btn-ghost kp-btn-sm">Read tasting notes</button>
                  <div style={{ flex: 1 }} />
                  <span className="kp-mono" style={{ fontSize: 11, color: 'var(--text-dim)' }}>{matches[0].id}</span>
                </div>
              </div>
            </div>

            <div className="kp-eyebrow" style={{ marginBottom: 16 }}>Also in your range</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
              {matches.slice(1).map((it) => (
                <div key={it.id} className="kp-card" style={{ overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                  <div className="kp-img-placeholder" data-label={`DRINK · ${it.name.toUpperCase()}`} style={{ borderRadius: 0, height: 180 }} />
                  <div style={{ padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span className="kp-chip">{(it.mood || '').toUpperCase()}</span>
                      <span className="kp-mono" style={{ fontSize: 10, color: 'var(--brown-3)' }}>match</span>
                    </div>
                    <h4 style={{ fontSize: 18, margin: 0, fontWeight: 500 }}>{it.name}</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: 12.5, lineHeight: 1.55, marginTop: 6 }}>{it.desc}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {it.notes && it.notes.map(n => (
                          <span key={n} className="kp-mono" style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>· {n}</span>
                        ))}
                      </div>
                      <span className="kp-mono" style={{ fontSize: 12 }}>{it.price}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="kp-card" style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 0, overflow: 'hidden', boxShadow: 'var(--shadow)', marginBottom: 24 }}>
              <div className="kp-img-placeholder" data-label="DRINK · CEDAR POUR-OVER" style={{ borderRadius: 0, height: 320 }} />
              <div style={{ padding: 36, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                        <span className="kp-chip">CALM</span>
                        <span className="kp-mono" style={{ fontSize: 11, color: 'var(--brown-3)' }}>96% match · top pick</span>
                      </div>
                      <h3 className="kp-display" style={{ fontSize: 38, margin: 0, lineHeight: 1 }}>Cedar Pour-Over</h3>
                    </div>
                    <div className="kp-mono" style={{ fontSize: 13, color: 'var(--text)' }}>IDR 48k</div>
                  </div>
                  <p style={{ color: 'var(--text-muted)', marginTop: 18, fontSize: 14, lineHeight: 1.6, maxWidth: 520 }}>
                    Single-origin Aceh Gayo, brewed slow over a cedar-smoked filter. Cocoa-forward,
                    rounded acidity, finishes with a soft apricot note.
                  </p>
                  <div style={{ display: 'flex', gap: 28, marginTop: 22 }}>
                    {[{ l: 'BODY', v: '4 / 10' }, { l: 'CAFFEINE', v: 'MEDIUM' }, { l: 'TEMP', v: 'HOT 82°C' }].map(s => (
                      <div key={s.l}>
                        <div className="kp-eyebrow" style={{ fontSize: 9 }}>{s.l}</div>
                        <div className="kp-mono" style={{ fontSize: 13, marginTop: 4 }}>{s.v}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 28, alignItems: 'center' }}>
                  <button className="kp-btn">Add to order</button>
                  <button className="kp-btn kp-btn-ghost kp-btn-sm">Read tasting notes</button>
                  <div style={{ flex: 1 }} />
                  <span className="kp-mono" style={{ fontSize: 11, color: 'var(--text-dim)' }}>SKU · KP-007</span>
                </div>
              </div>
            </div>

            <div className="kp-eyebrow" style={{ marginBottom: 16 }}>Also in your range</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
              {DRINKS.slice(1).map((d) => (
                <div key={d.name} className="kp-card" style={{ overflow: 'hidden', boxShadow: 'var(--shadow-sm)', transition: 'transform 200ms ease, box-shadow 200ms ease' }}>
                  <div className="kp-img-placeholder" data-label={`DRINK · ${d.name.toUpperCase()}`} style={{ borderRadius: 0, height: 180 }} />
                  <div style={{ padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span className="kp-chip">{d.mood.toUpperCase()}</span>
                      <span className="kp-mono" style={{ fontSize: 10, color: 'var(--brown-3)' }}>{d.match}% match</span>
                    </div>
                    <h4 style={{ fontSize: 18, margin: 0, fontWeight: 500, letterSpacing: '-0.01em' }}>{d.name}</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: 12.5, lineHeight: 1.55, marginTop: 6 }}>{d.desc}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {d.notes.map(n => (
                          <span key={n} className="kp-mono" style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>· {n}</span>
                        ))}
                      </div>
                      <span className="kp-mono" style={{ fontSize: 12 }}>{d.price}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div style={{ marginTop: 40, padding: '20px 24px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>Not quite right?</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              Tweak your mood or try our brew quiz for a deeper match.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="kp-btn kp-btn-ghost kp-btn-sm" onClick={() => nav('/mood')}>Recalibrate</button>
            <button className="kp-btn kp-btn-sm">Take the brew quiz</button>
          </div>
        </div>
      </div>
    </div>
  );
}
