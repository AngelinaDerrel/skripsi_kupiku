import React from 'react';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';

import PublicNavbar from '../components/PublicNavbar.jsx';

const DEMO_USERS = [
  {
    email: 'admin@kupiku.local',
    password: 'admin123',
    name: 'Kupiku Admin',
    role: 'admin',
  },
  {
    email: 'staff@kupiku.local',
    password: 'staff123',
    name: 'Kupiku Staff',
    role: 'staff',
  },
];

export default function Login() {
  const nav = useNavigate();
  const { state } = useLocation();
  const nextPath = state?.next;
  const [status, setStatus] = useState('idle'); // idle | loading | denied
  const [deniedEmail, setDeniedEmail] = useState('');
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  function doDemoLogin(demoEmail, demoPassword) {
    setStatus('loading');
    try {
      const account = DEMO_USERS.find(
        (item) => item.email === demoEmail && item.password === demoPassword
      );
      if (!account) {
        setDeniedEmail(demoEmail);
        setStatus('denied');
        return;
      }
      localStorage.setItem('kupiku_user', JSON.stringify({
        email: account.email,
        name: account.name,
        role: account.role,
      }));
      setStatus('idle');
      if (account.role === 'admin') nav('/admin');
      else if (account.role === 'staff') nav('/staff/orders');
      else nav('/mood');
    } catch (err) {
      console.error('Demo login error:', err);
      setStatus('idle');
    }
  }

  async function handleGoogleLogin(credentialResponse) {
    try {
      setStatus('loading');

      const googleToken = credentialResponse.credential;

      const response = await fetch('http://localhost:8000/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: googleToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Google login failed');
      }

      localStorage.setItem('kupiku_user', JSON.stringify(data.user));
      localStorage.setItem('kupiku_token', data.token);

      setStatus('idle');

      if (nextPath) {
        nav(nextPath);
      } else if (data.user.role === 'admin') {
        nav('/admin');
      } else if (data.user.role === 'staff') {
        nav('/staff/orders');
      } else {
        nav('/mood');
      }

    } catch (err) {
      console.error('Google login error:', err);
      setDeniedEmail('Google Account');
      setStatus('denied');
    }
  }

  return (
    <div className="kp" style={{
      display: 'flex', flexDirection: 'column', minHeight: '100vh',
      position: 'relative', overflow: 'hidden'
    }}>
      {/* Ambient backdrop */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(circle at 80% 20%, rgba(107,79,58,0.18), transparent 50%), radial-gradient(circle at 15% 85%, rgba(168,131,95,0.10), transparent 45%)',
        pointerEvents: 'none'
      }} />

      <PublicNavbar
        onMoodClick={() => nav('/login', { state: { next: '/mood' } })}
        onAdminClick={() => nav('/login', { state: { next: '/admin' } })}
        onOrderClick={() => nav('/login')}
      />

      {/* Center content */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        position: 'relative', zIndex: 1
      }}>
        {/* Left — copy */}
        <div style={{
          padding: '80px 56px',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          borderRight: '1px solid var(--line)'
        }}>
          <div className="kp-eyebrow" style={{ marginBottom: 28, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 24, height: 1, background: 'var(--brown-2)' }}></span>
            Members only · mood vault
          </div>

          <h1 className="kp-display" style={{
            fontSize: 64, lineHeight: 0.98, margin: 0, color: 'var(--text)',
            textWrap: 'balance'
          }}>
            Sign in to find<br />
            your <span style={{ fontStyle: 'italic', color: 'var(--brown-3)' }}>mood match.</span>
          </h1>

          <p style={{
            fontSize: 15, lineHeight: 1.65, color: 'var(--text-muted)',
            maxWidth: 420, marginTop: 28, marginBottom: 0
          }}>
            We save your past moods and recommendations so every cup gets
            closer to your taste. Mood selection is unlocked for registered
            Kupiku members.
          </p>

          <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 380 }}>
            {[
              { t: 'Only your Google email is stored', d: 'No passwords, no scraping — just an identity handshake.' },
              { t: 'Mood history stays private', d: 'Visible to you and your barista, never sold.' },
              { t: 'One tap to sign out', d: 'Revoke anytime from your profile.' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                  background: 'rgba(107,79,58,0.18)',
                  border: '1px solid rgba(107,79,58,0.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginTop: 2
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brown-3)' }} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 2 }}>{item.t}</div>
                  <div style={{ fontSize: 12, lineHeight: 1.55, color: 'var(--text-muted)' }}>{item.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — auth card */}
        <div style={{
          padding: '80px 56px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div className="kp-card" style={{
            width: '100%', maxWidth: 420,
            padding: '40px 36px',
            boxShadow: 'var(--shadow-lg)',
            position: 'relative'
          }}>
            {/* Cup glyph */}
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 30%, #2B2010, #15100A 60%, #0A0805)',
              border: '1px solid var(--line-strong)',
              boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.6)',
              marginBottom: 28,
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute', inset: 8, borderRadius: '50%',
                background: 'radial-gradient(ellipse at 30% 25%, rgba(168,131,95,0.4), rgba(74,53,39,0.6) 50%, rgba(20,14,9,0.9))'
              }} />
            </div>

            <div className="kp-eyebrow" style={{ marginBottom: 10, fontSize: 10 }}>Welcome back</div>
            <h2 className="kp-display" style={{
              fontSize: 32, lineHeight: 1.05, margin: 0, color: 'var(--text)'
            }}>
              Sign in to Kupiku
            </h2>
            <p style={{
              fontSize: 13, lineHeight: 1.6, color: 'var(--text-muted)',
              marginTop: 12, marginBottom: 32
            }}>
              Use your Google account to continue.
            </p>

            {/* Google sign-in — primary CTA */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              {googleClientId ? (
                <GoogleLogin
                  onSuccess={handleGoogleLogin}
                  onError={() => { setDeniedEmail('Google Account'); setStatus('denied'); }}
                  width="348"
                  text="signin_with"
                  shape="rectangular"
                  theme="filled_black"
                />
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                  Google Sign-in not configured. Set <span className="kp-mono">VITE_GOOGLE_CLIENT_ID</span> in your .env.
                </div>
              )}
            </div>

            {/* Loading indicator */}
            {status === 'loading' && (
              <div style={{
                marginTop: 16, textAlign: 'center',
                fontFamily: 'var(--font-mono)', fontSize: 11,
                color: 'var(--text-muted)', letterSpacing: '0.08em'
              }}>
                Signing in…
              </div>
            )}

            {/* Denied state */}
            {status === 'denied' && (
              <div style={{
                marginTop: 20,
                padding: '14px 16px',
                borderRadius: 10,
                background: 'rgba(197,139,90,0.08)',
                border: '1px solid rgba(197,139,90,0.3)',
              }}>
                <div className="kp-mono" style={{
                  fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: 'var(--warn)', marginBottom: 6
                }}>
                  Login failed
                </div>
                <div style={{ fontSize: 13, color: 'var(--text)', marginBottom: 4 }}>
                  Couldn't sign in with {deniedEmail}.
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.55 }}>
                  Make sure you're using a registered Google account, or contact the store.
                </div>
                <div
                  onClick={() => setStatus('idle')}
                  style={{
                    marginTop: 10,
                    fontFamily: 'var(--font-mono)', fontSize: 11,
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                    color: 'var(--brown-3)', cursor: 'pointer'
                  }}>
                  Try again →
                </div>
              </div>
            )}

            {/* Divider */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              margin: '28px 0 16px',
            }}>
              <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
              <span className="kp-mono" style={{
                fontSize: 10, color: 'var(--text-dim)',
                letterSpacing: '0.08em', textTransform: 'uppercase'
              }}>internal</span>
              <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
            </div>

            {/* Admin & Staff demo only */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="kp-btn kp-btn-ghost kp-btn-sm" style={{ flex: 1 }} onClick={() => doDemoLogin('admin@kupiku.local', 'admin123')}>
                Admin demo
              </button>
              <button className="kp-btn kp-btn-ghost kp-btn-sm" style={{ flex: 1 }} onClick={() => doDemoLogin('staff@kupiku.local', 'staff123')}>
                Staff demo
              </button>
            </div>

            {/* Footer links */}
            <div style={{
              display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center',
              marginTop: 28
            }}>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                New to Kupiku?{' '}
                <span style={{ color: 'var(--brown-3)', cursor: 'pointer' }}>
                  Register at the counter
                </span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                Trouble signing in? <span style={{ color: 'var(--text-muted)', cursor: 'pointer' }}>Contact us</span>
              </div>
            </div>

            {/* Footnote */}
            <div style={{
              marginTop: 28, paddingTop: 18, borderTop: '1px solid var(--line)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)',
              letterSpacing: '0.08em', textTransform: 'uppercase'
            }}>
              <span>Google OAuth · Kupiku Auth</span>
              <span>v1.5.0</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom strip */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 56px', borderTop: '1px solid var(--line)',
        fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)',
        letterSpacing: '0.08em', textTransform: 'uppercase',
        position: 'relative', zIndex: 1
      }}>
        <span>BY SIGNING IN, YOU AGREE TO OUR TERMS</span>
        <span>EST · KUPIKU · MMXXIV</span>
        <span>BREWED IN BANDUNG</span>
      </div>
    </div>
  );
}