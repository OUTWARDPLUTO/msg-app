import { useState } from 'react';
import { C, fn, fb } from './theme.js';

// ─── UserAvatar ───────────────────────────────────────────────────────────────
// Renders a circular avatar with the user's profile photo.
// Falls back to initials if photo is missing or fails to load.
// referrerPolicy="no-referrer" is required for Google profile photos in Android
// WebView — Capacitor runs at https://localhost and the Referer header causes
// lh3.googleusercontent.com to block the request.
export function UserAvatar({ user, size = 36, fontSize = 12 }) {
  const [imgFailed, setImgFailed] = useState(false);
  const initials = (user?.name || user?.email || '?')
    .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const showImg = user?.photo && !imgFailed;

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: C.accent, overflow: 'hidden', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: fn, fontSize, fontWeight: 800, color: '#111',
    }}>
      {showImg ? (
        <img
          src={user.photo}
          alt=""
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          onError={() => setImgFailed(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : initials}
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export const Card = ({ children, style: s = {}, onClick }) => {
  const isDark = C.bg === '#111111';
  return (
    <div
      onClick={onClick}
      style={{
        background: isDark ? 'rgba(26, 26, 26, 0.45)' : 'rgba(255, 255, 255, 0.50)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'}`,
        borderRadius: 20,
        padding: 16,
        boxShadow: C.cardShadow,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow 0.2s, transform 0.15s, background-color 0.2s, border-color 0.2s',
        ...s,
      }}
    >
      {children}
    </div>
  );
};

// ─── Tag ──────────────────────────────────────────────────────────────────────
export const Tag = ({ label, active, color, onClick }) => (
  <button
    onClick={onClick}
    style={{
      background: active ? (color || C.accent) : 'transparent',
      color: active ? '#111111' : C.sub,
      border: `1px solid ${active ? (color || C.accent) : C.border}`,
      borderRadius: 24, padding: '7px 16px', fontSize: 11, fontFamily: fb,
      fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
      cursor: 'pointer', whiteSpace: 'nowrap',
      boxShadow: active ? C.accentShadow : 'none',
      transition: 'all 0.18s ease',
    }}
  >
    {label}
  </button>
);

// ─── Label ────────────────────────────────────────────────────────────────────
export const Lbl = ({ text, style: s = {} }) => (
  <div style={{
    color: C.sub, fontSize: 10, fontFamily: fb, fontWeight: 700,
    letterSpacing: '0.08em', textTransform: 'uppercase', ...s,
  }}>
    {text}
  </div>
);

// ─── Section Header ───────────────────────────────────────────────────────────
export const Hd = ({ t, s: sub }) => (
  <div style={{ padding: '24px 20px 12px' }}>
    <div style={{
      fontFamily: fn, fontSize: 28, fontWeight: 800, color: C.text,
      lineHeight: 1.1, letterSpacing: '-0.02em',
    }}>
      {t}
    </div>
    {sub && (
      <div style={{ color: C.sub, fontSize: 13, marginTop: 4, fontWeight: 400 }}>
        {sub}
      </div>
    )}
  </div>
);

// ─── Modal Shell ──────────────────────────────────────────────────────────────
export function ModalShell({ title, onClose, children }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 100,
      background: C.bg === '#111111' ? 'rgba(17, 17, 17, 0.70)' : 'rgba(246, 246, 246, 0.75)',
      backdropFilter: 'blur(28px)',
      WebkitBackdropFilter: 'blur(28px)',
      display: 'flex', flexDirection: 'column', overflowY: 'auto',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '16px 20px 12px', borderBottom: `1px solid ${C.border}`, flexShrink: 0,
      }}>
        <button
          onClick={onClose}
          style={{
            background: C.s3, border: 'none', width: 34, height: 34,
            borderRadius: '50%', color: C.sub, fontSize: 18, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}
        >←</button>
        <div style={{ fontFamily: fn, fontSize: 28, color: C.text, letterSpacing: '0.06em', lineHeight: 1 }}>
          {title}
        </div>
      </div>
      <div className="msg-scroll" style={{ flex: 1, overflowY: 'auto' }}>
        {children}
      </div>
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner({ text = 'Loading…' }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '60vh', gap: 16,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: '50%',
        border: `3px solid ${C.s4}`, borderTopColor: C.accent,
        animation: 'spin 0.8s linear infinite',
      }} />
      <div style={{ color: C.sub, fontSize: 13 }}>{text}</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Engagement Score Ring ────────────────────────────────────────────────────
export function ScoreRing({ score = 0, size = 64, strokeWidth = 6 }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 70 ? C.green : score >= 40 ? C.accent : C.red;
  const half = size / 2;
  return (
    <svg width={size} height={size} style={{ display: 'block', overflow: 'visible' }}>
      <circle cx={half} cy={half} r={r} fill="none" stroke={C.s4} strokeWidth={strokeWidth}
        transform={`rotate(-90 ${half} ${half})`} />
      <circle
        cx={half} cy={half} r={r} fill="none"
        stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${half} ${half})`}
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
      <text
        x={half} y={half} textAnchor="middle" dominantBaseline="central"
        style={{ fill: color, fontSize: size * 0.28, fontWeight: 800, fontFamily: fn }}
      >
        {score}
      </text>
    </svg>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
export function StatusBadge({ status }) {
  const map = {
    active:    { bg: C.green  + '20', color: C.green,  label: 'Active' },
    'at-risk': { bg: C.orange + '20', color: C.orange, label: 'At Risk' },
    inactive:  { bg: C.red    + '20', color: C.red,    label: 'Inactive' },
  };
  const s = map[status] || map.active;
  return (
    <span style={{
      background: s.bg, color: s.color,
      fontSize: 9, fontFamily: fb, fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.06em',
      padding: '3px 8px', borderRadius: 20,
    }}>
      {s.label}
    </span>
  );
}

// ─── Settings Toggle + Row ────────────────────────────────────────────────────
export function SettingsToggle({ on, onTap }) {
  return (
    <div
      onClick={onTap}
      style={{
        width: 44, height: 24, borderRadius: 12,
        background: on ? C.accent : C.s4, cursor: 'pointer',
        position: 'relative', transition: 'background 0.25s', flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: 3, left: on ? 23 : 3,
        width: 18, height: 18, borderRadius: '50%',
        background: on ? '#000' : C.muted, transition: 'left 0.25s',
      }} />
    </div>
  );
}

export function SettingsRow({ label, sub, on, onTap }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 0', borderBottom: `1px solid ${C.border}`,
    }}>
      <div>
        <div style={{ fontSize: 14, color: C.text, fontWeight: 500 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{sub}</div>}
      </div>
      <SettingsToggle on={on} onTap={onTap} />
    </div>
  );
}
