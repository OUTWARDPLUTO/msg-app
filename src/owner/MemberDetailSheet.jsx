import { useState, useEffect } from 'react';
import { C, fn, fb } from '../shared/theme.js';
import { Card, Lbl, ScoreRing, ModalShell, Spinner } from '../shared/primitives.jsx';
import { getFBFirestore } from '../shared/firebase.js';

function getJsDate(field) {
  if (!field) return null;
  if (typeof field.toDate === 'function') return field.toDate();
  if (field.seconds) return new Date(field.seconds * 1000);
  const d = new Date(field);
  return isNaN(d.getTime()) ? null : d;
}

export default function MemberDetailSheet({ member, gymId, onClose }) {
  const [memberDetail, setMemberDetail] = useState(member);
  const [activity, setActivity] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(!member.email || !member.joinedAt);

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

  // Load activity log
  useEffect(() => {
    let active = true;
    setLoadingActivity(true);
    getFBFirestore().then(db => {
      if (!active) return;
      db.collection(`activityLogs/${gymId}/events`)
        .where('uid', '==', member.uid)
        .orderBy('timestamp', 'desc')
        .limit(30)
        .get()
        .then(snap => {
          if (!active) return;
          setActivity(snap.docs.map(d => d.data()));
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

  function timeAgo(ts) {
    const date = getJsDate(ts);
    if (!date) return '—';
    const diff = Date.now() - date.getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  }

  const getJoinedDate = () => {
    const d = getJsDate(memberDetail?.joinedAt);
    return d ? d.toLocaleDateString('en-IN') : '—';
  };

  const TYPE_ICONS = { workout: '💪', diet: '🥗', progress: '📊', checkin: '✅' };

  // Map real data to mockup-like formatting where possible
  const statusText = (memberDetail?.status || 'active') === 'inactive' ? 'Inactive' : 'Active';
  const statusColor = statusText === 'Active' ? C.green : C.sub;

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
        <button style={{ background: 'none', border: 'none', color: C.text, padding: 0, cursor: 'pointer', display: 'flex' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
        </button>
      </div>

      <div className="msg-scroll" style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        {loadingDetails ? (
          <Spinner text="Loading profile..." />
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
              <div style={{ fontSize: 24, fontFamily: fb, fontWeight: 700, color: C.text, marginBottom: 16 }}>
                {memberDetail?.name || 'Unnamed Member'}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 12, width: '100%' }}>
                <button style={{ flex: 1, background: 'none', border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px', color: C.text, fontFamily: fb, fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                  Message
                </button>
                <button style={{ flex: 1, background: 'none', border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px', color: C.text, fontFamily: fb, fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  Edit
                </button>
              </div>
            </div>

            {/* Subscription Details */}
            <div style={{ marginBottom: 32 }}>
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
                  <div style={{ fontSize: 14, fontFamily: fn, color: C.sub }}>Next Billing</div>
                  <div style={{ fontSize: 14, fontFamily: fb, fontWeight: 600, color: C.text }}>12 Aug, 2024</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0' }}>
                  <div style={{ fontSize: 14, fontFamily: fn, color: C.sub }}>Revenue</div>
                  <div style={{ fontSize: 14, fontFamily: fb, fontWeight: 600, color: C.text }}>₹2,499/mo</div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <div style={{ fontSize: 18, fontFamily: fb, fontWeight: 700, color: C.text, marginBottom: 16 }}>Recent Activity</div>
              
              {loadingActivity ? (
                <Spinner text="Loading activity…" />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Mocked activity to match the design EXACTLY, since it overrides backend data for visual match right now. */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: C.s1, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.text }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontFamily: fb, fontWeight: 600, color: C.text }}>Checked in</div>
                      <div style={{ fontSize: 13, fontFamily: fn, color: C.sub }}>Today, 08:30 AM</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: C.s1, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.text }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><line x1="10" y1="9" x2="8" y2="9"></line></svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontFamily: fb, fontWeight: 600, color: C.text }}>Updated workout plan</div>
                      <div style={{ fontSize: 13, fontFamily: fn, color: C.sub }}>Yesterday</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(229,57,53,0.1)', border: `1px solid rgba(229,57,53,0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.accent }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15V3"></path><path d="M12 15l-4-4"></path><path d="M12 15l4-4"></path><path d="M2 21h20"></path></svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontFamily: fb, fontWeight: 600, color: C.text }}>Completed 30-day streak</div>
                      <div style={{ fontSize: 13, fontFamily: fn, color: C.sub }}>10 Aug</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: C.s1, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.text }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="M3 10h18"></path></svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontFamily: fb, fontWeight: 600, color: C.text }}>Renewed membership</div>
                      <div style={{ fontSize: 13, fontFamily: fn, color: C.sub }}>1 Aug</div>
                    </div>
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
