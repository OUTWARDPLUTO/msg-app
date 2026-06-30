import { useState, useEffect } from 'react';
import { C, fn, fb } from '../shared/theme.js';
import { Card, Lbl, StatusBadge, Spinner, Skeleton } from '../shared/primitives.jsx';
import { getFBFirestore } from '../shared/firebase.js';

export default function AlertsTab({ gymId, onViewMemberProfile, onBack, hideHeader }) {
  const [inactive, setInactive] = useState([]);   // 5+ days
  const [atRisk, setAtRisk]     = useState([]);   // 3-5 days
  const [loading, setLoading]   = useState(true);
  const [threshold, setThreshold] = useState(5);

  useEffect(() => { if (gymId) load(); }, [gymId, threshold]);

  async function load() {
    setLoading(true);
    try {
      const db = await getFBFirestore();
      const snap = await db.collection('members').where('gymId', '==', gymId).get();
      const members = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const now = Date.now();
      const tMs = threshold * 86400000;
      const warnMs = (threshold - 2) * 86400000; // 2 days before threshold = at-risk

      const inactiveList = [];
      const atRiskList = [];
      members.forEach(m => {
        const la = m.lastActiveAt?.toDate?.()?.getTime() || 0;
        const diff = now - la;
        if (!la || diff > tMs) inactiveList.push({ ...m, daysSince: la ? Math.floor(diff / 86400000) : null });
        else if (diff > warnMs) atRiskList.push({ ...m, daysSince: Math.floor(diff / 86400000) });
      });
      setInactive(inactiveList);
      setAtRisk(atRiskList);
    } catch (e) { console.warn(e); }
    setLoading(false);
  }

  return (
    <div style={{ paddingBottom: 100, background: C.bg, minHeight: '100vh' }}>
      {/* Header */}
      {!hideHeader && (
        <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 20px) 20px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={onBack} style={{ background: 'none', border: 'none', color: C.text, padding: 0, cursor: 'pointer', display: 'flex' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <div style={{ fontFamily: fb, fontSize: 20, fontWeight: 700, color: C.text }}>Alerts</div>
          </div>
        </div>
      )}

      {/* Threshold selector */}
      <div style={{ padding: '0 20px', marginBottom: 24 }}>
        <div style={{ background: C.s1, border: `1px solid ${C.border}`, borderRadius: 16, padding: '16px' }}>
          <div style={{ fontSize: 12, color: C.sub, fontFamily: fb, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 12 }}>Inactivity Threshold</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[3, 5, 7].map(d => (
              <button key={d} onClick={() => setThreshold(d)} style={{
                flex: 1, padding: '10px',
                background: threshold === d ? C.accent : 'none',
                border: `1px solid ${threshold === d ? C.accent : C.border}`,
                borderRadius: 12, color: threshold === d ? '#111' : C.text,
                fontFamily: fb, fontWeight: 600, fontSize: 13, cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}>
                {d} days
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px', background: C.s1, border: `1px solid ${C.border}`, borderRadius: 16 }}>
              <Skeleton circle width={40} height={40} stagger={i} />
              <div style={{ flex: 1 }}>
                <Skeleton width={120} height={16} stagger={i} style={{ marginBottom: 6 }} />
                <Skeleton width={80} height={12} stagger={i} />
              </div>
              <Skeleton width={64} height={24} borderRadius={8} stagger={i} />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* At-Risk Section */}
          <Section
            title="At Risk"
            sub={`Inactive for ${threshold - 2}–${threshold} days`}
            color={C.orange}
            members={atRisk}
            badge="at-risk"
            onViewMemberProfile={onViewMemberProfile}
          />

          {/* Inactive Section */}
          <Section
            title="Inactive"
            sub={`No activity for ${threshold}+ days`}
            color={C.red}
            members={inactive}
            badge="inactive"
            onViewMemberProfile={onViewMemberProfile}
          />

          {inactive.length === 0 && atRisk.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: C.s1, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              </div>
              <div style={{ fontFamily: fb, fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 8 }}>All members active</div>
              <div style={{ color: C.sub, fontSize: 14, fontFamily: fn }}>No one needs follow-up right now.</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Section({ title, sub, color, members, badge, onViewMemberProfile }) {
  if (members.length === 0) return null;
  return (
    <div style={{ padding: '0 20px', marginBottom: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
        <div>
          <div style={{ fontFamily: fb, fontSize: 18, fontWeight: 700, color: C.text, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }}></div>
            {title}
            <span style={{ fontSize: 13, color: C.sub, fontWeight: 500 }}>{members.length}</span>
          </div>
        </div>
        <div style={{ fontSize: 12, color: C.sub, fontFamily: fn }}>{sub}</div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {members.map(m => (
          <div key={m.id} className="msg-clickable" onClick={() => onViewMemberProfile && onViewMemberProfile(m)} style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0',
            background: 'none', borderBottom: `1px solid ${C.border}`,
            cursor: 'pointer',
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
              background: C.s1, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 16, fontWeight: 700, color: C.text, fontFamily: fn,
            }}>
              {(m.name || '?').charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, fontFamily: fb, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>
                {m.name || 'Unnamed'}
              </div>
              <div style={{ fontSize: 13, fontFamily: fn, color: color, display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                {m.daysSince != null ? `${m.daysSince} days inactive` : 'Never active'}
              </div>
            </div>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: C.s1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.text }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
