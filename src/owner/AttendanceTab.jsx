import { useState, useEffect } from 'react';
import { C, fn, fb } from '../shared/theme.js';
import { Card, Lbl, Spinner, Skeleton } from '../shared/primitives.jsx';
import { getFBFirestore, serverTimestamp } from '../shared/firebase.js';

export default function AttendanceTab({ gymId, onViewMemberProfile, onBack }) {
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

  // removed early return

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

  return (    <div style={{ paddingBottom: 100, background: C.bg, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 20px) 20px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {onBack && (
            <button onClick={onBack} style={{ background: 'none', border: 'none', color: C.text, padding: 0, cursor: 'pointer', display: 'flex' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
          )}
          <div>
            <div style={{ fontFamily: fb, fontSize: 28, fontWeight: 800, color: C.text, letterSpacing: '-0.02em' }}>Attendance</div>
            <div style={{ fontSize: 13, color: C.sub, fontFamily: fn, marginTop: 4 }}>Check-ins & QR</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => setQrModal(true)} style={{
            background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14,
            width: 44, height: 44, color: C.text, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
          </button>
          <button onClick={() => { setManualModal(true); setManualMember(null); setManualDone(false); setSearch(''); }} style={{
            background: C.text, border: 'none', borderRadius: 14,
            padding: '0 16px', color: C.bg, fontFamily: fb, fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s ease', boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
            Manual
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <Skeleton height={120} borderRadius={20} />
          <Skeleton height={180} borderRadius={20} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3, 4].map(i => <Skeleton key={i} height={80} borderRadius={16} stagger={i} />)}
          </div>
        </div>
      ) : (
        <>
          {/* Today's quick stat */}
          <div style={{ padding: '0 20px', marginBottom: 24 }}>
            <div style={{ background: C.s1, border: `1px solid ${C.border}`, borderRadius: 20, padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 13, color: C.sub, fontFamily: fb, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>Today's Check-ins</div>
                  <div style={{ fontFamily: fb, fontSize: 48, fontWeight: 800, color: C.text, lineHeight: 1 }}>{todayCount}</div>
                </div>
                <div style={{ width: 48, height: 48, borderRadius: 16, background: C.bg, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.accent }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
              </div>
            </div>
          </div>

          {/* 30-day bar chart */}
          <div style={{ padding: '0 20px', marginBottom: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontFamily: fb, fontSize: 18, fontWeight: 700, color: C.text }}>Last 30 Days</div>
              <div style={{ fontSize: 13, fontFamily: fn, color: C.sub }}>Avg {Math.round(daily.reduce((acc, d) => acc + d.count, 0) / 30)}/day</div>
            </div>
            <div style={{ background: C.s1, border: `1px solid ${C.border}`, borderRadius: 20, padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: 100, gap: 4 }}>
                {daily.map(d => (
                  <div key={d.date} title={`${d.label}: ${d.count} check-ins`} style={{ flex: 1, display: 'flex', justifyContent: 'center', height: '100%', position: 'relative', group: 'bar' }}>
                    <div style={{
                      width: '100%', maxWidth: 6, borderRadius: 4,
                      height: `${Math.max((d.count / maxCount) * 100, d.count > 0 ? 8 : 0)}%`,
                      background: d.date === todayKey ? C.accent : C.s4,
                      transition: 'height 0.4s ease',
                      position: 'absolute', bottom: 0
                    }} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Search */}
          <div style={{ padding: '0 20px', marginBottom: 24 }}>
            <div style={{ position: 'relative' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.sub} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }}>
                <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search check-ins..."
            style={{
              width: '100%', boxSizing: 'border-box', background: C.bg,
              border: `1px solid ${C.border}`, borderRadius: 14, padding: '16px 16px 16px 44px',
              color: C.text, fontSize: 15, fontFamily: fn, outline: 'none', transition: 'border-color 0.2s ease'
            }}
            onFocus={e => e.target.style.borderColor = C.accent}
            onBlur={e => e.target.style.borderColor = C.border}
          />
        </div>
      </div>

      {/* Check-in Log */}
      <div style={{ padding: '0 20px' }}>
        <div style={{ fontFamily: fb, fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 16 }}>
          Recent Activity
        </div>
        {filteredGrouped.length === 0 ? (
          <div style={{ color: C.muted, fontSize: 14, textAlign: 'center', padding: '24px 0', background: C.s1, borderRadius: 20, border: `1px dashed ${C.border}` }}>
            {search ? 'No check-ins match your search.' : 'No check-ins recorded yet.'}
          </div>
        ) : filteredGrouped.map(([date, entries]) => (
          <div key={date} style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 13, color: C.sub, fontFamily: fb, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
              {new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
              <div style={{ height: 1, flex: 1, background: C.border }}></div>
            </div>
            <div style={{ background: C.s1, border: `1px solid ${C.border}`, borderRadius: 20, overflow: 'hidden' }}>
              {entries.map((e, i) => (
                <div key={i} className="msg-clickable" onClick={() => onViewMemberProfile && onViewMemberProfile({ uid: e.uid, name: members[e.uid] || 'Member' })} style={{
                  display: 'flex', alignItems: 'center', gap: 16, padding: '16px',
                  background: 'transparent', borderBottom: i !== entries.length - 1 ? `1px solid ${C.border}` : 'none',
                  cursor: 'pointer', transition: 'background 0.2s ease'
                }}>
                  {/* Avatar */}
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                    background: C.bg, border: `1px solid ${C.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: fb, fontSize: 18, fontWeight: 700, color: C.text,
                  }}>
                    {(members[e.uid] || '?').charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontFamily: fb, fontWeight: 700, color: C.text, marginBottom: 4 }}>{members[e.uid] || 'Member'}</div>
                    <div style={{ fontSize: 13, fontFamily: fn, color: C.sub, display: 'flex', alignItems: 'center', gap: 6 }}>
                      Checked in at {e.checkedInAt?.toDate ? e.checkedInAt.toDate().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                      {e.manual && <span style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text, fontSize: 10, padding: '2px 6px', borderRadius: 6, fontFamily: fb, fontWeight: 700, letterSpacing: '0.04em' }}>MANUAL</span>}
                    </div>
                  </div>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: C.green + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      </>
      )}

      {/* Manual Check-in Modal */}
      {manualModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 600, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', animation: 'msg-fadein 0.2s ease-out' }}
          onClick={e => { if (e.target === e.currentTarget) setManualModal(false); }}>
          <div style={{ background: C.s1, borderRadius: '32px 32px 0 0', borderTop: `1px solid ${C.border}`, width: '100%', maxHeight: '90dvh', overflowY: 'auto', padding: '32px 20px calc(env(safe-area-inset-bottom,0) + 24px)' }} className="msg-scroll">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ fontFamily: fb, fontSize: 24, fontWeight: 800, color: C.text }}>Manual Check-in</div>
              <button onClick={() => setManualModal(false)} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.text }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <div style={{ fontSize: 14, color: C.sub, marginBottom: 24, fontFamily: fn, lineHeight: 1.5 }}>Log a walk-in for today without scanning QR code.</div>

            {manualDone ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: manualDone === 'already' ? C.orange + '20' : C.green + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                  {manualDone === 'already' ? <span style={{ fontSize: 40 }}>⚠️</span> : <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                </div>
                <div style={{ fontFamily: fb, fontSize: 18, fontWeight: 700, color: C.text }}>
                  {manualDone === 'already' ? 'Already checked in today' : `${manualMember?.name} checked in!`}
                </div>
              </div>
            ) : manualMember ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 20, marginBottom: 24 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: C.s1, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: fb, fontSize: 18, fontWeight: 800, color: C.text }}>
                    {manualMember.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, fontFamily: fb, color: C.text, marginBottom: 4 }}>{manualMember.name}</div>
                    <div style={{ fontSize: 13, fontFamily: fn, color: C.sub }}>Today, {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}</div>
                  </div>
                  <button onClick={() => setManualMember(null)} style={{ background: C.s1, border: `1px solid ${C.border}`, borderRadius: 10, padding: '8px 12px', fontSize: 13, fontFamily: fb, fontWeight: 600, color: C.text, cursor: 'pointer', transition: 'all 0.2s ease' }}>Change</button>
                </div>
                <button onClick={handleManualCheckIn} disabled={manualLoading} style={{ width: '100%', padding: '16px', background: C.text, border: 'none', borderRadius: 16, color: C.bg, fontFamily: fb, fontWeight: 700, fontSize: 16, cursor: 'pointer', transition: 'all 0.2s ease', opacity: manualLoading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {manualLoading ? 'Logging…' : <><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Check In Now</>}
                </button>
              </div>
            ) : (
              <>
                <div style={{ position: 'relative', marginBottom: 16 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.sub} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }}>
                    <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                  <input
                    value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search member by name…"
                    autoFocus
                    style={{ width: '100%', boxSizing: 'border-box', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 16, padding: '16px 16px 16px 48px', color: C.text, fontSize: 15, fontFamily: fn, outline: 'none', transition: 'border-color 0.2s ease' }}
                    onFocus={e => e.target.style.borderColor = C.accent}
                    onBlur={e => e.target.style.borderColor = C.border}
                  />
                </div>
                {search.trim().length > 0 && (
                  <div style={{ maxHeight: 320, overflowY: 'auto' }} className="msg-scroll">
                    {memberSearchResults.length === 0 ? (
                      <div style={{ fontSize: 14, color: C.muted, textAlign: 'center', padding: '32px 0', background: C.bg, border: `1px dashed ${C.border}`, borderRadius: 16, fontFamily: fn }}>No members found</div>
                    ) : memberSearchResults.map(m => (
                      <button key={m.uid} onClick={() => { setManualMember(m); setSearch(''); }} style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 16,
                        padding: '12px 16px', background: C.bg, border: `1px solid ${C.border}`,
                        borderRadius: 16, marginBottom: 8, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease',
                      }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: C.s1, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: fb, fontSize: 16, fontWeight: 800, color: C.text }}>
                          {m.name.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ fontSize: 15, fontFamily: fb, fontWeight: 600, color: C.text }}>{m.name}</div>
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
        <div style={{ position: 'fixed', inset: 0, zIndex: 700, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, boxSizing: 'border-box', fontFamily: fn, animation: 'msg-fadein 0.2s ease-out' }}>
          <button onClick={() => setQrModal(false)} style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top, 0px) + 24px)', right: 24, background: C.s1, border: `1px solid ${C.border}`, width: 44, height: 44, borderRadius: '50%', color: C.text, fontSize: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
          
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 32, fontFamily: fb, fontWeight: 800, color: C.text, marginBottom: 12 }}>Check In</div>
            <div style={{ fontSize: 15, fontFamily: fn, color: C.sub, maxWidth: 300, lineHeight: 1.5, margin: '0 auto' }}>
              Members can scan this QR code with their MSG app to log their daily attendance.
            </div>
          </div>
          
          {/* QR Code Container */}
          <div style={{ background: '#fff', padding: 24, borderRadius: 32, boxShadow: '0 20px 60px rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
            {useStaticQrSetting ? (
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&color=000000&bgcolor=ffffff&qzone=1&data=${encodeURIComponent(`msg-checkin-static:${gymId}`)}`}
                alt="Static Check-in QR Code"
                style={{ width: 240, height: 240, borderRadius: 8 }}
              />
            ) : qrToken ? (
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&color=000000&bgcolor=ffffff&qzone=1&data=${encodeURIComponent(`msg-checkin:${gymId}:${qrToken}`)}`}
                alt="Check-in QR Code"
                style={{ width: 240, height: 240, borderRadius: 8 }}
              />
            ) : (
              <div style={{ width: 240, height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#111', fontFamily: fb, fontSize: 16, fontWeight: 600 }}>Generating QR...</div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            {!useStaticQrSetting ? (
              <>
                <div style={{ fontSize: 14, fontFamily: fb, fontWeight: 700, color: C.text }}>Dynamic QR Active</div>
                <div style={{ fontSize: 13, fontFamily: fn, color: C.muted }}>Refreshes in {expiresIn}s for security</div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 14, fontFamily: fb, fontWeight: 700, color: C.text }}>Static QR Active</div>
                <div style={{ fontSize: 13, fontFamily: fn, color: C.muted }}>Printed QR mode enabled in Settings</div>
              </>
            )}
            
            {/* Helper warning if QR Verification is not turned on in Gym Settings */}
            {!useQrSetting && (
              <div style={{ background: 'rgba(229,57,53,0.1)', color: C.accent, borderRadius: 16, padding: '12px 16px', fontSize: 13, fontFamily: fn, marginTop: 12, textAlign: 'center', maxWidth: 280 }}>
                ⚠️ QR check-in is disabled in your Gym Settings. Members cannot scan this right now.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
