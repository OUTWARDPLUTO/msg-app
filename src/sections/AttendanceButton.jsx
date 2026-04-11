import { useState, useEffect } from 'react';
import { C, fn, fb } from '../shared/theme.js';
import { checkIn, getTodayCheckIn } from '../shared/firebase.js';

export default function AttendanceButton({ uid, gymId }) {
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [animating, setAnimating] = useState(false);

  const DEMO = gymId === 'demo-gym';

  useEffect(() => {
    if (!uid || !gymId) { setLoading(false); return; }
    if (DEMO) {
      const today = new Date().toISOString().split('T')[0];
      setChecked(localStorage.getItem('demo_checkin') === today);
      setLoading(false);
      return;
    }
    getTodayCheckIn(uid, gymId).then(v => { setChecked(v); setLoading(false); });
  }, [uid, gymId]);

  const handleCheckIn = async () => {
    if (checked || loading) return;
    setLoading(true);
    if (DEMO) {
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem('demo_checkin', today);
      setChecked(true); setAnimating(true);
      setTimeout(() => setAnimating(false), 600);
      setLoading(false);
      return;
    }
    const result = await checkIn(uid, gymId);
    if (result.success || result.alreadyCheckedIn) {
      setChecked(true);
      setAnimating(true);
      setTimeout(() => setAnimating(false), 600);
    }
    setLoading(false);
  };


  if (!uid || !gymId) return null;

  return (
    <div style={{ padding: '0 16px', marginBottom: 12 }}>
      <button
        onClick={handleCheckIn}
        disabled={checked || loading}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 14,
          padding: '14px 18px',
          background: checked
            ? `linear-gradient(135deg, ${C.green}18, ${C.green}08)`
            : `linear-gradient(135deg, ${C.accent}18, ${C.accent}08)`,
          border: `1px solid ${checked ? C.green + '44' : C.accent + '44'}`,
          borderRadius: 16, cursor: checked ? 'default' : 'pointer',
          transition: 'all 0.3s ease',
          transform: animating ? 'scale(0.97)' : 'scale(1)',
        }}
      >
        <div style={{
          width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
          background: checked ? C.green + '20' : C.accent + '20',
          border: `1.5px solid ${checked ? C.green + '40' : C.accent + '40'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, transition: 'all 0.3s',
        }}>
          {loading ? '⏳' : checked ? '✅' : '📍'}
        </div>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div style={{
            fontFamily: fn, fontSize: 15, fontWeight: 800,
            color: checked ? C.green : C.accent, lineHeight: 1.1,
          }}>
            {loading ? 'Checking status…' : checked ? 'Checked In Today ✓' : 'Check In Now'}
          </div>
          <div style={{ fontSize: 11, color: C.sub, marginTop: 3 }}>
            {checked
              ? `Great! Your attendance is logged for ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
              : 'Tap to mark your gym attendance for today'}
          </div>
        </div>
        {!checked && !loading && (
          <div style={{ color: C.accent, fontSize: 18, flexShrink: 0 }}>›</div>
        )}
      </button>
    </div>
  );
}
