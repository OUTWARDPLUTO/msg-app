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
    <div style={{ marginBottom: 14 }}>
      <Lbl text={label} style={{ marginBottom: 6 }} />
      <input
        value={form[key]} onChange={e => sp(key, e.target.value)}
        placeholder={opts.placeholder || ''}
        type={opts.type || 'text'}
        style={{
          width: '100%', boxSizing: 'border-box', background: C.s3,
          border: `1px solid ${C.border}`, borderRadius: 10, padding: '11px 13px',
          color: C.text, fontSize: 13, fontFamily: fn, outline: 'none',
        }}
        onFocus={e => e.target.style.borderColor = C.accent}
        onBlur={e => e.target.style.borderColor = C.border}
      />
    </div>
  );

  return (
    <ModalShell title={initial ? 'Edit Product' : 'New Product'} onClose={onClose}>
      <div style={{ padding: '8px 20px 28px' }}>

          {/* Image */}
          <div style={{ marginBottom: 16 }}>
            <Lbl text="Product Image" style={{ marginBottom: 8 }} />
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{
                width: 80, height: 80, borderRadius: 14,
                background: C.s3, border: `1px dashed ${C.border}`,
                overflow: 'hidden', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {imagePreview
                  ? <img src={imagePreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setImagePreview('')} />
                  : <span style={{ fontSize: 28, opacity: 0.4 }}>📦</span>
                }
              </div>
              <div style={{ flex: 1 }}>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImagePick} />
                <button onClick={() => fileRef.current?.click()} style={{
                  display: 'block', width: '100%', padding: '10px',
                  background: C.s3, border: `1px solid ${C.border}`, borderRadius: 10,
                  color: C.sub, fontFamily: fn, fontSize: 12, fontWeight: 700, cursor: 'pointer', marginBottom: 6,
                }}>
                  {uploading ? 'Uploading…' : '📷 Pick from Gallery'}
                </button>
                <div style={{ fontSize: 10, color: C.muted }}>Max 5MB. JPG/PNG/WEBP</div>
              </div>
            </div>
          </div>

          {inp('Product Name', 'name', { placeholder: 'e.g. Whey Gold Standard' })}
          {inp('Price (₹)', 'price', { type: 'number', placeholder: 'e.g. 2499' })}

          {/* Category */}
          <div style={{ marginBottom: 14 }}>
            <Lbl text="Category" style={{ marginBottom: 8 }} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {CATS.map(cat => (
                <button key={cat} onClick={() => sp('category', cat)} style={{
                  padding: '6px 12px', borderRadius: 20,
                  background: form.category === cat ? C.accent + '20' : C.s3,
                  border: `1px solid ${form.category === cat ? C.accent : C.border}`,
                  color: form.category === cat ? C.accent : C.sub,
                  fontSize: 11, fontFamily: fn, fontWeight: 700, cursor: 'pointer',
                }}>
                  {CAT_ICONS[cat]} {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: 14 }}>
            <Lbl text="Description" style={{ marginBottom: 6 }} />
            <textarea
              value={form.description} onChange={e => sp('description', e.target.value)}
              placeholder="Key details, flavors, serving size..."
              rows={3}
              style={{
                width: '100%', boxSizing: 'border-box', background: C.s3,
                border: `1px solid ${C.border}`, borderRadius: 10, padding: '11px 13px',
                color: C.text, fontSize: 13, fontFamily: fn, outline: 'none', resize: 'vertical',
              }}
              onFocus={e => e.target.style.borderColor = C.accent}
              onBlur={e => e.target.style.borderColor = C.border}
            />
          </div>

          {/* Stock */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>In Stock</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Shown as available to members</div>
            </div>
            <div onClick={() => sp('inStock', !form.inStock)} style={{
              width: 44, height: 24, borderRadius: 12,
              background: form.inStock ? C.accent : C.s4,
              cursor: 'pointer', position: 'relative', transition: 'background 0.25s',
            }}>
              <div style={{
                position: 'absolute', top: 3,
                left: form.inStock ? 23 : 3,
                width: 18, height: 18, borderRadius: '50%',
                background: form.inStock ? '#111' : C.muted,
                transition: 'left 0.25s',
              }} />
            </div>
          </div>

          {error && (
            <div style={{ background: C.red + '15', border: `1px solid ${C.red}33`, borderRadius: 10, padding: '10px 12px', marginBottom: 14, fontSize: 12, color: C.red }}>
              ⚠️ {error}
            </div>
          )}

          <button onClick={handleSave} disabled={saving || uploading} style={{
            width: '100%', padding: '14px', background: C.accent,
            border: 'none', borderRadius: 14, color: '#111', fontFamily: fn, fontWeight: 800,
            fontSize: 14, cursor: 'pointer', boxShadow: C.accentShadow, opacity: saving ? 0.7 : 1,
          }}>
            {saving ? 'Saving…' : uploading ? 'Uploading image…' : initial ? 'Save Changes' : 'Add Product'}
          </button>
      </div>
    </ModalShell>
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
  };

  const cats = ['All', ...CATS.filter(c => products.some(p => p.category === c))];
  const filtered = filterCat === 'All' ? products : products.filter(p => p.category === filterCat);

  return (
    <div style={{ paddingBottom: 24 }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontFamily: fn, fontSize: 24, fontWeight: 800, color: C.text, letterSpacing: '-0.02em' }}>Store</div>
          <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>{products.length} product{products.length !== 1 ? 's' : ''} listed</div>
        </div>
        <button onClick={() => setModal('new')} style={{
          background: C.accent, border: 'none', borderRadius: 12,
          padding: '9px 16px', color: '#111', fontFamily: fn, fontWeight: 800,
          fontSize: 12, cursor: 'pointer', boxShadow: C.accentShadow,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          + Add
        </button>
      </div>

      {/* Category filter */}
      {cats.length > 1 && (
        <div style={{ padding: '0 16px', marginBottom: 14, overflowX: 'auto', display: 'flex', gap: 7 }}>
          {cats.map(c => (
            <button key={c} onClick={() => setFilterCat(c)} style={{
              padding: '6px 12px', borderRadius: 20, whiteSpace: 'nowrap', flexShrink: 0,
              background: filterCat === c ? C.accent + '20' : C.s2,
              border: `1px solid ${filterCat === c ? C.accent : C.border}`,
              color: filterCat === c ? C.accent : C.sub,
              fontSize: 11, fontFamily: fn, fontWeight: 700, cursor: 'pointer',
            }}>
              {c !== 'All' ? CAT_ICONS[c] + ' ' : ''}{c}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <Spinner text="Loading products…" />
      ) : filtered.length === 0 ? (
        <div style={{ padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🛒</div>
          <div style={{ fontFamily: fn, fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 6 }}>No products yet</div>
          <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.55, marginBottom: 20 }}>
            Add the supplements you sell so members can browse and enquire.
          </div>
          <button onClick={() => setModal('new')} style={{
            background: C.accent, border: 'none', borderRadius: 12,
            padding: '12px 24px', color: '#111', fontFamily: fn, fontWeight: 800,
            fontSize: 13, cursor: 'pointer', boxShadow: C.accentShadow,
          }}>+ Add First Product</button>
        </div>
      ) : (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(p => (
            <Card key={p.id} style={{ padding: 0, overflow: 'hidden', position: 'relative', minHeight: 120 }}>
              {/* Image cell (absolute positioned on the left, full height) */}
              <div style={{
                position: 'absolute', top: 0, left: 0, bottom: 0, width: 100,
                background: C.s3, overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRight: `1px solid ${C.border}`,
              }}>
                {p.imageUrl
                  ? <img src={p.imageUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.currentTarget.style.display = 'none'; }} />
                  : <span style={{ fontSize: 32, opacity: 0.5 }}>{CAT_ICONS[p.category] || '📦'}</span>
                }
              </div>
              {/* Info & Actions (structured flex column on the right) */}
              <div style={{ marginLeft: 100, padding: 14, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 120, boxSizing: 'border-box' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{p.category}</div>
                    </div>
                    <div style={{ fontFamily: fn, fontSize: 15, fontWeight: 800, color: C.accent, flexShrink: 0 }}>
                      ₹{p.price?.toLocaleString?.() ?? p.price}
                    </div>
                  </div>
                  {p.description && (
                    <div style={{ fontSize: 11, color: C.sub, marginTop: 5, lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {p.description}
                    </div>
                  )}
                </div>
                {/* Footer / Actions */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, gap: 8, flexWrap: 'wrap' }}>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '2px 8px', borderRadius: 6, fontSize: 9, fontFamily: fb, fontWeight: 700,
                    background: p.inStock ? C.green + '15' : C.red + '15',
                    color: p.inStock ? C.green : C.red,
                    border: `1px solid ${p.inStock ? C.green + '33' : C.red + '33'}`,
                  }}>
                    {p.inStock ? '● IN STOCK' : '○ OUT OF STOCK'}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => setModal(p)} style={{
                      background: C.s3, border: `1px solid ${C.border}`, borderRadius: 8,
                      padding: '4px 10px', fontSize: 11, color: C.sub, cursor: 'pointer', fontFamily: fn, fontWeight: 600,
                    }}>Edit</button>
                    <button onClick={() => setDeleteConfirm(p.id)} style={{
                      background: C.red + '15', border: `1px solid ${C.red}33`, borderRadius: 8,
                      padding: '4px 10px', fontSize: 11, color: C.red, cursor: 'pointer', fontFamily: fn, fontWeight: 600,
                    }}>Delete</button>
                  </div>
                </div>
              </div>
            </Card>
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
        <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: C.s1, borderRadius: 20, padding: '24px 20px', width: '100%', maxWidth: 320 }}>
            <div style={{ fontFamily: fn, fontSize: 17, fontWeight: 800, color: C.text, marginBottom: 8 }}>Delete Product?</div>
            <div style={{ fontSize: 13, color: C.sub, marginBottom: 20 }}>This cannot be undone. Members will no longer see this listing.</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: 12, background: C.s3, border: `1px solid ${C.border}`, borderRadius: 12, color: C.sub, fontFamily: fn, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} style={{ flex: 1, padding: 12, background: C.red, border: 'none', borderRadius: 12, color: '#fff', fontFamily: fn, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
