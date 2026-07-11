import { useState, useEffect, useRef } from 'react';
import { C, fn, fb, MC } from '../shared/theme.js';
import { AnatomicalFigure } from '../AnatomicalFigure';
import { API_URL, callClaude } from './memberData.js';
import { Card, Tag, Lbl, Hd, ExCard } from './primitives.jsx';
import { EX } from './constants.js';
import { trackActivity } from '../shared/firebase.js';

// EX array is inlined below via WorkoutSection.jsx extraction â€” do not import// ─── Warmup Block ─────────────────────────────────────────────────────────────
const WARMUP_ROUTINE = [
  { move: 'Light Cardio', detail: '2 min brisk walk or on-the-spot jog', duration: '2 min' },
  { move: 'Arm Circles', detail: '10 forward, 10 backward — both arms', duration: '30s' },
  { move: 'Hip Circles', detail: 'Hands on hips, 10 circles each direction', duration: '30s' },
  { move: 'Leg Swings', detail: '10 front-back, 10 side-side per leg', duration: '1 min' },
  { move: 'Cat-Cow', detail: '10 slow cycles with deep breath — wakes up the spine', duration: '1 min' },
  { move: 'Shoulder Rolls', detail: '10 forward, 10 backward — loosen the shoulder girdle', duration: '30s' },
  { move: 'Squat to Stand', detail: '8 reps — squat down, grab toes, press knees out, stand tall', duration: '1 min' },
  { move: 'Spiderman Lunge', detail: '5 per side — step out, drop hip, reach arm to ceiling', duration: '1 min' },
  { move: 'Inchworm', detail: '6 reps — hinge forward, walk hands to plank, walk back, stand', duration: '1 min' },
  { move: 'Jump Rope / Jumping Jacks', detail: '30 seconds light intensity to elevate heart rate', duration: '30s' },
];

