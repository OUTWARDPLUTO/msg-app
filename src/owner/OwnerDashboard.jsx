import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { C, fn, fb } from '../shared/theme.js';
import { Card, Lbl, ScoreRing, Spinner, UserAvatar } from '../shared/primitives.jsx';
import { getFBFirestore } from '../shared/firebase.js';
import appIconDark from '../assets/app-icon-dark.png';
import appIconLight from '../assets/app-icon-light.png';
import { ErrorBoundary } from '../App.jsx';
import MemberListTab from './MemberListTab.jsx';
import AlertsTab from './AlertsTab.jsx';
import AttendanceTab from './AttendanceTab.jsx';
import CSVImport from './CSVImport.jsx';
import GymSettingsTab from './GymSettingsTab.jsx';
import GymTrainersTab from './GymTrainersTab.jsx';
import StoreTab from './StoreTab.jsx';
import MembershipsTab from './MembershipsTab.jsx';
import OwnerAccountTab from './OwnerAccountTab.jsx';
import OwnerAppSettingsTab from './OwnerAppSettingsTab.jsx';
import MemberDetailSheet from './MemberDetailSheet.jsx';
import AmbientBackground from '../shared/AmbientBackground.jsx';
import { useTranslation } from 'react-i18next';

const NAV = [
  { key: 'overview',      label: 'Dashboard',  icon: '🏠' },
  { key: 'members',       label: 'Members',    icon: '👥' },
  { key: 'attendance',    label: 'Attendance', icon: '📅' },
  { key: 'analytics',     label: 'Analytics',  icon: '📈' },
  { key: 'more',          label: 'More',       icon: '⚙️' },
];

// ─── SVG Nav Icons ─────────────────────────────────────────────────────────────
function OwnerNavIcon({ id, active }) {
  const s = active ? C.accent : C.muted;
  const p = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: s, strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round', style: { transition: 'stroke 0.2s' } };
  if (id === 'overview') return <svg {...p}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>;
  if (id === 'members') return <svg {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
  if (id === 'attendance') return <svg {...p}><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
  if (id === 'analytics') return <svg {...p}><path d="M3 3v18h18" /><path d="M18 9l-5 5-3-3-4 4" /></svg>;
  if (id === 'more') return <svg {...p}><circle cx="12" cy="5" r="1" fill={s} /><circle cx="12" cy="12" r="1" fill={s} /><circle cx="12" cy="19" r="1" fill={s} /></svg>;
  return null;
}

// ─── More Tab ─────────────────────────────────────────────────────────────────
function MoreTab({ gymId, gymName, ownerUid, onNavigate, pendingTrainersCount = 0 }) {
  const items = [
    { key: 'account',     icon: '👤', label: 'My Account',    sub: 'Manage your profile and personal details' },
    { key: 'appSettings', icon: '📱', label: 'App Settings',  sub: 'Dark mode, preferences & notifications' },
    { key: 'memberships', icon: '💳', label: 'Memberships',   sub: 'Manage plans and member subscriptions' },
    { key: 'settings',    icon: '⚙️', label: 'Gym Settings',  sub: 'Gym code, name & check-in verification' },
    { key: 'trainers',    icon: '哨', label: 'Trainers',      sub: 'Manage and approve gym trainers' },
    { key: 'alerts',      icon: '⚠️', label: 'Alerts',        sub: 'Members at risk of going inactive' },
    { key: 'import',      icon: '📤', label: 'CSV Import',    sub: 'Bulk import members from CSV' },
  ];
  const isDark = !C.isLight;
  return (
    <div style={{ padding: '20px 16px 32px' }}>
      <div style={{ fontFamily: fn, fontSize: 24, fontWeight: 800, color: C.text, letterSpacing: '-0.02em', marginBottom: 20 }}>More</div>
      {items.map(item => (
        <button key={item.key} onClick={() => onNavigate(item.key)} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 14,
          padding: '14px 16px',
          background: isDark ? 'rgba(26, 26, 26, 0.40)' : 'rgba(255, 255, 255, 0.45)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}`,
          borderRadius: 14, marginBottom: 10, cursor: 'pointer', textAlign: 'left',
          transition: 'border-color 0.2s',
          position: 'relative'
        }}
          onMouseEnter={e => e.currentTarget.style.borderColor = C.accent + '55'}
          onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
        >
          <span style={{ fontSize: 22, width: 30, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text, display: 'flex', alignItems: 'center', gap: 8 }}>
              {item.label}
              {item.key === 'trainers' && pendingTrainersCount > 0 && (
                <span style={{ background: C.orange, color: '#111', fontSize: 9, fontFamily: fb, fontWeight: 700, padding: '2px 6px', borderRadius: 10 }}>{pendingTrainersCount} PENDING</span>
              )}
            </div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{item.sub}</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
      ))}
    </div>
  );
}

