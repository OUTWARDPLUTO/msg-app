import { useState, useEffect, useRef, lazy, Suspense, Component } from 'react';
import { THEMES, C, fn } from './shared/theme.js';
import { getFBAuth, getFBFirestore, getUserDoc } from './shared/firebase.js';
import { App as CapApp } from '@capacitor/app';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

// ────────────────────────────────────────────────────────────────────────────
// Error Boundary — catches MemberApp crashes, shows recovery UI (no blank screen)
// ────────────────────────────────────────────────────────────────────────────
export class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(err, info) { console.error('[MSG] ErrorBoundary caught:', err, info); }
  render() {
    if (!this.state.hasError) return this.props.children;
    const { C: colors, fn: fontName, onRetry } = this.props;
    return (
      <div style={{
        background: colors?.bg || '#111', color: colors?.text || '#fff',
        height: '100dvh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '32px 24px',
        fontFamily: fontName || 'sans-serif', textAlign: 'center',
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Something went wrong</div>
        <div style={{ fontSize: 13, color: colors?.sub || '#aaa', marginBottom: 28, lineHeight: 1.6 }}>
          {this.state.error?.message || 'An unexpected error occurred.'}
        </div>
        <button onClick={() => { this.setState({ hasError: false, error: null }); onRetry?.(); }}
          style={{ background: colors?.accent || '#D99A2B', border: 'none', borderRadius: 14,
            padding: '14px 32px', color: '#111', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
          Try Again
        </button>
      </div>
    );
  }
}

// ── Auth screens
import LoginScreen      from './auth/LoginScreen.jsx';
import ProfileSetupScreen from './auth/ProfileSetupScreen.jsx';
import GymOnboarding    from './auth/GymOnboarding.jsx';

// ── Role UIs
import OwnerDashboard   from './owner/OwnerDashboard.jsx';
import TrainerView      from './owner/TrainerView.jsx';

// ── Member App (static — no lazy-load/dynamic fetch issues in Capacitor)
import MemberApp from './MemberApp.jsx';
import { Spinner, Skeleton } from './shared/primitives.jsx';

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

  useEffect(() => {
    document.body.style.backgroundColor = C.bg;
    document.documentElement.style.backgroundColor = C.bg;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', C.bg);
  }, [darkMode]);

  // ── Auth ───────────────────────────────────────────────────────────────────
  const [user, setUser]         = useState(() => load('msg_user', null));
  const [gymId, setGymId]       = useState(() => load('msg_gym_id', null));
  const [gymName, setGymName]   = useState(() => load('msg_gym_name', ''));
  const [role, setRole]         = useState(() => load('msg_role', 'member'));
  const [gymLoading, setGymLoading] = useState(false);
  // authLoading: true on cold start when a cached user exists, so we never flash
  // GymOnboarding or LoginScreen while Firebase is validating the session token.
  const [authLoading, setAuthLoading] = useState(() => !!load('msg_user', null));
  const [gymSubscriptionExpired, setGymSubscriptionExpired] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const gymResolvedRef = useRef(false); // prevents double-resolveGym from onAuthStateChanged race

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
        .msg-root, .msg-root * { transition: background-color 0.3s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s cubic-bezier(0.16, 1, 0.3, 1), color 0.18s cubic-bezier(0.16, 1, 0.3, 1); }
        .msg-scroll::-webkit-scrollbar { display: none; }

        /* ── Premium spring animation keyframes ── */
        @keyframes msgFadeSlideUp {
          from { opacity: 0; transform: translateY(12px) scale(0.99); filter: blur(2px); }
          to   { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        @keyframes msgFadeIn {
          from { opacity: 0; filter: blur(2px); }
          to   { opacity: 1; filter: blur(0); }
        }
        @keyframes msgScaleIn {
          from { opacity: 0; transform: scale(0.96); filter: blur(4px); }
          to   { opacity: 1; transform: scale(1); filter: blur(0); }
        }
        @keyframes msgSlideLeft {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes msgSlideRight {
          from { opacity: 0; transform: translateX(-20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes msgPulse {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.02); }
        }
        @keyframes msgShimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
        @keyframes msgBounceIn {
          0%   { opacity: 0; transform: scale(0.94); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes msgDotBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40%            { transform: translateY(-4px); opacity: 1; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Utility animation classes using Apple spring-like easings ── */
        .msg-anim-fadeup  { animation: msgFadeSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .msg-anim-fadein  { animation: msgFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .msg-anim-scalein { animation: msgScaleIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .msg-anim-slide-l { animation: msgSlideLeft 0.5s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .msg-anim-slide-r { animation: msgSlideRight 0.5s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .msg-anim-bounce  { animation: msgBounceIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; }

        /* ── Stagger delays ── */
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

  // ── Android back button handler ────────────────────────────────────────────
  // MemberApp registers window.__msgGoBack() which pops its own nav stack.
  // We only call exitApp() when there's nothing left to navigate back through.
  useEffect(() => {
    let handler;
    CapApp.addListener('backButton', () => {
      const handled = typeof window.__msgGoBack === 'function' && window.__msgGoBack();
      if (!handled) {
        // Nothing left in the in-app stack — exit
        CapApp.exitApp();
      }
    }).then(h => { handler = h; });
    return () => { handler?.remove(); };
  }, []);

  // ── Firebase Auth state sync (session restore on cold launch only) ─────────
  useEffect(() => {
    getFBAuth().then(auth => {
      auth.onAuthStateChanged(fbUser => {
        // gymResolvedRef.current is false only on cold app launch (never after handleLogin)
        // This block only handles the case where the app restarts with an existing session.
        if (fbUser && !gymResolvedRef.current) {
          gymResolvedRef.current = true; // claim it immediately to prevent any race
          const u = {
            uid: fbUser.uid,
            name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
            email: fbUser.email,
            photo: fbUser.photoURL,
          };
          setUser(u); save('msg_user', u);
          resolveGym(fbUser.uid).finally(() => setAuthLoading(false));
        } else if (!fbUser) {
          // Firebase fired null — this can happen before the authenticated user
          // fires on Android cold start. Just unblock authLoading; do NOT clear
          // user/gymId here or we get a GymOnboarding flash when the user
          // comes in a frame later. If the session is truly expired, Firebase
          // ops will fail with auth errors which are handled individually.
          if (!gymResolvedRef.current) setAuthLoading(false);
        } else {
          // fbUser && gymResolvedRef.current = true → handleLogin already ran
          setAuthLoading(false);
        }
      });
    }).catch(() => { setAuthLoading(false); });
  }, []); // eslint-disable-line

  // ── Resolve gymId + role from Firestore ────────────────────────────────────
  async function resolveGym(uid) {
    if (!uid) return;
    // Guard: don't double-run. gymResolvedRef.current must be set to true
    // by the CALLER before invoking resolveGym (handleLogin / onAuthStateChanged).
    setGymLoading(true);
    // Safety timeout: never hang the spinner longer than 10 seconds
    const timeout = setTimeout(() => setGymLoading(false), 10000);
    try {
      const doc = await getUserDoc(uid);
      if (doc) {
        // Sync user properties (name, photo, profile) from Firestore to client session
        const updatedUser = {
          uid,
          name: doc.name || user?.name || doc.email?.split('@')[0] || 'User',
          email: doc.email || user?.email || '',
          photo: doc.photo || user?.photo || null,
          profile: doc.profile || null,
        };
        setUser(updatedUser);
        save('msg_user', updatedUser);
        if (doc.profile) {
          try { localStorage.setItem('msg_profile_details', JSON.stringify(doc.profile)); } catch {}
        }
        if (doc.photo) {
          try { localStorage.setItem('msg_profile_photo', doc.photo); } catch {}
        }

        if (doc.gymId) {
          setGymId(doc.gymId);   save('msg_gym_id', doc.gymId);
          setRole(doc.role || 'member'); save('msg_role', doc.role || 'member');
          try {
            const db = await getFBFirestore();
            const gymDoc = await db.doc(`gyms/${doc.gymId}`).get();
            if (gymDoc.exists) { 
              const data = gymDoc.data();
              setGymName(data.name); save('msg_gym_name', data.name); 
              
              // Member Access Restriction Check
              if (doc.role === 'member' || !doc.role) {
                if (data.ownerUid) {
                  const subDoc = await db.doc(`users/${data.ownerUid}`).get();
                  const subData = subDoc.data()?.subscription;
                  if (!subData || subData.status !== 'active' || (subData.expiresAt && subData.expiresAt < Date.now())) {
                    setGymSubscriptionExpired(true);
                  } else {
                    setGymSubscriptionExpired(false);
                  }
                }
              }
            }
          } catch(_) {}
        } else {
          setGymId(null); save('msg_gym_id', null);
          setRole('member'); save('msg_role', 'member');
          setGymName(''); save('msg_gym_name', '');
          setGymSubscriptionExpired(false);
        }
      } else {
        // User doc is missing/deleted from Firestore: Self-healing
        console.warn('User document not found in Firestore. Self-healing state...');
        setGymId(null); save('msg_gym_id', null);
        setRole('member'); save('msg_role', 'member');
        setGymName(''); save('msg_gym_name', '');
        localStorage.removeItem('msg_gym_id');
        localStorage.removeItem('msg_gym_name');
        localStorage.removeItem('msg_role');
        setShowProfileSetup(true); // Re-run profile setup / user doc creation
      }
    } catch (e) { console.warn('resolveGym:', e.message); }
    clearTimeout(timeout);
    setGymLoading(false);
  }

  // ── Login handler ──────────────────────────────────────────────────────────
  const handleLogin = (u, isNew = false) => {
    const prevUser = load('msg_user', null);
    if (!prevUser || prevUser.uid !== u.uid) {
      setDietGoal(null); setMealLog([]); setWeekPlan(null); setProgressLogs([]);
      setGymId(null); setRole('member');
      save('msg_gym_id', null); save('msg_role', 'member');
      localStorage.removeItem('msg_setup_done');
      localStorage.removeItem('msg_profile_details');
      localStorage.removeItem('msg_profile_photo');
    }
    // Normalise name — Google displayName can be null
    const safeUser = { ...u, name: u.name || u.email?.split('@')[0] || 'User' };
    setUser(safeUser); save('msg_user', safeUser);
    setAuthLoading(false); // login bypasses onAuthStateChanged — clear loading guard
    // Claim gymResolvedRef BEFORE resolveGym so onAuthStateChanged (which fires
    // after signInWithCredential resolves) sees it as already handled and skips.
    gymResolvedRef.current = true;
    if (isNew) setShowProfileSetup(true);
    else resolveGym(safeUser.uid);
  };

  // ── Logout handler ─────────────────────────────────────────────────────────
  const handleLogout = () => {
    // Clear React state FIRST so the UI returns to LoginScreen immediately.
    // Auth cleanup runs in the background — a hanging Firebase/network call
    // must never block the UI from updating.
    setUser(null);          save('msg_user', null);
    setGymId(null);         save('msg_gym_id', null);
    setRole('member');      save('msg_role', 'member');
    setGymName('');         save('msg_gym_name', '');
    setMealLog([]);         setProgressLogs([]);  setDietGoal(null);  setWeekPlan(null);
    localStorage.removeItem('msg_setup_done');
    localStorage.removeItem('msg_profile_details');
    localStorage.removeItem('msg_profile_photo');
    gymResolvedRef.current = false;
    setAuthLoading(false); // reset auth guard so next login starts fresh
    // Background cleanup (fire-and-forget — errors are swallowed intentionally)
    try {
      getFBAuth().then(auth => {
        try {
          auth.signOut().catch(e => console.warn('Firebase signOut promise error:', e));
        } catch (e) {
          console.warn('Firebase signOut throw error:', e);
        }
      }).catch(e => console.warn('getFBAuth error during signOut:', e));
    } catch (e) {
      console.warn('Firebase signOut failed to initiate:', e);
    }
    try {
      GoogleAuth.initialize({
        clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        scopes: ['profile', 'email'],
        grantOfflineAccess: true,
      }).then(() => {
        GoogleAuth.signOut().catch(e => console.warn('GoogleAuth.signOut promise error:', e));
      }).catch(e => {
        console.warn('GoogleAuth initialize failed during signOut:', e);
      });
    } catch (e) {
      console.warn('GoogleAuth signOut failed to initiate:', e);
    }
  };

  // ── Gym joined callback ────────────────────────────────────────────────────
  const handleGymJoined = (gId, gRole, gName) => {
    setGymId(gId);   save('msg_gym_id', gId);
    setRole(gRole);  save('msg_role', gRole);
    setGymName(gName); save('msg_gym_name', gName);
  };

  // Sync state between tabs if another tab changes it
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'msg_gym_name') setGymName(e.newValue || '');
    };
    const handleCustom = (e) => {
      setGymName(e.detail);
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('msg_gym_name_changed', handleCustom);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('msg_gym_name_changed', handleCustom);
    };
  }, []);

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
    <div style={{ background: C.bg, height: '100dvh', maxWidth: 430, margin: '0 auto', padding: 'env(safe-area-inset-top) 20px 20px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
        <div>
          <Skeleton width={160} height={28} style={{ marginBottom: 8 }} />
          <Skeleton width={100} height={16} />
        </div>
        <Skeleton circle width={44} height={44} />
      </div>
      <Skeleton width="100%" height={160} borderRadius={24} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Skeleton height={140} borderRadius={20} />
        <Skeleton height={140} borderRadius={20} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[1, 2, 3].map(i => <Skeleton key={i} height={80} borderRadius={16} stagger={i} />)}
      </div>
    </div>
  );

  // 1. Auth still resolving — show skeleton loader, never flash wrong screen
  if (authLoading || gymLoading) return fullPageLoader;

  // 2. Not logged in
  if (!user) return <LoginScreen onLogin={handleLogin} darkMode={darkMode} />;

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

  // 3. (gymLoading already handled above with authLoading)

  // 4. No gymId — must onboard
  if (!gymId) return (
    <GymOnboarding
      user={user}
      onGymJoined={handleGymJoined}
      darkMode={darkMode}
    />
  );

  // 5. Subscription check
  if (gymSubscriptionExpired) return (
    <div style={{ background: C.bg, height: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🔒</div>
      <div style={{ fontFamily: fn, fontSize: 24, fontWeight: 800, color: C.text, marginBottom: 12 }}>Gym Subscription Inactive</div>
      <div style={{ fontSize: 14, color: C.sub, lineHeight: 1.6, marginBottom: 32 }}>
        Your gym owner's MSG subscription has expired. <br/>
        Please contact them to renew it so you can continue training.
      </div>
      <button onClick={handleLogout} style={{
        background: C.s2, border: `1px solid ${C.border}`, borderRadius: 12,
        padding: '12px 24px', color: C.text, fontFamily: fn, fontWeight: 700, fontSize: 13, cursor: 'pointer'
      }}>Logout</button>
    </div>
  );

  // 6. Role-based routing
  if (role === 'owner') return (
    <ErrorBoundary C={C} fn={fn} onRetry={() => { /* just reset error state — don't clear gymId */ }}>
      <OwnerDashboard
        gymId={gymId}
        gymName={gymName}
        user={user}
        onLogout={handleLogout}
        darkMode={darkMode}
        onToggleTheme={toggleTheme}
      />
    </ErrorBoundary>
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
    <ErrorBoundary C={C} fn={fn} onRetry={() => { /* just reset error state — don't clear gymId */ }}>
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
    </ErrorBoundary>
  );
}