function WarmupBlock() {
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(null); // which item is running
  const [timers, setTimers] = useState(() => WARMUP_ROUTINE.map(w => parseDurSec(w.duration)));
  const [running, setRunning] = useState(false);
  const [autoMode, setAutoMode] = useState(false);
  const ivRef = useRef(null);
  const autoRef = useRef(false);
  const activeRef = useRef(null);

  function parseDurSec(dur) {
    if (!dur) return 60;
    const m = dur.match(/(\d+)\s*min/); const s = dur.match(/(\d+)s/);
    return (m ? parseInt(m[1]) * 60 : 0) + (s ? parseInt(s[1]) : 0) || 60;
  }

  const total = WARMUP_ROUTINE.reduce((a, w) => a + parseDurSec(w.duration), 0);
  const elapsed = WARMUP_ROUTINE.reduce((a, w, i) => a + (parseDurSec(w.duration) - (timers[i] ?? parseDurSec(w.duration))), 0);
  const overallPct = Math.min((elapsed / total) * 100, 100);

  const clearIv = () => clearInterval(ivRef.current);

  const startItem = (idx, auto = false) => {
    clearIv();
    autoRef.current = auto;
    activeRef.current = idx;
    setActiveIdx(idx);
    setRunning(true);
    ivRef.current = setInterval(() => {
      setTimers(prev => {
        const next = [...prev];
        if (next[activeRef.current] <= 1) {
          clearIv();
          setRunning(false);
          if (autoRef.current && activeRef.current < WARMUP_ROUTINE.length - 1) {
            setTimeout(() => startItem(activeRef.current + 1, true), 800);
          } else {
            setAutoMode(false);
          }
          next[activeRef.current] = 0;
          return next;
        }
        next[activeRef.current] = next[activeRef.current] - 1;
        return next;
      });
    }, 1000);
  };

  const pauseItem = () => { clearIv(); setRunning(false); };

  const resetItem = (idx) => {
    if (activeIdx === idx) { clearIv(); setRunning(false); setActiveIdx(null); }
    setTimers(prev => { const n = [...prev]; n[idx] = parseDurSec(WARMUP_ROUTINE[idx].duration); return n; });
  };

  const startAll = () => {
    setTimers(WARMUP_ROUTINE.map(w => parseDurSec(w.duration)));
    setAutoMode(true);
    setTimeout(() => startItem(0, true), 50);
  };

  const resetAll = () => {
    clearIv(); setRunning(false); setActiveIdx(null); setAutoMode(false);
    setTimers(WARMUP_ROUTINE.map(w => parseDurSec(w.duration)));
  };

  useEffect(() => () => clearIv(), []);

  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div style={{ background: `linear-gradient(135deg,${C.s2},${C.s3})`, border: `1px solid ${C.accent}30`, borderLeft: `3px solid ${C.accent}`, borderRadius: '2px 14px 14px 2px', marginBottom: 14, overflow: 'hidden' }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', cursor: 'pointer' }}>
        <div style={{ width: 54, height: 54, borderRadius: 10, background: C.accent + '18', border: `1px solid ${C.accent}30`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 22 }}>🔥</span>
          <div style={{ fontSize: 6, color: C.accent, fontFamily: fb, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2 }}>Warmup</div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: C.accent }}>Full-Body Warmup Routine</div>
          <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>10 movements · 7–10 minutes · Do this before every session</div>
          {open && overallPct > 0 && (
            <div style={{ height: 3, background: C.s4, borderRadius: 2, marginTop: 6 }}>
              <div style={{ height: '100%', width: `${overallPct}%`, background: C.accent, borderRadius: 2, transition: 'width 0.5s linear' }} />
            </div>
          )}
        </div>
        <div style={{ color: open ? C.accent : C.muted, fontSize: 20, flexShrink: 0 }}>{open ? '−' : '+'}</div>
      </div>
      {open && (
        <div style={{ borderTop: `1px solid ${C.border}`, padding: '12px 16px 14px' }}>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 10, lineHeight: 1.5 }}>
            Tap ▶ on each movement or use <strong style={{ color: C.accent }}>Start All</strong> to auto-advance.
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <button onClick={e => { e.stopPropagation(); startAll(); }} style={{ flex: 1, padding: '10px', background: C.accent, border: 'none', borderRadius: 10, color: '#111', fontFamily: fb, fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>▶ Start All</button>
            <button onClick={e => { e.stopPropagation(); resetAll(); }} style={{ padding: '10px 16px', background: C.s4, border: `1px solid ${C.border}`, borderRadius: 10, color: C.sub, fontFamily: fb, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>↺ Reset</button>
          </div>
          {WARMUP_ROUTINE.map((w, i) => {
            const maxSec = parseDurSec(w.duration);
            const rem = timers[i] ?? maxSec;
            const pct = Math.max(0, (rem / maxSec) * 100);
            const isActive = activeIdx === i;
            const isDone = rem === 0;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10, padding: '10px 12px', background: isActive ? C.accent + '12' : isDone ? C.green + '0D' : C.s4, borderRadius: 12, border: `1px solid ${isActive ? C.accent + '44' : isDone ? C.green + '33' : 'transparent'}`, transition: 'all 0.3s' }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: isDone ? C.green + '22' : isActive ? C.accent + '20' : C.s3, border: `1px solid ${isDone ? C.green + '66' : isActive ? C.accent + '66' : C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 10, fontWeight: 800, color: isDone ? C.green : isActive ? C.accent : C.sub }}>
                  {isDone ? '✓' : i + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: isActive ? C.accent : isDone ? C.green : C.text }}>{w.move}</div>
                  <div style={{ fontSize: 11, color: C.sub, marginTop: 2, lineHeight: 1.45 }}>{w.detail}</div>
                  {isActive && (
                    <div style={{ marginTop: 6 }}>
                      <div style={{ height: 3, background: C.s3, borderRadius: 2, overflow: 'hidden', marginBottom: 4 }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: C.accent, borderRadius: 2, transition: 'width 1s linear' }} />
                      </div>
                      <div style={{ fontFamily: fb, fontSize: 20, fontWeight: 800, color: C.accent, lineHeight: 1 }}>{fmt(rem)}</div>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0, alignItems: 'flex-end' }}>
                  {!isActive && !isDone && (
                    <button onClick={e => { e.stopPropagation(); startItem(i, false); }} style={{ background: C.accent + '20', border: `1px solid ${C.accent}44`, borderRadius: 8, padding: '4px 10px', color: C.accent, fontFamily: fb, fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>▶</button>
                  )}
                  {isActive && running && (
                    <button onClick={e => { e.stopPropagation(); pauseItem(); }} style={{ background: C.s3, border: `1px solid ${C.border}`, borderRadius: 8, padding: '4px 10px', color: C.sub, fontFamily: fb, fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>⏸</button>
                  )}
                  {isActive && !running && (
                    <button onClick={e => { e.stopPropagation(); startItem(i, autoRef.current); }} style={{ background: C.accent + '20', border: `1px solid ${C.accent}44`, borderRadius: 8, padding: '4px 10px', color: C.accent, fontFamily: fb, fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>▶</button>
                  )}
                  <button onClick={e => { e.stopPropagation(); resetItem(i); }} style={{ background: 'none', border: 'none', color: C.muted, fontSize: 12, cursor: 'pointer', padding: '2px 6px' }}>↺</button>
                  <div style={{ fontSize: 9, color: isDone ? C.green : isActive ? C.accent : C.muted, fontFamily: fb, fontWeight: 600, whiteSpace: 'nowrap' }}>{isDone ? 'Done!' : isActive ? fmt(rem) : w.duration}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Week Plan Structures ─────────────────────────────────────────────────────
const WEEK_STRUCTURES = {
  3: [
    { day: 'Day 1', focus: 'Full Body A', muscles: ['chest', 'back', 'legs', 'core'] },
    { day: 'Day 2', focus: 'Full Body B', muscles: ['front-delt', 'lateral-delt', 'back', 'legs', 'arms'] },
    { day: 'Day 3', focus: 'Full Body C', muscles: ['chest', 'rear-delt', 'legs', 'core'] },
  ],
  4: [
    { day: 'Day 1', focus: 'Upper Body A — Push', muscles: ['chest', 'front-delt', 'lateral-delt', 'arms'] },
    { day: 'Day 2', focus: 'Lower Body A — Quad Focus', muscles: ['legs', 'calves', 'core'] },
    { day: 'Day 3', focus: 'Upper Body B — Pull', muscles: ['back', 'rear-delt', 'traps', 'arms'] },
    { day: 'Day 4', focus: 'Lower Body B — Posterior Chain', muscles: ['legs', 'glutes', 'core'] },
  ],
  5: [
    { day: 'Day 1', focus: 'Push — Chest & Front Delt', muscles: ['chest', 'front-delt', 'arms'] },
    { day: 'Day 2', focus: 'Pull — Back & Rear Delt', muscles: ['back', 'rear-delt', 'arms'] },
    { day: 'Day 3', focus: 'Legs — Quad, Glute & Calf Focus', muscles: ['legs', 'glutes', 'calves'] },
    { day: 'Day 4', focus: 'Shoulders — Lateral & Traps', muscles: ['lateral-delt', 'rear-delt', 'front-delt', 'traps', 'arms'] },
    { day: 'Day 5', focus: 'Pull + Core', muscles: ['back', 'core', 'forearms'] },
  ],
  6: [
    { day: 'Day 1', focus: 'Push A — Chest & Anterior Delt', muscles: ['chest', 'front-delt', 'arms'] },
    { day: 'Day 2', focus: 'Pull A — Lats & Rear Delt', muscles: ['back', 'rear-delt', 'arms'] },
    { day: 'Day 3', focus: 'Legs A — Squat & Quad', muscles: ['legs', 'calves', 'core'] },
    { day: 'Day 4', focus: 'Push B — Lateral Delt & Traps', muscles: ['lateral-delt', 'front-delt', 'traps', 'arms'] },
    { day: 'Day 5', focus: 'Pull B — Deadlift & Rear Delt', muscles: ['back', 'rear-delt', 'forearms'] },
    { day: 'Day 6', focus: 'Legs B — Hinge, Glute & Calf', muscles: ['legs', 'glutes', 'calves', 'core'] },
  ],
};

// ─── Manual Plan Builder (wger API + local EX fallback) ──────────────────────
function ManualPlanBuilder({ setWeekPlan, onBack }) {
  const WGER_KEY = import.meta.env.VITE_WGER_KEY ?? '';
  const [step, setStep] = useState(0); // 0=pick days, 1=enter exercises
  const [days, setDays] = useState(null);
  const [planDays, setPlanDays] = useState([]); // [{dayName, exercises:[]}]
  const [activeDay, setActiveDay] = useState(0);
  const [exInput, setExInput] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null); // pending exercise to confirm
  const [dayNames] = useState(['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6']);

  const initDays = (n) => {
    setDays(n);
    setPlanDays(Array.from({ length: n }, (_, i) => ({ dayName: `Day ${i + 1}`, focus: '', exercises: [] })));
    setStep(1);
  };

  const searchExercise = async (name) => {
    if (!name.trim()) return;
    setSearching(true); setSearchResult(null);
    // 1. Try wger API
    if (WGER_KEY) {
      try {
        const r = await fetch(
          `https://wger.de/api/v2/exercise/search/?term=${encodeURIComponent(name)}&language=2&format=json`,
          { headers: { Authorization: `Token ${WGER_KEY}` } }
        );
        if (r.ok) {
          const data = await r.json();
          const hit = data.suggestions?.[0];
          if (hit) {
            setSearchResult({
              name: hit.value,
              muscle: hit.data?.category?.name?.toLowerCase() || 'general',
              primary: hit.data?.category?.name || 'General',
              secondary: '',
              equip: 'Any',
              level: 'intermediate',
              sets: 3, reps: '10–12', rest: 60,
              steps: ['Focus on proper form', 'Control the eccentric', 'Full range of motion'],
              tip: 'Use wger.de for full exercise guide',
              source: 'wger',
            });
            setSearching(false); return;
          }
        }
      } catch (_) {}
    }
    // 2. Local EX DB fallback
    const q = name.toLowerCase();
    const found = EX.find(e => e.name.toLowerCase().includes(q) || q.includes(e.name.toLowerCase().split(' ')[0]));
    if (found) { setSearchResult({ ...found, source: 'local' }); }
    else {
      // Generic placeholder
      setSearchResult({
        name: name.trim(), muscle: 'general', primary: 'General', secondary: '',
        equip: 'Any', level: 'intermediate', sets: 3, reps: '10–12', rest: 60,
        steps: ['Focus on proper form', 'Full range of motion', 'Controlled movement'],
        tip: 'No data found — check exercise name',
        source: 'manual',
      });
    }
    setSearching(false);
  };

  const addExercise = (ex, sets, reps) => {
    setPlanDays(prev => prev.map((d, i) => i === activeDay
      ? { ...d, exercises: [...d.exercises, { ...ex, sets: parseInt(sets) || 3, reps: reps || '10–12' }] }
      : d
    ));
    setExInput(''); setSearchResult(null);
  };

  const removeExercise = (dayIdx, exIdx) => {
    setPlanDays(prev => prev.map((d, i) => i === dayIdx
      ? { ...d, exercises: d.exercises.filter((_, j) => j !== exIdx) }
      : d
    ));
  };

  const savePlan = () => {
    const plan = planDays.map(d => ({
      day: d.dayName, focus: d.focus || d.dayName, duration: '45–60 min',
      exercises: d.exercises,
    }));
    setWeekPlan(plan);
  };

  if (step === 0) return (
    <div style={{ padding: '0 16px' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: C.muted, fontSize: 13, cursor: 'pointer', fontFamily: fn, marginBottom: 16, padding: 0 }}>← Back</button>
      <div style={{ fontFamily: fn, fontSize: 20, fontWeight: 800, color: C.text, letterSpacing: '-0.02em', marginBottom: 6 }}>How many training days?</div>
      <div style={{ fontSize: 13, color: C.sub, marginBottom: 20 }}>We'll create a day-by-day template for you to fill in.</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[3, 4, 5, 6].map(n => (
          <button key={n} onClick={() => initDays(n)} className="msg-anim-fadeup" style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '16px 18px', background: C.s2, border: `1px solid ${C.border}`,
            borderRadius: 14, cursor: 'pointer', textAlign: 'left',
            animationDelay: `${(n - 3) * 0.06}s`,
          }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{n} Days / Week</div>
              <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>{n === 3 ? 'Full Body' : n === 4 ? 'Upper / Lower' : n === 5 ? 'Push Pull Legs' : 'PPL × 2'}</div>
            </div>
            <div style={{ color: C.accent, fontSize: 18 }}>→</div>
          </button>
        ))}
      </div>
    </div>
  );

  const curDay = planDays[activeDay] || { exercises: [] };

  return (
    <div style={{ padding: '0 16px' }}>
      {/* Day tabs */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 6, marginBottom: 14 }}>
        {planDays.map((d, i) => (
          <button key={i} onClick={() => { setActiveDay(i); setSearchResult(null); setExInput(''); }} style={{
            flexShrink: 0, padding: '10px 14px',
            background: activeDay === i ? C.accent : C.s2,
            border: `1px solid ${activeDay === i ? C.accent : C.border}`,
            borderRadius: 12, color: activeDay === i ? '#000' : C.sub,
            fontFamily: fn, fontWeight: 700, fontSize: 10, cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 80
          }}>
            <span>{d.dayName.toUpperCase()}</span>
            <span style={{ fontSize: 9, opacity: activeDay === i ? 0.8 : 0.5, fontWeight: 500, textTransform: 'capitalize' }}>
              {(d.focus || 'Split').split('—')[0].trim()}
            </span>
          </button>
        ))}
      </div>

      {/* Day focus label */}
      <input value={curDay.focus} onChange={e => setPlanDays(p => p.map((d, i) => i === activeDay ? { ...d, focus: e.target.value } : d))}
        placeholder={`e.g. Chest & Triceps`}
        style={{ width: '100%', boxSizing: 'border-box', background: C.s2, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 12px', color: C.text, fontSize: 13, fontFamily: fn, outline: 'none', marginBottom: 12 }}
      />

      {/* Exercise search */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input value={exInput} onChange={e => setExInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && searchExercise(exInput)}
          placeholder="Type exercise name…"
          style={{ flex: 1, background: C.s2, border: `1px solid ${C.border}`, borderRadius: 10, padding: '11px 12px', color: C.text, fontSize: 13, fontFamily: fn, outline: 'none' }}
        />
        <button onClick={() => searchExercise(exInput)} disabled={searching || !exInput.trim()} style={{
          background: C.accent, border: 'none', borderRadius: 10, padding: '0 16px',
          color: '#000', fontFamily: fn, fontWeight: 700, fontSize: 12, cursor: 'pointer',
          opacity: !exInput.trim() ? 0.4 : 1,
        }}>{searching ? '…' : 'Find'}</button>
      </div>

      {/* Search result — confirm card */}
      {searchResult && <ExerciseConfirmCard ex={searchResult} onAdd={addExercise} onDismiss={() => setSearchResult(null)} />}

      {/* Current day exercises */}
      <div style={{ marginBottom: 16 }}>
        {curDay.exercises.length === 0 && !searchResult && (
          <div style={{ color: C.muted, fontSize: 12, textAlign: 'center', padding: '18px 0', border: `1px dashed ${C.border}`, borderRadius: 12 }}>
            No exercises yet — search to add one
          </div>
        )}
        {curDay.exercises.map((ex, i) => (
          <div key={i} className="msg-anim-fadeup" style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 13px',
            background: C.s2, border: `1px solid ${C.border}`, borderRadius: 12, marginBottom: 8,
            animationDelay: `${i * 0.04}s`,
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{ex.name}</div>
              <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>{ex.sets} sets × {ex.reps} · {ex.primary}</div>
            </div>
            <button onClick={() => removeExercise(activeDay, i)} style={{ background: 'none', border: 'none', color: C.red, fontSize: 16, cursor: 'pointer', padding: '4px' }}>✕</button>
          </div>
        ))}
      </div>

      {/* Save plan button */}
      <button onClick={() => {
        savePlan();
        if (user?.uid && gymId && user.uid !== 'demo') {
          trackActivity(user.uid, gymId, 'workout');
        }
      }} disabled={planDays.every(d => d.exercises.length === 0)} style={{
        width: '100%', padding: '14px', marginBottom: 20,
        background: planDays.some(d => d.exercises.length > 0) ? C.accent : C.s4,
        color: planDays.some(d => d.exercises.length > 0) ? '#000' : C.muted,
        border: 'none', borderRadius: 12, fontFamily: fn, fontWeight: 800, fontSize: 14, cursor: 'pointer',
      }}>
        Save My Plan ({planDays.filter(d => d.exercises.length > 0).length}/{days} days ready)
      </button>
    </div>
  );
}

// Confirm card for wger/local exercise result
function ExerciseConfirmCard({ ex, onAdd, onDismiss }) {
  const [sets, setSets] = useState('3');
  const [reps, setReps] = useState(ex.reps || '10–12');
  const mc = MC[ex.muscle] || C.accent;
  return (
    <div className="msg-anim-scalein" style={{ background: C.s2, border: `2px solid ${mc}44`, borderLeft: `3px solid ${mc}`, borderRadius: '2px 14px 14px 2px', padding: '14px', marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{ex.name}</div>
          <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>{ex.primary}{ex.secondary ? ` · ${ex.secondary}` : ''} · {ex.equip}</div>
        </div>
        <span style={{ fontSize: 9, background: mc + '20', color: mc, padding: '2px 8px', borderRadius: 4, fontFamily: fb, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {ex.source === 'wger' ? 'wger' : ex.source === 'local' ? 'Library' : 'Custom'}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 9, color: C.muted, fontFamily: fb, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>Sets</div>
          <input value={sets} onChange={e => setSets(e.target.value)} type="number" min="1" max="10"
            style={{ width: '100%', background: C.s3, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 10px', color: C.text, fontSize: 14, fontFamily: fn, outline: 'none', textAlign: 'center' }} />
        </div>
        <div style={{ flex: 2 }}>
          <div style={{ fontSize: 9, color: C.muted, fontFamily: fb, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>Reps</div>
          <input value={reps} onChange={e => setReps(e.target.value)}
            style={{ width: '100%', background: C.s3, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 10px', color: C.text, fontSize: 13, fontFamily: fn, outline: 'none' }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onDismiss} style={{ flex: 1, padding: '10px', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 10, color: C.muted, fontFamily: fn, fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>Dismiss</button>
        <button onClick={() => onAdd(ex, sets, reps)} style={{ flex: 2, padding: '10px', background: mc, border: 'none', borderRadius: 10, color: '#111', fontFamily: fn, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>+ Add to Day</button>
      </div>
    </div>
  );
}

// ─── Explore Section (Muscle Map) ────────────────────────────────────────────
function ExploreSection() {
  const [muscleView, setMuscleView] = useState('front');
  const [selectedMuscle, setSelectedMuscle] = useState(null);

  const MUSCLE_GROUPS = [
    { key: 'chest', label: 'Chest', view: 'front' },
    { key: 'shoulders', label: 'Shoulders', view: 'front' },
    { key: 'biceps', label: 'Biceps', view: 'front' },
    { key: 'abs', label: 'Abs', view: 'front' },
    { key: 'quads', label: 'Quads', view: 'front' },
    { key: 'traps', label: 'Traps', view: 'back' },
    { key: 'lats', label: 'Lats', view: 'back' },
    { key: 'triceps', label: 'Triceps', view: 'back' },
    { key: 'hamstrings', label: 'Hamstrings', view: 'back' },
    { key: 'glutes', label: 'Glutes', view: 'back' },
    { key: 'calves', label: 'Calves', view: 'back' },
    { key: 'lower_back', label: 'Lower Back', view: 'back' },
  ];

  const muscleExercises = selectedMuscle
    ? EX.filter(e => e.muscle === selectedMuscle && e.cat === 'strength').slice(0, 8)
    : [];

  const handleMuscleClick = (muscle) => {
    const group = MUSCLE_GROUPS.find(g => g.key === muscle);
    if (group) {
      setMuscleView(group.view);
      setSelectedMuscle(prev => prev === muscle ? null : muscle);
    }
  };

  const isMainGroupActive = (m) => m === selectedMuscle;

  return (
    <div style={{ padding: '0 16px 24px' }}>
      {/* View toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['front', 'back'].map(v => (
          <button key={v} onClick={() => setMuscleView(v)} style={{
            flex: 1, padding: '10px', borderRadius: 12,
            background: muscleView === v ? C.accent : C.s2,
            border: `1px solid ${muscleView === v ? C.accent : C.border}`,
            color: muscleView === v ? '#000' : C.sub,
            fontFamily: fn, fontWeight: 700, fontSize: 12, cursor: 'pointer',
            textTransform: 'capitalize',
          }}>{v} View</button>
        ))}
      </div>

      {/* Anatomical Figure */}
      <div style={{
        background: C.s1, borderRadius: 20, border: `1px solid ${C.border}`,
        padding: '12px', marginBottom: 16, position: 'relative',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        minHeight: 260,
      }}>
        <div style={{ width: '100%', maxWidth: 200, height: 260 }}>
          <AnatomicalFigure
            view={muscleView}
            muscle={selectedMuscle}
            onMuscleClick={handleMuscleClick}
            isMainGroupActive={isMainGroupActive}
          />
        </div>
        {!selectedMuscle && (
          <div style={{
            position: 'absolute', bottom: 12, left: 0, right: 0,
            textAlign: 'center', fontSize: 11, color: C.muted, fontFamily: fn,
          }}>Tap a muscle to explore exercises</div>
        )}
      </div>

      {/* Muscle chip list */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
        {MUSCLE_GROUPS.filter(g => g.view === muscleView).map(g => (
          <button key={g.key} onClick={() => setSelectedMuscle(prev => prev === g.key ? null : g.key)} style={{
            padding: '6px 12px', borderRadius: 20,
            background: selectedMuscle === g.key ? C.accent + '20' : C.s2,
            border: `1px solid ${selectedMuscle === g.key ? C.accent : C.border}`,
            color: selectedMuscle === g.key ? C.accent : C.sub,
            fontFamily: fn, fontWeight: 600, fontSize: 11, cursor: 'pointer',
          }}>{g.label}</button>
        ))}
      </div>

      {/* Exercise list for selected muscle */}
      {selectedMuscle && (
        <>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, fontFamily: fn, marginBottom: 10, textTransform: 'capitalize' }}>
            {selectedMuscle} Exercises <span style={{ color: C.muted, fontWeight: 500, fontSize: 12 }}>({muscleExercises.length})</span>
          </div>
          {muscleExercises.length === 0 ? (
            <div style={{ color: C.muted, fontSize: 13, textAlign: 'center', padding: 20 }}>No exercises found for this muscle</div>
          ) : muscleExercises.map((ex, i) => <ExCard key={i} ex={ex} />)}
        </>
      )}
    </div>
  );
}

// ─── Workout Section ─────────────────────────────────────────────────────────
export default function WorkoutSection({ weekPlan, setWeekPlan }) {
  const [planMode, setPlanMode] = useState(null); // null | 'ai' | 'manual'

  // Wizard state
  const [wStep, setWStep] = useState(0);
  const [days, setDays] = useState(null);
  const [goal, setGoal] = useState('');
  const [level, setLevel] = useState('');
  const [equip, setEquip] = useState('');
  const [injury, setInjury] = useState(null);
  const [injuryArea, setInjuryArea] = useState('');
  const [injuryTyping, setInjuryTyping] = useState(false);

  // Plan state — weekPlan now lives in App root (passed as prop)
  const [loading, setLoading] = useState(false);
  const [activeDay, setActiveDay] = useState(0);

  // View state
  const [view, setView] = useState('plan');
  const [libMuscle, setLibMuscle] = useState('all');
  const [libCat, setLibCat] = useState('strength');
  const [filter, setFilter] = useState('all');
  const [libSearch, setLibSearch] = useState('');

  const resetWizard = () => {
    setWStep(0); setDays(null); setGoal(''); setLevel(''); setEquip('');
    setInjury(null); setInjuryArea(''); setInjuryTyping(false);
    setActiveDay(0);
    // Note: weekPlan is NOT cleared here — use Settings > Reset Workout Plan
  };

  // Build fallback plan from local EX database

  const buildFallbackPlan = (daysN, goalV, levelV, equipV, injuryV) => {
    const struct = WEEK_STRUCTURES[daysN] || WEEK_STRUCTURES[4];
    const shuffle = arr => [...arr].sort(() => Math.random() - 0.5);
    return struct.map(d => {
      let pool = EX.filter(e => (e.cat === 'strength' || e.cat === 'bands' || e.cat === 'rehab') && d.muscles.includes(e.muscle));
      if (injuryV) pool = pool.filter(e => e.level === 'beginner');
      if (equipV === 'bodyweight') pool = pool.filter(e => e.equip === 'Bodyweight');
      else if (equipV === 'dumbbell') pool = pool.filter(e => ['Dumbbell', 'Bodyweight'].includes(e.equip));
      else if (equipV === 'barbell') pool = pool.filter(e => ['Barbell', 'Dumbbell', 'Bodyweight'].includes(e.equip));
      if (levelV === 'foundation') {
        // Try foundation-only first; if fewer than 3 exercises, fall back to beginner for that day
        const fPool = pool.filter(e => e.level === 'foundation');
        pool = fPool.length >= 3 ? fPool : pool.filter(e => ['foundation', 'beginner'].includes(e.level));
      } else if (levelV === 'beginner') pool = pool.filter(e => e.level === 'beginner');
      else if (levelV === 'intermediate') pool = pool.filter(e => ['beginner', 'intermediate'].includes(e.level));
      // Pick 1–2 per muscle group proportionally then fill to 5
      const byMuscle = {};
      pool.forEach(e => { if (!byMuscle[e.muscle]) byMuscle[e.muscle] = []; byMuscle[e.muscle].push(e); });
      let exercises = [];
      d.muscles.forEach(m => {
        const group = byMuscle[m] ? shuffle(byMuscle[m]) : [];
        const quota = d.muscles.length <= 2 ? 2 : 1;
        exercises.push(...group.slice(0, quota));
      });
      // If still under 5, fill with shuffled leftovers
      if (exercises.length < 5) {
        const used = new Set(exercises.map(e => e.name));
        const extras = shuffle(pool.filter(e => !used.has(e.name)));
        exercises.push(...extras.slice(0, 5 - exercises.length));
      }
      exercises = exercises.slice(0, 6);
      return { day: d.day, focus: d.focus, duration: goalV === 'fat loss' ? '40–50 min' : '50–60 min', exercises };
    });
  };

  const generatePlan = async () => {
    setLoading(true); setWeekPlan(null);
    const hasInjury = injury && injuryArea;
    const injuryNote = hasInjury ? `User has an injury: ${injuryArea}. Avoid exercises stressing this area.` : '';
    const struct = WEEK_STRUCTURES[days] || WEEK_STRUCTURES[4];
    const dayList = struct.map(d => `${d.day} (${d.focus}): target muscles [${d.muscles.join(', ')}]`).join(' | ');

    // Build a compact exercise catalogue for AI to pick from
    const catalogue = EX
      .filter(e => e.cat === 'strength')
      .filter(e => {
        if (equip === 'bodyweight') return e.equip === 'Bodyweight';
        if (equip === 'dumbbell')   return ['Dumbbell','Bodyweight'].includes(e.equip);
        if (equip === 'barbell')    return ['Barbell','Dumbbell','Bodyweight'].includes(e.equip);
        return true; // full gym
      })
      .filter(e => {
        if (level === 'foundation') return e.level === 'foundation';
        if (level === 'beginner') return e.level === 'beginner';
        if (level === 'intermediate') return ['beginner','intermediate'].includes(e.level);
        return true;
      })
      .map(e => `${e.name}|${e.muscle}`);
    const catalogueStr = catalogue.join(', ');

    try {
      const sys = `You are an expert personal trainer. Return ONLY valid JSON, no markdown. Schema: {"week_plan":[{"day":"string","focus":"string","duration":"string","exercises":["exercise_name"]}]}. Pick exercise names ONLY from the provided catalogue. Each exercise name must exactly match the catalogue.`;
      const prompt = `Catalogue (name|muscle): ${catalogueStr}\n\nCreate a ${days}-day ${goal} plan for a ${level} using ${equip}. Plan: ${dayList}. Pick 5-6 exercises per day. Ensure each target muscle gets at least one exercise. ${injuryNote} Return ONLY the JSON.`;
      const text = await callClaude(sys, prompt);
      const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());

      // Enrich exercise names with full local DB data
      const byName = {};
      EX.forEach(e => { byName[e.name.toLowerCase()] = e; });
      const enriched = parsed.week_plan.map(d => ({
        ...d,
        exercises: (d.exercises || []).map(nameOrObj => {
          const name = typeof nameOrObj === 'string' ? nameOrObj : nameOrObj.name;
          const local = byName[name?.toLowerCase()];
          if (local) return local;
          // AI gave us a name not in DB — use AI object data if available
          if (typeof nameOrObj === 'object') return nameOrObj;
          // Last resort: create minimal shell so ExCard doesn't crash
          return { name, muscle: 'general', primary: name, secondary: '', equip: equip === 'bodyweight' ? 'Bodyweight' : 'Any', level, sets: 3, reps: '10-12', rest: 60, steps: ['Focus on controlled movement', 'Full range of motion', 'Keep core braced'], tip: 'Perform with proper form.' };
        }).filter(Boolean),
      }));
      setWeekPlan(enriched);
    } catch {
      setWeekPlan(buildFallbackPlan(days, goal, level, equip, hasInjury ? injuryArea : null));
    }
    setLoading(false);
    setActiveDay(0);
  };

  const wizardSteps = [
    {
      q: 'How many days per week can you train?',
      sub: 'Be realistic — consistency beats intensity',
      field: 'days',
      opts: [
        { label: '3 Days', sub: 'Full Body — Perfect for beginners', val: 3 },
        { label: '4 Days', sub: 'Upper / Lower Split', val: 4 },
        { label: '5 Days', sub: 'Push / Pull / Legs', val: 5 },
        { label: '6 Days', sub: 'PPL ×2 — Advanced', val: 6 },
      ],
    },
    {
      q: 'What is your primary training goal?',
      sub: 'This shapes volume, intensity, and rest periods',
      field: 'goal',
      opts: [
        { label: 'Muscle Gain', sub: 'Hypertrophy — size and definition', val: 'muscle gain' },
        { label: 'Fat Loss', sub: 'Maintain muscle, burn fat', val: 'fat loss' },
        { label: 'Strength', sub: 'Progressive overload, heavier lifts', val: 'strength' },
        { label: 'Endurance', sub: 'Conditioning and stamina', val: 'endurance' },
      ],
    },
    {
      q: 'What is your training experience level?',
      sub: 'Be honest — beginners grow fastest with less',
      field: 'level',
      opts: [
        { label: '🌱 Foundation', sub: 'Can\'t yet do push-ups or squats — starting from zero', val: 'foundation' },
        { label: 'Beginner', sub: 'Under 1 year of consistent training', val: 'beginner' },
        { label: 'Intermediate', sub: '1–3 years, solid form on basics', val: 'intermediate' },
        { label: 'Advanced', sub: '3+ years, knows periodisation', val: 'advanced' },
      ],
    },
    {
      q: 'What equipment do you have access to?',
      sub: 'We\'ll build your plan around what\'s available',
      field: 'equip',
      opts: [
        { label: 'Full Gym', sub: 'Barbells, cables, machines — everything', val: 'full gym' },
        { label: 'Dumbbells', sub: 'Adjustable or fixed DBs + bench', val: 'dumbbell' },
        { label: 'Barbell', sub: 'Barbell + plates + rack', val: 'barbell' },
        { label: 'Bodyweight', sub: 'No equipment — home or outdoor', val: 'bodyweight' },
      ],
    },
  ];

  const curStep = wizardSteps[wStep];
  const totalWizardSteps = wizardSteps.length + 1; // +1 for injury step

  const progressPct = weekPlan ? 100 : (wStep / totalWizardSteps) * 100;

  // ── Injury step (step 4) ──
  const renderInjuryStep = () => (
    <div>
      <div style={{ fontFamily: fn, fontSize: 20, fontWeight: 800, color: C.text, letterSpacing: '-0.02em', marginBottom: 6 }}>Any injuries or limitations?</div>
      <div style={{ fontSize: 13, color: C.sub, marginBottom: 20, lineHeight: 1.5 }}>We'll adjust intensity and substitute exercises to protect you.</div>
      {injury === null && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { label: 'No injuries', sub: 'I can train freely', val: false, icon: '✅' },
            { label: 'Yes, I have an injury', sub: 'Tell us what area to protect', val: true, icon: '🩺' },
          ].map(opt => (
            <button key={String(opt.val)} onClick={() => { if (opt.val) setInjuryTyping(true); else { setInjury(false); generatePlan(); } }} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px',
              background: C.s2, border: `1px solid ${C.border}`, borderRadius: 14, cursor: 'pointer', textAlign: 'left',
            }}>
              <span style={{ fontSize: 24 }}>{opt.icon}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{opt.label}</div>
                <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>{opt.sub}</div>
              </div>
            </button>
          ))}
        </div>
      )}
      {injuryTyping && (
        <div>
          <div style={{ fontSize: 13, color: C.sub, marginBottom: 10 }}>Describe the injury / area to avoid (e.g. "left knee", "lower back", "right shoulder rotator cuff"):</div>
          <textarea value={injuryArea} onChange={e => setInjuryArea(e.target.value)} rows={3} placeholder="e.g. Lower back disc issue, avoid heavy deadlifts and squats..."
            style={{ width: '100%', boxSizing: 'border-box', background: C.s2, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 14px', color: C.text, fontSize: 13, fontFamily: fn, outline: 'none', resize: 'none', marginBottom: 14 }} />
          <button onClick={() => { setInjury(injuryArea || 'general'); generatePlan(); }} disabled={!injuryArea.trim()} style={{
            width: '100%', background: injuryArea.trim() ? C.accent : C.s4, color: injuryArea.trim() ? '#000' : C.muted,
            border: 'none', borderRadius: 12, padding: 14, fontFamily: fn, fontWeight: 700, fontSize: 13, cursor: injuryArea.trim() ? 'pointer' : 'not-allowed',
          }}>Build Injury-Safe Plan →</button>
        </div>
      )}
    </div>
  );

  // ── Main render ──
  return (
    <div>
      <Hd t="Workout" s="Week Plan · Library · Execute" />
      <div style={{ padding: '0 16px', display: 'flex', gap: 6, marginBottom: 16 }}>
        {[['plan', 'Week Plan'], ['library', 'Exercise Library'], ['explore', 'Muscle Map']].map(([k, l]) => (
          <button key={k} onClick={() => setView(k)} style={{
            flex: 1, padding: '10px 6px', background: view === k ? C.accent : C.s2,
            border: `1px solid ${view === k ? C.accent : C.border}`, borderRadius: 10,
            color: view === k ? '#000' : C.sub, fontFamily: fn, fontWeight: 700, fontSize: 10.5,
            letterSpacing: '0.03em', textTransform: 'uppercase', cursor: 'pointer',
          }}>{l}</button>
        ))}
      </div>

      {/* ── PLAN TAB ── */}
      {view === 'plan' && (
        <div style={{ padding: '0 16px' }}>

          {/* Manual Plan Builder */}
          {!weekPlan && planMode === 'manual' && (
            <ManualPlanBuilder setWeekPlan={setWeekPlan} onBack={() => setPlanMode(null)} />
          )}

          {/* Two-path landing — shown when no plan AND no mode selected */}
          {!weekPlan && !loading && planMode === null && (
            <div>
              <div style={{ fontFamily: fn, fontSize: 20, fontWeight: 800, color: C.text, letterSpacing: '-0.02em', marginBottom: 6 }}>Create Your Workout Plan</div>
              <div style={{ fontSize: 13, color: C.sub, marginBottom: 20, lineHeight: 1.5 }}>Choose how you want to build your week.</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button onClick={() => setPlanMode('ai')} className="msg-anim-fadeup" style={{
                  padding: '20px 18px', background: `linear-gradient(135deg, ${C.accent}20, ${C.accent}08)`,
                  border: `1px solid ${C.accent}44`, borderRadius: 18, cursor: 'pointer', textAlign: 'left',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>🤖</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: C.accent, marginBottom: 4 }}>Build with AI</div>
                  <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.5 }}>Answer a few questions — get a personalized week plan generated for you. Best for beginners.</div>
                </button>
                <button onClick={() => setPlanMode('manual')} className="msg-anim-fadeup msg-d2" style={{
                  padding: '20px 18px', background: C.s2,
                  border: `1px solid ${C.border}`, borderRadius: 18, cursor: 'pointer', textAlign: 'left',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 4 }}>Enter My Plan</div>
                  <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.5 }}>Already have a routine? Type in your exercises — we auto-fill the details using the exercise database.</div>
                </button>
              </div>
            </div>
          )}

          {/* AI Wizard — before plan is generated */}
          {!weekPlan && !loading && planMode === 'ai' && (
            <div>
              <button onClick={() => { setPlanMode(null); resetWizard(); }} style={{ background: 'none', border: 'none', color: C.muted, fontSize: 13, cursor: 'pointer', fontFamily: fn, marginBottom: 16, padding: 0 }}>← Back</button>

              {/* Progress bar */}
              <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
                {Array.from({ length: totalWizardSteps }).map((_, i) => (
                  <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < wStep ? C.accent : i === wStep ? C.accent + '60' : C.s4, transition: 'background 0.3s' }} />
                ))}
              </div>

              {wStep < wizardSteps.length ? (
                <>
                  <div style={{ fontFamily: fn, fontSize: 20, fontWeight: 800, color: C.text, letterSpacing: '-0.02em', marginBottom: 6 }}>{curStep.q}</div>
                  <div style={{ fontSize: 13, color: C.sub, marginBottom: 20, lineHeight: 1.5 }}>{curStep.sub}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {curStep.opts.map(opt => {
                      const isActive = (curStep.field === 'days' && days === opt.val) || (curStep.field === 'goal' && goal === opt.val) || (curStep.field === 'level' && level === opt.val) || (curStep.field === 'equip' && equip === opt.val);
                      return (
                        <button key={String(opt.val)} onClick={() => {
                          if (curStep.field === 'days') setDays(opt.val);
                          if (curStep.field === 'goal') setGoal(opt.val);
                          if (curStep.field === 'level') setLevel(opt.val);
                          if (curStep.field === 'equip') setEquip(opt.val);
                          setWStep(s => s + 1);
                        }} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px',
                          background: isActive ? C.accent + '18' : C.s2,
                          border: `1px solid ${isActive ? C.accent : C.border}`, borderRadius: 14, cursor: 'pointer', textAlign: 'left',
                        }}>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: isActive ? C.accent : C.text }}>{opt.label}</div>
                            <div style={{ fontSize: 11, color: C.sub, marginTop: 3 }}>{opt.sub}</div>
                          </div>
                          {isActive && <div style={{ color: C.accent, fontSize: 16 }}>✓</div>}
                        </button>
                      );
                    })}
                  </div>
                  {wStep > 0 && (
                    <button onClick={() => setWStep(s => s - 1)} style={{ width: '100%', marginTop: 14, padding: '11px', background: 'none', border: `1px solid ${C.border}`, borderRadius: 10, color: C.muted, fontFamily: fn, fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>← Back</button>
                  )}
                </>
              ) : renderInjuryStep()}
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: 36, marginBottom: 16 }}>⚡</div>
              <div style={{ fontFamily: fn, fontWeight: 800, fontSize: 18, color: C.accent, marginBottom: 8 }}>Building Your {days}-Day Plan</div>
              <div style={{ color: C.sub, fontSize: 13, lineHeight: 1.5 }}>AI is designing your personalised week…{injury ? ' accounting for your injury' : ''}</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: C.accent, opacity: 0.4 + (i * 0.3), animation: 'none' }} />
                ))}
              </div>
            </div>
          )}

          {/* Week plan rendered */}
          {weekPlan && !loading && (
            <>
              {/* Plan header */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontFamily: fn, fontWeight: 800, fontSize: 18, color: C.text, letterSpacing: '-0.02em' }}>{weekPlan.length}-Day Training Plan</div>
                  <div style={{ fontSize: 12, color: C.sub, marginTop: 3 }}>
                    {level} · {equip}{injury ? ` · 🩺 Injury-safe (${typeof injury === 'string' ? injury.slice(0, 30) : 'adjusted'})` : ''}
                  </div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>To change this plan, go to ⚙️ Settings → Reset Workout Plan</div>
                </div>

                {/* Day tabs */}
                <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 6 }}>
                  {weekPlan.map((d, i) => (
                    <button key={i} onClick={() => setActiveDay(i)} style={{
                      flexShrink: 0, padding: '10px 14px',
                      background: activeDay === i ? C.accent : C.s2,
                      border: `1px solid ${activeDay === i ? C.accent : C.border}`, borderRadius: 12,
                      color: activeDay === i ? '#000' : C.sub,
                      fontFamily: fn, fontWeight: 700, fontSize: 10, cursor: 'pointer', whiteSpace: 'nowrap',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 80
                    }}>
                      <span>{d.day.toUpperCase()}</span>
                      <span style={{ fontSize: 9, opacity: activeDay === i ? 0.8 : 0.5, fontWeight: 500, textTransform: 'capitalize' }}>
                        {(d.focus || 'Rest').split('—')[0].split(' - ')[0].trim()}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Active day */}
              {weekPlan[activeDay] && (() => {
                const d = weekPlan[activeDay];
                return (
                  <div>
                    <div style={{ background: C.s2, border: `1px solid ${C.border}`, borderRadius: 14, padding: '12px 16px', marginBottom: 14 }}>
                      <div style={{ fontFamily: fn, fontWeight: 800, fontSize: 16, color: C.text, letterSpacing: '-0.01em' }}>{d.focus || d.day}</div>
                      <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                        <span style={{ fontSize: 10, color: C.sub, background: C.s3, padding: '2px 8px', borderRadius: 4 }}>⏱ {d.duration || '50–60 min'}</span>
                        <span style={{ fontSize: 10, color: C.sub, background: C.s3, padding: '2px 8px', borderRadius: 4 }}>💪 {(d.exercises || []).length} exercises</span>
                        {injury && <span style={{ fontSize: 10, color: C.orange, background: C.orange + '18', padding: '2px 8px', borderRadius: 4 }}>🩺 Low impact</span>}
                      </div>
                    </div>

                    {/* Single warmup block */}
                    <WarmupBlock />

                    {/* Exercises */}
                    {(d.exercises || []).map((ex, i) => <ExCard key={i} ex={ex} />)}

                    {/* Day nav */}
                    <div style={{ display: 'flex', gap: 8, marginTop: 6, marginBottom: 20 }}>
                      {activeDay > 0 && (
                        <button onClick={() => setActiveDay(a => a - 1)} style={{ flex: 1, padding: 12, background: C.s2, border: `1px solid ${C.border}`, borderRadius: 10, color: C.sub, fontFamily: fn, fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>← Prev Day</button>
                      )}
                      {activeDay < weekPlan.length - 1 && (
                        <button onClick={() => setActiveDay(a => a + 1)} style={{ flex: 1, padding: 12, background: C.accent + '18', border: `1px solid ${C.accent}44`, borderRadius: 10, color: C.accent, fontFamily: fn, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Next Day →</button>
                      )}
                    </div>
                  </div>
                );
              })()}
            </>
          )}
        </div>
      )}

      {/* ── LIBRARY TAB ── */}
      {view === 'library' && (
        <div style={{ padding: '0 16px' }}>
          {(() => {
            const CATS = [
              { key: 'strength', label: '💪 Strength', color: C.blue },
              { key: 'bands', label: '🔴 Bands', color: C.orange },
              { key: 'pilates', label: '🪷 Pilates', color: '#c084fc' },
              { key: 'yoga', label: '🧘 Yoga', color: C.purple },
              { key: 'stretch', label: '🤸 Stretch', color: C.teal },
              { key: 'recovery', label: '🛁 Recovery', color: C.green },
              { key: 'rehab', label: '🩺 Rehab', color: C.red },
            ];
            const catColor = CATS.find(c => c.key === libCat)?.color || C.accent;

            // Search mode: filter all EX by name/primary/secondary/muscle
            const searchQ = libSearch.trim().toLowerCase();
            const searchResults = searchQ.length >= 2
              ? EX.filter(e => {
                  const haystack = `${e.name} ${e.muscle} ${e.primary} ${e.secondary || ''}`.toLowerCase();
                  return haystack.includes(searchQ);
                })
              : null;

            const catExs = EX.filter(e => e.cat === libCat && (filter === 'all' || e.level === filter));
            const muscles = ['all', ...new Set(EX.filter(e => e.cat === libCat).map(e => e.muscle))];
            return (
              <>
                {/* Search bar */}
                <div style={{ position: 'relative', marginBottom: 12 }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, opacity: 0.4 }}>🔍</span>
                  <input
                    value={libSearch}
                    onChange={e => setLibSearch(e.target.value)}
                    placeholder="Search by exercise, muscle, upper chest…"
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      background: C.s2, border: `1px solid ${libSearch ? C.accent : C.border}`,
                      borderRadius: 12, padding: '11px 14px 11px 36px',
                      color: C.text, fontSize: 13, fontFamily: 'Barlow,sans-serif', outline: 'none',
                    }}
                  />
                  {libSearch && (
                    <button onClick={() => setLibSearch('')} style={{
                      position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', color: C.muted, fontSize: 16, cursor: 'pointer', lineHeight: 1,
                    }}>×</button>
                  )}
                </div>

                {/* Search results view */}
                {searchResults ? (
                  <>
                    <div style={{ color: C.sub, fontSize: 11, fontFamily: fn, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                      {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{libSearch}"
                    </div>
                    {searchResults.length === 0
                      ? <div style={{ color: C.muted, fontSize: 13, textAlign: 'center', padding: 24 }}>No exercises found — try a different term</div>
                      : searchResults.map((ex, i) => <ExCard key={i} ex={ex} />)
                    }
                  </>
                ) : (
                  <>
                    {/* Category tabs */}
                    <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 6, marginBottom: 12, scrollbarWidth: 'none' }}>
                      {CATS.map(c => (
                        <button key={c.key} onClick={() => { setLibCat(c.key); setLibMuscle('all'); setFilter('all'); }} style={{
                          background: libCat === c.key ? c.color + '22' : 'transparent',
                          border: `1px solid ${libCat === c.key ? c.color : C.border}`,
                          borderRadius: 10, padding: '8px 14px', color: libCat === c.key ? c.color : C.sub,
                          fontFamily: fn, fontWeight: 700, fontSize: 11, textTransform: 'uppercase',
                          letterSpacing: '0.04em', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                        }}>{c.label} <span style={{ opacity: 0.5 }}>({EX.filter(e => e.cat === c.key).length})</span></button>
                      ))}
                    </div>
                    {libCat === 'strength' && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                        {muscles.map(m => (
                          <button key={m} onClick={() => setLibMuscle(m)} style={{
                            background: libMuscle === m ? MC[m] || catColor + '20' : 'transparent',
                            border: `1px solid ${libMuscle === m ? MC[m] || catColor : C.border}`,
                            borderRadius: 7, padding: '5px 11px', color: libMuscle === m ? MC[m] || catColor : C.sub,
                            fontFamily: fn, fontWeight: 700, fontSize: 10, textTransform: 'capitalize', letterSpacing: '0.04em', cursor: 'pointer',
                          }}>{m === 'all' ? 'All' : m.charAt(0).toUpperCase() + m.slice(1)}</button>
                        ))}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 5, marginBottom: 12 }}>
                      {['all', 'foundation', 'beginner', 'intermediate', 'advanced'].map(f => (
                        <button key={f} onClick={() => setFilter(f)} style={{
                          background: filter === f ? C.s4 : 'transparent', color: filter === f ? C.text : C.muted,
                          border: `1px solid ${filter === f ? C.border : 'transparent'}`,
                          borderRadius: 7, padding: '4px 10px', fontSize: 10, fontFamily: fn, fontWeight: 600, textTransform: 'capitalize', cursor: 'pointer', letterSpacing: '0.04em',
                        }}>{f}</button>
                      ))}
                    </div>
                    {catExs.length === 0
                      ? <div style={{ color: C.muted, fontSize: 13, textAlign: 'center', padding: 24 }}>No exercises match</div>
                      : (libCat === 'strength' && libMuscle !== 'all' ? catExs.filter(e => e.muscle === libMuscle) : catExs).map((ex, i) => <ExCard key={i} ex={ex} />)
                    }
                  </>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* ── EXPLORE TAB (Muscle Map) ── */}
      {view === 'explore' && (
        <ExploreSection />
      )}
    </div>
  );
}




