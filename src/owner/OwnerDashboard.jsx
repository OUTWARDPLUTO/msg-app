import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { C, fn, fb } from '../shared/theme.js';
import { Card, Lbl, ScoreRing, Spinner, UserAvatar } from '../shared/primitives.jsx';
import { getFBFirestore } from '../shared/firebase.js';
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
import OwnerTutorial from './OwnerTutorial.jsx';
import RevenueDetail from './RevenueDetail.jsx';
import OwnerNotifCampaignTab from './OwnerNotifCampaignTab.jsx';
import { useTranslation } from 'react-i18next';
import {
  CreditCardIcon,
  UploadCloudIcon,
  MegaphoneIcon,
  UserIcon,
  SettingsIcon,
  SmartphoneIcon,
  BadgeTrainerIcon,
  WarningIcon,
  LogoutIcon,
  StarBadge,
  DumbbellIcon,
  SaladIcon,
  CalendarIcon,
  ZapIcon
} from '../components/visuals/index.js';

const NAV = [
  { key: 'dashboard',  label: 'Dashboard' },
  { key: 'members',    label: 'Members' },
  { key: 'attendance', label: 'Attend.' },
  { key: 'store',      label: 'Store' },
  { key: 'more',       label: 'More' },
];

// ─── SVG Nav Icons ─────────────────────────────────────────────────────────────
function OwnerNavIcon({ id, active }) {
  const s = active ? C.accent : C.muted;
  const p = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: s, strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round', style: { transition: 'stroke 0.2s' } };
  if (id === 'dashboard') return <svg {...p}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>;
  if (id === 'members') return <svg {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
  if (id === 'attendance') return <svg {...p}><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
  if (id === 'store') return <svg {...p}><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>;
  if (id === 'more') return <svg {...p}><circle cx="12" cy="5" r="1" fill={s} /><circle cx="12" cy="12" r="1" fill={s} /><circle cx="12" cy="19" r="1" fill={s} /></svg>;
  return null;
}

// ─── More Tab ─────────────────────────────────────────────────────────────────
function MoreTab({ gymId, gymName, ownerUid, onNavigate, pendingTrainersCount = 0 }) {
  const items = [
    { key: 'memberships', icon: <CreditCardIcon size={20} color={C.accent} />, label: 'Memberships',   sub: 'Manage plans and member subscriptions' },
    { key: 'import',      icon: <UploadCloudIcon size={20} color={C.accent} />, label: 'CSV Import',    sub: 'Bulk import members from CSV' },
    { key: 'campaigns',  icon: <MegaphoneIcon size={20} color={C.accent} />, label: 'Campaigns',     sub: 'Send push notifications to your members' },
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
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}`,
          borderRadius: 14, marginBottom: 10, cursor: 'pointer', textAlign: 'left',
          transition: 'border-color 0.2s', position: 'relative'
        }}
          onMouseEnter={e => e.currentTarget.style.borderColor = C.accent + '55'}
          onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
        >
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, flexShrink: 0 }}>{item.icon}</span>
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

// ─── Owner Profile Dropdown (LEFT-anchored) ────────────────────────────────────
function OwnerProfileDropdown({ user, gymName, gymCode, onNavigate, pendingTrainersCount, onLogout, onClose, darkMode }) {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const row = (icon, label, sub, onClick, danger, badge) => (
    <button key={label} onClick={() => { onClick?.(); onClose(); }} className="msg-card-scale" style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: 14,
      padding: '12px 16px', background: 'none', border: 'none',
      cursor: 'pointer', textAlign: 'left', borderBottom: `1px solid ${C.border}`,
    }}>
      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28 }}>{icon}</span>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: danger ? C.red : C.text }}>{label}</div>
          {sub && <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>{sub}</div>}
        </div>
        {badge > 0 && <span style={{ background: C.orange, color: '#111', fontSize: 9, fontFamily: fb, fontWeight: 700, padding: '2px 6px', borderRadius: 10 }}>{badge} PENDING</span>}
      </div>
    </button>
  );

  return (
    <div ref={ref} style={{
      position: 'absolute', top: 64, left: 16, zIndex: 200, width: 280,
      background: darkMode ? 'rgba(18, 18, 18, 0.92)' : 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
      border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'}`,
      borderRadius: 20,
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.35)', overflow: 'hidden',
      animation: 'ownerDropdownIn 0.22s cubic-bezier(.22,.68,0,1.2)',
    }}>
      <style>{`@keyframes ownerDropdownIn { from { opacity:0; transform:translateX(-12px) scale(0.97); } to { opacity:1; transform:translateX(0) scale(1); } }`}</style>
      {/* Header */}
      <div style={{ padding: '16px', borderBottom: `1px solid ${C.border}`, display: 'flex', gap: 12, alignItems: 'center' }}>
        <UserAvatar user={user} size={44} fontSize={15} />
        <div style={{ overflow: 'hidden' }}>
          <div style={{ fontFamily: fn, fontSize: 14, fontWeight: 800, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.name || user?.displayName || 'Gym Owner'}
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
          <button onClick={() => { if (gymCode) navigator.clipboard.writeText(gymCode).catch(() => {}); }} style={{
            background: C.s3, border: `1px solid ${C.border}`, borderRadius: 8,
            padding: '5px 10px', fontSize: 11, color: C.sub, fontFamily: fn, fontWeight: 600, cursor: 'pointer',
          }}>Copy</button>
        </div>
        <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>Share this code with your members to let them join.</div>
      </div>
      {/* Actions */}
      {row(<UserIcon size={18} color={C.sub} />, 'My Account', 'Profile & details', () => onNavigate('account'))}
      {row(<SettingsIcon size={18} color={C.sub} />, 'Gym Settings', 'Manage gym code & info', () => onNavigate('settings'))}
      {row(<SmartphoneIcon size={18} color={C.sub} />, 'App Settings', 'Dark mode & notifications', () => onNavigate('appSettings'))}
      {row(<BadgeTrainerIcon size={18} color={C.sub} />, 'Trainers', 'Manage gym trainers', () => onNavigate('trainers'), false, pendingTrainersCount)}
      {row(<WarningIcon size={18} color={C.red} />, 'Alerts', 'At-risk members', () => onNavigate('alerts'))}
      {row(<LogoutIcon size={18} color={C.red} />, 'Log Out', null, onLogout, true)}
    </div>
  );
}

