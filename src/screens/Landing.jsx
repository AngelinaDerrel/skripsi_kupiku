import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Map from '../components/Map';
import api from '../lib/api';
import PublicNavbar from '../components/PublicNavbar.jsx';
import cupImage from '../assets/cup.jpg';
import foto1 from '../assets/foto1.jpg';
import foto2 from '../assets/foto2.jpg';
import foto3 from '../assets/foto3.jpg';
import foto4 from '../assets/foto4.jpg';

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
      <PublicNavbar
        active="discover"
        onMoodClick={() => nav('/mood')}
        onLocationsClick={() => {
          if (loc.pathname === '/') {
            const el = document.getElementById('maps');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else {
            nav('/#maps');
          }
        }}
        onAdminClick={() => nav('/login', { state: { next: '/admin' } })}
        onOrderClick={() => nav('/login')}
      />

      {/* Hero */}
      <div className="kp-hero-layout">
        <div>
          <div className="kp-eyebrow" style={{ marginBottom: 32, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 24, height: 1, background: 'var(--brown-2)' }}></span>
            Mood–first coffee, est. 2015
          </div>

          <h1 className="kp-display kp-h1-landing">
            Find your<br />perfect coffee<br />
            <span style={{ fontStyle: 'italic', color: 'var(--brown-3)' }}>by feel.</span>
          </h1>

          <p style={{ fontSize: 16, lineHeight: 1.6, color: 'var(--text-muted)', maxWidth: 440, marginTop: 32, marginBottom: 40 }}>
            Tell us how you're feeling. We'll pour something that matches —
            from a quiet pour-over for calm afternoons to a bold espresso for the days that need it.
          </p>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="kp-btn" onClick={() => nav('/mood')}>
              Discover your mood
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, opacity: 0.8 }}>→</span>
            </button>
            <button className="kp-btn kp-btn-ghost" onClick={() => nav('/menu')}>Browse the menu</button>
          </div>
        </div>

        {/* Hero visual — hidden on tablet/mobile via CSS */}
        <div className="kp-hero-visual" style={{ position: 'relative', height: 520 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 60% 40%, rgba(107,79,58,0.22), transparent 55%)' }} />
          <div style={{ position: 'absolute', top: 16, right: 6, width: 440, height: 440 }}>
            <div style={{
              width: '100%', height: '100%',
              borderRadius: 24,
              overflow: 'hidden',
              border: '1px solid var(--line-strong)',
              boxShadow: 'var(--shadow-lg)'
            }}>
              <img
                src={cupImage}
                alt="Kupiku coffee cup"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Gallery section */}
      <section className="kp-section-pad" style={{ borderTop: '1px solid var(--line)' }}>
        <div className="kp-gallery-layout">
          <div>
            <div className="kp-eyebrow" style={{ marginBottom: 12 }}>Our space</div>
            <h3 className="kp-display" style={{ fontSize: 36, margin: 0 }}>A place for slow pours and small talks</h3>
            <p style={{ color: 'var(--text-muted)', marginTop: 18, maxWidth: 520, fontSize: 15, lineHeight: 1.6 }}>
              Kupiku is a neighborhood roastery and cafe built around simple rituals — careful brewing, seasonal beans, and a relaxed pace.
              Below are a few snapshots from our stores to give a sense of the space and the service you can expect.
            </p>
          </div>

          <div className="kp-photo-grid">
            {[
              { src: foto1 },
              { src: foto2 },
              { src: foto3 },
              { src: foto4 },
            ].map(({ src, label }, idx) => (
              <div key={idx} style={{ position: 'relative', height: 180, borderRadius: 8, overflow: 'hidden', background: 'var(--surface)' }}>
                <img
                  src={src}
                  alt={label}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }}
                />
                {label && (
                  <span style={{
                    position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)',
                    background: 'rgba(20,14,10,0.72)', backdropFilter: 'blur(6px)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 4, padding: '4px 10px',
                    fontFamily: 'var(--font-mono)', fontSize: 10,
                    color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                  }}>{label}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Map section */}
      <section id="maps" className="kp-section-pad" style={{ borderTop: '1px solid var(--line)' }}>
        <div className="kp-eyebrow" style={{ marginBottom: 12 }}>Find us</div>
        <h3 className="kp-display" style={{ fontSize: 28, margin: 0 }}>Where to find Kupiku Coffee</h3>
        <div className="kp-card" style={{ marginTop: 20, height: 400, borderRadius: 12, overflow: 'hidden', padding: 0 }}>
          <Map endpoint={`${api.rawBase}/locations/geojson`} height={400} />
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--line)',
        background: 'var(--surface-1, #0B0907)',
        padding: '56px 56px 28px',
      }}>
        <div className="kp-footer-grid">
          {/* Brand block */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
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
              {[
                { label: 'IG', url: 'https://www.instagram.com/kupikucoffee?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==' },
                { label: 'TT', url: 'https://www.tiktok.com/@kupikucoffee?_r=1&_t=ZS-96u7NqoMBiH' },
              ].map(s => (
                <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" style={{
                  width: 32, height: 32, borderRadius: 8,
                  border: '1px solid var(--line)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-mono)', fontSize: 10,
                  color: 'var(--text-muted)', letterSpacing: '0.05em',
                  cursor: 'pointer', textDecoration: 'none',
                }}>{s.label}</a>
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
                ['Mon — Thu', '08:00 — 24:00'],
                ['Fri', '08:00 — 24:00'],
                ['Sat', '08:00 — 24:00'],
                ['Sun', '08:00 — 24:00'],
              ].map(([d, h]) => (
                <div key={d} style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                  <span>{d}</span>
                  <span className="kp-mono" style={{ color: 'var(--text)', fontSize: 11 }}>{h}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Get in touch */}
          <div>
            <div className="kp-eyebrow" style={{ fontSize: 10, marginBottom: 18 }}>Get in touch</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div className="kp-mono" style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Email</div>
                <div style={{ fontSize: 13, color: 'var(--text)' }}>kupiku@gmail.com</div>
              </div>
              <div>
                <div className="kp-mono" style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Phone</div>
                <div style={{ fontSize: 13, color: 'var(--text)' }}>+62 22 8888 0142</div>
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
        </div>
      </footer>
    </div>
  );
}
