import React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api.js';
import PublicNavbar from '../components/PublicNavbar.jsx';
import CustomizationModal from '../components/CustomizationModal.jsx';
import CartDrawer from '../components/CartDrawer.jsx';
import { useCart } from '../context/CartContext.jsx';

export default function Menu() {
  const nav = useNavigate();
  const { items: cartItems, addToCart } = useCart();

  const [filter, setFilter] = useState('all');
  const [hovered, setHovered] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([{ id: 'all', label: 'All' }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [customizationItem, setCustomizationItem] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [imgLoaded, setImgLoaded] = useState({});

  const cartCount = cartItems.length;

  function getUser() {
    try { return JSON.parse(localStorage.getItem('kupiku_user') || ''); } catch { return null; }
  }

  function handleAddClick(item) {
    if (!getUser()) {
      nav('/login', { state: { next: '/menu' } });
      return;
    }
    setCustomizationItem(item);
  }

  const normalizeCategoryId = (value) =>
    String(value || '').trim().toLowerCase().replace(/\s+/g, '-');

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
            foto: item.foto_menu || null,
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
    return String(value || '').split(',').map((item) => item.trim()).filter(Boolean);
  };

  return (
    <div className="kp" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <PublicNavbar
        active="menu"
        onMoodClick={() => nav('/mood')}
        onLocationsClick={() => nav('/#maps')}
        onAdminClick={() => nav('/login')}
        onOrderClick={() => {
          if (getUser()) setCartOpen(true);
          else nav('/login', { state: { next: '/menu' } });
        }}
      />

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
      <div style={{ padding: '0 56px 120px' }}>
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
                {d.foto ? (
                  <div style={{ position: 'relative', aspectRatio: '4 / 3', background: 'var(--surface)', overflow: 'hidden' }}>
                    {!imgLoaded[d.id] && (
                      <div style={{
                        position: 'absolute', inset: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%',
                          border: '2px solid var(--line)',
                          borderTopColor: 'var(--brown-3)',
                          animation: 'kp-spin 0.7s linear infinite'
                        }} />
                      </div>
                    )}
                    <img
                      src={d.foto}
                      alt={d.name}
                      onLoad={() => setImgLoaded(prev => ({ ...prev, [d.id]: true }))}
                      onError={() => setImgLoaded(prev => ({ ...prev, [d.id]: true }))}
                      style={{
                        width: '100%', height: '100%',
                        objectFit: 'cover', objectPosition: 'center',
                        display: 'block',
                        opacity: imgLoaded[d.id] ? 1 : 0,
                        filter: isHover ? 'brightness(1.1)' : 'none',
                        transition: 'opacity 300ms ease, filter 220ms ease'
                      }}
                    />
                  </div>
                ) : (
                  <div className="kp-img-placeholder" data-label={`DRINK · ${d.name.toUpperCase()}`} style={{
                    borderRadius: 0, aspectRatio: '4 / 3',
                    filter: isHover ? 'brightness(1.1)' : 'none',
                    transition: 'filter 220ms ease'
                  }} />
                )}
                <div style={{ padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
                    <h4 style={{ fontSize: 18, margin: 0, fontWeight: 500, letterSpacing: '-0.01em' }}>{d.name}</h4>
                    <span className="kp-mono" style={{ fontSize: 13, color: 'var(--text)', whiteSpace: 'nowrap' }}>Rp {formatPrice(d.price)}</span>
                  </div>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--line)'
                  }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {getRecipeItems(d.recipe).slice(0, 3).map((item) => (
                        <span key={item} className="kp-mono" style={{
                          fontSize: 10, color: 'var(--text-muted)',
                          textTransform: 'uppercase', letterSpacing: '0.05em'
                        }}>· {item}</span>
                      ))}
                    </div>
                    {/* Add to cart button */}
                    <button
                      onClick={() => handleAddClick(d)}
                      title="Tambah ke cart"
                      style={{
                        width: 30, height: 30, borderRadius: '50%',
                        background: isHover ? 'var(--brown)' : 'var(--surface-2)',
                        border: '1px solid ' + (isHover ? 'rgba(168,131,95,0.4)' : 'var(--line-strong)'),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 16, color: isHover ? 'var(--text)' : 'var(--text-muted)',
                        cursor: 'pointer', transition: 'all 200ms ease',
                        flexShrink: 0,
                      }}
                    >+</button>
                  </div>
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

      {/* Floating cart button */}
      {cartCount > 0 && (
        <button
          onClick={() => {
            if (getUser()) setCartOpen(true);
            else nav('/login', { state: { next: '/menu' } });
          }}
          style={{
            position: 'fixed', bottom: 32, right: 32, zIndex: 40,
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '14px 22px', borderRadius: 999,
            background: 'var(--brown)', border: '1px solid rgba(168,131,95,0.3)',
            color: 'var(--text)', cursor: 'pointer',
            boxShadow: 'var(--shadow-lg)',
            fontSize: 14, fontFamily: 'var(--font-sans)', fontWeight: 500,
            transition: 'all 180ms ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--brown-2)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--brown)'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <span>Cart</span>
          <span style={{
            minWidth: 22, height: 22, borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
          }}>
            {cartCount}
          </span>
        </button>
      )}

      {/* Customization modal */}
      {customizationItem && (
        <CustomizationModal
          item={customizationItem}
          onClose={() => setCustomizationItem(null)}
          onAdd={(item, customization) => {
            addToCart(item, customization);
            setCustomizationItem(null);
            setCartOpen(true);
          }}
        />
      )}

      {/* Cart drawer */}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