// ─── Premium Popup ─────────────────────────────────────────────────────────────
function PremiumPopup({ onClose, onUpgrade }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 8000,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      animation: 'msg-fadein 0.2s ease',
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: 'linear-gradient(160deg, #1a0a0a 0%, #141414 100%)',
        border: `1px solid ${C.accent}33`,
        borderRadius: '32px 32px 0 0',
        padding: '32px 24px calc(env(safe-area-inset-bottom,0px) + 32px)',
        width: '100%', maxWidth: 430,
        boxSizing: 'border-box',
        textAlign: 'center',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}><StarBadge size={56} color="#f59e0b" /></div>
        <div style={{ fontFamily: fb, fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 8 }}>
          Unlock MSG Premium
        </div>
        <div style={{ fontFamily: fn, fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, marginBottom: 28, maxWidth: 280, margin: '0 auto 28px' }}>
          Get unlimited members, advanced analytics, SMS alerts, and priority support.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          {[
            { plan: 'trial',   label: '7-Day Trial', price: '₹249', badge: null },
            { plan: 'monthly', label: 'Monthly', price: '₹999/mo', badge: null },
            { plan: 'yearly',  label: 'Yearly',  price: '₹7,999/yr', badge: 'BEST VALUE — Save 33%' },
          ].map(p => (
            <button key={p.plan} onClick={() => onUpgrade(p.plan)} style={{
              background: p.badge ? C.accent : 'rgba(255,255,255,0.08)',
              border: `1px solid ${p.badge ? C.accent : 'rgba(255,255,255,0.12)'}`,
              borderRadius: 16, padding: '16px 20px', cursor: 'pointer',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontFamily: fb, fontSize: 16, fontWeight: 700, color: p.badge ? '#111' : '#fff' }}>{p.label}</div>
                {p.badge && <div style={{ fontSize: 10, fontFamily: fb, fontWeight: 700, color: '#111', marginTop: 2, opacity: 0.7 }}>{p.badge}</div>}
              </div>
              <div style={{ fontFamily: fb, fontSize: 18, fontWeight: 800, color: p.badge ? '#111' : C.accent }}>{p.price}</div>
            </button>
          ))}
        </div>

        <button onClick={onClose} style={{
          background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)',
          fontFamily: fn, fontSize: 13, cursor: 'pointer', padding: 8,
        }}>
          Maybe later
        </button>
      </div>
    </div>
  );
}

