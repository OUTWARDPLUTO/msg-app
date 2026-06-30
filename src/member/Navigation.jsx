import { useState } from 'react';
import { C, fn, fb } from '../shared/theme.js';
import { UserAvatar } from '../shared/primitives.jsx';
import { sanitizeString, validateNumber } from '../shared/security.js';
import { Lbl } from './primitives.jsx';
// ─── Profile Dropdown ────────────────────────────────────────────────────────
export function ProfileDropdown({ onClose, onNavigate, onLogout, user, darkMode }) {
  const items = [
    { icon: '💎', label: 'MSG Premium', sub: 'Unlock advanced AI & analytics', action: 'premium' },
    { icon: '👤', label: 'View Profile', sub: 'Stats, achievements & goals', action: 'profile' },
    { icon: '⚙️', label: 'Settings', sub: 'Units, notifications, preferences', action: 'settings' },
    { icon: '🌐', label: 'Language', sub: 'English (IN) · change anytime', action: 'language' },
    { icon: '🚪', label: 'Logout', sub: 'Sign out of MSG', action: 'logout', danger: true },
  ];
  return (
    <>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 49 }} />
      <div style={{
        position: 'absolute', top: 56, right: 16, zIndex: 50,
        background: darkMode ? 'rgba(18, 18, 18, 0.60)' : 'rgba(255, 255, 255, 0.65)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'}`,
        borderRadius: 14, minWidth: 228, overflow: 'hidden',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.25)'
      }}>
        <div style={{ padding: '14px 16px 12px', borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`, background: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <UserAvatar user={{ ...user, photo: localStorage.getItem('msg_profile_photo') || user?.photo }} size={38} fontSize={13} />
            <div>
              <div style={{ fontFamily: fn, fontSize: 16, fontWeight: 800, color: C.text, lineHeight: 1 }}>{(user?.name || 'User').toUpperCase()}</div>
              <div style={{ color: C.sub, fontSize: 11, marginTop: 3 }}>{user?.email || ''}</div>
            </div>
          </div>
        </div>
        {items.map((item, i) => (
          <button key={i} onClick={() => { onClose(); item.action === 'logout' ? setTimeout(() => onLogout(), 100) : onNavigate(item.action); }} style={{
            display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '13px 16px',
            background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
            borderBottom: i < items.length - 1 ? `1px solid ${C.border}` : 'none',
          }}
            onMouseEnter={e => e.currentTarget.style.background = C.s3}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}>
            <span style={{ fontSize: 17 }}>{item.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: item.danger ? C.red : C.text }}>{item.label}</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>{item.sub}</div>
            </div>
            {!item.danger && <span style={{ color: C.muted, fontSize: 14 }}>›</span>}
          </button>
        ))}
      </div>
    </>
  );
}

