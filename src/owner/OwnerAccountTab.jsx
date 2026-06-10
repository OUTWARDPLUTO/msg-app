import { useState, useRef } from 'react';
import { C, fn, fb } from '../shared/theme.js';
import { Card, Lbl, UserAvatar } from '../shared/primitives.jsx';
import { updateUserDoc } from '../shared/firebase.js';

export default function OwnerAccountTab({ user, onLogout }) {
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
    <div style={{ padding: '20px 16px 32px' }} className="msg-anim-fadein">
      <div style={{ fontFamily: fn, fontSize: 24, fontWeight: 800, color: C.text, letterSpacing: '-0.02em', marginBottom: 20 }}>My Account</div>

      <Card style={{ padding: '20px 16px', marginBottom: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => fileRef.current?.click()}>
          <UserAvatar user={{ ...user, photo }} size={80} fontSize={24} />
          <div style={{
            position: 'absolute', bottom: 0, right: 0,
            background: C.accent, borderRadius: '50%', width: 26, height: 26,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `2px solid ${C.s1}`, boxShadow: C.accentShadow
          }}>
            <span style={{ fontSize: 13, color: '#111' }}>📷</span>
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
        
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.text, fontFamily: fn }}>{name}</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>{user?.email}</div>
        </div>
      </Card>

      <Card style={{ padding: '16px', marginBottom: 20 }}>
        <div style={{ marginBottom: 14 }}>
          <Lbl text="Full Name" style={{ marginBottom: 6 }} />
          <input
            value={name} onChange={e => setName(e.target.value)}
            style={{
              width: '100%', boxSizing: 'border-box', background: C.s3,
              border: `1px solid ${C.border}`, borderRadius: 10, padding: '11px 13px',
              color: C.text, fontSize: 14, fontFamily: fn, outline: 'none',
            }}
            onFocus={e => e.target.style.borderColor = C.accent}
            onBlur={e => e.target.style.borderColor = C.border}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <Lbl text="Email Address" style={{ marginBottom: 6 }} />
          <input
            value={user?.email || ''} disabled
            style={{
              width: '100%', boxSizing: 'border-box', background: C.s4,
              border: `1px solid ${C.border}`, borderRadius: 10, padding: '11px 13px',
              color: C.muted, fontSize: 14, fontFamily: fn, outline: 'none',
              cursor: 'not-allowed'
            }}
          />
        </div>

        <div>
          <Lbl text="Account Type" style={{ marginBottom: 6 }} />
          <div style={{
            background: C.s3, border: `1px solid ${C.border}`, borderRadius: 10,
            padding: '11px 13px', fontSize: 14, color: C.accent, fontWeight: 700,
            textTransform: 'uppercase', fontFamily: fb, letterSpacing: '0.04em'
          }}>
            👑 Gym Owner
          </div>
        </div>
      </Card>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button onClick={handleSave} disabled={saving} style={{
          width: '100%', padding: '14px', background: saved ? C.green : C.accent,
          border: 'none', borderRadius: 14, color: '#111', fontFamily: fn, fontWeight: 800,
          fontSize: 14, cursor: 'pointer', transition: 'background 0.3s',
          boxShadow: C.accentShadow,
        }}>
          {saving ? 'Saving…' : saved ? '✓ Saved Profile' : 'Save Changes'}
        </button>

        <button onClick={() => {
          if (confirm('Are you sure you want to log out?')) {
            onLogout();
          }
        }} style={{
          width: '100%', padding: '14px', background: 'rgba(248, 113, 113, 0.15)',
          border: `1px solid rgba(248, 113, 113, 0.3)`, borderRadius: 14, color: C.red,
          fontFamily: fn, fontWeight: 700, fontSize: 14, cursor: 'pointer',
        }}>
          🚪 Log Out
        </button>
      </div>
    </div>
  );
}
