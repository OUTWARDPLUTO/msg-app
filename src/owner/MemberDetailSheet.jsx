import { useState, useEffect } from 'react';
import { C, fn, fb } from '../shared/theme.js';
import { Card, Lbl, ScoreRing, ModalShell, Spinner, Skeleton } from '../shared/primitives.jsx';
import { getFBFirestore, getFBAuth } from '../shared/firebase.js';
import { getStatusFromScore, computeEngagementScore } from '../shared/engagementScore.js';

function getJsDate(field) {
  if (!field) return null;
  if (typeof field.toDate === 'function') return field.toDate();
  if (field.seconds) return new Date(field.seconds * 1000);
  const d = new Date(field);
  return isNaN(d.getTime()) ? null : d;
}

function timeAgo(ts) {
  const date = getJsDate(ts);
  if (!date) return '—';
  const diff = Date.now() - date.getTime();
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

function getJoinedDate(memberDetail) {
  const d = getJsDate(memberDetail?.joinedAt);
  return d ? d.toLocaleDateString('en-IN') : '—';
}

function firstName(name) {
  return name ? name.split(' ')[0] : 'Member';
}

export default function MemberDetailSheet({ member, gymId, onClose }) {
  const [memberDetail, setMemberDetail] = useState(member);
  const [activity, setActivity] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(!member.email || !member.joinedAt);
  const [activeModal, setActiveModal] = useState(null);

  const [coachingNotes, setCoachingNotes] = useState(member?.coachingNotes || '');
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);

  useEffect(() => {
    if (memberDetail?.coachingNotes !== undefined) {
      setCoachingNotes(memberDetail.coachingNotes || '');
    }
  }, [memberDetail?.coachingNotes]);

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      const db = await getFBFirestore();
      await db.doc(`members/${gymId}_${member.uid}`).update({
        coachingNotes: coachingNotes.trim(),
      });
      setMemberDetail(prev => ({ ...prev, coachingNotes: coachingNotes.trim() }));
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2500);
    } catch (err) {
      console.warn("Failed to save coaching notes:", err);
    } finally {
      setSavingNotes(false);
    }
  };

  // Self-healing: if details are missing, fetch them dynamically
  useEffect(() => {
    let active = true;
    if (!member.email || !member.joinedAt) {
      setLoadingDetails(true);
      getFBFirestore().then(db => {
        if (!active) return;
        db.doc(`members/${gymId}_${member.uid}`).get().then(snap => {
          if (!active) return;
          if (snap.exists) {
            setMemberDetail({ id: snap.id, ...snap.data() });
          } else {
            // fallback: check users/{uid}
            db.doc(`users/${member.uid}`).get().then(uSnap => {
              if (!active) return;
              if (uSnap.exists) {
                const uData = uSnap.data();
                setMemberDetail({
                  uid: member.uid,
                  name: uData.name || member.name || 'Member',
                  email: uData.email || '',
                  status: 'active',
                  engagementScore: uData.engagementScore || 0,
                  joinedAt: uData.createdAt || null
                });
              }
            }).catch(() => {});
          }
          setLoadingDetails(false);
        }).catch(() => {
          if (active) setLoadingDetails(false);
        });
      }).catch(() => {
        if (active) setLoadingDetails(false);
      });
    } else {
      setMemberDetail(member);
      setLoadingDetails(false);
    }
    return () => { active = false; };
  }, [member, gymId]);

  const [attendance, setAttendance] = useState([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  useEffect(() => {
    let active = true;
    if (activeModal === 'attendance') {
      setLoadingAttendance(true);
      getFBFirestore().then(db => {
        if (!active) return;
        db.collection(`attendance/${gymId}/logs`)
          .where('uid', '==', member.uid)
          .get()
          .then(snap => {
            if (!active) return;
            let logs = snap.docs.map(d => d.data());
            logs.sort((a,b) => {
              const da = a.checkedInAt?.toDate ? a.checkedInAt.toDate().getTime() : new Date(a.checkedInAt || 0).getTime();
              const db = b.checkedInAt?.toDate ? b.checkedInAt.toDate().getTime() : new Date(b.checkedInAt || 0).getTime();
              return db - da; // desc
            });
            setAttendance(logs);
            setLoadingAttendance(false);
          })
          .catch(() => {
            if (active) setLoadingAttendance(false);
          });
      });
    }
    return () => { active = false; };
  }, [activeModal, member.uid, gymId]);

  // Load activity log
  useEffect(() => {
    let active = true;
    setLoadingActivity(true);
    getFBFirestore().then(db => {
      if (!active) return;
      db.collection(`activityLogs/${gymId}/events`)
        .where('uid', '==', member.uid)
        .get()
        .then(snap => {
          if (!active) return;
          let evs = snap.docs.map(d => d.data());
          // Sort in memory to bypass composite index requirement
          evs.sort((a,b) => {
            const da = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : new Date(a.timestamp || 0).getTime();
            const db = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : new Date(b.timestamp || 0).getTime();
            return db - da; // desc
          });
          setActivity(evs.slice(0, 30));
          setLoadingActivity(false);
        })
        .catch(e => {
          console.warn("Failed to load activity logs:", e);
          if (active) setLoadingActivity(false);
        });
    }).catch(() => {
      if (active) setLoadingActivity(false);
    });
    return () => { active = false; };
  }, [member.uid, gymId]);

  const TYPE_ICONS = { workout: '💪', diet: '🥗', progress: '📊', checkin: '✅' };

  // Map real data to mockup-like formatting where possible
  const statusText = (memberDetail?.status || 'active') === 'inactive' ? 'Inactive' : 'Active';
  const statusColor = statusText === 'Active' ? C.green : C.sub;

  const handleUpdateMember = async (updates) => {
    try {
      await getFBFirestore().doc(`members/${gymId}_${member.uid}`).update(updates);
      setMemberDetail(prev => ({ ...prev, ...updates }));
      setActiveModal(null);
    } catch (e) {
      console.warn("Failed to update member", e);
    }
  };

  const [currentUser, setCurrentUser] = useState(null);
  
  useEffect(() => {
    getFBAuth().then(auth => setCurrentUser(auth.currentUser)).catch(() => {});
  }, []);

  if (activeModal === 'edit') {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: C.bg, display: 'flex', flexDirection: 'column', padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ fontSize: 20, fontFamily: fb, fontWeight: 700, color: C.text }}>Edit Member</div>
          <button onClick={() => setActiveModal(null)} style={{ background: 'none', border: 'none', color: C.text, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, fontFamily: fn, color: C.sub, marginBottom: 8 }}>Name</div>
            <input defaultValue={memberDetail?.name} id="edit-name" style={{ width: '100%', background: C.s1, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 16px', color: C.text, fontFamily: fn, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontFamily: fn, color: C.sub, marginBottom: 8 }}>Status</div>
            <select defaultValue={memberDetail?.status || 'active'} id="edit-status" style={{ width: '100%', background: C.s1, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 16px', color: C.text, fontFamily: fn, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <button onClick={() => handleUpdateMember({
            name: document.getElementById('edit-name').value,
            status: document.getElementById('edit-status').value
          })} style={{ background: C.accent, color: C.text, border: 'none', borderRadius: 12, padding: '14px', fontFamily: fb, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 12 }}>
            Save Changes
          </button>
        </div>
      </div>
    );
  }

  if (activeModal === 'attendance') {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: C.bg, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: `1px solid ${C.border}` }}>
          <button onClick={() => setActiveModal(null)} style={{ background: 'none', border: 'none', color: C.text, padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontFamily: fn, fontSize: 16, fontWeight: 700 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            Back
          </button>
          <div style={{ flex: 1, textAlign: 'center', fontFamily: fb, fontSize: 16, fontWeight: 700, color: C.text }}>
            Attendance History
          </div>
          <div style={{ width: 60 }} />
        </div>
        <div className="msg-scroll" style={{ flex: 1, padding: 20, overflowY: 'auto' }}>
          {loadingAttendance ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner color={C.accent} /></div>
          ) : attendance.length === 0 ? (
            <div style={{ textAlign: 'center', color: C.sub, fontFamily: fn, fontSize: 15, padding: 40 }}>No attendance records found.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {attendance.map((log, i) => {
                const date = getJsDate(log.checkedInAt);
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16, borderBottom: `1px solid ${C.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(229,57,53,0.1)', color: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                      </div>
                      <div>
                        <div style={{ fontSize: 15, fontFamily: fb, color: C.text }}>Checked In</div>
                        <div style={{ fontSize: 13, fontFamily: fn, color: C.sub }}>{date ? date.toLocaleDateString('en-IN') : log.date}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 14, fontFamily: fn, color: C.text, fontWeight: 500 }}>
                      {date ? date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (activeModal === 'membership') {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: C.bg, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: `1px solid ${C.border}` }}>
          <button onClick={() => setActiveModal(null)} style={{ background: 'none', border: 'none', color: C.text, padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontFamily: fn, fontSize: 16, fontWeight: 700 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            Back
          </button>
          <div style={{ flex: 1, textAlign: 'center', fontFamily: fb, fontSize: 16, fontWeight: 700, color: C.text }}>
            Membership Details
          </div>
          <div style={{ width: 60 }} />
        </div>
        <div style={{ flex: 1, padding: 20, overflowY: 'auto' }}>
          <div style={{ background: C.s1, borderRadius: 16, border: `1px solid ${C.border}`, padding: '0 16px', marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', borderBottom: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 14, fontFamily: fn, color: C.sub }}>Plan Name</div>
              <div style={{ fontSize: 14, fontFamily: fb, fontWeight: 600, color: C.text }}>Premium Plan</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', borderBottom: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 14, fontFamily: fn, color: C.sub }}>Status</div>
              <div style={{ fontSize: 14, fontFamily: fb, fontWeight: 600, color: statusColor }}>{statusText}</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', borderBottom: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 14, fontFamily: fn, color: C.sub }}>Start Date</div>
              <div style={{ fontSize: 14, fontFamily: fb, fontWeight: 600, color: C.text }}>{getJoinedDate(memberDetail)}</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', borderBottom: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 14, fontFamily: fn, color: C.sub }}>Next Billing</div>
              <div style={{ fontSize: 14, fontFamily: fb, fontWeight: 600, color: C.text }}>12 Aug, 2024</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0' }}>
              <div style={{ fontSize: 14, fontFamily: fn, color: C.sub }}>Amount</div>
              <div style={{ fontSize: 14, fontFamily: fb, fontWeight: 600, color: C.text }}>₹2,499/mo</div>
            </div>
          </div>
          
          <button style={{ width: '100%', background: 'rgba(229,57,53,0.1)', color: C.accent, border: 'none', borderRadius: 12, padding: '16px', fontFamily: fb, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
            Cancel Membership
          </button>
        </div>
      </div>
    );
  }

  if (activeModal === 'workout') {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: C.bg, display: 'flex', flexDirection: 'column', padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ fontSize: 20, fontFamily: fb, fontWeight: 700, color: C.text }}>Workout Plan</div>
          <button onClick={() => setActiveModal(null)} style={{ background: 'none', border: 'none', color: C.text, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 13, fontFamily: fn, color: C.sub }}>
            Update the customized workout plan for {firstName(memberDetail?.name)}. This will sync to their app.
          </div>
          <textarea defaultValue={memberDetail?.workoutPlanText || ''} id="edit-workout" placeholder="E.g. Monday: Chest & Triceps\nTuesday: Back & Biceps..." style={{ flex: 1, background: C.s1, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 16px', color: C.text, fontFamily: fn, fontSize: 14, outline: 'none', boxSizing: 'border-box', resize: 'none' }} />
          <button onClick={() => handleUpdateMember({
            workoutPlanText: document.getElementById('edit-workout').value
          })} style={{ background: C.accent, color: C.text, border: 'none', borderRadius: 12, padding: '14px', fontFamily: fb, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
            Save Plan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)',
      display: 'flex', flexDirection: 'column', overflowY: 'auto',
      background: C.bg,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', flexShrink: 0 }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.text, padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontFamily: fn, fontSize: 16, fontWeight: 700 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          Member Profile
        </button>
      </div>

      <div className="msg-scroll" style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        {loadingDetails ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Skeleton circle width={96} height={96} />
            <Skeleton width={160} height={28} style={{ marginTop: 16, marginBottom: 16 }} />
            <div style={{ display: 'flex', gap: 12, width: '100%', marginBottom: 32 }}>
              <Skeleton height={44} style={{ flex: 1 }} borderRadius={12} />
              <Skeleton height={44} style={{ flex: 1 }} borderRadius={12} />
            </div>
            <Skeleton width="100%" height={80} borderRadius={16} style={{ marginBottom: 16 }} />
            <Skeleton width="100%" height={80} borderRadius={16} />
          </div>
        ) : (
          <>
            {/* Avatar & Name */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
              <div style={{
                width: 96, height: 96, borderRadius: '50%',
                background: C.s2, border: `4px solid ${C.bg}`, boxShadow: `0 0 0 1px ${C.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: fn, fontSize: 32, fontWeight: 700, color: C.text, marginBottom: 16
              }}>
                {(memberDetail?.name || '?').charAt(0).toUpperCase()}
              </div>
              <div style={{ fontSize: 24, fontFamily: fb, fontWeight: 700, color: C.text, marginBottom: 20 }}>
                {memberDetail?.name || 'Unnamed Member'}
              </div>
            </div>

            {/* Engagement Score & 4-Pillar Breakdown */}
            {(() => {
              const eng = memberDetail?.engagementBreakdown ? {
                score: memberDetail.engagementScore ?? 0,
                status: memberDetail.engagementStatus || getStatusFromScore(memberDetail.engagementScore ?? 0).label,
                color: getStatusFromScore(memberDetail.engagementScore ?? 0).color,
                badgeBg: getStatusFromScore(memberDetail.engagementScore ?? 0).badgeBg,
                breakdown: memberDetail.engagementBreakdown,
                tips: [
                  'Visit the gym or log an activity today to maintain your 15 recency points.',
                  'Stay on track with your weekly workout target.',
                  'Log body weight or measurements once weekly for progress points.',
                ],
              } : computeEngagementScore(activity, {
                weeklyWorkoutTarget: memberDetail?.weeklyWorkoutTarget || 3,
                lastActiveAt: memberDetail?.lastActiveAt,
              });

              const { consistency, workouts, habits, recency } = eng.breakdown || {};

              return (
                <div style={{ marginBottom: 28, background: C.s1, borderRadius: 20, border: `1px solid ${C.border}`, padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: 18, fontFamily: fb, fontWeight: 700, color: C.text }}>Engagement Score</div>
                      <div style={{ fontSize: 12, fontFamily: fn, color: C.sub }}>28-day rolling holistic activity</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{
                        background: eng.badgeBg, color: eng.color,
                        fontSize: 11, fontFamily: fb, fontWeight: 700,
                        padding: '4px 10px', borderRadius: 20,
                      }}>
                        {eng.status}
                      </span>
                      <ScoreRing score={eng.score} size={48} strokeWidth={5} />
                    </div>
                  </div>

                  {/* 4 Pillars */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {/* Consistency */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontFamily: fn, marginBottom: 5 }}>
                        <span style={{ color: C.text, fontWeight: 600 }}>1. Consistency</span>
                        <span style={{ color: C.accent, fontWeight: 700 }}>{consistency?.points ?? 0}/30 pts</span>
                      </div>
                      <div style={{ width: '100%', height: 6, background: C.s2, borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(100, ((consistency?.points || 0) / 30) * 100)}%`, height: '100%', background: C.accent, borderRadius: 3, transition: 'width 0.4s' }} />
                      </div>
                      <div style={{ fontSize: 11, fontFamily: fn, color: C.sub, marginTop: 4 }}>
                        {consistency?.activeDays ?? 0} active days in past 28 days (target: 20)
                      </div>
                    </div>

                    {/* Workout Adherence */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontFamily: fn, marginBottom: 5 }}>
                        <span style={{ color: C.text, fontWeight: 600 }}>2. Workout Adherence</span>
                        <span style={{ color: C.accent, fontWeight: 700 }}>{workouts?.points ?? 0}/30 pts</span>
                      </div>
                      <div style={{ width: '100%', height: 6, background: C.s2, borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(100, ((workouts?.points || 0) / 30) * 100)}%`, height: '100%', background: C.accent, borderRadius: 3, transition: 'width 0.4s' }} />
                      </div>
                      <div style={{ fontSize: 11, fontFamily: fn, color: C.sub, marginTop: 4 }}>
                        {workouts?.completedDays ?? 0} of {workouts?.targetDays ?? 12} workout days completed ({workouts?.weeklyTarget ?? 3}/week goal)
                      </div>
                    </div>

                    {/* Healthy Habits */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontFamily: fn, marginBottom: 5 }}>
                        <span style={{ color: C.text, fontWeight: 600 }}>3. Healthy Habits</span>
                        <span style={{ color: C.accent, fontWeight: 700 }}>{habits?.points ?? 0}/25 pts</span>
                      </div>
                      <div style={{ width: '100%', height: 6, background: C.s2, borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(100, ((habits?.points || 0) / 25) * 100)}%`, height: '100%', background: C.accent, borderRadius: 3, transition: 'width 0.4s' }} />
                      </div>
                      <div style={{ fontSize: 11, fontFamily: fn, color: C.sub, marginTop: 4 }}>
                        Diet: {habits?.diet?.days ?? 0}d ({habits?.diet?.points ?? 0}p) • Check-ins: {habits?.checkIn?.days ?? 0}d ({habits?.checkIn?.points ?? 0}p) • Progress: {habits?.progress?.weeks ?? 0}w ({habits?.progress?.points ?? 0}p)
                      </div>
                    </div>

                    {/* Recency */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontFamily: fn, marginBottom: 5 }}>
                        <span style={{ color: C.text, fontWeight: 600 }}>4. Recency</span>
                        <span style={{ color: C.accent, fontWeight: 700 }}>{recency?.points ?? 0}/15 pts</span>
                      </div>
                      <div style={{ width: '100%', height: 6, background: C.s2, borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(100, ((recency?.points || 0) / 15) * 100)}%`, height: '100%', background: C.accent, borderRadius: 3, transition: 'width 0.4s' }} />
                      </div>
                      <div style={{ fontSize: 11, fontFamily: fn, color: C.sub, marginTop: 4 }}>
                        {recency?.daysAgo === null ? 'No activity on record' : recency?.daysAgo === 0 ? 'Active today' : recency?.daysAgo === 1 ? 'Active yesterday' : `Last active ${recency?.daysAgo} days ago`}
                      </div>
                    </div>
                  </div>

                  {/* What improves your score guidance */}
                  {eng.tips && eng.tips.length > 0 && (
                    <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
                      <div style={{ fontSize: 12, fontFamily: fb, fontWeight: 700, color: C.text, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>💡</span> What improves this score?
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {eng.tips.map((tip, idx) => (
                          <div key={idx} style={{ fontSize: 12, fontFamily: fn, color: C.sub, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                            <span style={{ color: C.accent }}>•</span>
                            <span>{tip}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Assigned Workout Plan */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 18, fontFamily: fb, fontWeight: 700, color: C.text }}>Assigned Workout Plan</div>
                <button onClick={() => setActiveModal('workout')} style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 8, padding: '6px 12px', color: C.accent, fontFamily: fb, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  Edit Plan
                </button>
              </div>
              <div style={{ background: C.s1, borderRadius: 16, border: `1px solid ${C.border}`, padding: 16 }}>
                {memberDetail?.workoutPlanText ? (
                  <pre style={{ margin: 0, fontFamily: fn, fontSize: 13, color: C.text, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                    {memberDetail.workoutPlanText}
                  </pre>
                ) : (
                  <div style={{ fontSize: 13, fontFamily: fn, color: C.sub }}>
                    No custom workout plan assigned yet. Tap "Edit Plan" to create one.
                  </div>
                )}
              </div>
            </div>

            {/* Coaching Notes */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 18, fontFamily: fb, fontWeight: 700, color: C.text }}>Coaching Notes</div>
                {notesSaved && (
                  <span style={{ fontSize: 12, color: C.green, fontFamily: fb, fontWeight: 600 }}>
                    ✓ Saved
                  </span>
                )}
              </div>
              <div style={{ background: C.s1, borderRadius: 16, border: `1px solid ${C.border}`, padding: 16 }}>
                <textarea
                  value={coachingNotes}
                  onChange={e => setCoachingNotes(e.target.value)}
                  placeholder="Record private coaching observations, goals, injury notes, or nutritional adjustments for this member..."
                  style={{
                    width: '100%', minHeight: 90, background: 'transparent',
                    border: 'none', color: C.text, fontFamily: fn, fontSize: 14,
                    outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.5,
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                  <button
                    onClick={handleSaveNotes}
                    disabled={savingNotes}
                    style={{
                      background: C.accent, color: '#000', border: 'none',
                      borderRadius: 8, padding: '8px 16px', fontFamily: fb,
                      fontSize: 13, fontWeight: 700, cursor: savingNotes ? 'not-allowed' : 'pointer',
                      opacity: savingNotes ? 0.7 : 1,
                    }}
                  >
                    {savingNotes ? 'Saving...' : 'Save Notes'}
                  </button>
                </div>
              </div>
            </div>

            {/* Subscription Details */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 18, fontFamily: fb, fontWeight: 700, color: C.text, marginBottom: 16 }}>Subscription Details</div>
              <div style={{ background: C.s1, borderRadius: 16, border: `1px solid ${C.border}`, padding: '0 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 14, fontFamily: fn, color: C.sub }}>Plan Type</div>
                  <div style={{ fontSize: 14, fontFamily: fb, fontWeight: 600, color: C.text }}>Premium Plan</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 14, fontFamily: fn, color: C.sub }}>Status</div>
                  <div style={{ fontSize: 14, fontFamily: fb, fontWeight: 600, color: statusColor }}>{statusText}</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 14, fontFamily: fn, color: C.sub }}>Joined Gym On</div>
                  <div style={{ fontSize: 14, fontFamily: fb, fontWeight: 600, color: C.text }}>{getJoinedDate(memberDetail)}</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0' }}>
                  <div style={{ fontSize: 14, fontFamily: fn, color: C.sub }}>Next Billing</div>
                  <div style={{ fontSize: 14, fontFamily: fb, fontWeight: 600, color: C.text }}>12 Aug, 2024</div>
                </div>
              </div>
            </div>

            {/* Recent Activity / Actions */}
            <div>
              <div style={{ fontSize: 18, fontFamily: fb, fontWeight: 700, color: C.text, marginBottom: 16 }}>Recent Activity</div>

              {loadingActivity ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                      <Skeleton circle width={40} height={40} />
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <Skeleton width="70%" height={16} />
                        <Skeleton width="40%" height={12} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {activity.length === 0 ? (
                    <div style={{ color: C.sub, fontSize: 13, fontFamily: fn, padding: '12px 0' }}>
                      No activity events logged in the last 28 days.
                    </div>
                  ) : (
                    activity.slice(0, 6).map((ev, idx) => {
                      const icon = TYPE_ICONS[ev.type] || '⚡';
                      const label = ev.type === 'workout' ? 'Completed Workout' :
                                    ev.type === 'diet' ? 'Logged Nutrition' :
                                    ev.type === 'checkin' ? 'Gym Check-in' :
                                    ev.type === 'progress' ? 'Progress Update' : 'Activity Event';
                      return (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0', borderBottom: `1px solid ${C.border}` }}>
                          <div style={{ width: 40, height: 40, borderRadius: 12, background: C.s1, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                            {icon}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontFamily: fb, fontWeight: 600, color: C.text }}>{label}</div>
                            <div style={{ fontSize: 12, fontFamily: fn, color: C.sub }}>{timeAgo(ev.timestamp)}</div>
                          </div>
                          <div style={{ fontSize: 12, fontFamily: fb, fontWeight: 700, color: C.green }}>
                            +{ev.points || 0} pts
                          </div>
                        </div>
                      );
                    })
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
                    <button onClick={() => setActiveModal('attendance')} style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}>
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(229,57,53,0.1)', border: `1px solid rgba(229,57,53,0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.accent }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontFamily: fb, fontWeight: 600, color: C.text }}>View All Attendance Details</div>
                        <div style={{ fontSize: 13, fontFamily: fn, color: C.sub }}>See full check-in history</div>
                      </div>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.sub} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </button>

                    <button onClick={() => setActiveModal('membership')} style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}>
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: C.s1, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.text }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="M3 10h18"></path></svg>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontFamily: fb, fontWeight: 600, color: C.text }}>View Membership Details</div>
                        <div style={{ fontSize: 13, fontFamily: fn, color: C.sub }}>Plan info, status, & joined date</div>
                      </div>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.sub} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
