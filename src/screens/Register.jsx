import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

import PublicNavbar from '../components/PublicNavbar.jsx';
import { useToast } from '../components/Toast.jsx';
import api from '../lib/api.js';

export default function Register() {
  const nav = useNavigate();
  const toast = useToast();
  const [status, setStatus] = useState('idle');
  const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '' });
  const [errors, setErrors] = useState({});

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Nama tidak boleh kosong';
    if (!form.email.trim()) newErrors.email = 'Email tidak boleh kosong';
    if (form.password.length < 8) newErrors.password = 'Password minimal 8 karakter';
    if (form.password !== form.password_confirmation) newErrors.password_confirmation = 'Password tidak cocok';
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    setStatus('loading');
    try {
      await api.post('/register', form);
      nav('/login', { state: { registered: true } });
    } catch (err) {
      setStatus('idle');
      if (err.status === 422) {
        const apiErrors = err.data?.errors || {};
        const mapped = {};
        if (apiErrors.email) mapped.email = apiErrors.email[0];
        if (apiErrors.password) mapped.password = apiErrors.password[0];
        if (apiErrors.name) mapped.name = apiErrors.name[0];
        setErrors(mapped);
      } else {
        toast('Terjadi kesalahan. Periksa koneksi anda.', 'warn');
      }
    }
  }

  const inputStyle = (field) => ({
    padding: '10px 12px', borderRadius: 10,
    border: `1px solid ${errors[field] ? 'rgba(197,90,90,0.6)' : 'var(--line-strong)'}`,
    background: 'var(--surface)', color: 'var(--text)',
    fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box'
  });

  return (
    <div className="kp" style={{
      display: 'flex', flexDirection: 'column', minHeight: '100vh',
      position: 'relative', overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(circle at 20% 20%, rgba(107,79,58,0.16), transparent 50%), radial-gradient(circle at 85% 80%, rgba(168,131,95,0.10), transparent 45%)',
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
            Bergabung · mood vault
          </div>

          <h1 className="kp-display kp-h1-auth" style={{
            color: 'var(--text)',
            textWrap: 'balance'
          }}>
            Temukan kopi<br />
            yang <span style={{ fontStyle: 'italic', color: 'var(--brown-3)' }}>tepat untukmu.</span>
          </h1>

          <p style={{
            fontSize: 15, lineHeight: 1.65, color: 'var(--text-muted)',
            maxWidth: 420, marginTop: 28, marginBottom: 0
          }}>
            Daftar sebagai member Kupiku untuk menikmati fitur mood selection,
            rekomendasi kopi personal, dan riwayat pesanan anda.
          </p>

          <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 380 }}>
            {[
              { t: 'Rekomendasi kopi personal', d: 'Kami belajar dari mood dan pilihan anda setiap kunjungan.' },
              { t: 'Riwayat mood tersimpan', d: 'Akses kembali favorit anda kapan saja.' },
              { t: 'Gratis & aman', d: 'Tidak ada biaya tersembunyi, data anda tidak dijual.' },
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

        {/* Right — register card */}
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

            <div className="kp-eyebrow" style={{ marginBottom: 10, fontSize: 10 }}>Anggota baru</div>
            <h2 className="kp-display" style={{ fontSize: 32, lineHeight: 1.05, margin: 0, color: 'var(--text)' }}>
              Buat Akun
            </h2>
            <p style={{
              fontSize: 13, lineHeight: 1.6, color: 'var(--text-muted)',
              marginTop: 12, marginBottom: 28
            }}>
              Isi form berikut untuk mendaftar sebagai member Kupiku.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
              <div>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  placeholder="Nama lengkap"
                  style={inputStyle('name')}
                />
                {errors.name && (
                  <div style={{ fontSize: 11, color: 'rgba(220,100,100,0.9)', marginTop: 4 }}>
                    {errors.name}
                  </div>
                )}
              </div>

              <div>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  placeholder="Email"
                  style={inputStyle('email')}
                />
                {errors.email && (
                  <div style={{ fontSize: 11, color: 'rgba(220,100,100,0.9)', marginTop: 4 }}>
                    {errors.email}
                  </div>
                )}
              </div>

              <div>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  placeholder="Password (minimal 8 karakter)"
                  style={inputStyle('password')}
                />
                {errors.password && (
                  <div style={{ fontSize: 11, color: 'rgba(220,100,100,0.9)', marginTop: 4 }}>
                    {errors.password}
                  </div>
                )}
              </div>

              <div>
                <input
                  type="password"
                  value={form.password_confirmation}
                  onChange={e => set('password_confirmation', e.target.value)}
                  placeholder="Konfirmasi password"
                  style={inputStyle('password_confirmation')}
                />
                {errors.password_confirmation && (
                  <div style={{ fontSize: 11, color: 'rgba(220,100,100,0.9)', marginTop: 4 }}>
                    {errors.password_confirmation}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="kp-btn"
                disabled={status === 'loading'}
                style={{ width: '100%', marginTop: 4, opacity: status === 'loading' ? 0.6 : 1 }}
              >
                {status === 'loading' ? 'Mendaftar…' : 'Daftar Sekarang'}
              </button>
            </form>

            {/* Footer */}
            <div style={{
              marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--line)',
              display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center'
            }}>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Sudah punya akun?{' '}
                <Link
                  to="/login"
                  style={{ color: 'var(--brown-3)', textDecoration: 'none', fontWeight: 500 }}
                >
                  Masuk di sini
                </Link>
              </div>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)',
                letterSpacing: '0.08em', textTransform: 'uppercase'
              }}>
                Kupiku · MMXXIV · Brewed in Bandung
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
        <span>WITH REGISTRATION, YOU AGREE TO OUR TERMS</span>
        <span>EST · KUPIKU · MMXXIV</span>
        <span>BREWED IN BANDUNG</span>
      </div>
    </div>
  );
}
