import { useState, useEffect, useRef, lazy, Suspense, Component } from 'react';
import { THEMES, C, fn } from './shared/theme.js';
import {
  getFBAuth,
  getFBFirestore,
  getUserDoc,
  setUserDoc,
  serverTimestamp,
  findGymByOwnerUid,
  findMemberRecordsByUid,
} from './shared/firebase.js';
import { App as CapApp } from '@capacitor/app';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import {
  setNotifSessionContext,
  clearNotifSessionContext,
  updateLastActive,
  ensureNotifChannels,
  attachPushListeners,
} from './shared/NotificationService.js';

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

  // ── Auth & Profile Resolution ──────────────────────────────────────────────
  const [user, setUser]         = useState(() => load('msg_user', null));
  const [gymId, setGymId]       = useState(() => load('msg_gym_id', null));
  const [gymName, setGymName]   = useState(() => load('msg_gym_name', ''));
  const [role, setRole]         = useState(() => load('msg_role', 'member'));
  // authStatus: 'initializing' | 'unauthenticated' | 'resolving_profile' | 'ready' | 'needs_onboarding' | 'profile_missing' | 'resolution_error'
  const [authStatus, setAuthStatus] = useState(() => (load('msg_user', null) && load('msg_gym_id', null) ? 'initializing' : 'initializing'));
  const [resolutionError, setResolutionError] = useState(null);
  const [gymSubscriptionExpired, setGymSubscriptionExpired] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const profileResolvingRef = useRef(false);
  const lastResolvedUidRef = useRef(null);

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

  // ── Notification channels (idempotent — safe on every launch) ────────────
  useEffect(() => {
    ensureNotifChannels();
  }, []);

  // ── App foreground → update lastActiveAt (rate-limited) ─────────────────
  useEffect(() => {
    let handler;
    CapApp.addListener('appStateChange', (state) => {
      if (state.isActive && user?.uid) {
        updateLastActive(user.uid, gymId || null);
      }
    }).then(h => { handler = h; });
    return () => { handler?.remove(); };
  }, [user?.uid, gymId]); // eslint-disable-line

  // ── Android back button handler ────────────────────────────────────────────
  // Active screens register window.__msgGoBack() which returns true if handled.
  // We only call exitApp() when at root dashboard or root login with no in-app state.
  useEffect(() => {
    let handler;
    CapApp.addListener('backButton', () => {
      const handled = typeof window.__msgGoBack === 'function' && window.__msgGoBack();
      if (handled) return;

      // If user is on an error/recovery screen, back returns to login screen
      if (authStatus === 'resolution_error' || authStatus === 'profile_missing') {
        handleLogout();
        return;
      }

      // Nothing left in the in-app stack — exit
      CapApp.exitApp();
    }).then(h => { handler = h; });
    return () => { handler?.remove(); };
  }, [authStatus]);

  // ── Firebase Auth state sync (session restore on launch) ───────────────────
  useEffect(() => {
    let unsubscribeAuth = null;
    getFBAuth().then(auth => {
      unsubscribeAuth = auth.onAuthStateChanged(fbUser => {
        if (fbUser) {
          const u = {
            uid: fbUser.uid,
            name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
            email: fbUser.email || '',
            photo: fbUser.photoURL || null,
          };
          setUser(u);
          save('msg_user', u);
          // Only trigger if not already resolved/resolving for this UID
          if (lastResolvedUidRef.current !== fbUser.uid) {
            resolveUserProfile(u);
          }
        } else {
          // Firebase reports no active user
          lastResolvedUidRef.current = null;
          if (!profileResolvingRef.current) {
            setUser(null);          save('msg_user', null);
            setGymId(null);         save('msg_gym_id', null);
            setRole('member');      save('msg_role', 'member');
            setGymName('');         save('msg_gym_name', '');
            setAuthStatus('unauthenticated');
          }
        }
      });
    }).catch(err => {
      console.warn('[MSG Auth] getFBAuth initialization issue:', err.message);
      const cachedUser = load('msg_user', null);
      const cachedGymId = load('msg_gym_id', null);
      if (cachedUser && cachedGymId) {
        setAuthStatus('ready');
      } else {
        setAuthStatus('unauthenticated');
      }
    });

    return () => {
      if (typeof unsubscribeAuth === 'function') unsubscribeAuth();
    };
  }, []); // eslint-disable-line

  // ── Resolve user profile & gym association from Firestore ──────────────────
  async function resolveUserProfile(userObj, isFreshLogin = false) {
    if (!userObj?.uid) {
      setAuthStatus('unauthenticated');
      return;
    }
    const uid = userObj.uid;
    lastResolvedUidRef.current = uid;
    profileResolvingRef.current = true;
    setAuthStatus('resolving_profile');
    setResolutionError(null);

    console.log(`[MSG Auth] Resolving profile for UID: ${uid} (freshLogin=${isFreshLogin})`);

    try {
      const userDoc = await getUserDoc(uid);

      if (userDoc) {
        console.log(`[MSG Auth] Profile confirmed for ${uid}: gymId=${userDoc.gymId}, role=${userDoc.role}`);
        const updatedUser = {
          uid,
          name: userDoc.name || userObj.name || userDoc.email?.split('@')[0] || 'User',
          email: userDoc.email || userObj.email || '',
          photo: userDoc.photo || userObj.photo || null,
          profile: userDoc.profile || null,
        };
        setUser(updatedUser);
        save('msg_user', updatedUser);
        if (userDoc.profile) {
          try { localStorage.setItem('msg_profile_details', JSON.stringify(userDoc.profile)); } catch {}
        }
        if (userDoc.photo) {
          try { localStorage.setItem('msg_profile_photo', userDoc.photo); } catch {}
        }

        if (userDoc.gymId) {
          const resolvedGymId = userDoc.gymId;
          const resolvedRole = userDoc.role || 'member';
          setGymId(resolvedGymId);
          save('msg_gym_id', resolvedGymId);
          setRole(resolvedRole);
          save('msg_role', resolvedRole);

          try {
            const db = await getFBFirestore();
            const gymSnap = await db.doc(`gyms/${resolvedGymId}`).get();
            if (gymSnap.exists) {
              const gymData = gymSnap.data();
              setGymName(gymData.name || '');
              save('msg_gym_name', gymData.name || '');

              if (resolvedRole === 'member' && gymData.ownerUid) {
                const subDoc = await db.doc(`users/${gymData.ownerUid}`).get();
                const subData = subDoc.data()?.subscription;
                if (!subData || subData.status !== 'active' || (subData.expiresAt && subData.expiresAt < Date.now())) {
                  setGymSubscriptionExpired(true);
                } else {
                  setGymSubscriptionExpired(false);
                }
              }
            }
          } catch (gymErr) {
            console.warn('[MSG Auth] Failed to fetch gym details (proceeding with known gymId):', gymErr.message);
          }

          setAuthStatus('ready');
          profileResolvingRef.current = false;
          return;
        }

        // userDoc exists but gymId is null: Self-healing lookup
        const ownedGym = await findGymByOwnerUid(uid);
        if (ownedGym) {
          console.log(`[MSG Auth] Self-healed missing gymId from owned gym: ${ownedGym.id}`);
          await setUserDoc(uid, { gymId: ownedGym.id, role: 'owner' }, true);
          setGymId(ownedGym.id); save('msg_gym_id', ownedGym.id);
          setRole('owner'); save('msg_role', 'owner');
          setGymName(ownedGym.name || ''); save('msg_gym_name', ownedGym.name || '');
          setAuthStatus('ready');
          profileResolvingRef.current = false;
          return;
        }

        const memberRecord = await findMemberRecordsByUid(uid);
        if (memberRecord && memberRecord.gymId) {
          console.log(`[MSG Auth] Self-healed missing gymId from member record: ${memberRecord.gymId}`);
          const memRole = memberRecord.role || 'member';
          await setUserDoc(uid, { gymId: memberRecord.gymId, role: memRole }, true);
          setGymId(memberRecord.gymId); save('msg_gym_id', memberRecord.gymId);
          setRole(memRole); save('msg_role', memRole);
          setAuthStatus('ready');
          profileResolvingRef.current = false;
          return;
        }

        // Confirmed: user doc exists in Firestore, but definitely has no gym
        setGymId(null); save('msg_gym_id', null);
        setGymName(''); save('msg_gym_name', '');
        setAuthStatus('needs_onboarding');
        profileResolvingRef.current = false;
        return;
      }

      // userDoc is NOT in Firestore
      console.warn(`[MSG Auth] No user doc at users/${uid}. Performing self-healing check...`);
      const ownedGym = await findGymByOwnerUid(uid);
      if (ownedGym) {
        console.log(`[MSG Auth] Self-healed user doc: user owns gym ${ownedGym.id}`);
        await setUserDoc(uid, {
          uid,
          name: userObj.name || 'Gym Owner',
          email: userObj.email || '',
          photo: userObj.photo || null,
          role: 'owner',
          gymId: ownedGym.id,
          createdAt: serverTimestamp(),
          lastActiveAt: serverTimestamp(),
        });
        setGymId(ownedGym.id); save('msg_gym_id', ownedGym.id);
        setRole('owner'); save('msg_role', 'owner');
        setGymName(ownedGym.name || ''); save('msg_gym_name', ownedGym.name || '');
        setAuthStatus('ready');
        profileResolvingRef.current = false;
        return;
      }

      const memberRecord = await findMemberRecordsByUid(uid);
      if (memberRecord && memberRecord.gymId) {
        console.log(`[MSG Auth] Self-healed user doc: member record in gym ${memberRecord.gymId}`);
        const memRole = memberRecord.role || 'member';
        await setUserDoc(uid, {
          uid,
          name: userObj.name || memberRecord.name || 'Member',
          email: userObj.email || memberRecord.email || '',
          photo: userObj.photo || null,
          role: memRole,
          gymId: memberRecord.gymId,
          createdAt: serverTimestamp(),
          lastActiveAt: serverTimestamp(),
        });
        setGymId(memberRecord.gymId); save('msg_gym_id', memberRecord.gymId);
        setRole(memRole); save('msg_role', memRole);
        setAuthStatus('ready');
        profileResolvingRef.current = false;
        return;
      }

      // Profile truly missing from Firestore with no existing records
      console.warn(`[MSG Auth] No profile or gym record found for ${uid}. Presenting recovery state.`);
      setAuthStatus('profile_missing');
      profileResolvingRef.current = false;
    } catch (err) {
      console.error(`[MSG Auth] Profile resolution error for ${uid}:`, err);
      // Fallback: Check if cached session matches this UID
      const cachedUser = load('msg_user', null);
      const cachedGymId = load('msg_gym_id', null);
      if (cachedUser && cachedUser.uid === uid && cachedGymId) {
        console.log('[MSG Auth] Network error during resolution. Using cached session as temporary fallback.');
        setAuthStatus('ready');
        profileResolvingRef.current = false;
        return;
      }
      setResolutionError(err?.message || 'Unable to connect to database. Please check your connection.');
      setAuthStatus('resolution_error');
      profileResolvingRef.current = false;
    }
  }

  // ── Login handler ──────────────────────────────────────────────────────────
  const handleLogin = (u) => {
    const prevUser = load('msg_user', null);
    if (!prevUser || prevUser.uid !== u.uid) {
      setDietGoal(null); setMealLog([]); setWeekPlan(null); setProgressLogs([]);
      setGymId(null); setRole('member');
      save('msg_gym_id', null); save('msg_role', 'member');
      localStorage.removeItem('msg_setup_done');
      localStorage.removeItem('msg_profile_details');
      localStorage.removeItem('msg_profile_photo');
    }
    const safeUser = { ...u, name: u.name || u.email?.split('@')[0] || 'User' };
    setUser(safeUser); save('msg_user', safeUser);
    resolveUserProfile(safeUser, true);
  };

  // ── Setup new account handler (explicit user confirmation from recovery) ──
  const handleSetupNewAccount = async () => {
    if (!user?.uid) return;
    setAuthStatus('resolving_profile');
    try {
      await setUserDoc(user.uid, {
        uid: user.uid,
        name: user.name || '',
        email: user.email || '',
        photo: user.photo || null,
        role: 'member',
        createdAt: serverTimestamp(),
        lastActiveAt: serverTimestamp(),
      });
      setAuthStatus('needs_onboarding');
    } catch (err) {
      console.error('[MSG Auth] Failed to initialize user document:', err);
      setResolutionError(err?.message || 'Failed to initialize account.');
      setAuthStatus('resolution_error');
    }
  };

  // ── Sync NotificationService session context whenever user/gymId/role change
  useEffect(() => {
    if (user?.uid && gymId) {
      setNotifSessionContext(user.uid, gymId, role);
      // Update lastActiveAt on fresh login / cold-start restore
      updateLastActive(user.uid, gymId);
      // Attach persistent push listeners (once per session; handlers are idempotent)
      attachPushListeners({
        // Route navigation callback: navigate member to tab, owner to nav section
        onNavigate: (route) => {
          // Store pending route; each role's UI reads this on mount
          try { localStorage.setItem('msg_pending_route', route); } catch {}
          // Trigger custom event for in-app subscribers to react immediately
          window.dispatchEvent(new CustomEvent('msg_notif_route', { detail: route }));
        },
      });
    } else if (!user) {
      clearNotifSessionContext();
    }
  }, [user?.uid, gymId, role]); // eslint-disable-line

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
    localStorage.removeItem('msg_pending_route');
    clearNotifSessionContext();
    profileResolvingRef.current = false;
    lastResolvedUidRef.current = null;
    setShowProfileSetup(false);
    setResolutionError(null);
    setAuthStatus('unauthenticated');
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
    setGymId(gId);     save('msg_gym_id', gId);
    setRole(gRole);    save('msg_role', gRole);
    setGymName(gName); save('msg_gym_name', gName);
    setAuthStatus('ready');
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
    <div style={{ background: C.bg, height: '100dvh', maxWidth: 430, margin: '0 auto', padding: 'env(safe-area-inset-top) 20px 20px', display: 'flex', flexDirection: 'column', gap: 24, justifyContent: 'center', alignItems: 'center' }}>
      <div className="msg-shimmer" style={{ width: 68, height: 68, borderRadius: '50%', background: C.s2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, marginBottom: 8 }}>
        ⚡
      </div>
      <div style={{ fontFamily: fn, fontSize: 18, fontWeight: 700, color: C.text }}>
        Verifying Account…
      </div>
      <div style={{ fontSize: 13, color: C.sub, textAlign: 'center', maxWidth: 280, lineHeight: 1.5 }}>
        Checking your profile and gym access. Please hold on.
      </div>
    </div>
  );

  // 1. Loading / verifying profile
  if (authStatus === 'initializing' || authStatus === 'resolving_profile') {
    return fullPageLoader;
  }

  // 2. Unauthenticated
  if (authStatus === 'unauthenticated' || !user) {
    return <LoginScreen onLogin={handleLogin} darkMode={darkMode} />;
  }

  // 3. Connection / resolution error state
  if (authStatus === 'resolution_error') {
    return (
      <div style={{ background: C.bg, height: '100dvh', maxWidth: 430, margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', fontFamily: fn }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>📡</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 8 }}>Connection Problem</div>
        <div style={{ fontSize: 13, color: C.sub, marginBottom: 20, lineHeight: 1.6, maxWidth: 320 }}>
          {resolutionError || 'Unable to connect to the database to verify your gym profile.'}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
          <button
            onClick={() => resolveUserProfile(user, true)}
            style={{
              background: C.accent, border: 'none', borderRadius: 14, padding: '14px',
              color: '#111', fontWeight: 800, fontSize: 14, cursor: 'pointer',
            }}
          >
            🔄 Retry Connection
          </button>
          {load('msg_gym_id', null) && (
            <button
              onClick={() => setAuthStatus('ready')}
              style={{
                background: C.s2, border: `1px solid ${C.border}`, borderRadius: 14, padding: '13px',
                color: C.text, fontWeight: 700, fontSize: 13, cursor: 'pointer',
              }}
            >
              Continue Offline
            </button>
          )}
          <button
            onClick={handleLogout}
            style={{
              background: 'none', border: 'none', color: C.muted, padding: '10px',
              fontWeight: 600, fontSize: 12, cursor: 'pointer',
            }}
          >
            Sign Out / Return to Login
          </button>
        </div>
      </div>
    );
  }

  // 4. Missing profile recovery state (explicit choice to prevent duplicate accounts)
  if (authStatus === 'profile_missing') {
    return (
      <div style={{ background: C.bg, height: '100dvh', maxWidth: 430, margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', fontFamily: fn }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>🔍</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 8 }}>Profile Recovery</div>
        <div style={{ fontSize: 13, color: C.sub, marginBottom: 24, lineHeight: 1.6, maxWidth: 320 }}>
          We authenticated <strong style={{ color: C.text }}>{user?.email || 'your account'}</strong>, but did not find an active gym profile.
          <br/><br/>
          To prevent duplicate records, please confirm:
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
          <button
            onClick={() => resolveUserProfile(user, true)}
            style={{
              background: C.s2, border: `1px solid ${C.border}`, borderRadius: 14, padding: '14px',
              color: C.text, fontWeight: 700, fontSize: 14, cursor: 'pointer',
            }}
          >
            🔄 Re-check Database
          </button>
          <button
            onClick={handleSetupNewAccount}
            style={{
              background: C.accent, border: 'none', borderRadius: 14, padding: '14px',
              color: '#111', fontWeight: 800, fontSize: 14, cursor: 'pointer',
            }}
          >
            ✨ Set Up Account As New
          </button>
          <button
            onClick={handleLogout}
            style={{
              background: 'none', border: 'none', color: C.muted, padding: '10px',
              fontWeight: 600, fontSize: 12, cursor: 'pointer',
            }}
          >
            Sign Out / Switch Account
          </button>
        </div>
      </div>
    );
  }

  // 5. Profile setup for new signups
  if (showProfileSetup) return (
    <ProfileSetupScreen
      user={user}
      onComplete={u => {
        setUser(u); save('msg_user', u);
        setShowProfileSetup(false);
      }}
      onBackToLogin={handleLogout}
    />
  );

  // 6. Confirmed needs onboarding
  if (authStatus === 'needs_onboarding' || !gymId) return (
    <GymOnboarding
      user={user}
      onGymJoined={handleGymJoined}
      darkMode={darkMode}
      onBackToLogin={handleLogout}
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
