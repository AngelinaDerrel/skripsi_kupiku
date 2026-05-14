import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import LogoKupiku from '../assets/kupikuLogo.png';
import Map from '../components/Map';

export default function Landing() {
  const nav = useNavigate();
  const loc = useLocation();
  const STORES = [
    { id: 'anggajaya', name: 'Kupiku Coffee · Anggajaya', addr: 'Jl. Anggajaya 1 No. 8, Gejayan, Condongcatur, Yogyakarta' },
    { id: 'mandala', name: 'Kupiku Coffee · Mandala Krida', addr: 'Jl. Sokonandi II No. 9, Semaki, Umbulharjo, Yogyakarta' },
  ];
  useEffect(() => {
    if (typeof window !== 'undefined' && loc.hash === '#maps') {
      const el = document.getElementById('maps');
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    }
  }, [loc.hash]);

  return (
    <div className="kp" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '24px 56px', borderBottom: '1px solid var(--line)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', height: '100%' }} onClick={() => nav('/')}>
            <img
              src={LogoKupiku}
              alt="Kupiku Logo"
              style={{ width: 130, height: 130, objectFit: 'contain', margin: '-35px 0' }}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 36, fontSize: 13, color: 'var(--text-muted)' }}>
          <span style={{ color: 'var(--text)', cursor: 'pointer' }} onClick={() => nav('/')}>Discover</span>
          <span style={{ cursor: 'pointer' }} onClick={() => nav('/menu')}>Menu</span>
          <span style={{ cursor: 'pointer' }} onClick={() => nav('/login', { state: { next: '/mood' } })}>Mood</span>
          <span style={{ cursor: 'pointer' }} onClick={() => {
            if (loc.pathname === '/') {
              const el = document.getElementById('maps');
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
              nav('/#maps');
            }
          }}>Locations</span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => nav('/login', { state: { next: '/admin' } })}>Admin</span>
          <button className="kp-btn kp-btn-sm" onClick={() => nav('/login')}>Order</button>
        </div>
      </nav>

      <div style={{
        flex: 1, display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 80,
        padding: '72px 56px 56px', alignItems: 'center', position: 'relative'
      }}>
        <div>
          <div className="kp-eyebrow" style={{ marginBottom: 32, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 24, height: 1, background: 'var(--brown-2)' }}></span>
            Mood–first coffee, est. 2015
          </div>

          <h1 className="kp-display" style={{ fontSize: 88, lineHeight: 0.96, margin: 0, textWrap: 'balance' }}>
            Find your<br />perfect coffee<br />
            <span style={{ fontStyle: 'italic', color: 'var(--brown-3)' }}>by feel.</span>
          </h1>

          <p style={{ fontSize: 16, lineHeight: 1.6, color: 'var(--text-muted)', maxWidth: 440, marginTop: 32, marginBottom: 40 }}>
            Tell us how you're feeling. We'll pour something that matches —
            from a quiet pour-over for calm afternoons to a bold espresso for the days that need it.
          </p>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button className="kp-btn" onClick={() => nav('/login', { state: { next: '/mood' } })}>
                Discover your mood
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, opacity: 0.8 }}>
                  →
                </span>
              </button>
            <button className="kp-btn kp-btn-ghost" onClick={() => nav('/menu')}>Browse the menu</button>
          </div>
{/* 
          <div style={{ display: 'flex', gap: 48, marginTop: 64, paddingTop: 28, borderTop: '1px solid var(--line)' }}>
            {[{ v: '6', l: 'mood profiles' }, { v: '42', l: 'crafted drinks' }, { v: '12s', l: 'avg. match time' }].map(s => (
              <div key={s.l}>
                <div className="kp-display" style={{ fontSize: 32, lineHeight: 1 }}>{s.v}</div>
                <div className="kp-eyebrow" style={{ marginTop: 8, fontSize: 10 }}>{s.l}</div>
              </div>
            ))}
          </div> */}
        </div>

        <div style={{ position: 'relative', height: 520 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 60% 40%, rgba(107,79,58,0.22), transparent 55%)' }} />
          <div style={{
            position: 'absolute', top: 40, right: 20, width: 380, height: 380, borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 30%, #2B2010, #15100A 60%, #0A0805)',
            border: '1px solid var(--line-strong)',
            boxShadow: 'var(--shadow-lg), inset 0 8px 32px rgba(0,0,0,0.6)',
          }}>
            <div style={{
              position: 'absolute', inset: 28, borderRadius: '50%',
              background: 'radial-gradient(ellipse at 30% 25%, rgba(168,131,95,0.35), rgba(74,53,39,0.6) 50%, rgba(20,14,9,0.9))',
              boxShadow: 'inset 0 0 80px rgba(0,0,0,0.5)'
            }} />
            <div style={{ position: 'absolute', top: -30, left: '50%', display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center', opacity: 0.4 }}>
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--text-muted)' }} />
              <div style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--text-muted)' }} />
              <div style={{ width: 2, height: 2, borderRadius: '50%', background: 'var(--text-muted)' }} />
            </div>
          </div>

          <div className="kp-card" style={{ position: 'absolute', top: 70, left: 0, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: 'var(--shadow)', backdropFilter: 'blur(8px)' }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(107,79,58,0.2)', border: '1px solid rgba(107,79,58,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', border: '1.5px solid var(--brown-3)' }} />
            </div>
            <div>
              <div className="kp-eyebrow" style={{ fontSize: 9 }}>mood · calm</div>
              <div style={{ fontSize: 13, fontWeight: 500, marginTop: 2 }}>Kopi Susu Original</div>
            </div>
          </div>

          <div className="kp-card" style={{ position: 'absolute', bottom: 80, right: 30, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: 'var(--shadow)' }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(197,139,90,0.15)', border: '1px solid rgba(197,139,90,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 12, height: 12, background: 'var(--brown-2)', borderRadius: 2 }} />
            </div>
            <div>
              <div className="kp-eyebrow" style={{ fontSize: 9 }}>mood · stressed</div>
              <div style={{ fontSize: 13, fontWeight: 500, marginTop: 2 }}>Americano Arabica</div>
            </div>
          </div>

          <div style={{ position: 'absolute', bottom: 10, left: 20, display: 'flex', alignItems: 'flex-end', gap: 4, height: 28 }}>
            {[6, 14, 22, 18, 10, 26, 14, 8].map((h, i) => (
              <div key={i} style={{ width: 3, height: h, background: i < 5 ? 'var(--brown-2)' : 'var(--surface-3)', borderRadius: 2 }} />
            ))}
            <span className="kp-mono" style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 8, paddingBottom: 1 }}>
              reading mood…
            </span>
          </div>
        </div>
      </div>
      
      {/* Profile / Gallery section */}
      <section style={{ padding: '56px 56px', borderTop: '1px solid var(--line)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'center' }}>
          <div>
            <div className="kp-eyebrow" style={{ marginBottom: 12 }}>Our space</div>
            <h3 className="kp-display" style={{ fontSize: 36, margin: 0 }}>A place for slow pours and small talks</h3>
            <p style={{ color: 'var(--text-muted)', marginTop: 18, maxWidth: 520, fontSize: 15, lineHeight: 1.6 }}>
              Kupiku is a neighborhood roastery and cafe built around simple rituals — careful brewing, seasonal beans, and a relaxed pace.
              Below are a few snapshots from our stores to give a sense of the space and the service you can expect.
            </p>
            {/* <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
              <button className="kp-btn" onClick={() => nav('/menu')}>See the menu</button>
              <button className="kp-btn kp-btn-ghost" onClick={() => nav('/mood')}>Start with mood</button>
            </div> */}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="kp-img-placeholder" data-label="Kupiku · Interior" style={{ height: 180, borderRadius: 8 }} />
            <div className="kp-img-placeholder" data-label="Kupiku · Barista" style={{ height: 180, borderRadius: 8 }} />
            <div className="kp-img-placeholder" data-label="Kupiku · Roastery" style={{ height: 180, borderRadius: 8 }} />
            <div className="kp-img-placeholder" data-label="Kupiku · Crowd" style={{ height: 180, borderRadius: 8 }} />
          </div>
        </div>
      </section>

      {/* Map preview section (design only) */}
      <section id="maps" style={{ padding: '56px 56px', borderTop: '1px solid var(--line)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 40, alignItems: 'start' }}>
          <div>
            <div className="kp-eyebrow" style={{ marginBottom: 12 }}>Find us</div>
            <h3 className="kp-display" style={{ fontSize: 28, margin: 0 }}>Where to find Kupiku Coffee</h3>
            <div className="kp-card" style={{ marginTop: 20, height: 320, borderRadius: 12, overflow: 'hidden', padding: 0 }}>
              <Map endpoint="/api/locations/geojson" height={320} />
            </div>
          </div>

          <aside style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="kp-eyebrow" style={{ marginBottom: 6 }}>Locations</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {STORES.map(s => (
                <div key={s.id} className="kp-card" style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{s.name}</div>
                    <div className="kp-mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>• {s.id.toUpperCase()}</div>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{s.addr}</div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <button className="kp-btn kp-btn-ghost kp-btn-sm" onClick={() => nav('/admin#maps')}>View on map</button>
                        <button className="kp-btn kp-btn-ghost kp-btn-sm" onClick={() => nav('/admin#maps')}>Get directions</button>
                      </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      {/* Footer — Contact & Location */}
      <footer style={{
        borderTop: '1px solid var(--line)',
        background: 'var(--surface-1, #0B0907)',
        padding: '56px 56px 28px',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.4fr 1fr 1fr 1fr',
          gap: 56,
          alignItems: 'flex-start',
        }}>
          {/* Brand block */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              {/* <img
                src={LogoKupiku}
                alt="Kupiku Logo"
                style={{ width: 80, height: 80, objectFit: 'contain', margin: '-20px 0' }}
              /> */}
              <span style={{ fontWeight: 600, letterSpacing: '-0.01em', fontSize: 14 }}>Kupiku Coffee</span>
            </div>
            <p style={{
              fontSize: 13, lineHeight: 1.65, color: 'var(--text-muted)',
              maxWidth: 320, margin: 0
            }}>
              A small mood-first roastery pouring carefully matched cups
              from morning rituals to late-night focus.
            </p>
            <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
              {['IG', 'TW', 'YT', 'TT'].map(s => (
                <div key={s} style={{
                  width: 32, height: 32, borderRadius: 8,
                  border: '1px solid var(--line)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-mono)', fontSize: 10,
                  color: 'var(--text-muted)', letterSpacing: '0.05em',
                  cursor: 'pointer'
                }}>{s}</div>
              ))}
            </div>
          </div>

          {/* Visit us */}
          <div>
            <div className="kp-eyebrow" style={{ fontSize: 10, marginBottom: 18 }}>Visit us</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 4 }}>
                  Kupiku Coffee · Anggajaya
                </div>
                <div style={{ fontSize: 12, lineHeight: 1.6, color: 'var(--text-muted)' }}>
                  Jl. Anggajaya 1 No. 8<br />
                  Gejayan, Condongcatur, Yogyakarta
                </div>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 4 }}>
                  Kupiku Coffee · Mandala Krida
                </div>
                <div style={{ fontSize: 12, lineHeight: 1.6, color: 'var(--text-muted)' }}>
                  Jl. Sokonandi II No. 9<br />
                  Semaki, Umbulharjo, Yogyakarta
                </div>
              </div>
            </div>
          </div>

          {/* Hours */}
          <div>
            <div className="kp-eyebrow" style={{ fontSize: 10, marginBottom: 18 }}>Hours</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12, color: 'var(--text-muted)' }}>
              {[
                ['Mon — Thu', '07:00 — 22:00'],
                ['Fri', '07:00 — 23:30'],
                ['Sat', '08:00 — 23:30'],
                ['Sun', '08:00 — 21:00'],
              ].map(([d, h]) => (
                <div key={d} style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                  <span>{d}</span>
                  <span className="kp-mono" style={{ color: 'var(--text)', fontSize: 11 }}>{h}</span>
                </div>
              ))}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 6,
                fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em',
                textTransform: 'uppercase', color: 'var(--brown-3)'
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: 'var(--brown-3)',
                  boxShadow: '0 0 0 3px rgba(168,131,95,0.18)'
                }} />
                Open now
              </div>
            </div>
          </div>

          {/* Get in touch */}
          <div>
            <div className="kp-eyebrow" style={{ fontSize: 10, marginBottom: 18 }}>Get in touch</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div className="kp-mono" style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                  Email
                </div>
                <div style={{ fontSize: 13, color: 'var(--text)' }}>halo@kupiku.coffee</div>
              </div>
              <div>
                <div className="kp-mono" style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                  Phone
                </div>
                <div style={{ fontSize: 13, color: 'var(--text)' }}>+62 22 8888 0142</div>
              </div>
              <div>
                <div className="kp-mono" style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                  Wholesale
                </div>
                <div style={{ fontSize: 13, color: 'var(--text)' }}>trade@kupiku.coffee</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer baseline */}
        <div style={{
          marginTop: 48, paddingTop: 20, borderTop: '1px solid var(--line)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em',
          textTransform: 'uppercase', color: 'var(--text-dim)'
        }}>
          <span>© 2026 Kupiku Coffee</span>
          {/* <div style={{ display: 'flex', gap: 28 }}>
            <span style={{ cursor: 'pointer' }}>Privacy</span>
            <span style={{ cursor: 'pointer' }}>Terms</span>
            <span style={{ cursor: 'pointer' }}>Careers</span>
            <span style={{ cursor: 'pointer' }}>Press kit</span>
          </div> */}
          {/* <span>−6.8895° S, 107.6131° E</span> */}
        </div>
      </footer>
    </div>
  );
}