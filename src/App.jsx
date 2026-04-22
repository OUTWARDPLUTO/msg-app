import { useState, useEffect, lazy, Suspense } from 'react';
import { THEMES, C } from './shared/theme.js';
import { getFBAuth, getFBFirestore, getUserDoc, checkSubscription } from './shared/firebase.js';

// ── Auth screens
import LoginScreen      from './auth/LoginScreen.jsx';
import ProfileSetupScreen from './auth/ProfileSetupScreen.jsx';
import GymOnboarding    from './auth/GymOnboarding.jsx';

// ── Role UIs
import OwnerDashboard   from './owner/OwnerDashboard.jsx';
import TrainerView      from './owner/TrainerView.jsx';

// ── Member App (lazy — bundles all existing sections)
const MemberApp = lazy(() => import('./MemberApp.jsx'));
import { Spinner } from './shared/primitives.jsx';

// ────────────────────────────────────────────────────────────────────────────
// Persistence helpers
// ────────────────────────────────────────────────────────────────────────────
const load = (key, fallback) => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; } };
const save = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} };

// ────────────────────────────────────────────────────────────────────────────
// Root: MSG – role-based router
// ────────────────────────────────────────────────────────────────────────────
export default function MSG() {
  // ── Theme ──────────────────────────────────────────────────────────────────
  const [darkMode, setDarkMode] = useState(() => load('msg_dark', true));
  Object.assign(C, THEMES[darkMode ? 'dark' : 'light']);
  const toggleTheme = () => setDarkMode(d => { const n = !d; save('msg_dark', n); Object.assign(C, THEMES[n ? 'dark' : 'light']); return n; });

  // ── Auth ───────────────────────────────────────────────────────────────────
  const [user, setUser]         = useState(() => load('msg_user', null));
  const [gymId, setGymId]       = useState(() => load('msg_gym_id', null));
  const [gymName, setGymName]   = useState(() => load('msg_gym_name', ''));
  const [role, setRole]         = useState(() => load('msg_role', 'member'));
  const [gymLoading, setGymLoading] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);

  // ── Member state (persisted) ────────────────────────────────────────────────
  const [dietGoal, setDietGoalRaw]       = useState(() => load('msg_diet_goal', null));
  const [mealLog, setMealLogRaw]         = useState(() => load('msg_meal_log', []));
  const [weekPlan, setWeekPlanRaw]       = useState(() => load('msg_week_plan', null));
  const [progressLogs, setProgressLogsRaw] = useState(() => load('msg_progress', []));

  const setDietGoal     = v  => { setDietGoalRaw(v); save('msg_diet_goal', v); };
  const setMealLog      = upd => setMealLogRaw(prev => { const n = typeof upd === 'function' ? upd(prev) : upd; save('msg_meal_log', n); return n; });
  const setWeekPlan     = v   => { setWeekPlanRaw(v); save('msg_week_plan', v); };
  const setProgressLogs = upd => setProgressLogsRaw(prev => { const n = typeof upd === 'function' ? upd(prev) : upd; save('msg_progress', n); return n; });

  // ── Global CSS + fonts + animations ───────────────────────────────────────
  useEffect(() => {
    if (!document.getElementById('msg-gf')) {
      const link = document.createElement('link');
      link.id = 'msg-gf'; link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap';
      document.head.appendChild(link);
    }
    if (!document.getElementById('msg-global-css')) {
      const style = document.createElement('style');
      style.id = 'msg-global-css';
      style.textContent = `
        html { height: -webkit-fill-available; }
        body { min-height: -webkit-fill-available; overscroll-behavior: none; }
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
        .msg-scroll { overflow-y: auto; -webkit-overflow-scrolling: touch; overscroll-behavior: contain; }
        .msg-bottom-nav { padding-bottom: env(safe-area-inset-bottom, 0px) !important; }
        @supports (height: 100dvh) { .msg-root { height: 100dvh !important; } }
        @supports not (height: 100dvh) { .msg-root { height: 100vh !important; height: -webkit-fill-available !important; } }
        .msg-root, .msg-root * { transition: background-color 0.2s ease, border-color 0.2s ease, color 0.15s ease; }
        .msg-scroll::-webkit-scrollbar { display: none; }

        /* ── Premium animation keyframes ── */
        @keyframes msgFadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes msgFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes msgScaleIn {
          from { opacity: 0; transform: scale(0.88); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes msgSlideLeft {
          from { opacity: 0; transform: translateX(30px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes msgSlideRight {
          from { opacity: 0; transform: translateX(-30px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes msgPulse {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.07); }
        }
        @keyframes msgShimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
        @keyframes msgBounceIn {
          0%   { opacity: 0; transform: scale(0.3); }
          50%  { opacity: 1; transform: scale(1.1); }
          70%  { transform: scale(0.95); }
          100% { transform: scale(1); }
        }
        @keyframes msgDotBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40%            { transform: translateY(-8px); opacity: 1; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Utility animation classes ── */
        .msg-anim-fadeup  { animation: msgFadeSlideUp 0.4s cubic-bezier(.22,.68,0,1.2) both; }
        .msg-anim-fadein  { animation: msgFadeIn 0.35s ease both; }
        .msg-anim-scalein { animation: msgScaleIn 0.35s cubic-bezier(.22,.68,0,1.2) both; }
        .msg-anim-slide-l { animation: msgSlideLeft 0.38s cubic-bezier(.22,.68,0,1.2) both; }
        .msg-anim-slide-r { animation: msgSlideRight 0.38s cubic-bezier(.22,.68,0,1.2) both; }
        .msg-anim-bounce  { animation: msgBounceIn 0.55s cubic-bezier(.22,.68,0,1.2) both; }

        /* ── Stagger delays ── */
        .msg-d1 { animation-delay: 0.05s; }
        .msg-d2 { animation-delay: 0.10s; }
        .msg-d3 { animation-delay: 0.15s; }
        .msg-d4 { animation-delay: 0.20s; }
        .msg-d5 { animation-delay: 0.25s; }
        .msg-d6 { animation-delay: 0.30s; }

        /* ── Button interactions ── */
        button { transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s, background 0.18s, border-color 0.18s !important; }
        button:active:not(:disabled) { transform: scale(0.96) !important; }

        /* ── Ripple shimmer on loading ── */
        .msg-shimmer {
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%);
          background-size: 200% 100%;
          animation: msgShimmer 1.5s infinite;
        }

        /* ── Nav dot bounce ── */
        .msg-nav-dot { animation: msgDotBounce 0.5s cubic-bezier(.22,.68,0,1.2) both; }

        /* ── Card hover lift ── */
        .msg-card-hover { transition: transform 0.2s, box-shadow 0.2s !important; }
        .msg-card-hover:hover { transform: translateY(-2px); }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // ── Firebase Auth state sync ───────────────────────────────────────────────
  useEffect(() => {
    getFBAuth().then(auth => {
      auth.onAuthStateChanged(fbUser => {
        if (fbUser && !user) {
          const u = {
            uid: fbUser.uid,
            name: fbUser.displayName || fbUser.email.split('@')[0],
            email: fbUser.email,
            photo: fbUser.photoURL,
          };
          setUser(u); save('msg_user', u);
          resolveGym(fbUser.uid);
        }
      });
    }).catch(() => {});
  }, []); // eslint-disable-line

  // ── Resolve gymId + role from Firestore ────────────────────────────────────
  async function resolveGym(uid) {
    if (!uid) return;
    setGymLoading(true);
    try {
      const doc = await getUserDoc(uid);
      if (doc?.gymId) {
        setGymId(doc.gymId);   save('msg_gym_id', doc.gymId);
        setRole(doc.role || 'member'); save('msg_role', doc.role || 'member');
        try {
          const db = await getFBFirestore();
          const gymDoc = await db.doc(`gyms/${doc.gymId}`).get();
          if (gymDoc.exists) { const n = gymDoc.data().name; setGymName(n); save('msg_gym_name', n); }
        } catch(_) {}
      }
    } catch (e) { console.warn('resolveGym:', e.message); }
    setGymLoading(false);
  }

  // ── Login handler ──────────────────────────────────────────────────────────
  const handleLogin = (u, isNew = false) => {
    const prevUser = load('msg_user', null);
    if (!prevUser || prevUser.uid !== u.uid) {
      setDietGoal(null); setMealLog([]); setWeekPlan(null); setProgressLogs([]);
      setGymId(null); setRole('member');
      save('msg_gym_id', null); save('msg_role', 'member');
    }
    setUser(u); save('msg_user', u);
    if (isNew) setShowProfileSetup(true);
    else resolveGym(u.uid);
  };

  // ── Logout handler ─────────────────────────────────────────────────────────
  const handleLogout = async () => {
    try { const auth = await getFBAuth(); await auth.signOut(); } catch {}
    setUser(null); save('msg_user', null);
    setGymId(null); save('msg_gym_id', null);
    setRole('member'); save('msg_role', 'member');
    setMealLog([]); setProgressLogs([]); setDietGoal(null); setWeekPlan(null);
  };

  // ── Gym joined callback ────────────────────────────────────────────────────
  const handleGymJoined = (gId, gRole, gName) => {
    setGymId(gId);   save('msg_gym_id', gId);
    setRole(gRole);  save('msg_role', gRole);
    setGymName(gName); save('msg_gym_name', gName);
  };

  // ── One-time data migration ────────────────────────────────────────────────
  useEffect(() => {
    if (load('msg_data_version', 1) < 2) {
      setMealLog([]); setProgressLogs([]); setDietGoal(null); setWeekPlan(null);
      save('msg_data_version', 2);
    }
  }, []); // eslint-disable-line

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER DECISION TREE
  // ─────────────────────────────────────────────────────────────────────────

  const fullPageLoader = (
    <div style={{ background: C.bg, height: '100dvh', maxWidth: 430, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Spinner text="Loading MSG…" />
    </div>
  );

  // 1. Not logged in
  if (!user) return <LoginScreen onLogin={handleLogin} />;

  // 2. Profile setup for new signups
  if (showProfileSetup) return (
    <ProfileSetupScreen
      user={user}
      onComplete={u => {
        setUser(u); save('msg_user', u);
        setShowProfileSetup(false);
      }}
    />
  );

  // 3. Resolving gym from Firestore
  if (gymLoading) return fullPageLoader;

  // 4. No gymId — must onboard
  if (!gymId) return (
    <GymOnboarding
      user={user}
      onGymJoined={handleGymJoined}
    />
  );

  // 5. Role-based routing
  if (role === 'owner') return (
    <OwnerDashboard
      gymId={gymId}
      gymName={gymName}
      user={user}
      onLogout={handleLogout}
    />
  );

  if (role === 'trainer') return (
    <TrainerView
      gymId={gymId}
      user={user}
      onLogout={handleLogout}
    />
  );

  // 6. Default: member app
  return (
    <Suspense fallback={fullPageLoader}>
      <MemberApp
        user={user}
        gymId={gymId}
        gymName={gymName}
        darkMode={darkMode}
        onToggleTheme={toggleTheme}
        onLogout={handleLogout}
        dietGoal={dietGoal}       setDietGoal={setDietGoal}
        mealLog={mealLog}         setMealLog={setMealLog}
        weekPlan={weekPlan}       setWeekPlan={setWeekPlan}
        progressLogs={progressLogs} setProgressLogs={setProgressLogs}
      />
    </Suspense>
  );
}
