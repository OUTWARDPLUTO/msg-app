import { useState } from 'react';
import { C, fn, fb } from '../shared/theme.js';
import { Lbl } from '../shared/primitives.jsx';

export default function ProfileSetupScreen({ user, onComplete }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    age: '', gender: '', height: '', currentWeight: '', targetWeight: '',
    goal: '', activity: '', diet: '',
  });
  const sp = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const steps = [
    {
      title: 'Tell us about yourself', sub: 'Personalise your experience',
      fields: [
        { l: 'Age', k: 'age', type: 'number', p: 'e.g. 22' },
        { l: 'Height (cm)', k: 'height', type: 'number', p: 'e.g. 175' },
        { l: 'Current Weight (kg)', k: 'currentWeight', type: 'number', p: 'e.g. 72.5' },
        { l: 'Target Weight (kg)', k: 'targetWeight', type: 'number', p: 'e.g. 68' },
      ],
      k: '',
    },
    {
      title: 'Your fitness goal', sub: 'We tailor everything around this',
      k: 'goal',
      opts: ['Lose Weight', 'Gain Muscle', 'Improve Fitness', 'Maintain Weight'],
    },
    {
      title: 'Activity level', sub: 'How active is your daily life?',
      k: 'activity',
      opts: ['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active'],
    },
    {
      title: 'Diet preference', sub: 'Helps us suggest the right foods',
      k: 'diet',
      opts: ['Non-Vegetarian', 'Vegetarian', 'Vegan', 'Flexible'],
    },
  ];

  const cur = steps[step];
  const isLast = step === steps.length - 1;
  const canNext = cur.k
    ? !!form[cur.k]
    : cur.fields?.every(f => !f.required || form[f.k]);

  return (
    <div style={{
      background: C.bg, color: C.text, fontFamily: fn,
      height: '100dvh', maxWidth: 430, margin: '0 auto', padding: '24px 20px',
      boxSizing: 'border-box', overflowY: 'auto', display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 58, fontWeight: 800, color: C.accent, letterSpacing: '-0.03em', lineHeight: 1 }}>MSG</div>
        <div style={{ color: C.sub, fontSize: 13, marginTop: 8 }}>
          Welcome, {(user?.name || 'there').split(' ')[0]}! Let's get you set up.
        </div>
      </div>

      {/* Progress dots */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 28 }}>
        {steps.map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: i <= step ? C.accent : C.s4, transition: 'background 0.3s',
          }} />
        ))}
      </div>

      {/* Step title */}
      <div style={{ fontFamily: fn, fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: '-0.02em', marginBottom: 6 }}>
        {cur.title}
      </div>
      <div style={{ fontSize: 13, color: C.sub, marginBottom: 20, lineHeight: 1.5 }}>{cur.sub}</div>

      {/* Fields or option buttons */}
      {cur.fields ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {cur.fields.map(f => (
            <div key={f.k}>
              <Lbl text={f.l} style={{ marginBottom: 7 }} />
              <input
                type={f.type} value={form[f.k]} placeholder={f.p}
                onChange={e => sp(f.k, e.target.value)}
                style={{
                  width: '100%', boxSizing: 'border-box', background: C.s2,
                  border: `1px solid ${C.border}`, borderRadius: 12, padding: '13px 14px',
                  color: C.text, fontSize: 15, fontFamily: fn, outline: 'none',
                }}
              />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {cur.opts.map(o => (
            <button key={o} onClick={() => sp(cur.k, o)} style={{
              padding: '14px 18px', borderRadius: 14, textAlign: 'left', cursor: 'pointer',
              background: form[cur.k] === o ? C.accent + '18' : C.s2,
              border: `1px solid ${form[cur.k] === o ? C.accent : C.border}`,
              color: form[cur.k] === o ? C.accent : C.text,
              fontSize: 14, fontWeight: 600, fontFamily: fn,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              {o}
              {form[cur.k] === o && <span style={{ color: C.accent, fontSize: 16 }}>✓</span>}
            </button>
          ))}
        </div>
      )}

      {/* Gender (step 0 extra) */}
      {step === 0 && (
        <div style={{ marginTop: 14 }}>
          <Lbl text="Gender" style={{ marginBottom: 8 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            {['Male', 'Female', 'Other'].map(g => (
              <button key={g} onClick={() => sp('gender', g)} style={{
                flex: 1, padding: '9px 4px',
                background: form.gender === g ? C.accent + '18' : C.s2,
                border: `1px solid ${form.gender === g ? C.accent : C.border}`,
                borderRadius: 10, color: form.gender === g ? C.accent : C.sub,
                fontFamily: fn, fontWeight: 600, fontSize: 11, cursor: 'pointer',
              }}>{g}</button>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: 'flex', gap: 10, marginTop: 'auto', paddingTop: 24 }}>
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)} style={{
            flex: 1, padding: '14px', background: C.s2, border: `1px solid ${C.border}`,
            borderRadius: 14, color: C.sub, fontFamily: fn, fontWeight: 600, fontSize: 14, cursor: 'pointer',
          }}>← Back</button>
        )}
        <button onClick={() => {
          if (isLast) onComplete({ ...user, profile: form });
          else setStep(s => s + 1);
        }} disabled={!canNext} style={{
          flex: 2, padding: '14px',
          background: canNext ? C.accent : C.s4, color: canNext ? '#111' : C.muted,
          border: 'none', borderRadius: 14, fontFamily: fn, fontWeight: 800, fontSize: 14,
          cursor: canNext ? 'pointer' : 'not-allowed',
          boxShadow: canNext ? C.accentShadow : 'none', transition: 'all 0.2s',
        }}>
          {isLast ? "Let's Go 🚀" : 'Next →'}
        </button>
      </div>
      <button onClick={() => onComplete(user)} style={{
        marginTop: 16, background: 'none', border: 'none', color: C.muted, fontSize: 12,
        cursor: 'pointer', fontFamily: fn,
      }}>
        Fill this in later
      </button>
    </div>
  );
}
