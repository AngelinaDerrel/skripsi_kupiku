import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';

import PublicNavbar from '../components/PublicNavbar.jsx';
import { useToast } from '../components/Toast.jsx';
import api from '../lib/api.js';
import PasswordInput from '../components/PasswordInput.jsx';

// ─── shared input style ───────────────────────────────────────────────────────
const inputStyle = {
  padding: '10px 12px', borderRadius: 10,
  border: '1px solid var(--line-strong)',
  background: 'var(--surface)', color: 'var(--text)',
  fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box',
};

export default function Login() {
  const nav = useNavigate();
  const { state } = useLocation();
  const nextPath = state?.next;
  const toast = useToast();
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // ── login state ──────────────────────────────────────────────────────────────
  const [status, setStatus] = useState('idle');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // ── forgot-password state ────────────────────────────────────────────────────
  // step: 'login' | 'forgot-email' | 'forgot-otp' | 'forgot-reset'
  const [step, setStep] = useState('login');
  const [fpEmail, setFpEmail] = useState('');
  const [fpOtp, setFpOtp] = useState('');
  const [fpPassword, setFpPassword] = useState('');
  const [fpConfirm, setFpConfirm] = useState('');
  const [fpStatus, setFpStatus] = useState('idle');
  const [fpError, setFpError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (state?.registered) {
      toast('Your account has been successfully created. Please log in.', 'success');
    }
  }, []);

  // resend cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return undefined;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  function resetForgotState() {
    setFpEmail(''); setFpOtp(''); setFpPassword(''); setFpConfirm('');
    setFpStatus('idle'); setFpError(''); setResendCooldown(0);
  }

  function backToLogin() {
    setStep('login');
    resetForgotState();
  }

  // ── login ────────────────────────────────────────────────────────────────────
  function navigateAfterLogin(user) {
    const role = user?.role;
    if (role === 'admin' || role === 'owner') return nav('/admin');
    if (role === 'staff') return nav('/staff/orders');
    toast('You have successfully logged in and can now place orders!', 'success');
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
        toast('Your account is not registered.\nPlease register first or login with Google.', 'warn');
      } else if (err.status === 401) {
        toast('Incorrect password. Please try again.', 'warn');
      } else {
        toast('An error occurred. Please check your connection.', 'warn');
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
      toast('Google login failed. Please try again.', 'warn');
    }
  }

  // ── forgot password steps ────────────────────────────────────────────────────
  async function handleSendOtp(e) {
    e.preventDefault();
    setFpError('');
    setFpStatus('loading');
    try {
      await api.post('/forgot-password', { email: fpEmail });
      setStep('forgot-otp');
      setResendCooldown(60);
    } catch (err) {
      const msg = err?.data?.message || err?.message || 'Gagal mengirim OTP.';
      if (err?.status === 404) {
        setFpError('Email tidak terdaftar di sistem kami.');
      } else {
        setFpError(msg);
      }
    } finally {
      setFpStatus('idle');
    }
  }

  async function handleResendOtp() {
    if (resendCooldown > 0) return;
    setFpError('');
    setFpStatus('resending');
    try {
      await api.post('/forgot-password', { email: fpEmail });
      setResendCooldown(60);
      toast('Kode OTP baru telah dikirim.', 'success');
    } catch (err) {
      setFpError('Gagal mengirim ulang OTP.');
    } finally {
      setFpStatus('idle');
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setFpError('');
    setFpStatus('loading');
    try {
      await api.post('/verify-otp', { email: fpEmail, otp: fpOtp });
      setStep('forgot-reset');
    } catch (err) {
      const msg = err?.data?.message || err?.message || 'Kode OTP tidak valid.';
      setFpError(msg);
    } finally {
      setFpStatus('idle');
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    setFpError('');
    if (fpPassword !== fpConfirm) {
      setFpError('Konfirmasi password tidak cocok.');
      return;
    }
    setFpStatus('loading');
    try {
      await api.post('/reset-password', {
        email: fpEmail,
        otp: fpOtp,
        password: fpPassword,
        password_confirmation: fpConfirm,
      });
      toast('Password berhasil direset. Silakan login.', 'success');
      backToLogin();
    } catch (err) {
      const msg = err?.data?.message || err?.message || 'Gagal reset password.';
      setFpError(msg);
    } finally {
      setFpStatus('idle');
    }
  }

  // ── render helpers ───────────────────────────────────────────────────────────
  function renderBackButton(onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-muted)', fontSize: 12,
          fontFamily: 'var(--font-mono)', letterSpacing: '0.05em',
          marginBottom: 20, padding: 0,
        }}
      >
        ← Kembali ke login
      </button>
    );
  }

  function renderStepIndicator(current) {
    const steps = [
      { key: 'forgot-email', label: '1' },
      { key: 'forgot-otp',   label: '2' },
      { key: 'forgot-reset', label: '3' },
    ];
    const order = steps.map((s) => s.key);
    const currentIdx = order.indexOf(current);
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        {steps.map((s, i) => {
          const done = i < currentIdx;
          const active = i === currentIdx;
          return (
            <React.Fragment key={s.key}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 600,
                background: active ? 'var(--brown)' : done ? 'rgba(107,79,58,0.25)' : 'var(--surface-2)',
                border: `1px solid ${active ? 'rgba(168,131,95,0.5)' : done ? 'rgba(107,79,58,0.3)' : 'var(--line-strong)'}`,
                color: active ? 'var(--text)' : done ? 'var(--brown-3)' : 'var(--text-dim)',
              }}>
                {done ? '✓' : s.label}
              </div>
              {i < steps.length - 1 && (
                <div style={{ flex: 1, height: 1, background: done ? 'rgba(107,79,58,0.3)' : 'var(--line)' }} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  // ── card content based on step ────────────────────────────────────────────────
  function renderCard() {
    if (step === 'forgot-email') {
      return (
        <>
          {renderBackButton(backToLogin)}
          {renderStepIndicator('forgot-email')}

          <div className="kp-eyebrow" style={{ marginBottom: 10, fontSize: 10 }}>Reset Password · Step 1</div>
          <h2 className="kp-display" style={{ fontSize: 26, lineHeight: 1.1, margin: 0, color: 'var(--text)' }}>
            Masukkan email kamu
          </h2>
          <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-muted)', marginTop: 10, marginBottom: 24 }}>
            Kami akan mengirimkan kode OTP 6-digit ke email kamu.
          </p>

          <form onSubmit={handleSendOtp} style={{ display: 'grid', gap: 10 }}>
            <input
              type="email"
              value={fpEmail}
              onChange={(e) => setFpEmail(e.target.value)}
              placeholder="Email terdaftar"
              required
              style={inputStyle}
            />
            {fpError && <p style={{ margin: 0, fontSize: 12, color: 'var(--bad)' }}>{fpError}</p>}
            <button
              type="submit"
              className="kp-btn"
              disabled={fpStatus === 'loading'}
              style={{ width: '100%', marginTop: 4, opacity: fpStatus === 'loading' ? 0.6 : 1 }}
            >
              {fpStatus === 'loading' ? 'Mengirim OTP…' : 'Kirim Kode OTP'}
            </button>
          </form>
        </>
      );
    }

    if (step === 'forgot-otp') {
      return (
        <>
          {renderBackButton(() => setStep('forgot-email'))}
          {renderStepIndicator('forgot-otp')}

          <div className="kp-eyebrow" style={{ marginBottom: 10, fontSize: 10 }}>Reset Password · Step 2</div>
          <h2 className="kp-display" style={{ fontSize: 26, lineHeight: 1.1, margin: 0, color: 'var(--text)' }}>
            Cek email kamu
          </h2>
          <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-muted)', marginTop: 10, marginBottom: 24 }}>
            Kode OTP 6-digit dikirim ke{' '}
            <span style={{ color: 'var(--brown-3)', fontWeight: 500 }}>{fpEmail}</span>.
            Berlaku 10 menit.
          </p>

          <form onSubmit={handleVerifyOtp} style={{ display: 'grid', gap: 10 }}>
            <input
              type="text"
              value={fpOtp}
              onChange={(e) => setFpOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              required
              maxLength={6}
              inputMode="numeric"
              style={{
                ...inputStyle,
                textAlign: 'center',
                fontSize: 28,
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.22em',
                fontWeight: 700,
                padding: '14px 12px',
              }}
            />
            {fpError && <p style={{ margin: 0, fontSize: 12, color: 'var(--bad)' }}>{fpError}</p>}
            <button
              type="submit"
              className="kp-btn"
              disabled={fpOtp.length < 6 || fpStatus === 'loading'}
              style={{ width: '100%', marginTop: 4, opacity: (fpOtp.length < 6 || fpStatus === 'loading') ? 0.6 : 1 }}
            >
              {fpStatus === 'loading' ? 'Memverifikasi…' : 'Verifikasi OTP'}
            </button>
          </form>

          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Tidak menerima kode? </span>
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resendCooldown > 0 || fpStatus === 'resending'}
              style={{
                background: 'none', border: 'none', cursor: resendCooldown > 0 ? 'default' : 'pointer',
                fontSize: 12, color: resendCooldown > 0 ? 'var(--text-dim)' : 'var(--brown-3)',
                fontWeight: 500, padding: 0,
              }}
            >
              {fpStatus === 'resending'
                ? 'Mengirim…'
                : resendCooldown > 0
                  ? `Kirim ulang (${resendCooldown}s)`
                  : 'Kirim ulang'}
            </button>
          </div>
        </>
      );
    }

    if (step === 'forgot-reset') {
      return (
        <>
          {renderStepIndicator('forgot-reset')}

          <div className="kp-eyebrow" style={{ marginBottom: 10, fontSize: 10 }}>Reset Password · Step 3</div>
          <h2 className="kp-display" style={{ fontSize: 26, lineHeight: 1.1, margin: 0, color: 'var(--text)' }}>
            Buat password baru
          </h2>
          <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-muted)', marginTop: 10, marginBottom: 24 }}>
            Buat password baru yang kuat untuk akun kamu.
          </p>

          <form onSubmit={handleResetPassword} style={{ display: 'grid', gap: 10 }}>
            <PasswordInput
              value={fpPassword}
              onChange={(e) => setFpPassword(e.target.value)}
              placeholder="Password baru (min. 8 karakter)"
              required
              minLength={8}
              style={inputStyle}
            />
            <PasswordInput
              value={fpConfirm}
              onChange={(e) => setFpConfirm(e.target.value)}
              placeholder="Konfirmasi password baru"
              required
              style={inputStyle}
            />
            {fpError && <p style={{ margin: 0, fontSize: 12, color: 'var(--bad)' }}>{fpError}</p>}
            <button
              type="submit"
              className="kp-btn"
              disabled={fpStatus === 'loading'}
              style={{ width: '100%', marginTop: 4, opacity: fpStatus === 'loading' ? 0.6 : 1 }}
            >
              {fpStatus === 'loading' ? 'Menyimpan…' : 'Simpan Password Baru'}
            </button>
          </form>
        </>
      );
    }

    // default: login
    return (
      <>
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

        <div className="kp-eyebrow" style={{ marginBottom: 10, fontSize: 10 }}>Welcome!</div>
        <h2 className="kp-display" style={{ fontSize: 32, lineHeight: 1.05, margin: 0, color: 'var(--text)' }}>
          Sign in to Kupiku
        </h2>
        <p style={{
          fontSize: 13, lineHeight: 1.6, color: 'var(--text-muted)',
          marginTop: 12, marginBottom: 28
        }}>
          Enter your email and password, or use Google.
        </p>

        {/* Email + Password form */}
        <form onSubmit={handleLogin} style={{ display: 'grid', gap: 10 }}>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email"
            required
            style={inputStyle}
          />
          <PasswordInput
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            required
            style={inputStyle}
          />

          {/* Lupa password link */}
          <div style={{ textAlign: 'right', marginTop: -4 }}>
            <button
              type="button"
              onClick={() => { resetForgotState(); setStep('forgot-email'); }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 12, color: 'var(--brown-3)', fontWeight: 500,
                padding: 0, fontFamily: 'var(--font-sans)',
              }}
            >
              Lupa password?
            </button>
          </div>

          <button
            type="submit"
            className="kp-btn"
            disabled={status === 'loading'}
            style={{ width: '100%', marginTop: 4, opacity: status === 'loading' ? 0.6 : 1 }}
          >
            {status === 'loading' ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '22px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
          <span className="kp-mono" style={{
            fontSize: 10, color: 'var(--text-dim)',
            letterSpacing: '0.08em', textTransform: 'uppercase'
          }}>or</span>
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
            Don't have an account yet?{' '}
            <Link to="/register" style={{ color: 'var(--brown-3)', textDecoration: 'none', fontWeight: 500 }}>
              Sign up now
            </Link>
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)',
            letterSpacing: '0.08em', textTransform: 'uppercase'
          }}>
            Google OAuth · Kupiku Auth · v1.5.0
          </div>
        </div>
      </>
    );
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

          <h1 className="kp-display kp-h1-auth" style={{ color: 'var(--text)', textWrap: 'balance' }}>
            Sign in to order<br />
          </h1>

          <p style={{
            fontSize: 15, lineHeight: 1.65, color: 'var(--text-muted)',
            maxWidth: 420, marginTop: 28, marginBottom: 0
          }}>
            We tailor your coffee recommendations to your mood so that every cup is just right for you.
            Sign in with your email or Google account.
          </p>

          <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 380 }}>
            {[
              { t: 'Login by email or Google', d: '' },
              { t: 'Logout everytime you wants', d: '' },
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
            {renderCard()}
          </div>
        </div>
      </div>

      <div className="kp-auth-strip" style={{
        fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)',
        letterSpacing: '0.08em', textTransform: 'uppercase',
        position: 'relative', zIndex: 1
      }} />
    </div>
  );
}