// ─── Owner Profile Dropdown ────────────────────────────────────────────────────
function OwnerProfileDropdown({ user, gymName, gymCode, onLogout, onClose, onSettings, onAccount, darkMode }) {
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
      background: darkMode ? 'rgba(18, 18, 18, 0.60)' : 'rgba(255, 255, 255, 0.65)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'}`,
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
      {row('👤', 'My Account', 'Manage profile & personal details', onAccount)}
      {row('⚙️', 'Gym Settings', 'Manage gym code, name & alerts', onSettings)}
      {row('🚪', 'Log Out', null, onLogout, true)}
    </div>
  );
}

// ─── Owner Dashboard ──────────────────────────────────────────────────────────
export default function OwnerDashboard({ gymId, gymName, user, onLogout, darkMode, onToggleTheme }) {
  const { t } = useTranslation();
  const isDark = !C.isLight;
  const [tab, setTab]           = useState('overview');
  const [prevTab, setPrevTab]   = useState(null);
  const [tabHistory, setTabHistory] = useState(['overview']);
  const [showProfile, setShowProfile] = useState(false);
  const [gymCode, setGymCode]   = useState('');
  // Sub-screen from "More" tab
  const [moreScreen, setMoreScreen] = useState(null);
  const [childBackHandler, setChildBackHandler] = useState(null);
  const [profileMember, setProfileMember] = useState(null);

  const [pendingTrainersCount, setPendingTrainersCount] = useState(0);

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return "Good Morning";
    if (hr < 18) return "Good Afternoon";
    return "Good Evening";
  };
  
  const getFormattedDate = () => {
    return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  // Load gym code and pending trainers
  useEffect(() => {
    if (!gymId || gymId === 'demo-gym') return;
    let unsubscribe;
    getFBFirestore().then(db => {
      // Load Gym Code
      db.doc(`gyms/${gymId}`).get().then(snap => {
        if (snap.exists) setGymCode(snap.data().gymCode || '');
      }).catch(() => {});

      // Listen for Pending Trainers
      unsubscribe = db.collection(`gyms/${gymId}/trainers`)
        .where('status', '==', 'pending')
        .onSnapshot(snap => setPendingTrainersCount(snap.size), () => {});
    }).catch(() => {});

    return () => unsubscribe && unsubscribe();
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
    setTab('more');
    window.history.pushState({ ownerTab: 'more', moreScreen: screen }, '');
  };

  // ── Back button registration for Android (Capacitor) ────────────────────────
  useEffect(() => {
    window.__msgGoBack = () => {
      if (showProfile) {
        setShowProfile(false);
        return true;
      }
      if (profileMember) {
        setProfileMember(null);
        return true;
      }
      if (childBackHandler) {
        const handled = childBackHandler();
        if (handled) return true;
      }
      if (moreScreen) {
        setMoreScreen(null);
        return true;
      }
      if (tabHistory.length > 1) {
        const prev = tabHistory[tabHistory.length - 2];
        setTabHistory(h => h.slice(0, -1));
        setTab(prev);
        return true;
      }
      return false;
    };
    return () => {
      window.__msgGoBack = null;
    };
  }, [showProfile, profileMember, childBackHandler, moreScreen, tabHistory]);

  // Render sub-screen from More
  function renderMoreScreen() {
    if (moreScreen === 'memberships') return <MembershipsTab gymId={gymId} />;
    if (moreScreen === 'alerts') return <AlertsTab gymId={gymId} onViewMemberProfile={setProfileMember} />;
    if (moreScreen === 'import') return <CSVImport gymId={gymId} />;
    if (moreScreen === 'settings') return <GymSettingsTab gymId={gymId} gymName={gymName} ownerUid={user?.uid} />;
    if (moreScreen === 'trainers') return <GymTrainersTab gymId={gymId} />;
    if (moreScreen === 'account') return <OwnerAccountTab user={user} onLogout={onLogout} />;
    if (moreScreen === 'appSettings') return <OwnerAppSettingsTab darkMode={darkMode} onToggleTheme={onToggleTheme} />;
    return null;
  }

  return (
    <div className="msg-root" style={{
      background: C.bg, color: C.text, fontFamily: fn,
      display: 'flex', flexDirection: 'column', height: '100dvh',
      maxWidth: 430, margin: '0 auto', overflow: 'hidden', position: 'relative',
    }}>
      <AmbientBackground />
      {/* Header top bar */}
      {/* Figma-style Header */}
      <div style={{
        padding: 'calc(env(safe-area-inset-top, 0px) + 20px) 20px 0', flexShrink: 0,
      }}>
        {/* Top Nav Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          {moreScreen ? (
            <button onClick={() => setMoreScreen(null)} style={{
              background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
              color: C.text, fontFamily: fn, fontSize: 16, fontWeight: 700, padding: 0,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
              Back
            </button>
          ) : (
            <>
              {/* Hamburger */}
              <button onClick={() => setShowProfile(true)} style={{ background: 'none', border: 'none', color: C.text, padding: 0, cursor: 'pointer' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="15" y2="18"/></svg>
              </button>
              
              {/* Title */}
              <div style={{ fontSize: 16, fontFamily: fb, fontWeight: 600, color: C.text }}>
                {tab === 'overview' ? 'Dashboard' : NAV.find(n => n.key === tab)?.label || 'Dashboard'}
              </div>

              {/* Bell */}
              <button onClick={() => setMoreScreen('alerts')} style={{ background: 'none', border: 'none', color: C.text, padding: 0, position: 'relative', cursor: 'pointer' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                <div style={{ position: 'absolute', top: 0, right: 2, width: 8, height: 8, background: C.accent, borderRadius: '50%', border: `2px solid ${C.bg}` }} />
              </button>
            </>
          )}
        </div>

        {/* Greeting Row (Only on Overview) */}
        {!moreScreen && tab === 'overview' && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 22, fontFamily: fn, fontWeight: 700, color: C.text, letterSpacing: '-0.02em', marginBottom: 4 }}>
                Good Morning, {user?.displayName?.split(' ')[0] || 'Alex'} 👋
              </div>
              <div style={{ fontSize: 13, fontFamily: fb, color: C.sub, fontWeight: 500 }}>
                Here's what's happening at {gymName || 'MSG Fitness'}
              </div>
            </div>
            
            <button style={{
              background: C.s1, border: `1px solid ${C.border}`, borderRadius: 8, padding: '6px 12px',
              color: C.text, fontSize: 12, fontFamily: fb, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6,
              cursor: 'pointer'
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              Today <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
          </div>
        )}
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
          onAccount={() => { handleMoreNavigate('account'); setShowProfile(false); }}
          darkMode={darkMode}
        />
      )}

      {/* Content */}
      <div className="msg-scroll" style={{ flex: 1, overflowY: 'auto', paddingBottom: 100 }}>
        <ErrorBoundary C={C} fn={fn} onRetry={() => setTab('overview')}>
          <div key={moreScreen || tab} className="msg-anim-slide-l">
            {/* More sub-screens */}
            {tab === 'more' && moreScreen && renderMoreScreen()}
            {tab === 'more' && !moreScreen && (
              <MoreTab gymId={gymId} gymName={gymName} ownerUid={user?.uid} onNavigate={handleMoreNavigate} pendingTrainersCount={pendingTrainersCount} />
            )}
            {/* Main tabs */}
            {tab === 'overview'   && <OverviewTab gymId={gymId} user={user} onNavigate={handleMoreNavigate} onViewMemberProfile={setProfileMember} setTab={setTab} />}
            {tab === 'members'    && <MemberListTab gymId={gymId} setBackHandler={setChildBackHandler} onViewMemberProfile={setProfileMember} />}
            {tab === 'attendance' && <AttendanceTab gymId={gymId} onViewMemberProfile={setProfileMember} />}
            {tab === 'analytics'  && <StoreTab gymId={gymId} setBackHandler={setChildBackHandler} />}
          </div>
        </ErrorBoundary>
      </div>

      {/* Bottom Nav — 5 tabs */}
      <div className="msg-bottom-nav" style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: C.bg,
        borderTop: `1px solid ${C.border}`,
        display: 'flex',
        padding: '10px 0 calc(env(safe-area-inset-bottom, 20px) + 6px)',
      }}>
        {NAV.map(n => {
          const active = tab === n.key;
          return (
            <button key={n.key} onClick={() => handleTabChange(n.key)} style={{
              flex: 1, padding: '10px 4px 8px', background: 'none', border: 'none',
              cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              position: 'relative',
            }}>
              <div style={{
                transform: active ? 'scale(1.15) translateY(-2px)' : 'scale(1) translateY(0)',
                transition: 'transform 0.25s cubic-bezier(.22,.68,0,1.4)',
              }}>
                <OwnerNavIcon id={n.key} active={active} />
                {n.key === 'more' && pendingTrainersCount > 0 && (
                  <div style={{ position: 'absolute', top: -2, right: -4, width: 8, height: 8, borderRadius: '50%', background: C.orange, border: `2px solid ${!C.isLight ? '#141414' : '#fff'}` }} />
                )}
              </div>
              <span style={{
                fontSize: 10, fontFamily: fb, fontWeight: active ? 600 : 500,
                color: active ? C.accent : C.muted,
                transition: 'color 0.2s',
              }}>
                {t(`nav.${n.key}`, n.label)}
              </span>
            </button>
          );
        })}
      </div>
      {/* Global Member Detail Sheet Modal */}
      {profileMember && (
        <MemberDetailSheet
          member={profileMember}
          gymId={gymId}
          onClose={() => setProfileMember(null)}
        />
      )}
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({ gymId, user, onNavigate, onViewMemberProfile, setTab }) {
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

  // Generate mockup data for the chart if real attendance trends aren't available yet
  const chartData = useMemo(() => {
    const data = [];
    let base = 40;
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      base += Math.floor(Math.random() * 15) - 5;
      data.push({ day: d.toLocaleDateString('en-US', { weekday: 'short' }), visitors: Math.max(10, base) });
    }
    return data;
  }, []);

  if (loading) return <Spinner text="Loading dashboard…" />;

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: C.s1, border: `1px solid ${C.border}`, borderRadius: 12, padding: '8px 12px', boxShadow: C.elevShadow }}>
          <div style={{ color: C.sub, fontSize: 10, fontFamily: fb, fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>{payload[0].payload.day}</div>
          <div style={{ color: C.text, fontSize: 16, fontFamily: fn, fontWeight: 800 }}>{payload[0].value} check-ins</div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ paddingBottom: 100 }}>
      {/* 2x2 KPI Grid */}
      <div style={{ padding: '0 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Card 1: Check-ins */}
        <div style={{ background: C.s1, borderRadius: 16, padding: '16px', border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 12, color: C.sub, fontFamily: fn, fontWeight: 500, marginBottom: 8 }}>Check-ins</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 28, fontFamily: fb, fontWeight: 700, color: C.text, lineHeight: 1 }}>{chartData[chartData.length - 1].visitors}</div>
            <svg width="40" height="16" viewBox="0 0 40 16" fill="none" stroke={C.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M0 12 L8 8 L16 14 L24 4 L32 10 L40 2" /></svg>
          </div>
          <div style={{ fontSize: 10, fontFamily: fb, fontWeight: 600, color: C.green }}>↑ 12.5% vs yesterday</div>
        </div>
        
        {/* Card 2: Active Members */}
        <div style={{ background: C.s1, borderRadius: 16, padding: '16px', border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 12, color: C.sub, fontFamily: fn, fontWeight: 500, marginBottom: 8 }}>Active Members</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 28, fontFamily: fb, fontWeight: 700, color: C.text, lineHeight: 1 }}>{stats?.active ?? '1,128'}</div>
            <svg width="40" height="16" viewBox="0 0 40 16" fill="none" stroke={C.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M0 10 L8 14 L16 4 L24 8 L32 2 L40 12" /></svg>
          </div>
          <div style={{ fontSize: 10, fontFamily: fb, fontWeight: 600, color: C.green }}>↑ 8.3% vs last week</div>
        </div>

        {/* Card 3: Renewals Due */}
        <div style={{ background: C.s1, borderRadius: 16, padding: '16px', border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 12, color: C.sub, fontFamily: fn, fontWeight: 500, marginBottom: 8 }}>Renewals Due</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 28, fontFamily: fb, fontWeight: 700, color: C.text, lineHeight: 1 }}>{stats?.atRisk ?? '28'}</div>
            <svg width="40" height="16" viewBox="0 0 40 16" fill="none" stroke={C.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M0 4 L8 10 L16 6 L24 14 L32 8 L40 12" /></svg>
          </div>
          <div style={{ fontSize: 10, fontFamily: fb, fontWeight: 600, color: C.accent }}>↑ 4 this week</div>
        </div>

        {/* Card 4: Monthly Revenue */}
        <div style={{ background: C.s1, borderRadius: 16, padding: '16px', border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 12, color: C.sub, fontFamily: fn, fontWeight: 500, marginBottom: 8 }}>Monthly Revenue</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 28, fontFamily: fb, fontWeight: 700, color: C.text, lineHeight: 1 }}>₹84,250</div>
            <svg width="40" height="16" viewBox="0 0 40 16" fill="none" stroke={C.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M0 12 L8 2 L16 8 L24 4 L32 14 L40 6" /></svg>
          </div>
          <div style={{ fontSize: 10, fontFamily: fb, fontWeight: 600, color: C.green }}>↑ 16.7% vs last month</div>
        </div>
      </div>

      {/* Check-ins Overview Chart */}
      <div style={{ padding: '0 20px', marginBottom: 32 }}>
        <div style={{ background: C.s1, borderRadius: 16, border: `1px solid ${C.border}`, padding: '20px 0 10px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 16, fontFamily: fb, fontWeight: 600, color: C.text }}>Check-ins Overview</div>
            <div style={{ fontSize: 12, fontFamily: fn, color: C.sub, display: 'flex', alignItems: 'center', gap: 4 }}>This Week <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg></div>
          </div>
          
          <div style={{ height: 160, padding: '0 10px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRedFigma" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.accent} stopOpacity={0.4}/>
                    <stop offset="100%" stopColor={C.accent} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.border} opacity={0.5} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: C.sub, fontFamily: fn }} dy={10} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: C.accent, strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Area type="monotone" dataKey="visitors" stroke={C.accent} strokeWidth={2.5} fillOpacity={1} fill="url(#colorRedFigma)" activeDot={{ r: 6, fill: C.bg, stroke: C.accent, strokeWidth: 2 }} dot={{ r: 4, fill: C.accent, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ padding: '0 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontFamily: fb, fontWeight: 600, color: C.text }}>Quick Actions</div>
          <div style={{ fontSize: 12, fontFamily: fn, color: C.sub }}>View All</div>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          {/* Add Member */}
          <button onClick={() => setTab && setTab('members')} style={{ flex: 1, background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: C.s1, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.text }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
            </div>
            <div style={{ fontSize: 10, fontFamily: fn, color: C.text, textAlign: 'center', fontWeight: 500 }}>Add Member</div>
          </button>

          {/* Mark Attendance */}
          <button onClick={() => setTab && setTab('attendance')} style={{ flex: 1, background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: C.s1, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.text }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14v2a2 2 0 0 0 2 2h2"/><path d="M4 10V8a2 2 0 0 1 2-2h2"/><path d="M20 14v2a2 2 0 0 1-2 2h-2"/><path d="M20 10V8a2 2 0 0 0-2-2h-2"/><line x1="12" y1="11" x2="12" y2="17"/><polyline points="10 13 12 11 14 13"/></svg>
            </div>
            <div style={{ fontSize: 10, fontFamily: fn, color: C.text, textAlign: 'center', fontWeight: 500 }}>Mark<br/>Attendance</div>
          </button>

          {/* New Membership */}
          <button onClick={() => onNavigate && onNavigate('memberships')} style={{ flex: 1, background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: C.s1, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.text }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/></svg>
            </div>
            <div style={{ fontSize: 10, fontFamily: fn, color: C.text, textAlign: 'center', fontWeight: 500 }}>New<br/>Membership</div>
          </button>

          {/* Create Plan */}
          <button onClick={() => {}} style={{ flex: 1, background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: C.s1, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.text }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            </div>
            <div style={{ fontSize: 10, fontFamily: fn, color: C.text, textAlign: 'center', fontWeight: 500 }}>Create<br/>Plan</div>
          </button>
        </div>
      </div>
    </div>
  );
}
