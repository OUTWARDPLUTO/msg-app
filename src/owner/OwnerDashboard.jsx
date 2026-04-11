import { useState, useEffect, useRef } from 'react';
import { C, fn, fb } from '../shared/theme.js';
import { Card, Lbl, ScoreRing, Spinner } from '../shared/primitives.jsx';
import { getFBFirestore } from '../shared/firebase.js';
import MemberListTab from './MemberListTab.jsx';
import AlertsTab from './AlertsTab.jsx';
import AttendanceTab from './AttendanceTab.jsx';
import CSVImport from './CSVImport.jsx';
import GymSettingsTab from './GymSettingsTab.jsx';

const NAV = [
  { key: 'overview',   label: 'Overview',  icon: '📊' },
  { key: 'members',    label: 'Members',   icon: '👥' },
  { key: 'alerts',     label: 'Alerts',    icon: '⚠️' },
  { key: 'attendance', label: 'Attend.',   icon: '📅' },
  { key: 'import',     label: 'Import',    icon: '📤' },
  { key: 'settings',   label: 'Settings',  icon: '⚙️' },
];

// ─── Owner Profile Dropdown ────────────────────────────────────────────────────
function OwnerProfileDropdown({ user, gymName, gymCode, onLogout, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const initials = (user?.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const row = (icon, label, sub, onClick, danger) => (
    <button key={label} onClick={() => { onClick?.(); onClose(); }} style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: 14,
      padding: '12px 16px', background: 'none', border: 'none',
      cursor: 'pointer', textAlign: 'left', borderBottom: `1px solid ${C.border}`,
    }}>
      <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: danger ? C.red : C.text }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>{sub}</div>}
      </div>
    </button>
  );

  return (
    <div ref={ref} style={{
      position: 'absolute', top: 64, right: 16, zIndex: 200, width: 280,
      background: C.s1, border: `1px solid ${C.border}`, borderRadius: 20,
      boxShadow: C.elevShadow, overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '16px', borderBottom: `1px solid ${C.border}`, display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%', background: C.accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: fn, fontSize: 15, fontWeight: 800, color: '#111', flexShrink: 0,
          overflow: 'hidden',
        }}>
          {user?.photo ? <img src={user.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
        </div>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ fontFamily: fn, fontSize: 14, fontWeight: 800, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.name || 'Gym Owner'}
          </div>
          <div style={{ fontSize: 11, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
          <div style={{
            display: 'inline-block', marginTop: 4,
            background: C.accent + '20', border: `1px solid ${C.accent}44`,
            borderRadius: 6, padding: '1px 8px', fontSize: 9,
            color: C.accent, fontFamily: fb, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>Owner · {gymName}</div>
        </div>
      </div>

      {/* Gym Code block */}
      <div style={{ padding: '12px 16px', background: C.s2, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 10, color: C.muted, fontFamily: fb, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Gym Code</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontFamily: fn, fontSize: 22, fontWeight: 800, color: C.accent, letterSpacing: '0.3em', flex: 1 }}>
            {gymCode || '——'}
          </div>
          <button onClick={() => {
            if (gymCode) { navigator.clipboard.writeText(gymCode).catch(() => {}); }
          }} style={{
            background: C.s3, border: `1px solid ${C.border}`, borderRadius: 8,
            padding: '5px 10px', fontSize: 11, color: C.sub, fontFamily: fn, fontWeight: 600, cursor: 'pointer',
          }}>Copy</button>
        </div>
        <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>Share this code with your members to let them join.</div>
      </div>

      {/* Actions */}
      {row('⚙️', 'Gym Settings', 'Manage gym code, name & alerts', null)}
      {row('🚪', 'Log Out', null, onLogout, true)}
    </div>
  );
}

// ─── Owner Dashboard ──────────────────────────────────────────────────────────
export default function OwnerDashboard({ gymId, gymName, user, onLogout }) {
  const [tab, setTab]           = useState('overview');
  const [showProfile, setShowProfile] = useState(false);
  const [gymCode, setGymCode]   = useState('');

  // Load gym code once
  useEffect(() => {
    if (!gymId || gymId === 'demo-gym') return;
    getFBFirestore().then(db => db.doc(`gyms/${gymId}`).get()).then(snap => {
      if (snap.exists) setGymCode(snap.data().gymCode || '');
    }).catch(() => {});
  }, [gymId]);

  const initials = (user?.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="msg-root" style={{
      background: C.bg, color: C.text, fontFamily: fn,
      display: 'flex', flexDirection: 'column', height: '100dvh',
      maxWidth: 430, margin: '0 auto', overflow: 'hidden', position: 'relative',
    }}>
      {/* Top Bar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '14px 20px 0', flexShrink: 0,
      }}>
        <div>
          <div style={{ fontFamily: fn, fontSize: 18, fontWeight: 800, color: C.accent, letterSpacing: '-0.01em' }}>
            MSG Owner
          </div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>{gymName || 'Your Gym'}</div>
        </div>

        {/* Profile avatar */}
        <button onClick={() => setShowProfile(p => !p)} style={{
          width: 38, height: 38, borderRadius: '50%', background: C.accent,
          border: `2px solid ${showProfile ? C.text : 'transparent'}`,
          cursor: 'pointer', fontFamily: fn, fontSize: 12, fontWeight: 800, color: '#111',
          transition: 'all 0.2s', boxShadow: C.accentShadow, overflow: 'hidden', padding: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          {user?.photo
            ? <img src={user.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : initials}
        </button>
      </div>

      {/* Profile Dropdown */}
      {showProfile && (
        <OwnerProfileDropdown
          user={user}
          gymName={gymName}
          gymCode={gymCode}
          onLogout={onLogout}
          onClose={() => setShowProfile(false)}
        />
      )}

      {/* Content */}
      <div className="msg-scroll" style={{ flex: 1, overflowY: 'auto' }}>
        {tab === 'overview'   && <OverviewTab gymId={gymId} user={user} />}
        {tab === 'members'    && <MemberListTab gymId={gymId} />}
        {tab === 'alerts'     && <AlertsTab gymId={gymId} />}
        {tab === 'attendance' && <AttendanceTab gymId={gymId} />}
        {tab === 'import'     && <CSVImport gymId={gymId} />}
        {tab === 'settings'   && <GymSettingsTab gymId={gymId} gymName={gymName} ownerUid={user?.uid} />}
      </div>

      {/* Bottom Nav */}
      <div className="msg-bottom-nav" style={{
        display: 'flex', borderTop: `1px solid ${C.border}`,
        background: C.s1, flexShrink: 0, paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}>
        {NAV.map(n => (
          <button key={n.key} onClick={() => setTab(n.key)} style={{
            flex: 1, padding: '10px 4px 8px', background: 'none', border: 'none',
            cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
          }}>
            <span style={{ fontSize: 16 }}>{n.icon}</span>
            <span style={{
              fontSize: 8, fontFamily: fb, fontWeight: 700,
              color: tab === n.key ? C.accent : C.muted,
              letterSpacing: '0.04em', textTransform: 'uppercase',
            }}>
              {n.label}
            </span>
            {tab === n.key && (
              <div style={{ width: 18, height: 2, borderRadius: 1, background: C.accent }} />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({ gymId, user }) {
  const [stats, setStats] = useState(null);
  const [feed, setFeed]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (gymId) loadStats(); }, [gymId]);

  async function loadStats() {
    setLoading(true);
    try {
      const db = await getFBFirestore();
      const memberSnap = await db.collection('members').where('gymId', '==', gymId).get();
      const members = memberSnap.docs.map(d => d.data());
      const total = members.length;
      const now = Date.now();
      const fiveDaysAgo  = now - 5 * 86400000;
      const threeDaysAgo = now - 3 * 86400000;
      const active  = members.filter(m => (m.lastActiveAt?.toDate?.()?.getTime() || 0) > fiveDaysAgo).length;
      const atRisk  = members.filter(m => { const la = m.lastActiveAt?.toDate?.()?.getTime() || 0; return la <= fiveDaysAgo && la > threeDaysAgo; }).length;
      const avgScore = total > 0 ? Math.round(members.reduce((s, m) => s + (m.engagementScore || 0), 0) / total) : 0;
      const weekAgo = new Date(now - 7 * 86400000);
      const newMembers = members.filter(m => { const j = m.joinedAt?.toDate?.(); return j && j > weekAgo; }).length;
      setStats({ total, active, atRisk, inactive: total - active - atRisk, avgScore, newMembers });

      const feedSnap = await db.collection(`activityLogs/${gymId}/events`).orderBy('timestamp', 'desc').limit(20).get();
      const memberMap = Object.fromEntries(members.map(m => [m.uid, m.name]));
      setFeed(feedSnap.docs.map(d => ({ ...d.data(), memberName: memberMap[d.data().uid] || 'Unknown Member' })));
    } catch (err) {
      console.warn('Overview load error:', err.message);
    }
    setLoading(false);
  }

  if (loading) return <Spinner text="Loading dashboard…" />;

  const TYPE_ICONS  = { workout: '💪', diet: '🥗', progress: '📊', checkin: '✅' };
  const TYPE_LABELS = { workout: 'logged a workout', diet: 'logged meals', progress: 'logged progress', checkin: 'checked in' };

  function timeAgo(ts) {
    if (!ts?.toDate) return '';
    const diff = Date.now() - ts.toDate().getTime();
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  }

  return (
    <div style={{ paddingBottom: 16 }}>
      <div style={{ padding: '20px 20px 12px' }}>
        <div style={{ fontFamily: fn, fontSize: 26, fontWeight: 800, color: C.text, letterSpacing: '-0.02em' }}>Dashboard</div>
        <div style={{ color: C.sub, fontSize: 13, marginTop: 2 }}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
      </div>

      {/* Stat Grid */}
      <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'Total Members', val: stats?.total ?? '—', color: C.accent, icon: '👥' },
          { label: 'Active',        val: stats?.active ?? '—', color: C.green,  icon: '✅' },
          { label: 'At Risk',       val: stats?.atRisk ?? '—', color: C.orange, icon: '⚠️' },
          { label: 'New This Week', val: stats?.newMembers ?? '—', color: C.blue, icon: '🆕' },
        ].map(s => (
          <Card key={s.label} style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <Lbl text={s.label} />
              <span style={{ fontSize: 18 }}>{s.icon}</span>
            </div>
            <div style={{ fontFamily: fn, fontSize: 36, fontWeight: 800, color: s.color, lineHeight: 1, letterSpacing: '-0.03em' }}>
              {s.val}
            </div>
          </Card>
        ))}
      </div>

      {/* Engagement Score */}
      <div style={{ padding: '0 16px', marginBottom: 16 }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <ScoreRing score={stats?.avgScore ?? 0} size={72} />
            <div>
              <Lbl text="Gym Engagement Score" style={{ marginBottom: 4 }} />
              <div style={{ fontFamily: fn, fontSize: 22, fontWeight: 800, color: C.text }}>{stats?.avgScore ?? 0} / 100</div>
              <div style={{ fontSize: 12, color: C.sub, marginTop: 4, lineHeight: 1.5 }}>
                Average across all {stats?.total ?? 0} members (last 30 days)
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Activity Feed */}
      <div style={{ padding: '0 16px' }}>
        <div style={{ fontFamily: fn, fontSize: 16, fontWeight: 800, color: C.text, letterSpacing: '-0.02em', marginBottom: 12 }}>Recent Activity</div>
        {feed.length === 0 ? (
          <div style={{ color: C.muted, fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
            No activity yet — members' actions will appear here.
          </div>
        ) : feed.map((item, i) => (
          <div key={i} style={{
            display: 'flex', gap: 12, alignItems: 'center',
            padding: '10px 14px', background: C.s2, border: `1px solid ${C.border}`,
            borderRadius: 12, marginBottom: 8,
          }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>{TYPE_ICONS[item.type] || '📌'}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.memberName}</div>
              <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>{TYPE_LABELS[item.type] || item.type}</div>
            </div>
            <div style={{ fontSize: 10, color: C.muted, fontFamily: fb, fontWeight: 600, flexShrink: 0 }}>{timeAgo(item.timestamp)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
