import { useState, useEffect, useRef } from 'react';
import { C, fn, fb } from '../shared/theme.js';
import { UserAvatar } from '../shared/primitives.jsx';
import { Card, Lbl, Hd } from './primitives.jsx';
// ─── Modal Shell ─────────────────────────────────────────────────────────────
export function ModalShell({ title, onClose, children }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)',
      background: !C.isLight ? 'rgba(9, 9, 12, 0.95)' : 'rgba(242, 242, 247, 0.95)',
      backdropFilter: 'blur(28px)',
      WebkitBackdropFilter: 'blur(28px)',
      display: 'flex', flexDirection: 'column', overflowY: 'auto'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px 12px', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <button onClick={onClose} style={{ background: C.s3, border: 'none', width: 34, height: 34, borderRadius: '50%', color: C.sub, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>←</button>
        <div style={{ fontFamily: fn, fontSize: 28, color: C.text, letterSpacing: '0.06em', lineHeight: 1 }}>{title}</div>
      </div>
      <div className="msg-scroll" style={{ flex: 1, overflowY: 'auto' }}>
        {children}
      </div>
    </div>
  );
}

// ─── Profile Screen ───────────────────────────────────────────────────────────
export default function ProfileScreen({ onClose, progressLogs, dietGoal, mealLog = [], weekPlan, user, gymId }) {
  const [editing, setEditing] = useState(false);
  const initials = (user?.name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const [photo, setPhoto] = useState(() => {
    try { return localStorage.getItem('msg_profile_photo') || user?.photo || null; } catch { return user?.photo || null; }
  });
  const photoInputRef = useRef(null);

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      setPhoto(dataUrl);
      try { localStorage.setItem('msg_profile_photo', dataUrl); } catch {}
      if (user) {
        user.photo = dataUrl;
        try { localStorage.setItem('msg_user', JSON.stringify(user)); } catch {}
        if (user.uid && user.uid !== 'demo') {
          import('../shared/firebase.js').then(f => {
            f.updateUserDoc(user.uid, { photo: dataUrl }).catch(() => {});
          });
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const [profile, setProfile] = useState(() => {
    try {
      const p = localStorage.getItem('msg_profile_details');
      if (p) return JSON.parse(p);
      if (user?.profile) return user.profile;
    } catch {}
    return user?.profile || {
      name: user?.name || 'User',
      initials,
      bio: '',
      age: '', gender: '', phone: '', city: '',
    };
  });
  const [draft, setDraft] = useState({ ...profile });
  const sp = (k, v) => setDraft(p => ({ ...p, [k]: v }));

  const [score, setScore] = useState(0);
  useEffect(() => {
    if (user?.uid && gymId && user.uid !== 'demo') {
      import('../shared/firebase.js').then(async (f) => {
        try {
          const db = await f.getFBFirestore();
          const doc = await db.doc(`members/${gymId}_${user.uid}`).get();
          if (doc.exists) {
            setScore(doc.data().engagementScore || 0);
          }
        } catch (err) { console.warn('Failed to fetch engagement score:', err); }
      });
    }
  }, [user?.uid, gymId]);

  const last = progressLogs[progressLogs.length - 1];
  const first = progressLogs[0];
  const realStreak = calcStreak(progressLogs); // weeks
  const weightChange = last && first ? last.weight - first.weight : null;
  const weightLost = weightChange !== null && weightChange < 0 ? Math.abs(weightChange) : 0;
  const weightGained = weightChange !== null && weightChange > 0 ? weightChange : 0;
  const totalWorkouts = progressLogs.length;

  const stats = [
    { label: 'Current Weight', val: last ? `${last.weight} kg` : '—', color: C.accent },
    { label: 'Engagement Score', val: `${score} / 100`, color: C.blue },
    { label: 'Check-in Streak', val: realStreak > 0 ? `${realStreak} day${realStreak !== 1 ? 's' : ''} 🔥` : '—', color: C.orange },
    { label: 'Weight Change', val: weightChange !== null ? `${weightChange.toFixed(1)} kg` : '—', color: weightChange < 0 ? C.green : C.orange },
    { label: 'Entries Logged', val: `${progressLogs.length}`, color: C.purple },
    { label: 'Body Fat', val: last ? `${last.bodyFat}%` : '—', color: C.accent },
  ];

  // ── Achievement definitions (20 total) ───────────────────────────────────
  const [expandedAch, setExpandedAch] = useState(null);
  const ACHIEVEMENTS = [
    { id:1,  icon:'🩸', name:'First Blood',        cat:'Onboarding',   rarity:'Common',    desc:'Complete your first workout',
      how:'Log your first progress entry in the app. Just show up once — that\'s all it takes to start.',
      progress:'Single unlock — earned once, forever', unlocked: totalWorkouts >= 1 },
    { id:2,  icon:'💎', name:'Unbreakable',         cat:'Discipline',   rarity:'Common',    desc:'Maintain a 7-day check-in streak',
      how:'Log at least one progress entry every week without missing a week. Consistency is the key.',
      progress:'1 week → 4 weeks → 8 weeks → 52 weeks', unlocked: realStreak >= 1 },
    { id:3,  icon:'🤖', name:'Machine Mode',        cat:'Discipline',   rarity:'Common',    desc:'Hit a 30-day check-in streak',
      how:'Keep logging progress entries every week for 4 consecutive weeks. No gap allowed.',
      progress:'4 weeks of unbroken check-ins', unlocked: realStreak >= 4 },
    { id:4,  icon:'⏰', name:'5AM Club',            cat:'Lifestyle',    rarity:'Rare',      desc:'Complete 10 workouts before 6AM',
      how:'Start 10 of your workout sessions before 6:00 AM. Early birds build the strongest habits.',
      progress:'10 → 50 → 100 early sessions', unlocked: false },
    { id:5,  icon:'🌙', name:'Night Grinder',       cat:'Lifestyle',    rarity:'Rare',      desc:'Complete 10 workouts after 10PM',
      how:'Finish 10 workout sessions after 10:00 PM. Night owls earn this one.',
      progress:'10 → 50 → 100 late sessions', unlocked: false },
    { id:6,  icon:'⚙️', name:'Iron Soul',           cat:'Strength',     rarity:'Epic',      desc:'Lift a cumulative 100,000 kg total volume',
      how:'Track your lifts consistently. The app totals your volume across all sessions — sets × reps × weight.',
      progress:'100k → 500k → 1M → 10M kg', unlocked: false },
    { id:7,  icon:'📈', name:'The Bulk Begins',     cat:'Physique',     rarity:'Rare',      desc:'Intentionally gain 5kg of bodyweight',
      how:'Log your progress consistently while on a gaining phase. When your current weight exceeds your starting weight by 5kg, this unlocks.',
      progress:'5kg → 10kg → 15kg gained', unlocked: weightGained >= 5 },
    { id:8,  icon:'🔥', name:'Shredded Arc',        cat:'Physique',     rarity:'Rare',      desc:'Lose your first 5kg of fat',
      how:'Keep logging progress while cutting. When you\'re 5kg lighter than when you started, this unlocks automatically.',
      progress:'5kg → 10kg → 15kg lost', unlocked: weightLost >= 5 },
    { id:9,  icon:'🥩', name:'Protein King',        cat:'Nutrition',    rarity:'Rare',      desc:'Log 30+ meals in the Diet section',
      how:'Use the Diet tab to log your food daily. Every meal logged counts — aim for at least one log per day.',
      progress:'30 → 90 → 180 meals logged', unlocked: mealLog.length >= 30 },
    { id:10, icon:'💪', name:'No Excuses',          cat:'Hardcore',     rarity:'Epic',      desc:'Work out on a weekend, holiday, or bad weather day',
      how:'Show up when others don\'t. Complete a workout on a weekend, public holiday, or when life throws a curveball.',
      progress:'Seasonal Expansion unlocks', unlocked: false },
    { id:11, icon:'👻', name:'Ghost Mode',          cat:'Discipline',   rarity:'Common',    desc:'Complete a workout session without skipping any sets',
      how:'Build your workout plan and follow it to the letter — no skipped sets allowed. Tick every set in your plan.',
      progress:'10 → 50 → 100 perfect sessions', unlocked: totalWorkouts >= 1 && weekPlan != null },
    { id:12, icon:'🏆', name:'Beast PR',            cat:'Strength',     rarity:'Rare',      desc:'Set your first personal record on any lift',
      how:'Log a heavier lift than you\'ve done before on any exercise. Your history tracks PRs automatically.',
      progress:'1 → 10 → 50 PRs set', unlocked: false },
    { id:13, icon:'🦁', name:'Gym Veteran',         cat:'Achievement',  rarity:'Rare',      desc:'Log 100 progress entries (workouts)',
      how:'Show up 100 times. That\'s it. Every progress log counts toward this milestone.',
      progress:'100 → 500 → 1000 entries', unlocked: totalWorkouts >= 100 },
    { id:14, icon:'🧘', name:'Spartan Mind',        cat:'Recovery',     rarity:'Rare',      desc:'Meditate or stretch for 14 consecutive days',
      how:'Use the Recovery or Stretch section in Explore for 14 days in a row. Mind training counts as training.',
      progress:'14 → 30 → 90 days', unlocked: false },
    { id:15, icon:'📸', name:'The Transformation',  cat:'Physique',     rarity:'Epic',      desc:'Upload your first transformation comparison photo',
      how:'Go to your Profile and upload a before/after photo. Visual proof of your journey.',
      progress:'Milestone-based unlock', unlocked: false },
    { id:16, icon:'👑', name:'Alpha Discipline',    cat:'Discipline',   rarity:'Legendary', desc:'Maintain a 60-day unbroken check-in streak',
      how:'Log progress every single week for 8 weeks straight. Miss one week and the streak resets. Pure discipline.',
      progress:'60 → 180 → 365 days', unlocked: realStreak >= 8 },
    { id:17, icon:'🐺', name:'Lone Wolf',           cat:'Lifestyle',    rarity:'Rare',      desc:'Log 20 solo training sessions',
      how:'Train and log 20 workouts independently — no group classes, no partner sessions. Self-reliance builds character.',
      progress:'20 → 50 → 100 solo sessions', unlocked: totalWorkouts >= 20 },
    { id:18, icon:'🤝', name:'Brotherhood',         cat:'Social',       rarity:'Epic',      desc:'Refer 3 active friends to MSG',
      how:'Share your referral link with friends and have 3 of them sign up and log at least one workout.',
      progress:'3 → 10 → 25 referrals', unlocked: false },
    { id:19, icon:'🌍', name:'Built Different',     cat:'Hardcore',     rarity:'Epic',      desc:'Complete a workout outside your home gym',
      how:'Work out while travelling, at a hotel gym, outdoor park, or any non-home-gym location. Log it manually.',
      progress:'5 → 20 → 50 away sessions', unlocked: false },
    { id:20, icon:'⚡', name:'MSG Legend',          cat:'Legendary',    rarity:'Mythic',    desc:'365 logged entries + 52-week streak + transformation',
      how:'The final boss. Log every week for a full year, hit 365 total entries, and upload your transformation photo. Ultimate status.',
      progress:'Final Prestige — earned once', unlocked: realStreak >= 52 && totalWorkouts >= 365 },
  ];
  const rarityColor = { Common: C.sub, Rare: C.blue, Epic: C.purple, Legendary: C.orange, Mythic: '#FF6B6B' };
  const unlockedCount = ACHIEVEMENTS.filter(a => a.unlocked).length;

  if (editing) {
    return (
      <ModalShell title="Edit Profile" onClose={() => setEditing(false)}>
        <div style={{ padding: '16px 20px 30px' }}>
          {/* Avatar */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
            <div style={{ position: 'relative' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: fn, fontSize: 26, fontWeight: 800, color: '#000' }}>{draft.initials}</div>
              <div style={{ position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: '50%', background: C.s3, border: `2px solid ${C.bg}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, cursor: 'pointer' }}>✏️</div>
            </div>
          </div>
          {/* Fields */}
          {[
            { l: 'Full Name', k: 'name', p: 'Your name', type: 'text' },
            { l: 'Initials', k: 'initials', p: 'e.g. BS', type: 'text' },
            { l: 'Bio / Role', k: 'bio', p: 'What you study or do', type: 'text' },
            { l: 'Age', k: 'age', p: 'e.g. 20', type: 'number' },
            { l: 'City', k: 'city', p: 'e.g. Jaipur', type: 'text' },
            { l: 'Phone', k: 'phone', p: 'Optional', type: 'tel' },
          ].map(f => (
            <div key={f.k} style={{ marginBottom: 14 }}>
              <Lbl text={f.l} style={{ marginBottom: 7 }} />
              <input type={f.type} value={draft[f.k]} onChange={e => sp(f.k, e.target.value)} placeholder={f.p}
                style={{ width: '100%', boxSizing: 'border-box', background: C.s2, border: `1px solid ${C.border}`, borderRadius: 12, padding: '13px 14px', color: C.text, fontSize: 14, fontFamily: fn, outline: 'none' }} />
            </div>
          ))}
          <div style={{ marginBottom: 14 }}>
            <Lbl text="Gender" style={{ marginBottom: 8 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              {['Male', 'Female', 'Other', 'Prefer not to say'].map(g => (
                <button key={g} onClick={() => sp('gender', g)} style={{
                  flex: 1, padding: '9px 4px', background: draft.gender === g ? C.accent + '18' : C.s2,
                  border: `1px solid ${draft.gender === g ? C.accent : C.border}`, borderRadius: 10,
                  color: draft.gender === g ? C.accent : C.sub, fontFamily: fn, fontWeight: 600, fontSize: 10, cursor: 'pointer',
                }}>{g}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button onClick={() => setEditing(false)} style={{ flex: 1, background: C.s3, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, color: C.sub, fontFamily: fn, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
            <button onClick={() => {
              setProfile({ ...draft });
              try {
                localStorage.setItem('msg_profile_details', JSON.stringify(draft));
                user.name = draft.name;
                user.profile = draft;
                localStorage.setItem('msg_user', JSON.stringify(user));
                if (user.uid && user.uid !== 'demo') {
                  import('../shared/firebase.js').then(f => {
                    f.updateUserDoc(user.uid, { name: draft.name.trim(), profile: draft }).catch(() => {});
                  });
                }
              } catch {}
              setEditing(false);
            }} style={{ flex: 2, background: C.accent, border: 'none', borderRadius: 12, padding: 14, color: '#000', fontFamily: fn, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Save Changes</button>
          </div>
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell title="My Profile" onClose={onClose}>
      {/* Avatar + name */}
      <div style={{ padding: '24px 20px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center', borderBottom: `1px solid ${C.border}`, position: 'relative' }}>
        <button onClick={() => setEditing(true)} style={{ position: 'absolute', top: 20, right: 20, background: C.s3, border: `1px solid ${C.border}`, borderRadius: 8, padding: '5px 12px', color: C.sub, fontFamily: fn, fontWeight: 600, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
          ✏️ Edit
        </button>

        {/* Avatar with camera upload button */}
        <div style={{ position: 'relative', marginBottom: 14 }}>
          <div style={{ width: 86, height: 86, borderRadius: '50%', background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: fn, fontSize: 28, fontWeight: 800, color: '#000', border: `3px solid ${C.accent}55`, overflow: 'hidden' }}>
            {photo ? (
              <img
                src={photo}
                alt="profile"
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
              />
            ) : (
              <span>{profile.initials}</span>
            )}
          </div>
          {/* Camera button overlay */}
          <button
            onClick={() => photoInputRef.current?.click()}
            style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 28, height: 28, borderRadius: '50%',
              background: C.accent, border: `2px solid ${C.bg}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontSize: 13, boxShadow: C.accentShadow,
              transition: 'transform 0.15s',
            }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.9)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          >📷</button>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handlePhotoChange}
          />
        </div>

        <div style={{ fontFamily: fn, fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: '-0.02em' }}>{profile.name}</div>
        <div style={{ color: C.sub, fontSize: 13, marginTop: 4 }}>{profile.bio}</div>
        <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
          {profile.age && <span style={{ color: C.muted, fontSize: 12 }}>{profile.age} yrs</span>}
          {profile.gender && <span style={{ color: C.muted, fontSize: 12 }}>· {profile.gender}</span>}
          {profile.city && <span style={{ color: C.muted, fontSize: 12 }}>· 📍 {profile.city}</span>}
        </div>
        {dietGoal && (
          <div style={{ display: 'flex', gap: 7, marginTop: 12 }}>
            <span style={{ background: C.accent + '18', color: C.accent, fontSize: 10, fontFamily: fb, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '4px 12px', borderRadius: 6 }}>{dietGoal.goal}</span>
            <span style={{ background: C.s3, color: C.sub, fontSize: 10, fontFamily: fb, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '4px 12px', borderRadius: 6 }}>{dietGoal.activity || 'Moderately Active'}</span>
          </div>
        )}
      </div>

      {/* Trainer Link Code */}
      <div style={{ padding: '0 16px', marginTop: 16 }}>
        <div style={{ background: C.s2, border: `1px solid ${C.accent}44`, borderRadius: 12, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, color: C.accent, fontFamily: fb, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Trainer Link Code</div>
            <div style={{ fontSize: 11, color: C.sub }}>Share this code with your trainer</div>
          </div>
          <div style={{ fontFamily: fn, fontSize: 18, fontWeight: 800, color: C.text, letterSpacing: '0.15em', background: C.s3, padding: '6px 12px', borderRadius: 8, border: `1px solid ${C.border}` }}>
            {user?.uid?.substring(0, 6)?.toUpperCase() || '------'}
          </div>
        </div>
      </div>
      {/* Stats grid */}
      <div style={{ padding: '16px 16px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {stats.map((s, i) => (
          <div key={i} style={{ background: C.s2, border: `1px solid ${C.border}`, borderRadius: 12, padding: '13px 14px' }}>
            <Lbl text={s.label} style={{ marginBottom: 5 }} />
            <div style={{ fontFamily: fn, fontSize: 20, fontWeight: 700, color: s.color, letterSpacing: '-0.01em', lineHeight: 1 }}>{s.val}</div>
          </div>
        ))}
      </div>
      {/* Achievements */}
      <div style={{ padding: '18px 16px 30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontFamily: fn, fontSize: 16, fontWeight: 800, color: C.text, letterSpacing: '-0.02em' }}>Achievements</div>
          <span style={{ fontSize: 11, color: C.accent, fontFamily: fb, fontWeight: 700 }}>{unlockedCount} / {ACHIEVEMENTS.length} unlocked</span>
        </div>
        {/* Progress bar */}
        <div style={{ height: 4, background: C.s4, borderRadius: 2, marginBottom: 16 }}>
          <div style={{ height: '100%', width: `${Math.round((unlockedCount / ACHIEVEMENTS.length) * 100)}%`, background: C.accent, borderRadius: 2, transition: 'width 0.5s ease' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 9 }}>
          {ACHIEVEMENTS.map(a => {
            const rc = rarityColor[a.rarity] || C.sub;
            const isOpen = expandedAch === a.id;
            return (
              <div key={a.id} style={{ gridColumn: isOpen ? '1 / -1' : 'auto', transition: 'all 0.25s ease' }}>
                {/* Tile */}
                <div onClick={() => setExpandedAch(isOpen ? null : a.id)} style={{
                  background: a.unlocked ? (isOpen ? rc + '15' : C.s2) : C.s3,
                  border: `1.5px solid ${isOpen ? rc : a.unlocked ? rc + '55' : C.border}`,
                  borderRadius: isOpen ? '14px 14px 0 0' : 14,
                  padding: '12px 8px', textAlign: 'center', cursor: 'pointer',
                  opacity: a.unlocked ? 1 : 0.5,
                  filter: a.unlocked ? 'none' : 'grayscale(1)',
                  boxShadow: isOpen ? `0 0 16px ${rc}44` : a.unlocked ? `0 0 10px ${rc}22` : 'none',
                  transition: 'all 0.25s ease', position: 'relative', userSelect: 'none',
                }}>
                  <div style={{ fontSize: isOpen ? 30 : 24, marginBottom: 5, filter: a.unlocked ? 'none' : 'brightness(0)', transition: 'font-size 0.2s' }}>{a.icon}</div>
                  <div style={{ fontSize: 9, color: a.unlocked ? C.text : C.muted, fontFamily: fb, fontWeight: 700, letterSpacing: '0.03em', lineHeight: 1.3 }}>{a.name}</div>
                  <div style={{ fontSize: 7, color: rc, fontFamily: fb, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 3, opacity: a.unlocked ? 1 : 0.5 }}>{a.rarity}</div>
                  {a.unlocked && !isOpen && (
                    <div style={{ position: 'absolute', top: 5, right: 6, width: 9, height: 9, borderRadius: '50%', background: rc, boxShadow: `0 0 6px ${rc}` }} />
                  )}
                  <div style={{ fontSize: 8, color: C.muted, marginTop: 4 }}>{isOpen ? '▲ tap to close' : '▼ tap for details'}</div>
                </div>
                {/* Expanded detail panel */}
                {isOpen && (
                  <div style={{
                    background: C.s2, border: `1.5px solid ${rc}`, borderTop: 'none',
                    borderRadius: '0 0 14px 14px', padding: '14px 16px 16px',
                    boxShadow: `0 6px 20px ${rc}22`,
                  }}>
                    {/* Header row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ fontSize: 36 }}>{a.icon}</div>
                      <div>
                        <div style={{ fontFamily: fn, fontSize: 15, fontWeight: 800, color: C.text }}>{a.name}</div>
                        <div style={{ display: 'flex', gap: 5, marginTop: 4, flexWrap: 'wrap' }}>
                          <span style={{ background: rc + '1A', color: rc, fontSize: 9, fontFamily: fb, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '2px 8px', borderRadius: 4 }}>{a.rarity}</span>
                          <span style={{ background: C.s3, color: C.sub, fontSize: 9, fontFamily: fb, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '2px 8px', borderRadius: 4 }}>{a.cat}</span>
                          <span style={{ background: a.unlocked ? C.green + '20' : C.s4, color: a.unlocked ? C.green : C.muted, fontSize: 9, fontFamily: fb, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>{a.unlocked ? '✓ UNLOCKED' : '🔒 LOCKED'}</span>
                        </div>
                      </div>
                    </div>
                    {/* What it is */}
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 9, color: rc, fontFamily: fb, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>What it means</div>
                      <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.6 }}>{a.desc}</div>
                    </div>
                    {/* How to earn */}
                    <div style={{ background: rc + '0D', border: `1px solid ${rc}22`, borderRadius: 10, padding: '10px 12px', marginBottom: 10 }}>
                      <div style={{ fontSize: 9, color: rc, fontFamily: fb, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>💡 How to earn it</div>
                      <div style={{ fontSize: 12, color: C.text, lineHeight: 1.65 }}>{a.how}</div>
                    </div>
                    {/* Progression */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ fontSize: 9, color: C.muted, fontFamily: fb, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', flexShrink: 0 }}>Progression</div>
                      <div style={{ fontSize: 10, color: C.sub, fontStyle: 'italic' }}>{a.progress}</div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 16, padding: '12px 14px', background: C.s2, border: `1px solid ${C.border}`, borderRadius: 12 }}>
          <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.55 }}>
            🔒 <span style={{ color: C.sub }}>Locked achievements are earned through real progress — log workouts, hit streaks, and track nutrition to unlock them.</span>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}



