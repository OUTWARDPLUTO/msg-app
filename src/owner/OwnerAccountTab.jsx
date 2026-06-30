import { useState, useRef } from 'react';
import { C, fn, fb } from '../shared/theme.js';
import { Card, Lbl, UserAvatar } from '../shared/primitives.jsx';
import { updateUserDoc } from '../shared/firebase.js';

export default function OwnerAccountTab({ user, onLogout, onBack }) {
  const [name, setName] = useState(user?.name || 'Owner');
  const [photo, setPhoto] = useState(() => {
    try { return localStorage.getItem('msg_profile_photo') || user?.photo || null; } catch { return user?.photo || null; }
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef(null);

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result;
      setPhoto(dataUrl);
      try { localStorage.setItem('msg_profile_photo', dataUrl); } catch {}
      
      // Update in user context
      if (user) {
        user.photo = dataUrl;
        try { localStorage.setItem('msg_user', JSON.stringify(user)); } catch {}
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      // 1. Update in Firestore
      if (user?.uid) {
        await updateUserDoc(user.uid, { name: name.trim(), photo });
      }

      // 2. Update local storage user session
      const updatedUser = { ...user, name: name.trim(), photo };
      localStorage.setItem('msg_user', JSON.stringify(updatedUser));
      
      // Force page refresh or state update
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error(e);
      alert('Failed to save profile: ' + e.message);
    }
    setSaving(false);
  };

  return (
    <div style={{ paddingBottom: 100, background: C.bg, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 20px) 20px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: C.text, padding: 0, cursor: 'pointer', display: 'flex' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
          <div style={{ fontFamily: fb, fontSize: 20, fontWeight: 700, color: C.text }}>My Account</div>
        </div>
      </div>

      <div style={{ padding: '0 20px' }} className="msg-anim-fadein">
        <div style={{ background: C.s1, border: `1px solid ${C.border}`, borderRadius: 20, padding: '24px 20px', marginBottom: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => fileRef.current?.click()}>
            <UserAvatar user={{ ...user, photo }} size={88} fontSize={28} />
            <div style={{
              position: 'absolute', bottom: 0, right: 0,
              background: C.accent, borderRadius: '50%', width: 28, height: 28,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `2px solid ${C.s1}`, boxShadow: C.accentShadow
            }}>
              <span style={{ fontSize: 13, color: '#111' }}>📷</span>
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text, fontFamily: fb }}>{name}</div>
            <div style={{ fontSize: 13, color: C.sub, marginTop: 4, fontFamily: fn }}>{user?.email}</div>
          </div>
        </div>

        <div style={{ background: C.s1, border: `1px solid ${C.border}`, borderRadius: 16, padding: '20px', marginBottom: 24 }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, color: C.sub, fontFamily: fb, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>Full Name</div>
            <input
              value={name} onChange={e => setName(e.target.value)}
              style={{
                width: '100%', boxSizing: 'border-box', background: C.bg,
                border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 16px',
                color: C.text, fontSize: 15, fontFamily: fn, outline: 'none', transition: 'border-color 0.2s'
              }}
              onFocus={e => e.target.style.borderColor = C.accent}
              onBlur={e => e.target.style.borderColor = C.border}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, color: C.sub, fontFamily: fb, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>Email Address</div>
            <input
              value={user?.email || ''} disabled
              style={{
                width: '100%', boxSizing: 'border-box', background: C.bg,
                border: `1px dashed ${C.border}`, borderRadius: 12, padding: '14px 16px',
                color: C.muted, fontSize: 15, fontFamily: fn, outline: 'none',
                cursor: 'not-allowed', opacity: 0.7
              }}
            />
          </div>

          <div>
            <div style={{ fontSize: 13, color: C.sub, fontFamily: fb, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>Account Type</div>
            <div style={{
              background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12,
              padding: '14px 16px', fontSize: 14, color: C.accent, fontWeight: 700,
              fontFamily: fb, display: 'flex', alignItems: 'center', gap: 8
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 16.1A5 5 0 0 1 5.9 20M2 12.05A9 9 0 0 1 9.95 20M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6"></path><line x1="2" y1="20" x2="2.01" y2="20"></line></svg>
              Gym Owner
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button onClick={handleSave} disabled={saving} style={{
            width: '100%', padding: '16px', background: saved ? C.green : C.text,
            border: 'none', borderRadius: 16, color: C.bg, fontFamily: fb, fontWeight: 700,
            fontSize: 16, cursor: 'pointer', transition: 'all 0.3s',
            boxShadow: saved ? 'none' : '0 4px 12px rgba(0,0,0,0.1)',
          }}>
            {saving ? 'Saving…' : saved ? '✓ Saved Profile' : 'Save Changes'}
          </button>

          <button onClick={() => {
            if (confirm('Are you sure you want to log out?')) {
              onLogout();
            }
          }} style={{
            width: '100%', padding: '16px', background: 'rgba(248, 113, 113, 0.1)',
            border: `1px solid rgba(248, 113, 113, 0.2)`, borderRadius: 16, color: C.red,
            fontFamily: fb, fontWeight: 700, fontSize: 16, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
