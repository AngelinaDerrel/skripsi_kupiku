import React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api.js';
import LogoKupiku from '../assets/kupikuLogo.png';

export default function Menu() {
  const nav = useNavigate();
  const [filter, setFilter] = useState('all');
  const [hovered, setHovered] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([{ id: 'all', label: 'All' }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const normalizeCategoryId = (value) =>
    String(value || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-');

  const pickString = (source, keys = []) => {
    if (typeof source === 'string') return source;
    if (!source || typeof source !== 'object') return '';
    for (const key of keys) {
      const val = source[key];
      if (typeof val === 'string' && val.trim()) return val;
    }
    return '';
  };

  useEffect(() => {
    let cancelled = false;
    async function loadMenu() {
      setLoading(true);
      setError(null);
      try {
        const data = await api.get('menu');
        if (cancelled) return;
        const arr = Array.isArray(data) ? data : (data?.data ?? []);
        const mapped = arr.map((item, idx) => {
          const categoryLabel =
            pickString(item.kategori, ['kategori', 'nama_kategori', 'namaKategori', 'nama', 'category', 'label']) ||
            pickString(item, ['kategori', 'category', 'cat', 'jenis']);
          const recipeList = Array.isArray(item.reseps)
            ? item.reseps
              .map((resep) => resep?.bahanbaku?.nama_bahan || resep?.bahanbaku?.nama || resep?.nama_bahan)
              .filter(Boolean)
            : [];
          return {
            id: item.id_menu ?? item.id ?? item.menu_id ?? idx,
            name: pickString(item, ['nama_menu', 'namaMenu', 'menu', 'name', 'nama', 'menu_name', 'menuName', 'judul', 'title']),
            price: item.harga ?? item.price ?? '',
            recipe: recipeList.length ? recipeList : (item.resep || item.recipe || item.deskripsi || item.desc || ''),
            categoryLabel,
            categoryId: normalizeCategoryId(categoryLabel),
          };
        });

        const uniqueLabels = [...new Set(mapped.map((m) => String(m.categoryLabel || '').trim()).filter(Boolean))];
        const nextCategories = [
          { id: 'all', label: 'All' },
          ...uniqueLabels.map((label) => ({ id: normalizeCategoryId(label), label })),
        ];

        setMenuItems(mapped);
        setCategories(nextCategories);
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Failed to load menu');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadMenu();
    return () => { cancelled = true; };
  }, []);

  const items = useMemo(() => {
    if (filter === 'all') return menuItems;
    return menuItems.filter((item) => item.categoryId === filter);
  }, [filter, menuItems]);

  const formatPrice = (value) => {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric.toLocaleString('id-ID');
    return value || '-';
  };

  const getRecipeItems = (value) => {
    if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
    return String(value || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  };

  return (
    <div className="kp" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Top nav */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '24px 56px', borderBottom: '1px solid var(--line)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => nav('/')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', height: '100%' }} onClick={() => nav('/')}>
                    <img 
                    src={LogoKupiku} 
                    alt="Kupiku Logo" 
                    style={{ width: 130, height: 130, objectFit: 'contain', margin: '-35px 0' }} 
                    />
                </div>
            </div>
        </div>
        <div style={{ display: 'flex', gap: 36, fontSize: 13, color: 'var(--text-muted)' }}>
          <span style={{ cursor: 'pointer' }} onClick={() => nav('/')}>Discover</span>
          <span style={{ color: 'var(--text)' }}>Menu</span>
          <span style={{ cursor: 'pointer' }} onClick={() => nav('/mood')}>Mood</span>
          <span>Locations</span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => nav('/login')}>Sign in</span>
          <button className="kp-btn kp-btn-sm" onClick={() => nav('/login')}>
            Order
          </button>
        </div>
      </nav>

      {/* Header */}
      <div style={{ padding: '64px 56px 40px', display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 60, alignItems: 'end' }}>
        <div>
          <div className="kp-eyebrow" style={{ marginBottom: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 24, height: 1, background: 'var(--brown-2)' }} />
            The full menu '26
          </div>
          <h1 className="kp-display" style={{ fontSize: 76, lineHeight: 0.98, margin: 0 }}>
            Every pour,<br />
            <span style={{ fontStyle: 'italic', color: 'var(--brown-3)' }}>every</span> mood.
          </h1>
        </div>
        <div style={{ paddingBottom: 6 }}>
          <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--text-muted)', maxWidth: 380, margin: 0 }}>
            42 drinks across espresso, brew, milk and cold. Tap any item to see tasting notes
            and what mood it pairs with.
          </p>
          <div style={{
            display: 'flex', gap: 18, marginTop: 22, fontSize: 12,
            color: 'var(--text-dim)', fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase', letterSpacing: '0.1em'
          }}>
            <span>{items.length} menu</span>
            <span>·</span>
            <span>{loading ? 'loading' : 'updated weekly'}</span>
          </div>
        </div>
      </div>

      {/* Featured strip */}
      <div style={{ padding: '0 56px 40px' }}>
        {/* <div className="kp-card" style={{
          display: 'grid', gridTemplateColumns: '1.1fr 1fr', overflow: 'hidden',
          boxShadow: 'var(--shadow)',
          background: 'linear-gradient(110deg, var(--surface), rgba(107,79,58,0.08))'
        }}>
          <div style={{ padding: 40, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <span className="kp-chip" style={{ background: 'rgba(168,131,95,0.18)', color: 'var(--brown-3)' }}>★ SIGNATURE</span>
              <h2 className="kp-display" style={{ fontSize: 42, lineHeight: 1.02, margin: '18px 0 10px' }}>
                {featured.name}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6, maxWidth: 420, margin: 0 }}>
                {featured.desc} A slow brew for unhurried mornings — paired with calm.
              </p>
              <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
                {featured.notes.map((n) => (
                  <span key={n} className="kp-mono" style={{
                    fontSize: 10, padding: '4px 10px',
                    border: '1px solid var(--line-strong)', borderRadius: 999,
                    color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em'
                  }}>{n}</span>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 28, alignItems: 'center' }}>
              <button className="kp-btn">Add to cart · IDR {featured.price}k</button>
              <button className="kp-btn kp-btn-ghost kp-btn-sm">Tasting notes</button>
            </div>
          </div>
          <div className="kp-img-placeholder" data-label="DRINK · CEDAR POUR-OVER" style={{ borderRadius: 0, minHeight: 320 }} />
        </div> */}
      </div>

      {/* Filter pills */}
      <div style={{
        padding: '8px 56px 24px', display: 'flex', alignItems: 'center', gap: 8,
        position: 'sticky', top: 0, background: 'var(--bg)', zIndex: 5
      }}>
        <span className="kp-eyebrow" style={{ marginRight: 6 }}>FILTER</span>
        {categories.map((c) => {
          const active = c.id === filter;
          return (
            <span key={c.id} onClick={() => setFilter(c.id)} style={{
              padding: '8px 14px', borderRadius: 999,
              background: active ? 'rgba(107,79,58,0.22)' : 'transparent',
              border: '1px solid ' + (active ? 'rgba(168,131,95,0.5)' : 'var(--line)'),
              color: active ? 'var(--brown-3)' : 'var(--text-muted)',
              fontSize: 13, cursor: 'pointer', transition: 'all 160ms ease'
            }}>{c.label}</span>
          );
        })}
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {loading ? 'Loading menu...' : (error ? 'Gagal memuat menu' : 'Ready')}
        </span>
      </div>

      {/* Grid */}
      <div style={{ padding: '0 56px 56px' }}>
        {error && (
          <div style={{
            marginBottom: 18, padding: '10px 14px',
            border: '1px solid var(--line)', borderRadius: 10,
            color: 'var(--text-muted)', background: 'var(--surface)'
          }}>
            {error}
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {items.map((d) => {
            const isHover = hovered === d.id;
            return (
              <div
                key={d.id}
                onMouseEnter={() => setHovered(d.id)}
                onMouseLeave={() => setHovered(null)}
                className="kp-card"
                style={{
                  overflow: 'hidden',
                  boxShadow: isHover ? 'var(--shadow)' : 'var(--shadow-sm)',
                  transform: isHover ? 'translateY(-2px)' : 'translateY(0)',
                  transition: 'all 220ms ease',
                  cursor: 'pointer'
                }}
              >
                <div className="kp-img-placeholder" data-label={`DRINK · ${d.name.toUpperCase()}`} style={{
                  borderRadius: 0, height: 200,
                  filter: isHover ? 'brightness(1.1)' : 'none',
                  transition: 'filter 220ms ease'
                }} />
                <div style={{ padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
                    <h4 style={{ fontSize: 18, margin: 0, fontWeight: 500, letterSpacing: '-0.01em' }}>{d.name}</h4>
                    <span className="kp-mono" style={{ fontSize: 13, color: 'var(--text)', whiteSpace: 'nowrap' }}>Rp {formatPrice(d.price)}</span>
                  </div>
                  {getRecipeItems(d.recipe).length > 0 && (
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--line)'
                    }}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {getRecipeItems(d.recipe).slice(0, 4).map((item) => (
                          <span key={item} className="kp-mono" style={{
                            fontSize: 10, color: 'var(--text-muted)',
                            textTransform: 'uppercase', letterSpacing: '0.05em'
                          }}>· {item}</span>
                        ))}
                      </div>
                      <span style={{
                        width: 26, height: 26, borderRadius: '50%',
                        background: isHover ? 'var(--brown)' : 'var(--surface-2)',
                        border: '1px solid var(--line-strong)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, transition: 'background 200ms ease'
                      }}>+</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA strip */}
        <div style={{
          marginTop: 40, padding: '24px 28px',
          background: 'var(--surface)', border: '1px solid var(--line)',
          borderRadius: 'var(--radius)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 500 }}>Don't know what you're in the mood for?</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
              Take the 30-second mood check-in — we'll narrow 42 drinks down to your top 4.
            </div>
          </div>
          <button className="kp-btn" onClick={() => nav('/mood')}>
            Try the mood check-in
            <span className="kp-mono" style={{ fontSize: 12 }}>→</span>
          </button>
        </div>
      </div>
    </div>
  );
}