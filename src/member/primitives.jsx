import { useState, useEffect, useRef } from 'react';
import { MC, C, fn, fb } from '../shared/theme.js';
// ─── Primitives ─────────────────────────────────────────────────────────────
export const Card = ({ children, style: s = {}, onClick }) => {
  const isDark = !C.isLight;
  return (
    <div
      onClick={onClick}
      style={{
        background: isDark ? 'rgba(26, 26, 26, 0.65)' : 'rgba(255, 255, 255, 0.70)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}`,
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
export const Tag = ({ label, active, color, onClick }) => (
  <button onClick={onClick} style={{
    background: active ? (color || C.accent) : 'transparent',
    color: active ? '#111111' : C.sub,
    border: `1px solid ${active ? (color || C.accent) : C.border}`,
    borderRadius: 24, padding: '7px 16px', fontSize: 11, fontFamily: fb,
    fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap',
    boxShadow: active ? C.accentShadow : 'none',
    transition: 'all 0.18s ease',
  }}>{label}</button>
);
export const Lbl = ({ text, style: s = {} }) => (
  <div style={{ color: C.sub, fontSize: 10, fontFamily: fb, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', ...s }}>{text}</div>
);
export const Hd = ({ t, s: sub }) => (
  <div style={{ padding: '24px 20px 12px' }}>
    <div style={{ fontFamily: fn, fontSize: 28, fontWeight: 800, color: C.text, lineHeight: 1.1, letterSpacing: '-0.02em' }}>{t}</div>
    {sub && <div style={{ color: C.sub, fontSize: 13, marginTop: 4, fontWeight: 400 }}>{sub}</div>}
  </div>
);

// ─── Nutrient Row ───────────────────────────────────────────────────────────
export function NRow({ label, current, dri, unit, color }) {
  const pct = dri > 0 ? Math.min((current / dri) * 100, 130) : 0;
  const status = pct < 70 ? 'deficit' : pct > 110 ? 'excess' : 'ok';
  const bc = status === 'ok' ? C.green : status === 'excess' ? C.red : C.blue;
  const ic = status === 'ok' ? '✓' : status === 'excess' ? '↑' : '↓';
  const disp = unit === 'mcg' ? current.toFixed(1) : unit === 'g' ? current.toFixed(1) : Math.round(current);
  const driDisp = unit === 'mcg' ? dri : unit === 'g' ? dri : dri;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: `0.5px solid ${C.border}` }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 12, color: C.sub }}>{label}</span>
          <span style={{ fontSize: 11, color: bc, fontFamily: fb, fontWeight: 700 }}>{ic} {disp}/{driDisp}{unit}</span>
        </div>
        <div style={{ height: 3, background: C.s4, borderRadius: 2 }}>
          <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: bc, borderRadius: 2, transition: 'width 0.4s ease' }} />
        </div>
      </div>
    </div>
  );
}

