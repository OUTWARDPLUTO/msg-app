import { useState, useEffect } from 'react';
import { C, fn, fb } from '../shared/theme.js';
import { Card, Lbl, Spinner } from '../shared/primitives.jsx';
import { getFBFirestore, serverTimestamp } from '../shared/firebase.js';

export default function AttendanceTab({ gymId, onViewMemberProfile }) {
  const [logs, setLogs]         = useState([]);
  const [members, setMembers]   = useState({});
  const [allMembers, setAllMembers] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [manualModal, setManualModal] = useState(false);
  const [manualMember, setManualMember] = useState(null);
  const [manualLoading, setManualLoading] = useState(false);
  const [manualDone, setManualDone] = useState(false);

  // Reception QR States
  const [qrModal, setQrModal] = useState(false);
  const [qrToken, setQrToken] = useState('');
  const [expiresIn, setExpiresIn] = useState(0);
  const [useQrSetting, setUseQrSetting] = useState(false);
  const [useStaticQrSetting, setUseStaticQrSetting] = useState(false);

  // Fetch active settings when QR code is toggled/loaded
  useEffect(() => {
    if (!gymId) return;
    getFBFirestore().then(db => db.doc(`gyms/${gymId}`).get()).then(snap => {
      if (snap.exists) {
        const settings = snap.data().settings || {};
        setUseQrSetting(settings.useQr || false);
        setUseStaticQrSetting(settings.useStaticQr || false);
      }
    }).catch(() => {});
  }, [gymId, qrModal]);

  const generateNewToken = async () => {
    const token = String(Math.floor(100000 + Math.random() * 900000));
    setQrToken(token);
    setExpiresIn(120);
    try {
      const db = await getFBFirestore();
      await db.doc(`gyms/${gymId}`).update({
        activeQrToken: {
          token,
          expiresAt: new Date(Date.now() + 120000)
        }
      });
    } catch (e) {
      console.warn("Failed to save QR token to Firestore:", e);
    }
  };

  useEffect(() => {
    if (!qrModal || !gymId) return;
    generateNewToken();
    const interval = setInterval(() => {
      setExpiresIn(prev => {
        if (prev <= 1) {
          generateNewToken();
          return 120;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [qrModal, gymId]);

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
      const all = [];
      memberSnap.docs.forEach(d => {
        const data = d.data();
        map[data.uid] = data.name;
        all.push({ uid: data.uid, name: data.name });
      });
      setMembers(map);
      setAllMembers(all.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (e) { console.warn(e); }
    setLoading(false);
  }

  // Manual check-in by owner
  async function handleManualCheckIn() {
    if (!manualMember) return;
    setManualLoading(true);
    try {
      const db = await getFBFirestore();
      const today = new Date().toISOString().split('T')[0];
      const existing = await db.collection(`attendance/${gymId}/logs`)
        .where('uid', '==', manualMember.uid).where('date', '==', today).get();
      if (!existing.empty) {
        setManualDone('already');
      } else {
        await db.collection(`attendance/${gymId}/logs`).add({
          uid: manualMember.uid,
          gymId,
          date: today,
          checkedInAt: serverTimestamp(),
          manual: true,
        });
        setManualDone('success');
        // Refresh logs
        const snap = await db.collection(`attendance/${gymId}/logs`)
          .where('date', '>=', new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0])
          .orderBy('date', 'desc').get();
        setLogs(snap.docs.map(d => d.data()));
      }
    } catch (e) { console.warn(e); }
    setManualLoading(false);
    setTimeout(() => {
      setManualDone(false);
      setManualMember(null);
      setManualModal(false);
    }, 1500);
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

  // Filter check-in log by search
  const filteredGrouped = search.trim()
    ? grouped.map(([date, entries]) => [
        date,
        entries.filter(e => (members[e.uid] || '').toLowerCase().includes(search.toLowerCase()))
      ]).filter(([, entries]) => entries.length > 0)
    : grouped;

  const memberSearchResults = manualModal && manualMember === null
    ? allMembers.filter(m => {
        const q = search.toLowerCase();
        return (m.name || '').toLowerCase().includes(q);
      })
    : [];

  return (
    <div style={{ paddingBottom: 24 }}>
    {/* Header */}
    <div style={{ padding: '20px 20px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <div style={{ fontFamily: fn, fontSize: 24, fontWeight: 800, color: C.text, letterSpacing: '-0.02em' }}>Attendance</div>
        <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>Gym check-in history</div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => setQrModal(true)} style={{
          background: C.s2, border: `1px solid ${C.border}`, borderRadius: 12,
          padding: '9px 14px', color: C.text, fontFamily: fn, fontWeight: 800,
          fontSize: 11, cursor: 'pointer',
        }}>
          📱 Reception QR
        </button>
        <button onClick={() => { setManualModal(true); setManualMember(null); setManualDone(false); setSearch(''); }} style={{
          background: C.accent, border: 'none', borderRadius: 12,
          padding: '9px 14px', color: '#111', fontFamily: fn, fontWeight: 800,
          fontSize: 11, cursor: 'pointer', boxShadow: C.accentShadow,
        }}>
          ✋ Manual
        </button>
      </div>
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
              <div key={d.date} title={`${d.label}: ${d.count} check-in${d.count !== 1 ? 's' : ''}`}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, minWidth: 14 }}>
                <div style={{
                  width: 10, borderRadius: '3px 3px 0 0',
                  height: `${Math.max((d.count / maxCount) * 64, d.count > 0 ? 6 : 0)}px`,
                  background: d.date === todayKey ? C.accent : C.accent + '55',
                  transition: 'height 0.4s ease',
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

      {/* Search */}
      <div style={{ padding: '0 16px', marginBottom: 14 }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search member name…"
          style={{
            width: '100%', boxSizing: 'border-box', background: C.s2,
            border: `1px solid ${search ? C.accent : C.border}`, borderRadius: 12, padding: '10px 14px',
            color: C.text, fontSize: 13, fontFamily: fn, outline: 'none',
          }}
        />
      </div>

      {/* Check-in Log */}
      <div style={{ padding: '0 16px' }}>
        <div style={{ fontFamily: fn, fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 12 }}>
          Check-in Log
          {search && <span style={{ fontSize: 12, color: C.muted, fontWeight: 500, marginLeft: 8 }}>— filtering by "{search}"</span>}
        </div>
        {filteredGrouped.length === 0 ? (
          <div style={{ color: C.muted, fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
            {search ? 'No check-ins match your search.' : 'No check-ins recorded yet. Members check in from their Home screen.'}
          </div>
        ) : filteredGrouped.map(([date, entries]) => (
          <div key={date} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: C.muted, fontFamily: fb, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
              {new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
              <span style={{ color: C.accent, marginLeft: 8 }}>{entries.length} check-in{entries.length !== 1 ? 's' : ''}</span>
            </div>
            {entries.map((e, i) => (
              <div key={i} className="msg-clickable" onClick={() => onViewMemberProfile && onViewMemberProfile({ uid: e.uid, name: members[e.uid] || 'Member' })} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
                background: C.s2, border: `1px solid ${C.border}`, borderRadius: 10, marginBottom: 6,
                cursor: 'pointer',
              }}>
                {/* Avatar */}
                <div style={{
                  width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                  background: C.accent + '20', border: `1px solid ${C.accent}33`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: fn, fontSize: 12, fontWeight: 800, color: C.accent,
                }}>
                  {(members[e.uid] || '?').charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{members[e.uid] || 'Member'}</div>
                  <div style={{ fontSize: 10, color: C.muted, display: 'flex', alignItems: 'center', gap: 6, marginTop: 1 }}>
                    {e.checkedInAt?.toDate
                      ? e.checkedInAt.toDate().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                      : '—'
                    }
                    {e.manual && <span style={{ background: C.blue + '20', color: C.blue, fontSize: 8, padding: '1px 5px', borderRadius: 4, fontFamily: fb, fontWeight: 700 }}>MANUAL</span>}
                  </div>
                </div>
                <span style={{ fontSize: 18 }}>✅</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Manual Check-in Modal */}
      {manualModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end' }}
          onClick={e => { if (e.target === e.currentTarget) setManualModal(false); }}>
          <div style={{ background: C.s1, borderRadius: '24px 24px 0 0', width: '100%', maxHeight: '80dvh', overflowY: 'auto', padding: '20px 20px calc(env(safe-area-inset-bottom,0) + 20px)' }}>
            <div style={{ fontFamily: fn, fontSize: 17, fontWeight: 800, color: C.text, marginBottom: 4 }}>Manual Check-in</div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>Log a walk-in for today.</div>

            {manualDone ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>{manualDone === 'already' ? '⚠️' : '✅'}</div>
                <div style={{ fontFamily: fn, fontSize: 15, fontWeight: 700, color: C.text }}>
                  {manualDone === 'already' ? 'Already checked in today' : `${manualMember?.name} checked in!`}
                </div>
              </div>
            ) : manualMember ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: C.s2, border: `1px solid ${C.accent}44`, borderRadius: 12, marginBottom: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: C.accent + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: fn, fontSize: 14, fontWeight: 800, color: C.accent }}>
                    {manualMember.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{manualMember.name}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>Today, {new Date().toLocaleDateString('en-IN')}</div>
                  </div>
                  <button onClick={() => setManualMember(null)} style={{ background: C.s3, border: 'none', borderRadius: 8, padding: '5px 10px', fontSize: 11, color: C.sub, cursor: 'pointer' }}>Change</button>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setManualModal(false)} style={{ flex: 1, padding: 12, background: C.s3, border: `1px solid ${C.border}`, borderRadius: 12, color: C.sub, fontFamily: fn, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                  <button onClick={handleManualCheckIn} disabled={manualLoading} style={{ flex: 2, padding: 12, background: C.accent, border: 'none', borderRadius: 12, color: '#111', fontFamily: fn, fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
                    {manualLoading ? 'Logging…' : '✅ Check In Now'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <input
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search member by name…"
                  autoFocus
                  style={{ width: '100%', boxSizing: 'border-box', background: C.s2, border: `1px solid ${C.accent}`, borderRadius: 12, padding: '11px 14px', color: C.text, fontSize: 13, fontFamily: fn, outline: 'none', marginBottom: 12 }}
                />
                {search.trim().length > 0 && (
                  <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                    {memberSearchResults.length === 0 ? (
                      <div style={{ fontSize: 13, color: C.muted, textAlign: 'center', padding: '16px 0' }}>No members found</div>
                    ) : memberSearchResults.map(m => (
                      <button key={m.uid} onClick={() => { setManualMember(m); setSearch(''); }} style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 12px', background: C.s2, border: `1px solid ${C.border}`,
                        borderRadius: 10, marginBottom: 7, cursor: 'pointer', textAlign: 'left',
                      }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: C.accent + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: fn, fontSize: 13, fontWeight: 800, color: C.accent }}>
                          {m.name.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{m.name}</div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Reception QR Modal overlay */}
      {qrModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: '#111', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, boxSizing: 'border-box', fontFamily: fn }} className="msg-anim-fadein">
          <button onClick={() => setQrModal(false)} style={{ position: 'absolute', top: 24, right: 24, background: 'rgba(255,255,255,0.1)', border: 'none', width: 40, height: 40, borderRadius: '50%', color: '#fff', fontSize: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
          
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: C.accent, marginBottom: 8 }}>Reception Check-in QR</div>
            <div style={{ fontSize: 13, color: '#aaa', maxWidth: 320, lineHeight: 1.5 }}>
              Display this screen at the entrance. Members scan this code using their phone camera to check in.
            </div>
          </div>
          
          {/* QR Code Container */}
          <div style={{ background: '#fff', padding: 18, borderRadius: 20, boxShadow: '0 10px 40px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 20 }}>
            {useStaticQrSetting ? (
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&color=000000&bgcolor=ffffff&qzone=1&data=${encodeURIComponent(`msg-checkin-static:${gymId}`)}`}
                alt="Static Check-in QR Code"
                style={{ width: 220, height: 220 }}
              />
            ) : qrToken ? (
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&color=000000&bgcolor=ffffff&qzone=1&data=${encodeURIComponent(`msg-checkin:${gymId}:${qrToken}`)}`}
                alt="Check-in QR Code"
                style={{ width: 220, height: 220 }}
              />
            ) : (
              <div style={{ width: 220, height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#111', fontWeight: 600 }}>Generating...</div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            {!useStaticQrSetting ? (
              <div style={{ background: 'rgba(217,154,43,0.15)', color: C.accent, borderRadius: 20, padding: '6px 16px', fontSize: 13, fontWeight: 700, fontFamily: fb, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>🔄 Rotates in:</span>
                <span style={{ fontSize: 14, minWidth: 32, textAlign: 'left' }}>{expiresIn}s</span>
              </div>
            ) : (
              <div style={{ background: 'rgba(78,159,255,0.15)', color: C.blue, borderRadius: 20, padding: '6px 16px', fontSize: 13, fontWeight: 700, fontFamily: fb }}>
                📄 Static Printed QR Active
              </div>
            )}
            
            {/* Helper warning if QR Verification is not turned on in Gym Settings */}
            {!useQrSetting && (
              <div style={{ background: 'rgba(217,83,79,0.15)', color: C.red, borderRadius: 10, padding: '8px 14px', fontSize: 11, maxWidth: 280, textAlign: 'center', marginTop: 16, border: `1px solid ${C.red}33` }}>
                ⚠️ <strong>QR Check-in is Disabled:</strong> Please turn on "QR Code Scan Verification" in settings to enforce this QR scan.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
