import { useState } from 'react';
import { C, fn, fb } from '../shared/theme.js';
import { Card, Lbl } from '../shared/primitives.jsx';
import { getFBFirestore, createGym, serverTimestamp } from '../shared/firebase.js';

export default function GymSettingsTab({ gymId, gymName, ownerUid }) {
  const [name, setName]     = useState(gymName || '');
  const [threshold, setThreshold] = useState(5);
  const [saved, setSaved]   = useState(false);
  const [code, setCode]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const db = await getFBFirestore();
      await db.doc(`gyms/${gymId}`).update({
        name: name.trim() || gymName,
        settings: { inactivityThresholdDays: threshold },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { console.warn(e); }
    setLoading(false);
  };

  const loadCode = async () => {
    const db = await getFBFirestore();
    const doc = await db.doc(`gyms/${gymId}`).get();
    if (doc.exists) setCode(doc.data().gymCode || '—');
  };

  useState(() => { if (gymId) loadCode(); });

  return (
    <div style={{ padding: '20px 16px 32px' }}>
      <div style={{ fontFamily: fn, fontSize: 24, fontWeight: 800, color: C.text, letterSpacing: '-0.02em', marginBottom: 20 }}>Gym Settings</div>

      <Card style={{ padding: '14px 16px', marginBottom: 16 }}>
        <Lbl text="Gym Code" style={{ marginBottom: 8 }} />
        <div style={{ fontFamily: fn, fontSize: 32, fontWeight: 800, color: C.accent, letterSpacing: '0.3em' }}>
          {code || '——'}
        </div>
        <div style={{ fontSize: 12, color: C.sub, marginTop: 6, lineHeight: 1.5 }}>
          Share this code with members. They enter it in the app to join your gym.
        </div>
      </Card>

      <Card style={{ padding: '14px 16px', marginBottom: 16 }}>
        <Lbl text="Gym Name" style={{ marginBottom: 8 }} />
        <input
          value={name} onChange={e => setName(e.target.value)}
          style={{
            width: '100%', boxSizing: 'border-box', background: C.s3,
            border: `1px solid ${C.border}`, borderRadius: 10, padding: '11px 13px',
            color: C.text, fontSize: 14, fontFamily: fn, outline: 'none',
          }}
        />
      </Card>

      <Card style={{ padding: '14px 16px', marginBottom: 20 }}>
        <Lbl text="Inactivity Alert Threshold" style={{ marginBottom: 10 }} />
        <div style={{ display: 'flex', gap: 8 }}>
          {[3, 5, 7].map(d => (
            <button key={d} onClick={() => setThreshold(d)} style={{
              flex: 1, padding: '10px',
              background: threshold === d ? C.accent + '18' : C.s3,
              border: `1px solid ${threshold === d ? C.accent : C.border}`,
              borderRadius: 10, color: threshold === d ? C.accent : C.sub,
              fontFamily: fn, fontWeight: 700, fontSize: 13, cursor: 'pointer',
            }}>
              {d} days
            </button>
          ))}
        </div>
        <div style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>
          Members inactive longer than this will appear in Alerts.
        </div>
      </Card>

      <button onClick={handleSave} disabled={loading} style={{
        width: '100%', padding: '14px', background: saved ? C.green : C.accent,
        border: 'none', borderRadius: 14, color: '#111', fontFamily: fn, fontWeight: 800,
        fontSize: 14, cursor: 'pointer', transition: 'background 0.3s',
        boxShadow: C.accentShadow,
      }}>
        {loading ? 'Saving…' : saved ? '✓ Saved!' : 'Save Settings'}
      </button>
    </div>
  );
}
