import { useState, useEffect } from 'react';
import { C, fn, fb } from '../shared/theme.js';
import { Card, Lbl, StatusBadge, Spinner } from '../shared/primitives.jsx';
import { getFBFirestore } from '../shared/firebase.js';

export default function AlertsTab({ gymId, onViewMemberProfile }) {
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
    <div style={{ paddingBottom: 24 }}>
      <div style={{ padding: '20px 20px 12px' }}>
        <div style={{ fontFamily: fn, fontSize: 24, fontWeight: 800, color: C.text, letterSpacing: '-0.02em' }}>Alerts</div>
        <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>Members who need attention</div>
      </div>

      {/* Threshold selector */}
      <div style={{ padding: '0 16px', marginBottom: 16 }}>
        <Card style={{ padding: '12px 16px' }}>
          <Lbl text="Inactivity Threshold" style={{ marginBottom: 10 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            {[3, 5, 7].map(d => (
              <button key={d} onClick={() => setThreshold(d)} style={{
                flex: 1, padding: '8px',
                background: threshold === d ? C.accent + '18' : C.s3,
                border: `1px solid ${threshold === d ? C.accent : C.border}`,
                borderRadius: 10, color: threshold === d ? C.accent : C.sub,
                fontFamily: fn, fontWeight: 700, fontSize: 13, cursor: 'pointer',
              }}>
                {d} days
              </button>
            ))}
          </div>
        </Card>
      </div>

      {loading ? <Spinner text="Checking members…" /> : (
        <>
          {/* At-Risk Section */}
          <Section
            title="⚠️ At Risk"
            sub={`Inactive for ${threshold - 2}–${threshold} days`}
            color={C.orange}
            members={atRisk}
            badge="at-risk"
            onViewMemberProfile={onViewMemberProfile}
          />

          {/* Inactive Section */}
          <Section
            title="🔴 Inactive"
            sub={`No activity for ${threshold}+ days`}
            color={C.red}
            members={inactive}
            badge="inactive"
            onViewMemberProfile={onViewMemberProfile}
          />

          {inactive.length === 0 && atRisk.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 16px' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🎉</div>
              <div style={{ fontFamily: fn, fontSize: 18, fontWeight: 700, color: C.green, marginBottom: 6 }}>All members active!</div>
              <div style={{ color: C.sub, fontSize: 13 }}>No one needs follow-up right now.</div>
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
    <div style={{ padding: '0 16px', marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div>
          <div style={{ fontFamily: fn, fontSize: 15, fontWeight: 800, color }}>
            {title} <span style={{ fontSize: 12, color: C.muted }}>({members.length})</span>
          </div>
          <div style={{ fontSize: 11, color: C.muted }}>{sub}</div>
        </div>
      </div>
      {members.map(m => (
        <div key={m.id} className="msg-clickable" onClick={() => onViewMemberProfile && onViewMemberProfile(m)} style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px',
          background: C.s2, border: `1px solid ${color}33`, borderLeft: `3px solid ${color}`,
          borderRadius: '2px 12px 12px 2px', marginBottom: 8, cursor: 'pointer',
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
            background: color + '18', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 14, fontWeight: 800, color, fontFamily: 'inherit',
          }}>
            {(m.name || '?').charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {m.name || 'Unnamed'}
            </div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>
              {m.daysSince != null ? `${m.daysSince} days inactive` : 'Never active'}
            </div>
          </div>
          <StatusBadge status={badge} />
        </div>
      ))}
    </div>
  );
}
