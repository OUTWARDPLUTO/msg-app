import { useState, useEffect, useRef, useCallback } from 'react';
import { C, fn, fb } from '../shared/theme.js';
import { Card, Lbl, ScoreRing, Spinner, UserAvatar } from '../shared/primitives.jsx';
import { getFBFirestore } from '../shared/firebase.js';
import MemberListTab from './MemberListTab.jsx';
import AlertsTab from './AlertsTab.jsx';
import AttendanceTab from './AttendanceTab.jsx';
import CSVImport from './CSVImport.jsx';
import GymSettingsTab from './GymSettingsTab.jsx';
import StoreTab from './StoreTab.jsx';
import MembershipsTab from './MembershipsTab.jsx';
import appIconLight from '../assets/app-icon-light.png';
import appIconDark from '../assets/app-icon-dark.png';

const NAV = [
  { key: 'overview',      label: 'Home',       icon: '🏠' },
  { key: 'members',       label: 'Members',    icon: '👥' },
  { key: 'attendance',    label: 'Attend.',    icon: '📅' },
  { key: 'store',         label: 'Store',      icon: '🛒' },
  { key: 'more',          label: 'More',       icon: '⚙️' },
];

// ─── SVG Nav Icons ─────────────────────────────────────────────────────────────
function OwnerNavIcon({ id, active }) {
  const s = active ? C.accent : C.muted;
  const p = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: s, strokeWidth: '1.8', strokeLinecap: 'round', strokeLinejoin: 'round', style: { transition: 'stroke 0.2s' } };
  if (id === 'overview') return <svg {...p}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>;
  if (id === 'members') return <svg {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
  if (id === 'attendance') return <svg {...p}><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
  if (id === 'store') return <svg {...p}><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>;
  if (id === 'more') return <svg {...p}><circle cx="12" cy="5" r="1" fill={s} /><circle cx="12" cy="12" r="1" fill={s} /><circle cx="12" cy="19" r="1" fill={s} /></svg>;
  return null;
}

// ─── More Tab ─────────────────────────────────────────────────────────────────
function MoreTab({ gymId, gymName, ownerUid, onNavigate }) {
  const items = [
    { key: 'memberships', icon: '💳', label: 'Memberships', sub: 'Manage plans and member subscriptions' },
    { key: 'alerts',      icon: '⚠️', label: 'Alerts',      sub: 'Members at risk of going inactive' },
    { key: 'import',      icon: '📤', label: 'CSV Import',  sub: 'Bulk import members from CSV' },
    { key: 'settings',    icon: '⚙️', label: 'Gym Settings', sub: 'Gym code, name & notifications' },
  ];
  return (
    <div style={{ padding: '20px 16px 32px' }}>
      <div style={{ fontFamily: fn, fontSize: 24, fontWeight: 800, color: C.text, letterSpacing: '-0.02em', marginBottom: 20 }}>More</div>
      {items.map(item => (
        <button key={item.key} onClick={() => onNavigate(item.key)} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 14,
          padding: '14px 16px', background: C.s2, border: `1px solid ${C.border}`,
          borderRadius: 14, marginBottom: 10, cursor: 'pointer', textAlign: 'left',
          transition: 'border-color 0.2s',
        }}
          onMouseEnter={e => e.currentTarget.style.borderColor = C.accent + '55'}
          onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
        >
          <span style={{ fontSize: 22, width: 30, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{item.label}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{item.sub}</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
      ))}
    </div>
  );
}

// ─── Owner Profile Dropdown ────────────────────────────────────────────────────
function OwnerProfileDropdown({ user, gymName, gymCode, onLogout, onClose, onSettings, darkMode }) {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

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
      background: darkMode ? 'rgba(18, 18, 18, 0.85)' : 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
      borderRadius: 20,
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.25)', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '16px', borderBottom: `1px solid ${C.border}`, display: 'flex', gap: 12, alignItems: 'center' }}>
        <UserAvatar user={user} size={44} fontSize={15} />
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
      {row('⚙️', 'Gym Settings', 'Manage gym code, name & alerts', onSettings)}
      {row('🚪', 'Log Out', null, onLogout, true)}
    </div>
  );
}

