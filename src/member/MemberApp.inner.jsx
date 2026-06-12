export default function MemberApp({
  user, darkMode, onToggleTheme, onLogout,
  gymId, gymName, // msg-app SaaS layer props
  dietGoal, setDietGoal, mealLog, setMealLog, weekPlan, setWeekPlan,
  progressLogs, setProgressLogs,
}) {
  Object.assign(C, THEMES[darkMode ? 'dark' : 'light']);

  const [tab, setTab] = useState('home');
  const [showProfile, setShowProfile] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [profileScreen, setProfileScreen] = useState(null);
  const [childBackHandler, setChildBackHandler] = useState(null);

  // Setup + tutorial gating
  // msg_setup_done is set after ProfileSetupScreen completes
  // msg_tutorial_done is set after the tutorial is dismissed
  const [setupDone, setSetupDone] = useState(() => !!localStorage.getItem('msg_setup_done'));
  const [showTutorial, setShowTutorial] = useState(false); // fires AFTER setup, not on mount

  // Register push notifications via Capacitor
  useEffect(() => {
    (async () => {
      try {
        const { PushNotifications } = await import('@capacitor/push-notifications');
        const perm = await PushNotifications.requestPermissions();
        if (perm.receive === 'granted') {
          await PushNotifications.register();
          PushNotifications.addListener('registration', token => {
            console.log('[MSG] Push token:', token.value);
          });
          PushNotifications.addListener('registrationError', err => {
            console.warn('[MSG] Push registration error:', err);
          });
          PushNotifications.addListener('pushNotificationReceived', n => {
            console.log('[MSG] Push received:', n);
          });
        }
      } catch {
        // Not available in web/dev environment — silently ignore
      }
    })();
  }, []);

  // ── Tab navigation history for Android back button ─────────────────────
  const tabHistoryRef = useRef(['home']);

  // Wrap setTab to push onto the history stack
  const navigate = (newTab) => {
    if (newTab !== tab) {
      tabHistoryRef.current = [...tabHistoryRef.current, newTab];
    }
    setTab(newTab);
  };

  // Register a global back handler for the Capacitor backButton event in App.jsx.
  // Priority: close profileScreen → close log modal → close profile dropdown
  //           → go to previous tab → go home → return false (let app exit)
  useEffect(() => {
    window.__msgGoBack = () => {
      if (!setupDone) return true;          // block back during setup
      if (showTutorial) return true;        // block back during tutorial
      if (profileScreen) { setProfileScreen(null); return true; }
      if (childBackHandler) {
        const handled = childBackHandler();
        if (handled) return true;
      }
      if (showLogModal)  { setShowLogModal(false);  return true; }
      if (showProfile)   { setShowProfile(false);   return true; }
      if (tabHistoryRef.current.length > 1) {
        tabHistoryRef.current = tabHistoryRef.current.slice(0, -1);
        setTab(tabHistoryRef.current[tabHistoryRef.current.length - 1]);
        return true;
      }
      if (tab !== 'home') { tabHistoryRef.current = ['home']; setTab('home'); return true; }
      return false;
    };
    return () => { window.__msgGoBack = null; };
  }, [setupDone, showTutorial, profileScreen, childBackHandler, showLogModal, showProfile, tab]);

  const handleSaveProgress = (entry) => {
    setProgressLogs(l => [...l, entry]);
    if (user?.uid && gymId && user.uid !== 'demo') {
      import('../shared/firebase.js').then(f => f.trackActivity(user.uid, gymId, 'progress'));
    }
  };

  // Track diet engagement
  const prevMealCount = useRef(mealLog.length);
  useEffect(() => {
    if (mealLog.length > prevMealCount.current) {
      if (user?.uid && gymId && user.uid !== 'demo') {
        import('../shared/firebase.js').then(f => f.trackActivity(user.uid, gymId, 'diet'));
      }
    }
    prevMealCount.current = mealLog.length;
  }, [mealLog.length, user?.uid, gymId]);


  const views = {
    home: (
      <div>
        <HomeSection
          mealLog={mealLog}
          progressLogs={progressLogs}
          dietGoal={dietGoal}
          onLogClick={() => setShowLogModal(true)}
          user={user}
          gymId={gymId}
          onAchievementsClick={() => setProfileScreen('profile')}
          setBackHandler={setChildBackHandler}
        />
      </div>
    ),
    workout: <WorkoutSection weekPlan={weekPlan} setWeekPlan={setWeekPlan} />,
    diet:    <DietSection dietGoal={dietGoal} setDietGoal={setDietGoal} mealLog={mealLog} setMealLog={setMealLog} />,
    store:   <StoreSection gymId={gymId} setBackHandler={setChildBackHandler} />,
    progress: <ProgressSection logs={progressLogs} onLogClick={() => setShowLogModal(true)} onDelete={i => setProgressLogs(l => l.filter((_, j) => j !== i))} />,
  };

  // ── Show ProfileSetupScreen on first ever login ──────────────────────────
  if (!setupDone) {
    return (
      <ProfileSetupScreen
        user={user}
        onComplete={(completedUser) => {
          localStorage.setItem('msg_setup_done', '1');
          setSetupDone(true);
          // Only show tutorial if it hasn't been seen before
          if (!localStorage.getItem('msg_tutorial_done')) {
            setShowTutorial(true);
          }
        }}
      />
    );
  }

  return (
    <div className="msg-root" style={{ position: 'relative', background: C.bg, color: C.text, fontFamily: "'Plus Jakarta Sans',sans-serif", display: 'flex', flexDirection: 'column', height: '100dvh', maxWidth: 430, margin: '0 auto', overflow: 'hidden', colorScheme: darkMode ? 'dark' : 'light' }}>
      <AmbientBackground />
      {showTutorial && <TutorialOverlay onDone={() => { setShowTutorial(false); localStorage.setItem('msg_tutorial_done', '1'); }} />}
      {/* Status bar background — fills the notch/status bar area on edge-to-edge devices */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 'env(safe-area-inset-top)', background: C.bg, zIndex: 999, flexShrink: 0 }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 'calc(env(safe-area-inset-top) + 12px)', paddingLeft: 20, paddingRight: 20, paddingBottom: 0, flexShrink: 0, zIndex: 10, background: C.bg }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ height: 32, width: 32, display: 'flex', alignItems: 'center' }}>
            <img
              src={appIconLight}
              alt="MSG"
              style={{ height: '100%', width: '100%', objectFit: 'contain', display: 'block', borderRadius: 8 }}
            />
          </div>
        </div>
        <button id="tut-profile-btn" onClick={() => setShowProfile(p => !p)} style={{ width: 36, height: 36, borderRadius: '50%', background: C.accent, border: `2px solid ${showProfile ? C.text : 'transparent'}`, cursor: 'pointer', fontFamily: fn, fontSize: 11, fontWeight: 800, color: '#111', transition: 'all 0.2s', boxShadow: C.accentShadow, overflow: 'hidden', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <UserAvatar user={{ ...user, photo: localStorage.getItem('msg_profile_photo') || user?.photo }} size={36} fontSize={11} />
        </button>
      </div>

      {showProfile && (
        <ProfileDropdown
          onClose={() => setShowProfile(false)}
          onNavigate={screen => setProfileScreen(screen)}
          onLogout={onLogout}
          user={user}
          darkMode={darkMode}
        />
      )}

      {showLogModal && <LogProgressModal onSave={handleSaveProgress} onClose={() => setShowLogModal(false)} darkMode={darkMode} />}
      {profileScreen === 'profile'  && <ProfileScreen  onClose={() => setProfileScreen(null)} progressLogs={progressLogs} dietGoal={dietGoal} mealLog={mealLog} weekPlan={weekPlan} user={user} gymId={gymId} />}
      {profileScreen === 'settings' && <SettingsScreen onClose={() => setProfileScreen(null)} onResetDiet={() => setDietGoal(null)} onResetWorkout={() => setWeekPlan(null)} darkMode={darkMode} onToggleTheme={onToggleTheme} />}
      {profileScreen === 'language' && <LanguageScreen onClose={() => setProfileScreen(null)} />}

      <div className="msg-scroll" style={{ flex: 1, overflowY: 'auto', paddingBottom: 100 }}>
        {views[tab]}
      </div>
      <BottomNavAnimated tab={tab} setTab={navigate} darkMode={darkMode} />
    </div>
  );
}


