import { useState, useEffect, useRef } from 'react';
import { C, fn, fb } from '../shared/theme.js';
import { Card, Lbl, Spinner, ModalShell } from '../shared/primitives.jsx';
import { getFBFirestore, serverTimestamp, uploadFile } from '../shared/firebase.js';

const CATS = ['Protein', 'Creatine', 'Vitamins', 'Pre-Workout', 'BCAA', 'Fat Burner', 'Accessories', 'Other'];
const CAT_ICONS = { Protein: '🥛', Creatine: '⚡', Vitamins: '💊', 'Pre-Workout': '🔥', BCAA: '💉', 'Fat Burner': '🌡️', Accessories: '🎽', Other: '📦' };

const EMPTY_FORM = { name: '', description: '', price: '', category: 'Protein', inStock: true, imageUrl: '' };

// ─── Image Upload Helper ──────────────────────────────────────────────────────
async function uploadProductImage(file, gymId, productId) {
  return await uploadFile(`gyms/${gymId}/store/${productId}_${Date.now()}`, file);
}


// ─── Product Form Modal ───────────────────────────────────────────────────────
function ProductModal({ gymId, initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(initial?.imageUrl || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const sp = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleImagePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('Image must be under 5MB'); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError('');
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Product name is required'); return; }
    if (!form.price || isNaN(parseFloat(form.price))) { setError('Valid price is required'); return; }
    setSaving(true);
    setError('');
    try {
      const db = await getFBFirestore();
      const isEdit = !!initial?.id;
      const ref = isEdit
        ? db.doc(`gyms/${gymId}/store_products/${initial.id}`)
        : db.collection(`gyms/${gymId}/store_products`).doc();

      let finalImageUrl = form.imageUrl;

      if (imageFile) {
        setUploading(true);
        try {
          finalImageUrl = await uploadProductImage(imageFile, gymId, ref.id);
        } catch {
          setError('Image upload failed — check Storage rules. Saving without image.');
          finalImageUrl = form.imageUrl;
        }
        setUploading(false);
      }

      const data = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: parseFloat(form.price),
        category: form.category,
        inStock: form.inStock,
        imageUrl: finalImageUrl,
        updatedAt: serverTimestamp(),
      };
      if (!isEdit) data.createdAt = serverTimestamp();

      await ref.set(data, { merge: true });
      onSave({ id: ref.id, ...data });
    } catch (e) {
      setError(e.message || 'Save failed');
    }
    setSaving(false);
  };

  const inp = (label, key, opts = {}) => (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 13, color: C.sub, fontFamily: fb, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>{label}</div>
      <input
        value={form[key]} onChange={e => sp(key, e.target.value)}
        placeholder={opts.placeholder || ''}
        type={opts.type || 'text'}
        style={{
          width: '100%', boxSizing: 'border-box', background: C.bg,
          border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 16px',
          color: C.text, fontSize: 15, fontFamily: fn, outline: 'none', transition: 'border-color 0.2s ease',
        }}
        onFocus={e => e.target.style.borderColor = C.accent}
        onBlur={e => e.target.style.borderColor = C.border}
      />
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 600, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', animation: 'msg-fadein 0.2s ease-out' }}>
      <div style={{ background: C.s1, borderRadius: '32px 32px 0 0', width: '100%', padding: '32px 20px calc(env(safe-area-inset-bottom,0) + 24px)', borderTop: `1px solid ${C.border}`, maxHeight: '90vh', overflowY: 'auto' }} className="msg-scroll">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ fontFamily: fb, fontSize: 24, fontWeight: 800, color: C.text }}>{initial ? 'Edit Product' : 'New Product'}</div>
          <button onClick={onClose} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.text }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div style={{ background: C.s1, marginBottom: 24 }}>
          {/* Image */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 13, color: C.sub, fontFamily: fb, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 12 }}>Product Image</div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{
                width: 96, height: 96, borderRadius: 16,
                background: C.bg, border: `1px dashed ${C.border}`,
                overflow: 'hidden', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {imagePreview
                  ? <img src={imagePreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setImagePreview('')} />
                  : <span style={{ fontSize: 32, opacity: 0.4 }}>📦</span>
                }
              </div>
              <div style={{ flex: 1 }}>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImagePick} />
                <button onClick={() => fileRef.current?.click()} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '12px',
                  background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12,
                  color: C.text, fontFamily: fb, fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 8, transition: 'all 0.2s ease',
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                  {uploading ? 'Uploading…' : 'Upload Image'}
                </button>
                <div style={{ fontSize: 12, color: C.muted, fontFamily: fn }}>Max 5MB. JPG/PNG/WEBP</div>
              </div>
            </div>
          </div>

          {inp('Product Name', 'name', { placeholder: 'e.g. Whey Gold Standard' })}
          {inp('Price (₹)', 'price', { type: 'number', placeholder: 'e.g. 2499' })}

          {/* Category */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, color: C.sub, fontFamily: fb, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 12 }}>Category</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {CATS.map(cat => (
                <button key={cat} onClick={() => sp('category', cat)} style={{
                  padding: '10px 16px', borderRadius: 20,
                  background: form.category === cat ? C.accent + '15' : C.bg,
                  border: `1px solid ${form.category === cat ? C.accent : C.border}`,
                  color: form.category === cat ? C.accent : C.text,
                  fontSize: 13, fontFamily: fb, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease',
                  display: 'flex', alignItems: 'center', gap: 6
                }}>
                  <span style={{ fontSize: 14 }}>{CAT_ICONS[cat]}</span> {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 13, color: C.sub, fontFamily: fb, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>Description <span style={{ textTransform: 'none', color: C.muted, fontWeight: 500 }}>(Optional)</span></div>
            <textarea
              value={form.description} onChange={e => sp('description', e.target.value)}
              placeholder="Key details, flavors, serving size..."
              rows={4}
              style={{
                width: '100%', boxSizing: 'border-box', background: C.bg,
                border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 16px',
                color: C.text, fontSize: 15, fontFamily: fn, outline: 'none', resize: 'vertical', transition: 'border-color 0.2s ease',
              }}
              onFocus={e => e.target.style.borderColor = C.accent}
              onBlur={e => e.target.style.borderColor = C.border}
            />
          </div>

          {/* Stock */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, padding: '16px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 16 }}>
            <div>
              <div style={{ fontSize: 15, fontFamily: fb, fontWeight: 600, color: C.text }}>In Stock</div>
              <div style={{ fontSize: 13, color: C.sub, fontFamily: fn, marginTop: 2 }}>Available for purchase</div>
            </div>
            <div onClick={() => sp('inStock', !form.inStock)} style={{
              width: 52, height: 32, borderRadius: 16,
              background: form.inStock ? C.green : C.s4,
              cursor: 'pointer', position: 'relative', transition: 'background 0.25s',
            }}>
              <div style={{
                position: 'absolute', top: 4,
                left: form.inStock ? 24 : 4,
                width: 24, height: 24, borderRadius: '50%',
                background: form.inStock ? '#111' : C.muted,
                transition: 'left 0.25s',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }} />
            </div>
          </div>
        </div>

        {error && (
          <div style={{ background: C.red + '15', border: `1px solid ${C.red}33`, borderRadius: 12, padding: '16px', marginBottom: 24, fontSize: 14, color: C.red, fontFamily: fn, display: 'flex', alignItems: 'center', gap: 12 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            {error}
          </div>
        )}

        <button onClick={handleSave} disabled={saving || uploading} style={{
          width: '100%', padding: '16px', background: C.text,
          border: 'none', borderRadius: 16, color: C.bg, fontFamily: fb, fontWeight: 700,
          fontSize: 16, cursor: 'pointer', opacity: (saving || uploading) ? 0.7 : 1, transition: 'all 0.2s ease'
        }}>
          {saving ? 'Saving…' : uploading ? 'Uploading image…' : initial ? 'Save Changes' : 'Add Product'}
        </button>
      </div>
    </div>
  );
}

// ─── Store Tab ────────────────────────────────────────────────────────────────
export default function StoreTab({ gymId, setBackHandler }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'new' | product object (edit)
  const [filterCat, setFilterCat] = useState('All');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    if (modal && setBackHandler) {
      setBackHandler(() => () => {
        setModal(null);
        return true;
      });
    } else if (deleteConfirm && setBackHandler) {
      setBackHandler(() => () => {
        setDeleteConfirm(null);
        return true;
      });
    } else if (setBackHandler) {
      setBackHandler(null);
    }
    return () => { if (setBackHandler) setBackHandler(null); };
  }, [modal, deleteConfirm, setBackHandler]);

  useEffect(() => { if (gymId) load(); }, [gymId]);

  async function load() {
    setLoading(true);
    try {
      const db = await getFBFirestore();
      const snap = await db.collection(`gyms/${gymId}/store_products`).orderBy('createdAt', 'desc').get();
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.warn('Store load:', e.message); }
    setLoading(false);
  }

  async function handleDelete(id) {
    try {
      const db = await getFBFirestore();
      await db.doc(`gyms/${gymId}/store_products/${id}`).delete();
      setProducts(p => p.filter(x => x.id !== id));
    } catch (e) { console.warn(e); }
    setDeleteConfirm(null);
  }

  const handleSave = (product) => {
    setProducts(prev => {
      const exists = prev.findIndex(p => p.id === product.id);
      if (exists >= 0) { const arr = [...prev]; arr[exists] = product; return arr; }
      return [product, ...prev];
    });
    setModal(null);
  }

  const cats = ['All', ...CATS.filter(c => products.some(p => p.category === c))];
  const filtered = filterCat === 'All' ? products : products.filter(p => p.category === filterCat);

  return (
    <div style={{ paddingBottom: 100, background: C.bg, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 20px) 20px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: fb, fontSize: 28, fontWeight: 800, color: C.text, letterSpacing: '-0.02em' }}>Store</div>
          <div style={{ fontSize: 13, color: C.sub, fontFamily: fn, marginTop: 4 }}>{products.length} product{products.length !== 1 ? 's' : ''}</div>
        </div>
        <button onClick={() => setModal('new')} style={{
          background: C.accent, border: 'none', borderRadius: 14,
          padding: '12px 20px', color: '#111', fontFamily: fb, fontWeight: 700,
          fontSize: 14, cursor: 'pointer', boxShadow: C.accentShadow,
          display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s ease'
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Add Product
        </button>
      </div>

      {/* Category filter */}
      {cats.length > 1 && (
        <div style={{ padding: '0 20px', marginBottom: 24, overflowX: 'auto', display: 'flex', gap: 8, paddingBottom: 4, margin: '0 -4px' }} className="msg-scroll">
          {cats.map(c => (
            <button key={c} onClick={() => setFilterCat(c)} style={{
              padding: '8px 16px', borderRadius: 20, whiteSpace: 'nowrap', flexShrink: 0,
              background: filterCat === c ? C.accent : C.s1,
              border: `1px solid ${filterCat === c ? C.accent : C.border}`,
              color: filterCat === c ? '#111' : C.sub,
              fontSize: 13, fontFamily: fb, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease', margin: '0 4px'
            }}>
              {c !== 'All' ? <span style={{ marginRight: 6 }}>{CAT_ICONS[c]}</span> : ''}{c}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '40px 0' }}><Spinner text="Loading products…" /></div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '40px 20px', textAlign: 'center' }}>
          <div style={{ background: C.s1, border: `1px dashed ${C.border}`, borderRadius: 24, padding: '48px 24px' }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.8 }}>🛒</div>
            <div style={{ fontFamily: fb, fontSize: 18, color: C.text, marginBottom: 8 }}>Empty Store</div>
            <div style={{ fontSize: 14, color: C.sub, fontFamily: fn, marginBottom: 24, lineHeight: 1.5, maxWidth: 260, margin: '0 auto 24px' }}>
              Add supplements and merchandise for members to purchase.
            </div>
            <button onClick={() => setModal('new')} style={{
              background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14,
              padding: '14px 28px', color: C.text, fontFamily: fb, fontWeight: 600,
              fontSize: 15, cursor: 'pointer', transition: 'all 0.2s ease'
            }}>Add First Product</button>
          </div>
        </div>
      ) : (
        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filtered.map(p => (
            <div key={p.id} style={{ background: C.s1, border: `1px solid ${C.border}`, borderRadius: 20, padding: 16, display: 'flex', gap: 16 }}>
              {/* Image */}
              <div style={{
                width: 88, height: 88, borderRadius: 12,
                background: C.bg, border: `1px solid ${C.border}`,
                overflow: 'hidden', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {p.imageUrl
                  ? <img src={p.imageUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.currentTarget.style.display = 'none'; }} />
                  : <span style={{ fontSize: 32, opacity: 0.5 }}>{CAT_ICONS[p.category] || '📦'}</span>
                }
              </div>
              
              {/* Info */}
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <div style={{ fontSize: 16, fontFamily: fb, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 12 }}>
                    {p.name}
                  </div>
                  <div style={{ fontFamily: fb, fontSize: 16, fontWeight: 800, color: C.accent, flexShrink: 0 }}>
                    ₹{p.price?.toLocaleString?.() ?? p.price}
                  </div>
                </div>
                
                <div style={{ fontSize: 13, color: C.sub, fontFamily: fn, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>{CAT_ICONS[p.category]}</span>
                  {p.category}
                </div>
                
                {/* Actions Row */}
                <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{
                    padding: '4px 8px', borderRadius: 6, fontSize: 10, fontFamily: fb, fontWeight: 700, letterSpacing: '0.04em',
                    background: p.inStock ? C.green + '15' : C.red + '15',
                    color: p.inStock ? C.green : C.red,
                    border: `1px solid ${p.inStock ? C.green + '33' : C.red + '33'}`,
                  }}>
                    {p.inStock ? 'IN STOCK' : 'OUT OF STOCK'}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setModal(p)} style={{
                      background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10,
                      padding: '6px 12px', fontSize: 13, color: C.text, cursor: 'pointer', fontFamily: fb, fontWeight: 600, transition: 'all 0.2s ease'
                    }}>Edit</button>
                    <button onClick={() => setDeleteConfirm(p.id)} style={{
                      background: 'transparent', border: 'none', borderRadius: 10,
                      padding: '6px', color: C.red, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease'
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {modal && (
        <ProductModal
          gymId={gymId}
          initial={modal === 'new' ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 700, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'msg-fadein 0.2s ease-out' }}>
          <div style={{ background: C.s1, border: `1px solid ${C.border}`, borderRadius: 24, padding: '24px', width: '100%', maxWidth: 320, boxShadow: '0 24px 48px rgba(0,0,0,0.4)' }}>
            <div style={{ fontFamily: fb, fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 12 }}>Delete Product?</div>
            <div style={{ fontSize: 14, color: C.sub, fontFamily: fn, marginBottom: 24, lineHeight: 1.5 }}>This cannot be undone. Members will no longer see this listing.</div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: '14px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, color: C.text, fontFamily: fb, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} style={{ flex: 1, padding: '14px', background: C.red, border: 'none', borderRadius: 14, color: '#fff', fontFamily: fb, fontWeight: 600, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 12px rgba(248, 113, 113, 0.3)' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
