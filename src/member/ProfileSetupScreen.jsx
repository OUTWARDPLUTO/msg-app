import { useState, useEffect } from 'react';
import { C, fn, fb } from '../shared/theme.js';
import { Card } from './primitives.jsx';
// ─── Profile Setup Screen (shown once after first signup) ─────────────────────
export default function ProfileSetupScreen({ user, onComplete }) {
  const [form, setForm] = useState({
    name: user?.name || '', age: '', gender: '', height: '', currentWeight: '', targetWeight: '',
    goal: 'Build Strength', activity: 'Moderately Active', diet: 'Flexible', city: '',
  });
  const [step, setStep] = useState(0);
  const sp = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const steps = [
    {
      title: 'Who Are You? 👋', sub: 'Let\'s personalise your experience from day one.',
      fields: [
        { l: 'Display Name', k: 'name', p: 'What should we call you?', type: 'text' },
        { l: 'Age', k: 'age', p: 'e.g. 22', type: 'number' },
        { l: 'City / Location', k: 'city', p: 'e.g. Mumbai', type: 'text' },
      ],
    },
    {
      title: 'Your Body 💪', sub: 'Honest numbers = smarter targets. We\'ve got you.',
      fields: [
        { l: 'Height (cm)', k: 'height', p: 'e.g. 175', type: 'number' },
        { l: 'Current Weight (kg)', k: 'currentWeight', p: 'e.g. 72.5', type: 'number' },
        { l: 'Goal Weight (kg)', k: 'targetWeight', p: 'e.g. 68.0', type: 'number' },
      ],
    },
  ];

  const selOpts = [
    { l: 'Gender', k: 'gender', opts: ['Male', 'Female', 'Other', 'Prefer not to say'] },
    { l: 'Primary Goal', k: 'goal', opts: ['Lose Fat', 'Build Muscle', 'Maintain', 'Build Strength'] },
    { l: 'Activity Level', k: 'activity', opts: ['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active'] },
    { l: 'Diet Style', k: 'diet', opts: ['Flexible', 'Non-Vegetarian', 'Vegetarian', 'Vegan'] },
  ];
  const selStep = { title: 'Your Mission 🎯', sub: 'Set the direction. We\'ll handle the plan.', sels: selOpts };

  const allSteps = [...steps, selStep];
  const cur = allSteps[step];
  const isLast = step === allSteps.length - 1;

  const canNext = step === 0
    ? form.name && form.age
    : step === 1
      ? form.height && form.currentWeight && form.targetWeight
      : form.gender && form.goal;

  return (
    <div style={{ position: 'fixed', inset: 0, background: C.bg, zIndex: 200, display: 'flex', flexDirection: 'column', maxWidth: 430, margin: '0 auto', padding: '0 24px', justifyContent: 'center' }}>
      {/* Progress */}
      <div style={{ display: 'flex', gap: 5, marginBottom: 28 }}>
        {allSteps.map((_, i) => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= step ? C.accent : C.s3, transition: 'background 0.3s' }} />
        ))}
      </div>

      <div style={{ fontFamily: fn, fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.muted, marginBottom: 6 }}>
        Step {step + 1} of {allSteps.length}
      </div>
      <div style={{ fontFamily: fn, fontSize: 26, fontWeight: 800, color: C.text, letterSpacing: '-0.02em', marginBottom: 4 }}>{cur.title}</div>
      <div style={{ color: C.sub, fontSize: 13, marginBottom: 24 }}>{cur.sub}</div>

      {cur.fields?.map(f => (
        <div key={f.k} style={{ marginBottom: 14 }}>
          <div style={{ color: C.sub, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 7 }}>{f.l}</div>
          <input type={f.type} value={form[f.k]} onChange={e => sp(f.k, e.target.value)} placeholder={f.p}
            style={{ width: '100%', boxSizing: 'border-box', background: C.s2, border: `1px solid ${C.border}`, borderRadius: 14, padding: '14px 16px', color: C.text, fontSize: 15, fontFamily: fn, outline: 'none', transition: 'border 0.2s' }}
            onFocus={e => e.target.style.borderColor = C.accent} onBlur={e => e.target.style.borderColor = C.border}
          />
        </div>
      ))}

      {cur.sels?.map(s => (
        <div key={s.k} style={{ marginBottom: 16 }}>
          <div style={{ color: C.sub, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>{s.l}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {s.opts.map(o => (
              <button key={o} onClick={() => sp(s.k, o)} style={{
                padding: '8px 14px', borderRadius: 20, border: `1px solid ${form[s.k] === o ? C.accent : C.border}`,
                background: form[s.k] === o ? C.accent : 'transparent', color: form[s.k] === o ? '#111' : C.sub,
                fontFamily: fn, fontWeight: 600, fontSize: 12, cursor: 'pointer',
                boxShadow: form[s.k] === o ? C.accentShadow : 'none', transition: 'all 0.18s',
              }}>{o}</button>
            ))}
          </div>
        </div>
      ))}

      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)} style={{ flex: 1, padding: '14px', background: C.s2, border: `1px solid ${C.border}`, borderRadius: 14, color: C.sub, fontFamily: fn, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>← Back</button>
        )}
        <button onClick={() => {
          if (isLast) onComplete({ ...user, name: form.name || user?.name, profile: form });
          else setStep(s => s + 1);
        }} disabled={!canNext} style={{
          flex: 2, padding: '14px', background: canNext ? C.accent : C.s4, color: canNext ? '#111' : C.muted,
          border: 'none', borderRadius: 14, fontFamily: fn, fontWeight: 800, fontSize: 14,
          cursor: canNext ? 'pointer' : 'not-allowed', boxShadow: canNext ? C.accentShadow : 'none', transition: 'all 0.2s',
        }}>
          {isLast ? 'Let\'s Go 🚀' : 'Next →'}
        </button>
      </div>

      <button onClick={() => onComplete(user)} style={{ marginTop: 16, background: 'none', border: 'none', color: C.muted, fontSize: 12, cursor: 'pointer', fontFamily: fn }}>
        Fill this in later
      </button>
    </div>
  );
}


