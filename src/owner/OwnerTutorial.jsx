import { useState, useRef } from 'react';
import { C, fn, fb } from '../shared/theme.js';

const SLIDES = [
  {
    icon: '🏋️',
    title: 'Welcome to MSG Owner!',
    body: "You're all set to manage your gym. Let's show you the most important features in just 30 seconds.",
    accent: C.accent,
  },
  {
    icon: '📊',
    title: 'Your Command Centre',
    body: 'The Overview tab shows live stats — check-ins, active members, renewals and revenue — all at a glance. Tap any card to dive deeper.',
    accent: '#FF6B6B',
  },
  {
    icon: '👥',
    title: 'Manage Your Members',
    body: 'Add members, track engagement scores, and see who is at risk of dropping off in the Alerts tab. Stay proactive.',
    accent: '#4ECDC4',
  },
  {
    icon: '📅',
    title: 'Attendance & QR',
    body: 'Show the QR code at reception for instant check-ins, or manually log walk-ins. The 30-day chart always keeps you informed.',
    accent: '#FFE66D',
  },
  {
    icon: '⚡',
    title: "You're Ready to Go!",
    body: 'Use Quick Actions on the home screen to add members, mark attendance, or jump to Gym Settings instantly.',
    accent: '#A8E6CF',
  },
];

export default function OwnerTutorial({ onDone }) {
  const [slide, setSlide] = useState(0);
  const touchStartX = useRef(null);

  const goNext = () => {
    if (slide < SLIDES.length - 1) setSlide(s => s + 1);
    else finish();
  };

  const goPrev = () => {
    if (slide > 0) setSlide(s => s - 1);
  };

  const finish = () => {
    try { localStorage.setItem('msg_owner_tutorial_done', '1'); } catch {}
    onDone?.();
  };

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) { dx < 0 ? goNext() : goPrev(); }
    touchStartX.current = null;
  };

  const s = SLIDES[slide];
  const isLast = slide === SLIDES.length - 1;

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'linear-gradient(160deg, #0a0a0a 0%, #141414 60%, #1a0505 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '0 32px',
        fontFamily: fn, userSelect: 'none',
      }}
    >
      {/* Skip button */}
      {!isLast && (
        <button onClick={finish} style={{
          position: 'absolute', top: 'calc(env(safe-area-inset-top,0px) + 24px)', right: 24,
          background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 20, padding: '6px 16px', color: 'rgba(255,255,255,0.5)',
          fontSize: 13, fontFamily: fn, cursor: 'pointer',
        }}>
          Skip
        </button>
      )}

      {/* Slide number */}
      <div style={{
        position: 'absolute', top: 'calc(env(safe-area-inset-top,0px) + 28px)', left: 24,
        fontSize: 12, color: 'rgba(255,255,255,0.3)', fontFamily: fb, fontWeight: 600,
      }}>
        {slide + 1} / {SLIDES.length}
      </div>

      {/* Icon */}
      <div style={{
        width: 120, height: 120, borderRadius: 36,
        background: 'rgba(255,255,255,0.06)',
        border: `2px solid ${s.accent}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 56, marginBottom: 40,
        boxShadow: `0 0 60px ${s.accent}25`,
        transition: 'all 0.4s ease',
      }}>
        {s.icon}
      </div>

      {/* Text */}
      <div style={{
        fontFamily: fb, fontSize: 28, fontWeight: 800,
        color: '#fff', textAlign: 'center', letterSpacing: '-0.02em',
        marginBottom: 16, lineHeight: 1.2,
        transition: 'all 0.3s ease',
      }}>
        {s.title}
      </div>
      <div style={{
        fontSize: 15, color: 'rgba(255,255,255,0.55)',
        textAlign: 'center', lineHeight: 1.65, maxWidth: 320,
        marginBottom: 56, fontFamily: fn,
        transition: 'all 0.3s ease',
      }}>
        {s.body}
      </div>

      {/* Dot indicators */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 48 }}>
        {SLIDES.map((_, i) => (
          <button key={i} onClick={() => setSlide(i)} style={{
            width: i === slide ? 24 : 8, height: 8,
            borderRadius: 4, background: i === slide ? C.accent : 'rgba(255,255,255,0.2)',
            border: 'none', cursor: 'pointer', padding: 0,
            transition: 'all 0.35s cubic-bezier(.22,.68,0,1.4)',
          }} />
        ))}
      </div>

      {/* Nav buttons */}
      <div style={{ display: 'flex', gap: 12, width: '100%', maxWidth: 320 }}>
        {slide > 0 && (
          <button onClick={goPrev} style={{
            flex: 1, padding: '16px', background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16,
            color: '#fff', fontFamily: fb, fontWeight: 700, fontSize: 15,
            cursor: 'pointer',
          }}>
            ← Back
          </button>
        )}
        <button onClick={goNext} style={{
          flex: 2, padding: '16px',
          background: isLast ? C.accent : 'rgba(255,255,255,0.1)',
          border: isLast ? 'none' : '1px solid rgba(255,255,255,0.15)',
          borderRadius: 16, color: isLast ? '#111' : '#fff',
          fontFamily: fb, fontWeight: 800, fontSize: 15,
          cursor: 'pointer',
          boxShadow: isLast ? `0 4px 20px ${C.accent}55` : 'none',
          transition: 'all 0.3s ease',
        }}>
          {isLast ? "🚀 Let's Go!" : 'Next →'}
        </button>
      </div>

      {/* Bottom safe area spacer */}
      <div style={{ height: 'env(safe-area-inset-bottom,0px)' }} />
    </div>
  );
}
