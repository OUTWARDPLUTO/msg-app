import { useState, useEffect } from 'react';
import { C, fn, fb } from '../shared/theme.js';
import { Card, Lbl, Spinner } from '../shared/primitives.jsx';
import { getFBFirestore } from '../shared/firebase.js';

export default function AttendanceTab({ gymId }) {
  const [logs, setLogs]     = useState([]);
  const [members, setMembers] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (gymId) load(); }, [gymId]);

  async function load() {
    setLoading(true);
    try {
      const db = await getFBFirestore();
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
      const [attendSnap, memberSnap] = await Promise.all([
        db.collection(`attendance/${gymId}/logs`)
          .where('date', '>=', thirtyDaysAgo.toISOString().split('T')[0])
          .orderBy('date', 'desc').get(),
        db.collection('members').where('gymId', '==', gymId).get(),
      ]);
      setLogs(attendSnap.docs.map(d => d.data()));
      const map = {};
      memberSnap.docs.forEach(d => { map[d.data().uid] = d.data().name; });
      setMembers(map);
    } catch (e) { console.warn(e); }
    setLoading(false);
  }

  // Daily check-in counts (last 30 days)
  function buildDailyChart() {
    const counts = {};
    logs.forEach(l => { counts[l.date] = (counts[l.date] || 0) + 1; });
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = d.toISOString().split('T')[0];
      days.push({ date: key, label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), count: counts[key] || 0 });
    }
    return days;
  }

  // Group by date for log list
  function groupByDate() {
    const grouped = {};
    logs.forEach(l => {
      if (!grouped[l.date]) grouped[l.date] = [];
      grouped[l.date].push(l);
    });
    return Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a));
  }

  if (loading) return <Spinner text="Loading attendance…" />;

  const daily = buildDailyChart();
  const maxCount = Math.max(...daily.map(d => d.count), 1);
  const grouped = groupByDate();
  const todayKey = new Date().toISOString().split('T')[0];
  const todayCount = daily.find(d => d.date === todayKey)?.count || 0;

  return (
    <div style={{ paddingBottom: 24 }}>
      <div style={{ padding: '20px 20px 12px' }}>
        <div style={{ fontFamily: fn, fontSize: 24, fontWeight: 800, color: C.text, letterSpacing: '-0.02em' }}>Attendance</div>
        <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>Gym check-in history</div>
      </div>

      {/* Today's quick stat */}
      <div style={{ padding: '0 16px', marginBottom: 16 }}>
        <Card style={{ padding: '14px 16px', background: C.accentD, border: `1px solid ${C.accent}33` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Lbl text="Today's Check-ins" style={{ marginBottom: 4 }} />
              <div style={{ fontFamily: fn, fontSize: 40, fontWeight: 800, color: C.accent, lineHeight: 1 }}>{todayCount}</div>
            </div>
            <span style={{ fontSize: 40 }}>✅</span>
          </div>
        </Card>
      </div>

      {/* 30-day bar chart */}
      <div style={{ padding: '0 16px', marginBottom: 20 }}>
        <div style={{ fontFamily: fn, fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 12 }}>Last 30 Days</div>
        <Card style={{ padding: '12px 12px 8px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 80, overflowX: 'auto' }}>
            {daily.map(d => (
              <div key={d.date} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, minWidth: 14 }}>
                <div style={{
                  width: 10, borderRadius: '3px 3px 0 0',
                  height: `${Math.max((d.count / maxCount) * 64, d.count > 0 ? 6 : 0)}px`,
                  background: d.date === todayKey ? C.accent : C.accent + '55',
                  transition: 'height 0.4s ease',
                  title: `${d.count} check-ins`,
                }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ fontSize: 9, color: C.muted, fontFamily: fb }}>30d ago</span>
            <span style={{ fontSize: 9, color: C.muted, fontFamily: fb }}>Today</span>
          </div>
        </Card>
      </div>

      {/* Check-in Log */}
      <div style={{ padding: '0 16px' }}>
        <div style={{ fontFamily: fn, fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 12 }}>Check-in Log</div>
        {grouped.length === 0 ? (
          <div style={{ color: C.muted, fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
            No check-ins recorded yet. Members check in from their Home screen.
          </div>
        ) : grouped.map(([date, entries]) => (
          <div key={date} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: C.muted, fontFamily: fb, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
              {new Date(date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
              <span style={{ color: C.accent, marginLeft: 8 }}>{entries.length} check-in{entries.length !== 1 ? 's' : ''}</span>
            </div>
            {entries.map((e, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
                background: C.s2, border: `1px solid ${C.border}`, borderRadius: 10, marginBottom: 6,
              }}>
                <span style={{ fontSize: 18 }}>✅</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{members[e.uid] || 'Member'}</div>
                  <div style={{ fontSize: 10, color: C.muted }}>
                    {e.checkedInAt?.toDate ? e.checkedInAt.toDate().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