// ─── Exercise Card ───────────────────────────────────────────────────────────
export function ExCard({ ex }) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState([]);
  const [timer, setTimer] = useState(null);
  const ivRef = useRef(null);
  const mc = MC[ex.muscle] || C.accent;

  useEffect(() => () => clearInterval(ivRef.current), []);

  const startTimer = (e) => {
    e.stopPropagation();
    clearInterval(ivRef.current);
    let t = ex.rest;
    setTimer(t);
    ivRef.current = setInterval(() => {
      t--;
      setTimer(t);
      if (t <= 0) { clearInterval(ivRef.current); setTimer(null); }
    }, 1000);
  };

  const toggleSet = (e, i) => {
    e.stopPropagation();
    setDone(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i]);
  };

  const allDone = done.length === (ex.sets || 0);
  const s = typeof ex.sets === 'number' ? ex.sets : 3;

  return (
    <div className="msg-anim-fadeup" style={{ background: C.s2, border: `1px solid ${allDone ? mc + '50' : C.border}`, borderLeft: `3px solid ${mc}`, borderRadius: '2px 14px 14px 2px', marginBottom: 10, overflow: 'hidden', transition: 'border-color 0.3s, transform 0.2s, box-shadow 0.2s' }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: 'flex', gap: 12, padding: '14px 16px', cursor: 'pointer', alignItems: 'flex-start' }}>
        {/* Muscle thumbnail */}
        <div style={{ width: 54, height: 62, borderRadius: 10, flexShrink: 0, background: `linear-gradient(135deg,${mc}20,${mc}08)`, border: `1px solid ${mc}30`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontFamily: fn, fontSize: (ex.primary || '').includes(',') ? 18 : 26, color: mc, lineHeight: 1, letterSpacing: '0.02em' }}>
            {(ex.primary || '').includes(',') ? ex.primary.split(',').map(s => s.trim()[0].toUpperCase()).join('/') : ex.muscle.slice(0, 1).toUpperCase()}
          </div>
          <div style={{ fontSize: 6, color: mc, fontFamily: fb, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.8, marginTop: 2, textAlign: 'center', padding: '0 2px' }}>
            {(ex.primary || '').includes(',') ? ex.primary.split(',').map(s => s.trim().slice(0,3)).join('/').toUpperCase() : ex.muscle}
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 15, color: allDone ? mc : C.text }}>{ex.name}</div>
          <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>{ex.primary} · {ex.equip}</div>
          <div style={{ display: 'flex', gap: 10, marginTop: 5, alignItems: 'center' }}>
            <span style={{ fontFamily: fn, fontSize: 20, color: mc, letterSpacing: '0.04em', lineHeight: 1 }}>{ex.sets} × {ex.reps}</span>
            <span style={{ fontSize: 10, color: C.muted, background: C.s3, padding: '2px 7px', borderRadius: 4 }}>⏱ {ex.rest}s rest</span>
          </div>
          <div style={{ display: 'flex', gap: 5, marginTop: 8 }}>
            {Array.from({ length: s }).map((_, i) => (
              <button key={i} onClick={e => toggleSet(e, i)} style={{
                width: 24, height: 24, borderRadius: '50%',
                background: done.includes(i) ? mc : 'transparent',
                border: `1.5px solid ${done.includes(i) ? mc : C.muted}`,
                cursor: 'pointer', fontSize: 9, color: done.includes(i) ? '#000' : C.muted,
                fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{done.includes(i) ? '✓' : i + 1}</button>
            ))}
          </div>
        </div>
        <div style={{ color: C.muted, fontSize: 20, flexShrink: 0, lineHeight: 1, paddingTop: 2 }}>{open ? '−' : '+'}</div>
      </div>

      {open && (
        <div style={{ borderTop: `1px solid ${C.border}`, padding: '14px 16px 16px' }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
            <span style={{ background: mc + '1A', color: mc, border: `1px solid ${mc}33`, fontSize: 10, fontFamily: fb, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '3px 9px', borderRadius: 4 }}>Primary: {ex.primary}</span>
            {ex.secondary && <span style={{ background: C.s3, color: C.sub, fontSize: 10, fontFamily: fb, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '3px 9px', borderRadius: 4 }}>Also: {ex.secondary}</span>}
            <span style={{ background: C.s3, color: C.muted, fontSize: 10, fontFamily: fb, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '3px 9px', borderRadius: 4 }}>{ex.level}</span>
          </div>

          <Lbl text="Form Guide" style={{ marginBottom: 10 }} />
          {(ex.steps || []).map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'flex-start' }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: C.s3, border: `1px solid ${mc}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 9, color: mc, fontFamily: fb, fontWeight: 700 }}>{i + 1}</div>
              <div style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.55, flex: 1 }}>{step}</div>
            </div>
          ))}
          {ex.tip && (
            <div style={{ marginTop: 8, padding: '9px 12px', background: C.s3, borderRadius: 10, fontSize: 12, color: C.sub, lineHeight: 1.5 }}>
              💡 {ex.tip}
            </div>
          )}

          <button onClick={startTimer} style={{
            width: '100%', marginTop: 14, background: timer !== null ? C.s3 : mc + '18',
            border: `1px solid ${mc}44`, borderRadius: 10, padding: '11px 14px',
            color: mc, fontFamily: fb, fontWeight: 700, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          }}>
            {timer !== null ? (
              <>
                <span>⏱ {timer}s remaining</span>
                <div style={{ flex: 1, height: 3, background: C.s4, borderRadius: 2 }}>
                  <div style={{ height: '100%', width: `${Math.round((timer / ex.rest) * 100)}%`, background: mc, borderRadius: 2 }} />
                </div>
              </>
            ) : `⏱ Start Rest Timer (${ex.rest}s)`}
          </button>
        </div>
      )}
    </div>
  );
}



