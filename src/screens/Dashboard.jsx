import React from 'react';
import { useState, useMemo, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout.jsx';
import api from '../lib/api.js';

function CategoryFilter({ value, onChange, categories }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      {categories.map((c) => {
        const active = c.id === value;
        return (
          <button key={c.id} onClick={() => onChange(c.id)} style={{
            padding: '6px 12px', borderRadius: 999, border: 'none',
            background: active ? 'rgba(107,79,58,0.18)' : 'transparent',
            boxShadow: active ? 'inset 0 0 0 1px rgba(168,131,95,0.45)' : 'none',
            fontSize: 12, color: active ? 'var(--brown-3)' : 'var(--text)', cursor: 'pointer'
          }}>{c.label}</button>
        );
      })}
    </div>
  );
}

function Dropdown({ value, onChange, options, placeholder, style, searchable = false, searchPlaceholder = 'Cari...' }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef(null);
  const selected = options.find((opt) => opt.value === value);
  const visibleOptions = searchable
    ? options.filter((opt) => opt.label.toLowerCase().includes(query.trim().toLowerCase()))
    : options;

  useEffect(() => {
    function handleOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  return (
    <div ref={containerRef} style={{ position: 'relative', ...style }}>
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        style={{
          width: '100%',
          padding: '10px 12px',
          borderRadius: 10,
          border: '1px solid var(--line-strong)',
          background: 'var(--surface)',
          color: selected ? 'var(--text)' : 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          cursor: 'pointer',
        }}
      >
        <span style={{ textAlign: 'left' }}>{selected ? selected.label : placeholder}</span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 6,
            borderRadius: 10,
            border: '1px solid var(--line-strong)',
            background: 'var(--surface)',
            maxHeight: 220,
            overflowY: 'auto',
            zIndex: 20,
            boxShadow: '0 16px 30px rgba(0,0,0,0.28)',
          }}
        >
          {searchable && (
            <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--line)' }}>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: '1px solid var(--line-strong)',
                  background: 'var(--surface)',
                  color: 'var(--text)',
                }}
              />
            </div>
          )}
          {visibleOptions.length === 0 ? (
            <div style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: 12 }}>
              Tidak ada pilihan
            </div>
          ) : (
            visibleOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 12px',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text)',
                  cursor: 'pointer',
                }}
              >
                {opt.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const loc = useLocation();
  const nav = useNavigate();

  const storedUser = (() => { try { return JSON.parse(localStorage.getItem('kupiku_user') || '{}'); } catch { return {}; } })();
  const userInitials = (storedUser?.name || 'U').split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
  const [category, setCategory] = useState('all');
  const [showAll, setShowAll] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([{ id: 'all', label: 'All' }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewDrinkOpen, setIsNewDrinkOpen] = useState(false);
  const [newDrinkName, setNewDrinkName] = useState('');
  const [newDrinkPrice, setNewDrinkPrice] = useState('');
  const [newDrinkCategoryId, setNewDrinkCategoryId] = useState('');
  const [newDrinkImage, setNewDrinkImage] = useState(null);
  const [newDrinkImagePreview, setNewDrinkImagePreview] = useState('');
  const [newDrinkDescription, setNewDrinkDescription] = useState('');
  const [newDrinkTemperature, setNewDrinkTemperature] = useState('both');
  const [newDrinkFlavorType, setNewDrinkFlavorType] = useState('');
  const [newDrinkIngredients, setNewDrinkIngredients] = useState([
    { stockId: '', amount: '' },
  ]);
  const [bahanList, setBahanList] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editMenuId, setEditMenuId] = useState('');
  const [editMenuName, setEditMenuName] = useState('');
  const [editMenuPrice, setEditMenuPrice] = useState('');
  const [editMenuTemperature, setEditMenuTemperature] = useState('both');
  const [editIngredients, setEditIngredients] = useState([{ stockId: '', amount: '' }]);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [successToast, setSuccessToast] = useState({ visible: false, message: '' });
  const [errorToast, setErrorToast] = useState({ visible: false, message: '' });
  const [priceError, setPriceError] = useState('');
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

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

  const mapMenuItems = (arr) =>
    arr.filter((item) => item && typeof item === 'object').map((item, idx) => {
      const reseps = Array.isArray(item.reseps) ? item.reseps : (Array.isArray(item.resep) ? item.resep : []);
      const categoryLabel =
        pickString(item.kategori, ['kategori', 'nama_kategori', 'namaKategori', 'nama', 'category', 'label']) ||
        pickString(item, ['kategori', 'category', 'cat', 'jenis']);
      return {
        id: item.id_menu ?? item.id ?? item.menu_id ?? idx,
        name: pickString(item, ['nama_menu', 'namaMenu', 'menu', 'name', 'nama', 'menu_name', 'menuName', 'judul', 'title']),
        price: item.harga ?? item.price ?? '',
        imageUrl: pickString(item, ['foto_menu', 'fotoMenu', 'image_url', 'imageUrl', 'gambar', 'photo']),
        temperature: item.temperature ?? 'both',
        categoryLabel,
        categoryId: String(item.id_kategori ?? item.kategori?.id_kategori ?? normalizeCategoryId(categoryLabel)),
        ingredients: reseps.map((r) => ({
          stockId: String(r.id_bahan ?? r.bahanbaku?.id_bahan ?? ''),
          amount: r.jumlah ?? '',
        })).filter((r) => r.stockId),
      };
    });

  useEffect(() => {
    // auto-scroll to maps when URL contains #maps
    if (typeof window !== 'undefined' && loc.hash === '#maps') {
      const el = document.getElementById('maps');
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    }
  }, [loc.hash]);

  useEffect(() => {
    let cancelled = false;
    async function loadMenu() {
      setLoading(true);
      setError(null);
      try {
        const data = await api.get('menu');
        if (cancelled) return;
        const arr = Array.isArray(data) ? data : (data?.data ?? []);
        const mapped = mapMenuItems(arr);

        setMenuItems(mapped);
        setCategories((prev) => {
          if (prev.length > 1) return prev;
          const uniqueLabels = [...new Set(mapped.map((m) => String(m.categoryLabel || '').trim()).filter(Boolean))];
          return [
            { id: 'all', label: 'All' },
            ...uniqueLabels.map((label) => ({ id: normalizeCategoryId(label), label })),
          ];
        });
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Failed to load menu');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadMenu();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!successToast.visible) return undefined;
    const timer = setTimeout(() => setSuccessToast({ visible: false, message: '' }), 2200);
    return () => clearTimeout(timer);
  }, [successToast.visible]);

  useEffect(() => {
    if (!errorToast.visible) return undefined;
    const timer = setTimeout(() => setErrorToast({ visible: false, message: '' }), 2500);
    return () => clearTimeout(timer);
  }, [errorToast.visible]);

  useEffect(() => {
    if (!newDrinkImage) {
      setNewDrinkImagePreview('');
      return undefined;
    }
    const nextUrl = URL.createObjectURL(newDrinkImage);
    setNewDrinkImagePreview(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [newDrinkImage]);

  useEffect(() => {
    let cancelled = false;
    async function loadBahanBaku() {
      try {
        const data = await api.get('bahanbaku');
        if (cancelled) return;
        const arr = Array.isArray(data) ? data : (data?.data ?? []);
        const mapped = arr.map((item) => ({
          id: String(item.id_bahan ?? item.id ?? ''),
          name: pickString(item, ['nama_bahan', 'namaBahan', 'nama', 'label']),
          unit: pickString(item, ['satuan_dasar', 'satuanDasar', 'unit']),
        })).filter((item) => item.id && item.name);
        setBahanList(mapped);
      } catch (err) {
        setBahanList([]);
      }
    }

    loadBahanBaku();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadCategories() {
      try {
        const data = await api.get('kategori');
        if (cancelled) return;
        const arr = Array.isArray(data) ? data : (data?.data ?? []);
        const nextCategories = [
          { id: 'all', label: 'All' },
          ...arr.map((item) => ({
            id: String(item.id_kategori ?? item.id ?? item.kategori_id ?? ''),
            label: pickString(item, ['nama_kategori', 'namaKategori', 'nama', 'label', 'kategori'])
          })).filter((c) => c.id && c.label),
        ];
        if (nextCategories.length > 1) setCategories(nextCategories);
      } catch (err) {
        // fallback to categories derived from menu
      }
    }

    loadCategories();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const keyword = String(searchTerm || '').trim().toLowerCase();
    const bySearch = keyword
      ? menuItems.filter((m) =>
          String(m.name || '').toLowerCase().includes(keyword) ||
          String(m.categoryLabel || '').toLowerCase().includes(keyword)
        )
      : menuItems;

    if (category === 'all') return bySearch;
    return bySearch.filter((m) => m.categoryId === category);
  }, [category, menuItems, searchTerm]);

  const displayed = searchTerm ? filtered : filtered.slice(0, showAll ? filtered.length : 10);

  const availableCategories = categories.filter((c) => c.id !== 'all');
  const categoryOptions = availableCategories.map((c) => ({ value: c.id, label: c.label }));
  const stockOptions = bahanList.map((item) => ({ value: item.id, label: item.name }));
  const usedStockIds = newDrinkIngredients.map((row) => row.stockId).filter(Boolean);
  const usedEditStockIds = editIngredients.map((row) => row.stockId).filter(Boolean);
  const detailPrice = detailItem?.price;
  const detailPriceLabel = typeof detailPrice === 'number' ? detailPrice.toLocaleString('id-ID') : detailPrice;

  function openNewDrinkModal() {
    setIsNewDrinkOpen(true);
    setNewDrinkName('');
    setNewDrinkPrice('');
    setNewDrinkCategoryId('');
    setNewDrinkDescription('');
    setNewDrinkTemperature('both');
    setNewDrinkFlavorType('');
    setNewDrinkImage(null);
    setNewDrinkIngredients([{ stockId: '', amount: '' }]);
    setSubmitError('');
    setPriceError('');
  }

  function closeNewDrinkModal() {
    setIsNewDrinkOpen(false);
    setSubmitError('');
    setPriceError('');
  }

  function showErrorToast(message) {
    setErrorToast({ visible: true, message });
  }

  function updateIngredient(index, field, value) {
    setNewDrinkIngredients((current) =>
      current.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  }

  function addIngredientRow() {
    setNewDrinkIngredients((current) => [...current, { stockId: '', amount: '' }]);
  }

  function removeIngredientRow(index) {
    setNewDrinkIngredients((current) => current.filter((_, i) => i !== index));
  }

  function openEditModal(item) {
    setIsEditOpen(true);
    setEditMenuId(String(item.id));
    setEditMenuName(item.name || '');
    setEditMenuPrice(item.price ?? '');
    setEditMenuTemperature(item.temperature || 'both');
    setEditIngredients(item.ingredients?.length ? item.ingredients : [{ stockId: '', amount: '' }]);
    setEditError('');
  }

  function openDetailModal(item) {
    setIsDetailOpen(true);
    setDetailItem(item || null);
  }

  function closeEditModal() {
    setIsEditOpen(false);
    setEditMenuId('');
    setEditMenuName('');
    setEditMenuPrice('');
    setEditMenuTemperature('both');
    setEditIngredients([{ stockId: '', amount: '' }]);
    setEditError('');
  }

  function closeDetailModal() {
    setIsDetailOpen(false);
    setDetailItem(null);
  }

  function openDeleteModal(item) {
    setDeleteTarget(item || null);
    setIsDeleteOpen(true);
  }

  function closeDeleteModal() {
    setIsDeleteOpen(false);
    setDeleteTarget(null);
  }

  function updateEditIngredient(index, field, value) {
    setEditIngredients((current) =>
      current.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  }

  function addEditIngredientRow() {
    setEditIngredients((current) => [...current, { stockId: '', amount: '' }]);
  }

  function removeEditIngredientRow(index) {
    setEditIngredients((current) => current.filter((_, i) => i !== index));
  }

  async function handleCreateMenu(e) {
    e.preventDefault();
    if (isSaving) return;
    setSubmitError('');
    const trimmedName = newDrinkName.trim();
    if (!trimmedName) {
      alert('Nama menu wajib diisi.');
      return;
    }

    const isDuplicate = menuItems.some(
      (item) => item.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (isDuplicate) {
      showErrorToast('Gagal Menambah Menu Karena Ditemukan Nama Menu Serupa');
      return;
    }

    if (!newDrinkCategoryId) {
      alert('Kategori wajib dipilih.');
      return;
    }

    const rawPrice = parseFloat(newDrinkPrice);
    if (!String(newDrinkPrice).trim() || isNaN(rawPrice)) {
      setPriceError('Harga wajib diisi.');
      showErrorToast('Gagal Menambah Menu');
      return;
    }
    if (rawPrice <= 0) {
      setPriceError('Harga Yang Dimasukkan harus lebih dari 0!');
      showErrorToast('Gagal Menambah Menu');
      return;
    }
    setPriceError('');
    const parsedPrice = Math.round(rawPrice);

    const bahanPayload = newDrinkIngredients
      .filter((row) => row.stockId && row.amount)
      .map((row) => ({
        id_bahan: row.stockId,
        jumlah: Number(String(row.amount).replace(/[^0-9.]/g, '')),
      }))
      .filter((row) => row.id_bahan && row.jumlah);

    if (bahanPayload.length === 0) {
      showErrorToast('Gagal Menambah Menu, Belum ada bahan baku yang ditambahkan');
      return;
    }

    try {
      setIsSaving(true);
      const formData = new FormData();
      formData.append('nama_menu', trimmedName);
      formData.append('harga', String(parsedPrice));
      if (newDrinkCategoryId) {
        formData.append('id_kategori', String(Number(newDrinkCategoryId)));
      }
      if (newDrinkDescription.trim()) {
        formData.append('deskripsi', newDrinkDescription.trim());
      }
      formData.append('temperature', newDrinkTemperature || 'both');
      if (newDrinkFlavorType) {
        formData.append('flavor_type_menu', newDrinkFlavorType);
      }
      bahanPayload.forEach((row, index) => {
        formData.append(`bahan[${index}][id_bahan]`, String(row.id_bahan));
        formData.append(`bahan[${index}][jumlah]`, String(row.jumlah));
      });
      if (newDrinkImage) {
        formData.append('foto_menu', newDrinkImage);
      }

      const created = await api.post('menu', formData);
      const mapped = mapMenuItems([created])[0];
      setMenuItems((current) => [mapped, ...current]);
      setSuccessToast({ visible: true, message: 'Menu baru berhasil ditambahkan.' });
      closeNewDrinkModal();
    } catch (err) {
      const message = (err && err.message) || 'Gagal menambahkan menu.';
      setSubmitError(message);
      showErrorToast(message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpdateMenu(e) {
    e.preventDefault();
    if (editSaving) return;
    setEditError('');

    const parsedPrice = Number(String(editMenuPrice).replace(/[^0-9.]/g, ''));
    if (!parsedPrice) {
      alert('Harga wajib diisi.');
      return;
    }

    const bahanPayload = editIngredients
      .filter((row) => row.stockId && row.amount)
      .map((row) => ({
        id_bahan: row.stockId,
        jumlah: Number(String(row.amount).replace(/[^0-9.]/g, '')),
      }))
      .filter((row) => row.id_bahan && row.jumlah);

    try {
      setEditSaving(true);
      const payload = {
        harga: parsedPrice,
        temperature: editMenuTemperature || 'both',
        bahan: bahanPayload,
      };
      const updated = await api.put(`menu/${editMenuId}`, payload);
      const mapped = mapMenuItems([updated])[0];
      setMenuItems((current) => current.map((item) => (String(item.id) === String(editMenuId) ? mapped : item)));
      setSuccessToast({ visible: true, message: 'Berhasil update menu.' });
      closeEditModal();
    } catch (err) {
      const message = (err && err.message) || 'Gagal memperbarui menu.';
      setEditError(message);
      alert(message);
    } finally {
      setEditSaving(false);
    }
  }

  async function handleDelete(itemId) {
    try {
      await api.del(`menu/${itemId}`);
      setMenuItems((current) => current.filter((item) => item.id !== itemId));
      setSuccessToast({ visible: true, message: 'Berhasil delete menu.' });
      closeDeleteModal();
    } catch (err) {
      alert((err && err.message) || 'Failed to delete menu');
    }
  }

  return (
    <AdminLayout>
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <div style={{
          padding: '18px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid var(--line)'
        }}>
          <div>
            <div className="kp-eyebrow" style={{ fontSize: 10 }}>Workspace · Menu</div>
            <h1 style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.015em', margin: '4px 0 0' }}>Menu management</h1>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8,
              background: 'var(--surface)', border: '1px solid var(--line)', width: 260
            }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="6" cy="6" r="4" stroke="var(--text-muted)" strokeWidth="1.4" />
                <path d="M9 9l3 3" stroke="var(--text-muted)" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search menu..."
                style={{
                  fontSize: 13,
                  color: 'var(--text)',
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontFamily: 'var(--font-sans)'
                }}
              />
              <span className="kp-mono" style={{ fontSize: 10, color: 'var(--text-dim)', border: '1px solid var(--line-strong)', padding: '1px 5px', borderRadius: 4 }}>⌘K</span>
            </div>
            {/* <button className="kp-btn kp-btn-sm kp-btn-ghost">Export CSV</button> */}
            <button className="kp-btn kp-btn-sm" onClick={openNewDrinkModal}>+ New drink</button>
            <div
              onClick={() => nav('/admin/profile')}
              title="Profil saya"
              style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'linear-gradient(135deg, #6B4F3A, #2B2010)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 600, marginLeft: 8, cursor: 'pointer',
              }}
            >{userInitials}</div>
          </div>
        </div>

        <div style={{ flex: 1, padding: '24px 32px', overflow: 'auto' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14,
            padding: '8px 14px', borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.14)',
            background: 'rgba(255,255,255,0.025)',
          }}>
            <span className="kp-eyebrow" style={{ fontSize: 10, marginRight: 4 }}>FILTER</span>
            <CategoryFilter value={category} onChange={setCategory} categories={categories} />
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {loading ? 'Loading menu...' : (error ? 'Gagal memuat menu' : `${menuItems.length} menu`)}
            </span>
          </div>

          <div className="kp-card" style={{ overflow: 'hidden' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '110px 1.6fr 1fr 0.8fr 180px',
              padding: '14px 18px', borderBottom: '1px solid var(--line)',
              fontSize: 11, fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase', letterSpacing: '0.08em',
              color: 'var(--text)', background: 'rgba(255,255,255,0.025)'
            }}>
              <span>ID</span><span>Drink</span><span>Category</span><span>Price</span><span>Action</span>
            </div>

            {!loading && !error && displayed.length === 0 && (
              <div style={{ padding: 18, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                Data Tidak Ditemukan
              </div>
            )}

            {displayed.map((item, i) => {
              const priceLabel = typeof item.price === 'number' ? item.price.toLocaleString('id-ID') : item.price;
              return (
                <div key={item.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '110px 1.6fr 1fr 0.8fr 180px',
                  padding: '14px 18px',
                  borderBottom: i < displayed.length - 1 ? '1px solid var(--line)' : 'none',
                  fontSize: 13, alignItems: 'center'
                }}>
                  <span className="kp-mono" style={{ fontSize: 11, color: 'var(--text)' }}>{item.id}</span>
                  <span style={{ fontWeight: 500 }}>{item.name}</span>
                  <span>{item.categoryLabel || '-'}</span>
                  <span className="kp-mono" style={{ fontSize: 12 }}>Rp {priceLabel}</span>
                  <span>
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                      <button
                        className="kp-btn kp-btn-ghost"
                        style={{ padding: '4px 10px', fontSize: 12 }}
                        onClick={() => openDetailModal(item)}
                      >
                        Detail
                      </button>
                      <button
                        className="kp-btn kp-btn-ghost"
                        style={{ padding: '4px 10px', fontSize: 12 }}
                        onClick={() => openEditModal(item)}
                      >
                        Update
                      </button>
                      <button
                        className="kp-btn kp-btn-danger"
                        style={{ padding: '4px 10px', fontSize: 12 }}
                        onClick={() => openDeleteModal(item)}
                      >
                        Delete
                      </button>
                    </div>
                  </span>
                </div>
              );
            })}

            {filtered.length > 10 && (
              <div style={{ padding: 14, display: 'flex', justifyContent: 'center' }}>
                <button className="kp-btn kp-btn-ghost kp-btn-sm" onClick={() => setShowAll((s) => !s)}>{showAll ? 'Show less' : `Show ${filtered.length - 10} more`}</button>
              </div>
            )}
          </div>
        </div>
      </main>

      <div
        style={{
          position: 'fixed',
          top: 18,
          right: 18,
          zIndex: 60,
          pointerEvents: 'none',
          opacity: successToast.visible ? 1 : 0,
          transform: successToast.visible ? 'translateY(0)' : 'translateY(-10px)',
          transition: 'opacity 180ms ease, transform 180ms ease',
        }}
      >
        <div
          style={{
            minWidth: 280,
            maxWidth: 360,
            padding: '12px 14px',
            borderRadius: 12,
            background: 'linear-gradient(135deg, rgba(107,79,58,0.95), rgba(43,32,16,0.96))',
            border: '1px solid rgba(255,255,255,0.16)',
            boxShadow: '0 18px 40px rgba(0,0,0,0.35)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            color: '#F6F2EE',
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
            }}
          >
            ✓
          </div>
          <div>
            <div className="kp-mono" style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.8 }}>
              Success
            </div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{successToast.message}</div>
          </div>
        </div>
      </div>

      <div
        style={{
          position: 'fixed',
          top: 18,
          right: 18,
          zIndex: 60,
          pointerEvents: 'none',
          opacity: errorToast.visible ? 1 : 0,
          transform: errorToast.visible ? 'translateY(0)' : 'translateY(-10px)',
          transition: 'opacity 180ms ease, transform 180ms ease',
        }}
      >
        <div
          style={{
            minWidth: 280,
            maxWidth: 360,
            padding: '12px 14px',
            borderRadius: 12,
            background: 'linear-gradient(135deg, rgba(180,40,40,0.96), rgba(90,10,10,0.97))',
            border: '1px solid rgba(255,150,150,0.2)',
            boxShadow: '0 18px 40px rgba(0,0,0,0.35)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            color: '#F6F2EE',
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
            }}
          >
            ✕
          </div>
          <div>
            <div className="kp-mono" style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.8 }}>
              Gagal
            </div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{errorToast.message}</div>
          </div>
        </div>
      </div>

      {isNewDrinkOpen && (
        <div
          role="presentation"
          onClick={closeNewDrinkModal}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(8,10,12,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: 16,
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(640px, 100%)',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: 14,
              boxShadow: '0 30px 60px rgba(0,0,0,0.4)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '22px 22px 18px', borderBottom: '1px solid var(--line)', flexShrink: 0 }}>
              <div>
                <div className="kp-eyebrow" style={{ fontSize: 10 }}>Menu · New Drink</div>
                <h2 style={{ margin: '6px 0 0', fontSize: 18 }}>Tambah menu baru</h2>
              </div>
              <button className="kp-btn kp-btn-ghost" onClick={closeNewDrinkModal}>Tutup</button>
            </div>

            <form onSubmit={handleCreateMenu} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <div style={{ overflowY: 'auto', flex: 1, padding: '18px 22px', display: 'grid', gap: 14 }}>
                <div style={{ display: 'grid', gap: 6 }}>
                  <label className="kp-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>Nama menu</label>
                  <input
                    value={newDrinkName}
                    onChange={(e) => setNewDrinkName(e.target.value)}
                    placeholder="Contoh: Es Kopi Susu"
                    style={{
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1px solid var(--line-strong)',
                      background: 'var(--surface)',
                      color: 'var(--text)',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gap: 6 }}>
                  <label className="kp-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>Harga</label>
                  <input
                    value={newDrinkPrice.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '');
                      setNewDrinkPrice(digits);
                      if (priceError) setPriceError('');
                    }}
                    placeholder="Contoh: 18.000"
                    inputMode="numeric"
                    style={{
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: priceError ? '1px solid #e53e3e' : '1px solid var(--line-strong)',
                      background: 'var(--surface)',
                      color: 'var(--text)',
                    }}
                  />
                  {priceError && (
                    <span style={{ fontSize: 12, color: '#e53e3e', marginTop: 2 }}>{priceError}</span>
                  )}
                </div>

                <div style={{ display: 'grid', gap: 6 }}>
                  <label className="kp-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>Kategori</label>
                  <Dropdown
                    value={newDrinkCategoryId}
                    onChange={setNewDrinkCategoryId}
                    options={categoryOptions}
                    placeholder="Pilih kategori"
                  />
                </div>

                <div style={{ display: 'grid', gap: 6 }}>
                  <label className="kp-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Deskripsi <span style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-sans)', textTransform: 'none', letterSpacing: 0 }}>(opsional)</span>
                  </label>
                  <textarea
                    value={newDrinkDescription}
                    onChange={(e) => setNewDrinkDescription(e.target.value)}
                    placeholder="Deskripsi singkat menu..."
                    rows={3}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1px solid var(--line-strong)',
                      background: 'var(--surface)',
                      color: 'var(--text)',
                      resize: 'vertical',
                      fontFamily: 'var(--font-sans)',
                      fontSize: 14,
                      lineHeight: 1.5,
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div style={{ display: 'grid', gap: 6 }}>
                    <label className="kp-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>Temperature</label>
                    <Dropdown
                      value={newDrinkTemperature}
                      onChange={setNewDrinkTemperature}
                      options={[
                        { value: 'hot', label: 'Hot' },
                        { value: 'ice', label: 'Ice' },
                        { value: 'both', label: 'Hot & Ice' },
                      ]}
                      placeholder="Pilih temperature"
                    />
                  </div>
                  <div style={{ display: 'grid', gap: 6 }}>
                    <label className="kp-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>Flavor type</label>
                    <Dropdown
                      value={newDrinkFlavorType}
                      onChange={setNewDrinkFlavorType}
                      options={[
                        { value: 'sweet', label: 'Sweet' },
                        { value: 'bitter', label: 'Bitter' },
                        { value: 'sour', label: 'Sour' },
                        { value: 'balanced', label: 'Balanced' },
                      ]}
                      placeholder="Pilih flavor type"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gap: 8 }}>
                  <label className="kp-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>Foto menu</label>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={(e) => setNewDrinkImage(e.target.files?.[0] || null)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 10,
                      border: '1px solid var(--line-strong)',
                      background: 'var(--surface)',
                      color: 'var(--text)',
                    }}
                  />
                  {newDrinkImagePreview && (
                    <img
                      src={newDrinkImagePreview}
                      alt="Preview"
                      style={{
                        width: '100%',
                        maxHeight: 180,
                        objectFit: 'cover',
                        borderRadius: 12,
                        border: '1px solid var(--line)',
                      }}
                    />
                  )}
                </div>

                <div style={{ display: 'grid', gap: 10 }}>
                  <div className="kp-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>Bahan baku</div>
                  {newDrinkIngredients.map((row, index) => {
                    const selected = bahanList.find((s) => s.id === row.stockId);
                    const rowOptions = stockOptions.filter(
                      (opt) => !usedStockIds.includes(opt.value) || opt.value === row.stockId
                    );
                    return (
                      <div key={`${row.stockId}-${index}`} style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.6fr auto', gap: 10, alignItems: 'center' }}>
                        <Dropdown
                          value={row.stockId}
                          onChange={(value) => updateIngredient(index, 'stockId', value)}
                          options={rowOptions}
                          searchable
                          searchPlaceholder="Cari bahan..."
                          placeholder="Pilih bahan"
                        />
                        <input
                          value={row.amount}
                          onChange={(e) => updateIngredient(index, 'amount', e.target.value)}
                          placeholder={`Jumlah${selected?.unit ? ` (${selected.unit})` : ''}`}
                          inputMode="decimal"
                          style={{
                            padding: '10px 12px',
                            borderRadius: 10,
                            border: '1px solid var(--line-strong)',
                            background: 'var(--surface)',
                            color: 'var(--text)',
                          }}
                        />
                        <div>
                          {newDrinkIngredients.length > 1 && (
                            <button
                              type="button"
                              className="kp-btn kp-btn-ghost"
                              onClick={() => removeIngredientRow(index)}
                            >
                              Hapus
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <button type="button" className="kp-btn kp-btn-ghost" onClick={addIngredientRow}>
                    + Tambah bahan baku
                  </button>
                </div>
              </div>

              <div style={{ padding: '14px 22px 22px', borderTop: '1px solid var(--line)', flexShrink: 0 }}>
                {submitError && (
                  <div style={{ marginBottom: 10, color: 'var(--bad)', fontSize: 12 }}>
                    {submitError}
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button type="button" className="kp-btn kp-btn-ghost" onClick={closeNewDrinkModal}>Batal</button>
                  <button type="submit" className="kp-btn" disabled={isSaving}>
                    {isSaving ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditOpen && (
        <div
          role="presentation"
          onClick={closeEditModal}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(8,10,12,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: 16,
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(640px, 100%)',
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: 14,
              padding: 22,
              boxShadow: '0 30px 60px rgba(0,0,0,0.4)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
              <div>
                <div className="kp-eyebrow" style={{ fontSize: 10 }}>Menu · Update</div>
                <h2 style={{ margin: '6px 0 0', fontSize: 18 }}>Perbarui menu</h2>
              </div>
              <button className="kp-btn kp-btn-ghost" onClick={closeEditModal}>Tutup</button>
            </div>

            <form onSubmit={handleUpdateMenu}>
              <div style={{ display: 'grid', gap: 14 }}>
                <div style={{ display: 'grid', gap: 6 }}>
                  <label className="kp-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>Nama menu</label>
                  <input
                    value={editMenuName}
                    readOnly
                    placeholder="Contoh: Es Kopi Susu"
                    style={{
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1px solid var(--line-strong)',
                      background: 'var(--surface)',
                      color: 'var(--text)',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gap: 6 }}>
                  <label className="kp-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>Harga</label>
                  <input
                    value={editMenuPrice}
                    onChange={(e) => setEditMenuPrice(e.target.value)}
                    placeholder="Contoh: 18000"
                    inputMode="numeric"
                    style={{
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1px solid var(--line-strong)',
                      background: 'var(--surface)',
                      color: 'var(--text)',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gap: 6 }}>
                  <label className="kp-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>Temperature</label>
                  <Dropdown
                    value={editMenuTemperature}
                    onChange={setEditMenuTemperature}
                    options={[
                      { value: 'hot', label: 'Hot' },
                      { value: 'ice', label: 'Ice' },
                      { value: 'both', label: 'Hot & Ice' },
                    ]}
                    placeholder="Pilih temperature"
                  />
                </div>

                <div style={{ display: 'grid', gap: 10 }}>
                  <div className="kp-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>Resep (bahan baku)</div>
                  {editIngredients.map((row, index) => {
                    const selected = bahanList.find((s) => s.id === row.stockId);
                    const rowOptions = stockOptions.filter(
                      (opt) => !usedEditStockIds.includes(opt.value) || opt.value === row.stockId
                    );
                    return (
                      <div key={`${row.stockId}-${index}`} style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.6fr auto', gap: 10, alignItems: 'center' }}>
                        <Dropdown
                          value={row.stockId}
                          onChange={(value) => updateEditIngredient(index, 'stockId', value)}
                          options={rowOptions}
                          searchable
                          searchPlaceholder="Cari bahan..."
                          placeholder="Pilih bahan"
                        />
                        <input
                          value={row.amount}
                          onChange={(e) => updateEditIngredient(index, 'amount', e.target.value)}
                          placeholder={`Jumlah${selected?.unit ? ` (${selected.unit})` : ''}`}
                          inputMode="decimal"
                          style={{
                            padding: '10px 12px',
                            borderRadius: 10,
                            border: '1px solid var(--line-strong)',
                            background: 'var(--surface)',
                            color: 'var(--text)',
                          }}
                        />
                        <div>
                          {editIngredients.length > 1 && (
                            <button
                              type="button"
                              className="kp-btn kp-btn-ghost"
                              onClick={() => removeEditIngredientRow(index)}
                            >
                              Hapus
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <button type="button" className="kp-btn kp-btn-ghost" onClick={addEditIngredientRow}>
                    + Tambah bahan baku
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button type="button" className="kp-btn kp-btn-ghost" onClick={closeEditModal}>Batal</button>
                <button type="submit" className="kp-btn" disabled={editSaving}>
                  {editSaving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
              {editError && (
                <div style={{ marginTop: 10, color: 'var(--bad)', fontSize: 12 }}>
                  {editError}
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {isDetailOpen && (
        <div
          role="presentation"
          onClick={closeDetailModal}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(8,10,12,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: 16,
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(520px, 100%)',
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: 14,
              padding: 22,
              boxShadow: '0 30px 60px rgba(0,0,0,0.4)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
              <div>
                <div className="kp-eyebrow" style={{ fontSize: 10 }}>Menu · Detail</div>
                <h2 style={{ margin: '6px 0 0', fontSize: 18 }}>{detailItem?.name || '-'}</h2>
              </div>
              <button className="kp-btn kp-btn-ghost" onClick={closeDetailModal}>Tutup</button>
            </div>

            <div style={{ display: 'grid', gap: 10 }}>
              <div style={{ display: 'grid', gap: 8 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 10, fontSize: 13 }}>
                  <span className="kp-mono" style={{ color: 'var(--text-muted)', fontSize: 11 }}>ID Menu</span>
                  <span className="kp-mono" style={{ fontSize: 12 }}>{detailItem?.id ?? '-'}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 10, fontSize: 13 }}>
                  <span className="kp-mono" style={{ color: 'var(--text-muted)', fontSize: 11 }}>Kategori</span>
                  <span>{detailItem?.categoryLabel || '-'}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 10, fontSize: 13 }}>
                  <span className="kp-mono" style={{ color: 'var(--text-muted)', fontSize: 11 }}>Harga</span>
                  <span className="kp-mono" style={{ fontSize: 12 }}>{detailPriceLabel ? `Rp ${detailPriceLabel}` : '-'}</span>
                </div>
              </div>

              <div className="kp-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Resep (bahan baku)
              </div>
              {detailItem?.ingredients?.length ? (
                <div style={{ display: 'grid', gap: 8 }}>
                  {detailItem.ingredients.map((row, index) => {
                    const selected = bahanList.find((s) => s.id === row.stockId);
                    const name = selected?.name || `Bahan ${row.stockId || '-'}`;
                    const unit = selected?.unit ? ` ${selected.unit}` : '';
                    const amount = row.amount ? `${row.amount}${unit}` : '-';
                    return (
                      <div
                        key={`${row.stockId}-${index}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 12px',
                          borderRadius: 10,
                          border: '1px solid var(--line)'
                        }}
                      >
                        <span style={{ fontWeight: 500 }}>{name}</span>
                        <span className="kp-mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>{amount}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  Belum ada resep.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isDeleteOpen && (
        <div
          role="presentation"
          onClick={closeDeleteModal}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(8,10,12,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 55,
            padding: 16,
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(520px, 100%)',
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: 16,
              padding: 22,
              boxShadow: '0 30px 60px rgba(0,0,0,0.45)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <div className="kp-eyebrow" style={{ fontSize: 10 }}>Konfirmasi</div>
                <h2 style={{ margin: '6px 0 0', fontSize: 18 }}>Hapus menu?</h2>
              </div>
              <button className="kp-btn kp-btn-ghost" onClick={closeDeleteModal}>Tutup</button>
            </div>

            <div style={{ display: 'grid', gap: 10, fontSize: 13 }}>
              <div>
                Kamu akan menghapus menu{' '}
                <span style={{ color: 'var(--text)', fontWeight: 500 }}>
                  {deleteTarget?.name || '-'}
                </span>{' '}
                beserta resepnya. Aksi ini tidak bisa dibatalkan.
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '120px 1fr',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid var(--line)',
                }}
              >
                <span className="kp-mono" style={{ fontSize: 11 }}>ID Menu</span>
                <span className="kp-mono" style={{ fontSize: 12 }}>{deleteTarget?.id ?? '-'}</span>
                <span className="kp-mono" style={{ fontSize: 11 }}>Kategori</span>
                <span>{deleteTarget?.categoryLabel || '-'}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
              <button className="kp-btn kp-btn-ghost" onClick={closeDeleteModal}>Batal</button>
              <button
                className="kp-btn kp-btn-danger"
                onClick={() => handleDelete(deleteTarget?.id)}
              >
                Hapus menu
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
