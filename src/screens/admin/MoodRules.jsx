import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout.jsx';
import api from '../../lib/api.js';
import { useToast } from '../../components/Toast.jsx';

const FLAVOR_LABEL = { sweet: 'Sweet (Manis)', bitter: 'Bitter (Pahit)', sour: 'Sour (Asam)', balanced: 'Balanced' };

const QUICK_EMOJIS = ['😊', '😢', '😌', '😰', '😐', '😠', '🤩', '😴', '🥳', '😤', '😔', '🤔'];

function FlavorBadge({ value }) {
  if (!value) return <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>;
  return <span style={{ fontSize: 12, color: '#fff', fontFamily: 'var(--font-mono)' }}>{value}</span>;
}

const EMPTY_FORM = { mood: '', emoji: '', preferred_flavor_1: '', preferred_flavor_2: '', preferred_flavor_3: '' };

export default function MoodRules() {
  const toast = useToast();
  const token = localStorage.getItem('kupiku_token');
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

  const [rules, setRules]       = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [flavorTypes, setFlavorTypes] = useState([]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editId, setEditId]         = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [formError, setFormError]   = useState('');
  const [isSaving, setIsSaving]     = useState(false);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [successToast, setSuccessToast] = useState({ visible: false, message: '' });

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    Promise.all([
      api.get('mood-rules'),
      api.get('flavor-types'),
    ])
      .then(([rulesData, flavorsData]) => {
        if (!mounted) return;
        setRules(Array.isArray(rulesData) ? rulesData : (rulesData?.data ?? []));
        setFlavorTypes(Array.isArray(flavorsData) ? flavorsData : []);
      })
      .catch((err) => { if (mounted) setError(err?.message || 'Gagal memuat data'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!successToast.visible) return undefined;
    const t = setTimeout(() => setSuccessToast({ visible: false, message: '' }), 2200);
    return () => clearTimeout(t);
  }, [successToast.visible]);

  function showSuccess(msg) { setSuccessToast({ visible: true, message: msg }); }

  function openCreate() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setIsFormOpen(true);
  }

  function openEdit(rule) {
    setEditId(rule.id_rule);
    setForm({
      mood: rule.mood || '',
      emoji: rule.emoji || '',
      preferred_flavor_1: rule.preferred_flavor_1 || '',
      preferred_flavor_2: rule.preferred_flavor_2 || '',
      preferred_flavor_3: rule.preferred_flavor_3 || '',
    });
    setFormError('');
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditId(null);
    setForm(EMPTY_FORM);
    setFormError('');
  }

  function setField(key, val) { setForm((f) => ({ ...f, [key]: val })); }

  async function handleSave(e) {
    e.preventDefault();
    if (isSaving) return;
    const moodTrimmed = form.mood.trim();
    if (!moodTrimmed) { setFormError('Nama mood wajib diisi.'); return; }
    const payload = {
      mood: moodTrimmed,
      emoji: form.emoji.trim() || null,
      preferred_flavor_1: form.preferred_flavor_1 || null,
      preferred_flavor_2: form.preferred_flavor_2 || null,
      preferred_flavor_3: form.preferred_flavor_3 || null,
    };
    try {
      setIsSaving(true);
      if (editId) {
        const updated = await api.put(`mood-rules/${editId}`, payload, { headers: authHeader });
        setRules((curr) => curr.map((r) => (String(r.id_rule) === String(editId) ? updated : r)));
        showSuccess('Mood rule berhasil diperbarui.');
      } else {
        const created = await api.post('mood-rules', payload, { headers: authHeader });
        setRules((curr) => [...curr, created]);
        showSuccess('Mood rule berhasil ditambahkan.');
      }
      closeForm();
    } catch (err) {
      const validationErrors = err?.data?.errors;
      const msg = validationErrors
        ? Object.values(validationErrors).flat().join(' ')
        : err?.message || 'Gagal menyimpan.';
      setFormError(msg);
    } finally {
      setIsSaving(false);
    }
  }

  function openDelete(rule) { setDeleteTarget(rule); setIsDeleteOpen(true); }
  function closeDelete() { setDeleteTarget(null); setIsDeleteOpen(false); }

  async function handleDelete() {
    if (!deleteTarget?.id_rule) return;
    try {
      await api.del(`mood-rules/${deleteTarget.id_rule}`, { headers: authHeader });
      setRules((curr) => curr.filter((r) => String(r.id_rule) !== String(deleteTarget.id_rule)));
      closeDelete();
      showSuccess('Mood rule berhasil dihapus.');
    } catch (err) {
      closeDelete();
      toast(err?.message || 'Gagal menghapus mood rule.', 'error');
    }
  }

  return (
    <AdminLayout>
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Header */}
        <div style={{ padding: '18px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line)' }}>
          <div>
            <div className="kp-eyebrow" style={{ fontSize: 10 }}>Workspace · Rekomendasi</div>
            <h1 style={{ fontSize: 20, margin: '4px 0 0' }}>Mood Rules</h1>
          </div>
          <button className="kp-btn" onClick={openCreate}>+ New rule</button>
        </div>

        {/* Info strip */}
        <div style={{ padding: '10px 32px', borderBottom: '1px solid var(--line)', background: 'rgba(107,79,58,0.06)', fontSize: 12, color: 'var(--text-muted)' }}>
          Mood rule menentukan bobot preferensi rasa pada sistem rekomendasi. Flavor 1 mendapat bobot +3, Flavor 2 bobot +2, Flavor 3 bobot +1.
        </div>

        {/* Table */}
        <div style={{ flex: 1, padding: '24px 32px', overflow: 'auto' }}>
          <div className="kp-card" style={{ overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '60px 160px 1fr 1fr 1fr 160px', padding: '12px 18px', borderBottom: '1px solid var(--line)', fontSize: 11, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text)', background: 'rgba(255,255,255,0.025)' }}>
              <span>Emoji</span>
              <span>Mood</span>
              <span>Flavor 1 (+3)</span>
              <span>Flavor 2 (+2)</span>
              <span>Flavor 3 (+1)</span>
              <span>Action</span>
            </div>

            {loading && (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Loading...</div>
            )}
            {!loading && error && (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--bad)', fontSize: 13 }}>{error}</div>
            )}
            {!loading && !error && rules.length === 0 && (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Belum ada mood rule. Klik "+ New rule" untuk menambahkan.</div>
            )}

            {!loading && !error && rules.map((rule, i) => (
              <div
                key={rule.id_rule}
                style={{ display: 'grid', gridTemplateColumns: '60px 160px 1fr 1fr 1fr 160px', padding: '13px 18px', borderBottom: i < rules.length - 1 ? '1px solid var(--line)' : 'none', fontSize: 13, alignItems: 'center' }}
              >
                <span style={{ fontSize: 22 }}>{rule.emoji || '—'}</span>
                <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{rule.mood}</span>
                <span><FlavorBadge value={rule.preferred_flavor_1} /></span>
                <span><FlavorBadge value={rule.preferred_flavor_2} /></span>
                <span><FlavorBadge value={rule.preferred_flavor_3} /></span>
                <span>
                  <div style={{ display: 'inline-flex', gap: 6 }}>
                    <button className="kp-btn kp-btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => openEdit(rule)}>Edit</button>
                    <button className="kp-btn kp-btn-danger" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => openDelete(rule)}>Hapus</button>
                  </div>
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Form Modal */}
      {isFormOpen && (
        <div role="presentation" onClick={closeForm} style={{ position: 'fixed', inset: 0, background: 'rgba(8,10,12,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 55, padding: 16 }}>
          <div role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} style={{ width: 'min(560px, 100%)', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, padding: 24, boxShadow: '0 30px 60px rgba(0,0,0,0.4)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <div className="kp-eyebrow" style={{ fontSize: 10 }}>Mood Rules · {editId ? 'Edit' : 'Tambah'}</div>
                <h2 style={{ margin: '6px 0 0', fontSize: 18 }}>{editId ? 'Perbarui mood rule' : 'Tambah mood rule'}</h2>
              </div>
              <button className="kp-btn kp-btn-ghost" onClick={closeForm}>Tutup</button>
            </div>

            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gap: 16 }}>
                {/* Mood name */}
                <div style={{ display: 'grid', gap: 6 }}>
                  <label className="kp-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>Nama Mood *</label>
                  <input
                    value={form.mood}
                    onChange={(e) => setField('mood', e.target.value)}
                    placeholder="Contoh: happy"
                    style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid var(--line-strong)', background: 'var(--surface)', color: 'var(--text)', fontSize: 13 }}
                  />
                </div>

                {/* Emoji */}
                <div style={{ display: 'grid', gap: 8 }}>
                  <label className="kp-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>Emoji</label>

                  {/* Preview + clear */}
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div style={{ width: 52, height: 48, borderRadius: 12, border: '1px solid var(--line-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, background: 'rgba(255,255,255,0.04)', flexShrink: 0, userSelect: 'none' }}>
                      {form.emoji || <span style={{ fontSize: 20, color: 'var(--text-muted)' }}>?</span>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {form.emoji ? `Terpilih: ${form.emoji}` : 'Belum ada emoji — pilih di bawah atau ketik custom'}
                      </div>
                    </div>
                  </div>

                  {/* Quick-pick grid */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {QUICK_EMOJIS.map((em) => {
                      const selected = form.emoji === em;
                      return (
                        <button
                          key={em}
                          type="button"
                          onClick={() => setField('emoji', selected ? '' : em)}
                          style={{
                            width: 40, height: 40, borderRadius: 10, fontSize: 20,
                            border: selected ? '2px solid var(--text)' : '1px solid var(--line)',
                            background: selected ? 'rgba(107,79,58,0.22)' : 'rgba(255,255,255,0.03)',
                            cursor: 'pointer', transition: 'border 120ms, background 120ms',
                          }}
                        >
                          {em}
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom input */}
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 2 }}>
                    <input
                      value={form.emoji}
                      onChange={(e) => setField('emoji', e.target.value)}
                      placeholder="Atau ketik emoji custom di sini..."
                      maxLength={10}
                      style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid var(--line-strong)', background: 'var(--surface)', color: 'var(--text)', fontSize: 18, flex: 1, fontFamily: 'inherit' }}
                    />
                    {form.emoji && (
                      <button
                        type="button"
                        onClick={() => setField('emoji', '')}
                        style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid var(--line)', background: 'transparent', color: 'var(--text-muted)', fontSize: 16, cursor: 'pointer' }}
                      >×</button>
                    )}
                  </div>
                </div>

                {/* Flavors */}
                <div style={{ display: 'grid', gap: 10 }}>
                  <label className="kp-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>Preferred Flavors (Urutan Bobot)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                    {[1, 2, 3].map((n) => {
                      const key = `preferred_flavor_${n}`;
                      const weights = ['+3', '+2', '+1'];
                      return (
                        <div key={n} style={{ display: 'grid', gap: 4 }}>
                          <label className="kp-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>Flavor {n} ({weights[n - 1]})</label>
                          <select
                            value={form[key]}
                            onChange={(e) => setField(key, e.target.value)}
                            style={{ padding: '9px 10px', borderRadius: 10, border: '1px solid var(--line-strong)', background: 'var(--surface)', color: 'var(--text)', fontSize: 12, fontFamily: 'var(--font-sans)' }}
                          >
                            <option value="">— Kosong —</option>
                            {flavorTypes.map((f) => (
                              <option key={f} value={f}>{FLAVOR_LABEL[f] ?? f}</option>
                            ))}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {formError && (
                <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', color: 'var(--bad)', fontSize: 12 }}>
                  {formError}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button type="button" className="kp-btn kp-btn-ghost" onClick={closeForm}>Batal</button>
                <button type="submit" className="kp-btn" disabled={isSaving}>{isSaving ? 'Menyimpan...' : 'Simpan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteOpen && (
        <div role="presentation" onClick={closeDelete} style={{ position: 'fixed', inset: 0, background: 'rgba(8,10,12,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 55, padding: 16 }}>
          <div role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} style={{ width: 'min(480px, 100%)', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 16, padding: 22, boxShadow: '0 30px 60px rgba(0,0,0,0.45)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <div className="kp-eyebrow" style={{ fontSize: 10 }}>Konfirmasi</div>
                <h2 style={{ margin: '6px 0 0', fontSize: 18 }}>Hapus mood rule?</h2>
              </div>
              <button className="kp-btn kp-btn-ghost" onClick={closeDelete}>Tutup</button>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Mood rule <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                {deleteTarget?.emoji} {deleteTarget?.mood}
              </span> akan dihapus permanen. Sistem rekomendasi tidak akan mengenali mood ini lagi.
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
              <button className="kp-btn kp-btn-ghost" onClick={closeDelete}>Batal</button>
              <button className="kp-btn kp-btn-danger" onClick={handleDelete}>Hapus</button>
            </div>
          </div>
        </div>
      )}

      {/* Success toast */}
      <div style={{ position: 'fixed', top: 18, right: 18, zIndex: 60, pointerEvents: 'none', opacity: successToast.visible ? 1 : 0, transform: successToast.visible ? 'translateY(0)' : 'translateY(-10px)', transition: 'opacity 180ms ease, transform 180ms ease' }}>
        <div style={{ minWidth: 260, maxWidth: 360, padding: '12px 14px', borderRadius: 12, background: 'linear-gradient(135deg, rgba(107,79,58,0.95), rgba(43,32,16,0.96))', border: '1px solid rgba(255,255,255,0.16)', boxShadow: '0 18px 40px rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', gap: 12, color: '#F6F2EE' }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>✓</div>
          <div>
            <div className="kp-mono" style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.8 }}>Success</div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{successToast.message}</div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