// ─── Owner Dashboard ──────────────────────────────────────────────────────────
export default function OwnerDashboard({ gymId, gymName, user, onLogout, darkMode, onToggleTheme }) {
  const { t } = useTranslation();
  const isDark = !C.isLight;

  const [tab, setTab]                     = useState('dashboard');
  const [prevTab, setPrevTab]             = useState(null);
  const [tabHistory, setTabHistory]       = useState(['dashboard']);
  const [showProfile, setShowProfile]     = useState(false);
  const [gymCode, setGymCode]             = useState('');
  const [moreScreen, setMoreScreen]       = useState(null);
  const [membersSubTab, setMembersSubTab] = useState('directory'); // 'directory', 'alerts', 'stats'
  const [childBackHandler, setChildBackHandler] = useState(null);
  const [profileMember, setProfileMember] = useState(null);
  const [pendingTrainersCount, setPendingTrainersCount] = useState(0);
  const [isPremium, setIsPremium]         = useState(false);
  const [showPremiumPopup, setShowPremiumPopup] = useState(false);
  const [showTutorial, setShowTutorial]   = useState(() => {
    try { return !localStorage.getItem('msg_owner_tutorial_done'); } catch { return false; }
  });

  // Greeting based on local time
  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good Morning';
    if (hr < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Load gym code, pending trainers, and subscription status
  useEffect(() => {
    if (!gymId || gymId === 'demo-gym') return;
    let unsubscribe;
    getFBFirestore().then(db => {
      db.doc(`gyms/${gymId}`).get().then(snap => {
        if (snap.exists) {
          setGymCode(snap.data().gymCode || '');
          const plan = snap.data().plan || 'free';
          const isPrem = plan === 'premium' || plan === 'yearly' || plan === 'monthly' || plan === 'trial';
          setIsPremium(isPrem);
          // Show premium popup on first open if not premium (once per session)
          if (!isPrem && !sessionStorage.getItem('msg_premium_popup_shown')) {
            sessionStorage.setItem('msg_premium_popup_shown', '1');
            setTimeout(() => setShowPremiumPopup(true), 1500);
          }
        }
      }).catch(() => {});

      unsubscribe = db.collection(`gyms/${gymId}/trainers`)
        .where('status', '==', 'pending')
        .onSnapshot(snap => setPendingTrainersCount(snap.size), () => {});
    }).catch(() => {});

    const onSubUpdate = () => {
      setIsPremium(true);
      setShowPremiumPopup(false);
    };
    window.addEventListener('msg_subscription_updated', onSubUpdate);

    return () => {
      if (unsubscribe) unsubscribe();
      window.removeEventListener('msg_subscription_updated', onSubUpdate);
    };
  }, [gymId]);

  // Tab navigation with history
  const handleTabChange = useCallback((newTab) => {
    setPrevTab(tab);
    setTab(newTab);
    setMoreScreen(null);
    setTabHistory(h => [...h, newTab]);
    window.history.pushState({ ownerTab: newTab }, '');
  }, [tab]);

  const [membersActiveFilter, setMembersActiveFilter] = useState('All');
  const [attendanceDateFilter, setAttendanceDateFilter] = useState(null);
  const [membershipsFilter, setMembershipsFilter] = useState('All');

  const navigateToMembers = useCallback((filter = 'All', sub = 'directory') => {
    setMembersActiveFilter(filter);
    setMembersSubTab(sub);
    setMoreScreen(null);
    setTab('members');
  }, []);

  const navigateToAttendance = useCallback((dateFilter = null) => {
    setAttendanceDateFilter(dateFilter);
    setMoreScreen(null);
    setTab('attendance');
  }, []);

  const navigateToMemberships = useCallback((filter = 'All') => {
    setMembershipsFilter(filter);
    setMoreScreen('memberships');
    setTab('more');
    window.history.pushState({ ownerTab: 'more', moreScreen: 'memberships' }, '');
  }, []);

  const navigateToRevenue = useCallback(() => {
    setMembersSubTab('stats');
    setMoreScreen(null);
    setTab('members');
  }, []);

  const handleMoreNavigate = (screen) => {
    setMoreScreen(screen);
    setTab('more');
    window.history.pushState({ ownerTab: 'more', moreScreen: screen }, '');
  };

  // Android back button
  useEffect(() => {
    window.__msgGoBack = () => {
      if (showProfile) { setShowProfile(false); return true; }
      if (profileMember) { setProfileMember(null); return true; }
      if (childBackHandler) { const handled = childBackHandler(); if (handled) return true; }
      if (moreScreen) { setMoreScreen(null); return true; }
      if (tab !== 'dashboard') {
        setTab('dashboard');
        return true;
      }
      return false;
    };
    return () => { window.__msgGoBack = null; };
  }, [showProfile, profileMember, childBackHandler, moreScreen, tab]);
  const onBack = () => setMoreScreen(null);

  function renderMoreScreen() {
    if (moreScreen === 'memberships') return <MembershipsTab gymId={gymId} onBack={onBack} initialFilter={membershipsFilter} />;
    if (moreScreen === 'alerts')      return <AlertsTab gymId={gymId} onViewMemberProfile={setProfileMember} onBack={onBack} />;
    if (moreScreen === 'import')      return <CSVImport gymId={gymId} onBack={onBack} />;
    if (moreScreen === 'campaigns')   return <OwnerNotifCampaignTab gymId={gymId} ownerUid={user?.uid} onBack={onBack} />;
    if (moreScreen === 'settings')    return <GymSettingsTab gymId={gymId} gymName={gymName} ownerUid={user?.uid} onBack={onBack} />;
    if (moreScreen === 'trainers')    return <GymTrainersTab gymId={gymId} onBack={onBack} />;
    if (moreScreen === 'account')     return <OwnerAccountTab user={user} onLogout={onLogout} onBack={onBack} />;
    if (moreScreen === 'appSettings') return <OwnerAppSettingsTab darkMode={darkMode} onToggleTheme={onToggleTheme} onBack={onBack} onShowTutorial={() => setShowTutorial(true)} />;
    if (moreScreen === 'revenue')     return <RevenueDetail gymId={gymId} onBack={onBack} />;
    return null;
  }

  const ownerName = user?.name || user?.displayName || 'Owner';
  const firstName = ownerName.split(' ')[0];

  return (
    <div className="msg-root" style={{
      background: C.bg, color: C.text, fontFamily: fn,
      display: 'flex', flexDirection: 'column', height: '100dvh',
      maxWidth: 430, margin: '0 auto', overflow: 'hidden', position: 'relative',
    }}>
      <AmbientBackground />

      {/* Tutorial overlay */}
      {showTutorial && <OwnerTutorial onDone={() => setShowTutorial(false)} />}

      {/* Premium popup */}
      {showPremiumPopup && (
        <PremiumPopup
          onClose={() => setShowPremiumPopup(false)}
          onUpgrade={(plan) => { setShowPremiumPopup(false); handleMoreNavigate('settings'); }}
        />
      )}

      {/* Header */}
      <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 16px) 20px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          {moreScreen ? (
            <div style={{ width: 24 }} /> // Spacer to keep title centered
          ) : (
            <>
              {/* Hamburger — LEFT */}
              <button onClick={() => setShowProfile(p => !p)} style={{ background: 'none', border: 'none', color: C.text, padding: 0, cursor: 'pointer' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="15" y2="18"/></svg>
              </button>

              <div style={{ flex: 1 }} />

              {/* Right: Premium chip + Bell */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {!isPremium && (
                  <button onClick={() => setShowPremiumPopup(true)} style={{
                    background: `linear-gradient(135deg, ${C.accent}, #ff6b35)`,
                    border: 'none', borderRadius: 20, padding: '5px 10px',
                    color: '#111', fontFamily: fb, fontWeight: 800, fontSize: 10,
                    cursor: 'pointer', letterSpacing: '0.04em',
                    boxShadow: `0 2px 8px ${C.accent}55`,
                  }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><StarBadge size={12} color="#111" />PREMIUM</span>
                  </button>
                )}
                <button onClick={() => handleMoreNavigate('alerts')} style={{ background: 'none', border: 'none', color: C.text, padding: 0, position: 'relative', cursor: 'pointer' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                  <div style={{ position: 'absolute', top: 0, right: 2, width: 8, height: 8, background: C.accent, borderRadius: '50%', border: `2px solid ${C.bg}` }} />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Greeting Row — Dashboard only */}
        {!moreScreen && tab === 'dashboard' && (
          <div style={{ marginBottom: 4 }}>
            <div style={{ fontSize: 22, fontFamily: fn, fontWeight: 700, color: C.text, letterSpacing: '-0.02em', marginBottom: 4 }}>
              {getGreeting()}, {firstName}
            </div>
            <div style={{ fontSize: 13, fontFamily: fb, color: C.sub, fontWeight: 500, marginBottom: 16 }}>
              Here's what's happening at {gymName || 'your gym'}
            </div>
          </div>
        )}
      </div>

      {/* Profile Dropdown — slides from LEFT */}
      {showProfile && (
        <OwnerProfileDropdown
          user={user}
          gymName={gymName}
          gymCode={gymCode}
          onLogout={onLogout}
          onClose={() => setShowProfile(false)}
          onNavigate={handleMoreNavigate}
          pendingTrainersCount={pendingTrainersCount}
          darkMode={darkMode}
        />
      )}

      {/* Content */}
      <div className="msg-scroll" style={{ flex: 1, overflowY: 'auto' }}>
        <ErrorBoundary C={C} fn={fn} onRetry={() => setTab('dashboard')}>
          <div key={moreScreen || tab} className="msg-anim-slide-l">
            {tab === 'more' && moreScreen && renderMoreScreen()}
            {tab === 'more' && !moreScreen && (
              <MoreTab gymId={gymId} gymName={gymName} ownerUid={user?.uid} onNavigate={handleMoreNavigate} pendingTrainersCount={pendingTrainersCount} />
            )}
            {tab === 'dashboard'  && (
              <DashboardTab
                gymId={gymId}
                user={user}
                gymName={gymName}
                onNavigate={handleMoreNavigate}
                onViewMemberProfile={setProfileMember}
                setTab={setTab}
                setMembersSubTab={setMembersSubTab}
                setBackHandler={setChildBackHandler}
                navigateToMembers={navigateToMembers}
                navigateToAttendance={navigateToAttendance}
                navigateToMemberships={navigateToMemberships}
                navigateToRevenue={navigateToRevenue}
              />
            )}
            {tab === 'members'    && (
              <MemberListTab
                gymId={gymId}
                gymCode={gymCode}
                setBackHandler={setChildBackHandler}
                onViewMemberProfile={setProfileMember}
                subTab={membersSubTab}
                setSubTab={setMembersSubTab}
                initialActiveTab={membersActiveFilter}
              />
            )}
            {tab === 'attendance' && (
              <AttendanceTab
                gymId={gymId}
                onViewMemberProfile={setProfileMember}
                initialDateFilter={attendanceDateFilter}
                onClearDateFilter={() => setAttendanceDateFilter(null)}
              />
            )}
            {tab === 'store'      && <StoreTab gymId={gymId} setBackHandler={setChildBackHandler} />}
          </div>
        </ErrorBoundary>
      </div>

      {/* Bottom Nav */}
      <div style={{
        flexShrink: 0, background: C.bg, borderTop: `1px solid ${C.border}`,
        display: 'flex', padding: '10px 0 calc(env(safe-area-inset-bottom, 20px) + 6px)',
        zIndex: 100,
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
                  <div style={{ position: 'absolute', top: -2, right: -4, width: 8, height: 8, borderRadius: '50%', background: C.orange, border: `2px solid ${C.bg}` }} />
                )}
              </div>
              <span style={{
                fontSize: 10, fontFamily: fb, fontWeight: active ? 600 : 500,
                color: active ? C.accent : C.muted, transition: 'color 0.2s',
              }}>
                {t(`nav.${n.key}`, n.label)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Global Member Detail Sheet */}
      {profileMember && (
        <MemberDetailSheet member={profileMember} gymId={gymId} onClose={() => setProfileMember(null)} />
      )}
    </div>
  );
}

// ─── Dashboard Tab ─────────────────────────────────────────────────────────────
function DashboardTab({
  gymId, user, gymName, onNavigate, onViewMemberProfile,
  setTab, setMembersSubTab, setBackHandler,
  navigateToMembers, navigateToAttendance, navigateToMemberships, navigateToRevenue
}) {
  const [stats, setStats]           = useState(null);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [chartPeriod, setChartPeriod] = useState('week');
  const [showPeriodPicker, setShowPeriodPicker] = useState(false);
  const [todayCheckIns, setTodayCheckIns] = useState(0);
  const isDark = !C.isLight;

  // ── Real-time listeners — all three update instantly on any data change ─────
  useEffect(() => {
    if (!gymId) {
      setLoading(false);
      return;
    }
    const unsubs = [];
    let membersDone = false, attendanceDone = false;

    // Safety timeout: ensure skeleton loader terminates even if network is slow/offline
    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 1200);

    getFBFirestore().then(db => {
      // 1. Members — drives stats KPIs
      unsubs.push(
        db.collection('members').where('gymId', '==', gymId)
          .onSnapshot(snap => {
            try {
              const now = Date.now();
              const members = snap.docs.map(d => d.data());
              const total = members.length;
              const threeDaysAgo = now - 3 * 86400000;
              const sevenDaysAgo = now - 7 * 86400000;
              const active   = members.filter(m => {
                const la = m.lastActiveAt?.toDate?.()?.getTime() || 0;
                const score = m.engagementScore !== undefined ? m.engagementScore : null;
                if (score !== null) return score >= 60;
                return la > threeDaysAgo;
              }).length;
              const atRisk   = members.filter(m => {
                const la = m.lastActiveAt?.toDate?.()?.getTime() || 0;
                const score = m.engagementScore !== undefined ? m.engagementScore : null;
                if (score !== null) return score >= 35 && score < 60;
                return la <= threeDaysAgo && la > sevenDaysAgo;
              }).length;
              const inactive = Math.max(0, total - active - atRisk);
              const avgScore = total > 0 ? Math.round(members.reduce((s, m) => s + (m.engagementScore || 0), 0) / total) : 0;
              const weekAgo  = new Date(now - 7 * 86400000);
              const newMembers = members.filter(m => { const j = m.joinedAt?.toDate?.(); return j && j > weekAgo; }).length;
              const nowDate = new Date(now);
              let liveCount = 0, expiringCount = 0;
              members.forEach(m => {
                if (!m.membershipEndDate) return;
                const end = m.membershipEndDate?.toDate ? m.membershipEndDate.toDate() : new Date(m.membershipEndDate);
                const daysLeft = Math.ceil((end - nowDate) / 86400000);
                if (daysLeft >= 0) liveCount++;
                if (daysLeft >= 0 && daysLeft <= 7) expiringCount++;
              });
              setStats({ total, active, atRisk, inactive, avgScore, newMembers, liveCount, expiringCount });
            } catch (err) {
              console.warn('[DashboardTab] Error parsing members snapshot:', err);
            } finally {
              membersDone = true;
              setLoading(false);
            }
          }, (err) => {
            console.warn('[DashboardTab] Members listener error:', err);
            membersDone = true;
            setLoading(false);
          })
      );

      // 2. Attendance logs — drives chart + today's KPI (last 365 days)
      const maxDaysAgo = new Date(Date.now() - 365 * 86400000).toISOString().split('T')[0];
      const todayKey = new Date().toISOString().split('T')[0];
      unsubs.push(
        db.collection(`attendance/${gymId}/logs`)
          .where('date', '>=', maxDaysAgo)
          .onSnapshot(snap => {
            try {
              const logs = snap.docs.map(d => d.data());
              setAttendanceLogs(logs);
              setTodayCheckIns(logs.filter(l => l.date === todayKey).length);
            } catch (err) {
              console.warn('[DashboardTab] Error parsing attendance snapshot:', err);
            } finally {
              attendanceDone = true;
              setLoading(false);
            }
          }, (err) => {
            console.warn('[DashboardTab] Attendance listener error:', err);
            attendanceDone = true;
            setLoading(false);
          })
      );

      // 3. Recent activity — drives activity feed
      try {
        unsubs.push(
          db.collection(`activityLogs/${gymId}/events`)
            .orderBy('timestamp', 'desc').limit(6)
            .onSnapshot(snap => {
              setRecentActivity(snap.docs.map(d => d.data()));
            }, () => setRecentActivity([]))
        );
      } catch { setRecentActivity([]); }

    }).catch(() => setLoading(false));

    return () => {
      clearTimeout(safetyTimer);
      unsubs.forEach(u => u && u());
    };
  }, [gymId]);

  const PERIODS = [
    { key: 'week',  label: 'This Week',  days: 7 },
    { key: 'month', label: 'This Month', days: 30 },
    { key: 'year',  label: 'This Year',  days: 365 },
  ];

  const chartData = useMemo(() => {
    const period = PERIODS.find(p => p.key === chartPeriod) || PERIODS[0];
    const days = period.days;
    const counts = {};
    attendanceLogs.forEach(l => { counts[l.date] = (counts[l.date] || 0) + 1; });
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = d.toISOString().split('T')[0];
      let label;
      if (days <= 7)  label = d.toLocaleDateString('en-US', { weekday: 'short' });
      else if (days <= 30) label = d.getDate() % 5 === 0 ? d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : '';
      else label = d.getDate() === 1 ? d.toLocaleDateString('en-US', { month: 'short' }) : '';
      data.push({ day: label, date: key, visitors: counts[key] || 0 });
    }
    return data;
  }, [attendanceLogs, chartPeriod]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload?.length) {
      return (
        <div style={{ background: C.s1, border: `1px solid ${C.border}`, borderRadius: 12, padding: '8px 12px', boxShadow: '0 4px 16px rgba(0,0,0,0.3)', pointerEvents: 'none' }}>
          <div style={{ color: C.sub, fontSize: 10, fontFamily: fb, fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>{payload[0].payload.date}</div>
          <div style={{ color: C.text, fontSize: 15, fontFamily: fn, fontWeight: 800 }}>{payload[0].value} check-in{payload[0].value === 1 ? '' : 's'}</div>
          <div style={{ color: C.accent, fontSize: 10, fontFamily: fb, fontWeight: 600, marginTop: 4 }}>Tap point to view date logs →</div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div style={{ padding: '0 20px', paddingBottom: 110 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          {[1,2,3,4].map(i => <div key={i} className={`msg-skeleton${isDark ? '-dark' : ''} msg-stagger-${i}`} style={{ height: 110, borderRadius: 16 }} />)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 24 }}>
          {[1,2,3,4].map(i => <div key={i} className={`msg-skeleton${isDark ? '-dark' : ''} msg-stagger-${i}`} style={{ height: 72, borderRadius: 14 }} />)}
        </div>
        <div className={`msg-skeleton${isDark ? '-dark' : ''} msg-stagger-2`} style={{ height: 200, marginBottom: 28, borderRadius: 16 }} />
      </div>
    );
  }

  const currentPeriodLabel = PERIODS.find(p => p.key === chartPeriod)?.label || 'This Week';
  const todayKey = new Date().toISOString().split('T')[0];

  return (
    <div style={{ paddingBottom: 110 }}>
      {/* 2×2 KPI Grid — all cards are clickable with direct drilldown */}
      <div style={{ padding: '0 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        {/* Check-ins → Today's Attendance */}
        <button
          type="button"
          onClick={() => navigateToAttendance ? navigateToAttendance(todayKey) : setTab('attendance')}
          className={`msg-card-scale msg-hover-ring ${isDark ? 'msg-glass' : 'msg-glass-light'} msg-fadein-up msg-stagger-1`}
          style={{
            borderRadius: 16, padding: '16px', textAlign: 'left', cursor: 'pointer',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
            background: isDark ? 'rgba(26, 26, 26, 0.45)' : 'rgba(255, 255, 255, 0.55)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
          }}
          title="View today's check-ins"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: C.sub, fontFamily: fn, fontWeight: 600 }}>Check-ins</span>
            <span style={{ fontSize: 11, color: C.accent, fontFamily: fb, fontWeight: 700 }}>View →</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 32, fontFamily: fb, fontWeight: 800, color: C.text, lineHeight: 1 }}>{todayCheckIns}</div>
            <svg width="40" height="16" viewBox="0 0 40 16" fill="none" stroke={C.accent} strokeWidth="1.5" strokeLinecap="round"><path d="M0 12 L8 8 L16 14 L24 4 L32 10 L40 2" /></svg>
          </div>
          <div style={{ fontSize: 11, fontFamily: fb, fontWeight: 600, color: C.green }}>Today's total</div>
        </button>

        {/* Revenue Today → Revenue Stats */}
        <button
          type="button"
          onClick={() => navigateToRevenue ? navigateToRevenue() : (setMembersSubTab('stats'), setTab('members'))}
          className={`msg-card-scale msg-hover-ring ${isDark ? 'msg-glass' : 'msg-glass-light'} msg-fadein-up msg-stagger-2`}
          style={{
            borderRadius: 16, padding: '16px', textAlign: 'left', cursor: 'pointer',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
            background: isDark ? 'rgba(26, 26, 26, 0.45)' : 'rgba(255, 255, 255, 0.55)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
          }}
          title="View revenue analytics"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: C.sub, fontFamily: fn, fontWeight: 600 }}>Revenue</span>
            <span style={{ fontSize: 11, color: C.blue, fontFamily: fb, fontWeight: 700 }}>View →</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 32, fontFamily: fb, fontWeight: 800, color: C.text, lineHeight: 1 }}>₹0</div>
            <svg width="40" height="16" viewBox="0 0 40 16" fill="none" stroke={C.blue} strokeWidth="1.5" strokeLinecap="round"><path d="M0 10 L8 14 L16 4 L24 8 L32 2 L40 12" /></svg>
          </div>
          <div style={{ fontSize: 11, fontFamily: fb, fontWeight: 600, color: C.sub }}>Today</div>
        </button>

        {/* Renewals Due → Memberships Expiring Soon */}
        <button
          type="button"
          onClick={() => navigateToMemberships ? navigateToMemberships('Expiring Soon') : onNavigate('memberships')}
          className={`msg-card-scale msg-hover-ring ${isDark ? 'msg-glass' : 'msg-glass-light'} msg-fadein-up msg-stagger-3`}
          style={{
            borderRadius: 16, padding: '16px', textAlign: 'left', cursor: 'pointer',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
            background: isDark ? 'rgba(26, 26, 26, 0.45)' : 'rgba(255, 255, 255, 0.55)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
          }}
          title="View expiring memberships"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: C.sub, fontFamily: fn, fontWeight: 600 }}>Renewals Due</span>
            <span style={{ fontSize: 11, color: C.accent, fontFamily: fb, fontWeight: 700 }}>View →</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 32, fontFamily: fb, fontWeight: 800, color: C.text, lineHeight: 1 }}>{stats?.expiringCount ?? 0}</div>
            <svg width="40" height="16" viewBox="0 0 40 16" fill="none" stroke={C.accent} strokeWidth="1.5" strokeLinecap="round"><path d="M0 4 L8 10 L16 6 L24 14 L32 8 L40 12" /></svg>
          </div>
          <div style={{ fontSize: 11, fontFamily: fb, fontWeight: 600, color: C.accent }}>expiring this week</div>
        </button>

        {/* At-Risk → At-Risk Member Alerts */}
        <button
          type="button"
          onClick={() => navigateToMembers ? navigateToMembers('At-Risk', 'alerts') : (setMembersSubTab('alerts'), setTab('members'))}
          className={`msg-card-scale msg-hover-ring ${isDark ? 'msg-glass' : 'msg-glass-light'} msg-fadein-up msg-stagger-4`}
          style={{
            borderRadius: 16, padding: '16px', textAlign: 'left', cursor: 'pointer',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
            background: isDark ? 'rgba(26, 26, 26, 0.45)' : 'rgba(255, 255, 255, 0.55)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
          }}
          title="View at-risk members"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: C.sub, fontFamily: fn, fontWeight: 600 }}>At-Risk Members</span>
            <span style={{ fontSize: 11, color: C.orange, fontFamily: fb, fontWeight: 700 }}>View →</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 32, fontFamily: fb, fontWeight: 800, color: C.text, lineHeight: 1 }}>{stats?.atRisk ?? 0}</div>
            <svg width="40" height="16" viewBox="0 0 40 16" fill="none" stroke={C.orange} strokeWidth="1.5" strokeLinecap="round"><path d="M0 12 L8 2 L16 8 L24 4 L32 14 L40 6" /></svg>
          </div>
          <div style={{ fontSize: 11, fontFamily: fb, fontWeight: 600, color: (stats?.atRisk || 0) > 0 ? '#f87171' : C.muted }}>
            {(stats?.atRisk || 0) > 0 ? 'need attention' : 'all good'}
          </div>
        </button>
      </div>

      {/* Member Overview Strip — all 4 indicators are interactive drilldowns */}
      <div className="msg-fadein-up msg-stagger-2" style={{ padding: '0 20px', marginBottom: 24 }}>
        <div style={{
          background: isDark ? 'rgba(26, 26, 26, 0.45)' : 'rgba(255, 255, 255, 0.55)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}`,
          borderRadius: 20, padding: '16px 14px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, padding: '0 4px' }}>
            <div style={{ fontSize: 13, fontFamily: fb, fontWeight: 700, color: C.text, letterSpacing: '-0.01em' }}>Member Overview</div>
            <button
              type="button"
              onClick={() => navigateToMembers ? navigateToMembers('All', 'directory') : setTab('members')}
              style={{ background: 'none', border: 'none', color: C.accent, fontSize: 11, fontFamily: fb, fontWeight: 700, cursor: 'pointer', padding: 0 }}
            >
              View Roster →
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {[
              { label: 'Total', count: stats?.total ?? 0, filter: 'All', color: C.text, sub: 'All registered' },
              { label: 'Active', count: stats?.active ?? 0, filter: 'Active', color: C.green, sub: 'Score ≥ 60' },
              { label: 'Inactive', count: stats?.inactive ?? 0, filter: 'Inactive', color: C.muted, sub: 'Score < 35' },
              { label: 'Avg Score', count: stats?.avgScore ?? 0, filter: 'All', color: C.accent, sub: 'Engagement' },
            ].map(item => (
              <button
                key={item.label}
                type="button"
                onClick={() => navigateToMembers ? navigateToMembers(item.filter, 'directory') : setTab('members')}
                className="msg-card-scale"
                style={{
                  background: isDark ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.7)',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
                  borderRadius: 14, padding: '12px 6px', textAlign: 'center', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s ease', position: 'relative'
                }}
                title={`Filter member list by ${item.label}`}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = C.accent + '88';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ fontFamily: fb, fontSize: 20, fontWeight: 800, color: item.color, lineHeight: 1.1, marginBottom: 4 }}>
                  {item.count}
                </div>
                <div style={{ fontSize: 10, fontFamily: fb, fontWeight: 700, color: C.sub, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {item.label}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Check-ins Chart — interactive with clickable data points */}
      <div className="msg-fadein-up msg-stagger-2" style={{ padding: '0 20px', marginBottom: 28 }}>
        <div className={isDark ? 'msg-glass' : 'msg-glass-light'} style={{ borderRadius: 16, padding: '20px 0 10px' }}>
          <div style={{ padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 16, fontFamily: fb, fontWeight: 600, color: C.text }}>Check-ins Overview</div>
              <div style={{ fontSize: 11, fontFamily: fn, color: C.sub, marginTop: 2 }}>Tap any point or bar to inspect logs</div>
            </div>
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowPeriodPicker(p => !p)} style={{
                fontSize: 12, fontFamily: fn, color: C.sub, background: C.bg,
                border: `1px solid ${C.border}`, borderRadius: 8, padding: '5px 10px',
                display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer',
              }}>
                {currentPeriodLabel}
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              {showPeriodPicker && (
                <div style={{
                  position: 'absolute', right: 0, top: 36, zIndex: 300,
                  background: C.s1, border: `1px solid ${C.border}`, borderRadius: 12,
                  overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                  minWidth: 130,
                }}>
                  {PERIODS.map(p => (
                    <button key={p.key} onClick={() => { setChartPeriod(p.key); setShowPeriodPicker(false); }} style={{
                      width: '100%', padding: '10px 14px', background: p.key === chartPeriod ? C.accent + '20' : 'none',
                      border: 'none', borderBottom: `1px solid ${C.border}`,
                      color: p.key === chartPeriod ? C.accent : C.text,
                      fontFamily: fn, fontSize: 13, fontWeight: p.key === chartPeriod ? 700 : 400,
                      cursor: 'pointer', textAlign: 'left',
                    }}>
                      {p.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div style={{ height: 140, padding: '0 10px', cursor: 'pointer' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                onClick={(e) => {
                  if (e && e.activePayload && e.activePayload[0]) {
                    const dateStr = e.activePayload[0].payload.date;
                    if (dateStr) {
                      if (navigateToAttendance) navigateToAttendance(dateStr);
                      else setTab('attendance');
                    }
                  }
                }}
              >
                <defs>
                  <linearGradient id="colorRedFigma" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.accent} stopOpacity={0.4}/>
                    <stop offset="100%" stopColor={C.accent} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.border} opacity={0.5} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: C.sub, fontFamily: fn }} dy={10} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: C.accent, strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Area
                  type="monotone"
                  dataKey="visitors"
                  stroke={C.accent}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorRedFigma)"
                  activeDot={{ r: 7, fill: C.accent, stroke: C.bg, strokeWidth: 2, cursor: 'pointer' }}
                  dot={{ r: 3, fill: C.accent, strokeWidth: 0, cursor: 'pointer' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="msg-fadein-up msg-stagger-3" style={{ padding: '0 20px' }}>
        <div style={{ fontSize: 16, fontFamily: fb, fontWeight: 600, color: C.text, marginBottom: 16 }}>Quick Actions</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          {/* Add Member */}
          <button
            type="button"
            onClick={() => navigateToMembers ? navigateToMembers('All', 'directory') : setTab('members')}
            className="msg-card-scale msg-hover-ring"
            style={{ flex: 1, background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
          >
            <div className={isDark ? 'msg-glass' : 'msg-glass-light'} style={{ width: 64, height: 64, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.text }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
            </div>
            <div style={{ fontSize: 10, fontFamily: fn, color: C.text, textAlign: 'center', fontWeight: 500 }}>Add Member</div>
          </button>

          {/* Mark Attendance */}
          <button
            type="button"
            onClick={() => navigateToAttendance ? navigateToAttendance(todayKey) : setTab('attendance')}
            className="msg-card-scale msg-hover-ring"
            style={{ flex: 1, background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
          >
            <div className={isDark ? 'msg-glass' : 'msg-glass-light'} style={{ width: 64, height: 64, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.text }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14v2a2 2 0 0 0 2 2h2"/><path d="M4 10V8a2 2 0 0 1 2-2h2"/><path d="M20 14v2a2 2 0 0 1-2 2h-2"/><path d="M20 10V8a2 2 0 0 0-2-2h-2"/><line x1="12" y1="11" x2="12" y2="17"/><polyline points="10 13 12 11 14 13"/></svg>
            </div>
            <div style={{ fontSize: 10, fontFamily: fn, color: C.text, textAlign: 'center', fontWeight: 500 }}>Mark<br/>Attendance</div>
          </button>

          {/* New Membership */}
          <button
            type="button"
            onClick={() => navigateToMemberships ? navigateToMemberships('All') : onNavigate('memberships')}
            className="msg-card-scale msg-hover-ring"
            style={{ flex: 1, background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
          >
            <div className={isDark ? 'msg-glass' : 'msg-glass-light'} style={{ width: 64, height: 64, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.text }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/></svg>
            </div>
            <div style={{ fontSize: 10, fontFamily: fn, color: C.text, textAlign: 'center', fontWeight: 500 }}>New<br/>Membership</div>
          </button>

          {/* Gym Settings */}
          <button
            type="button"
            onClick={() => onNavigate('settings')}
            className="msg-card-scale msg-hover-ring"
            style={{ flex: 1, background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
          >
            <div className={isDark ? 'msg-glass' : 'msg-glass-light'} style={{ width: 64, height: 64, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.text }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </div>
            <div style={{ fontSize: 10, fontFamily: fn, color: C.text, textAlign: 'center', fontWeight: 500 }}>Gym<br/>Settings</div>
          </button>
        </div>
      </div>
      
      {/* Recent Activity — tapping checkin opens attendance date, tapping workout/diet opens member profile */}
      {recentActivity.length > 0 && (
        <div className="msg-fadein-up msg-stagger-4" style={{ padding: '24px 20px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 16, fontFamily: fb, fontWeight: 600, color: C.text }}>Recent Activity</div>
            <button
              type="button"
              onClick={() => navigateToAttendance ? navigateToAttendance() : setTab('attendance')}
              style={{ background: 'none', border: 'none', color: C.accent, fontSize: 12, fontFamily: fb, fontWeight: 600, cursor: 'pointer', padding: 0 }}
            >
              See all →
            </button>
          </div>
          <div className={isDark ? 'msg-glass' : 'msg-glass-light'} style={{ borderRadius: 16, padding: '8px 16px' }}>
            {recentActivity.map((act, i) => (
              <div
                key={i}
                onClick={() => {
                  if (act.type === 'checkin') {
                    const actDate = act.timestamp?.toDate ? act.timestamp.toDate().toISOString().split('T')[0] : todayKey;
                    if (navigateToAttendance) navigateToAttendance(actDate);
                    else setTab('attendance');
                  } else if (act.uid) {
                    onViewMemberProfile?.({ uid: act.uid, name: act.memberName || 'Member' });
                  }
                }}
                className="msg-card-scale"
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0',
                  borderBottom: i < recentActivity.length - 1 ? `1px solid ${C.border}` : 'none',
                  cursor: 'pointer'
                }}
                title={act.type === 'checkin' ? 'View attendance for this day' : 'View member profile'}
              >
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: C.s2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {act.type === 'workout' ? <DumbbellIcon size={16} color={C.accent} /> : act.type === 'diet' ? <SaladIcon size={16} color={C.green} /> : act.type === 'checkin' ? <CalendarIcon size={16} color={C.blue} /> : <ZapIcon size={16} color="#f59e0b" />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontFamily: fb, color: C.text }}>
                    {act.memberName ? `${act.memberName} ` : ''}
                    {act.type === 'workout' ? 'Logged a workout' : act.type === 'diet' ? 'Logged diet' : 'Checked in'}
                  </div>
                  <div style={{ fontSize: 11, fontFamily: fn, color: C.sub }}>{act.timestamp?.toDate ? new Date(act.timestamp.toDate()).toLocaleString() : 'Just now'}</div>
                </div>
                <div style={{ fontSize: 13, fontFamily: fb, color: C.accent }}>+{act.points} pts</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