// ─── Tutorial Overlay (Spotlight) ────────────────────────────────────────────
const TUTORIAL_STEPS = [
  { id: 'welcome',      emoji: '👋', title: 'Welcome to MSG!',             body: "Your personal smart fitness app. Let's take a 30-second tour so you know exactly where everything is.", target: null },
  { id: 'stats',        emoji: '📊', title: 'Your Daily Stats',            body: 'Streak, calories, body weight — updated every day. Your personal health snapshot at a glance.', target: 'tut-stats' },
  { id: 'achievements', emoji: '🏆', title: 'Achievements',                body: 'Tap here to view earned badges and milestones. Unlock new ones by consistently hitting your goals.', target: 'tut-achievements' },
  { id: 'leaderboard',  emoji: '🏅', title: 'Leaderboard — Coming Soon',  body: "Soon you'll be able to compete with friends and climb global fitness ranks.", target: 'tut-leaderboard' },
  { id: 'workout',      emoji: '💪', title: 'Workout',                     body: 'Build your week plan with 140+ exercises across strength, yoga, bands & rehab. Rest timer included.', target: 'tut-tab-workout' },
  { id: 'diet',         emoji: '🥗', title: 'Diet & Water',                body: 'Log any meal in plain language. Track 15 nutrients and set your custom daily water goal in litres.', target: 'tut-tab-diet' },
  { id: 'store',        emoji: '🛒', title: 'Store',                       body: 'Browse products and supplements offered by your gym directly from the app.', target: 'tut-tab-store' },
  { id: 'progress',     emoji: '📈', title: 'Progress',                    body: 'Log weight, body fat & measurements. Charts show your transformation week over week.', target: 'tut-tab-progress' },
  { id: 'profile',      emoji: '👤', title: 'Your Profile',                body: 'Tap your avatar to open achievements, settings, language options, or sign out.', target: 'tut-profile-btn' },
  { id: 'done',         emoji: '🚀', title: "You're all set!",             body: "Your fitness journey starts now. Log your first workout, track a meal, or weigh in — every action builds your streak!", target: null },
];