// ─── Owner Dashboard ──────────────────────────────────────────────────────────
export default function OwnerDashboard({ gymId, gymName, user, onLogout, darkMode }) {
  const [tab, setTab]           = useState('overview');
  const [prevTab, setPrevTab]   = useState(null);
  const [tabHistory, setTabHistory] = useState(['overview']);
  const [showProfile, setShowProfile] = useState(false);
  const [gymCode, setGymCode]   = useState('');
  // Sub-screen from "More" tab
  const [moreScreen, setMoreScreen] = useState(null);

  // Load gym code once
  useEffect(() => {
    if (!gymId || gymId === 'demo-gym') return;
    getFBFirestore().then(db => db.doc(`gyms/${gymId}`).get()).then(snap => {
      if (snap.exists) setGymCode(snap.data().gymCode || '');
    }).catch(() => {});
  }, [gymId]);

  // ── Tab navigation with history ────────────────────────────────────────────
  const handleTabChange = useCallback((newTab) => {
    setPrevTab(tab);
    setTab(newTab);
    setMoreScreen(null);
    setTabHistory(h => [...h, newTab]);
    window.history.pushState({ ownerTab: newTab }, '');
  }, [tab]);

  // Navigate to a sub-screen inside More
  const handleMoreNavigate = (screen) => {
    setMoreScreen(screen);
    window.history.pushState({ ownerTab: 'more', moreScreen: screen }, '');
  };

  // ── Back button (browser + Android) ───────────────────────────────────────
  useEffect(() => {
    window.history.pushState({ ownerTab: 'overview' }, '');
    const onPop = () => {
      if (moreScreen) { setMoreScreen(null); return; }
      setTabHistory(h => {
        if (h.length <= 1) { onLogout(); return h; }
        const next = h[h.length - 2];
        setPrevTab(tab);
        setTab(next);
        return h.slice(0, -1);
      });
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [moreScreen]); // eslint-disable-line

  // Render sub-screen from More
  function renderMoreScreen() {
    if (moreScreen === 'memberships') return <MembershipsTab gymId={gymId} />;
    if (moreScreen === 'alerts') return <AlertsTab gymId={gymId} />;
    if (moreScreen === 'import') return <CSVImport gymId={gymId} />;
    if (moreScreen === 'settings') return <GymSettingsTab gymId={gymId} gymName={gymName} ownerUid={user?.uid} />;
    return null;
  }

  return (
    <div className="msg-root" style={{
      background: C.bg, color: C.text, fontFamily: fn,
      display: 'flex', flexDirection: 'column', height: '100dvh',
      maxWidth: 430, margin: '0 auto', overflow: 'hidden', position: 'relative',
    }}>
      {/* Header top bar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: 'calc(env(safe-area-inset-top, 0px) + 14px) 20px 0', flexShrink: 0,
      }}>
        <div>
          {moreScreen ? (
            <button onClick={() => setMoreScreen(null)} style={{
              background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
              color: C.accent, fontFamily: fn, fontSize: 14, fontWeight: 700, padding: 0,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
              Back
            </button>
          ) : (
            <div style={{ height: 26, display: 'flex', alignItems: 'center' }}>
              <img
                src={darkMode ? appIconDark : appIconLight}
                alt="MSG"
                style={{ height: '100%', width: 26, objectFit: 'contain', borderRadius: 6 }}
              />
              <span style={{ fontSize: 9, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginLeft: 8, padding: '2px 6px', background: C.s2, borderRadius: 6, fontFamily: fb }}>Owner</span>
            </div>
          )}
        </div>

        {/* Profile avatar */}
        <button onClick={() => setShowProfile(p => !p)} style={{
          width: 38, height: 38, borderRadius: '50%', background: C.accent,
          border: `2px solid ${showProfile ? C.text : 'transparent'}`,
          cursor: 'pointer', fontFamily: fn, fontSize: 12, fontWeight: 800, color: '#111',
          transition: 'all 0.2s', boxShadow: C.accentShadow, overflow: 'hidden', padding: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <UserAvatar user={user} size={38} fontSize={12} />
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
          onSettings={() => { handleMoreNavigate('settings'); setShowProfile(false); }}
          darkMode={darkMode}
        />
      )}

      {/* Content */}
      <div className="msg-scroll" style={{ flex: 1, overflowY: 'auto', paddingBottom: 100 }}>
        <div key={moreScreen || tab} className="msg-anim-slide-l">
          {/* More sub-screens */}
          {tab === 'more' && moreScreen && renderMoreScreen()}
          {tab === 'more' && !moreScreen && (
            <MoreTab gymId={gymId} gymName={gymName} ownerUid={user?.uid} onNavigate={handleMoreNavigate} />
          )}
          {/* Main tabs */}
          {tab === 'overview'   && <OverviewTab gymId={gymId} user={user} />}
          {tab === 'members'    && <MemberListTab gymId={gymId} />}
          {tab === 'attendance' && <AttendanceTab gymId={gymId} />}
          {tab === 'store'      && <StoreTab gymId={gymId} />}
        </div>
      </div>

      {/* Bottom Nav — 5 tabs */}
      <div className="msg-bottom-nav" style={{
        position: 'absolute',
        bottom: 'max(16px, env(safe-area-inset-bottom, 16px))',
        left: 16,
        right: 16,
        zIndex: 100,
        borderRadius: 24,
        background: darkMode ? 'rgba(18, 18, 18, 0.75)' : 'rgba(255, 255, 255, 0.8)',
        border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.25)',
        display: 'flex',
        padding: '6px 0 4px',
      }}>
        {NAV.map(n => {
          const active = tab === n.key;
          return (
            <button key={n.key} onClick={() => handleTabChange(n.key)} style={{
              flex: 1, padding: '10px 4px 8px', background: 'none', border: 'none',
              cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            }}>
              <div style={{
                transform: active ? 'scale(1.15) translateY(-2px)' : 'scale(1) translateY(0)',
                transition: 'transform 0.25s cubic-bezier(.22,.68,0,1.4)',
              }}>
                <OwnerNavIcon id={n.key} active={active} />
              </div>
              <span style={{
                fontSize: 8, fontFamily: fb, fontWeight: active ? 700 : 500,
                color: active ? C.accent : C.muted,
                letterSpacing: '0.04em', textTransform: 'uppercase',
                transition: 'color 0.2s',
              }}>
                {n.label}
              </span>
              <div style={{
                width: active ? 18 : 0, height: 2, borderRadius: 1, background: C.accent,
                transition: 'width 0.3s cubic-bezier(.22,.68,0,1.4)',
              }} />
            </button>
          );
        })}
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

      // Membership stats
      const nowDate = new Date();
      let liveCount = 0, expiringCount = 0;
      members.forEach(m => {
        if (!m.membershipEndDate) return;
        const end = m.membershipEndDate?.toDate ? m.membershipEndDate.toDate() : new Date(m.membershipEndDate);
        const daysLeft = Math.ceil((end - nowDate) / 86400000);
        if (daysLeft >= 0) liveCount++;
        if (daysLeft >= 0 && daysLeft <= 7) expiringCount++;
      });

      setStats({ total, active, atRisk, inactive: total - active - atRisk, avgScore, newMembers, liveCount, expiringCount });

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
          { label: 'Active (5d)',    val: stats?.active ?? '—', color: C.green,  icon: '✅' },
          { label: 'At Risk',        val: stats?.atRisk ?? '—', color: C.orange, icon: '⚠️' },
          { label: 'New This Week',  val: stats?.newMembers ?? '—', color: C.blue, icon: '🆕' },
        ].map((s, i) => (
          <Card key={s.label} className={`msg-anim-fadeup msg-d${i + 1} msg-card-hover`} style={{ padding: '14px 16px' }}>
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

      {/* Membership quick stats */}
      {(stats?.liveCount > 0 || stats?.expiringCount > 0) && (
        <div style={{ padding: '0 16px', marginBottom: 16 }}>
          <Card style={{ padding: '12px 16px', background: stats?.expiringCount > 0 ? C.orange + '0D' : C.s2, border: `1px solid ${stats?.expiringCount > 0 ? C.orange + '33' : C.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Lbl text="Active Memberships" style={{ marginBottom: 4 }} />
                <div style={{ fontFamily: fn, fontSize: 22, fontWeight: 800, color: C.accent }}>{stats?.liveCount} live</div>
              </div>
              {stats?.expiringCount > 0 && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 10, color: C.orange, fontFamily: fb, fontWeight: 700, letterSpacing: '0.04em' }}>⚠️ EXPIRING SOON</div>
                  <div style={{ fontFamily: fn, fontSize: 22, fontWeight: 800, color: C.orange }}>{stats.expiringCount}</div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

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
          <div key={i} className="msg-anim-fadeup" style={{
            animationDelay: `${i * 0.04}s`,
            display: 'flex', gap: 12, alignItems: 'center',
            padding: '10px 14px', background: C.s2, border: `1px solid ${C.border}`,
            borderRadius: 12, marginBottom: 8, transition: 'background 0.2s',
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
