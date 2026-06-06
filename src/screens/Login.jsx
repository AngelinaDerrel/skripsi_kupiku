import React, { useEffect } from 'react';
import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';

import PublicNavbar from '../components/PublicNavbar.jsx';
import { useToast } from '../components/Toast.jsx';
import api from '../lib/api.js';

export default function Login() {
  const nav = useNavigate();
  const { state } = useLocation();
  const nextPath = state?.next;
  const toast = useToast();
  const [status, setStatus] = useState('idle');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (state?.registered) {
      toast('Akun berhasil dibuat. Silakan masuk.', 'success');
    }
  }, []);

  function navigateAfterLogin(user) {
    const role = user?.role;
    if (role === 'admin' || role === 'owner') return nav('/admin');
    if (role === 'staff') return nav('/staff/orders');

    toast('Anda berhasil login dan bisa mulai order sekarang!', 'success');
    const allowedCustomerRoutes = ['/menu', '/mood', '/track', '/order'];
    if (nextPath && allowedCustomerRoutes.includes(nextPath)) return nav(nextPath);
    return nav('/menu');
  }

  async function handleLogin(e) {
    e.preventDefault();
    setStatus('loading');
    try {
      const data = await api.post('/login', { email, password });
      localStorage.setItem('kupiku_user', JSON.stringify(data.user));
      localStorage.setItem('kupiku_token', data.token);
      setStatus('idle');
      navigateAfterLogin(data.user);
    } catch (err) {
      setStatus('idle');
      if (err.status === 404) {
        toast('Akun anda belum terdaftar.\nRegister terlebih dahulu atau login by Google.', 'warn');
      } else if (err.status === 401) {
        toast('Password salah. Silakan coba lagi.', 'warn');
      } else {
        toast('Terjadi kesalahan. Periksa koneksi anda.', 'warn');
      }
    }
  }

  async function handleGoogleLogin(credentialResponse) {
    setStatus('loading');
    try {
      const data = await api.post('/auth/google', { token: credentialResponse.credential });
      localStorage.setItem('kupiku_user', JSON.stringify(data.user));
      localStorage.setItem('kupiku_token', data.token);
      setStatus('idle');
      navigateAfterLogin(data.user);
    } catch (err) {
      setStatus('idle');
      toast('Login Google gagal. Coba lagi.', 'warn');
    }
  }

  return (
    <div className="kp" style={{
      display: 'flex', flexDirection: 'column', minHeight: '100vh',
      position: 'relative', overflow: 'hidden'
    }}>
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

      <div className="kp-auth-layout">
        {/* Left — copy */}
        <div className="kp-auth-copy">
          <div className="kp-eyebrow" style={{ marginBottom: 28, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 24, height: 1, background: 'var(--brown-2)' }}></span>
            Members only · mood vault
          </div>

          <h1 className="kp-display kp-h1-auth" style={{
            color: 'var(--text)',
            textWrap: 'balance'
          }}>
            Sign in to find<br />
            your <span style={{ fontStyle: 'italic', color: 'var(--brown-3)' }}>mood match.</span>
          </h1>

          <p style={{
            fontSize: 15, lineHeight: 1.65, color: 'var(--text-muted)',
            maxWidth: 420, marginTop: 28, marginBottom: 0
          }}>
            Kami menyimpan mood dan rekomendasi kopi anda agar setiap cangkir
            semakin sesuai selera. Masuk dengan email atau Google.
          </p>

          <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 380 }}>
            {[
              { t: 'Login via email atau Google', d: 'Pilih cara yang paling nyaman untuk anda.' },
              { t: 'Mood history tetap private', d: 'Hanya anda dan barista anda yang bisa melihat.' },
              { t: 'Logout kapan saja', d: 'Cabut akses sewaktu-waktu dari profil anda.' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                  background: 'rgba(107,79,58,0.18)', border: '1px solid rgba(107,79,58,0.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2
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
        <div className="kp-auth-form">
          <div className="kp-card" style={{
            width: '100%', maxWidth: 420,
            padding: '40px 36px',
            boxShadow: 'var(--shadow-lg)',
          }}>
            {/* Cup glyph */}
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 30%, #2B2010, #15100A 60%, #0A0805)',
              border: '1px solid var(--line-strong)',
              boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.6)',
              marginBottom: 28, position: 'relative'
            }}>
              <div style={{
                position: 'absolute', inset: 8, borderRadius: '50%',
                background: 'radial-gradient(ellipse at 30% 25%, rgba(168,131,95,0.4), rgba(74,53,39,0.6) 50%, rgba(20,14,9,0.9))'
              }} />
            </div>

            <div className="kp-eyebrow" style={{ marginBottom: 10, fontSize: 10 }}>Selamat datang</div>
            <h2 className="kp-display" style={{ fontSize: 32, lineHeight: 1.05, margin: 0, color: 'var(--text)' }}>
              Masuk ke Kupiku
            </h2>
            <p style={{
              fontSize: 13, lineHeight: 1.6, color: 'var(--text-muted)',
              marginTop: 12, marginBottom: 28
            }}>
              Masukkan email dan password anda, atau gunakan Google.
            </p>

            {/* Email + Password form */}
            <form onSubmit={handleLogin} style={{ display: 'grid', gap: 10 }}>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email"
                required
                style={{
                  padding: '10px 12px', borderRadius: 10,
                  border: '1px solid var(--line-strong)',
                  background: 'var(--surface)', color: 'var(--text)',
                  fontSize: 13, outline: 'none'
                }}
              />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Password"
                required
                style={{
                  padding: '10px 12px', borderRadius: 10,
                  border: '1px solid var(--line-strong)',
                  background: 'var(--surface)', color: 'var(--text)',
                  fontSize: 13, outline: 'none'
                }}
              />
              <button
                type="submit"
                className="kp-btn"
                disabled={status === 'loading'}
                style={{ width: '100%', marginTop: 4, opacity: status === 'loading' ? 0.6 : 1 }}
              >
                {status === 'loading' ? 'Masuk…' : 'Masuk'}
              </button>
            </form>

            {/* Divider */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              margin: '22px 0',
            }}>
              <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
              <span className="kp-mono" style={{
                fontSize: 10, color: 'var(--text-dim)',
                letterSpacing: '0.08em', textTransform: 'uppercase'
              }}>atau</span>
              <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
            </div>

            {/* Google button */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              {googleClientId ? (
                <GoogleLogin
                  onSuccess={handleGoogleLogin}
                  onError={() => toast('Login Google gagal. Coba lagi.', 'warn')}
                  width="348"
                  text="signin_with"
                  shape="rectangular"
                  theme="filled_black"
                />
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center' }}>
                  Google Sign-in tidak terkonfigurasi.
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--line)',
              display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center'
            }}>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Belum punya akun?{' '}
                <Link
                  to="/register"
                  style={{ color: 'var(--brown-3)', textDecoration: 'none', fontWeight: 500 }}
                >
                  Daftar sekarang
                </Link>
              </div>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)',
                letterSpacing: '0.08em', textTransform: 'uppercase'
              }}>
                Google OAuth · Kupiku Auth · v1.5.0
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom strip */}
      <div className="kp-auth-strip" style={{
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
