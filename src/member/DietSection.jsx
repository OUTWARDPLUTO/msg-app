import { useState, useEffect, useRef } from 'react';
import { C, fn, fb } from '../shared/theme.js';
import { BASE_DRI, NMETA, DEF_MEALS, API_URL, callClaude } from './memberData.js';
import { Card, Tag, Lbl, Hd, NRow } from './primitives.jsx';
// ─── Meal Card (Expandable) ──────────────────────────────────────────────────
function MealCard({ item, onDelete }) {
  const [open, setOpen] = useState(false);
  const cats = [
    { label: 'Macros', keys: ['protein', 'carbs', 'fat', 'fiber'] },
    { label: 'Minerals', keys: ['sodium', 'potassium', 'calcium', 'iron', 'magnesium', 'zinc'] },
    { label: 'Vitamins', keys: ['vitaminA', 'vitaminB12', 'vitaminC', 'vitaminD', 'vitaminE'] },
  ];
  return (
    <div style={{ background: C.s2, border: `1px solid ${open ? C.accent + '44' : C.border}`, borderRadius: 14, marginBottom: 10, overflow: 'hidden', transition: 'border-color 0.25s' }}>
      {/* Header row — always visible */}
      <div onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 14px', cursor: 'pointer' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>
            P <span style={{ color: C.blue }}>{item.protein}g</span> · C <span style={{ color: C.teal }}>{item.carbs}g</span> · F <span style={{ color: C.orange }}>{item.fat}g</span> · Fiber <span style={{ color: C.purple }}>{item.fiber || 0}g</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ fontFamily: fn, fontSize: 28, color: C.accent, letterSpacing: '0.04em', lineHeight: 1 }}>{item.calories}</div>
          <div style={{ color: open ? C.accent : C.muted, fontSize: 16, fontWeight: 300, lineHeight: 1, transition: 'color 0.2s' }}>{open ? '−' : '+'}</div>
        </div>
      </div>

      {/* Expanded: full nutrient breakdown */}
      {open && (
        <div style={{ borderTop: `1px solid ${C.border}`, padding: '12px 14px 14px' }}>
          {cats.map(cat => (
            <div key={cat.label} style={{ marginBottom: 12 }}>
              <Lbl text={cat.label} style={{ marginBottom: 8 }} />
              {cat.keys.map(k => {
                const meta = NMETA.find(n => n.key === k);
                if (!meta) return null;
                const dri = BASE_DRI[k] || 1;
                const val = item[k] || 0;
                const pct = Math.min((val / dri) * 100, 130);
                const status = pct < 70 ? 'deficit' : pct > 110 ? 'excess' : 'ok';
                const bc = status === 'ok' ? C.green : status === 'excess' ? C.red : C.blue;
                const ic = status === 'ok' ? '✓' : status === 'excess' ? '↑' : '↓';
                const disp = meta.unit === 'mcg' ? val.toFixed(1) : meta.unit === 'g' ? val.toFixed(1) : Math.round(val);
                return (
                  <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: meta.color, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ fontSize: 11.5, color: C.sub }}>{meta.label}</span>
                        <span style={{ fontSize: 10.5, color: bc, fontFamily: fb, fontWeight: 700 }}>{ic} {disp}/{dri}{meta.unit}</span>
                      </div>
                      <div style={{ height: 2.5, background: C.s4, borderRadius: 2 }}>
                        <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: bc, borderRadius: 2, transition: 'width 0.3s' }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          <button onClick={onDelete} style={{ marginTop: 4, width: '100%', padding: '9px', background: 'transparent', border: `1px solid ${C.red}33`, borderRadius: 9, color: C.red, fontFamily: fb, fontWeight: 700, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}>
            Remove Entry
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Diet Onboarding ─────────────────────────────────────────────────────────
function DietOnboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [ans, setAns] = useState({
    goal: '',
    activity: '',
    diet: '',
    gender: 'Male',
    age: '',
    height: '',
    cw: '',
    tw: '',
    speed: ''
  });

  const allSteps = [
    { q: "What's your primary goal?", field: 'goal', opts: ['Lose Weight', 'Gain Weight', 'Maintain'] },
    { q: 'How active are you?', field: 'activity', opts: ['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active'] },
    { q: 'Diet preference?', field: 'diet', opts: ['Non-Vegetarian', 'Vegetarian', 'Vegan', 'Flexible'] },
  ];
  
  const total = ans.goal === 'Maintain' ? 4 : 5;

  const next = (val) => {
    const cur = allSteps[step];
    if (cur) setAns(a => ({ ...a, [cur.field]: val }));
    setStep(s => s + 1);
  };

  const finish = (finalAns) => {
    const w = parseFloat(finalAns.cw) || 75;
    const h = parseFloat(finalAns.height) || 170;
    const age = parseFloat(finalAns.age) || 25;
    const gender = finalAns.gender || 'Male';
    
    // BMR Calculation (Mifflin-St Jeor)
    let bmr = 10 * w + 6.25 * h - 5 * age;
    if (gender === 'Male') bmr += 5;
    else if (gender === 'Female') bmr -= 161;
    else bmr -= 78;

    // TDEE calculation
    const factor = { Sedentary: 1.2, 'Lightly Active': 1.375, 'Moderately Active': 1.55, 'Very Active': 1.725 }[finalAns.activity] || 1.375;
    const tdee = Math.round(bmr * factor);

    let speedAdj = 0;
    if (finalAns.goal === 'Gain Weight') {
      speedAdj = { 'Slow Gain': 250, 'Moderate Gain': 500, 'Fast Gain': 750 }[finalAns.speed] || 500;
    } else if (finalAns.goal === 'Lose Weight') {
      speedAdj = -({ 'Slow Loss': -250, 'Moderate Loss': -500, 'Fast Loss': -750 }[finalAns.speed] || -500);
    }
    
    const cal = finalAns.goal === 'Lose Weight' ? Math.max(1200, tdee - speedAdj) : finalAns.goal === 'Gain Weight' ? tdee + speedAdj : tdee;
    const protein = Math.round(finalAns.goal === 'Gain Weight' ? w * 2.2 : finalAns.goal === 'Lose Weight' ? w * 2.0 : w * 1.8);
    const fat = Math.round(w * 0.8);
    const carbs = Math.max(50, Math.round((cal - protein * 4 - fat * 9) / 4));
    
    onComplete({
      ...finalAns,
      calories: cal,
      protein,
      carbs,
      fat,
      currentWeight: w,
      targetWeight: parseFloat(finalAns.tw) || w,
      height: h,
      age
    });
  };

  const renderStepContent = () => {
    if (step < 3) {
      const cur = allSteps[step];
      return (
        <>
          <div style={{ fontFamily: fn, fontSize: 22, color: C.text, letterSpacing: '0.04em', marginBottom: 20, lineHeight: 1.2 }}>{cur.q}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {cur.opts.map(opt => (
              <button key={opt} onClick={() => next(opt)} style={{
                background: C.s2, border: `1px solid ${ans[cur.field] === opt ? C.accent : C.border}`,
                borderRadius: 12, padding: '15px 18px', textAlign: 'left', cursor: 'pointer',
                color: ans[cur.field] === opt ? C.accent : C.text, fontSize: 15, fontWeight: 500,
                fontFamily: 'Barlow,sans-serif',
              }}>{opt}</button>
            ))}
          </div>
        </>
      );
    }

    if (step === 3) {
      const canContinue = ans.age && ans.height && ans.cw && (ans.goal === 'Maintain' || ans.tw);
      return (
        <>
          <div style={{ fontFamily: fn, fontSize: 22, color: C.text, letterSpacing: '0.04em', marginBottom: 20 }}>YOUR PHYSICAL DETAILS</div>
          
          <div style={{ marginBottom: 16 }}>
            <Lbl text="Gender" style={{ marginBottom: 8 }} />
            <div style={{ display: 'flex', gap: 10 }}>
              {['Male', 'Female'].map(g => (
                <button key={g} type="button" onClick={() => setAns(a => ({ ...a, gender: g }))} style={{
                  flex: 1, background: ans.gender === g ? C.accent : C.s2, border: `1px solid ${ans.gender === g ? C.accent : C.border}`,
                  borderRadius: 12, padding: '12px 0', color: ans.gender === g ? '#000' : C.text,
                  fontSize: 14, fontWeight: 600, fontFamily: 'Barlow,sans-serif', cursor: 'pointer'
                }}>{g}</button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <Lbl text="Age (years)" style={{ marginBottom: 8 }} />
              <input type="number" value={ans.age} onChange={e => setAns(a => ({ ...a, age: e.target.value }))} placeholder="e.g. 25"
                style={{ width: '100%', boxSizing: 'border-box', background: C.s2, border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 16px', color: C.text, fontSize: 16, fontFamily: 'Barlow,sans-serif', outline: 'none' }} />
            </div>
            <div style={{ flex: 1 }}>
              <Lbl text="Height (cm)" style={{ marginBottom: 8 }} />
              <input type="number" value={ans.height} onChange={e => setAns(a => ({ ...a, height: e.target.value }))} placeholder="e.g. 175"
                style={{ width: '100%', boxSizing: 'border-box', background: C.s2, border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 16px', color: C.text, fontSize: 16, fontFamily: 'Barlow,sans-serif', outline: 'none' }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <Lbl text="Current Weight (kg)" style={{ marginBottom: 8 }} />
              <input type="number" value={ans.cw} onChange={e => setAns(a => ({ ...a, cw: e.target.value }))} placeholder="e.g. 72.5"
                style={{ width: '100%', boxSizing: 'border-box', background: C.s2, border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 16px', color: C.text, fontSize: 16, fontFamily: 'Barlow,sans-serif', outline: 'none' }} />
            </div>
            {ans.goal !== 'Maintain' && (
              <div style={{ flex: 1 }}>
                <Lbl text="Target Weight (kg)" style={{ marginBottom: 8 }} />
                <input type="number" value={ans.tw} onChange={e => setAns(a => ({ ...a, tw: e.target.value }))} placeholder="e.g. 68.0"
                  style={{ width: '100%', boxSizing: 'border-box', background: C.s2, border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 16px', color: C.text, fontSize: 16, fontFamily: 'Barlow,sans-serif', outline: 'none' }} />
              </div>
            )}
          </div>

          <button onClick={() => {
            if (ans.goal === 'Maintain') {
              finish({ ...ans, tw: ans.cw, speed: 'Maintain' });
            } else {
              setStep(4);
            }
          }} disabled={!canContinue} style={{
            width: '100%', background: canContinue ? C.accent : C.s4, color: canContinue ? '#000' : C.muted,
            border: 'none', borderRadius: 12, padding: 15, fontSize: 13, fontFamily: fb,
            fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: canContinue ? 'pointer' : 'not-allowed', marginTop: 8,
          }}>
            {ans.goal === 'Maintain' ? 'Calculate My Plan →' : 'Continue →'}
          </button>
        </>
      );
    }

    if (step === 4) {
      const w = parseFloat(ans.cw) || 70;
      const h = parseFloat(ans.height) || 170;
      const age = parseFloat(ans.age) || 25;
      const gender = ans.gender || 'Male';

      let bmr = 10 * w + 6.25 * h - 5 * age;
      if (gender === 'Male') bmr += 5;
      else if (gender === 'Female') bmr -= 161;
      else bmr -= 78;

      const factor = { Sedentary: 1.2, 'Lightly Active': 1.375, 'Moderately Active': 1.55, 'Very Active': 1.725 }[ans.activity] || 1.375;
      const tdee = Math.round(bmr * factor);

      const options = ans.goal === 'Gain Weight' ? [
        { label: 'Slow Gain', adj: 250, desc: 'Lean bulking, minimal fat gain (+250 kcal)' },
        { label: 'Moderate Gain', adj: 500, desc: 'Steady strength & size increase (+500 kcal)' },
        { label: 'Fast Gain', adj: 750, desc: 'Aggressive mass gain (+750 kcal)' }
      ] : [
        { label: 'Slow Loss', adj: -250, desc: 'Very gentle deficit, preserves muscle (-250 kcal)' },
        { label: 'Moderate Loss', adj: -500, desc: 'Standard weight loss pace (-500 kcal)' },
        { label: 'Fast Loss', adj: -750, desc: 'Aggressive fat loss, higher effort (-750 kcal)' }
      ];

      return (
        <>
          <div style={{ fontFamily: fn, fontSize: 22, color: C.text, letterSpacing: '0.04em', marginBottom: 12 }}>RECOMMENDED CALORIES</div>
          <div style={{ color: C.sub, fontSize: 13, marginBottom: 20 }}>Based on your TDEE of <strong>{tdee} kcal</strong>, choose your pace:</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {options.map(opt => {
              const calVal = Math.max(1200, tdee + opt.adj);
              return (
                <button key={opt.label} onClick={() => finish({ ...ans, speed: opt.label, calories: calVal })} style={{
                  background: C.s2, border: `1px solid ${C.border}`, borderRadius: 14,
                  padding: '16px 20px', textAlign: 'left', cursor: 'pointer', transition: 'border-color 0.2s',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div style={{ flex: 1, marginRight: 12 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{opt.label}</div>
                    <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{opt.desc}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: fn, fontSize: 26, color: C.accent, fontWeight: 800 }}>{calVal}</div>
                    <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>kcal / day</div>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      );
    }
  };

  return (
    <div style={{ padding: 24, minHeight: '100%' }}>
      <div style={{ fontFamily: fn, fontSize: 34, color: C.text, letterSpacing: '0.05em', marginBottom: 6 }}>PERSONALIZE</div>
      <div style={{ color: C.sub, fontSize: 13, marginBottom: 24 }}>Set up your nutrition profile in {total} steps</div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 28 }}>
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < step || step >= total ? C.accent : i === step ? C.accent + '60' : C.s3, transition: 'background 0.3s' }} />
        ))}
      </div>
      {renderStepContent()}
    </div>
  );
}

// ─── Water Tracker ───────────────────────────────────────────────────────────
function WaterTracker() {
  const ML_PER_GLASS = 250;
  const TODAY_KEY  = () => `msg_water_${new Date().toISOString().slice(0, 10)}`;
  const GOAL_KEY   = 'msg_water_goal_ml'; // persists across days

  // Goal in ml, default 2000 ml (2 L)
  const [goalMl, setGoalMl] = useState(() => {
    try { return parseInt(localStorage.getItem(GOAL_KEY) || '2000', 10); } catch { return 2000; }
  });

  const [glasses, setGlasses] = useState(() => {
    try { return parseInt(localStorage.getItem(TODAY_KEY()) || '0', 10); } catch { return 0; }
  });

  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput]     = useState('');

  const goalGlasses = Math.round(goalMl / ML_PER_GLASS);
  const maxGlasses  = Math.ceil(goalGlasses * 1.5);

  const update = (n) => {
    const v = Math.max(0, Math.min(n, maxGlasses));
    setGlasses(v);
    try { localStorage.setItem(TODAY_KEY(), String(v)); } catch { }
  };

  const applyGoal = (litres) => {
    const ml = Math.round(Math.max(0.5, Math.min(litres, 10)) * 1000);
    setGoalMl(ml);
    try { localStorage.setItem(GOAL_KEY, String(ml)); } catch { }
    setEditingGoal(false);
  };

  const intakeMl   = glasses * ML_PER_GLASS;
  const pct        = Math.min((intakeMl / goalMl) * 100, 100);
  const done       = intakeMl >= goalMl;
  const waterColor = done ? C.accent : C.blue;
  const bubbleCount = Math.min(goalGlasses, 12);

  return (
    <div style={{
      background: C.s2, border: `1px solid ${done ? waterColor + '55' : C.border}`,
      borderRadius: 18, padding: '16px 18px', marginBottom: 14,
      boxShadow: done ? `0 0 18px ${waterColor}22` : 'none',
      transition: 'all 0.3s ease',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 22 }}>💧</div>
          <div>
            <div style={{ fontFamily: fn, fontSize: 15, fontWeight: 800, color: C.text, letterSpacing: '-0.01em' }}>Water Intake</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>
              {intakeMl} ml · of {goalMl} ml ({(goalMl / 1000).toFixed(1)} L)
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: fn, fontSize: 22, fontWeight: 800, color: waterColor, lineHeight: 1 }}>
            {(intakeMl / 1000).toFixed(2)}<span style={{ fontSize: 11, fontWeight: 600, color: C.muted }}>/{(goalMl / 1000).toFixed(1)} L</span>
          </div>
          <div style={{ fontSize: 9, color: done ? waterColor : C.muted, fontFamily: fb, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            {done ? '✓ Goal met!' : `${glasses}/${goalGlasses} glasses`}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 6, background: C.s4, borderRadius: 3, marginBottom: 12, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`, borderRadius: 3,
          background: `linear-gradient(90deg, ${C.blue}, ${done ? C.accent : C.blue}90)`,
          transition: 'width 0.4s ease',
        }} />
      </div>

      {/* Goal setter */}
      {editingGoal ? (
        <div style={{ marginBottom: 14, background: C.s3, borderRadius: 12, padding: '12px 14px' }}>
          <div style={{ fontSize: 10, color: C.sub, fontFamily: fb, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
            Set Daily Goal
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            {[1.5, 2.0, 2.5, 3.0].map(l => (
              <button key={l} onClick={() => applyGoal(l)} style={{
                flex: 1, padding: '8px 0', borderRadius: 9,
                background: goalMl === l * 1000 ? waterColor + '22' : C.s2,
                border: `1.5px solid ${goalMl === l * 1000 ? waterColor : C.border}`,
                color: goalMl === l * 1000 ? waterColor : C.sub,
                fontFamily: fn, fontWeight: 700, fontSize: 12, cursor: 'pointer',
              }}>{l} L</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 7 }}>
            <input
              type="number" step="0.1" min="0.5" max="10"
              value={goalInput}
              onChange={e => setGoalInput(e.target.value)}
              placeholder="e.g. 2.2 L"
              style={{
                flex: 1, background: C.s2, border: `1px solid ${C.border}`, borderRadius: 10,
                padding: '10px 12px', color: C.text, fontSize: 14, fontFamily: fn, outline: 'none',
              }}
            />
            <button onClick={() => { const v = parseFloat(goalInput); if (v >= 0.5) applyGoal(v); }} style={{
              background: waterColor, border: 'none', borderRadius: 10,
              padding: '10px 18px', color: '#000', fontFamily: fn, fontWeight: 700, fontSize: 12, cursor: 'pointer',
            }}>Set</button>
            <button onClick={() => setEditingGoal(false)} style={{
              background: C.s2, border: `1px solid ${C.border}`, borderRadius: 10,
              padding: '10px 12px', color: C.muted, fontFamily: fn, fontWeight: 600, fontSize: 12, cursor: 'pointer',
            }}>✕</button>
          </div>
        </div>
      ) : (
        <button onClick={() => { setGoalInput((goalMl / 1000).toFixed(1)); setEditingGoal(true); }} style={{
          display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12,
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
        }}>
          <span style={{ fontSize: 10, color: C.muted, fontFamily: fb, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Goal: {(goalMl / 1000).toFixed(1)} L/day
          </span>
          <span style={{ fontSize: 9, color: waterColor, fontFamily: fb, fontWeight: 700 }}>✎ Edit</span>
        </button>
      )}

      {/* Glass bubbles — uses bubbleCount (max 12), not undefined GOAL */}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 14 }}>
        {Array.from({ length: bubbleCount }).map((_, i) => (
          <button
            key={i}
            onClick={() => update(i < glasses ? i : i + 1)}
            style={{
              width: `calc(${100 / bubbleCount}% - 5px)`, aspectRatio: '1', borderRadius: 10,
              background: i < glasses ? waterColor + '22' : C.s3,
              border: `1.5px solid ${i < glasses ? waterColor : C.border}`,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, transition: 'all 0.18s ease',
              boxShadow: i < glasses ? `0 0 8px ${waterColor}44` : 'none',
            }}
          >{i < glasses ? '💧' : '○'}</button>
        ))}
        {goalGlasses > 12 && (
          <div style={{ fontSize: 10, color: C.muted, alignSelf: 'center', paddingLeft: 4 }}>
            +{goalGlasses - 12} more
          </div>
        )}
      </div>

      {/* +/- controls — use maxGlasses not hardcoded 12 */}
      <div style={{ display: 'flex', gap: 7 }}>
        <button
          onClick={() => update(glasses - 1)}
          disabled={glasses === 0}
          style={{
            flex: 1, background: C.s3, border: `1px solid ${C.border}`, borderRadius: 10,
            padding: '9px 0', color: glasses === 0 ? C.muted : C.text,
            fontFamily: fn, fontWeight: 700, fontSize: 18, cursor: glasses === 0 ? 'not-allowed' : 'pointer',
            opacity: glasses === 0 ? 0.4 : 1,
          }}
        >−</button>
        <button
          onClick={() => update(glasses + 1)}
          disabled={glasses >= maxGlasses}
          style={{
            flex: 3, background: waterColor + '18', border: `1px solid ${waterColor}44`, borderRadius: 10,
            padding: '9px 0', color: waterColor,
            fontFamily: fn, fontWeight: 700, fontSize: 13, cursor: glasses >= maxGlasses ? 'not-allowed' : 'pointer',
            letterSpacing: '0.02em',
          }}
        >+ Add Glass (250 ml)</button>
        <button
          onClick={() => update(glasses + 1)}
          disabled={glasses >= maxGlasses}
          style={{
            flex: 1, background: C.s3, border: `1px solid ${C.border}`, borderRadius: 10,
            padding: '9px 0', color: glasses >= maxGlasses ? C.muted : waterColor,
            fontFamily: fn, fontWeight: 700, fontSize: 18, cursor: glasses >= maxGlasses ? 'not-allowed' : 'pointer',
            opacity: glasses >= maxGlasses ? 0.4 : 1,
          }}
        >+</button>
      </div>
    </div>
  );
}


// ─── Diet Section ────────────────────────────────────────────────────────────
export default function DietSection({ dietGoal, setDietGoal, mealLog, setMealLog }) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [nutriTab, setNutriTab] = useState('macro');
  const [note, setNote] = useState('');
  const [noteOpen, setNoteOpen] = useState(false);

  if (!dietGoal) return <DietOnboarding onComplete={g => setDietGoal(g)} />;

  const dri = { ...BASE_DRI, calories: dietGoal.calories, protein: dietGoal.protein, carbs: dietGoal.carbs, fat: dietGoal.fat };
  const tot = mealLog.reduce((acc, item) => {
    NMETA.forEach(n => { acc[n.key] = (acc[n.key] || 0) + (item[n.key] || 0); });
    acc.calories = (acc.calories || 0) + (item.calories || 0);
    return acc;
  }, {});

  const logFood = async () => {
    if (!input.trim() || loading) return;
    const q = input.trim(); setInput(''); setLoading(true);

    // ── Local Food Database (values per 100g; defaultG = grams per "1 unit") ──
    const FOODS = [
      { al: ['egg', 'eggs', 'whole egg', 'boiled egg', 'fried egg'], cal: 155, p: 13, c: 1.1, f: 11, fi: 0, na: 124, k: 126, ca: 56, fe: 1.8, vA: 140, vB12: 1.1, vC: 0, vD: 2.0, vE: 1.1, mg: 12, zn: 1.3, dg: 60 },
      { al: ['egg white', 'egg whites'], cal: 52, p: 11, c: 0.7, f: 0.2, fi: 0, na: 166, k: 163, ca: 7, fe: 0.1, vA: 0, vB12: 0.1, vC: 0, vD: 0, vE: 0, mg: 11, zn: 0.0, dg: 33 },
      { al: ['milk', 'whole milk', 'cow milk', 'full fat milk'], cal: 61, p: 3.2, c: 4.8, f: 3.3, fi: 0, na: 43, k: 132, ca: 113, fe: 0.1, vA: 28, vB12: 0.4, vC: 1, vD: 1.3, vE: 0.1, mg: 10, zn: 0.4, dg: 250 },
      { al: ['paneer', 'cottage cheese india'], cal: 265, p: 18, c: 1.2, f: 20, fi: 0, na: 30, k: 91, ca: 190, fe: 0.2, vA: 193, vB12: 0.8, vC: 0, vD: 0.5, vE: 0.3, mg: 8, zn: 2.7, dg: 100 },
      { al: ['greek yogurt', 'greek yoghurt'], cal: 59, p: 10, c: 3.6, f: 0.4, fi: 0, na: 36, k: 141, ca: 110, fe: 0.1, vA: 0, vB12: 0.7, vC: 0, vD: 0, vE: 0, mg: 11, zn: 0.5, dg: 150 },
      { al: ['curd', 'dahi', 'plain yogurt', 'yogurt', 'yoghurt'], cal: 61, p: 3.5, c: 4.7, f: 3.3, fi: 0, na: 46, k: 155, ca: 121, fe: 0.1, vA: 27, vB12: 0.4, vC: 1, vD: 0, vE: 0.1, mg: 12, zn: 0.6, dg: 150 },
      { al: ['whey protein', 'whey', 'protein powder', 'protein shake'], cal: 120, p: 25, c: 3, f: 2, fi: 1, na: 140, k: 320, ca: 200, fe: 1.0, vA: 0, vB12: 1.2, vC: 0, vD: 2.0, vE: 0.5, mg: 30, zn: 2.5, dg: 30 },
      { al: ['butter', 'salted butter'], cal: 717, p: 0.9, c: 0.1, f: 81, fi: 0, na: 576, k: 24, ca: 24, fe: 0.0, vA: 684, vB12: 0.2, vC: 0, vD: 1.5, vE: 2.3, mg: 2, zn: 0.1, dg: 10 },
      { al: ['ghee', 'clarified butter', 'desi ghee'], cal: 900, p: 0, c: 0, f: 99, fi: 0, na: 0, k: 1, ca: 1, fe: 0.0, vA: 0, vB12: 0, vC: 0, vD: 0, vE: 2.8, mg: 0, zn: 0.1, dg: 10 },
      { al: ['white rice', 'rice', 'cooked rice', 'boiled rice'], cal: 130, p: 2.7, c: 28, f: 0.3, fi: 0.4, na: 1, k: 35, ca: 10, fe: 0.2, vA: 0, vB12: 0, vC: 0, vD: 0, vE: 0, mg: 12, zn: 0.5, dg: 200 },
      { al: ['raw rice', 'uncooked rice'], cal: 365, p: 7, c: 80, f: 0.7, fi: 2.8, na: 5, k: 115, ca: 28, fe: 0.8, vA: 0, vB12: 0, vC: 0, vD: 0, vE: 0.1, mg: 25, zn: 1.1, dg: 100 },
      { al: ['oats', 'rolled oats', 'oatmeal', 'porridge oats'], cal: 389, p: 17, c: 66, f: 7, fi: 11, na: 2, k: 429, ca: 54, fe: 4.7, vA: 0, vB12: 0, vC: 0, vD: 0, vE: 0.4, mg: 177, zn: 4.0, dg: 40 },
      { al: ['cooked oats', 'oatmeal cooked', 'porridge'], cal: 68, p: 2.5, c: 12, f: 1.4, fi: 1.7, na: 49, k: 61, ca: 10, fe: 0.7, vA: 0, vB12: 0, vC: 0, vD: 0, vE: 0.1, mg: 26, zn: 0.6, dg: 250 },
      { al: ['roti', 'chapati', 'wheat roti', 'phulka'], cal: 297, p: 10, c: 56, f: 3.7, fi: 3.5, na: 3, k: 160, ca: 34, fe: 3.9, vA: 0, vB12: 0, vC: 0, vD: 0, vE: 0.4, mg: 82, zn: 1.6, dg: 45 },
      { al: ['bread', 'white bread', 'sandwich bread', 'bread slice'], cal: 265, p: 9, c: 49, f: 3.2, fi: 2.7, na: 491, k: 115, ca: 107, fe: 3.6, vA: 0, vB12: 0, vC: 0, vD: 0, vE: 0.4, mg: 23, zn: 0.7, dg: 35 },
      { al: ['brown bread', 'whole wheat bread', 'multigrain bread'], cal: 247, p: 13, c: 41, f: 4.2, fi: 6, na: 400, k: 248, ca: 107, fe: 3.9, vA: 0, vB12: 0, vC: 0, vD: 0, vE: 0.6, mg: 82, zn: 1.5, dg: 35 },
      { al: ['quinoa', 'raw quinoa', 'uncooked quinoa'], cal: 368, p: 14, c: 64, f: 6, fi: 7, na: 5, k: 563, ca: 47, fe: 4.6, vA: 0, vB12: 0, vC: 0, vD: 0, vE: 2.4, mg: 197, zn: 3.1, dg: 100 },
      { al: ['cooked quinoa', 'quinoa cooked', 'quinoa boiled'], cal: 120, p: 4.4, c: 22, f: 1.9, fi: 2.8, na: 7, k: 172, ca: 17, fe: 1.5, vA: 0, vB12: 0, vC: 0, vD: 0, vE: 0.6, mg: 64, zn: 1.1, dg: 185 },
      { al: ['poha', 'flattened rice', 'beaten rice'], cal: 346, p: 6.3, c: 77, f: 0.6, fi: 1.5, na: 8, k: 140, ca: 14, fe: 2.8, vA: 0, vB12: 0, vC: 0, vD: 0, vE: 0, mg: 45, zn: 1.0, dg: 80 },
      { al: ['semolina', 'rava', 'suji', 'sooji'], cal: 360, p: 13, c: 73, f: 1, fi: 3.9, na: 1, k: 186, ca: 17, fe: 4.4, vA: 0, vB12: 0, vC: 0, vD: 0, vE: 0, mg: 47, zn: 0.9, dg: 50 },
      { al: ['wheat flour', 'atta', 'whole wheat flour'], cal: 340, p: 13, c: 72, f: 2, fi: 10, na: 2, k: 363, ca: 34, fe: 3.9, vA: 0, vB12: 0, vC: 0, vD: 0, vE: 1.0, mg: 138, zn: 2.6, dg: 100 },
      { al: ['pasta', 'spaghetti', 'noodles'], cal: 371, p: 13, c: 75, f: 1.5, fi: 2.7, na: 6, k: 215, ca: 21, fe: 3.3, vA: 0, vB12: 0, vC: 0, vD: 0, vE: 0.1, mg: 53, zn: 1.4, dg: 80 },
      { al: ['cooked pasta', 'boiled pasta'], cal: 158, p: 5.8, c: 31, f: 0.9, fi: 1.8, na: 1, k: 44, ca: 7, fe: 1.3, vA: 0, vB12: 0, vC: 0, vD: 0, vE: 0, mg: 18, zn: 0.5, dg: 180 },
      { al: ['maggi', 'instant noodles', '2 minute noodles'], cal: 435, p: 9.5, c: 64, f: 16, fi: 3, na: 1045, k: 160, ca: 30, fe: 2.5, vA: 0, vB12: 0, vC: 0, vD: 0, vE: 0.5, mg: 30, zn: 0.8, dg: 70 },
      { al: ['dal', 'lentils', 'raw dal', 'masoor dal', 'red lentil'], cal: 352, p: 25, c: 60, f: 1, fi: 11, na: 6, k: 677, ca: 56, fe: 7.5, vA: 0, vB12: 0, vC: 4, vD: 0, vE: 0.5, mg: 122, zn: 3.3, dg: 100 },
      { al: ['cooked dal', 'boiled dal', 'cooked lentils'], cal: 116, p: 9, c: 20, f: 0.4, fi: 8, na: 2, k: 369, ca: 19, fe: 3.3, vA: 2, vB12: 0, vC: 1.5, vD: 0, vE: 0.2, mg: 36, zn: 1.3, dg: 200 },
      { al: ['toor dal', 'arhar dal', 'pigeon pea'], cal: 335, p: 22, c: 57, f: 1.7, fi: 15, na: 17, k: 1392, ca: 130, fe: 5.2, vA: 0, vB12: 0, vC: 0, vD: 0, vE: 0.5, mg: 183, zn: 2.8, dg: 100 },
      { al: ['moong dal', 'mung dal', 'yellow moong', 'green moong'], cal: 347, p: 24, c: 63, f: 1.2, fi: 16, na: 15, k: 1246, ca: 132, fe: 6.7, vA: 6, vB12: 0, vC: 4, vD: 0, vE: 0.4, mg: 189, zn: 2.7, dg: 100 },
      { al: ['chana dal', 'split chickpea', 'bengal gram'], cal: 364, p: 20, c: 61, f: 5, fi: 18, na: 24, k: 845, ca: 105, fe: 4.3, vA: 3, vB12: 0, vC: 3, vD: 0, vE: 0.3, mg: 139, zn: 3.4, dg: 100 },
      { al: ['urad dal', 'black dal', 'black gram'], cal: 347, p: 25, c: 59, f: 1.6, fi: 18, na: 38, k: 983, ca: 138, fe: 7.6, vA: 0, vB12: 0, vC: 0, vD: 0, vE: 0.5, mg: 267, zn: 3.4, dg: 100 },
      { al: ['rajma', 'kidney beans', 'red kidney beans'], cal: 333, p: 24, c: 60, f: 0.8, fi: 25, na: 28, k: 1359, ca: 83, fe: 6.7, vA: 0, vB12: 0, vC: 5, vD: 0, vE: 0.2, mg: 140, zn: 2.8, dg: 100 },
      { al: ['cooked rajma', 'boiled kidney beans'], cal: 127, p: 8.7, c: 23, f: 0.5, fi: 7.4, na: 2, k: 403, ca: 35, fe: 2.9, vA: 0, vB12: 0, vC: 1, vD: 0, vE: 0.1, mg: 45, zn: 1.1, dg: 200 },
      { al: ['chickpeas', 'chana', 'chole', 'kabuli chana'], cal: 364, p: 19, c: 61, f: 6, fi: 17, na: 24, k: 875, ca: 105, fe: 6.2, vA: 3, vB12: 0, vC: 4, vD: 0, vE: 0.8, mg: 115, zn: 3.4, dg: 100 },
      { al: ['cooked chickpeas', 'boiled chickpeas', 'cooked chole'], cal: 164, p: 8.9, c: 27, f: 2.6, fi: 7.6, na: 7, k: 291, ca: 49, fe: 2.9, vA: 2, vB12: 0, vC: 1.3, vD: 0, vE: 0.4, mg: 48, zn: 1.5, dg: 200 },
      { al: ['tofu', 'soya paneer', 'bean curd'], cal: 76, p: 8, c: 1.9, f: 4.2, fi: 0.3, na: 7, k: 121, ca: 350, fe: 2.7, vA: 0, vB12: 0, vC: 0.1, vD: 0, vE: 0.1, mg: 30, zn: 0.8, dg: 100 },
      { al: ['chicken breast', 'boneless chicken', 'chicken fillet'], cal: 165, p: 31, c: 0, f: 3.6, fi: 0, na: 74, k: 256, ca: 15, fe: 1.0, vA: 9, vB12: 0.3, vC: 0, vD: 0.1, vE: 0.3, mg: 29, zn: 1.0, dg: 100 },
      { al: ['chicken thigh', 'chicken leg', 'dark chicken'], cal: 209, p: 26, c: 0, f: 11, fi: 0, na: 88, k: 220, ca: 13, fe: 1.3, vA: 21, vB12: 0.3, vC: 0, vD: 0.1, vE: 0.4, mg: 23, zn: 2.4, dg: 100 },
      { al: ['mutton', 'lamb', 'goat meat', 'gosht'], cal: 294, p: 25, c: 0, f: 21, fi: 0, na: 72, k: 310, ca: 17, fe: 2.7, vA: 0, vB12: 2.6, vC: 0, vD: 0, vE: 0.5, mg: 23, zn: 4.1, dg: 100 },
      { al: ['fish', 'white fish', 'rohu', 'katla', 'tilapia'], cal: 96, p: 20, c: 0, f: 1.7, fi: 0, na: 56, k: 302, ca: 17, fe: 0.5, vA: 14, vB12: 1.6, vC: 0, vD: 6.0, vE: 0.6, mg: 26, zn: 0.8, dg: 100 },
      { al: ['salmon', 'grilled salmon'], cal: 208, p: 20, c: 0, f: 13, fi: 0, na: 59, k: 363, ca: 12, fe: 0.4, vA: 58, vB12: 3.2, vC: 3, vD: 11, vE: 3.6, mg: 29, zn: 0.6, dg: 100 },
      { al: ['tuna', 'canned tuna', 'tuna fish'], cal: 130, p: 30, c: 0, f: 1, fi: 0, na: 50, k: 444, ca: 10, fe: 1.3, vA: 0, vB12: 2.5, vC: 0, vD: 4.5, vE: 1.0, mg: 35, zn: 0.8, dg: 100 },
      { al: ['potato', 'aloo', 'boiled potato'], cal: 87, p: 1.9, c: 20, f: 0.1, fi: 1.8, na: 6, k: 421, ca: 12, fe: 0.8, vA: 2, vB12: 0, vC: 20, vD: 0, vE: 0.1, mg: 23, zn: 0.3, dg: 150 },
      { al: ['sweet potato', 'shakarkandi'], cal: 86, p: 1.6, c: 20, f: 0.1, fi: 3, na: 55, k: 337, ca: 30, fe: 0.6, vA: 961, vB12: 0, vC: 3, vD: 0, vE: 0.3, mg: 25, zn: 0.3, dg: 130 },
      { al: ['spinach', 'palak', 'baby spinach'], cal: 23, p: 2.9, c: 3.6, f: 0.4, fi: 2.2, na: 79, k: 558, ca: 99, fe: 2.7, vA: 469, vB12: 0, vC: 28, vD: 0, vE: 2.0, mg: 79, zn: 0.5, dg: 100 },
      { al: ['broccoli'], cal: 34, p: 2.8, c: 6.6, f: 0.4, fi: 2.6, na: 33, k: 316, ca: 47, fe: 0.7, vA: 77, vB12: 0, vC: 89, vD: 0, vE: 0.8, mg: 21, zn: 0.4, dg: 100 },
      { al: ['carrot', 'gajar'], cal: 41, p: 0.9, c: 10, f: 0.2, fi: 2.8, na: 69, k: 320, ca: 33, fe: 0.3, vA: 835, vB12: 0, vC: 6, vD: 0, vE: 0.7, mg: 12, zn: 0.2, dg: 80 },
      { al: ['tomato', 'tamatar'], cal: 18, p: 0.9, c: 3.9, f: 0.2, fi: 1.2, na: 5, k: 237, ca: 10, fe: 0.3, vA: 42, vB12: 0, vC: 14, vD: 0, vE: 0.5, mg: 11, zn: 0.2, dg: 100 },
      { al: ['onion', 'pyaz'], cal: 40, p: 1.1, c: 9.3, f: 0.1, fi: 1.7, na: 4, k: 146, ca: 23, fe: 0.2, vA: 0, vB12: 0, vC: 8, vD: 0, vE: 0, mg: 10, zn: 0.2, dg: 80 },
      { al: ['cucumber', 'kheera'], cal: 15, p: 0.7, c: 3.6, f: 0.1, fi: 0.5, na: 2, k: 147, ca: 16, fe: 0.3, vA: 5, vB12: 0, vC: 2.8, vD: 0, vE: 0, mg: 13, zn: 0.2, dg: 100 },
      { al: ['banana', 'kela'], cal: 89, p: 1.1, c: 23, f: 0.3, fi: 2.6, na: 1, k: 358, ca: 5, fe: 0.3, vA: 3, vB12: 0, vC: 9, vD: 0, vE: 0.1, mg: 27, zn: 0.2, dg: 120 },
      { al: ['apple', 'seb'], cal: 52, p: 0.3, c: 14, f: 0.2, fi: 2.4, na: 1, k: 107, ca: 6, fe: 0.1, vA: 3, vB12: 0, vC: 5, vD: 0, vE: 0.2, mg: 5, zn: 0.0, dg: 150 },
      { al: ['mango', 'aam', 'alphonso'], cal: 60, p: 0.8, c: 15, f: 0.4, fi: 1.6, na: 1, k: 168, ca: 11, fe: 0.2, vA: 54, vB12: 0, vC: 36, vD: 0, vE: 0.9, mg: 10, zn: 0.1, dg: 200 },
      { al: ['orange', 'santra'], cal: 47, p: 0.9, c: 12, f: 0.1, fi: 2.4, na: 0, k: 181, ca: 40, fe: 0.1, vA: 11, vB12: 0, vC: 53, vD: 0, vE: 0.2, mg: 10, zn: 0.1, dg: 130 },
      { al: ['almonds', 'badam'], cal: 579, p: 21, c: 22, f: 50, fi: 12, na: 1, k: 733, ca: 264, fe: 3.7, vA: 0, vB12: 0, vC: 0, vD: 0, vE: 25, mg: 270, zn: 3.1, dg: 30 },
      { al: ['peanuts', 'groundnuts', 'moongfali'], cal: 567, p: 26, c: 16, f: 49, fi: 8.5, na: 18, k: 705, ca: 92, fe: 4.6, vA: 0, vB12: 0, vC: 0, vD: 0, vE: 8.3, mg: 168, zn: 3.3, dg: 30 },
      { al: ['peanut butter'], cal: 588, p: 25, c: 20, f: 50, fi: 6, na: 459, k: 649, ca: 49, fe: 1.7, vA: 0, vB12: 0, vC: 0, vD: 0, vE: 9.1, mg: 154, zn: 2.5, dg: 32 },
      { al: ['chai', 'tea with milk', 'indian tea', 'masala chai'], cal: 37, p: 1.6, c: 5.5, f: 1, fi: 0, na: 10, k: 65, ca: 40, fe: 0.1, vA: 10, vB12: 0.1, vC: 0, vD: 0, vE: 0, mg: 5, zn: 0.1, dg: 200 },
      { al: ['idli', 'idly'], cal: 39, p: 2, c: 8, f: 0.2, fi: 0.5, na: 150, k: 35, ca: 8, fe: 0.3, vA: 0, vB12: 0, vC: 0, vD: 0, vE: 0, mg: 8, zn: 0.2, dg: 60 },
      { al: ['dosa', 'plain dosa'], cal: 168, p: 4.6, c: 30, f: 3.7, fi: 1.5, na: 380, k: 110, ca: 20, fe: 0.9, vA: 0, vB12: 0, vC: 1, vD: 0, vE: 0.1, mg: 20, zn: 0.5, dg: 100 },
      { al: ['khichdi', 'dal khichdi'], cal: 124, p: 4.6, c: 23, f: 1.6, fi: 2.4, na: 220, k: 190, ca: 25, fe: 1.2, vA: 10, vB12: 0, vC: 1, vD: 0, vE: 0.2, mg: 30, zn: 0.7, dg: 200 },
      { al: ['biryani', 'chicken biryani', 'veg biryani'], cal: 197, p: 9, c: 29, f: 5.5, fi: 1.5, na: 450, k: 220, ca: 35, fe: 1.3, vA: 25, vB12: 0.2, vC: 3, vD: 0, vE: 0.4, mg: 28, zn: 1.0, dg: 250 },
      { al: ['paratha', 'aloo paratha'], cal: 300, p: 6.5, c: 45, f: 10, fi: 3, na: 380, k: 180, ca: 40, fe: 2.5, vA: 20, vB12: 0, vC: 4, vD: 0, vE: 0.5, mg: 40, zn: 0.8, dg: 80 },
      { al: ['paneer curry', 'palak paneer', 'paneer tikka'], cal: 230, p: 11, c: 8, f: 17, fi: 1.5, na: 380, k: 180, ca: 220, fe: 1.2, vA: 180, vB12: 0.5, vC: 8, vD: 0.3, vE: 0.6, mg: 25, zn: 1.8, dg: 200 },
      // Sugars & sweeteners
      { al: ['sugar', 'white sugar', 'table sugar', 'cane sugar', 'granulated sugar', 'sucrose'], cal: 387, p: 0, c: 100, f: 0, fi: 0, na: 1, k: 2, ca: 1, fe: 0.01, vA: 0, vB12: 0, vC: 0, vD: 0, vE: 0, mg: 0, zn: 0, dg: 10 },
      { al: ['brown sugar', 'raw sugar', 'demerara sugar'], cal: 380, p: 0.1, c: 98, f: 0, fi: 0, na: 11, k: 133, ca: 83, fe: 1.9, vA: 0, vB12: 0, vC: 0, vD: 0, vE: 0, mg: 29, zn: 0.2, dg: 10 },
      { al: ['honey', 'raw honey'], cal: 304, p: 0.3, c: 82, f: 0, fi: 0.2, na: 4, k: 52, ca: 6, fe: 0.4, vA: 0, vB12: 0, vC: 0.5, vD: 0, vE: 0, mg: 2, zn: 0.2, dg: 15 },
      { al: ['jaggery', 'gur', 'jaggery powder'], cal: 383, p: 0.4, c: 98, f: 0.1, fi: 0, na: 19, k: 1056, ca: 80, fe: 2.5, vA: 0, vB12: 0, vC: 7, vD: 0, vE: 0, mg: 70, zn: 0.3, dg: 10 },
      { al: ['maple syrup'], cal: 260, p: 0, c: 67, f: 0.1, fi: 0, na: 12, k: 204, ca: 102, fe: 0.1, vA: 0, vB12: 0, vC: 0, vD: 0, vE: 0, mg: 21, zn: 1.0, dg: 20 },
      { al: ['jam', 'fruit jam', 'strawberry jam', 'mixed fruit jam'], cal: 250, p: 0.4, c: 65, f: 0.1, fi: 1, na: 32, k: 77, ca: 20, fe: 0.5, vA: 5, vB12: 0, vC: 3, vD: 0, vE: 0.1, mg: 4, zn: 0.1, dg: 20 },
      // Oils
      { al: ['olive oil', 'extra virgin olive oil'], cal: 884, p: 0, c: 0, f: 100, fi: 0, na: 2, k: 1, ca: 1, fe: 0.6, vA: 0, vB12: 0, vC: 0, vD: 0, vE: 14.4, mg: 0, zn: 0, dg: 10 },
      { al: ['coconut oil'], cal: 892, p: 0, c: 0, f: 100, fi: 0, na: 0, k: 0, ca: 1, fe: 0.0, vA: 0, vB12: 0, vC: 0, vD: 0, vE: 0.1, mg: 0, zn: 0, dg: 10 },
      { al: ['sunflower oil', 'vegetable oil', 'cooking oil'], cal: 884, p: 0, c: 0, f: 100, fi: 0, na: 0, k: 0, ca: 0, fe: 0.0, vA: 0, vB12: 0, vC: 0, vD: 0, vE: 5.6, mg: 0, zn: 0, dg: 10 },
      // Fruits
      { al: ['banana', 'ripe banana'], cal: 89, p: 1.1, c: 23, f: 0.3, fi: 2.6, na: 1, k: 358, ca: 5, fe: 0.3, vA: 3, vB12: 0, vC: 8.7, vD: 0, vE: 0.1, mg: 27, zn: 0.2, dg: 120 },
      { al: ['apple', 'red apple', 'green apple'], cal: 52, p: 0.3, c: 14, f: 0.2, fi: 2.4, na: 1, k: 107, ca: 6, fe: 0.1, vA: 3, vB12: 0, vC: 4.6, vD: 0, vE: 0.2, mg: 5, zn: 0.04, dg: 182 },
      { al: ['orange', 'navel orange', 'sweet lime', 'mosambi'], cal: 47, p: 0.9, c: 12, f: 0.1, fi: 2.4, na: 0, k: 181, ca: 40, fe: 0.1, vA: 11, vB12: 0, vC: 53, vD: 0, vE: 0.2, mg: 10, zn: 0.1, dg: 180 },
      { al: ['mango', 'ripe mango', 'alphonso'], cal: 60, p: 0.8, c: 15, f: 0.4, fi: 1.6, na: 1, k: 168, ca: 11, fe: 0.2, vA: 54, vB12: 0, vC: 36, vD: 0, vE: 0.9, mg: 10, zn: 0.1, dg: 200 },
      { al: ['dates', 'dry dates', 'medjool dates', 'khajoor'], cal: 282, p: 2.5, c: 75, f: 0.4, fi: 8, na: 2, k: 696, ca: 64, fe: 1.0, vA: 7, vB12: 0, vC: 0.4, vD: 0, vE: 0.1, mg: 54, zn: 0.4, dg: 40 },
      // Nuts & seeds
      { al: ['almonds', 'almond', 'badam'], cal: 579, p: 21, c: 22, f: 49, fi: 12.5, na: 1, k: 733, ca: 264, fe: 3.7, vA: 0, vB12: 0, vC: 0, vD: 0, vE: 25.6, mg: 270, zn: 3.1, dg: 28 },
      { al: ['peanuts', 'groundnuts', 'moongphali'], cal: 567, p: 26, c: 16, f: 49, fi: 8.5, na: 18, k: 705, ca: 92, fe: 4.6, vA: 0, vB12: 0, vC: 0, vD: 0, vE: 8.3, mg: 168, zn: 3.3, dg: 30 },
      { al: ['peanut butter', 'groundnut butter'], cal: 588, p: 25, c: 20, f: 50, fi: 6, na: 429, k: 558, ca: 49, fe: 1.9, vA: 0, vB12: 0, vC: 0, vD: 0, vE: 9.1, mg: 154, zn: 2.9, dg: 32 },
      { al: ['walnuts', 'walnut', 'akhrot'], cal: 654, p: 15, c: 14, f: 65, fi: 6.7, na: 2, k: 441, ca: 98, fe: 2.9, vA: 1, vB12: 0, vC: 1.3, vD: 0, vE: 0.7, mg: 158, zn: 3.1, dg: 30 },
      // Beverages
      { al: ['coffee', 'black coffee', 'espresso', 'filter coffee'], cal: 2, p: 0.3, c: 0, f: 0, fi: 0, na: 5, k: 49, ca: 2, fe: 0.1, vA: 0, vB12: 0, vC: 0, vD: 0, vE: 0, mg: 3, zn: 0.0, dg: 240 },
      { al: ['protein bar', 'energy bar', 'granola bar'], cal: 400, p: 20, c: 45, f: 12, fi: 3, na: 200, k: 250, ca: 100, fe: 3, vA: 0, vB12: 0.5, vC: 0, vD: 0, vE: 0, mg: 30, zn: 1.0, dg: 60 },
    ];

    // ── Smart Quantity + Food Parser ─────────────────────────────────────────
    function parseEntry(raw) {
      const s = raw.toLowerCase().trim();
      let grams = null;
      let countMul = 1;

      // "x50g", "x 50g"
      const xg = s.match(/x\s*(\d+\.?\d*)\s*g\b/); if (xg) grams = parseFloat(xg[1]);
      // "100g", "100grams"
      if (!grams) { const m = s.match(/(\d+\.?\d*)\s*g(?:ram)?s?\b/); if (m) grams = parseFloat(m[1]); }
      // "100ml"
      if (!grams) { const m = s.match(/(\d+\.?\d*)\s*ml\b/); if (m) grams = parseFloat(m[1]); }
      // "2 cups" => *240
      if (!grams) { const m = s.match(/(\d+\.?\d*)\s*cup/); if (m) grams = parseFloat(m[1]) * 240; }
      // "half cup"
      if (!grams && s.includes('half cup')) grams = 120;
      // "half [food]" without unit
      const isHalf = !grams && (s.startsWith('half') || s.includes(' half '));
      // Count: "3 eggs" — only if NO gram amount found
      if (!grams) { const m = s.match(/^(\d+\.?\d*)\s+/); if (m) countMul = Math.min(parseFloat(m[1]), 20); }

      // Strip quantity tokens to isolate food name
      const foodStr = s
        .replace(/\d+\.?\d*\s*(?:g(?:ram)?s?|ml|kg|oz|lb|cups?|scoops?|pieces?|slices?|servings?)\b/g, '')
        .replace(/x\s*\d+\.?\d*\s*g?\b/g, '')
        .replace(/^\d+\.?\d*\s+/, '')
        .replace(/\b(half|boiled|fried|raw|cooked|whole|large|medium|small|fresh)\b/g, '')
        .replace(/\s+/g, ' ').trim();

      // Find best matching food
      let best = null, score = 0;
      for (const food of FOODS) {
        for (const alias of food.al) {
          if (foodStr === alias) { best = food; score = 999; break; }
          if (foodStr.includes(alias) && alias.length > score) { best = food; score = alias.length; }
          if (alias.includes(foodStr) && foodStr.length > score) { best = food; score = foodStr.length; }
        }
        if (score === 999) break;
      }
      if (!best) {
        const words = foodStr.split(' ').filter(w => w.length > 3);
        for (const food of FOODS) {
          for (const alias of food.al) {
            for (const word of words) {
              if (alias.includes(word) && word.length > score) { best = food; score = word.length; }
            }
          }
        }
      }
      if (!best) return null;

      const actualG = grams !== null ? grams : best.dg * countMul * (isHalf ? 0.5 : 1);
      const sc = actualG / 100;
      const r = (v, d = 1) => Math.round(v * sc * Math.pow(10, d)) / Math.pow(10, d);
      return {
        name: raw, calories: Math.round(best.cal * sc), protein: r(best.p),
        carbs: r(best.c), fat: r(best.f), fiber: r(best.fi),
        sodium: Math.round(best.na * sc), potassium: Math.round(best.k * sc),
        calcium: Math.round(best.ca * sc), iron: r(best.fe),
        vitaminA: Math.round(best.vA * sc), vitaminB12: r(best.vB12),
        vitaminC: Math.round(best.vC * sc), vitaminD: r(best.vD),
        vitaminE: r(best.vE), magnesium: Math.round(best.mg * sc), zinc: r(best.zn),
      };
    }

    // ── AI First Strategy (Highly Accurate NLP) ───────────────────────────────
    try {
      const sys = `You are a precise nutritionist. Return nutritional information for the EXACT quantity stated. Output ONLY a valid JSON object matching this exact schema: {"name":"string","calories":number,"protein":number,"carbs":number,"fat":number,"fiber":number,"sodium":number,"potassium":number,"calcium":number,"iron":number,"vitaminA":number,"vitaminB12":number,"vitaminC":number,"vitaminD":number,"vitaminE":number,"magnesium":number,"zinc":number}. No markdown, no preamble.`;
      const text = await callClaude(sys, `Food: "${q}"`);
      const cleanStr = text.replace(/```json|```/gi, '').trim();
      const startIdx = cleanStr.indexOf('{');
      const endIdx = cleanStr.lastIndexOf('}');
      if (startIdx === -1 || endIdx === -1) throw new Error('No JSON found');
      
      const item = JSON.parse(cleanStr.substring(startIdx, endIdx + 1));
      if (item.calories > 4000) item.calories = Math.round(item.calories / 10);
      
      setMealLog(p => [{ ...item, name: item.name || q, source: 'AI' }, ...p]);
      setLoading(false);
      return;
    } catch (e) {
      console.warn("AI parsing failed, falling back", e);
    }

    // ── Local Fallback (if AI fails/rate limits) ──────────────────────────────
    const local = parseEntry(q);
    if (local) { setMealLog(p => [local, ...p]); setLoading(false); return; }

    // ── USDA FDC API lookup (if Local fails) ──────────────────────────────────
    const USDA_KEY = import.meta.env.VITE_USDA_KEY ?? '';
    const USDA_NUTRIENT_MAP = {
      1008: 'calories', 1003: 'protein', 1005: 'carbs', 1004: 'fat',
      1079: 'fiber', 1093: 'sodium', 1092: 'potassium', 1087: 'calcium',
      1089: 'iron', 1106: 'vitaminA', 1178: 'vitaminB12', 1162: 'vitaminC',
      1114: 'vitaminD', 1109: 'vitaminE', 1090: 'magnesium', 1095: 'zinc',
    };
    // ── OpenFoodFacts API lookup (Free, no key needed) ───────────────────────
    try {
      const gramsMatch = q.match(/(\d+\.?\d*)\s*g(?:ram)?s?\b/i);
      const scaleFactor = gramsMatch ? parseFloat(gramsMatch[1]) / 100 : 1;
      const searchTerm = q.replace(/\d+\.?\d*\s*g(?:ram)?s?\b/gi, '').trim() || q;

      let fetchUrl = '';
      if (USDA_KEY) {
        fetchUrl = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(searchTerm)}&api_key=${USDA_KEY}&dataType=Foundation,SR%20Legacy,Branded&pageSize=1`;
      } else {
        fetchUrl = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(searchTerm)}&search_simple=1&action=process&json=1&page_size=1`;
      }

      const resp = await fetch(fetchUrl);
      if (resp.ok) {
        const data = await resp.json();
        
        if (USDA_KEY && data.foods?.[0]) {
          const food = data.foods[0];
          const nutrients = {};
          (food.foodNutrients || []).forEach(n => {
            const key = USDA_NUTRIENT_MAP[n.nutrientId];
            if (key) nutrients[key] = Math.round((n.value || 0) * scaleFactor * 10) / 10;
          });
          if (nutrients.calories) {
            setMealLog(p => [{
              name: `${food.description}${gramsMatch ? ` (${gramsMatch[1]}g)` : ''}`,
              calories: Math.round(nutrients.calories || 0),
              protein: nutrients.protein || 0,
              carbs: nutrients.carbs || 0,
              fat: nutrients.fat || 0,
              fiber: nutrients.fiber || 0,
              sodium: nutrients.sodium || 0,
              source: 'USDA',
            }, ...p]);
            setLoading(false);
            return;
          }
        } else if (!USDA_KEY && data.products?.[0]) {
          const product = data.products[0];
          const nut = product.nutriments || {};
          if (nut['energy-kcal_100g']) {
            setMealLog(p => [{
              name: `${product.product_name || searchTerm}${gramsMatch ? ` (${gramsMatch[1]}g)` : ''}`,
              calories: Math.round((nut['energy-kcal_100g'] || 0) * scaleFactor),
              protein: Math.round((nut['proteins_100g'] || 0) * scaleFactor * 10) / 10,
              carbs: Math.round((nut['carbohydrates_100g'] || 0) * scaleFactor * 10) / 10,
              fat: Math.round((nut['fat_100g'] || 0) * scaleFactor * 10) / 10,
              fiber: Math.round((nut['fiber_100g'] || 0) * scaleFactor * 10) / 10,
              sodium: Math.round((nut['sodium_100g'] || 0) * 1000 * scaleFactor), // OpenFoodFacts is in g, convert to mg
              source: 'OpenFoodFacts',
            }, ...p]);
            setLoading(false);
            return;
          }
        }
      }
    } catch (_) { }

    // ── Absolute Fallback ─────────────────────────────────────────────────────
    setMealLog(p => [{
      name: `${q} (estimated)`, calories: 200, protein: 8, carbs: 28, fat: 6, fiber: 3,
      sodium: 200, potassium: 250, calcium: 40, iron: 1.5,
      vitaminA: 15, vitaminB12: 0.3, vitaminC: 5, vitaminD: 0.3, vitaminE: 0.7, magnesium: 30, zinc: 0.8,
      source: 'Fallback'
    }, ...p]);
    setLoading(false);
  };


  // High protein sources by diet preference
  const proteinSources = {
    'Non-Vegetarian': [
      { food: 'Chicken Breast (100g)', protein: '31g', cal: '165', tag: 'Lean', macros: { protein: 31, carbs: 0, fat: 3.6 } },
      { food: 'Eggs (2 whole)', protein: '13g', cal: '155', tag: 'Complete', macros: { protein: 13, carbs: 1, fat: 11 } },
      { food: 'Tuna (100g)', protein: '30g', cal: '130', tag: 'Lean', macros: { protein: 30, carbs: 0, fat: 1 } },
      { food: 'Greek Yogurt (150g)', protein: '15g', cal: '90', tag: 'Dairy', macros: { protein: 15, carbs: 6, fat: 0.7 } },
      { food: 'Salmon (100g)', protein: '25g', cal: '208', tag: 'Omega-3', macros: { protein: 25, carbs: 0, fat: 13 } },
      { food: 'Cottage Cheese (100g)', protein: '11g', cal: '98', tag: 'Dairy', macros: { protein: 11, carbs: 3.4, fat: 4.3 } },
      { food: 'Turkey (100g)', protein: '29g', cal: '157', tag: 'Lean', macros: { protein: 29, carbs: 0, fat: 4 } },
      { food: 'Whey Protein (1 scoop)', protein: '25g', cal: '120', tag: 'Supplement', macros: { protein: 25, carbs: 3, fat: 2 } },
    ],
    'Vegetarian': [
      { food: 'Paneer (100g)', protein: '18g', cal: '265', tag: 'Dairy', macros: { protein: 18, carbs: 1.2, fat: 20 } },
      { food: 'Greek Yogurt (150g)', protein: '15g', cal: '90', tag: 'Dairy', macros: { protein: 15, carbs: 6, fat: 0.7 } },
      { food: 'Eggs (2 whole)', protein: '13g', cal: '155', tag: 'Complete', macros: { protein: 13, carbs: 1, fat: 11 } },
      { food: 'Lentils cooked (100g)', protein: '9g', cal: '116', tag: 'Plant', macros: { protein: 9, carbs: 20, fat: 0.4 } },
      { food: 'Chickpeas (100g)', protein: '9g', cal: '164', tag: 'Plant', macros: { protein: 9, carbs: 27, fat: 2.6 } },
      { food: 'Tofu (100g)', protein: '8g', cal: '76', tag: 'Soy', macros: { protein: 8, carbs: 1.9, fat: 4.2 } },
      { food: 'Cottage Cheese (100g)', protein: '11g', cal: '98', tag: 'Dairy', macros: { protein: 11, carbs: 3.4, fat: 4.3 } },
      { food: 'Whey Protein (1 scoop)', protein: '25g', cal: '120', tag: 'Supplement', macros: { protein: 25, carbs: 3, fat: 2 } },
    ],
    'Vegan': [
      { food: 'Tempeh (100g)', protein: '19g', cal: '193', tag: 'Fermented', macros: { protein: 19, carbs: 9, fat: 11 } },
      { food: 'Tofu firm (100g)', protein: '10g', cal: '83', tag: 'Soy', macros: { protein: 10, carbs: 2, fat: 5 } },
      { food: 'Lentils cooked (100g)', protein: '9g', cal: '116', tag: 'Plant', macros: { protein: 9, carbs: 20, fat: 0.4 } },
      { food: 'Black Beans (100g)', protein: '9g', cal: '132', tag: 'Legume', macros: { protein: 9, carbs: 24, fat: 0.5 } },
      { food: 'Edamame (100g)', protein: '11g', cal: '122', tag: 'Soy', macros: { protein: 11, carbs: 10, fat: 5 } },
      { food: 'Pea Protein (1 scoop)', protein: '21g', cal: '100', tag: 'Supplement', macros: { protein: 21, carbs: 2, fat: 1.5 } },
      { food: 'Hemp Seeds (30g)', protein: '10g', cal: '166', tag: 'Seeds', macros: { protein: 10, carbs: 2.6, fat: 14 } },
      { food: 'Seitan (100g)', protein: '25g', cal: '150', tag: 'Wheat', macros: { protein: 25, carbs: 14, fat: 1.9 } },
    ],
    'Flexible': [
      { food: 'Chicken Breast (100g)', protein: '31g', cal: '165', tag: 'Lean', macros: { protein: 31, carbs: 0, fat: 3.6 } },
      { food: 'Eggs (2 whole)', protein: '13g', cal: '155', tag: 'Complete', macros: { protein: 13, carbs: 1, fat: 11 } },
      { food: 'Paneer (100g)', protein: '18g', cal: '265', tag: 'Dairy', macros: { protein: 18, carbs: 1.2, fat: 20 } },
      { food: 'Lentils cooked (100g)', protein: '9g', cal: '116', tag: 'Plant', macros: { protein: 9, carbs: 20, fat: 0.4 } },
      { food: 'Greek Yogurt (150g)', protein: '15g', cal: '90', tag: 'Dairy', macros: { protein: 15, carbs: 6, fat: 0.7 } },
      { food: 'Tuna (100g)', protein: '30g', cal: '130', tag: 'Lean', macros: { protein: 30, carbs: 0, fat: 1 } },
      { food: 'Whey Protein (1 scoop)', protein: '25g', cal: '120', tag: 'Supplement', macros: { protein: 25, carbs: 3, fat: 2 } },
      { food: 'Tofu (100g)', protein: '8g', cal: '76', tag: 'Soy', macros: { protein: 8, carbs: 1.9, fat: 4.2 } },
    ],
  };
  const pSources = proteinSources[dietGoal.diet] || proteinSources['Flexible'];
  const tagColors = { Lean: C.accent, Complete: C.blue, Dairy: C.teal, Plant: C.green, Soy: C.purple, Supplement: C.orange, 'Omega-3': C.blue, Legume: C.teal, Fermented: C.pink, Seeds: C.purple, Wheat: C.orange };

  const calPct = Math.min(Math.round(((tot.calories || 0) / dri.calories) * 100), 100);
  const catMeta = NMETA.filter(n => n.cat === nutriTab);

  return (
    <div>
      <Hd t="DIET" s={`${dietGoal.goal} · ${dietGoal.calories} kcal target`} />

      {/* Goal tags + notepad toggle */}
      <div style={{ padding: '0 16px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          <span style={{ background: C.accent + '18', color: C.accent, fontSize: 10, fontFamily: fb, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '4px 10px', borderRadius: 6 }}>{dietGoal.goal}</span>
          {dietGoal.speed && <span style={{ background: C.s3, color: C.sub, fontSize: 10, fontFamily: fb, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '4px 10px', borderRadius: 6 }}>{dietGoal.speed?.split('(')[0].trim()}</span>}
          {dietGoal.diet && <span style={{ background: C.s3, color: C.sub, fontSize: 10, fontFamily: fb, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '4px 10px', borderRadius: 6 }}>{dietGoal.diet}</span>}
        </div>
        <button onClick={() => setNoteOpen(o => !o)} style={{
          background: noteOpen ? C.accent + '1A' : C.s3, border: `1px solid ${noteOpen ? C.accent : C.border}`,
          borderRadius: 8, padding: '5px 10px', color: noteOpen ? C.accent : C.muted,
          fontFamily: fb, fontWeight: 700, fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer', flexShrink: 0, marginLeft: 8,
        }}>📝 {noteOpen ? 'Close' : 'Notes'}</button>
      </div>

      {/* Notepad */}
      {noteOpen && (
        <div style={{ padding: '0 16px 12px' }}>
          <div style={{ background: C.s2, border: `1px solid ${C.accent}33`, borderRadius: 14, overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ padding: '12px 14px 10px', borderBottom: `1px solid ${C.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontFamily: fn, fontSize: 14, fontWeight: 700, color: C.accent }}>
                  🥩 High Protein Guide · {dietGoal.diet || 'Flexible'}
                </div>
                <span style={{ fontSize: 10, color: C.muted, fontFamily: fb, fontWeight: 600 }}>per serving</span>
              </div>
              <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>Protein · Carbs · Fat · Calories</div>
            </div>
            {/* Protein sources table */}
            <div style={{ maxHeight: 220, overflowY: 'auto' }}>
              {pSources.map((s, i) => {
                const tc = tagColors[s.tag] || C.accent;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderBottom: `0.5px solid ${C.border}` }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{s.food}</div>
                      <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>
                        <span style={{ color: C.blue }}>P {s.macros.protein}g</span>
                        {' · '}
                        <span style={{ color: C.teal }}>C {s.macros.carbs}g</span>
                        {' · '}
                        <span style={{ color: C.orange }}>F {s.macros.fat}g</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.accent }}>{s.cal}</div>
                      <div style={{ background: tc + '18', color: tc, fontSize: 7, fontFamily: fb, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '1px 5px', borderRadius: 3, marginTop: 2 }}>{s.tag}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Personal notes */}
            <div style={{ padding: '10px 14px' }}>
              <div style={{ fontSize: 10, color: C.muted, fontFamily: fb, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>📝 My Notes</div>
              <textarea value={note} onChange={e => setNote(e.target.value.slice(0, 400))} rows={3}
                placeholder="Track how you feel, cheat meals, energy levels..."
                style={{ width: '100%', boxSizing: 'border-box', background: 'transparent', border: 'none', color: C.text, fontSize: 12, fontFamily: fn, resize: 'none', outline: 'none', lineHeight: 1.6 }} />
              <div style={{ textAlign: 'right', fontSize: 9, color: C.muted }}>{note.length}/400</div>
            </div>
          </div>
        </div>
      )}

      {/* Water Tracker */}
      <div style={{ padding: '0 16px 2px' }}>
        <WaterTracker />
      </div>

      {/* LOG FOOD — moved to top for quick access */}
      <div style={{ padding: '0 16px' }}>
        <div style={{ fontFamily: fn, fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em', color: C.text, marginBottom: 10 }}>Log Food</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
          <input
            value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && logFood()}
            placeholder="Describe any food in plain language..."
            style={{ flex: 1, background: C.s2, border: `1px solid ${C.border}`, borderRadius: 12, padding: '13px 14px', color: C.text, fontSize: 13, fontFamily: fn, outline: 'none' }}
          />
          <button onClick={logFood} disabled={loading || !input.trim()} style={{
            background: C.accent, border: 'none', borderRadius: 12, padding: '0 18px', color: '#000',
            fontFamily: fn, fontWeight: 700, fontSize: 12, cursor: (loading || !input.trim()) ? 'not-allowed' : 'pointer', opacity: (loading || !input.trim()) ? 0.4 : 1,
          }}>{loading ? '…' : 'LOG'}</button>
        </div>
        <div style={{ color: C.muted, fontSize: 11, marginBottom: 12 }}>AI estimates all 15 nutrients automatically</div>
        {mealLog.map((item, i) => <MealCard key={i} item={item} onDelete={() => setMealLog(l => l.filter((_, j) => j !== i))} />)}
      </div>

      {/* Calorie summary */}
      <div style={{ padding: '14px 16px 0' }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
            <div>
              <Lbl text="Total Calories" style={{ marginBottom: 5 }} />
              <div style={{ fontFamily: fn, fontSize: 48, fontWeight: 800, color: C.text, lineHeight: 1, letterSpacing: '-0.03em' }}>{Math.round(tot.calories || 0)}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: fn, fontWeight: 700, fontSize: 15, color: (dri.calories - (tot.calories || 0)) > 0 ? C.accent : C.red }}>
                {(dri.calories - (tot.calories || 0)) > 0 ? `${dri.calories - Math.round(tot.calories || 0)} kcal left` : 'Over goal'}
              </div>
              <div style={{ color: C.muted, fontSize: 11 }}>of {dri.calories} kcal</div>
              {dietGoal.targetWeight && dietGoal.currentWeight && (
                <div style={{ color: C.sub, fontSize: 11, marginTop: 4 }}>
                  {dietGoal.currentWeight}→{dietGoal.targetWeight}kg · <span style={{ color: C.accent }}>{Math.abs((dietGoal.currentWeight - dietGoal.targetWeight).toFixed(1))}kg to go</span>
                </div>
              )}
            </div>
          </div>
          <div style={{ height: 6, background: C.s4, borderRadius: 3 }}>
            <div style={{ height: '100%', width: `${calPct}%`, background: calPct > 100 ? C.red : C.accent, borderRadius: 3, transition: 'width 0.4s ease' }} />
          </div>
        </Card>
      </div>

      {/* Full Nutrition Panel */}
      <div style={{ padding: '14px 16px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontFamily: fn, fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em', color: C.text }}>Full Nutrition</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {[['↓', C.blue, 'Deficit'], ['✓', C.green, 'Optimal'], ['↑', C.red, 'Excess']].map(([ic, c, l]) => (
              <span key={l} style={{ fontSize: 9, color: c, fontFamily: fb, fontWeight: 700, background: c + '18', padding: '2px 6px', borderRadius: 3 }}>{ic} {l}</span>
            ))}
          </div>
        </div>
        <Card style={{ padding: '0 16px' }}>
          <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}` }}>
            {[['macro', 'Macros'], ['mineral', 'Minerals'], ['vitamin', 'Vitamins']].map(([k, l]) => (
              <button key={k} onClick={() => setNutriTab(k)} style={{
                flex: 1, padding: '12px 0', background: 'none', border: 'none',
                borderBottom: `2px solid ${nutriTab === k ? C.accent : 'transparent'}`,
                color: nutriTab === k ? C.accent : C.muted, fontFamily: fn, fontWeight: 700, fontSize: 11,
                textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'pointer',
              }}>{l}</button>
            ))}
          </div>
          <div style={{ paddingBottom: 4 }}>
            {catMeta.map(n => <NRow key={n.key} label={n.label} current={tot[n.key] || 0} dri={dri[n.key] || BASE_DRI[n.key] || 0} unit={n.unit} color={n.color} />)}
          </div>
        </Card>
      </div>
    </div>
  );
}