export function TutorialOverlay({ onDone }) {
  const [step, setStep] = useState(0);
  const [spot, setSpot] = useState(null);  // { top, left, right, bottom, width, height }
  const [above, setAbove] = useState(false);

  const cur    = TUTORIAL_STEPS[step];
  const isLast = step === TUTORIAL_STEPS.length - 1;
  const total  = TUTORIAL_STEPS.length;

  useEffect(() => {
    if (!cur.target) { setSpot(null); return; }
    const PAD = 10;

    const el = document.getElementById(cur.target);
    if (!el) { setSpot(null); return; }

    // Scroll the element into the center of the viewport first
    el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });

    let raf;
    const measure = () => {
      const r = el.getBoundingClientRect();
      const W = window.innerWidth, H = window.innerHeight;
      const s = {
        top:    Math.max(0, r.top    - PAD),
        left:   Math.max(0, r.left   - PAD),
        right:  Math.min(W, r.right  + PAD),
        bottom: Math.min(H, r.bottom + PAD),
      };
      s.width  = s.right  - s.left;
      s.height = s.bottom - s.top;
      setSpot(s);
      setAbove(r.top > H * 0.55);
      raf = requestAnimationFrame(measure);
    };

    raf = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(raf);
  }, [step, cur.target]);

  const W = typeof window !== 'undefined' ? window.innerWidth  : 400;
  const H = typeof window !== 'undefined' ? window.innerHeight : 800;
  const DIM   = 'rgba(0,0,0,0.80)';
  const TRANS = 'all 0.36s cubic-bezier(.4,0,.2,1)';
  const CARD_W = Math.min(W - 32, 340);
  const OFFSET = 18;

  const cardLeft = spot
    ? Math.max(16, Math.min(W - CARD_W - 16, (spot.left + spot.right) / 2 - CARD_W / 2))
    : (W - CARD_W) / 2;
  const cardTop = spot
    ? (above ? Math.max(12, spot.top - OFFSET - 225) : Math.min(H - 270, spot.bottom + OFFSET))
    : Math.max(80, (H - 310) / 2);

  const arrowCenterX = spot ? (spot.left + spot.right) / 2 : W / 2;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, pointerEvents: 'none' }}>
      {spot ? (<>
        {/* 4-rect dim to create spotlight hole */}
        <div style={{ position: 'fixed', top: 0,          left: 0, width: W,                     height: spot.top,              background: DIM, transition: TRANS, pointerEvents: 'auto' }} />
        <div style={{ position: 'fixed', top: spot.bottom, left: 0, width: W,                     height: Math.max(0, H - spot.bottom), background: DIM, transition: TRANS, pointerEvents: 'auto' }} />
        <div style={{ position: 'fixed', top: spot.top,   left: 0, width: spot.left,              height: spot.height,           background: DIM, transition: TRANS, pointerEvents: 'auto' }} />
        <div style={{ position: 'fixed', top: spot.top,   left: spot.right, width: Math.max(0, W - spot.right), height: spot.height, background: DIM, transition: TRANS, pointerEvents: 'auto' }} />

        {/* Spotlight glow ring */}
        <div style={{
          position: 'fixed', zIndex: 501,
          top: spot.top, left: spot.left, width: spot.width, height: spot.height,
          borderRadius: 15, border: `2.5px solid ${C.accent}`,
          boxShadow: `0 0 0 4px ${C.accent}22, 0 0 30px ${C.accent}77`,
          transition: TRANS, pointerEvents: 'none',
        }} />

        {/* Arrow */}
        <div style={{
          position: 'fixed', zIndex: 503,
          left: Math.max(20, Math.min(W - 20, arrowCenterX - 7)),
          top: above ? spot.top - OFFSET - 12 : spot.bottom + OFFSET - 10,
          width: 0, height: 0, pointerEvents: 'none',
          borderLeft: '7px solid transparent', borderRight: '7px solid transparent',
          ...(above ? { borderTop: `10px solid ${C.s2}` } : { borderBottom: `10px solid ${C.s2}` }),
          transition: TRANS,
        }} />
      </>) : (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(3px)', pointerEvents: 'auto' }} />
      )}

      {/* Tooltip card */}
      <div style={{
        position: 'fixed', zIndex: 502, pointerEvents: 'auto',
        top: cardTop, left: cardLeft, width: CARD_W,
        background: C.s2, border: `1.5px solid ${C.accent}44`,
        borderRadius: 20, padding: '20px 20px 16px',
        boxShadow: `0 20px 60px rgba(0,0,0,0.75), 0 0 30px ${C.accent}18`,
        transition: `top ${TRANS}, left ${TRANS}`,
      }}>
        {/* Progress bar */}
        <div style={{ display: 'flex', gap: 3, marginBottom: 14 }}>
          {TUTORIAL_STEPS.map((_, i) => (
            <div key={i} style={{
              flex: i === step ? 2.5 : 1, height: 3, borderRadius: 2,
              background: i <= step ? C.accent : C.s4,
              opacity: i > step ? 0.3 : 1,
              transition: 'all 0.3s ease',
            }} />
          ))}
        </div>

        <div style={{ fontSize: 9, color: C.muted, fontFamily: fb, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
          {step + 1} / {total}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 24, lineHeight: 1 }}>{cur.emoji}</span>
          <div style={{ fontFamily: fn, fontSize: 16, fontWeight: 800, color: C.text, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            {cur.title}
          </div>
        </div>

        <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.65, marginBottom: 16 }}>
          {cur.body}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)} style={{
              background: C.s3, border: `1px solid ${C.border}`, borderRadius: 10,
              padding: '10px 14px', color: C.sub,
              fontFamily: fn, fontWeight: 600, fontSize: 13, cursor: 'pointer', flexShrink: 0,
            }}>←</button>
          )}
          <button onClick={() => isLast ? onDone() : setStep(s => s + 1)} style={{
            flex: 1, background: C.accent, border: 'none', borderRadius: 10,
            padding: '11px', color: '#000',
            fontFamily: fn, fontWeight: 800, fontSize: 13,
            letterSpacing: '0.02em', cursor: 'pointer', boxShadow: C.accentShadow,
          }}>
            {isLast ? "🚀 Let's Go!" : 'Next →'}
          </button>
          {!isLast && (
            <button onClick={onDone} style={{
              background: 'none', border: 'none', color: C.muted,
              fontSize: 11, fontFamily: fn, cursor: 'pointer', padding: '0 4px', flexShrink: 0,
            }}>Skip</button>
          )}
        </div>
      </div>
    </div>
  );
}