// ─── Log Progress Modal ──────────────────────────────────────────────────────
export function LogProgressModal({ onSave, onClose, darkMode }) {
  const [form, setForm] = useState({ weight: '', height: '', bodyFat: '', chest: '', waist: '', arms: '', legs: '', notes: '' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = () => {
    const entry = {
      date: new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      weight: validateNumber(form.weight, 20, 500, 0),
      height: validateNumber(form.height, 50, 300, 0),
      bodyFat: validateNumber(form.bodyFat, 0, 100, 0),
      chest: validateNumber(form.chest, 0, 300, 0),
      waist: validateNumber(form.waist, 0, 300, 0),
      arms: validateNumber(form.arms, 0, 150, 0),
      legs: validateNumber(form.legs, 0, 150, 0),
      notes: sanitizeString(form.notes, 500),
    };
    onSave(entry);
    onClose();
  };

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end' }}>
      <div style={{
        width: '100%',
        background: darkMode ? 'rgba(18, 18, 18, 0.88)' : 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
        borderRadius: '20px 20px 0 0', padding: '20px 20px 30px', maxHeight: '88%', overflowY: 'auto', boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontFamily: fn, fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: '-0.02em' }}>Log Progress</div>
          <button onClick={onClose} style={{ background: C.s3, border: 'none', width: 32, height: 32, borderRadius: '50%', color: C.sub, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
          {[{ l: 'Weight (kg)', k: 'weight', p: '72.5' }, { l: 'Height (cm)', k: 'height', p: '175' }, { l: 'Body Fat %', k: 'bodyFat', p: '17.2' }].map(f => (
            <div key={f.k}>
              <Lbl text={f.l} style={{ marginBottom: 7 }} />
              <input type="number" value={form[f.k]} onChange={e => set(f.k, e.target.value)} placeholder={f.p}
                style={{ width: '100%', boxSizing: 'border-box', background: C.s2, border: `1px solid ${C.border}`, borderRadius: 10, padding: '11px 10px', color: C.text, fontSize: 14, fontFamily: fn, outline: 'none' }} />
            </div>
          ))}
        </div>

        <Lbl text="Measurements (cm)" style={{ marginBottom: 10 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          {['chest', 'waist', 'arms', 'legs'].map(k => (
            <div key={k}>
              <div style={{ color: C.muted, fontSize: 10, fontFamily: fb, fontWeight: 700, textTransform: 'capitalize', letterSpacing: '0.06em', marginBottom: 5 }}>{k}</div>
              <input type="number" value={form[k]} onChange={e => set(k, e.target.value)} placeholder="cm"
                style={{ width: '100%', boxSizing: 'border-box', background: C.s2, border: `1px solid ${C.border}`, borderRadius: 10, padding: '11px 12px', color: C.text, fontSize: 14, fontFamily: fn, outline: 'none' }} />
            </div>
          ))}
        </div>

        <Lbl text="Notes (optional)" style={{ marginBottom: 8 }} />
        <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="How are you feeling today? Any PRs?" rows={2}
          style={{ width: '100%', boxSizing: 'border-box', background: C.s2, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 14px', color: C.text, fontSize: 13, fontFamily: fn, outline: 'none', resize: 'none', marginBottom: 18 }} />

        <button onClick={save} disabled={!form.weight} style={{
          width: '100%', background: form.weight ? C.accent : C.s4, color: form.weight ? '#000' : C.muted,
          border: 'none', borderRadius: 12, padding: 15, fontSize: 13, fontFamily: fn, fontWeight: 700,
          letterSpacing: '0.02em', cursor: form.weight ? 'pointer' : 'not-allowed',
        }}>Save Entry</button>
      </div>
    </div>
  );
}

// ─── Bottom Nav (Animated) ────────────────────────────────────────────────────
function NavIcon({ id, active }) {
  const s = active ? C.accent : C.muted;
  const p = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: s, strokeWidth: '1.8', strokeLinecap: 'round', strokeLinejoin: 'round', style: { transition: 'stroke 0.2s' } };
  if (id === 'home') return <svg {...p}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>;
  if (id === 'workout') return <svg {...p}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>;
  if (id === 'diet') return <svg {...p}><circle cx="12" cy="12" r="10" /><path d="M8 6s1 2 4 2 4-2 4-2" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="9" y1="12" x2="15" y2="12" /></svg>;
  if (id === 'store') return <svg {...p}><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>;
  if (id === 'progress') return <svg {...p}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>;
  return null;
}

export function BottomNavAnimated({ tab, setTab, darkMode }) {
  const tabs = ['home', 'workout', 'diet', 'store', 'progress'];
  const isDark = !C.isLight;
  return (
    <div className="msg-bottom-nav" style={{
      position: 'fixed',
      bottom: 'max(16px, env(safe-area-inset-bottom, 16px))',
      left: 16,
      right: 16,
      zIndex: 100,
      borderRadius: 24,
      background: isDark ? 'rgba(20, 20, 20, 0.8)' : 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'}`,
      boxShadow: isDark ? '0 12px 40px rgba(0,0,0,0.5)' : '0 8px 32px rgba(0,0,0,0.1)',
      display: 'flex',
      padding: '6px 0 4px',
    }}>
      {tabs.map(id => {
        const active = tab === id;
        return (
          <button key={id} id={`tut-tab-${id}`} onClick={() => setTab(id)} style={{
            flex: 1, background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '10px 4px 8px', position: 'relative'
          }}>
            <div style={{
              transform: active ? 'scale(1.15) translateY(-2px)' : 'scale(1) translateY(0)',
              transition: 'transform 0.25s cubic-bezier(.22,.68,0,1.4)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            }}>
              <NavIcon id={id} active={active} />
            </div>
            <span style={{
              fontSize: 8, fontFamily: fb, fontWeight: active ? 800 : 500,
              color: active ? C.accent : C.muted, textTransform: 'uppercase', letterSpacing: '0.04em',
              transition: 'color 0.2s',
            }}>
              {id}
            </span>
            {active && (
              <div className="msg-anim-scalein" style={{ position: 'absolute', bottom: -1, width: 24, height: 3, borderRadius: '3px 3px 0 0', background: C.accent, boxShadow: C.accentShadow }} />
            )}
          </button>
        );
      })}
    </div>
  );
}


